"""개인 Langflow 엔드포인트 관리 + Component/Flow 즉시 배포.

- 엔드포인트는 사용자별 최대 5개.
- API Key는 응답에 절대 평문으로 노출하지 않는다(has_api_key 플래그만).
- 실제 Langflow 통신은 services/langflow 로 위임한다.
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.models import Component, LangflowEndpoint, User
from app.schemas.schemas import (
    ConnectionTestRequest,
    ConnectionTestResponse,
    DeployRequest,
    DeployResponse,
    LangflowEndpointCreate,
    LangflowEndpointResponse,
    LangflowFlow,
    LangflowProject,
)
from app.services import langflow

router = APIRouter(prefix="/api/v1/deploy", tags=["deploy"])

MAX_ENDPOINTS = 5


def _to_response(ep: LangflowEndpoint) -> LangflowEndpointResponse:
    return LangflowEndpointResponse(
        id=ep.id,
        name=ep.name,
        base_url=ep.base_url,
        has_api_key=bool(ep.api_key),
        last_status=ep.last_status,
        last_checked_at=ep.last_checked_at,
        created_at=ep.created_at,
    )


async def _get_owned_endpoint(db: AsyncSession, user: User, endpoint_id: uuid.UUID) -> LangflowEndpoint:
    ep = (
        await db.execute(
            select(LangflowEndpoint).where(
                LangflowEndpoint.id == endpoint_id,
                LangflowEndpoint.user_id == user.employee_id,
            )
        )
    ).scalar_one_or_none()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return ep


# ─── 엔드포인트 CRUD ──────────────────────────────────────────────────────
@router.get("/endpoints", response_model=list[LangflowEndpointResponse])
async def list_endpoints(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    rows = (
        await db.execute(
            select(LangflowEndpoint)
            .where(LangflowEndpoint.user_id == user.employee_id)
            .order_by(LangflowEndpoint.created_at.asc())
        )
    ).scalars().all()
    return [_to_response(ep) for ep in rows]


@router.post("/endpoints", response_model=LangflowEndpointResponse)
async def create_endpoint(
    payload: LangflowEndpointCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    count = (
        await db.execute(
            select(func.count())
            .select_from(LangflowEndpoint)
            .where(LangflowEndpoint.user_id == user.employee_id)
        )
    ).scalar() or 0
    if count >= MAX_ENDPOINTS:
        raise HTTPException(status_code=400, detail=f"엔드포인트는 최대 {MAX_ENDPOINTS}개까지 추가할 수 있습니다.")

    base_url = langflow.normalize_base_url(payload.base_url)
    ep = LangflowEndpoint(
        user_id=user.employee_id,
        name=payload.name.strip(),
        base_url=base_url,
        api_key=(payload.api_key or None),
    )
    # 저장 시점에 한 번 연결 상태를 확인해 둔다(실패해도 저장은 허용).
    try:
        await langflow.test_connection(base_url, payload.api_key)
        ep.last_status = "ok"
    except langflow.LangflowError:
        ep.last_status = "error"
    ep.last_checked_at = datetime.now(timezone.utc)

    db.add(ep)
    await db.commit()
    await db.refresh(ep)
    return _to_response(ep)


@router.delete("/endpoints/{endpoint_id}", status_code=204)
async def delete_endpoint(
    endpoint_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    ep = await _get_owned_endpoint(db, user, endpoint_id)
    await db.delete(ep)
    await db.commit()


# ─── 연결 테스트 ──────────────────────────────────────────────────────────
@router.post("/test", response_model=ConnectionTestResponse)
async def test_unsaved(
    payload: ConnectionTestRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    """저장 전 임시 URL/Key 연결 테스트."""
    try:
        result = await langflow.test_connection(payload.base_url, payload.api_key)
        return ConnectionTestResponse(ok=True, status="ok", version=result.get("version"))
    except langflow.LangflowError as e:
        return ConnectionTestResponse(ok=False, status="error", message=e.message)


@router.post("/endpoints/{endpoint_id}/test", response_model=ConnectionTestResponse)
async def test_saved(
    endpoint_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    """저장된 엔드포인트 재확인 — last_status 도 갱신한다."""
    ep = await _get_owned_endpoint(db, user, endpoint_id)
    try:
        result = await langflow.test_connection(ep.base_url, ep.api_key)
        ep.last_status = "ok"
        ep.last_checked_at = datetime.now(timezone.utc)
        await db.commit()
        return ConnectionTestResponse(ok=True, status="ok", version=result.get("version"))
    except langflow.LangflowError as e:
        ep.last_status = "error"
        ep.last_checked_at = datetime.now(timezone.utc)
        await db.commit()
        return ConnectionTestResponse(ok=False, status="error", message=e.message)


# ─── 프로젝트 / Flow 조회 ─────────────────────────────────────────────────
@router.get("/endpoints/{endpoint_id}/projects", response_model=list[LangflowProject])
async def get_projects(
    endpoint_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    ep = await _get_owned_endpoint(db, user, endpoint_id)
    try:
        return await langflow.list_projects(ep.base_url, ep.api_key)
    except langflow.LangflowError as e:
        raise HTTPException(status_code=502, detail=e.message)


@router.get("/endpoints/{endpoint_id}/projects/{project_id}/flows", response_model=list[LangflowFlow])
async def get_flows(
    endpoint_id: uuid.UUID,
    project_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    ep = await _get_owned_endpoint(db, user, endpoint_id)
    try:
        return await langflow.list_flows(ep.base_url, ep.api_key, project_id)
    except langflow.LangflowError as e:
        raise HTTPException(status_code=502, detail=e.message)


# ─── 배포 ────────────────────────────────────────────────────────────────
@router.post("/components/{component_id}", response_model=DeployResponse)
async def deploy_asset(
    component_id: uuid.UUID,
    payload: DeployRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    """Component(.py) 또는 Flow(.json) 자산을 개인 Langflow에 배포한다."""
    ep = await _get_owned_endpoint(db, user, payload.endpoint_id)

    comp = (
        await db.execute(
            select(Component).where(
                Component.id == component_id,
                Component.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")
    if not comp.file_content:
        raise HTTPException(status_code=400, detail="배포할 파일 내용이 없습니다.")

    try:
        if comp.type == "json":
            result = await langflow.deploy_flow(
                ep.base_url,
                ep.api_key,
                flow_json=comp.file_content,
                name=comp.title,
                project_id=payload.project_id,
            )
        else:  # py component
            result = await langflow.deploy_component(
                ep.base_url,
                ep.api_key,
                code=comp.file_content,
                name=comp.title,
                project_id=payload.project_id,
                flow_id=payload.flow_id,
            )
    except langflow.LangflowError as e:
        # 배포 실패는 엔드포인트 상태에 반영
        ep.last_status = "error"
        ep.last_checked_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=502, detail=e.message)

    ep.last_status = "ok"
    ep.last_checked_at = datetime.now(timezone.utc)
    await db.commit()
    return DeployResponse(
        ok=True,
        flow_id=result["flow_id"],
        flow_url=result["flow_url"],
        name=result["name"],
        message="배포가 완료되었습니다.",
    )
