# QA 가이드

배포(Deploy to Agent Builder) 기능을 중심으로 한 테스트 구조와 실행 방법을 정리한다.
백엔드는 자동화 테스트(pytest), 빌드리스 프론트엔드는 수동 체크리스트로 검증한다.

---

## 1. 백엔드 자동화 테스트

테스트 코드는 `backend/tests/` 에 있다. 두 계층으로 나뉜다.

| 파일 | 대상 | DB 필요 |
|------|------|---------|
| `tests/test_langflow_service.py` | Agent Builder 통신 서비스(에러 메시지·URL 정규화·프로젝트/Flow 폴백·TLS 설정) | ❌ |
| `tests/test_deploy_api.py` | 배포 라우터 (엔드포인트 CRUD, 개수 제한, API Key 비노출, 실패 시 detail 전달) | ✅ Postgres |

### 1-1. 단위 테스트 (DB 불필요)

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/test_langflow_service.py        # 또는 그냥 `pytest` (DB 테스트는 자동 skip)
```

`TEST_DATABASE_URL` 이 없으면 DB 통합 테스트는 자동으로 skip 되므로, `pytest` 만 실행해도 단위 테스트는 항상 돈다.

### 1-2. 통합 테스트 (Postgres 필요)

테이블을 TRUNCATE 하므로 **반드시 테스트 전용 데이터베이스**를 가리켜야 한다.

```bash
# 로컬 compose DB 옆에 테스트 DB 하나 생성
docker compose up -d db
docker compose exec db psql -U agenthub -c "CREATE DATABASE agenthub_test;"

cd backend
TEST_DATABASE_URL=postgresql+asyncpg://agenthub:changeme@localhost:5432/agenthub_test pytest
```

> 외부 Agent Builder 통신은 monkeypatch 로 대체되므로 실제 Agent Builder 인스턴스는 필요 없다.
> 인증은 `DEV_MODE=true`(기본값) 하에 dev admin 으로 자동 처리된다.

### 1-3. 컨테이너만으로 전체 실행 (로컬 파이썬 없이)

```bash
docker network create ah-test-net
docker run -d --name ah-test-pg --network ah-test-net \
  -e POSTGRES_USER=agenthub -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=agenthub_test \
  postgres:15-alpine
# pg_isready 대기 후:
docker run --rm --network ah-test-net -v "$PWD/backend":/app -w /app \
  -e TEST_DATABASE_URL=postgresql+asyncpg://agenthub:changeme@ah-test-pg:5432/agenthub_test \
  python:3.12-slim sh -c "pip install -q -r requirements-dev.txt && pytest -q"
docker rm -f ah-test-pg && docker network rm ah-test-net
```

---

## 2. 프론트엔드 수동 QA 체크리스트

빌드리스 React(브라우저에서 Babel 트랜스파일)라 자동 테스트 인프라가 없다. 아래 시나리오를 수동 확인한다.
`docker compose up -d` 후 `http://localhost:8080` 에서 컴포넌트/Flow 상세의 **배포** 버튼으로 진입.

### 엔드포인트 등록
- [ ] 별칭·주소 중 하나라도 비우면 **저장 버튼이 비활성**되고, 폼 하단에 *"별칭과 주소(Base URL)를 입력해야 저장할 수 있습니다."* 안내가 보인다.
- [ ] API Key 라벨에 *"(선택 — 인증이 켜진 서버만 필요)"* 가 표시된다.
- [ ] **연결 테스트** 성공 시 `Agent Builder x.y.z` 버전이 초록 상태로 표시된다.
- [ ] 잘못된 주소로 연결 테스트 시 빨간 상태 + 실패 사유가 보인다.
- [ ] 엔드포인트 5개 등록 후 **추가 버튼이 비활성**되고 *"엔드포인트는 최대 5개까지…"* 안내가 보인다.

### 배포 / 에러 메시지 (이번 개선의 핵심)
- [ ] 인증이 필요한 서버에 **API Key 없이** 배포 → *"인증 실패: API Key를 확인하세요."* 가 **그대로** 노출된다(예전엔 "오류가 발생했습니다" 같은 뭉뚱그린 문구만 떴음).
- [ ] 호환되지 않는 컴포넌트 코드 배포 → *"Agent Builder 버전 호환성을 확인하세요."* 가 노출된다.
- [ ] 배포 성공 시 🚀 화면 + **"Agent Builder에서 열기"** 링크가 새 탭으로 열린다.

### 용어 (Langflow → Agent Builder, 배포 기능 한정)
- [ ] 배포 모달 제목/엔드포인트 라벨/플레이스홀더/버튼에 "Langflow" 가 보이지 않고 "Agent Builder" 로 표기된다(ko/en 양쪽).
- [ ] (의도된 유지) 업로드 폼·가이드·설정 페이지의 "Langflow 호환/가이드" 표기는 그대로다.

---

## 3. 회귀 시 주의

- 백엔드 에러 detail 은 `api.jsx` 의 `handleResponse` 가 `err.response`/`err.status` 로 실어주고, `deploy-modal.jsx` 가 그것을 읽어 노출한다. 둘 중 하나라도 끊기면 메시지가 다시 뭉뚱그려진다 — 관련 테스트는 `test_deploy_surfaces_backend_detail`.
- TLS 검증 정책은 `langflow._ssl_verify()` 가 단일 진실 공급원: 사내 CA(`/etc/ssl/certs/corporate-ca.crt`)가 있으면 검증, 없으면 `LANGFLOW_VERIFY_SSL`(기본 false). 관련 테스트는 `test_ssl_verify_follows_setting`.
