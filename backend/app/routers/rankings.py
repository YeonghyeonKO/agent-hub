from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.schemas import RankingResponse
from app.services.ranking import compute_rankings

router = APIRouter(prefix="/api/v1/rankings", tags=["rankings"])


@router.get("", response_model=RankingResponse)
async def get_rankings(
    db: Annotated[AsyncSession, Depends(get_db)],
    scope: str = "all",
    limit: int = 50,
    offset: int = 0,
):
    return await compute_rankings(db, scope=scope, limit=limit, offset=offset)
