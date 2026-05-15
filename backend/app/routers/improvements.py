import os
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.models import CodeImprovement, Component, ComponentVersion, Notification, User
from app.schemas.schemas import (
    CodeImprovementDetail,
    CodeImprovementListItem,
    ContributorEntry,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/components", tags=["improvements"])


MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _next_patch(version: str | None) -> str:
    ver = (version or "v1.0.0").lstrip("v")
    parts = ver.split(".")
    major = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
    return f"v{major}.{minor}.{patch + 1}"


@router.get("/{component_id}/improvements", response_model=list[CodeImprovementListItem])
async def list_improvements(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = None,
):
    query = (
        select(CodeImprovement)
        .where(CodeImprovement.component_id == component_id)
        .options(selectinload(CodeImprovement.contributor))
        .order_by(CodeImprovement.created_at.desc())
    )
    if status:
        query = query.where(CodeImprovement.status == status)

    result = await db.execute(query)
    items = result.scalars().all()
    return [
        CodeImprovementListItem(
            id=imp.id,
            component_id=imp.component_id,
            contributor=UserResponse.model_validate(imp.contributor),
            title=imp.title,
            description=imp.description,
            base_version=imp.base_version,
            status=imp.status,
            review_comment=imp.review_comment,
            applied_version=imp.applied_version,
            reviewed_at=imp.reviewed_at,
            created_at=imp.created_at,
        )
        for imp in items
    ]


@router.get("/{component_id}/improvements/{improvement_id}", response_model=CodeImprovementDetail)
async def get_improvement(
    component_id: uuid.UUID,
    improvement_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(CodeImprovement)
        .where(
            CodeImprovement.id == improvement_id,
            CodeImprovement.component_id == component_id,
        )
        .options(selectinload(CodeImprovement.contributor))
    )
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="Improvement not found")

    return CodeImprovementDetail(
        id=imp.id,
        component_id=imp.component_id,
        contributor=UserResponse.model_validate(imp.contributor),
        title=imp.title,
        description=imp.description,
        base_version=imp.base_version,
        base_content=imp.base_content,
        file_content=imp.file_content,
        status=imp.status,
        review_comment=imp.review_comment,
        applied_version=imp.applied_version,
        reviewed_at=imp.reviewed_at,
        created_at=imp.created_at,
    )


@router.post("/{component_id}/improvements", response_model=CodeImprovementListItem, status_code=201)
async def submit_improvement(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
):
    component = await db.get(Component, component_id)
    if not component or component.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Component not found")
    if component.author_id == user.employee_id:
        raise HTTPException(status_code=400, detail="Cannot submit improvement to your own component")
    if component.type != "py":
        raise HTTPException(status_code=400, detail="Code improvement is only available for .py components")

    # Validate file
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext != ".py":
        raise HTTPException(status_code=400, detail="Only .py files are accepted")

    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 5MB limit")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    improved_content = raw.decode("utf-8", errors="replace")

    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    if len(description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters")

    improvement = CodeImprovement(
        component_id=component_id,
        contributor_id=user.employee_id,
        title=title.strip()[:300],
        description=description.strip(),
        base_version=component.version,
        base_content=component.file_content or "",
        file_content=improved_content,
        status="pending",
    )
    db.add(improvement)
    await db.flush()  # get improvement.id before creating notification

    # Notify author
    notif = Notification(
        user_id=component.author_id,
        kind="improvement_request",
        message=f"'{component.title}'에 코드 개선 요청이 도착했습니다: {title.strip()[:80]}",
        link=f"#/component/{component_id}?tab=improvements&imp={improvement.id}",
        component_id=component_id,
        improvement_id=improvement.id,
    )
    db.add(notif)

    await db.commit()
    await db.refresh(improvement, ["contributor"])

    return CodeImprovementListItem(
        id=improvement.id,
        component_id=improvement.component_id,
        contributor=UserResponse.model_validate(improvement.contributor),
        title=improvement.title,
        description=improvement.description,
        base_version=improvement.base_version,
        status=improvement.status,
        review_comment=improvement.review_comment,
        applied_version=improvement.applied_version,
        reviewed_at=improvement.reviewed_at,
        created_at=improvement.created_at,
    )


@router.post("/{component_id}/improvements/{improvement_id}/review", response_model=CodeImprovementListItem)
async def review_improvement(
    component_id: uuid.UUID,
    improvement_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    decision: str = Form(...),
    review_comment: str = Form(""),
):
    if decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="decision must be 'approve' or 'reject'")

    result = await db.execute(
        select(CodeImprovement)
        .where(
            CodeImprovement.id == improvement_id,
            CodeImprovement.component_id == component_id,
        )
        .options(selectinload(CodeImprovement.contributor))
    )
    improvement = result.scalar_one_or_none()
    if not improvement:
        raise HTTPException(status_code=404, detail="Improvement not found")

    component = await db.get(Component, component_id)
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    if component.author_id != user.employee_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the component author or admin can review")
    if improvement.status != "pending":
        raise HTTPException(status_code=400, detail=f"Already reviewed (status={improvement.status})")

    improvement.review_comment = review_comment.strip() or None
    improvement.reviewed_at = datetime.now(timezone.utc)

    if decision == "approve":
        # 1) Snapshot the OLD code as a ComponentVersion (so it remains viewable)
        old_version = ComponentVersion(
            component_id=component.id,
            version=component.version,
            changelog=f"Snapshot before contribution: {improvement.title[:120]}",
            file_path=component.file_path,
            file_content=component.file_content,
        )
        db.add(old_version)

        # 2) Bump component to next patch version with the improved code
        new_version = _next_patch(component.version)
        component.version = new_version
        component.file_content = improvement.file_content

        # 3) Save improved file to disk (best-effort; serverless uses DB content)
        try:
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            file_id = str(uuid.uuid4())
            file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(improvement.file_content)
            component.file_path = file_path
        except OSError:
            pass  # serverless / read-only FS — DB content is the source of truth

        # 4) Record the NEW version (carrying contributor credit) so it appears in version history
        new_record = ComponentVersion(
            component_id=component.id,
            version=new_version,
            changelog=f"기여: {improvement.title[:120]}",
            file_path=component.file_path,
            file_content=improvement.file_content,
            contributor_id=improvement.contributor_id,
        )
        db.add(new_record)

        improvement.status = "approved"
        improvement.applied_version = new_version

        # Notify contributor
        db.add(Notification(
            user_id=improvement.contributor_id,
            kind="improvement_approved",
            message=f"'{component.title}'에 대한 코드 개선이 승인되었습니다 ({new_version})",
            link=f"#/component/{component_id}?tab=improvements&imp={improvement.id}",
            component_id=component_id,
            improvement_id=improvement.id,
        ))
    else:
        improvement.status = "rejected"
        db.add(Notification(
            user_id=improvement.contributor_id,
            kind="improvement_rejected",
            message=f"'{component.title}'에 대한 코드 개선이 반려되었습니다",
            link=f"#/component/{component_id}?tab=improvements&imp={improvement.id}",
            component_id=component_id,
            improvement_id=improvement.id,
        ))

    await db.commit()
    await db.refresh(improvement, ["contributor"])

    return CodeImprovementListItem(
        id=improvement.id,
        component_id=improvement.component_id,
        contributor=UserResponse.model_validate(improvement.contributor),
        title=improvement.title,
        description=improvement.description,
        base_version=improvement.base_version,
        status=improvement.status,
        review_comment=improvement.review_comment,
        applied_version=improvement.applied_version,
        reviewed_at=improvement.reviewed_at,
        created_at=improvement.created_at,
    )


@router.delete("/{component_id}/improvements/{improvement_id}")
async def withdraw_improvement(
    component_id: uuid.UUID,
    improvement_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(CodeImprovement).where(
            CodeImprovement.id == improvement_id,
            CodeImprovement.component_id == component_id,
        )
    )
    improvement = result.scalar_one_or_none()
    if not improvement:
        raise HTTPException(status_code=404, detail="Improvement not found")
    if improvement.contributor_id != user.employee_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the contributor or admin can withdraw")
    if improvement.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending improvements can be withdrawn")

    await db.delete(improvement)
    await db.commit()
    return {"deleted": True}


@router.get("/{component_id}/contributors", response_model=list[ContributorEntry])
async def list_contributors(
    component_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    query = (
        select(
            CodeImprovement.contributor_id,
            func.count().label("contributions"),
            func.min(CodeImprovement.reviewed_at).label("first_at"),
            func.max(CodeImprovement.reviewed_at).label("last_at"),
        )
        .where(
            CodeImprovement.component_id == component_id,
            CodeImprovement.status == "approved",
        )
        .group_by(CodeImprovement.contributor_id)
        .order_by(func.max(CodeImprovement.reviewed_at).desc())
    )
    rows = (await db.execute(query)).all()

    result = []
    for contributor_id, count, first_at, last_at in rows:
        user = await db.get(User, contributor_id)
        if not user:
            continue
        result.append(ContributorEntry(
            user=UserResponse.model_validate(user),
            contributions=count,
            first_contribution_at=first_at,
            last_contribution_at=last_at,
        ))
    return result
