"""Agent Builder 통신 서비스(app/services/langflow.py) 단위 테스트.

DB가 필요 없고 httpx 요청은 respx(respx_mock 픽스처)로 모킹한다. `pytest` 만으로 실행된다.
배포 실패 시 사용자에게 보여줄 에러 메시지를 이 계층이 만들므로,
메시지 문구가 회귀하지 않도록 함께 검증한다.
"""
import httpx
import pytest

from app.services import langflow

BASE = "https://agentbuilder.corp"


# ── normalize_base_url ───────────────────────────────────────────────────
@pytest.mark.parametrize(
    "raw,expected",
    [
        # 기존 동작(끝 슬래시 / api suffix 정리)
        ("https://agentbuilder.corp/", "https://agentbuilder.corp"),
        ("https://agentbuilder.corp/api/v1", "https://agentbuilder.corp"),
        ("https://agentbuilder.corp/api", "https://agentbuilder.corp"),
        ("  http://localhost:7860/  ", "http://localhost:7860"),
        ("", ""),
        ("   ", ""),
        # scheme 누락 → 기본 scheme(https) 부착
        ("agentbuilder.corp", "https://agentbuilder.corp"),
        ("agentbuilder.corp:7860/", "https://agentbuilder.corp:7860"),
        # scheme 슬래시 오타 교정
        ("http:/localhost:7860", "http://localhost:7860"),
        ("https:agentbuilder.corp", "https://agentbuilder.corp"),
        # 브라우저 주소창 URL 통째로 붙여넣기 → 경로/쿼리/프래그먼트 전부 제거, host 만 남김
        ("https://agentbuilder.corp/flow/abc-123", "https://agentbuilder.corp"),
        ("https://agentbuilder.corp/login", "https://agentbuilder.corp"),
        ("agentbuilder.corp/flow/abc-123/?x=1#frag", "https://agentbuilder.corp"),
        # 임의 경로(/test 등)도 모두 제거한다
        ("https://agentbuilder.corp/test", "https://agentbuilder.corp"),
        ("http://localhost:7860/some/random/path", "http://localhost:7860"),
        # host:port 를 scheme 으로 오인하지 않는다
        ("localhost:7860", "https://localhost:7860"),
        # http/https 아닌 scheme 오타는 기본 scheme 으로 치환
        ("ws://agentbuilder.corp", "https://agentbuilder.corp"),
        # host 소문자화(경로/포트 보존)
        ("HTTP://Agent.CORP:7860/Login", "http://agent.corp:7860"),
        # 앞뒤 따옴표/꺾쇠 제거
        ('"https://agentbuilder.corp/"', "https://agentbuilder.corp"),
    ],
)
def test_normalize_base_url(raw, expected):
    assert langflow.normalize_base_url(raw) == expected


# ── _ssl_verify (corporate CA 없을 때 설정값을 따른다) ─────────────────────
def test_ssl_verify_follows_setting(monkeypatch):
    monkeypatch.setattr(langflow, "_CORPORATE_CA", "/nonexistent/ca.crt")
    monkeypatch.setattr(langflow.settings, "LANGFLOW_VERIFY_SSL", False)
    assert langflow._ssl_verify() is False
    monkeypatch.setattr(langflow.settings, "LANGFLOW_VERIFY_SSL", True)
    assert langflow._ssl_verify() is True


# ── test_connection ────────────────────────────────────────────────────────
async def test_connection_ok_returns_version(respx_mock):
    respx_mock.get(f"{BASE}/health").mock(return_value=httpx.Response(200))
    respx_mock.get(f"{BASE}/api/v1/version").mock(
        return_value=httpx.Response(200, json={"version": "1.2.3"})
    )
    respx_mock.get(f"{BASE}/api/v1/projects/").mock(return_value=httpx.Response(200, json=[]))
    result = await langflow.test_connection(BASE, None)
    assert result == {"ok": True, "version": "1.2.3"}


async def test_connection_auth_failure_at_version(respx_mock):
    respx_mock.get(f"{BASE}/health").mock(return_value=httpx.Response(200))
    respx_mock.get(f"{BASE}/api/v1/version").mock(return_value=httpx.Response(401))
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.test_connection(BASE, None)
    assert "API Key" in ei.value.message
    assert ei.value.status == 401


async def test_connection_validates_api_key_via_projects(respx_mock):
    """version 이 공개여도 projects 가 401 이면 키 문제로 잡아야 한다."""
    respx_mock.get(f"{BASE}/health").mock(return_value=httpx.Response(200))
    respx_mock.get(f"{BASE}/api/v1/version").mock(
        return_value=httpx.Response(200, json={"version": "1.2.3"})
    )
    respx_mock.get(f"{BASE}/api/v1/projects/").mock(return_value=httpx.Response(403))
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.test_connection(BASE, None)
    assert "API Key" in ei.value.message
    assert ei.value.status == 403


async def test_connection_server_error(respx_mock):
    respx_mock.get(f"{BASE}/health").mock(return_value=httpx.Response(503))
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.test_connection(BASE, None)
    assert "Agent Builder" in ei.value.message


async def test_connection_unreachable(respx_mock):
    respx_mock.get(f"{BASE}/health").mock(side_effect=httpx.ConnectError("boom"))
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.test_connection(BASE, None)
    assert "연결할 수 없습니다" in ei.value.message


# ── list_projects ──────────────────────────────────────────────────────────
async def test_list_projects_normalizes_items(respx_mock):
    respx_mock.get(f"{BASE}/api/v1/projects/").mock(
        return_value=httpx.Response(200, json=[{"id": 7, "name": "My Project"}])
    )
    projects = await langflow.list_projects(BASE, None)
    assert projects == [{"id": "7", "name": "My Project"}]


async def test_list_projects_falls_back_to_folders(respx_mock):
    """구버전 Langflow 는 projects 대신 folders 를 쓴다 — 404 시 폴백해야 한다."""
    respx_mock.get(f"{BASE}/api/v1/projects/").mock(return_value=httpx.Response(404))
    respx_mock.get(f"{BASE}/api/v1/folders/").mock(
        return_value=httpx.Response(200, json=[{"id": 1, "name": "Folder A"}])
    )
    projects = await langflow.list_projects(BASE, None)
    assert projects == [{"id": "1", "name": "Folder A"}]


async def test_list_projects_auth_failure(respx_mock):
    respx_mock.get(f"{BASE}/api/v1/projects/").mock(return_value=httpx.Response(403))
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.list_projects(BASE, None)
    assert "API Key" in ei.value.message


# ── deploy_flow (입력 검증, 네트워크 이전 단계) ─────────────────────────────
async def test_deploy_flow_rejects_invalid_json():
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.deploy_flow(BASE, None, flow_json="{not json", name="X", project_id=None)
    assert "파싱" in ei.value.message


async def test_deploy_flow_rejects_non_object():
    with pytest.raises(langflow.LangflowError) as ei:
        await langflow.deploy_flow(BASE, None, flow_json="[1, 2, 3]", name="X", project_id=None)
    assert "형식" in ei.value.message
