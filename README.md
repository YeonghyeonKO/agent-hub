# AgentHub

> 사내 Langflow Component & Flow 공유 플랫폼 — 구성원이 직접 개발한 컴포넌트와 워크플로우를 안전하게 공유·심사·랭킹하는 내부 마켓플레이스.

[![Stack](https://img.shields.io/badge/backend-FastAPI%20+%20PostgreSQL-009688)]()
[![Stack](https://img.shields.io/badge/frontend-React%20+%20Babel-61dafb)]()
[![Deploy](https://img.shields.io/badge/deploy-Helm%20+%20K8s-326CE5)]()
[![Auth](https://img.shields.io/badge/auth-Keycloak%20SSO-4D4D4D)]()
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Why AgentHub

사내 구성원이 직접 만든 Langflow 자산이 메신저·이메일에 흩어져 있어 발견·재사용·품질 관리가 어렵습니다. **AgentHub**는 이를 한 곳에 모으고:

- **발견** — 카테고리·검색·랭킹으로 좋은 Component/Flow를 빠르게 찾기
- **검증** — 업로드 시 자동 검증(파일 형식·크기·비밀키 스캔) + 심사위원 리뷰
- **인정** — 시즌별 랭킹·시상으로 기여를 가시화
- **재사용** — 한 클릭 다운로드로 내 Flow에 즉시 추가
- **소통** — 공지사항 + VoC 게시판으로 운영팀과 사용자 간 피드백 루프

---

## Architecture

```
┌─────────────┐     ┌────────────┐     ┌──────────────┐
│  Frontend   │ ──► │  Backend   │ ──► │  PostgreSQL  │
│ (React SPA) │     │ (FastAPI)  │     └──────────────┘
│  nginx:80   │     │  :8000     │
└─────────────┘     └─────┬──────┘
        │                 │
        │    Keycloak SSO │ (OIDC)
        └─────────────────┘
              │
              ▼
        ┌────────────┐
        │ Kubernetes │  ← Helm chart
        └────────────┘
```

---

## Repository Structure

```
agent-hub/
├── frontend/                # React + Babel SPA (빌드 도구 없이 동작)
│   ├── AgentHub.html        # 진입점
│   ├── api.jsx              # Backend API 연동 + useFetch hook
│   ├── i18n.jsx             # 다국어 (한국어/English)
│   ├── home.jsx             # 홈 갤러리
│   ├── component-detail.jsx # Component 상세
│   ├── flow-detail.jsx      # Flow 상세 (노드 그래프)
│   ├── upload-modal.jsx     # 업로드 wizard (실제 파일 검증)
│   ├── admin.jsx            # 관리자 대시보드
│   ├── extra-pages.jsx      # 랭킹, 내 Component/Flow, 가이드
│   ├── boards.jsx           # 공지사항 + VoC 게시판
│   ├── data.jsx             # 아이콘 + 시드 데이터
│   ├── styles.css           # 전체 스타일
│   ├── assets/              # 로고, favicon, SK ribbon
│   ├── nginx.conf           # SPA fallback + API 프록시
│   └── Dockerfile           # nginx 기반 컨테이너
├── backend/                 # FastAPI 서비스
│   ├── app/
│   │   ├── main.py          # FastAPI 앱 + CORS + 라우터
│   │   ├── config.py        # pydantic-settings (env vars)
│   │   ├── auth.py          # Keycloak OIDC + DEV_MODE bypass
│   │   ├── database.py      # SQLAlchemy async engine
│   │   ├── models/          # 12 테이블 (User, Component, Review, ...)
│   │   ├── schemas/         # Pydantic v2 request/response
│   │   ├── routers/         # API 라우터 (7개)
│   │   └── services/        # 비즈니스 로직 (랭킹 계산)
│   ├── alembic/             # DB 마이그레이션 (5개 버전)
│   ├── Dockerfile           # python:3.12-slim 멀티스테이지
│   └── requirements.txt
├── infra/
│   ├── helm/agent-hub/      # Helm 차트
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/       # 15개 K8s 매니페스트
│   └── k8s/README.md        # 배포 가이드
└── docker-compose.yml       # 로컬 개발 (frontend + backend + db)
```

---

## Screens

| Screen | URL | Description |
|--------|-----|-------------|
| **홈** | `#/home` | 카테고리 필터 + 카드 그리드, 인기순/최신순 |
| **Component 상세** | `#/component/{uuid}` | README · 코드 미리보기 · 버전 · 댓글 (slide-over) |
| **Flow 상세** | `#/flow/{uuid}` | 인터랙티브 노드 그래프 + JSON 뷰 (slide-over) |
| **업로드** | modal | 3-step wizard (파일 검증 → 기준 정보 → 호환성), 개요/사용법 에디터, 이미지 붙여넣기 |
| **2026 랭킹** | `#/ranking` | Component / Flow 부문 2-column 분리 |
| **내 Component / Flow** | `#/mine` | 게시됨 · 초안/심사 중 · 반려/삭제 (다시 제출) |
| **공지사항** | `#/notice` | 공지 CRUD (관리자), markdown, 핀 고정 |
| **VoC 게시판** | `#/voc` | 제안·버그·질문, upvote, 댓글, markdown |
| **관리자 대시보드** | `#/admin` | 심사 대기 · 승인/반려 · 통계 · 사용자 관리 · 설정 |
| **가이드** | `#/guide` | 빠른 시작 · 네이밍 · 표준 인증 · 심사 · FAQ |

---

## Quick Start (Docker Compose)

가장 빠른 방법 — 3개 서비스를 한 번에 실행:

```bash
# 전체 스택 실행 (frontend + backend + PostgreSQL)
docker compose up -d

# DB 마이그레이션
docker compose exec backend alembic upgrade head

# 시드 데이터 투입 (7개 Component, 사용자, 공지, VoC)
curl -X POST http://localhost:8000/api/v1/seed

# 브라우저에서 확인
open http://localhost:8080
```

### 개별 실행

<details>
<summary>Frontend만 실행 (프로토타입)</summary>

```bash
cd frontend
python3 -m http.server 8080
# http://localhost:8080/AgentHub.html
```
</details>

<details>
<summary>Backend만 실행</summary>

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# PostgreSQL이 localhost:5432에 실행 중이어야 합니다
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
</details>

<details>
<summary>Kubernetes (Helm)</summary>

```bash
cd infra/helm
helm install agent-hub ./agent-hub \
  --namespace agent-hub \
  --create-namespace \
  --set postgresql.auth.password=YOUR_PASSWORD \
  --set backend.env.KEYCLOAK_CLIENT_SECRET=YOUR_SECRET

kubectl exec -it deploy/agent-hub-backend -n agent-hub -- alembic upgrade head
```
</details>

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | - | 헬스체크 |
| `GET` | `/api/v1/components` | - | Component/Flow 목록 (필터, 검색, 정렬) |
| `GET` | `/api/v1/components/{id}` | - | 상세 조회 |
| `GET` | `/api/v1/components/{id}/file` | - | 파일 내용 조회 (코드 미리보기) |
| `GET` | `/api/v1/components/{id}/download-file` | user | 파일 다운로드 + 기록 |
| `POST` | `/api/v1/components` | user | 새 Component/Flow 제출 (multipart) |
| `POST` | `/api/v1/components/{id}/star` | user | Star 토글 |
| `GET` | `/api/v1/rankings` | - | 랭킹 조회 (자기 Star/DL 제외) |
| `GET` | `/api/v1/users/me` | user | 내 프로필 (SSO) |
| `GET` | `/api/v1/users/me/components` | user | 내 Component/Flow 목록 |
| `GET` | `/api/v1/notices` | - | 공지사항 목록 |
| `POST` | `/api/v1/notices` | admin | 공지 작성 |
| `PUT` | `/api/v1/notices/{id}` | admin | 공지 수정 (핀 토글) |
| `DELETE` | `/api/v1/notices/{id}` | admin | 공지 삭제 |
| `GET` | `/api/v1/voc` | user | VoC 목록 (is_upvoted 포함) |
| `POST` | `/api/v1/voc` | user | VoC 글 작성 (markdown) |
| `GET` | `/api/v1/voc/{id}` | - | VoC 상세 + 댓글 |
| `POST` | `/api/v1/voc/{id}/comments` | user | 댓글 작성 |
| `POST` | `/api/v1/voc/{id}/upvote` | user | Upvote 토글 |
| `PATCH` | `/api/v1/voc/{id}/status` | admin | 상태 변경 |
| `GET` | `/api/v1/admin/pending` | admin | 심사 대기 목록 |
| `GET` | `/api/v1/admin/approved` | admin | 승인 목록 |
| `GET` | `/api/v1/admin/rejected` | admin | 반려 목록 |
| `POST` | `/api/v1/admin/review/{id}` | admin | 심사 제출 (승인/반려) |
| `GET` | `/api/v1/admin/statistics` | admin | 전체 통계 (CSV 다운로드용) |
| `GET/PUT` | `/api/v1/admin/settings` | admin | 시즌 설정 |
| `PATCH` | `/api/v1/components/{id}` | user | Component/Flow 업데이트 (버전 bump) |
| `GET` | `/api/v1/components/{id}/versions` | - | 버전 이력 |
| `GET` | `/api/v1/components/{id}/starred` | user | Star 여부 확인 |
| `DELETE` | `/api/v1/admin/components/{id}` | admin | Soft delete |
| `POST` | `/api/v1/seed` | dev | 시드 데이터 투입 (DEV_MODE only) |

---

## Authentication (Keycloak SSO)

Keycloak OIDC 연동으로 사내 임직원 인증:

- **Realm**: `hynix`
- **Client**: `agent-hub`
- **추출 클레임**: `preferred_username`, `empno` (사번, 7자리), `picture` (프로필 이미지)
- 최초 로그인 시 자동 사용자 등록 (upsert)
- Admin/Reviewer 엔드포인트는 `role: admin` 필요
- **DEV_MODE**: `DEV_MODE=true` 설정 시 Keycloak 없이 dev admin 사용자로 자동 인증

환경변수:
```
KEYCLOAK_URL=https://keycloak.internal
KEYCLOAK_REALM=hynix
KEYCLOAK_CLIENT_ID=agent-hub
KEYCLOAK_CLIENT_SECRET=...
DEV_MODE=true  # 로컬 개발 시
```

---

## Features

### Upload & Validation
- 3-step wizard: 파일 → 기준 정보 → 호환성
- 실제 파일 검증: 형식 확인, 크기 제한 (5MB), 비밀키 스캔, import 검증
- **개요/사용법 에디터**: Component/Flow 전용 마크다운 템플릿 자동 로드, 작성/미리보기 탭 전환
- **이미지 첨부**: 클립보드 Ctrl+V 붙여넣기 또는 Image 버튼 → 자동 업로드 + `![](url)` 삽입
- 입력 규정: 한줄설명 20자 이상, 개요/사용법 100자 이상
- **태그**: 검색 가능한 태그 추가 (콤마 구분), 홈/통계에서 태그 검색 지원
- **파일 검증 강화**: `.py`/`.json` 외 파일 차단, 5MB 초과 차단 + 에러 메시지
- 아이콘 선택 (8종)
- 파일 타입 전환 시 템플릿 자동 변경
- 업로드 후 `pending` → 관리자/심사위원 승인 후 홈에 게시

### Component / Flow Detail
- **개요/사용법** 탭: 업로드 시 작성한 마크다운 렌더링 (API readme 필드)
- **코드 미리보기**: 실제 업로드 파일 내용 표시
- **Star 토글**: 클릭 시 노란색 활성/비활성 전환, DB 저장
- **Flow 그래프**: 실제 JSON에서 노드/연결 수 표시, 예외 시 안내 UI

### Ranking
```
Score = Star × 1 + Download × 2
```
- **Component 부문 / Flow 부문** 2-column 분리 표시
- 실시간 갱신 (페이지 진입 시 최신 데이터)
- 자기 자신의 Star / 다운로드는 집계에서 제외
- 가중치는 관리자 설정에서 변경 가능

### Star & Copy
- Star 토글: 노란색 활성/비활성, DB 저장
- Star 상태 유지: detail 진입 시 현재 사용자의 star 여부 확인
- **코드/JSON 복사 시 자동 Star** — 복사하면 작성자에게 Star 자동 전달 (이미 Star한 경우 유지)

### Soft Delete
- 관리자가 Component/Flow를 삭제하면 `deleted_at` 기록 (DB 보존)
- 홈, 랭킹 등에서 삭제된 항목 자동 필터링

### Version Updates
- 작성자/관리자가 Component/Flow 업데이트 가능 (patch/minor/major 선택)
- 이전 버전 이력 조회 가능 (버전 이력 탭)

### Mobile Responsive
- 햄버거 메뉴 (768px 이하)
- 전 페이지 모바일 대응 (그리드, 카드, 모달, 관리자)
- Detail overlay: PC 82% slide-over (바깥 클릭 닫기), 모바일 전체 너비 + 고정 헤더

### Vercel Deployment
- `vercel.json` + `api/index.py` serverless wrapper
- Neon PostgreSQL 자동 연동
- https://agent-hub.posong.space

### i18n (다국어)
- 🇰🇷 한국어 (기본) / 🇺🇸 English 토글
- 모든 UI 텍스트 160+ 키 번역 완료 (관리자 설정 포함)

### URL Routing
- Hash 기반 라우팅 (`#/home`, `#/ranking`, `#/component/{uuid}`)
- 브라우저 뒤로가기/앞으로가기 지원
- Component/Flow URL 공유 가능

### Notice & VoC
- 공지사항: 관리자 CRUD, markdown, 핀 고정, 홈 배너 → 해당 공지 상세 이동
- VoC: 제안/버그/질문 게시판, markdown, upvote (노란 별), 댓글
- **이미지 클립보드 붙여넣기** 지원 (공지, VoC 모두)
- 작성자 표시: 이름만 표시 (ID 노출 제거)

### Admin & Reviewer
- **심사위원(reviewer) 역할**: 관리자 페이지 접근 가능, 심사대기/승인/반려 탭만 표시
- **심사대기 fold/expand**: 항목 클릭 시 인라인으로 심사 카드 펼침
- **동적 심사항목**: 설정 탭에서 추가/삭제한 criteria가 심사 슬라이더에 실시간 반영
- **Statistics 탭**: 전체 Component/Flow 통계 테이블 (작성자·상태·Star·다운로드·날짜+시간), CSV 다운로드
- **Loading indicator**: 전 탭 flow-dot 펄스 애니메이션
- 관리자 설정 전체 i18n 완료 (시즌, 심사항목, 랭킹 공식, 심사위원, 호환성)

### Link Sharing & Search
- **링크 복사**: Component/Flow detail에서 공유 URL 클립보드 복사
- **Topbar 검색**: Enter 키로 API 검색 + Home 이동, 모바일 검색 프롬프트 연동
- **Reupload prefill**: 반려/삭제 항목 "다시 제출" 시 이전 데이터(제목·설명·README·파일) 자동 채움

### Pagination
- Home: 20개씩 "더 보기" (backend total count 기반)
- 공지사항 / VoC: 20개씩 "더 보기"

---

## Database (PostgreSQL)

12개 테이블:

| Table | Description |
|-------|-------------|
| `users` | 사용자 (사번 PK, Keycloak SSO) |
| `components` | Component / Flow 등록물 |
| `component_versions` | 버전 이력 |
| `reviews` | 심사 결과 (점수 JSON + 결정) |
| `stars` | Star (composite PK) |
| `downloads` | 다운로드 기록 |
| `issues` | 신고 / 보안 / 버그 |
| `seasons` | 시즌 설정 (가중치, 기간) |
| `notices` | 공지사항 |
| `voc_posts` | VoC 게시글 |
| `voc_comments` | VoC 댓글 |
| `voc_upvotes` | VoC 추천 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Babel (CDN, no build), marked.js (markdown) |
| Backend | FastAPI, SQLAlchemy 2.0 async, asyncpg, Pydantic v2 |
| Database | PostgreSQL 15 |
| Auth | Keycloak (OIDC, RS256 JWT) |
| Container | Docker multi-stage, docker-compose |
| Orchestration | Kubernetes + Helm |
| Autoscaling | HPA (CPU-based) |

---

## Contributing

### 코드 스타일
- **Backend**: Python 3.12, type hints, async/await
- **Frontend**: React 함수형 컴포넌트, PascalCase, useI18n() for text

### 작업 흐름
1. 이슈 생성 → `feat/xxx` 또는 `fix/xxx` 브랜치
2. PR → 리뷰 1명 이상 + CI 통과 후 머지

---

## License

[MIT](LICENSE) © 2026 Yeonghyeon Ko
