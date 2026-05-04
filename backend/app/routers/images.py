"""Image upload endpoint — stores images and returns a URL."""
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.auth import get_current_user
from app.config import settings
from app.models.models import User

router = APIRouter(prefix="/api/v1/images", tags=["images"])

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    img_dir = os.path.join(settings.UPLOAD_DIR, "images")
    os.makedirs(img_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(img_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/api/v1/images/{filename}", "filename": filename}


@router.get("/{filename}")
async def get_image(filename: str):
    filepath = os.path.join(settings.UPLOAD_DIR, "images", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)
