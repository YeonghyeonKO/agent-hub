import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models.models import Notice, User
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/api/v1/notices", tags=["notices"])


class NoticeCreate(BaseModel):
    title: str = Field(max_length=300)
    content: str
    is_pinned: bool = False


class NoticeUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class NoticeResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    author: UserResponse
    is_pinned: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[NoticeResponse])
async def list_notices(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
    offset: int = 0,
):
    result = await db.execute(
        select(Notice)
        .options(selectinload(Notice.author))
        .order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    notices = result.scalars().all()
    return [
        NoticeResponse(
            id=n.id,
            title=n.title,
            content=n.content,
            author=UserResponse.model_validate(n.author),
            is_pinned=n.is_pinned,
            created_at=n.created_at.isoformat(),
            updated_at=n.updated_at.isoformat(),
        )
        for n in notices
    ]


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(
    notice_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Notice).where(Notice.id == notice_id).options(selectinload(Notice.author))
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    return NoticeResponse(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        author=UserResponse.model_validate(notice.author),
        is_pinned=notice.is_pinned,
        created_at=notice.created_at.isoformat(),
        updated_at=notice.updated_at.isoformat(),
    )


@router.post("", response_model=NoticeResponse, status_code=201)
async def create_notice(
    body: NoticeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_admin)],
):
    notice = Notice(
        title=body.title,
        content=body.content,
        is_pinned=body.is_pinned,
        author_id=user.employee_id,
    )
    db.add(notice)
    await db.commit()
    await db.refresh(notice, ["author"])
    return NoticeResponse(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        author=UserResponse.model_validate(notice.author),
        is_pinned=notice.is_pinned,
        created_at=notice.created_at.isoformat(),
        updated_at=notice.updated_at.isoformat(),
    )


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: uuid.UUID,
    body: NoticeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    notice = await db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(notice, field, value)
    await db.commit()
    await db.refresh(notice, ["author"])
    return NoticeResponse(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        author=UserResponse.model_validate(notice.author),
        is_pinned=notice.is_pinned,
        created_at=notice.created_at.isoformat(),
        updated_at=notice.updated_at.isoformat(),
    )


@router.delete("/{notice_id}", status_code=204)
async def delete_notice(
    notice_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    notice = await db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    await db.delete(notice)
    await db.commit()
