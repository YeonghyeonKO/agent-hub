from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.models import Component, Download, Star, User
from app.schemas.schemas import ComponentListItem, UserResponse

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: Annotated[User, Depends(get_current_user)]):
    return UserResponse.model_validate(user)


@router.get("/me/components", response_model=list[ComponentListItem])
async def get_my_components(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Component)
        .where(Component.author_id == user.employee_id)
        .order_by(Component.updated_at.desc())
    )
    components = result.scalars().all()

    items = []
    for c in components:
        star_count = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dl_count = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        items.append(
            ComponentListItem(
                id=c.id,
                title=c.title,
                type=c.type,
                description=c.description,
                category=c.category,
                version=c.version,
                min_langflow_ver=c.min_langflow_ver,
                max_langflow_ver=c.max_langflow_ver,
                icon=c.icon,
                is_standard=c.is_standard,
                status=c.status,
                author=UserResponse.model_validate(user),
                stars_count=star_count,
                downloads_count=dl_count,
                created_at=c.created_at,
            )
        )
    return items
