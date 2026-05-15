import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

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
        .order_by(Notification.created_at.desc())
    )
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    query = query.limit(limit)

    items = (await db.execute(query)).scalars().all()

    unread_count = (
        await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user.employee_id, Notification.is_read.is_(False))
        )
    ).scalar() or 0

    return NotificationListResponse(
        items=[NotificationItem.model_validate(n) for n in items],
        unread_count=unread_count,
    )


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
