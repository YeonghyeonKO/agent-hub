"""Langflow REST API 클라이언트.

개인 Langflow 인스턴스에 Component(.py) / Flow(.json)를 즉시 배포하기 위한
얇은 래퍼. Langflow 버전에 따라 'projects'(>=1.1) 와 'folders'(구버전) 용어가
다르므로 둘 다 시도하는 폴백 전략을 사용한다.

모든 함수는 실패 시 LangflowError를 raise 하며, 라우터에서 HTTP 502/400 으로 변환한다.
사내 망 자체 서명 인증서를 고려해 verify 옵션을 끌 수 있게 했다.
"""
from __future__ import annotations

import os
import ssl
import uuid
from typing import Any

import httpx

from app.config import settings

_TIMEOUT = httpx.Timeout(15.0, connect=8.0)
_CORPORATE_CA = "/etc/ssl/certs/corporate-ca.crt"


def _ssl_verify() -> ssl.SSLContext | bool:
    """배포 대상 HTTPS 검증 정책.

    사내 CA가 마운트돼 있으면 그것으로 검증하고(가장 안전),
    없으면 설정값 LANGFLOW_VERIFY_SSL을 따른다(기본 False: 자체 서명 허용).
    auth.py 의 JWKS 호출과 동일한 전략을 공유한다.
    """
    if os.path.exists(_CORPORATE_CA):
        return ssl.create_default_context(cafile=_CORPORATE_CA)
    return settings.LANGFLOW_VERIFY_SSL


class LangflowError(Exception):
    """Langflow 통신/응답 오류."""

    def __init__(self, message: str, *, status: int | None = None):
        super().__init__(message)
        self.message = message
        self.status = status


def normalize_base_url(url: str) -> str:
    """끝 슬래시와 trailing /api 를 정리해 일관된 base_url 로 만든다."""
    u = (url or "").strip().rstrip("/")
    # 사용자가 .../api 또는 .../api/v1 까지 붙여 넣은 경우 정리
    for suffix in ("/api/v1", "/api"):
        if u.endswith(suffix):
            u = u[: -len(suffix)]
    return u


def _headers(api_key: str | None) -> dict[str, str]:
    h = {"Content-Type": "application/json"}
    if api_key:
        h["x-api-key"] = api_key
    return h


def _client(base_url: str, api_key: str | None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=base_url,
        headers=_headers(api_key),
        timeout=_TIMEOUT,
        verify=_ssl_verify(),
        follow_redirects=True,
    )


async def test_connection(base_url: str, api_key: str | None) -> dict[str, Any]:
    """연결/인증 상태를 확인한다. 성공 시 {ok: True, version: ...}."""
    base_url = normalize_base_url(base_url)
    async with _client(base_url, api_key) as client:
        # 1) health 체크 (인증 불필요한 경우가 많음)
        try:
            r = await client.get("/health")
            if r.status_code >= 500:
                raise LangflowError(f"Agent Builder 서버 오류 (HTTP {r.status_code})", status=r.status_code)
        except httpx.RequestError as e:
            raise LangflowError("연결할 수 없습니다. 주소와 네트워크 상태를 확인하세요.") from e

        # 2) 버전 조회 (표시용)
        version = None
        try:
            rv = await client.get("/api/v1/version")
            if rv.status_code == 200:
                version = rv.json().get("version")
            elif rv.status_code in (401, 403):
                raise LangflowError("인증 실패: API Key를 확인하세요.", status=rv.status_code)
        except httpx.RequestError:
            pass  # version 엔드포인트가 없어도 health 가 통과했으면 계속

        # 3) API Key 검증 — 인증이 켜진 서버에서 키가 없거나 틀리면 여기서 잡는다.
        #    version 이 공개돼 있어 2)에서 못 거르는 경우 대비. 인증이 꺼진 서버라면 200 이라 통과.
        try:
            rp = await client.get("/api/v1/projects/")
            if rp.status_code == 404:
                rp = await client.get("/api/v1/folders/")
            if rp.status_code in (401, 403):
                raise LangflowError("인증 실패: API Key를 확인하세요.", status=rp.status_code)
        except httpx.RequestError:
            pass

    return {"ok": True, "version": version}


async def list_projects(base_url: str, api_key: str | None) -> list[dict[str, Any]]:
    """프로젝트(폴더) 목록. [{id, name}] 형태로 정규화."""
    base_url = normalize_base_url(base_url)
    async with _client(base_url, api_key) as client:
        for path in ("/api/v1/projects/", "/api/v1/folders/"):
            try:
                r = await client.get(path)
            except httpx.RequestError as e:
                raise LangflowError("연결할 수 없습니다. 주소와 네트워크 상태를 확인하세요.") from e
            if r.status_code in (401, 403):
                raise LangflowError("인증 실패: API Key를 확인하세요.", status=r.status_code)
            if r.status_code == 404:
                continue  # 다른 명칭으로 재시도
            if r.status_code == 200:
                data = r.json()
                items = data if isinstance(data, list) else data.get("items") or data.get("projects") or []
                return [{"id": str(it.get("id")), "name": it.get("name") or "(unnamed)"} for it in items]
        raise LangflowError("프로젝트 목록을 가져오지 못했습니다.")


async def list_flows(base_url: str, api_key: str | None, project_id: str) -> list[dict[str, Any]]:
    """특정 프로젝트의 Flow 목록. [{id, name}]."""
    base_url = normalize_base_url(base_url)
    async with _client(base_url, api_key) as client:
        # Langflow는 project_id / folder_id 둘 중 하나를 쓰며, 미지원 시 전체 조회 후 필터.
        for params in ({"project_id": project_id}, {"folder_id": project_id}, {}):
            try:
                r = await client.get("/api/v1/flows/", params={**params, "header_flows": "true"})
            except httpx.RequestError as e:
                raise LangflowError("연결할 수 없습니다. 주소와 네트워크 상태를 확인하세요.") from e
            if r.status_code in (401, 403):
                raise LangflowError("인증 실패: API Key를 확인하세요.", status=r.status_code)
            if r.status_code != 200:
                continue
            data = r.json()
            items = data if isinstance(data, list) else data.get("items") or []
            # 파라미터 필터가 무시됐을 수 있으니 클라이언트단에서도 한 번 더 거른다.
            result = []
            for it in items:
                fid = it.get("folder_id") or it.get("project_id")
                if not params or fid is None or str(fid) == str(project_id):
                    result.append({"id": str(it.get("id")), "name": it.get("name") or "(unnamed)"})
            return result
        raise LangflowError("Flow 목록을 가져오지 못했습니다.")


async def _resolve_default_project(client: httpx.AsyncClient, base_url: str, api_key: str | None) -> str:
    """project_id 미지정 시 사용할 기본 프로젝트 id. 없으면 새로 만든다."""
    projects = await list_projects(base_url, api_key)
    if projects:
        # 'Starter Project' 류를 우선, 없으면 첫 번째
        for p in projects:
            if "starter" in (p["name"] or "").lower() or "default" in (p["name"] or "").lower():
                return p["id"]
        return projects[0]["id"]
    # 프로젝트가 하나도 없으면 생성
    for path in ("/api/v1/projects/", "/api/v1/folders/"):
        r = await client.post(path, json={"name": "AgentHub"})
        if r.status_code in (200, 201):
            return str(r.json().get("id"))
    raise LangflowError("기본 프로젝트를 만들 수 없습니다.")


async def _build_component_node(client: httpx.AsyncClient, code: str) -> dict[str, Any]:
    """Component .py 코드를 Langflow Flow의 노드 객체로 변환한다.

    /api/v1/custom_component 가 코드를 빌드해 frontend_node 템플릿을 돌려주면,
    이를 genericNode 형태로 감싸 graph(data.nodes)에 넣을 수 있게 만든다.
    """
    r = await client.post("/api/v1/custom_component", json={"code": code, "frontend_node": {}})
    if r.status_code in (401, 403):
        raise LangflowError("인증 실패: API Key를 확인하세요.", status=r.status_code)
    if r.status_code != 200:
        raise LangflowError(
            f"Component 코드를 빌드하지 못했습니다 (HTTP {r.status_code}). "
            "Agent Builder 버전 호환성을 확인하세요.",
            status=r.status_code,
        )
    body = r.json()
    template = body.get("data") or body  # {data, type}
    node_type = body.get("type") or template.get("type") or "CustomComponent"
    node_id = f"{node_type}-{uuid.uuid4().hex[:5]}"
    return {
        "id": node_id,
        "type": "genericNode",
        "position": {"x": 200, "y": 200},
        "data": {"id": node_id, "type": node_type, "node": template},
    }


async def deploy_flow(
    base_url: str,
    api_key: str | None,
    *,
    flow_json: str,
    name: str,
    project_id: str | None,
) -> dict[str, Any]:
    """Flow(.json)를 새 Flow로 생성한다. 반환: {flow_id, flow_url, name}."""
    import json

    base_url = normalize_base_url(base_url)
    try:
        parsed = json.loads(flow_json)
    except (ValueError, TypeError) as e:
        raise LangflowError(f"Flow JSON 파싱 실패: {e}") from e
    if not isinstance(parsed, dict):
        raise LangflowError("Flow JSON 형식이 올바르지 않습니다(object가 아님).")

    # Langflow export는 {data: {nodes, edges}} 또는 {nodes, edges} 두 형태가 있다.
    data = parsed.get("data") if parsed.get("data") else parsed
    payload = {
        "name": name,
        "description": parsed.get("description") or "",
        "data": data,
    }
    async with _client(base_url, api_key) as client:
        pid = project_id or await _resolve_default_project(client, base_url, api_key)
        payload["folder_id"] = pid
        payload["project_id"] = pid
        return await _create_flow(client, payload, base_url)


async def deploy_component(
    base_url: str,
    api_key: str | None,
    *,
    code: str,
    name: str,
    project_id: str | None,
    flow_id: str | None,
) -> dict[str, Any]:
    """Component(.py)를 빌드해 Flow의 노드로 추가한다.

    - flow_id 지정 시: 해당 Flow를 가져와 노드를 append 후 PATCH.
    - flow_id 미지정 시: (기본) 프로젝트에 새 Flow를 만들어 노드만 담는다.
    반환: {flow_id, flow_url, name}.
    """
    base_url = normalize_base_url(base_url)
    async with _client(base_url, api_key) as client:
        node = await _build_component_node(client, code)

        if flow_id:
            r = await client.get(f"/api/v1/flows/{flow_id}")
            if r.status_code != 200:
                raise LangflowError(f"대상 Flow를 찾을 수 없습니다 (HTTP {r.status_code}).", status=r.status_code)
            flow = r.json()
            data = flow.get("data") or {"nodes": [], "edges": []}
            data.setdefault("nodes", []).append(node)
            data.setdefault("edges", [])
            pr = await client.patch(f"/api/v1/flows/{flow_id}", json={"data": data})
            if pr.status_code not in (200, 201):
                raise LangflowError(f"Flow 업데이트 실패 (HTTP {pr.status_code}).", status=pr.status_code)
            return {
                "flow_id": str(flow_id),
                "flow_url": f"{base_url}/flow/{flow_id}",
                "name": flow.get("name") or name,
            }

        # 새 Flow 생성
        pid = project_id or await _resolve_default_project(client, base_url, api_key)
        payload = {
            "name": name,
            "description": f"AgentHub 배포: {name}",
            "data": {"nodes": [node], "edges": []},
            "folder_id": pid,
            "project_id": pid,
        }
        return await _create_flow(client, payload, base_url)


async def _create_flow(client: httpx.AsyncClient, payload: dict[str, Any], base_url: str) -> dict[str, Any]:
    r = await client.post("/api/v1/flows/", json=payload)
    if r.status_code in (401, 403):
        raise LangflowError("인증 실패: API Key를 확인하세요.", status=r.status_code)
    if r.status_code not in (200, 201):
        detail = ""
        try:
            detail = r.json().get("detail") or ""
        except Exception:
            detail = r.text[:200]
        raise LangflowError(f"Flow 생성 실패 (HTTP {r.status_code}). {detail}", status=r.status_code)
    created = r.json()
    fid = str(created.get("id"))
    return {"flow_id": fid, "flow_url": f"{base_url}/flow/{fid}", "name": created.get("name") or payload["name"]}
