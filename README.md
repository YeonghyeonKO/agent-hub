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
- **검증** — 업로드 시 자동 검증(호환성·보안·라이선스) + 심사위원 리뷰
- **인정** — 시즌별 랭킹·시상으로 기여를 가시화
- **재사용** — 한 클릭 import로 내 Flow에 즉시 추가

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
├── frontend/              # React + Babel SPA (빌드 도구 없이 동작)
│   ├── AgentHub.html      # 진입점
│   ├── *.jsx              # 컴포넌트별 파일
│   ├── styles.css         # 전체 스타일
│   ├── assets/            # 로고 등 정적 자산
│   └── Dockerfile         # nginx 기반 컨테이너
├── backend/               # FastAPI 서비스
│   ├── app/
│   │   ├── main.py        # FastAPI 앱
│   │   ├── config.py      # pydantic-settings
│   │   ├── auth.py        # Keycloak OIDC 인증
│   │   ├── models/        # SQLAlchemy 2.0 모델
│   │   ├── schemas/       # Pydantic v2 스키마
│   │   ├── routers/       # API 라우터
│   │   └── services/      # 비즈니스 로직 (랭킹 등)
│   ├── alembic/           # DB 마이그레이션
│   ├── Dockerfile         # python:3.12-slim 멀티스테이지
│   └── requirements.txt
└── infra/
    ├── helm/agent-hub/    # Helm 차트
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/     # K8s 매니페스트
    └── k8s/README.md      # 배포 가이드
```

---

## Screens

| Screen | Description |
|--------|-------------|
| **홈** | 카테고리 필터 + 카드 그리드, 인기순/최신순/트렌딩 |
| **Component 상세** | README · 코드 미리보기 · 버전 · 댓글 |
| **Flow 상세** | 인터랙티브 노드 그래프 + JSON 뷰 |
| **업로드** | 3-step wizard (파일 → 기준 정보 → 호환성) |
| **2026 랭킹** | Podium + 전체 순위 테이블 |
| **내 Component / Flow** | 게시됨 · 초안 · 활동 피드 |
| **관리자 대시보드** | 심사 대기 · 승인 · 반려 · 이슈 · 설정 |
| **가이드** | 빠른 시작 · 네이밍 규칙 · 표준 인증 · FAQ |

---

## Quick Start

### Frontend (프로토타입)

빌드 도구 없이 즉시 확인:

```bash
cd frontend
python3 -m http.server 8080
# http://localhost:8080/AgentHub.html
```

### Backend (로컬 개발)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# PostgreSQL 실행 (Docker)
docker run -d --name agenthub-db \
  -e POSTGRES_USER=agenthub \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=agenthub \
  -p 5432:5432 postgres:15-alpine

# 마이그레이션
alembic upgrade head

# 서버 시작
uvicorn app.main:app --reload --port 8000
```

### Docker Build

```bash
# Backend
docker build -t agent-hub/backend:0.1.0 ./backend

# Frontend
docker build -t agent-hub/frontend:0.1.0 ./frontend
```

### Kubernetes (Helm)

```bash
cd infra/helm
helm install agent-hub ./agent-hub \
  --namespace agent-hub \
  --create-namespace \
  --set postgresql.auth.password=YOUR_PASSWORD \
  --set backend.env.KEYCLOAK_CLIENT_SECRET=YOUR_SECRET

# DB 마이그레이션
kubectl exec -it deploy/agent-hub-backend -n agent-hub -- alembic upgrade head
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | 헬스체크 |
| `GET` | `/api/v1/components` | Component/Flow 목록 (필터, 검색, 정렬) |
| `GET` | `/api/v1/components/{id}` | 상세 조회 |
| `POST` | `/api/v1/components` | 새 Component/Flow 제출 (multipart) |
| `POST` | `/api/v1/components/{id}/star` | Star 토글 |
| `POST` | `/api/v1/components/{id}/download` | 다운로드 기록 |
| `GET` | `/api/v1/rankings` | 랭킹 조회 |
| `GET` | `/api/v1/users/me` | 내 프로필 (SSO) |
| `GET` | `/api/v1/users/me/components` | 내 Component/Flow |
| `GET` | `/api/v1/admin/pending` | 심사 대기 목록 |
| `POST` | `/api/v1/admin/review/{id}` | 심사 제출 |
| `GET/PUT` | `/api/v1/admin/settings` | 시즌 설정 |

---

## Authentication (Keycloak SSO)

Keycloak OIDC 연동으로 사내 임직원 인증:

- **Realm**: `hynix`
- **Client**: `agent-hub`
- **추출 클레임**: `preferred_username`, `empno` (사번, 7자리), `picture` (프로필 이미지)
- 최초 로그인 시 자동 사용자 등록 (upsert)
- Admin 엔드포인트는 `role: admin` 필요

환경변수:
```
KEYCLOAK_URL=https://keycloak.internal
KEYCLOAK_REALM=hynix
KEYCLOAK_CLIENT_ID=agent-hub
KEYCLOAK_CLIENT_SECRET=...
```

---

## Ranking Formula

```
Score = Star × 2 + 다운로드 × 1
```

- 자기 자신의 Star / 다운로드는 집계에서 제외
- 매일 오전 9시 KST 갱신
- 가중치는 관리자 설정에서 변경 가능

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Babel (CDN, no build) |
| Backend | FastAPI, SQLAlchemy 2.0, asyncpg |
| Database | PostgreSQL 15 |
| Auth | Keycloak (OIDC, RS256 JWT) |
| Container | Docker multi-stage |
| Orchestration | Kubernetes + Helm |
| Autoscaling | HPA (CPU-based) |

---

## Contributing

### 코드 스타일
- **Backend**: Python 3.12, type hints, async/await
- **Frontend**: React 함수형 컴포넌트, PascalCase

### 작업 흐름
1. 이슈 생성 → `feat/xxx` 또는 `fix/xxx` 브랜치
2. PR → 리뷰 1명 이상 + CI 통과 후 머지

---

## License

[MIT](LICENSE) © 2026 Yeonghyeon Ko
