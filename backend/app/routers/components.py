import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.models import Component, ComponentVersion, Download, Star, User
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
    query = select(Component).where(Component.status == "approved", Component.deleted_at.is_(None))

    if category:
        query = query.where(Component.category == category)
    if type:
        query = query.where(Component.type == type)
    if search:
        query = query.where(
            Component.title.ilike(f"%{search}%")
            | Component.description.ilike(f"%{search}%")
            | Component.tags.cast(String).ilike(f"%{search}%")
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
            tags=c.tags or [],
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
        tags=component.tags or [],
        icon=component.icon,
        is_standard=component.is_standard,
        status=component.status,
        readme=component.readme,
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
    tags: str = Form(""),
    readme: str = Form(None),
    icon: str = Form(None),
):
    # Save file to disk + store content in DB
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    content = await file.read()
    file_content_str = content.decode("utf-8", errors="replace")
    with open(file_path, "wb") as f:
        f.write(content)

    tested = [v.strip() for v in tested_versions.split(",") if v.strip()] if tested_versions else []
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    component = Component(
        title=title,
        type=type,
        description=description,
        category=category,
        version=version,
        min_langflow_ver=min_langflow_ver,
        max_langflow_ver=max_langflow_ver,
        tested_versions=tested,
        tags=tag_list,
        file_path=file_path,
        file_content=file_content_str,
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
        tags=component.tags or [],
        icon=component.icon,
        is_standard=component.is_standard,
        status=component.status,
        readme=component.readme,
        author=UserResponse.model_validate(component.author),
        stars_count=0,
        downloads_count=0,
        created_at=component.created_at,
        updated_at=component.updated_at,
    )


@router.patch("/{component_id}")
async def update_component(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(None),
    description: str = Form(None),
    readme: str = Form(None),
    changelog: str = Form(""),
    version_bump: str = Form("patch"),  # patch / minor / major
):
    result = await db.execute(
        select(Component).where(Component.id == component_id).options(selectinload(Component.author))
    )
    component = result.scalar_one_or_none()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    if component.author_id != user.employee_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the author or admin can update")

    # Calculate next version
    old_ver = component.version or "v1.0.0"
    ver_str = old_ver.lstrip("v")
    parts = ver_str.split(".")
    major, minor, patch_v = int(parts[0]) if len(parts) > 0 else 1, int(parts[1]) if len(parts) > 1 else 0, int(parts[2]) if len(parts) > 2 else 0
    if version_bump == "major":
        major, minor, patch_v = major + 1, 0, 0
    elif version_bump == "minor":
        minor, patch_v = minor + 1, 0
    else:
        patch_v += 1
    new_version = f"v{major}.{minor}.{patch_v}"

    # Save old version to component_versions
    version_record = ComponentVersion(
        component_id=component.id,
        version=component.version,
        changelog=changelog or f"Updated to {new_version}",
        file_path=component.file_path,
    )
    db.add(version_record)

    # Update file if provided
    if file:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename or "")[1]
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        component.file_path = file_path
        component.file_content = content.decode("utf-8", errors="replace")

    # Update fields
    component.version = new_version
    if description is not None:
        component.description = description
    if readme is not None:
        component.readme = readme

    await db.commit()

    # Re-fetch to avoid lazy loading issues in async
    result2 = await db.execute(
        select(Component).where(Component.id == component_id).options(selectinload(Component.author))
    )
    updated = result2.scalar_one()
    star_count = (await db.execute(select(func.count()).where(Star.component_id == updated.id))).scalar() or 0
    dl_count = (await db.execute(select(func.count()).where(Download.component_id == updated.id))).scalar() or 0

    return ComponentResponse(
        id=updated.id, title=updated.title, type=updated.type,
        description=updated.description, category=updated.category,
        version=updated.version, min_langflow_ver=updated.min_langflow_ver,
        max_langflow_ver=updated.max_langflow_ver, tested_versions=updated.tested_versions,
        icon=updated.icon, is_standard=updated.is_standard, status=updated.status,
        readme=updated.readme, author=UserResponse.model_validate(updated.author),
        stars_count=star_count, downloads_count=dl_count,
        created_at=updated.created_at, updated_at=updated.updated_at,
    )


@router.get("/{component_id}/versions")
async def get_versions(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(ComponentVersion)
        .where(ComponentVersion.component_id == component_id)
        .order_by(ComponentVersion.created_at.desc())
    )
    versions = result.scalars().all()
    return [
        {
            "id": str(v.id),
            "version": v.version,
            "changelog": v.changelog,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


@router.get("/{component_id}/starred")
async def check_starred(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(Star).where(Star.component_id == component_id, Star.user_id == user.employee_id)
    )
    return {"starred": result.scalar_one_or_none() is not None}


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


@router.get("/{component_id}/file")
async def get_file_content(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    component = await db.get(Component, component_id)
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    # Try disk first, fall back to DB content
    if component.file_path and os.path.exists(component.file_path):
        with open(component.file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {"filename": os.path.basename(component.file_path), "content": content, "type": component.type}

    if component.file_content:
        ext = ".py" if component.type == "py" else ".json"
        return {"filename": component.title + ext, "content": component.file_content, "type": component.type}

    raise HTTPException(status_code=404, detail="File not found")


@router.get("/{component_id}/download-file")
async def download_file(
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

    ext = ".py" if component.type == "py" else ".json"
    filename = component.title.replace(" ", "_") + ext

    # Try disk first
    if component.file_path and os.path.exists(component.file_path):
        return FileResponse(component.file_path, filename=filename)

    # Fall back to DB content
    if component.file_content:
        return PlainTextResponse(
            content=component.file_content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    raise HTTPException(status_code=404, detail="File not found")
