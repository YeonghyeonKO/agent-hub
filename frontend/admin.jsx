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

function AdminDashboard({ onBack, userRole, onOpenComponent }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = React.useState('pending');
  const [pendingList, setPendingList] = React.useState([]);
  const [pendingLoading, setPendingLoading] = React.useState(true);
  const [activeSubId, setActiveSubId] = React.useState(null);
  const [criteria, setCriteria] = React.useState([]);
  const [scores, setScores] = React.useState({});
  const [comment, setComment] = React.useState('');

  // Load criteria from settings API
  React.useEffect(() => {
    api.get('/admin/settings/public').then(d => {
      if (d && d.criteria_weights) {
        const keys = Object.keys(d.criteria_weights);
        setCriteria(keys);
        const init = {};
        keys.forEach(k => { init[k] = 8; });
        setScores(init);
      }
    }).catch(() => {});
  }, []);

  // Fetch pending submissions from API
  const loadPending = () => {
    setPendingLoading(true);
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
    }).catch(() => setPendingList([])).finally(() => setPendingLoading(false));
  };
  React.useEffect(loadPending, []);

  const [selected, setSelected] = React.useState([]);
  React.useEffect(() => setSelected([]), [pendingList]);
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(prev => prev.length === pendingList.length ? [] : pendingList.map(s => s.id));

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
  const handleBulkApprove = () => {
    if (selected.length === 0) return;
    if (!confirm(`${selected.length}건을 일괄 승인하시겠습니까?`)) return;
    api.admin.bulkReview({ component_ids: selected, scores, comment, decision: 'approve' })
      .then(() => { loadPending(); setSelected([]); setComment(''); })
      .catch(e => console.error(e));
  };

  const submissions = pendingList;
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
          ['rejected', t('tab_deleted'), null],
          ...(['admin', 'manager'].includes(userRole) ? [['statistics', t('admin_statistics') || 'Statistics', null]] : []),
          ...(userRole === 'admin' ? [['users', t('admin_users'), null], ['settings', t('admin_settings'), null]] : []),
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>
            {label} {count != null && count > 0 && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          {submissions.length > 0 && (
            <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)'}}>
              <input type="checkbox" checked={selected.length === submissions.length && submissions.length > 0} onChange={toggleSelectAll} style={{cursor: 'pointer'}}/>
              <span style={{fontSize: 12, color: 'var(--text-3)'}}>{selected.length > 0 ? `${selected.length}건 선택됨` : '전체 선택'}</span>
              {selected.length > 0 && (
                <button className="btn btn-sm" style={{background: 'var(--ok)', color: 'white', marginLeft: 'auto'}} onClick={handleBulkApprove}>
                  <Icons.Check size={11}/> 일괄 승인 ({selected.length})
                </button>
              )}
            </div>
          )}
          {submissions.map(s => (
            <React.Fragment key={s.id}>
              <div className={`sub-row ${activeSubId === s.id ? 'active' : ''}`} onClick={() => setActiveSubId(activeSubId === s.id ? null : s.id)}>
                <div className="sub-row-top">
                  <div className="row gap-8" style={{flex: 1}}>
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(s.id); }} onClick={(e) => e.stopPropagation()} style={{cursor: 'pointer'}}/>
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
                    <div style={{marginBottom: 14}}>
                      <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); if (onOpenComponent) onOpenComponent({ id: s.id, type: s.type, title: s.title }); }}>
                        <Icons.Eye size={12}/> 미리보기 (코드 · 다운로드)
                      </button>
                    </div>
                    <div style={{marginBottom: 16}}>
                      {criteria.map(key => (
                        <ScoreSlider key={key} label={key} value={scores[key] ?? 8} onChange={v => setScores(sc => ({...sc, [key]: v}))}/>
                      ))}
                      {criteria.length === 0 && <div className="muted-sm" style={{padding: 8}}>설정 &gt; 심사항목을 먼저 등록해주세요.</div>}
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
          {pendingLoading && <LoadingIndicator/>}
          {!pendingLoading && submissions.length === 0 && <div className="empty-state" style={{padding: 30}}>No pending submissions</div>}
        </div>
      )}

      {activeTab !== 'pending' && <AdminTabPanel tab={activeTab} onOpenComponent={onOpenComponent}/>}
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

function AdminTabPanel({ tab, onOpenComponent }) {
  if (tab === 'approved') return <ApprovedTab onOpenComponent={onOpenComponent}/>;
  if (tab === 'rejected') return <RejectedDeletedTab onOpenComponent={onOpenComponent}/>;
  if (tab === 'statistics') return <StatisticsTab/>;
  if (tab === 'users') return <UsersTab/>;
  if (tab === 'settings') return <SettingsTab/>;
  return null;
}

function ApprovedTab({ onOpenComponent }) {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showCount, setShowCount] = React.useState(20);
  const load = () => { setLoading(true); api.admin.approved().then(setItems).catch(() => {}).finally(() => setLoading(false)); };
  React.useEffect(load, []);
  const visible = items.slice(0, showCount);
  const handleDelete = (id) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    api.admin.deleteComponent(id).then(load).catch(e => alert('Delete failed: ' + e.message));
  };
  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head"><div className="h3">{t('admin_approved')}</div></div>
      <div className="admin-tab-table">
        <div className="admin-tab-row admin-tab-head">
          <div>{t('col_name')}</div><div>{t('ranking_col_developer')}</div><div>{t('col_star')}</div><div>{t('col_download')}</div><div></div><div></div>
        </div>
        {visible.map(r => (
          <div key={r.id} className="admin-tab-row">
            <div className="row gap-8" style={{minWidth: 0}}>
              <span className={`chip chip-${r.type}`}>{r.type === 'py' ? '.py' : '.json'}</span>
              <span style={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.title}</span>
            </div>
            <div>{r.author?.name}</div>
            <div>{r.stars_count ?? 0}</div>
            <div>{r.downloads_count ?? 0}</div>
            <div className="muted-sm">{fmtDate(r.created_at)}</div>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" style={{fontSize: 11}} onClick={() => onOpenComponent && onOpenComponent({id: r.id, type: r.type, title: r.title})}><Icons.Eye size={10}/></button>
              <button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)', fontSize: 11}} onClick={() => handleDelete(r.id)}><Icons.X size={10}/></button>
            </div>
          </div>
        ))}
        {loading && <LoadingIndicator/>}
        {!loading && items.length === 0 && <div className="empty-state" style={{padding: 30}}>No approved items</div>}
      </div>
      {items.length > showCount && (
        <div style={{textAlign: 'center', padding: '14px 0'}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCount(s => s + 20)}>{t('load_more') || 'Load More'} ({showCount} / {items.length})</button>
        </div>
      )}
    </div>
  );
}

function RejectedDeletedTab({ onOpenComponent }) {
  const { t } = useI18n();
  const [rejected, setRejected] = React.useState([]);
  const [deleted, setDeleted] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const load = () => {
    setLoading(true);
    Promise.all([
      api.admin.rejected().then(setRejected).catch(() => {}),
      api.admin.deleted().then(setDeleted).catch(() => {}),
    ]).finally(() => setLoading(false));
  };
  React.useEffect(load, []);
  const handleDelete = (id) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    api.admin.deleteComponent(id).then(load).catch(e => alert('Delete failed: ' + e.message));
  };
  const items = [
    ...rejected.map(r => ({ ...r, _kind: 'rejected' })),
    ...deleted.map(r => ({ ...r, _kind: 'deleted' })),
  ];
  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head"><div className="h3">{t('tab_deleted')}</div></div>
      <div className="rejected-list">
        {items.map(r => (
          <div key={r.id} className="rejected-row">
            <div style={{flex: 1, minWidth: 0}}>
              <div className="row gap-8" style={{marginBottom: 4}}>
                <span className={`chip chip-${r.type}`}>{r.type === 'py' ? '.py' : '.json'}</span>
                <span style={{fontWeight: 600}}>{r.title}</span>
                <span className="muted-sm">· {r.author?.name}</span>
                <span className="muted-sm">· {fmtDate(r.created_at)}</span>
                <span className={`chip ${r._kind === 'deleted' ? 'chip-neutral' : 'chip-warn'}`} style={{fontSize: 10}}>{r._kind === 'deleted' ? t('status_deleted') : t('status_rejected')}</span>
              </div>
            </div>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" style={{fontSize: 11}} onClick={() => onOpenComponent && onOpenComponent({id: r.id, type: r.type, title: r.title})}><Icons.Eye size={10}/></button>
              {r._kind !== 'deleted' && <button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)', fontSize: 11}} onClick={() => handleDelete(r.id)}><Icons.X size={10}/></button>}
            </div>
          </div>
        ))}
        {loading && <LoadingIndicator/>}
        {!loading && items.length === 0 && <div className="empty-state" style={{padding: 30}}>No rejected items</div>}
      </div>
    </div>
  );
}

function StatisticsTab() {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filterAuthor, setFilterAuthor] = React.useState('');
  const [filterSearch, setFilterSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [showCount, setShowCount] = React.useState(20);

  React.useEffect(() => {
    api.admin.statistics().then(d => { setItems(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    if (filterAuthor && !item.author_id.includes(filterAuthor) && !(item.author_name || '').toLowerCase().includes(filterAuthor.toLowerCase())) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const tagMatch = (item.tags || []).some(t => t.toLowerCase().includes(q));
      if (!item.title.toLowerCase().includes(q) && !tagMatch) return false;
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'deleted') return !!item.deleted_at;
      return item.status === filterStatus && !item.deleted_at;
    }
    return true;
  });

  const getUrl = (item) => {
    const type = item.type === 'json' ? 'flow' : 'component';
    return window.location.origin + window.location.pathname + '#/' + type + '/' + item.id;
  };

  const downloadCsv = () => {
    const header = ['author_id', 'author_name', 'title', 'type', 'tags', 'status', 'stars', 'downloads', 'id', 'url', 'created_at'];
    const rows = filtered.map(item => [
      item.author_id,
      item.author_name,
      item.title,
      item.type === 'py' ? 'component' : 'flow',
      (item.tags || []).join('; '),
      item.deleted_at ? 'deleted' : item.status,
      item.stars_count,
      item.downloads_count,
      item.id,
      getUrl(item),
      item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agenthub-statistics-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head" style={{flexWrap: 'wrap', gap: 10}}>
        <div>
          <div className="h3"><Icons.BarChart size={14} style={{marginRight: 6}}/>Statistics</div>
          <div className="muted-sm">{filtered.length} / {items.length} items</div>
        </div>
        <div className="row gap-8" style={{flexWrap: 'wrap'}}>
          <input className="input" placeholder="Title or Tag" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{width: 160, height: 30, fontSize: 12}}/>
          <input className="input" placeholder="Author ID or name" value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)} style={{width: 160, height: 30, fontSize: 12}}/>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{height: 30, fontSize: 12}}>
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="deleted">Deleted</option>
          </select>
          <button className="btn btn-accent btn-sm" onClick={downloadCsv}><Icons.Download size={11}/> CSV</button>
        </div>
      </div>
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 12.5}}>
          <thead>
            <tr style={{background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)'}}>
              <th style={{padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Author</th>
              <th style={{padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Title</th>
              <th style={{padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Type</th>
              <th style={{padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Status</th>
              <th style={{padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Stars</th>
              <th style={{padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Downloads</th>
              <th style={{padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Date</th>
              <th style={{padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)'}}>Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, showCount).map(item => {
              const statusColor = item.deleted_at ? 'var(--text-4)' : item.status === 'approved' ? 'var(--ok-fg)' : item.status === 'rejected' ? 'var(--err-fg)' : 'var(--warn-fg)';
              const statusLabel = item.deleted_at ? 'deleted' : item.status;
              return (
                <tr key={item.id} style={{borderBottom: '1px solid var(--line)'}}>
                  <td style={{padding: '8px 12px', whiteSpace: 'nowrap'}}>
                    <span className="mono" style={{fontSize: 11, color: 'var(--text-3)'}}>{item.author_id}</span>
                    <span style={{marginLeft: 6}}>{item.author_name}</span>
                  </td>
                  <td style={{padding: '8px 12px', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.title}</td>
                  <td style={{padding: '8px 12px'}}><span className={`chip chip-${item.type}`}>{item.type === 'py' ? '.py' : '.json'}</span></td>
                  <td style={{padding: '8px 12px'}}><span style={{color: statusColor, fontWeight: 600, fontSize: 11, textTransform: 'uppercase'}}>{statusLabel}</span></td>
                  <td style={{padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace'}}>{item.stars_count}</td>
                  <td style={{padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace'}}>{item.downloads_count}</td>
                  <td style={{padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap'}}>{item.created_at ? item.created_at.slice(0, 16).replace('T', ' ') : '-'}</td>
                  <td style={{padding: '8px 12px', textAlign: 'center'}}>
                    <button className="btn btn-ghost btn-sm" style={{fontSize: 11}} onClick={() => { navigator.clipboard?.writeText(getUrl(item)); }}><Icons.Link size={10}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && <LoadingIndicator/>}
      {!loading && filtered.length === 0 && <div className="empty-state" style={{padding: 30}}>No items found</div>}
      {filtered.length > showCount && (
        <div style={{textAlign: 'center', padding: '14px 0'}}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCount(s => s + 20)}>{t('load_more') || 'Load More'} ({showCount} / {filtered.length})</button>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { t } = useI18n();
  const [users, setUsers] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [usersTotal, setUsersTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState('role'); // 'role' | 'id'
  const [loadingMore, setLoadingMore] = React.useState(false);
  const pageRef = React.useRef(0);
  const PAGE_SIZE = 50;
  const loadUsers = (nextPage = 0) => {
    const append = nextPage > 0;
    append ? setLoadingMore(true) : setUsersLoading(true);
    api.admin.users({ search: search || undefined, sort: sortBy, limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE })
      .then(d => { setUsers(prev => append ? [...prev, ...(d.items || [])] : (d.items || [])); setUsersTotal(d.total || 0); pageRef.current = nextPage; })
      .catch(() => {})
      .finally(() => { setUsersLoading(false); setLoadingMore(false); });
  };
  React.useEffect(() => loadUsers(0), [sortBy]);

  const changeRole = (empId, newRole) => {
    api.admin.updateRole(empId, newRole).then(() => loadUsers(0)).catch(e => console.error(e));
  };

  const filtered = users;

  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      <div className="admin-panel-head">
        <div>
          <div className="h3">{t('admin_users')}</div>
          <div className="muted-sm">{usersTotal} users</div>
        </div>
        <div className="nav-search" style={{width: 240, height: 32}}>
          <Icons.Search size={13}/>
          <input placeholder="Search name, ID, email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadUsers(0); }}/>
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 110px', gap: 14, padding: '12px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)'}}>
          <div style={{cursor: 'pointer'}} onClick={() => { setSortBy('id'); if (sortBy === 'id') loadUsers(0); }}>ID {sortBy === 'id' ? '▲' : ''}</div><div>Name</div><div>Email</div><div style={{cursor: 'pointer'}} onClick={() => { setSortBy('role'); if (sortBy === 'role') loadUsers(0); }}>Role {sortBy === 'role' ? '▲' : ''}</div>
        </div>
        {filtered.map(u => (
          <div key={u.employee_id} style={{display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 110px', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center', fontSize: 13}}>
            <div className="mono" style={{fontWeight: 600}}>{u.employee_id}</div>
            <div className="row gap-8">
              <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{(u.name || '?')[0]}</div>
              <span>{u.name}</span>
            </div>
            <div className="muted-sm" style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{u.email || '-'}</div>
            <div>
              <select className="select" style={{fontSize: 12, padding: '4px 8px', height: 30}} value={u.role} onChange={e => changeRole(u.employee_id, e.target.value)}>
                <option value="user">{t('role_user')}</option>
                <option value="admin">{t('role_admin')}</option>
                <option value="manager">{t('role_manager')}</option>
                <option value="reviewer">{t('role_reviewer')}</option>
              </select>
            </div>
          </div>
        ))}
        {usersLoading && <LoadingIndicator/>}
        {!usersLoading && users.length === 0 && (
          <div className="empty-state" style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
            {t('admin_no_users')}
          </div>
        )}
      </div>
      {users.length < usersTotal && !usersLoading && (
        <div style={{textAlign: 'center', padding: '14px 0'}}>
          <button className="btn btn-ghost btn-sm" disabled={loadingMore} onClick={() => loadUsers(pageRef.current + 1)}>
            {loadingMore ? 'Loading...' : `${t('load_more') || 'Load More'} (${users.length} / ${usersTotal})`}
          </button>
        </div>
      )}
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
    contactChannel: '',
  });
  const [criteria, setCriteria] = React.useState(DEFAULT_CRITERIA);
  const [draftLabel, setDraftLabel] = React.useState('');
  const [reviewers, setReviewers] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Load settings from API + reviewers from users
  React.useEffect(() => {
    api.admin.settings().then(d => {
      if (d) {
        setSeason({
          name: d.name || '',
          submitStart: d.submit_start || '',
          submitEnd: d.submit_end || '',
          reviewEnd: d.review_end || '',
          awardDay: d.award_day || '',
          contactChannel: d.contact_channel || '',
        });
        if (d.criteria_weights) {
          setCriteria(Object.entries(d.criteria_weights).map(([k, v], i) => ({ id: 'c' + i, label: k, value: v })));
        }
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
    // Load reviewers from user list
    api.admin.users().then(users => {
      setReviewers((users || []).filter(u => u.role === 'reviewer' || u.role === 'admin').map(u => ({
        id: u.employee_id, name: u.name, initial: (u.name || '?')[0], role: u.role,
        avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)',
      })));
    }).catch(() => {});
  }, []);

  // Save to API
  const saveSettings = () => {
    setSaving(true);
    const criteriaWeights = {};
    criteria.forEach(c => { criteriaWeights[c.label] = c.value; });
    api.admin.updateSettings({
      name: season.name,
      submit_start: season.submitStart,
      submit_end: season.submitEnd,
      review_end: season.reviewEnd,
      award_day: season.awardDay,
      criteria_weights: criteriaWeights,
      contact_channel: season.contactChannel,
    }).then(() => setSaving(false)).catch(() => setSaving(false));
  };

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
            <div key={r.id} className="reviewer-row" style={{padding: '8px 0'}}>
              <div className="row gap-8">
                <div className="avatar sm" style={{background: r.avatarBg, color: r.avatarFg}}>{r.initial}</div>
                <div>
                  <div style={{fontWeight: 600, fontSize: 13}}>{r.name}</div>
                  <div className="muted-sm" style={{fontSize: 11}}><span className="mono">({r.id})</span> · {r.role === 'admin' ? t('role_admin') : t('role_reviewer')}</div>
                </div>
              </div>
            </div>
          ))}
          {reviewers.length === 0 && <div className="muted-sm" style={{padding: 12, textAlign: 'center'}}>사용자 관리 탭에서 심사위원을 지정해주세요.</div>}
        </div>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>{t('settings_contact') || 'Contact Channel'}</div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_contact_desc') || 'URL or channel name for user inquiries'}</div>
        <EditableRow label={t('settings_contact_url') || 'Channel URL'} value={season.contactChannel} onChange={v => setField('contactChannel', v)}/>
      </div>

      <div className="card settings-card">
        <div className="h3" style={{marginBottom: 4}}>{t('settings_compat')}</div>
        <div className="muted-sm" style={{marginBottom: 14}}>{t('settings_compat_desc')}</div>
        <SettingRow label={t('settings_min_ver')} value="1.8.0"/>
        <SettingRow label={t('settings_rec_ver')} value="1.9.0"/>
        <SettingRow label={t('settings_readme_lang')} value="KR + EN"/>
        <SettingRow label={t('settings_secret_scan')} value="ON"/>
      </div>

      <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8}}>
        <button className="btn btn-accent" onClick={saveSettings} disabled={saving} style={{opacity: saving ? 0.5 : 1}}>
          <Icons.Check size={12}/> {saving ? 'Saving...' : 'Save Settings'}
        </button>
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
