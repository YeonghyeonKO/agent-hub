import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.models import Component, Download, Star, User
from app.schemas.schemas import (
    ComponentListItem,
    ComponentListResponse,
    ComponentResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/components", tags=["components"])


@router.get("", response_model=ComponentListResponse)
async def list_components(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = None,
    type: str | None = None,
    sort: str = "popular",
    search: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    query = select(Component).where(Component.status == "approved")

    if category:
        query = query.where(Component.category == category)
    if type:
        query = query.where(Component.type == type)
    if search:
        query = query.where(
            Component.title.ilike(f"%{search}%") | Component.description.ilike(f"%{search}%")
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Sort
    if sort == "new":
        query = query.order_by(Component.created_at.desc())
    else:
        # popular: order by stars count
        star_count = (
            select(func.count())
            .where(Star.component_id == Component.id)
            .correlate(Component)
            .scalar_subquery()
        )
        query = query.order_by(star_count.desc())

    query = query.options(selectinload(Component.author)).limit(limit).offset(offset)
    result = await db.execute(query)
    components = result.scalars().all()

    items = []
    for c in components:
        star_count = (await db.execute(select(func.count()).where(Star.component_id == c.id))).scalar() or 0
        dl_count = (await db.execute(select(func.count()).where(Download.component_id == c.id))).scalar() or 0
        item = ComponentListItem(
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
            author=UserResponse.model_validate(c.author),
            stars_count=star_count,
            downloads_count=dl_count,
            created_at=c.created_at,
        )
        items.append(item)

    return ComponentListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{component_id}", response_model=ComponentResponse)
async def get_component(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Component).where(Component.id == component_id).options(selectinload(Component.author))
    )
    component = result.scalar_one_or_none()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    star_count = (await db.execute(select(func.count()).where(Star.component_id == component.id))).scalar() or 0
    dl_count = (await db.execute(select(func.count()).where(Download.component_id == component.id))).scalar() or 0

    resp = ComponentResponse(
        id=component.id,
        title=component.title,
        type=component.type,
        description=component.description,
        category=component.category,
        version=component.version,
        min_langflow_ver=component.min_langflow_ver,
        max_langflow_ver=component.max_langflow_ver,
        tested_versions=component.tested_versions,
        icon=component.icon,
        is_standard=component.is_standard,
        status=component.status,
        author=UserResponse.model_validate(component.author),
        stars_count=star_count,
        downloads_count=dl_count,
        created_at=component.created_at,
        updated_at=component.updated_at,
    )
    return resp


@router.post("", response_model=ComponentResponse, status_code=201)
async def create_component(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
    title: str = Form(...),
    type: str = Form(...),
    description: str = Form(None),
    category: str = Form(None),
    version: str = Form(...),
    min_langflow_ver: str = Form(None),
    max_langflow_ver: str = Form(None),
    tested_versions: str = Form(""),
    readme: str = Form(None),
    icon: str = Form(None),
):
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    tested = [v.strip() for v in tested_versions.split(",") if v.strip()] if tested_versions else []

    component = Component(
        title=title,
        type=type,
        description=description,
        category=category,
        version=version,
        min_langflow_ver=min_langflow_ver,
        max_langflow_ver=max_langflow_ver,
        tested_versions=tested,
        file_path=file_path,
        readme=readme,
        icon=icon,
        status="pending",
        author_id=user.employee_id,
    )
    db.add(component)
    await db.commit()
    await db.refresh(component, ["author"])

    return ComponentResponse(
        id=component.id,
        title=component.title,
        type=component.type,
        description=component.description,
        category=component.category,
        version=component.version,
        min_langflow_ver=component.min_langflow_ver,
        max_langflow_ver=component.max_langflow_ver,
        tested_versions=component.tested_versions,
        icon=component.icon,
        is_standard=component.is_standard,
        status=component.status,
        author=UserResponse.model_validate(component.author),
        stars_count=0,
        downloads_count=0,
        created_at=component.created_at,
        updated_at=component.updated_at,
    )


@router.post("/{component_id}/star")
async def toggle_star(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(Star).where(Star.component_id == component_id, Star.user_id == user.employee_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"starred": False}
    else:
        star = Star(user_id=user.employee_id, component_id=component_id)
        db.add(star)
        await db.commit()
        return {"starred": True}


@router.post("/{component_id}/download")
async def record_download(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    component = await db.get(Component, component_id)
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    download = Download(user_id=user.employee_id, component_id=component_id)
    db.add(download)
    await db.commit()

    return {"file_path": component.file_path, "message": "Download recorded"}
