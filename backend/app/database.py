import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import settings

# Use NullPool for serverless (Vercel) — each request gets a fresh connection
_is_serverless = os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
_pool_kwargs = {"poolclass": NullPool} if _is_serverless else {"pool_pre_ping": True}
engine = create_async_engine(settings.DATABASE_URL, echo=False, connect_args={"timeout": 15}, **_pool_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session
