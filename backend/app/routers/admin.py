import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_admin
from app.database import get_db
from app.models.models import Component, Issue, Review, Season, User
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
        .where(Component.status == "pending")
        .options(selectinload(Component.author))
        .order_by(Component.created_at.desc())
    )
    components = result.scalars().all()
    return [
        ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=0, downloads_count=0, created_at=c.created_at,
        )
        for c in components
    ]


@router.get("/approved", response_model=list[ComponentListItem])
async def get_approved(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.status == "approved")
        .options(selectinload(Component.author))
        .order_by(Component.updated_at.desc())
    )
    components = result.scalars().all()
    return [
        ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=0, downloads_count=0, created_at=c.created_at,
        )
        for c in components
    ]


@router.get("/rejected", response_model=list[ComponentListItem])
async def get_rejected(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    result = await db.execute(
        select(Component)
        .where(Component.status == "rejected")
        .options(selectinload(Component.author))
        .order_by(Component.updated_at.desc())
    )
    components = result.scalars().all()
    return [
        ComponentListItem(
            id=c.id, title=c.title, type=c.type, description=c.description,
            category=c.category, version=c.version,
            min_langflow_ver=c.min_langflow_ver, max_langflow_ver=c.max_langflow_ver,
            icon=c.icon, is_standard=c.is_standard, status=c.status,
            author=UserResponse.model_validate(c.author),
            stars_count=0, downloads_count=0, created_at=c.created_at,
        )
        for c in components
    ]


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
