from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Component, Download, Season, Star, User
from app.schemas.schemas import RankingEntry, RankingResponse, UserResponse


async def compute_rankings(
    db: AsyncSession,
    scope: str = "all",
    limit: int = 50,
    offset: int = 0,
) -> RankingResponse:
    # Get active season formula
    result = await db.execute(select(Season).where(Season.is_active == True))
    season = result.scalar_one_or_none()

    star_weight = 2
    download_weight = 1
    if season and season.score_formula:
        star_weight = season.score_formula.get("star_weight", 2)
        download_weight = season.score_formula.get("download_weight", 1)

    # Subquery: star counts (excluding self-stars)
    star_counts = (
        select(
            Star.component_id,
            func.count().label("star_count"),
        )
        .join(Component, Component.id == Star.component_id)
        .where(Star.user_id != Component.author_id)
        .group_by(Star.component_id)
        .subquery()
    )

    # Subquery: download counts (excluding self-downloads)
    dl_counts = (
        select(
            Download.component_id,
            func.count().label("dl_count"),
        )
        .join(Component, Component.id == Download.component_id)
        .where(Download.user_id != Component.author_id)
        .group_by(Download.component_id)
        .subquery()
    )

    # Main query
    query = (
        select(
            Component,
            func.coalesce(star_counts.c.star_count, 0).label("stars"),
            func.coalesce(dl_counts.c.dl_count, 0).label("downloads"),
        )
        .outerjoin(star_counts, star_counts.c.component_id == Component.id)
        .outerjoin(dl_counts, dl_counts.c.component_id == Component.id)
        .where(Component.status == "approved")
    )

    if scope == "py":
        query = query.where(Component.type == "py")
    elif scope == "json":
        query = query.where(Component.type == "json")

    # Order by computed score
    score_expr = (
        func.coalesce(star_counts.c.star_count, 0) * star_weight
        + func.coalesce(dl_counts.c.dl_count, 0) * download_weight
    )
    query = query.order_by(score_expr.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.all()

    entries = []
    for i, (component, stars, downloads) in enumerate(rows):
        score = stars * star_weight + downloads * download_weight
        author = await db.get(User, component.author_id)
        entries.append(
            RankingEntry(
                rank=offset + i + 1,
                component_id=component.id,
                title=component.title,
                type=component.type,
                category=component.category,
                author=UserResponse.model_validate(author),
                stars=stars,
                downloads=downloads,
                score=score,
            )
        )

    return RankingResponse(
        items=entries,
        formula={"star_weight": star_weight, "download_weight": download_weight},
    )
