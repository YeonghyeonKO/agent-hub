// ─────────────────────────────────────────────────────────────────────
// 공지사항 (Notice Board) + VoC (Voice of Customer) Board
// ─────────────────────────────────────────────────────────────────────

const MOCK_NOTICES = [
  { id: 'n1', title: 'AgentHub v0.1.0 정식 오픈 안내', content: '2026년 상반기 AgentHub가 정식 오픈되었습니다. 모든 구성원은 본인이 개발한 Langflow Component·Flow를 자유롭게 등록할 수 있습니다.\n\n주요 기능:\n- Component/Flow 업로드 및 자동 검증\n- 심사위원 리뷰 시스템\n- 2026 랭킹 (Star × 2 + 다운로드 × 1)\n- Keycloak SSO 연동\n\n문의: AI/Data Platform 고영현TL', author: { name: '고영현', id: '2074795', initial: '고' }, is_pinned: true, created_at: '2026-04-28' },
  { id: 'n2', title: '2026 상반기 심사 기준 변경 공지', content: '심사 항목 가중치가 아래와 같이 조정되었습니다:\n- 기능성/완성도: 35% (기존 40%)\n- 독창성: 20%\n- 사내 활용도: 30% (기존 25%)\n- 문서화 품질: 15%\n\n적용일: 2026-05-01', author: { name: '정승현', id: '2068122', initial: '정' }, is_pinned: true, created_at: '2026-04-25' },
  { id: 'n3', title: '시스템 점검 안내 (5/10 토요일 02:00~06:00)', content: 'PostgreSQL 및 인프라 점검으로 인해 5월 10일(토) 02:00~06:00 동안 서비스가 일시 중단됩니다.', author: { name: '오세훈', id: '2069447', initial: '오' }, is_pinned: false, created_at: '2026-05-01' },
  { id: 'n4', title: 'Langflow 1.9.1 호환성 테스트 완료', content: 'Langflow 1.9.1에 대한 사내 호환성 테스트가 완료되었습니다. 기존 1.9.0 기준 Component는 모두 정상 동작합니다.', author: { name: '한미경', id: '2071003', initial: '한' }, is_pinned: false, created_at: '2026-04-20' },
];

const MOCK_VOC = [
  { id: 'v1', title: '검색 필터에 "호환 버전" 조건 추가 요청', content: '홈에서 Component를 검색할 때 특정 Langflow 버전과 호환되는 것만 필터링할 수 있으면 좋겠습니다. 현재는 카드 안에 들어가서야 호환 여부를 확인할 수 있어요.', category: 'suggestion', author: { name: '김정호', id: '2074814', initial: '김' }, status: 'in-progress', upvotes: 12, comments: 3, created_at: '2026-04-29' },
  { id: 'v2', title: 'Flow 그래프 뷰에서 노드 드래그 기능', content: 'Flow 상세 페이지의 그래프가 정적이라 큰 Flow의 구조를 파악하기 어렵습니다. 노드를 드래그하거나 줌 인/아웃 할 수 있으면 좋겠어요.', category: 'suggestion', author: { name: '박지원', id: '2074821', initial: '박' }, status: 'open', upvotes: 8, comments: 1, created_at: '2026-04-30' },
  { id: 'v3', title: '업로드 시 README 자동 생성 기능 제안', content: 'Component 업로드할 때 코드에서 docstring, input/output을 자동 파싱해서 README 초안을 만들어주면 문서화 부담이 줄어들 것 같습니다.', category: 'suggestion', author: { name: '최서연', id: '2074803', initial: '최' }, status: 'open', upvotes: 15, comments: 5, created_at: '2026-04-27' },
  { id: 'v4', title: 'SmartChunker v1.2.0 다운로드 시 파일명 깨짐', content: '크롬 브라우저에서 SmartChunker를 다운로드하면 파일명이 UUID로 나옵니다. 원래 파일명(smart_chunker.py)으로 다운로드되어야 할 것 같아요.', category: 'bug', author: { name: '이창수', id: '2068420', initial: '이' }, status: 'resolved', upvotes: 4, comments: 2, created_at: '2026-04-26' },
  { id: 'v5', title: '심사 결과 Slack 알림 연동 가능한가요?', content: '제출한 Component의 심사 결과(승인/반려)를 Slack DM으로 받을 수 있나요? 매번 사이트에 들어와서 확인하는 게 번거롭습니다.', category: 'question', author: { name: '박지원', id: '2074821', initial: '박' }, status: 'open', upvotes: 9, comments: 2, created_at: '2026-04-28' },
];

// ─── Notice Board ───────────────────────────────────────────────────
function NoticePage() {
  const [selected, setSelected] = React.useState(null);

  const notice = selected ? MOCK_NOTICES.find(n => n.id === selected) : null;

  return (
    <div className="page fade-in">
      <div style={{marginBottom: 24}}>
        <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>Announcements</div>
        <div className="h1">공지사항</div>
        <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>AgentHub 운영 관련 공지사항을 확인하세요.</div>
      </div>

      {!selected ? (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          {MOCK_NOTICES.map((n, i) => (
            <div key={n.id} style={{
              padding: '18px 22px',
              borderBottom: i < MOCK_NOTICES.length - 1 ? '1px solid var(--line)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.12s',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }} onClick={() => setSelected(n.id)}
               onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
               onMouseOut={e => e.currentTarget.style.background = ''}>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="row gap-8" style={{marginBottom: 6}}>
                  {n.is_pinned && <span className="chip chip-accent" style={{fontSize: 10}}><Icons.Star size={9} filled/> 고정</span>}
                  <span style={{fontWeight: 700, fontSize: 15}}>{n.title}</span>
                </div>
                <div className="muted-sm" style={{display: 'flex', gap: 12}}>
                  <span>{n.author.name} ({n.author.id})</span>
                  <span>{n.created_at}</span>
                </div>
              </div>
              <Icons.ChevronRight size={14} style={{color: 'var(--text-4)', marginTop: 6}}/>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{marginBottom: 16}}>
            ← 목록으로
          </button>
          <div className="card card-pad" style={{padding: 28}}>
            <div className="row gap-8" style={{marginBottom: 8}}>
              {notice.is_pinned && <span className="chip chip-accent" style={{fontSize: 10}}><Icons.Star size={9} filled/> 고정</span>}
            </div>
            <h2 className="h2" style={{marginBottom: 12}}>{notice.title}</h2>
            <div className="row gap-8 muted-sm" style={{marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)'}}>
              <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{notice.author.initial}</div>
              <span style={{fontWeight: 500, color: 'var(--text-2)'}}>{notice.author.name}</span>
              <span className="mono">({notice.author.id})</span>
              <span>·</span>
              <span>{notice.created_at}</span>
            </div>
            <div style={{whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-2)', fontSize: 14}}>
              {notice.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VoC Board ──────────────────────────────────────────────────────
function VocPage() {
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort] = React.useState('popular');
  const [selected, setSelected] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);

  const catLabels = { suggestion: '제안', bug: '버그', question: '질문', other: '기타' };
  const statusLabels = { open: '접수', 'in-progress': '검토 중', resolved: '반영됨', closed: '종료' };
  const statusChip = { open: 'chip-neutral', 'in-progress': 'chip-warn', resolved: 'chip-ok', closed: 'chip-neutral' };

  const filtered = MOCK_VOC
    .filter(v => filter === 'all' || v.category === filter)
    .sort((a, b) => sort === 'popular' ? b.upvotes - a.upvotes : 0);

  const post = selected ? MOCK_VOC.find(v => v.id === selected) : null;

  if (selected && post) {
    return (
      <div className="page fade-in">
        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{marginBottom: 16}}>
          ← VoC 목록
        </button>
        <div className="card card-pad" style={{padding: 28}}>
          <div className="row gap-8" style={{marginBottom: 10}}>
            <span className={`chip ${statusChip[post.status]}`}>{statusLabels[post.status]}</span>
            <span className="chip chip-neutral">{catLabels[post.category]}</span>
          </div>
          <h2 className="h2" style={{marginBottom: 12}}>{post.title}</h2>
          <div className="row gap-8 muted-sm" style={{marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)'}}>
            <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{post.author.initial}</div>
            <span style={{fontWeight: 500, color: 'var(--text-2)'}}>{post.author.name}</span>
            <span className="mono">({post.author.id})</span>
            <span>·</span>
            <span>{post.created_at}</span>
            <span className="spacer"/>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icons.Star size={12}/> {post.upvotes}</span>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icons.Comment size={12}/> {post.comments}</span>
          </div>
          <div style={{whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-2)', fontSize: 14, marginBottom: 28}}>
            {post.content}
          </div>
          <div style={{borderTop: '1px solid var(--line)', paddingTop: 20}}>
            <div className="h3" style={{marginBottom: 14}}>댓글 {post.comments}개</div>
            <div style={{padding: 14, background: 'var(--bg-muted)', borderRadius: 8, marginBottom: 10}}>
              <div className="row gap-8" style={{marginBottom: 6}}>
                <div className="avatar sm" style={{background: '#dbeafe', color: '#1e40af'}}>정</div>
                <span style={{fontWeight: 600, fontSize: 13}}>정승현</span>
                <span className="muted-sm">· 1일 전</span>
              </div>
              <div style={{fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6}}>좋은 제안입니다. 다음 스프린트에 반영 검토하겠습니다.</div>
            </div>
            <div className="row gap-8" style={{marginTop: 16}}>
              <input className="input" placeholder="댓글 작성..." style={{flex: 1}}/>
              <button className="btn btn-accent btn-sm">작성</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24}}>
        <div>
          <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>Voice of Customer</div>
          <div className="h1">VoC 게시판</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>AgentHub에 대한 제안·버그·질문을 자유롭게 남겨주세요. 운영팀이 확인하고 답변드립니다.</div>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(!showForm)}>
          <Icons.Plus size={12}/> 새 글 작성
        </button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{marginBottom: 20}}>
          <div className="h3" style={{marginBottom: 14}}>새 VoC 작성</div>
          <div className="field">
            <label className="field-label">카테고리 <span className="req">*</span></label>
            <div className="segmented">
              <button className="segmented-item active">제안</button>
              <button className="segmented-item">버그</button>
              <button className="segmented-item">질문</button>
              <button className="segmented-item">기타</button>
            </div>
          </div>
          <div className="field">
            <label className="field-label">제목 <span className="req">*</span></label>
            <input className="input" placeholder="간결하게 한 줄로 요약해주세요"/>
          </div>
          <div className="field">
            <label className="field-label">내용 <span className="req">*</span></label>
            <textarea className="textarea" rows="4" placeholder="자세한 내용을 작성해주세요. 스크린샷이나 재현 방법이 있으면 더 좋습니다."/>
          </div>
          <div className="row gap-8" style={{justifyContent: 'flex-end'}}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>취소</button>
            <button className="btn btn-accent btn-sm"><Icons.Check size={11}/> 등록</button>
          </div>
        </div>
      )}

      <div className="row gap-8" style={{marginBottom: 20}}>
        <div className="segmented">
          {[['all', '전체'], ['suggestion', '제안'], ['bug', '버그'], ['question', '질문']].map(([v, l]) => (
            <button key={v} className={`segmented-item ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <div className="spacer"/>
        <div className="segmented">
          {[['popular', '인기순'], ['newest', '최신순']].map(([v, l]) => (
            <button key={v} className={`segmented-item ${sort===v?'active':''}`} onClick={() => setSort(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="col" style={{gap: 10}}>
        {filtered.map(v => (
          <div key={v.id} className="card" style={{padding: '16px 20px', cursor: 'pointer', transition: 'all 0.12s'}}
               onClick={() => setSelected(v.id)}
               onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
               onMouseOut={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
            <div className="row" style={{gap: 16}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 44}}>
                <button className="btn btn-icon btn-ghost" style={{color: 'var(--text-3)'}}><Icons.Star size={16}/></button>
                <span className="mono" style={{fontSize: 13, fontWeight: 700}}>{v.upvotes}</span>
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="row gap-8" style={{marginBottom: 6}}>
                  <span className={`chip ${statusChip[v.status]}`} style={{fontSize: 10.5}}>{statusLabels[v.status]}</span>
                  <span className="chip chip-neutral" style={{fontSize: 10.5}}>{catLabels[v.category]}</span>
                  <span style={{fontWeight: 700, fontSize: 14.5}}>{v.title}</span>
                </div>
                <div className="muted-sm" style={{display: 'flex', gap: 12}}>
                  <span>{v.author.name} ({v.author.id})</span>
                  <span>{v.created_at}</span>
                  <span><Icons.Comment size={11}/> {v.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { NoticePage, VocPage });
