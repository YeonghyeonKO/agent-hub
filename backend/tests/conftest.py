"""pytest 공통 픽스처.

두 종류의 테스트가 있다:
  1. 서비스 단위 테스트 (test_langflow_service.py)
     - DB 불필요. `pip install -r requirements-dev.txt` 후 `pytest` 만으로 실행.
  2. 배포 API 통합 테스트 (test_deploy_api.py)
     - 실제 Postgres가 필요하다. `TEST_DATABASE_URL` 이 설정돼 있을 때만 실행되고,
       없으면 자동으로 skip 된다.

통합 테스트용 DB는 **테스트 전용 데이터베이스**를 가리켜야 한다(테이블을 TRUNCATE 하므로).
docker-compose 로컬 개발 DB를 쓰려면:

    docker compose up -d db
    docker compose exec db psql -U agenthub -c "CREATE DATABASE agenthub_test;"
    TEST_DATABASE_URL=postgresql+asyncpg://agenthub:changeme@localhost:5432/agenthub_test pytest
"""
import os

import pytest
import pytest_asyncio

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

requires_db = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="TEST_DATABASE_URL 미설정 — DB 통합 테스트를 건너뜁니다.",
)


@pytest_asyncio.fixture(scope="session")
async def engine():
    """테스트 DB 엔진. 세션 시작 시 스키마를 생성한다."""
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL 미설정")
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.pool import NullPool

    from app.database import Base
    import app.models.models  # noqa: F401  — 모든 모델을 메타데이터에 등록

    eng = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(engine):
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db(engine, session_factory):
    """각 테스트 시작 전 관련 테이블을 비워 격리를 보장한다."""
    from sqlalchemy import text

    from app.database import Base

    async with engine.begin() as conn:
        tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory, db):
    """앱 인스턴스에 테스트 DB 세션을 주입한 httpx 클라이언트.

    DEV_MODE 기본값(True)이라 인증은 dev admin 으로 자동 처리된다.
    """
    from httpx import ASGITransport, AsyncClient

    from app.database import get_db
    from app.main import app

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
