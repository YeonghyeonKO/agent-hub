// Admin review dashboard

function PeopleHover({ id, name, initial, children, side = 'bottom' }) {
  const [open, setOpen] = React.useState(false);
  const person = (window.PEOPLE && window.PEOPLE[id]) || { id, name, initial: initial || (name ? name[0] : '?'), role: 'Member', org: '-', avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)' };
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
            <div><span className="muted-sm">{useI18n().t('label_role')}</span><span>{person.role}</span></div>
            <div><span className="muted-sm">{useI18n().t('label_org')}</span><span>{person.org}</span></div>
          </div>
        </div>
      )}
    </span>
  );
}

function AdminDashboard({ onBack, userRole }) {
  const { t } = useI18n();
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
        <a onClick={onBack} style={{cursor: 'pointer'}}>{t('admin_home')}</a>
        <span className="breadcrumb-sep">/</span>
        <span className="current">{t('admin_dashboard')}</span>
      </div>

      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24}}>
        <div>
          <h1 className="h1">{t('nav_admin')}</h1>
        </div>
        <div className="status-pills">
          <div className="status-pill" style={{background: 'var(--warn-bg)', borderColor: '#fde68a', color: 'var(--warn-fg)'}}>
            {t('admin_pending')} <span className="status-pill-num">{pendingList.length}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[
          ['pending', t('admin_pending'), pendingList.length],
          ['approved', t('admin_approved'), null],
          ['rejected', t('admin_rejected'), null],
          ...(userRole === 'admin' ? [['users', t('admin_users'), null], ['settings', t('admin_settings'), null]] : []),
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>
            {label} {count != null && count > 0 && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          {submissions.map(s => (
            <React.Fragment key={s.id}>
              <div className={`sub-row ${activeSubId === s.id ? 'active' : ''}`} onClick={() => setActiveSubId(activeSubId === s.id ? null : s.id)}>
                <div className="sub-row-top">
                  <div className="row gap-8" style={{flex: 1}}>
                    <span className={`chip chip-${s.type}`}>{s.type === 'py' ? '.py' : '.json'}</span>
                    <span className="sub-row-title">{s.title}</span>
                  </div>
                  <Icons.ChevronDown size={12} style={{transform: activeSubId === s.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--text-3)'}}/>
                </div>
                <div className="sub-row-meta">{s.author} · {s.submittedAgo}</div>
              </div>
              {activeSubId === s.id && (
                <div style={{borderBottom: '1px solid var(--line)', background: 'var(--bg-muted)'}}>
                  <div style={{padding: '16px 20px'}}>
                    <div style={{marginBottom: 16}}>
                      <ScoreSlider label="Functionality" value={scores.functionality} onChange={v => setScores(sc => ({...sc, functionality: v}))}/>
                      <ScoreSlider label="Originality" value={scores.originality} onChange={v => setScores(sc => ({...sc, originality: v}))}/>
                      <ScoreSlider label="Utility" value={scores.internalUtility} onChange={v => setScores(sc => ({...sc, internalUtility: v}))}/>
                      <ScoreSlider label="Documentation" value={scores.documentation} onChange={v => setScores(sc => ({...sc, documentation: v}))}/>
                    </div>
                    <div className="field" style={{marginBottom: 12}}>
                      <label className="field-label">Comment</label>
                      <textarea className="textarea" rows="2" value={comment} onChange={e => setComment(e.target.value)}/>
                    </div>
                    <div className="row gap-8" style={{justifyContent: 'flex-end'}}>
                      <button className="btn btn-danger btn-sm" onClick={handleReject}><Icons.X size={11}/> Reject</button>
                      <button className="btn btn-sm" style={{background: 'var(--ok)', color: 'white'}} onClick={handleApprove}><Icons.Check size={11}/> Approve</button>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          {submissions.length === 0 && <div className="empty-state" style={{padding: 30}}>No pending submissions</div>}
        </div>
      )}

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
  if (tab === 'approved') return <ApprovedTab/>;
  if (tab === 'rejected') return <RejectedTab/>;
  if (tab === 'users') return <UsersTab/>;
  if (tab === 'settings') return <SettingsTab/>;
  return null;
}

function ApprovedTab() {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const load = () => { api.admin.approved().then(setItems).catch(() => {}); };
  React.useEffect(load, []);
  const handleDelete = (id) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    api.admin.deleteComponent(id).then(load).catch(e => alert('Delete failed: ' + e.message));
  };
  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head"><div className="h3">{t('admin_approved')}</div></div>
      <div className="admin-tab-table">
        <div className="admin-tab-row admin-tab-head">
          <div>{t('col_name')}</div><div>{t('ranking_col_developer')}</div><div>{t('col_version')}</div><div>{t('col_star')}</div><div>{t('col_download')}</div><div></div><div></div>
        </div>
        {items.map(r => (
          <div key={r.id} className="admin-tab-row">
            <div className="row gap-8" style={{minWidth: 0}}>
              <span className={`chip chip-${r.type}`}>{r.type === 'py' ? '.py' : '.json'}</span>
              <span style={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.title}</span>
            </div>
            <div>{r.author?.name}</div>
            <div className="mono muted-sm">{r.version}</div>
            <div>{r.stars_count ?? 0}</div>
            <div>{r.downloads_count ?? 0}</div>
            <div className="muted-sm">{fmtDate(r.created_at)}</div>
            <div><button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)', fontSize: 11}} onClick={() => handleDelete(r.id)}><Icons.X size={10}/> {t('settings_remove')}</button></div>
          </div>
        ))}
        {items.length === 0 && <div className="empty-state" style={{padding: 30}}>No approved items</div>}
      </div>
    </div>
  );
}

function RejectedTab() {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const load = () => { api.admin.rejected().then(setItems).catch(() => {}); };
  React.useEffect(load, []);
  const handleDelete = (id) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    api.admin.deleteComponent(id).then(load).catch(e => alert('Delete failed: ' + e.message));
  };
  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head"><div className="h3">{t('admin_rejected')}</div></div>
      <div className="rejected-list">
        {items.map(r => (
          <div key={r.id} className="rejected-row">
            <div className="rejected-icon"><Icons.X size={14}/></div>
            <div style={{flex: 1, minWidth: 0}}>
              <div className="row gap-8" style={{marginBottom: 4}}>
                <span className={`chip chip-${r.type}`}>{r.type === 'py' ? '.py' : '.json'}</span>
                <span style={{fontWeight: 600}}>{r.title}</span>
                <span className="muted-sm">· {r.author?.name}</span>
                <span className="muted-sm">· {fmtDate(r.created_at)}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)', fontSize: 11}} onClick={() => handleDelete(r.id)}><Icons.X size={10}/> {t('settings_remove')}</button>
          </div>
        ))}
        {items.length === 0 && <div className="empty-state" style={{padding: 30}}>No rejected items</div>}
      </div>
    </div>
  );
}

function UsersTab() {
  const { t } = useI18n();
  const [users, setUsers] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const loadUsers = () => { api.admin.users().then(setUsers).catch(() => {}); };
  React.useEffect(loadUsers, []);

  const changeRole = (empId, newRole) => {
    api.admin.updateRole(empId, newRole).then(loadUsers).catch(e => console.error(e));
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.employee_id || '').includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head">
        <div>
          <div className="h3">{t('admin_users')}</div>
          <div className="muted-sm">{users.length} users</div>
        </div>
        <div className="nav-search" style={{width: 240, height: 32}}>
          <Icons.Search size={13}/>
          <input placeholder="Search name, ID, email..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 140px', gap: 14, padding: '12px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)'}}>
          <div>ID</div><div>Name</div><div>Team</div><div>Email</div><div>Role</div>
        </div>
        {filtered.map(u => (
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
                <option value="user">{t('role_user')}</option>
                <option value="admin">{t('role_admin')}</option>
                <option value="reviewer">{t('role_reviewer')}</option>
              </select>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="empty-state" style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
            {t('admin_no_users')}
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
  const { t } = useI18n();
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
      : { id, name, initial: name[0], role: 'Member', org: '-', avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)', primary: false };
    setReviewers(rs => [...rs, r]);
    setDraftReviewer({ id: '', name: '' });
  };

  const total = criteria.reduce((s, c) => s + c.value, 0);

  return (
    <div className="settings-grid">
      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>{t('settings_season')}</div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_season_desc')}</div>
        <EditableRow label={t('settings_season_name')} value={season.name} onChange={v => setField('name', v)}/>
        <EditableRow label={t('settings_submit_start')} type="date" value={season.submitStart} onChange={v => setField('submitStart', v)}/>
        <EditableRow label={t('settings_submit_end')} type="date" value={season.submitEnd} onChange={v => setField('submitEnd', v)}/>
        <EditableRow label={t('settings_review_end')} type="date" value={season.reviewEnd} onChange={v => setField('reviewEnd', v)}/>
        <EditableRow label={t('settings_award_day')} type="date" value={season.awardDay} onChange={v => setField('awardDay', v)}/>
      </div>

      <div className="card settings-card">
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4}}>
          <div className="h3">{t('settings_criteria')}</div>
          <span className={`muted-sm mono ${total === 100 ? '' : 'sf-warn'}`}>{t('settings_total')} {total}%</span>
        </div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_criteria_desc')}</div>
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
            placeholder={t('settings_new_criterion')}
            value={draftLabel}
            onChange={e => setDraftLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCriterion(); }}
            style={{flex: 1, fontSize: 12.5}}
          />
          <button className="btn btn-secondary btn-sm" onClick={addCriterion}>
            <Icons.Plus size={12}/> {t('settings_add_criterion')}
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>{t('settings_formula')}</div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_formula_desc')}</div>
        <div className="settings-formula">
          <span className="sf-token">Score</span>
          <span className="sf-op">=</span>
          <span className="sf-token sf-star">Star</span>
          <span className="sf-op">×</span>
          <span className="sf-num">2</span>
          <span className="sf-op">+</span>
          <span className="sf-token sf-dl">{t('col_download')}</span>
          <span className="sf-op">×</span>
          <span className="sf-num">1</span>
        </div>
        <SettingRow label={t('settings_self_star')} value="ON"/>
        <SettingRow label={t('settings_self_download')} value="ON"/>
      </div>

      <div className="card settings-card settings-card-wide">
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4}}>
          <div className="h3">{t('settings_reviewers')}</div>
          <span className="muted-sm mono">{reviewers.length}{t('settings_reviewers_count')}</span>
        </div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_reviewers_desc')}</div>
        <div className="reviewer-list">
          {reviewers.map(r => (
            <div key={r.id} className="reviewer-row">
              <PeopleHover id={r.id} name={r.name} initial={r.initial} side="top">
                <span className="people-trigger reviewer-row-person">
                  <div className="avatar sm" style={{background: r.avatarBg, color: r.avatarFg}}>{r.initial}</div>
                  <div style={{minWidth: 0}}>
                    <div className="reviewer-row-name">
                      {r.name}
                      {r.primary && <span className="chip chip-info" style={{fontSize: 10, marginLeft: 6}}>{t('settings_primary')}</span>}
                    </div>
                    <div className="muted-sm" style={{fontSize: 11}}>
                      <span className="mono">({r.id})</span> · {r.role}
                    </div>
                  </div>
                </span>
              </PeopleHover>
              <div className="row gap-8">
                {!r.primary && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setPrimary(r.id)} title={t('settings_set_primary')}>
                    <Icons.Star size={11}/>
                  </button>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => removeReviewer(r.id)} title={t('settings_remove')} disabled={reviewers.length <= 1}>
                  <Icons.X size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row gap-8" style={{marginTop: 12}}>
          <input
            className="input"
            placeholder={t('settings_emp_id')}
            value={draftReviewer.id}
            onChange={e => setDraftReviewer(d => ({...d, id: e.target.value}))}
            style={{width: 120, fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace'}}
          />
          <input
            className="input"
            placeholder={t('settings_name')}
            value={draftReviewer.name}
            onChange={e => setDraftReviewer(d => ({...d, name: e.target.value}))}
            style={{flex: 1, fontSize: 12.5}}
            onKeyDown={e => { if (e.key === 'Enter') addReviewer(); }}
          />
          <button className="btn btn-secondary btn-sm" onClick={addReviewer}>
            <Icons.Plus size={12}/> {t('settings_add')}
          </button>
        </div>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>{t('settings_compat')}</div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_compat_desc')}</div>
        <SettingRow label={t('settings_min_ver')} value="1.8.0"/>
        <SettingRow label={t('settings_rec_ver')} value="1.9.0"/>
        <SettingRow label={t('settings_readme_lang')} value="KR + EN"/>
        <SettingRow label={t('settings_secret_scan')} value="ON"/>
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
            <button className="setting-bar-remove" onClick={onRemove} aria-label="Remove">
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
