import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models.models import User, VocComment, VocPost, VocUpvote
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/api/v1/voc", tags=["voc"])


class VocPostCreate(BaseModel):
    title: str = Field(max_length=300)
    content: str
    category: str = Field(pattern=r"^(suggestion|bug|question|other)$")


class VocCommentCreate(BaseModel):
    content: str


class VocStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(open|in-progress|resolved|closed)$")


class VocCommentResponse(BaseModel):
    id: uuid.UUID
    author: UserResponse
    content: str
    created_at: str

    model_config = {"from_attributes": True}


class VocPostResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    category: str
    author: UserResponse
    status: str
    upvote_count: int = 0
    comment_count: int = 0
    is_upvoted: bool = False
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class VocPostDetail(VocPostResponse):
    comments: list[VocCommentResponse] = []


@router.get("", response_model=list[VocPostResponse])
async def list_voc_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = None,
    status: str | None = None,
    sort: str = "newest",
    limit: int = 20,
    offset: int = 0,
):
    query = select(VocPost).options(selectinload(VocPost.author))

    if category:
        query = query.where(VocPost.category == category)
    if status:
        query = query.where(VocPost.status == status)

    if sort == "popular":
        upvote_count = (
            select(func.count())
            .where(VocUpvote.post_id == VocPost.id)
            .correlate(VocPost)
            .scalar_subquery()
        )
        query = query.order_by(upvote_count.desc())
    else:
        query = query.order_by(VocPost.created_at.desc())

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    posts = result.scalars().all()

    items = []
    for p in posts:
        upvote_count = (await db.execute(select(func.count()).where(VocUpvote.post_id == p.id))).scalar() or 0
        comment_count = (await db.execute(select(func.count()).where(VocComment.post_id == p.id))).scalar() or 0
        items.append(
            VocPostResponse(
                id=p.id,
                title=p.title,
                content=p.content,
                category=p.category,
                author=UserResponse.model_validate(p.author),
                status=p.status,
                upvote_count=upvote_count,
                comment_count=comment_count,
                created_at=p.created_at.isoformat(),
                updated_at=p.updated_at.isoformat(),
            )
        )
    return items


@router.get("/{post_id}", response_model=VocPostDetail)
async def get_voc_post(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(VocPost)
        .where(VocPost.id == post_id)
        .options(
            selectinload(VocPost.author),
            selectinload(VocPost.comments).selectinload(VocComment.author),
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    upvote_count = (await db.execute(select(func.count()).where(VocUpvote.post_id == post.id))).scalar() or 0

    comments = [
        VocCommentResponse(
            id=c.id,
            author=UserResponse.model_validate(c.author),
            content=c.content,
            created_at=c.created_at.isoformat(),
        )
        for c in post.comments
    ]

    return VocPostDetail(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=UserResponse.model_validate(post.author),
        status=post.status,
        upvote_count=upvote_count,
        comment_count=len(comments),
        comments=comments,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.post("", response_model=VocPostResponse, status_code=201)
async def create_voc_post(
    body: VocPostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    post = VocPost(
        title=body.title,
        content=body.content,
        category=body.category,
        author_id=user.employee_id,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post, ["author"])
    return VocPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=UserResponse.model_validate(post.author),
        status=post.status,
        upvote_count=0,
        comment_count=0,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.post("/{post_id}/comments", response_model=VocCommentResponse, status_code=201)
async def add_comment(
    post_id: uuid.UUID,
    body: VocCommentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    post = await db.get(VocPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = VocComment(
        post_id=post_id,
        author_id=user.employee_id,
        content=body.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment, ["author"])
    return VocCommentResponse(
        id=comment.id,
        author=UserResponse.model_validate(comment.author),
        content=comment.content,
        created_at=comment.created_at.isoformat(),
    )


@router.post("/{post_id}/upvote")
async def toggle_upvote(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(VocUpvote).where(VocUpvote.post_id == post_id, VocUpvote.user_id == user.employee_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"upvoted": False}
    else:
        upvote = VocUpvote(user_id=user.employee_id, post_id=post_id)
        db.add(upvote)
        await db.commit()
        return {"upvoted": True}


@router.patch("/{post_id}/status", response_model=VocPostResponse)
async def update_voc_status(
    post_id: uuid.UUID,
    body: VocStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_admin)],
):
    post = await db.get(VocPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = body.status
    await db.commit()
    await db.refresh(post, ["author"])
    upvote_count = (await db.execute(select(func.count()).where(VocUpvote.post_id == post.id))).scalar() or 0
    comment_count = (await db.execute(select(func.count()).where(VocComment.post_id == post.id))).scalar() or 0
    return VocPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=UserResponse.model_validate(post.author),
        status=post.status,
        upvote_count=upvote_count,
        comment_count=comment_count,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )
