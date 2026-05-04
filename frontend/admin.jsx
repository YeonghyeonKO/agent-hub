// Admin review dashboard

function PeopleHover({ id, name, initial, children, side = 'bottom' }) {
  const [open, setOpen] = React.useState(false);
  const person = (window.PEOPLE && window.PEOPLE[id]) || { id, name, initial: initial || (name ? name[0] : '?'), role: '구성원', org: '-', avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)' };
  return (
    <span
      className="people-hover"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <div className={`people-card people-card-${side}`} role="tooltip">
          <div className="people-card-row">
            <div className="avatar lg" style={{background: person.avatarBg, color: person.avatarFg}}>{person.initial}</div>
            <div style={{minWidth: 0}}>
              <div className="people-card-name">{person.name}</div>
              <div className="people-card-id mono">({person.id})</div>
            </div>
          </div>
          <div className="people-card-meta">
            <div><span className="muted-sm">직무</span><span>{person.role}</span></div>
            <div><span className="muted-sm">소속</span><span>{person.org}</span></div>
          </div>
        </div>
      )}
    </span>
  );
}

function AdminDashboard({ onBack }) {
  const [activeTab, setActiveTab] = React.useState('pending');
  const [pendingList, setPendingList] = React.useState([]);
  const [activeSubId, setActiveSubId] = React.useState(null);
  const [scores, setScores] = React.useState({
    functionality: 9,
    originality: 8,
    internalUtility: 10,
    documentation: 8,
  });
  const [comment, setComment] = React.useState('');

  // Fetch pending submissions from API
  const loadPending = () => {
    api.admin.pending().then(d => {
      const items = (d || []).map(c => ({
        id: c.id, type: c.type, title: c.title,
        author: c.author?.name || '', authorId: c.author?.employee_id || '',
        authorInitial: (c.author?.name || '?')[0],
        version: c.version,
        minLF: c.min_langflow_ver, maxLF: c.max_langflow_ver,
        submittedAgo: fmtDate(c.created_at), status: 'pending', flagged: false,
      }));
      setPendingList(items);
      if (items.length > 0 && !activeSubId) setActiveSubId(items[0].id);
    }).catch(() => setPendingList(SUBMISSIONS));
  };
  React.useEffect(loadPending, []);

  const handleApprove = () => {
    if (!activeSubId) return;
    api.admin.review(activeSubId, { scores, comment, decision: 'approve' })
      .then(() => { loadPending(); setComment(''); })
      .catch(e => console.error(e));
  };
  const handleReject = () => {
    if (!activeSubId) return;
    api.admin.review(activeSubId, { scores, comment, decision: 'reject' })
      .then(() => { loadPending(); setComment(''); })
      .catch(e => console.error(e));
  };

  const submissions = pendingList.length > 0 ? pendingList : SUBMISSIONS;
  const activeSub = submissions.find(s => s.id === activeSubId) || submissions[0];

  return (
    <div className="page fade-in">
      <div className="breadcrumb">
        <a onClick={onBack} style={{cursor: 'pointer'}}>홈</a>
        <span className="breadcrumb-sep">/</span>
        <span className="current">관리자 대시보드</span>
      </div>

      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24}}>
        <div>
          <h1 className="h1">관리자 대시보드</h1>
          <div className="muted" style={{marginTop: 6, fontSize: 13.5}}>
            2026년 상반기 · 제출 마감 D-23 · 심사위원 3명
          </div>
        </div>
        <div className="status-pills">
          <div className="status-pill" style={{background: 'var(--warn-bg)', borderColor: '#fde68a', color: 'var(--warn-fg)'}}>
            심사 대기 <span className="status-pill-num">12</span>
          </div>
          <div className="status-pill" style={{background: 'var(--ok-bg)', borderColor: '#bbf7d0', color: 'var(--ok-fg)'}}>
            승인 <span className="status-pill-num">47</span>
          </div>
          <div className="status-pill" style={{background: 'var(--err-bg)', borderColor: '#fecaca', color: 'var(--err-fg)'}}>
            반려 <span className="status-pill-num">3</span>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{marginBottom: 24}}>
        <Stat label="총 제출" value="62" icon={<Icons.Upload size={12}/>} delta="+8 이번 주"/>
        <Stat label="참여 인원" value="38명" icon={<Icons.Users size={12}/>}/>
        <Stat label="총 다운로드" value="2,481" icon={<Icons.Download size={12}/>} delta="+312 이번 주"/>
        <Stat label="평균 심사 시간" value="1.4일" icon={<Icons.Clock size={12}/>}/>
      </div>

      <div className="tabs">
        {[
          ['pending', '심사 대기', 12, '자동 검증을 통과하고 심사원 검토를 기다리는 제출건'],
          ['approved', '승인됨', 47, '심사 완료 · 홈에 게시중인 Component·Flow'],
          ['rejected', '반려됨', 3, '반려 사유와 재제출 이력을 추적'],
          ['issues', '신고 / 이슈', 2, '사용자 신고·버그·보안 이슈를 조치'],
          ['users', '사용자 관리', null, '사용자 목록 및 역할 관리'],
          ['settings', '설정', null, '시즌 기간, 심사 기준, 랭킹 정책 세팅'],
        ].map(([id, label, count, desc]) => (
          <button key={id} className={`tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)} title={desc}>
            {label} {count != null && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      <div className="tab-desc">
        {{
          pending: '자동 검증을 통과하고 심사원 검토를 기다리는 제출건을 점수·심사평과 함께 승인·반려합니다.',
          approved: '심사를 통과해 홈에 게시 중인 Component·Flow 목록. 게시 중단 및 버전 관리가 가능합니다.',
          rejected: '반려 사유, 재제출 여부, 재심사 이력을 추적합니다.',
          issues: '사용자가 신고한 문제, 자동 보안 스캔 경고, 버그 리포트를 모아 조치합니다.',
          users: '등록된 사용자 목록을 확인하고, 역할(일반/관리자/심사위원)을 변경합니다.',
          settings: '이번 시즌의 제출 기간, 심사 항목 가중치, 랭킹 점수 공식, 최소 호환 버전을 설정합니다.',
        }[activeTab]}
      </div>

      <div className="admin-grid" style={{display: activeTab === 'pending' ? 'grid' : 'none'}}>
        {/* Submission list */}
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <div style={{padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <span className="h3">제출</span>
            <button className="btn btn-sm btn-ghost"><Icons.Sort size={11}/> 정렬</button>
          </div>
          {SUBMISSIONS.map(s => (
            <div key={s.id} className={`sub-row ${activeSubId === s.id ? 'active' : ''}`} onClick={() => setActiveSubId(s.id)}>
              <div className="sub-row-top">
                <div className="row gap-8">
                  <span className={`chip chip-${s.type}`}>{s.type === 'py' ? '.py' : '.json'}</span>
                  <span className="sub-row-title">{s.title}</span>
                </div>
                {s.flagged && <span className="chip chip-warn"><Icons.Warn size={10}/> 점검</span>}
              </div>
              <div className="sub-row-meta">
                <PeopleHover id={s.authorId} name={s.author} initial={s.authorInitial}><span className="people-trigger">{s.author} <span className="mono">({s.authorId})</span></span></PeopleHover> · {s.submittedAgo}
              </div>
              <div className="sub-row-version">
                Langflow {s.legacy ? `${s.minLF} 만 (구버전)` : `${s.minLF} ~ ${s.maxLF}`}
              </div>
            </div>
          ))}
          <div style={{padding: 14, textAlign: 'center', borderTop: '1px solid var(--line)'}}>
            <button className="btn btn-sm btn-ghost">+ 8개 더 보기</button>
          </div>
        </div>

        {/* Active submission review pane */}
        <div className="review-card">
          <div className="review-card-header">
            <div className="row" style={{gap: 14}}>
              <div className={`detail-icon ${activeSub.type}`} style={{width: 48, height: 48, borderRadius: 10}}>
                {activeSub.type === 'py' ? <Icons.Scissors size={20}/> : <Icons.Database size={20}/>}
              </div>
              <div>
                <div className="detail-eyebrow">
                  <span className={`chip chip-${activeSub.type}`}>{activeSub.type === 'py' ? '.py' : '.json'}</span>
                  <span>{activeSub.type === 'py' ? 'Component' : 'Flow'}</span>
                  <span className="breadcrumb-sep">·</span>
                  <span>{activeSub.version}</span>
                </div>
                <div style={{fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em'}}>{activeSub.title}</div>
                <div className="row gap-8" style={{marginTop: 6}}>
                  <PeopleHover id={activeSub.authorId} name={activeSub.author} initial={activeSub.authorInitial}>
                    <span className="people-trigger row gap-8">
                      <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{activeSub.authorInitial}</div>
                      <span style={{fontSize: 12.5, fontWeight: 500}}>{activeSub.author}</span>
                      <span className="mono muted-sm">({activeSub.authorId})</span>
                    </span>
                  </PeopleHover>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm"><Icons.Eye size={12}/> 미리보기</button>
          </div>

          <div className="review-card-body">
            <div className="val-card">
              <div className="val-card-title">자동 검증 결과</div>
              <div className="checklist">
                <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>파일 형식 유효 (.py)</div>
                <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>호환 버전 명시됨</div>
                <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>사내 표준(1.9.0) 호환</div>
                <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>임포트 검증 통과</div>
                <div className="check-item"><div className="check-icon warn"><Icons.Warn size={9}/></div>외부 패키지 2개 필요</div>
                <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>비밀키 노출 없음</div>
              </div>
            </div>

            <div style={{marginBottom: 18}}>
              <div className="h3" style={{marginBottom: 4}}>심사 점수</div>
              <div className="muted-sm" style={{fontSize: 11.5, marginBottom: 8}}>각 항목 1-10점 · 평균 {((scores.functionality+scores.originality+scores.internalUtility+scores.documentation)/4).toFixed(1)}점</div>
              <ScoreSlider label="기능성 / 완성도" value={scores.functionality} onChange={v => setScores(s => ({...s, functionality: v}))}/>
              <ScoreSlider label="독창성" value={scores.originality} onChange={v => setScores(s => ({...s, originality: v}))}/>
              <ScoreSlider label="사내 활용도" value={scores.internalUtility} onChange={v => setScores(s => ({...s, internalUtility: v}))}/>
              <ScoreSlider label="문서화 품질" value={scores.documentation} onChange={v => setScores(s => ({...s, documentation: v}))}/>
            </div>

            <div className="field" style={{marginBottom: 0}}>
              <label className="field-label">심사평 <span className="muted-sm" style={{fontWeight: 400}}>(개발자에게 공개)</span></label>
              <textarea className="textarea" rows="3" value={comment} onChange={e => setComment(e.target.value)}/>
            </div>
          </div>

          <div className="review-card-footer">
            <div className="muted-sm" style={{fontSize: 12}}>
              <Icons.Users size={11}/> 심사위원 3명 중 <strong style={{color: 'var(--text)'}}>1명 완료</strong>
            </div>
            <div className="row gap-8">
              <button className="btn btn-danger btn-sm" onClick={handleReject}><Icons.X size={11}/> 반려</button>
              <button className="btn btn-sm" style={{background: 'var(--ok)', color: 'white'}} onClick={handleApprove}><Icons.Check size={11}/> 승인 + 게시</button>
            </div>
          </div>
        </div>
      </div>

      {activeTab !== 'pending' && <AdminTabPanel tab={activeTab}/>}
    </div>
  );
}

// ─── Other admin tabs ────────────────────────────────────────────────
const APPROVED_ROWS = [
  { id: 'cmp-001', title: 'SmartChunker', type: 'py', author: '고영현', authorId: '2074795', approvedAgo: '2일 전', stars: 134, downloads: 412, version: '1.4.0' },
  { id: 'cmp-008', title: 'KoreanReranker', type: 'py', author: '고영현', authorId: '2074795', approvedAgo: '5일 전', stars: 64, downloads: 198, version: '0.9.2' },
  { id: 'flw-003', title: '사내 위키 RAG', type: 'json', author: '김정호', authorId: '2074814', approvedAgo: '1주 전', stars: 88, downloads: 271, version: '2.1.0' },
  { id: 'cmp-014', title: 'PDF Layout Parser', type: 'py', author: '고영현', authorId: '2074795', approvedAgo: '1주 전', stars: 51, downloads: 142, version: '1.5.2' },
  { id: 'flw-007', title: 'Slack 답변 봇', type: 'json', author: '최서연', authorId: '2074803', approvedAgo: '2주 전', stars: 42, downloads: 96, version: '1.2.0' },
];

const REJECTED_ROWS = [
  { id: 'cmp-022', title: 'CustomEmbedder v0.1', author: '오민수', authorId: '2074842', rejectedAgo: '3일 전', reason: '외부 패키지 라이선스 미확인 (GPL)', resubmitted: false },
  { id: 'flw-011', title: '메일 자동 응답 Flow', author: '정하늘', authorId: '2074856', rejectedAgo: '1주 전', reason: '비밀키 하드코딩 발견', resubmitted: true },
  { id: 'cmp-019', title: 'TableExtractor', author: '강민지', authorId: '2074867', rejectedAgo: '2주 전', reason: 'Langflow 1.7 호환성 미충족', resubmitted: false },
];

const ISSUE_ROWS = [
  { id: 'iss-014', target: 'SmartChunker v1.4.0', kind: 'security', severity: 'high', reporter: '보안팀 자동스캔', reportedAgo: '6시간 전', summary: '새로 추가된 의존성에서 CVE-2026-1842 탐지' },
  { id: 'iss-013', target: '사내 위키 RAG v2.1.0', kind: 'bug', severity: 'medium', reporter: '한지원', reporterId: '2074879', reportedAgo: '1일 전', summary: 'PDF 입력 시 한국어 표 셀이 잘림' },
];

function AdminTabPanel({ tab }) {
  if (tab === 'approved') {
    return (
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div className="admin-panel-head">
          <div>
            <div className="h3">게시 중인 Component · Flow</div>
            <div className="muted-sm">총 47건 · 최신 승인 순</div>
          </div>
          <div className="row gap-8">
            <button className="btn btn-secondary btn-sm"><Icons.Filter size={11}/> 필터</button>
            <button className="btn btn-secondary btn-sm"><Icons.Download size={11}/> CSV 내보내기</button>
          </div>
        </div>
        <div className="admin-tab-table">
          <div className="admin-tab-row admin-tab-head">
            <div>제목</div><div>개발자</div><div>버전</div><div>Star</div><div>다운로드</div><div>승인일</div><div></div>
          </div>
          {APPROVED_ROWS.map(r => (
            <div key={r.id} className="admin-tab-row">
              <div className="row gap-8" style={{minWidth: 0}}>
                <span className={`chip chip-${r.type}`}>{r.type === 'py' ? '.py' : '.json'}</span>
                <span style={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.title}</span>
              </div>
              <div className="row gap-8" style={{minWidth: 0}}>
                <PeopleHover id={r.authorId} name={r.author}>
                  <span className="people-trigger row gap-8">
                    <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)', fontSize: 10}}>{r.author[0]}</div>
                    <span style={{fontSize: 12.5}}>{r.author}</span>
                    <span className="mono muted-sm">({r.authorId})</span>
                  </span>
                </PeopleHover>
              </div>
              <div className="mono muted-sm">{r.version}</div>
              <div><Icons.Star size={11}/> {r.stars}</div>
              <div><Icons.Download size={11}/> {r.downloads}</div>
              <div className="muted-sm">{r.approvedAgo}</div>
              <div className="row gap-8">
                <button className="btn btn-sm btn-ghost" title="상세 보기"><Icons.Eye size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'rejected') {
    return (
      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <div className="admin-panel-head">
          <div>
            <div className="h3">반려된 제출</div>
            <div className="muted-sm">총 3건 · 반려 사유 및 재제출 이력</div>
          </div>
        </div>
        <div className="rejected-list">
          {REJECTED_ROWS.map(r => (
            <div key={r.id} className="rejected-row">
              <div className="rejected-icon"><Icons.X size={14}/></div>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="row gap-8" style={{marginBottom: 4, flexWrap: 'wrap'}}>
                  <span style={{fontWeight: 600}}>{r.title}</span>
                  <PeopleHover id={r.authorId} name={r.author}>
                    <span className="people-trigger muted-sm">· {r.author} <span className="mono">({r.authorId})</span></span>
                  </PeopleHover>
                  <span className="muted-sm">· {r.rejectedAgo}</span>
                  {r.resubmitted && <span className="chip chip-info" style={{fontSize: 10.5}}>재제출됨</span>}
                </div>
                <div className="rejected-reason"><Icons.Warn size={11}/> {r.reason}</div>
              </div>
              <button className="btn btn-secondary btn-sm">상세</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'issues') {
    return (
      <div className="col" style={{gap: 12}}>
        {ISSUE_ROWS.map(i => (
          <div key={i.id} className={`issue-card sev-${i.severity}`}>
            <div className="issue-card-head">
              <div className="row gap-8">
                <span className={`issue-sev sev-${i.severity}`}>{i.severity === 'high' ? '높음' : i.severity === 'medium' ? '중간' : '낮음'}</span>
                <span className="chip" style={{background: 'var(--bg-muted)', color: 'var(--text-2)', fontSize: 11}}>
                  {i.kind === 'security' ? '🔒 보안' : i.kind === 'bug' ? '🐛 버그' : '🚩 신고'}
                </span>
                <span className="mono muted-sm">{i.id}</span>
              </div>
              <span className="muted-sm">{i.reportedAgo}</span>
            </div>
            <div className="issue-card-title">{i.target}</div>
            <div className="issue-card-summary">{i.summary}</div>
            <div className="issue-card-foot">
              <span className="muted-sm"><Icons.Users size={11}/> {i.reporterId ? <PeopleHover id={i.reporterId} name={i.reporter}><span className="people-trigger">{i.reporter} <span className="mono" style={{color: 'var(--text-3)'}}>({i.reporterId})</span></span></PeopleHover> : i.reporter}</span>
              <div className="row gap-8">
                <button className="btn btn-secondary btn-sm">조사 시작</button>
                <button className="btn btn-sm btn-danger"><Icons.Eye size={11}/> 게시 중단</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'users') {
    return <UsersTab/>;
  }

  if (tab === 'settings') {
    return <SettingsTab/>;
  }

  return null;
}

function UsersTab() {
  const [users, setUsers] = React.useState([]);
  const loadUsers = () => { api.admin.users().then(setUsers).catch(() => {}); };
  React.useEffect(loadUsers, []);

  const roleLabels = { user: '일반', admin: '관리자', reviewer: '심사위원' };
  const roleChip = { user: 'chip-neutral', admin: 'chip-accent', reviewer: 'chip-ok' };

  const changeRole = (empId, newRole) => {
    api.admin.updateRole(empId, newRole).then(loadUsers).catch(e => console.error(e));
  };

  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head">
        <div>
          <div className="h3">사용자 관리</div>
          <div className="muted-sm">{users.length}명 등록</div>
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 140px', gap: 14, padding: '12px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)'}}>
          <div>사번</div><div>이름</div><div>소속</div><div>이메일</div><div>역할</div>
        </div>
        {users.map(u => (
          <div key={u.employee_id} style={{display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 140px', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center', fontSize: 13}}>
            <div className="mono" style={{fontWeight: 600}}>{u.employee_id}</div>
            <div className="row gap-8">
              <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{(u.name || '?')[0]}</div>
              <span>{u.name}</span>
            </div>
            <div className="muted-sm">{u.team || u.org || '-'}</div>
            <div className="muted-sm" style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{u.email || '-'}</div>
            <div>
              <select className="select" style={{fontSize: 12, padding: '4px 8px', height: 30}} value={u.role} onChange={e => changeRole(u.employee_id, e.target.value)}>
                <option value="user">일반</option>
                <option value="admin">관리자</option>
                <option value="reviewer">심사위원</option>
              </select>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="empty-state" style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
            등록된 사용자가 없습니다. Keycloak SSO로 로그인하면 자동 등록됩니다.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings tab ────────────────────────────────────────────────
const DEFAULT_CRITERIA = [
  { id: 'c1', label: '기능성 / 완성도', value: 35 },
  { id: 'c2', label: '독창성', value: 20 },
  { id: 'c3', label: '사내 활용도', value: 30 },
  { id: 'c4', label: '문서화 품질', value: 15 },
];

function SettingsTab() {
  const [season, setSeason] = React.useState({
    name: '2026 상반기',
    submitStart: '2026-01-15',
    submitEnd: '2026-05-23',
    reviewEnd: '2026-06-07',
    awardDay: '2026-06-21',
  });
  const [criteria, setCriteria] = React.useState(DEFAULT_CRITERIA);
  const [draftLabel, setDraftLabel] = React.useState('');
  const [reviewers, setReviewers] = React.useState(REVIEWERS);
  const [draftReviewer, setDraftReviewer] = React.useState({ id: '', name: '' });

  const setField = (k, v) => setSeason(s => ({ ...s, [k]: v }));
  const setWeight = (id, v) => setCriteria(cs => cs.map(c => c.id === id ? { ...c, value: v } : c));
  const setLabel = (id, v) => setCriteria(cs => cs.map(c => c.id === id ? { ...c, label: v } : c));
  const removeCriterion = (id) => setCriteria(cs => cs.filter(c => c.id !== id));
  const addCriterion = () => {
    if (!draftLabel.trim()) return;
    setCriteria(cs => [...cs, { id: 'c' + Date.now(), label: draftLabel.trim(), value: 10 }]);
    setDraftLabel('');
  };
  const removeReviewer = (id) => setReviewers(rs => rs.filter(r => r.id !== id));
  const setPrimary = (id) => setReviewers(rs => rs.map(r => ({ ...r, primary: r.id === id })));
  const addReviewer = () => {
    const id = draftReviewer.id.trim();
    const name = draftReviewer.name.trim();
    if (!id || !name) return;
    const existing = (window.PEOPLE && window.PEOPLE[id]) || null;
    const r = existing
      ? { ...existing, primary: false }
      : { id, name, initial: name[0], role: '구성원', org: '-', avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)', primary: false };
    setReviewers(rs => [...rs, r]);
    setDraftReviewer({ id: '', name: '' });
  };

  const total = criteria.reduce((s, c) => s + c.value, 0);

  return (
    <div className="settings-grid">
      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>시즌 일정</div>
        <div className="muted-sm" style={{marginBottom: 14}}>현재 시즌의 제출·심사 기간</div>
        <EditableRow label="시즌명" value={season.name} onChange={v => setField('name', v)}/>
        <EditableRow label="제출 시작" type="date" value={season.submitStart} onChange={v => setField('submitStart', v)}/>
        <EditableRow label="제출 마감" type="date" value={season.submitEnd} onChange={v => setField('submitEnd', v)}/>
        <EditableRow label="심사 마감" type="date" value={season.reviewEnd} onChange={v => setField('reviewEnd', v)}/>
        <EditableRow label="시상식" type="date" value={season.awardDay} onChange={v => setField('awardDay', v)}/>
      </div>

      <div className="card settings-card">
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4}}>
          <div className="h3">심사 항목 / 가중치</div>
          <span className={`muted-sm mono ${total === 100 ? '' : 'sf-warn'}`}>합계 {total}%</span>
        </div>
        <div className="muted-sm" style={{marginBottom: 14}}>항목 추가·삭제 및 가중치 조정 (합계 100% 권장)</div>
        {criteria.map(c => (
          <EditableBar
            key={c.id}
            label={c.label}
            value={c.value}
            onLabelChange={v => setLabel(c.id, v)}
            onChange={v => setWeight(c.id, v)}
            onRemove={() => removeCriterion(c.id)}
            removable={criteria.length > 1}
          />
        ))}
        <div className="row gap-8" style={{marginTop: 10}}>
          <input
            className="input"
            placeholder="새 심사 항목명"
            value={draftLabel}
            onChange={e => setDraftLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCriterion(); }}
            style={{flex: 1, fontSize: 12.5}}
          />
          <button className="btn btn-secondary btn-sm" onClick={addCriterion}>
            <Icons.Plus size={12}/> 항목 추가
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>랭킹 점수 공식</div>
        <div className="muted-sm" style={{marginBottom: 14}}>매일 오전 9시 갱신</div>
        <div className="settings-formula">
          <span className="sf-token">Score</span>
          <span className="sf-op">=</span>
          <span className="sf-token sf-star">Star</span>
          <span className="sf-op">×</span>
          <span className="sf-num">2</span>
          <span className="sf-op">+</span>
          <span className="sf-token sf-dl">{(useI18n().t('col_download'))}</span>
          <span className="sf-op">×</span>
          <span className="sf-num">1</span>
        </div>
        <SettingRow label="자기 Star 제외" value="ON"/>
        <SettingRow label="자기 다운로드 제외" value="ON"/>
      </div>

      <div className="card settings-card settings-card-wide">
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4}}>
          <div className="h3">심사위원</div>
          <span className="muted-sm mono">{reviewers.length}명</span>
        </div>
        <div className="muted-sm" style={{marginBottom: 14}}>심사 대기건을 검토하는 구성원. 대표 심사위원은 충돌 시 결정권을 가집니다.</div>
        <div className="reviewer-list">
          {reviewers.map(r => (
            <div key={r.id} className="reviewer-row">
              <PeopleHover id={r.id} name={r.name} initial={r.initial} side="top">
                <span className="people-trigger reviewer-row-person">
                  <div className="avatar sm" style={{background: r.avatarBg, color: r.avatarFg}}>{r.initial}</div>
                  <div style={{minWidth: 0}}>
                    <div className="reviewer-row-name">
                      {r.name}
                      {r.primary && <span className="chip chip-info" style={{fontSize: 10, marginLeft: 6}}>대표</span>}
                    </div>
                    <div className="muted-sm" style={{fontSize: 11}}>
                      <span className="mono">({r.id})</span> · {r.role}
                    </div>
                  </div>
                </span>
              </PeopleHover>
              <div className="row gap-8">
                {!r.primary && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setPrimary(r.id)} title="대표 심사위원으로 지정">
                    <Icons.Star size={11}/>
                  </button>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => removeReviewer(r.id)} title="제거" disabled={reviewers.length <= 1}>
                  <Icons.X size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row gap-8" style={{marginTop: 12}}>
          <input
            className="input"
            placeholder="사번"
            value={draftReviewer.id}
            onChange={e => setDraftReviewer(d => ({...d, id: e.target.value}))}
            style={{width: 120, fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace'}}
          />
          <input
            className="input"
            placeholder="이름"
            value={draftReviewer.name}
            onChange={e => setDraftReviewer(d => ({...d, name: e.target.value}))}
            style={{flex: 1, fontSize: 12.5}}
            onKeyDown={e => { if (e.key === 'Enter') addReviewer(); }}
          />
          <button className="btn btn-secondary btn-sm" onClick={addReviewer}>
            <Icons.Plus size={12}/> 추가
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>호환성 / 표준</div>
        <div className="muted-sm" style={{marginBottom: 14}}>업로드 시 자동 검증</div>
        <SettingRow label="최소 Langflow 버전" value="1.8.0"/>
        <SettingRow label="권장 버전" value="1.9.0"/>
        <SettingRow label="필수 README 언어" value="한글 + 영문"/>
        <SettingRow label="비밀키 자동 스캔" value="ON"/>
      </div>
    </div>
  );
}

function EditableRow({ label, value, onChange, type = 'text' }) {
  return (
    <div className="setting-row setting-row-edit">
      <span className="setting-row-label">{label}</span>
      <input
        type={type}
        className="setting-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function EditableBar({ label, value, onLabelChange, onChange, onRemove, removable }) {
  return (
    <div className="setting-bar">
      <div className="setting-bar-head">
        <input
          className="setting-input setting-input-flush"
          value={label}
          onChange={e => onLabelChange(e.target.value)}
        />
        <div className="row gap-8" style={{alignItems: 'center'}}>
          <span className="setting-row-value mono">{value}%</span>
          {removable && (
            <button className="setting-bar-remove" onClick={onRemove} aria-label="삭제">
              <Icons.X size={11}/>
            </button>
          )}
        </div>
      </div>
      <div className="setting-bar-track" style={{position: 'relative'}}>
        <div className="setting-bar-fill" style={{width: `${value}%`}}/>
        <input
          type="range" min="0" max="100" step="1" value={value}
          onChange={e => onChange(parseInt(e.target.value, 10))}
          className="native-slider"
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}}
        />
      </div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="setting-row">
      <span className="setting-row-label">{label}</span>
      <span className="setting-row-value">{value}</span>
    </div>
  );
}

function SettingBar({ label, value }) {
  return (
    <div className="setting-bar">
      <div className="setting-bar-head">
        <span className="setting-row-label">{label}</span>
        <span className="setting-row-value">{value}%</span>
      </div>
      <div className="setting-bar-track"><div className="setting-bar-fill" style={{width: `${value}%`}}/></div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange }) {
  const pct = (value / 10) * 100;
  return (
    <div style={{padding: '8px 0'}}>
      <div className="label-row">
        <div className="score-label">{label}</div>
        <div className="score-value">{value} / 10</div>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{width: `${pct}%`}}/>
        <div className="slider-thumb" style={{left: `${pct}%`}}/>
        <input
          type="range" className="native-slider"
          min="0" max="10" step="1" value={value}
          onChange={e => onChange(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
