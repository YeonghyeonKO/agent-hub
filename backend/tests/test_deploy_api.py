"""배포 라우터(app/routers/deploy.py) 통합 테스트.

실제 Postgres 가 필요하다 (TEST_DATABASE_URL). 미설정 시 전체 skip.
외부 Agent Builder 통신(services/langflow)은 monkeypatch 로 대체한다.

핵심 검증:
  - API Key 가 응답에 평문으로 새지 않는다(has_api_key 플래그만).
  - 엔드포인트 최대 개수 제한.
  - 배포 실패 시 백엔드 detail 이 그대로 노출된다(프론트 메시지 명확화의 백엔드 쪽 보장).
"""
import uuid

import pytest

import app.services.langflow as langflow_mod
from app.models.models import Component, User

from .conftest import requires_db

pytestmark = requires_db

DEV_EMPLOYEE_ID = "2074795"  # DEV_MODE dev admin (auth._get_or_create_dev_user)


async def _ok_connection(*args, **kwargs):
    return {"ok": True, "version": "1.0.0"}


async def _seed_component(db, *, file_content="print('hi')", type_="py") -> uuid.UUID:
    """dev 사용자와 배포 대상 컴포넌트를 만든다."""
    db.add(User(employee_id=DEV_EMPLOYEE_ID, name="Dev", role="admin"))
    cid = uuid.uuid4()
    db.add(
        Component(
            id=cid,
            title="My Component",
            type=type_,
            version="1.0.0",
            author_id=DEV_EMPLOYEE_ID,
            status="approved",
            file_content=file_content,
        )
    )
    await db.commit()
    return cid


async def _add_endpoint(client, name="ep1", api_key="secret-key"):
    resp = await client.post(
        "/api/v1/deploy/endpoints",
        json={"name": name, "base_url": "https://agentbuilder.corp", "api_key": api_key},
    )
    return resp


async def test_create_endpoint_hides_api_key(client, monkeypatch):
    monkeypatch.setattr(langflow_mod, "test_connection", _ok_connection)
    resp = await _add_endpoint(client, api_key="super-secret")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["has_api_key"] is True
    assert body["last_status"] == "ok"
    assert "api_key" not in body
    assert "super-secret" not in resp.text


async def test_endpoint_limit_enforced(client, monkeypatch):
    monkeypatch.setattr(langflow_mod, "test_connection", _ok_connection)
    for i in range(5):
        assert (await _add_endpoint(client, name=f"ep{i}")).status_code == 200
    sixth = await _add_endpoint(client, name="ep6")
    assert sixth.status_code == 400
    assert "최대" in sixth.json()["detail"]


async def test_deploy_surfaces_backend_detail(client, db, monkeypatch):
    """배포 실패 시 502 + 백엔드의 구체적 detail 이 그대로 전달돼야 한다."""
    monkeypatch.setattr(langflow_mod, "test_connection", _ok_connection)

    async def _fail(*args, **kwargs):
        raise langflow_mod.LangflowError("인증 실패: API Key를 확인하세요.", status=401)

    monkeypatch.setattr(langflow_mod, "deploy_component", _fail)

    cid = await _seed_component(db, type_="py")
    ep = (await _add_endpoint(client)).json()

    resp = await client.post(
        f"/api/v1/deploy/components/{cid}",
        json={"endpoint_id": ep["id"]},
    )
    assert resp.status_code == 502
    assert resp.json()["detail"] == "인증 실패: API Key를 확인하세요."


async def test_deploy_rejects_empty_file(client, db, monkeypatch):
    monkeypatch.setattr(langflow_mod, "test_connection", _ok_connection)
    cid = await _seed_component(db, file_content=None)
    ep = (await _add_endpoint(client)).json()

    resp = await client.post(
        f"/api/v1/deploy/components/{cid}",
        json={"endpoint_id": ep["id"]},
    )
    assert resp.status_code == 400
    assert "파일 내용" in resp.json()["detail"]


async def test_deploy_success_returns_flow_url(client, db, monkeypatch):
    monkeypatch.setattr(langflow_mod, "test_connection", _ok_connection)

    async def _deploy_ok(*args, **kwargs):
        fid = "flow-123"
        return {"flow_id": fid, "flow_url": f"https://agentbuilder.corp/flow/{fid}", "name": "My Component"}

    monkeypatch.setattr(langflow_mod, "deploy_component", _deploy_ok)

    cid = await _seed_component(db)
    ep = (await _add_endpoint(client)).json()

    resp = await client.post(
        f"/api/v1/deploy/components/{cid}",
        json={"endpoint_id": ep["id"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ok"] is True
    assert body["flow_url"].endswith("/flow/flow-123")
