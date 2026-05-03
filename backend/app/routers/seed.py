"""Dev-only seed endpoint to populate the database with mock data."""
import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.models import Component, Download, Notice, Season, Star, User, VocPost

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])

USERS = [
    {"employee_id": "2074795", "name": "고영현", "email": "yeonghyeon.ko@skhynix.com", "team": "AI플랫폼팀", "org": "AI/Data Platform", "role": "admin", "keycloak_sub": "dev-user"},
    {"employee_id": "2074814", "name": "김정호", "email": "jungho.kim@skhynix.com", "team": "제조DX팀", "org": "Manufacturing DX", "role": "user", "keycloak_sub": "dev-2"},
    {"employee_id": "2068420", "name": "이창수", "email": "changsu.lee@skhynix.com", "team": "ERP운영팀", "org": "ERP Ops", "role": "user", "keycloak_sub": "dev-3"},
    {"employee_id": "2074821", "name": "박지원", "email": "jiwon.park@skhynix.com", "team": "협업툴팀", "org": "Collaboration", "role": "user", "keycloak_sub": "dev-4"},
    {"employee_id": "2074803", "name": "최서연", "email": "seoyeon.choi@skhynix.com", "team": "AI플랫폼팀", "org": "AI/Data Platform", "role": "reviewer", "keycloak_sub": "dev-5"},
]

COMPONENTS = [
    {"title": "SmartChunker", "type": "py", "description": "의미 단위로 자동 분할하는 한국어 특화 청커", "category": "RAG / 검색", "version": "v1.2.0", "min_langflow_ver": "1.8.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.9.0", "1.8.3"], "icon": "Scissors", "is_standard": True, "status": "approved", "author_id": "2074795"},
    {"title": "사내 위키 RAG", "type": "json", "description": "Confluence 연동 + 출처 표기 RAG 풀스택 Flow", "category": "RAG / 검색", "version": "v1.0.0", "min_langflow_ver": "1.9.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.9.0"], "icon": "Database", "is_standard": True, "status": "approved", "author_id": "2074814"},
    {"title": "KoreanReranker", "type": "py", "description": "Cross-encoder 기반 한국어 재순위 모델", "category": "RAG / 검색", "version": "v0.9.1", "min_langflow_ver": "1.7.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.8.3"], "icon": "Layers2", "is_standard": True, "status": "approved", "author_id": "2074795"},
    {"title": "SAP Connector", "type": "py", "description": "사내 SAP ERP 데이터 조회 노드", "category": "데이터 / ERP", "version": "v0.4.2", "min_langflow_ver": "1.3.0", "max_langflow_ver": "1.3.0", "tested_versions": [], "icon": "Plug", "is_standard": False, "status": "approved", "author_id": "2068420"},
    {"title": "JiraTicketCreator", "type": "py", "description": "Flow 결과를 Jira 이슈로 자동 생성", "category": "워크플로우", "version": "v1.0.0", "min_langflow_ver": "1.9.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.9.0"], "icon": "Ticket", "is_standard": True, "status": "approved", "author_id": "2074821"},
    {"title": "PDF Layout Parser", "type": "py", "description": "표·다단 레이아웃 보존 PDF 파서", "category": "문서 처리", "version": "v1.5.2", "min_langflow_ver": "1.8.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.9.0", "1.8.3"], "icon": "FileText", "is_standard": True, "status": "approved", "author_id": "2074795"},
    {"title": "회의록 요약 Flow", "type": "json", "description": "Zoom 녹취 → 화자 분리 → 액션 아이템 추출", "category": "문서 처리", "version": "v0.7.0", "min_langflow_ver": "1.8.0", "max_langflow_ver": "1.9.1", "tested_versions": ["1.9.1", "1.8.3"], "icon": "FileText", "is_standard": True, "status": "approved", "author_id": "2074803"},
]

# Stars: (user_id, component_index)
STARS = [
    ("2074814", 0), ("2074821", 0), ("2074803", 0), ("2068420", 0),  # SmartChunker: 4 stars
    ("2074795", 1), ("2074821", 1), ("2074803", 1),  # 위키 RAG: 3 stars
    ("2074814", 2), ("2074821", 2),  # KoreanReranker: 2 stars
    ("2074814", 3),  # SAP Connector: 1
    ("2074795", 4),  # JiraTicketCreator: 1
    ("2074814", 5), ("2074803", 5),  # PDF Layout Parser: 2
    ("2074795", 6),  # 회의록: 1
]

NOTICES = [
    {"title": "AgentHub v0.1.0 정식 오픈 안내", "content": "2026년 상반기 AgentHub가 정식 오픈되었습니다.\n\n**주요 기능:**\n- Component/Flow 업로드 및 자동 검증\n- 심사위원 리뷰 시스템\n- 2026 랭킹 (Star × 2 + 다운로드 × 1)\n- Keycloak SSO 연동", "author_id": "2074795", "is_pinned": True},
    {"title": "2026 상반기 심사 기준 변경 공지", "content": "심사 항목 가중치가 조정되었습니다:\n\n| 항목 | 기존 | 변경 |\n|------|------|------|\n| 기능성/완성도 | 40% | **35%** |\n| 독창성 | 20% | 20% |\n| 사내 활용도 | 25% | **30%** |\n| 문서화 품질 | 15% | 15% |", "author_id": "2074795", "is_pinned": True},
    {"title": "시스템 점검 안내 (5/10 토요일 02:00~06:00)", "content": "PostgreSQL 및 인프라 점검으로 인해 5월 10일(토) 02:00~06:00 동안 서비스가 일시 중단됩니다.", "author_id": "2074795", "is_pinned": False},
]

VOC_POSTS = [
    {"title": "검색 필터에 호환 버전 조건 추가 요청", "content": "홈에서 Component를 검색할 때 특정 Langflow 버전과 호환되는 것만 필터링할 수 있으면 좋겠습니다.", "category": "suggestion", "author_id": "2074814", "status": "in-progress"},
    {"title": "Flow 그래프 뷰에서 노드 드래그 기능", "content": "Flow 상세 페이지의 그래프가 정적이라 큰 Flow의 구조를 파악하기 어렵습니다.", "category": "suggestion", "author_id": "2074821", "status": "open"},
    {"title": "업로드 시 README 자동 생성 기능 제안", "content": "Component 업로드할 때 코드에서 docstring, input/output을 자동 파싱해서 README 초안을 만들어주면 좋겠습니다.", "category": "suggestion", "author_id": "2074803", "status": "open"},
]


@router.post("")
async def seed_database(db: AsyncSession = Depends(get_db)):
    if not settings.DEV_MODE:
        return {"error": "Seed only available in DEV_MODE"}

    # Check if already seeded
    result = await db.execute(select(User).limit(2))
    if len(result.scalars().all()) > 1:
        return {"message": "Already seeded", "skipped": True}

    # Users
    for u in USERS:
        existing = await db.execute(select(User).where(User.employee_id == u["employee_id"]))
        if existing.scalar_one_or_none() is None:
            db.add(User(**u))
    await db.flush()

    # Components
    comp_ids = []
    for c in COMPONENTS:
        comp = Component(id=uuid.uuid4(), **c)
        db.add(comp)
        comp_ids.append(comp.id)
    await db.flush()

    # Stars
    for user_id, comp_idx in STARS:
        db.add(Star(user_id=user_id, component_id=comp_ids[comp_idx]))
    await db.flush()

    # Downloads (some)
    for i, count in enumerate([12, 8, 5, 3, 4, 3, 2]):
        for u in USERS[:count]:
            if u["employee_id"] != COMPONENTS[i]["author_id"]:
                db.add(Download(user_id=u["employee_id"], component_id=comp_ids[i]))
    await db.flush()

    # Notices
    for n in NOTICES:
        db.add(Notice(**n))

    # VoC
    for v in VOC_POSTS:
        db.add(VocPost(**v))

    # Season
    db.add(Season(
        name="2026 상반기",
        submit_start=date(2026, 1, 15),
        submit_end=date(2026, 5, 23),
        review_end=date(2026, 6, 7),
        award_day=date(2026, 6, 21),
        criteria_weights={"functionality": 35, "originality": 20, "utility": 30, "documentation": 15},
        score_formula={"star_weight": 2, "download_weight": 1},
        is_active=True,
    ))

    await db.commit()
    return {"message": "Seeded successfully", "users": len(USERS), "components": len(COMPONENTS), "notices": len(NOTICES), "voc": len(VOC_POSTS)}
