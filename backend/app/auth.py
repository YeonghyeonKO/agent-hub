from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.models import User

security = HTTPBearer()

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.keycloak_jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


def _decode_token(token: str, jwks: dict) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    rsa_key = None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = key
            break

    if rsa_key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Key not found")

    payload = jwt.decode(
        token,
        rsa_key,
        algorithms=["RS256"],
        audience=settings.KEYCLOAK_CLIENT_ID,
        issuer=settings.keycloak_issuer,
    )
    return payload


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = credentials.credentials
    jwks = await _get_jwks()

    try:
        payload = _decode_token(token, jwks)
    except JWTError:
        # Retry with fresh JWKS (key rotation)
        global _jwks_cache
        _jwks_cache = None
        jwks = await _get_jwks()
        try:
            payload = _decode_token(token, jwks)
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    sub = payload.get("sub")
    username = payload.get("preferred_username", "")
    empno = payload.get("empno", "")
    picture = payload.get("picture", "")
    email = payload.get("email", "")

    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub claim")

    # Upsert user
    result = await db.execute(select(User).where(User.keycloak_sub == sub))
    user = result.scalar_one_or_none()

    if user is None:
        employee_id = empno if empno else sub[:7]
        user = User(
            employee_id=employee_id,
            name=username,
            email=email,
            keycloak_sub=sub,
            profile_image_url=picture,
            role="user",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        changed = False
        if picture and user.profile_image_url != picture:
            user.profile_image_url = picture
            changed = True
        if username and user.name != username:
            user.name = username
            changed = True
        if changed:
            await db.commit()

    return user


async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
