import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationItem, NotificationListResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_my_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    limit: int = 30,
    unread_only: bool = False,
):
    query = (
        select(Notification)
        .where(Notification.user_id == user.employee_id)
        .options(
            selectinload(Notification.component),
            selectinload(Notification.improvement),
        )
        .order_by(Notification.created_at.desc())
    )
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    query = query.limit(limit)

    rows = (await db.execute(query)).scalars().all()

    unread_count = (
        await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user.employee_id, Notification.is_read.is_(False))
        )
    ).scalar() or 0

    # Surface related titles so the frontend can render localized messages by `kind`.
    items = [
        NotificationItem(
            id=n.id,
            kind=n.kind,
            message=n.message,
            link=n.link,
            component_id=n.component_id,
            improvement_id=n.improvement_id,
            component_title=n.component.title if n.component else None,
            improvement_title=n.improvement.title if n.improvement else None,
            applied_version=n.improvement.applied_version if n.improvement else None,
            is_read=n.is_read,
            created_at=n.created_at,
        )
        for n in rows
    ]

    return NotificationListResponse(items=items, unread_count=unread_count)


@router.get("/unread-count")
async def unread_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    count = (
        await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user.employee_id, Notification.is_read.is_(False))
        )
    ).scalar() or 0
    return {"unread_count": count}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.employee_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"read": True}


@router.post("/read-all")
async def mark_all_read(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.employee_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.commit()
    return {"read_all": True}
