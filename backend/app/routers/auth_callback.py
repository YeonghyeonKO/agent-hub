"""Backend proxy for Keycloak OIDC token exchange.

The frontend redirects to Keycloak for login. Keycloak redirects back with ?code=.
The frontend sends the code to this endpoint, which exchanges it for a token
using the client_secret (which the frontend doesn't have).
"""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class TokenRequest(BaseModel):
    code: str
    redirect_uri: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_in: int | None = None
    token_type: str = "Bearer"


class AuthConfig(BaseModel):
    enabled: bool
    server_url: str
    realm: str
    client_id: str
    dev_mode: bool


@router.get("/config", response_model=AuthConfig)
async def get_auth_config():
    """Return Keycloak config for the frontend (no secrets)."""
    return AuthConfig(
        enabled=bool(settings.KEYCLOAK_URL and settings.KEYCLOAK_CLIENT_ID and not settings.DEV_MODE),
        server_url=settings.KEYCLOAK_URL,
        realm=settings.KEYCLOAK_REALM,
        client_id=settings.KEYCLOAK_CLIENT_ID,
        dev_mode=settings.DEV_MODE,
    )


@router.post("/token", response_model=TokenResponse)
async def exchange_token(body: TokenRequest):
    """Exchange authorization code for token (backend holds client_secret)."""
    if settings.DEV_MODE:
        raise HTTPException(status_code=400, detail="Auth disabled in DEV_MODE")

    token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"

    payload = {
        "grant_type": "authorization_code",
        "client_id": settings.KEYCLOAK_CLIENT_ID,
        "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
        "redirect_uri": body.redirect_uri,
        "code": body.code,
    }

    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(token_url, data=payload)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Keycloak token exchange failed: {resp.text}",
        )

    data = resp.json()
    return TokenResponse(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token"),
        expires_in=data.get("expires_in"),
    )


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    """Refresh an expired access token."""
    if settings.DEV_MODE:
        raise HTTPException(status_code=400, detail="Auth disabled in DEV_MODE")

    token_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"

    payload = {
        "grant_type": "refresh_token",
        "client_id": settings.KEYCLOAK_CLIENT_ID,
        "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
        "refresh_token": body.refresh_token,
    }

    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(token_url, data=payload)

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Token refresh failed")

    data = resp.json()
    return TokenResponse(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token"),
        expires_in=data.get("expires_in"),
    )
