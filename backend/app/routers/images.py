"""Image upload endpoint — stores images in DB (base64) with disk cache."""
import base64
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.models import Image, User

router = APIRouter(prefix="/api/v1/images", tags=["images"])

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_image(
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    ext = os.path.splitext(file.filename or "")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"

    # Store in DB (base64)
    img = Image(
        filename=filename,
        content_type=file.content_type,
        data=base64.b64encode(content).decode("ascii"),
        uploader_id=user.employee_id,
    )
    db.add(img)
    await db.commit()

    # Also cache to disk
    try:
        img_dir = os.path.join(settings.UPLOAD_DIR, "images")
        os.makedirs(img_dir, exist_ok=True)
        with open(os.path.join(img_dir, filename), "wb") as f:
            f.write(content)
    except Exception:
        pass  # disk cache is optional

    return {"url": f"/api/v1/images/{filename}", "filename": filename}


@router.get("/{filename}")
async def get_image(filename: str, db: AsyncSession = Depends(get_db)):
    # Try disk cache first
    filepath = os.path.join(settings.UPLOAD_DIR, "images", filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)

    # Fall back to DB
    result = await db.execute(select(Image).where(Image.filename == filename))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    data = base64.b64decode(img.data)

    # Re-cache to disk
    try:
        img_dir = os.path.join(settings.UPLOAD_DIR, "images")
        os.makedirs(img_dir, exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(data)
    except Exception:
        pass

    return Response(content=data, media_type=img.content_type)
