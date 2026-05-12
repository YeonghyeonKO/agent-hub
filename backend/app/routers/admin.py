import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_admin
from app.database import get_db
from app.models.models import Component, Download, Issue, Review, Season, Star, User
from app.schemas.schemas import (
    ComponentListItem,
    IssueResponse,
    ReviewCreate,
    ReviewResponse,
    SeasonSettings,
    SeasonUpdate,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/pending", response_model=list[ComponentListItem])
async def get_pending(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.status == "pending", Component.deleted_at.is_(None))
        .options(selectinload(Component.author))
        .order_by(Component.created_at.desc())
    )
    components = result.scalars().all()
    items = []
    for c in components:
        sc = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dc = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append(ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            tags=c.tags or [], icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=sc, downloads_count=dc, created_at=c.created_at,
        ))
    return items


@router.get("/approved", response_model=list[ComponentListItem])
async def get_approved(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.status == "approved", Component.deleted_at.is_(None))
        .options(selectinload(Component.author))
        .order_by(Component.updated_at.desc())
    )
    components = result.scalars().all()
    items = []
    for c in components:
        sc = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dc = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append(ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            tags=c.tags or [], icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=sc, downloads_count=dc, created_at=c.created_at,
        ))
    return items


@router.get("/rejected", response_model=list[ComponentListItem])
async def get_rejected(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.status == "rejected", Component.deleted_at.is_(None))
        .options(selectinload(Component.author))
        .order_by(Component.updated_at.desc())
    )
    components = result.scalars().all()
    items = []
    for c in components:
        sc = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dc = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append(ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            tags=c.tags or [], icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=sc, downloads_count=dc, created_at=c.created_at,
        ))
    return items


@router.get("/deleted", response_model=list[ComponentListItem])
async def get_deleted(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.deleted_at.isnot(None))
        .options(selectinload(Component.author))
        .order_by(Component.deleted_at.desc())
    )
    components = result.scalars().all()
    items = []
    for c in components:
        sc = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dc = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append(ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            tags=c.tags or [], icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=sc, downloads_count=dc, created_at=c.created_at,
            deleted_at=c.deleted_at,
        ))
    return items


@router.delete("/components/{component_id}")
async def soft_delete_component(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    from datetime import datetime, timezone
    result = await db.execute(select(Component).where(Component.id == component_id))
    component = result.scalar_one_or_none()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    component.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"deleted": True, "id": str(component_id)}


@router.get("/issues", response_model=list[IssueResponse])
async def get_issues(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Issue).options(selectinload(Issue.reporter)).order_by(Issue.created_at.desc())
    )
    issues = result.scalars().all()
    return [
        IssueResponse(
            id=i.id, component_id=i.component_id,
            reporter=UserResponse.model_validate(i.reporter),
            kind=i.kind, severity=i.severity, summary=i.summary,
            status=i.status, created_at=i.created_at,
        )
        for i in issues
    ]


@router.post("/review/{component_id}", response_model=ReviewResponse)
async def submit_review(
    component_id: uuid.UUID,
    body: ReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_admin)],
):
    component = await db.get(Component, component_id)
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    review = Review(
        component_id=component_id,
        reviewer_id=user.employee_id,
        scores=body.scores,
        comment=body.comment,
        decision=body.decision,
    )
    db.add(review)

    # Update component status based on decision
    if body.decision == "approve":
        component.status = "approved"
    elif body.decision == "reject":
        component.status = "rejected"

    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        component_id=review.component_id,
        reviewer=UserResponse.model_validate(user),
        scores=review.scores,
        comment=review.comment,
        decision=review.decision,
        created_at=review.created_at,
    )


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


class RoleUpdate(BaseModel):
    role: str


@router.patch("/users/{employee_id}/role", response_model=UserResponse)
async def update_user_role(
    employee_id: str,
    body: RoleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    if body.role not in ("user", "admin", "reviewer"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be: user, admin, reviewer")
    result = await db.execute(select(User).where(User.employee_id == employee_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/statistics")
async def get_statistics(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    """Return all components with their stats for the statistics table."""
    result = await db.execute(
        select(Component)
        .options(selectinload(Component.author))
        .order_by(Component.created_at.desc())
    )
    components = result.scalars().all()
    items = []
    for c in components:
        sc = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dc = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append({
            "id": str(c.id),
            "title": c.title,
            "type": c.type,
            "tags": c.tags or [],
            "status": c.status,
            "version": c.version,
            "author_id": c.author.employee_id if c.author else "",
            "author_name": c.author.name if c.author else "",
            "stars_count": sc,
            "downloads_count": dc,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "deleted_at": c.deleted_at.isoformat() if c.deleted_at else None,
        })
    return items


@router.get("/settings", response_model=SeasonSettings | None)
async def get_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(select(Season).where(Season.is_active == True))
    season = result.scalar_one_or_none()
    if not season:
        return None
    return SeasonSettings.model_validate(season)


@router.put("/settings", response_model=SeasonSettings)
async def update_settings(
    body: SeasonUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(select(Season).where(Season.is_active == True))
    season = result.scalar_one_or_none()

    if not season:
        season = Season(
            name=body.name or "New Season",
            submit_start=body.submit_start,
            submit_end=body.submit_end,
            review_end=body.review_end,
            award_day=body.award_day,
            criteria_weights=body.criteria_weights,
            score_formula=body.score_formula,
            is_active=True,
        )
        db.add(season)
    else:
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(season, field, value)

    await db.commit()
    await db.refresh(season)
    return SeasonSettings.model_validate(season)
