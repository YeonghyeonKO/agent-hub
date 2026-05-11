# Changelog

## v1.0.2 (2026-05-11)

### Features
- **Tag click filter**: click `#tag` on Home cards to filter, active tag bar with clear button
- **Tag search everywhere**: Home inline search, Topbar search, backend `tag` query param
- **Contact Channel**: admin-configurable via Settings, displayed in Guide sidebar as "VoC Channel"

### Fixes
- **Tag limit**: max 5 tags per component/flow, UI hides input when full
- **Image paste in upload**: `useImagePaste` now detects textarea after step change
- **Component template**: usage updated to Custom Component node copy/paste (not file placement)
- **Guide sidebar**: VoC Channel shows label instead of raw URL

### Database Migration
- **006**: `seasons.contact_channel` TEXT column

---

## v1.0.1 (2026-05-11)

### Fixes
- **Guide sidebar**: VoC Channel link shows label instead of raw URL, icon changed to Users

---

## v1.0.0 (2026-05-11)

### Features
- **Tags**: searchable tags on components/flows — displayed as `#tag` chips in Home cards, detail pages
- **Tag search**: Home/Topbar/Statistics search includes tags
- **Upload file validation**: block non `.py`/`.json` files and >5MB with error message + disabled Next
- **Update button restriction**: only author or admin can see "업데이트" button
- **Contact Channel**: configurable via Admin Settings — replaces hardcoded `#agenthub-help` in Guide/FAQ
- **Ingress TLS options**: `tlsDisable`, `tlsSecretName` in Helm chart
- **Ingress host override**: `ingress.host` for custom domains without subdomain prefix

### Database Migrations
- **005**: `components.tags` JSON column
- **006**: `seasons.contact_channel` TEXT column

---

## v0.9.6 (2026-05-11)

### Features
- **Tags UI**: display `#tag` chips in Home cards, Component detail, Flow detail
- **Tag search**: Home/Topbar search includes tags (cast JSON→Text ILIKE)

### Fixes
- **Search crash**: `String` cast on JSON column fails on PostgreSQL — use `Text` cast
- **Ingress TLS**: add `tlsDisable` / `tlsSecretName` options in Helm chart
- **Helm image tags**: bump from v0.3.0 to 0.9.5

---

## v0.9.5 (2026-05-11)

### Features
- **Tags**: JSON tags column on components (migration 005), stored on upload, searchable via Home/Topbar
- **Tag search in Statistics**: filter by title or tag in Admin Statistics tab, tags included in CSV export
- **Upload file validation**: block Next button for non `.py`/`.json` files or files >5MB with error message
- **Update button restriction**: only author or admin can see "업데이트" button (backend already enforced 403)

### Database Migration
- **005**: `components` 테이블에 `tags` JSON 컬럼 추가

---

## v0.9.4 (2026-05-10)

### Features
- **Admin Statistics tab**: table view of all components/flows with author, status, stars, downloads, date+time — CSV export
- **Link copy button**: shareable URL copy on component/flow detail pages
- **Topbar search**: global search input now functional (Enter to search, navigates to Home)
- **Reupload prefill**: rejected/deleted items pre-fill upload modal (title, desc, readme, file)
- **Dynamic review criteria**: pending review sliders load from Settings API (add/remove criteria reflected)
- **Pagination**: "Load More" on Home (20/page), Notices, VoC

### Fixes
- **Home empty**: `URLSearchParams` sent literal `"undefined"` as search — filter null/undefined params
- **Duplicate label**: "심사 중" chip shown twice in drafts tab
- **Detail date**: show `created_at` (registration date) instead of `updated_at`
- **Statistics datetime**: DATE column shows `YYYY-MM-DD HH:MM` (table + CSV)
- **Notice page crash**: loading state caused detail branch to render with null notice
- **Loading indicators**: added to Admin Pending/Users, Notices, VoC, My Components (metrics + published)
- **Score slider i18n**: removed hardcoded Korean fallbacks, consistent `t()` usage
- **i18n**: translate hardcoded Korean in drafts/deleted tabs (심사 중, 초안, 반려됨, 삭제됨, 다시 제출)

---

## v0.9.3 (2026-05-07)

### Fixes
- **Download 403**: use fetch+blob instead of window.open (auth context issue)
- **PATCH 500 MissingGreenlet**: re-query after commit instead of db.refresh
- **Update modal**: confirm dialog on close when changes exist (mistouch guard)

---

## v0.9.2 (2026-05-07)

### Fixes
- **Flow graph**: correct Langflow JSON parsing — unwrap `data:{}` wrapper, use `data.display_name`/`data.type` for nodes, `data.sourceHandle.id`→`data.targetHandle.id` for edges
- **Download file**: DB fallback for serverless (Vercel /tmp ephemeral)
- **Large files**: 1MB+ shows download prompt instead of code preview
- **Home cards**: defensive null author handling
- **Season banner**: fetches from Admin Settings API (season name + submit deadline)
- **Upload modal**: confirm dialog on close when data exists (mistouch protection)
- **Admin pending**: dummy data (SUBMISSIONS) completely removed

---

## v0.9.0 (2026-05-07)

### Features
- **Detail overlay UX** — PC: 82% 너비 slide-over (왼쪽 클릭으로 닫기), 모바일: 전체 너비 + 상단 고정 뒤로가기/닫기 버튼
- **Admin detail preview** — 승인/반려 탭에서 눈 아이콘으로 component/flow 상세 열람
- **Settings: reviewers auto-sync** — 사용자 관리에서 reviewer/admin 역할 지정 시 설정 탭에 자동 반영
- **Review score i18n** — 기능성/독창성/활용도/문서화 라벨 한/영 전환
- **File content in DB** — Vercel 서버리스 환경에서 파일 영속 저장 (migration 004)
- **My Components: 반려/삭제 탭** — rejected + deleted 항목 통합 표시, 다시 제출 버튼

### Fixes
- PATCH /components/{id} 500 에러 수정 (file_content DB 저장)
- GET /components/{id}/file 404 수정 (디스크 → DB fallback)
- Admin soft-delete 쿼리에 deleted_at 필터 추가
- 심사대기 dummy data fallback 제거
- Settings API 연동 (시즌/심사항목 저장)

### Database Migration
- **004**: `components` 테이블에 `file_content` TEXT 컬럼 추가

---

## v0.8.1 (2026-05-07)

### Features
- **Reviewer preview** — 심사대기 항목에 "미리보기 (코드 · 다운로드)" 버튼 추가, ComponentDetail/FlowDetail 오버레이로 전체 코드 검토 가능

### Fixes
- Admin 삭제 후 내 Component/Flow에서 '삭제됨' 탭 표시 + "다시 제출" 버튼
- Admin 심사대기 dummy data fallback 제거
- Admin Settings API 연동 (GET/PUT /admin/settings) + Save 버튼
- Admin 사용자 관리: Team 열 제거, Name 넓힘
- Admin 승인됨: version 열 제거
- Admin 삭제 확인 "(복구 가능)" 문구 제거
- Hamburger 메뉴 관리자 클릭 시 닫힘 수정
- Loading indicator 추가 (랭킹, 관리자 탭)

---

## v0.8.0 (2026-05-07)

### Features
- **Admin fold/expand** — 심사대기 항목 클릭 시 인라인 펼침/접힘 (2열 grid 제거)
- **Auto-star on code preview copy** — 코드/JSON 미리보기 탭 복사 버튼도 자동 Star
- **Loading indicator** — flow-dot 펄스 애니메이션 (홈, 랭킹, 관리자 탭)
- **Mobile topbar** — 돋보기 검색 아이콘, 프로필 우측 정렬, 제출 버튼 아이콘 전용
- **Update modal 개선** — 파일 타입 제한 (.py↔.json 변경 불가), 개요/사용법 에디터 포함

### Improvements
- 홈: 카테고리 필터 제거 (All/RAG/Doc 등), 검색 + 정렬만 유지
- 관리자 사용자 관리: Team 열 제거, Name 넓힘, Role 축소
- 관리자 승인됨: version 열 제거
- 관리자 삭제 확인: "(복구 가능)" 문구 제거
- 모바일 정렬 버튼: full-width segmented 가로 배치

### Fixes
- Admin soft-delete: pending/approved/rejected 쿼리에 `deleted_at IS NULL` 필터 추가
- 코드 미리보기: SmartChunker 더미 데이터 → 파일 로드 실패 안내 메시지
- 햄버거 메뉴: 관리자 클릭 시 메뉴 닫힘 수정 (`navClick` 래핑)

---

## v0.7.0 (2026-05-06)

### Features
- **Star fix** — `users.py`, `admin.py`에서 하드코딩 `stars_count=0` 제거, 실제 DB 쿼리
- **Star 상태 유지** — `GET /components/{id}/starred` 엔드포인트 추가, detail 진입 시 star 여부 확인
- **복사 → 자동 Star** — 코드/JSON 복사 시 미star 상태면 자동 star + "개발자에게 star도 같이 전달할게요 ⭐️" 토스트 (우상단, warm 디자인)
- **Soft delete** — `deleted_at` 컬럼 (migration 003), `DELETE /api/v1/admin/components/{id}`, 관리자 삭제 버튼
- **Component/Flow 버전 업데이트** — `PATCH /api/v1/components/{id}` (patch/minor/major bump), 버전 이력 탭, 업데이트 모달
- **Ranking 개편** — Star×1 + Download×2, 실시간 갱신, `agenthub:reload` 이벤트로 즉시 반영
- **VoC 댓글 수** — 카드 미리보기에서 `comment_count` 매핑 수정
- **Vercel 배포** — `vercel.json` + `api/index.py` serverless wrapper, Neon PostgreSQL 연동
- **NullPool** — serverless 환경 DB 연결 안정화 (15s timeout)
- **모바일 반응형** — 햄버거 메뉴, 768px/480px breakpoints, 전 페이지 모바일 대응

### Mobile UX
- Topbar: 햄버거 ☰ 드롭다운 메뉴 (선택 시 자동 닫힘)
- Grid: 3열→1열, 4열→2열
- 내 컴포넌트: 헤더 세로 스택, 카드 Star/Download 아이콘 표시
- 가이드: 사이드바 겹침 해소 (relative position)
- 관리자: admin-grid 1열, review-card fold 패턴, 설정 1열

### Fixes
- Neon unpooled endpoint 사용 (asyncpg 호환)
- `sslmode=require` → `ssl=require` 변환
- Ranking에 `deleted_at` 필터 추가
- `ComponentResponse`에 `readme` 포함

### Database Migration
- **003**: `components` 테이블에 `deleted_at` 컬럼 추가 (soft delete)

---

## v0.5.0 (2026-05-05)

### Features
- **Upload: 개요/사용법 에디터** — Component/Flow 전용 마크다운 템플릿 자동 로드, 작성/미리보기 탭, 이미지 클립보드 붙여넣기 (Ctrl+V)
- **Upload: 입력 규정** — 한줄설명 20자 이상, 개요/사용법 100자 이상 필수 (미충족 시 다음 단계 비활성)
- **Upload: 파일 타입 연동** — .py/.json 선택 또는 파일 드롭 시 제목 자동 세팅, 템플릿 자동 전환
- **Detail: 개요/사용법 렌더링** — 업로드 시 작성한 마크다운이 상세 페이지에 표시 (API readme 필드 연동)
- **Detail: Star 토글** — 클릭 시 노란색 활성/비활성 전환, DB 저장/삭제, 카운트 실시간 반영
- **Detail: Flow 그래프 개선** — 실제 JSON에서 노드/연결 수 표시, 구조 오류 시 안내 UI
- **Ranking: 2-column 분리** — Component 부문 / Flow 부문을 한 페이지에 나란히 표시
- **Notice: 핀 공지 → 상세 이동** — 홈 핀 공지 클릭 시 해당 공지 상세로 직접 이동
- **Notice/VoC: 이미지 붙여넣기** — 본문 작성 시 Ctrl+V 이미지 자동 업로드
- **Admin: 심사위원 역할** — reviewer 역할로 관리자 페이지 접근 가능 (심사 탭만 표시)
- **Admin: 설정 i18n 완료** — 시즌, 심사항목, 랭킹 공식, 심사위원, 호환성 등 전체 영문 번역
- **내 Component/Flow: 새로고침 버튼** — 탭 옆 새로고침 아이콘으로 목록 갱신

### Improvements
- Component/Flow 상세에서 fake data 제거 (버전/댓글/사이드바)
- 공지사항/VoC 작성자 표시: 이름만 (ID 제거)
- 공지사항 날짜 포맷 정규화 (ISO → YYYY-MM-DD)
- README body CSS 추가 (테이블, 코드블록, 이미지, blockquote)
- 내 Component/Flow 페이지에서 "사번 · 이름" 헤더 제거

### Fixes
- CORS: `http://localhost:3000` 개발 환경 허용
- API_BASE: dev 환경 자동 감지 (`port 3000` → `http://localhost:8000`)
- 이미지 URL: dev 환경에서 절대 경로로 삽입 (미리보기 404 수정)
- 업로드 모달 Babel 파싱 오류 수정 (image-upload.jsx 로드 순서, 템플릿 문자열)
- 공지사항 페이지 진입 오류 수정 (클릭 이벤트가 noticeId로 전달되던 버그)
- Ranking 페이지 렌더링 오류 수정 (rank-table-row CSS grid 충돌)
- ComponentResponse에 readme 필드 누락 수정 (BE)
- 랭킹에서 아이템 클릭 시 detail 미표시 수정 (full component fetch)

### Backend
- `ComponentResponse` 스키마에 `readme` 필드 추가
- `get_component`, `create_component` 응답에 `readme` 포함
- API version: 0.5.0

---

## v0.4.0 (2026-05-04)

- 이미지 첨부 (공지, VoC)
- 업로드 i18n, 토큰 리프레시, 홈 리로드
- 관리자 페이지 개편 (실제 데이터, 사용자 관리)
