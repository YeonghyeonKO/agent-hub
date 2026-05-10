// ─────────────────────────────────────────────────────────────────────
// 공지사항 (Notice Board) + VoC (Voice of Customer) Board
// ─────────────────────────────────────────────────────────────────────

// fmtDate is defined in api.jsx

// Markdown renderer helper
function Markdown({ children }) {
  const html = React.useMemo(() => {
    if (!children) return '';
    if (window.marked && window.marked.parse) {
      return window.marked.parse(children, { breaks: true });
    }
    return children.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br/>');
  }, [children]);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

// MOCK_NOTICES is defined in data.jsx and shared globally

const MOCK_VOC = [
  { id: 'v1', title: '검색 필터에 "호환 버전" 조건 추가 요청', content: '홈에서 Component를 검색할 때 특정 Langflow 버전과 호환되는 것만 필터링할 수 있으면 좋겠습니다. 현재는 카드 안에 들어가서야 호환 여부를 확인할 수 있어요.', category: 'suggestion', author: { name: '김정호', id: '2074814', initial: '김' }, status: 'in-progress', upvotes: 12, comments: 3, created_at: '2026-04-29' },
  { id: 'v2', title: 'Flow 그래프 뷰에서 노드 드래그 기능', content: 'Flow 상세 페이지의 그래프가 정적이라 큰 Flow의 구조를 파악하기 어렵습니다. 노드를 드래그하거나 줌 인/아웃 할 수 있으면 좋겠어요.', category: 'suggestion', author: { name: '박지원', id: '2074821', initial: '박' }, status: 'open', upvotes: 8, comments: 1, created_at: '2026-04-30' },
  { id: 'v3', title: '업로드 시 README 자동 생성 기능 제안', content: 'Component 업로드할 때 코드에서 docstring, input/output을 자동 파싱해서 README 초안을 만들어주면 문서화 부담이 줄어들 것 같습니다.', category: 'suggestion', author: { name: '최서연', id: '2074803', initial: '최' }, status: 'open', upvotes: 15, comments: 5, created_at: '2026-04-27' },
  { id: 'v4', title: 'SmartChunker v1.2.0 다운로드 시 파일명 깨짐', content: '크롬 브라우저에서 SmartChunker를 다운로드하면 파일명이 UUID로 나옵니다. 원래 파일명(smart_chunker.py)으로 다운로드되어야 할 것 같아요.', category: 'bug', author: { name: '이창수', id: '2068420', initial: '이' }, status: 'resolved', upvotes: 4, comments: 2, created_at: '2026-04-26' },
  { id: 'v5', title: '심사 결과 Slack 알림 연동 가능한가요?', content: '제출한 Component의 심사 결과(승인/반려)를 Slack DM으로 받을 수 있나요? 매번 사이트에 들어와서 확인하는 게 번거롭습니다.', category: 'question', author: { name: '박지원', id: '2074821', initial: '박' }, status: 'open', upvotes: 9, comments: 2, created_at: '2026-04-28' },
];

// ─── Notice Board ───────────────────────────────────────────────────
function NoticePage({ initialNoticeId }) {
  const NOTICE_LIMIT = 20;
  const { t } = useI18n();
  const [notices, setNotices] = React.useState([]);
  const [selected, setSelected] = React.useState(initialNoticeId || null);
  const [showForm, setShowForm] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  // Fetch from API
  const loadNotices = (append = false) => {
    const offset = append ? notices.length : 0;
    append ? setLoadingMore(true) : null;
    api.notices.list({ limit: NOTICE_LIMIT, offset }).then(d => {
      const items = d || [];
      if (append) { setNotices(prev => [...prev, ...items]); } else { setNotices(items); }
      setHasMore(items.length >= NOTICE_LIMIT);
      setLoadingMore(false);
    }).catch(() => { setLoadingMore(false); });
  };
  React.useEffect(() => loadNotices(false), []);

  const [formTitle, setFormTitle] = React.useState('');
  const [formContent, setFormContent] = React.useState('');
  const [formPinned, setFormPinned] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const noticeTextareaRef = React.useRef(null);
  useImagePaste(noticeTextareaRef, (md) => setFormContent(c => c + '\n' + md));

  const handleSubmit = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    api.notices.create({ title: formTitle.trim(), content: formContent.trim(), is_pinned: formPinned })
      .then(() => { loadNotices(); setFormTitle(''); setFormContent(''); setFormPinned(false); setShowForm(false); setShowPreview(false); })
      .catch(() => {});
  };

  const togglePin = (id) => {
    const n = notices.find(x => x.id === id);
    if (n) api.notices.update(id, { is_pinned: !n.is_pinned }).then(loadNotices).catch(() => {});
  };
  const deleteNotice = (id) => {
    api.notices.del(id).then(() => { loadNotices(); setSelected(null); }).catch(() => {});
  };

  const sorted = [...notices].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  const notice = (selected && notices.length > 0) ? notices.find(n => n.id === selected) : null;
  // If selected but notice not found (not loaded yet or invalid), reset to list
  const showDetail = selected && notice;

  return (
    <div className="page fade-in">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24}}>
        <div>
          <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>{t('notice_eyebrow')}</div>
          <div className="h1">{t('notice_title')}</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>{t('notice_subtitle')}</div>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(!showForm)}>
          <Icons.Plus size={12}/> {t('notice_write')}
        </button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{marginBottom: 20}}>
          <div className="h3" style={{marginBottom: 14}}>{t('notice_form_title')}</div>
          <div className="field">
            <label className="field-label">{t('notice_field_title')} <span className="req">*</span></label>
            <input className="input" value={formTitle} onChange={e => setFormTitle(e.target.value)}/>
          </div>
          <div className="field">
            <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
              <label className="field-label" style={{margin: 0}}>{t('notice_field_content')} <span className="req">*</span></label>
              <div className="row gap-8">
                <ImageUploadButton onInsert={md => setFormContent(c => c + '\n' + md)}/>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(!showPreview)} style={{fontSize: 12}}>
                  <Icons.Eye size={11}/> {showPreview ? t('voc_edit') : t('voc_preview')}
                </button>
              </div>
            </div>
            {!showPreview ? (
              <>
                <textarea ref={noticeTextareaRef} className="textarea" rows="8" value={formContent} onChange={e => setFormContent(e.target.value)}/>
                <div className="field-hint">{t('voc_md_hint')}</div>
              </>
            ) : (
              <div style={{minHeight: 160, padding: 16, border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--bg-muted)'}}>
                {formContent ? <Markdown>{formContent}</Markdown> : <span className="muted-sm">...</span>}
              </div>
            )}
          </div>
          <div className="row gap-8" style={{justifyContent: 'space-between'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer'}}>
              <input type="checkbox" checked={formPinned} onChange={e => setFormPinned(e.target.checked)} style={{width: 16, height: 16}}/>
              <Icons.Star size={12}/> {t('notice_pin_label')}
            </label>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setShowPreview(false); }}>{t('voc_cancel')}</button>
              <button className="btn btn-accent btn-sm" onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim()} style={{opacity: (!formTitle.trim() || !formContent.trim()) ? 0.5 : 1}}>
                <Icons.Check size={11}/> {t('notice_publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showDetail ? (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          {sorted.map((n, i) => (
            <div key={n.id} style={{
              padding: '18px 22px',
              borderBottom: i < sorted.length - 1 ? '1px solid var(--line)' : 'none',
              cursor: 'pointer', transition: 'background 0.12s',
              display: 'flex', alignItems: 'center', gap: 14,
            }} onClick={() => setSelected(n.id)}
               onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
               onMouseOut={e => e.currentTarget.style.background = ''}>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="row gap-8" style={{marginBottom: 6}}>
                  {n.is_pinned && <span className="chip chip-accent" style={{fontSize: 10}}><Icons.Star size={9} filled/> {t('notice_pin')}</span>}
                  <span style={{fontWeight: 700, fontSize: 15}}>{n.title}</span>
                </div>
                <div className="muted-sm" style={{display: 'flex', gap: 12}}>
                  <span>{n.author.name}</span>
                  <span>{fmtDate(n.created_at)}</span>
                </div>
              </div>
              <Icons.ChevronRight size={14} style={{color: 'var(--text-4)'}}/>
            </div>
          ))}
          {hasMore && (
            <div style={{textAlign: 'center', padding: '16px 0'}}>
              <button className="btn btn-secondary btn-sm" onClick={() => loadNotices(true)} disabled={loadingMore} style={{opacity: loadingMore ? 0.5 : 1}}>
                {loadingMore ? 'Loading...' : t('load_more') || 'Load More'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{marginBottom: 16}}>
            {t('notice_back')}
          </button>
          <div className="card card-pad" style={{padding: 28}}>
            <div className="row gap-8" style={{marginBottom: 8, justifyContent: 'space-between'}}>
              <div className="row gap-8">
                {notice.is_pinned && <span className="chip chip-accent" style={{fontSize: 10}}><Icons.Star size={9} filled/> {t('notice_pin')}</span>}
              </div>
              <div className="row gap-8">
                <button className="btn btn-ghost btn-sm" onClick={() => togglePin(notice.id)}>
                  <Icons.Star size={12} filled={notice.is_pinned}/> {notice.is_pinned ? t('notice_unpin') : t('notice_pin')}
                </button>
                <button className="btn btn-ghost btn-sm btn-ghost-danger" onClick={() => deleteNotice(notice.id)}>
                  <Icons.X size={12}/> {t('notice_delete')}
                </button>
              </div>
            </div>
            <h2 className="h2" style={{marginBottom: 12}}>{notice.title}</h2>
            <div className="row gap-8 muted-sm" style={{marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)'}}>
              <span style={{fontWeight: 500, color: 'var(--text-2)'}}>{notice.author.name}</span>
              <span>·</span>
              <span>{fmtDate(notice.created_at)}</span>
            </div>
            <Markdown>{notice.content}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VoC Board ──────────────────────────────────────────────────────
function VocPage() {
  const VOC_LIMIT = 20;
  const { t } = useI18n();
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort] = React.useState('popular');
  const [selected, setSelected] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [posts, setPosts] = React.useState([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const loadVoc = (append = false) => {
    const offset = append ? posts.length : 0;
    append ? setLoadingMore(true) : null;
    api.voc.list({ sort: sort === 'popular' ? 'popular' : 'newest', limit: VOC_LIMIT, offset }).then(d => {
      const items = d || [];
      if (append) { setPosts(prev => [...prev, ...items]); } else { setPosts(items); }
      setHasMore(items.length >= VOC_LIMIT);
      setLoadingMore(false);
    }).catch(() => { setLoadingMore(false); });
  };
  React.useEffect(() => loadVoc(false), []);

  const [formCat, setFormCat] = React.useState('suggestion');
  const [formTitle, setFormTitle] = React.useState('');
  const [formContent, setFormContent] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const vocTextareaRef = React.useRef(null);
  useImagePaste(vocTextareaRef, (md) => setFormContent(c => c + '\n' + md));

  const catLabels = { suggestion: t('cat_suggestion'), bug: t('cat_bug'), question: t('cat_question'), other: t('cat_other') };
  const statusLabels = { open: t('status_open'), 'in-progress': t('status_inprogress'), resolved: t('status_resolved'), closed: t('status_closed') };
  const statusChip = { open: 'chip-neutral', 'in-progress': 'chip-warn', resolved: 'chip-ok', closed: 'chip-neutral' };

  const handleSubmit = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    api.voc.create({ title: formTitle.trim(), content: formContent.trim(), category: formCat })
      .then(() => { loadVoc(); setFormTitle(''); setFormContent(''); setFormCat('suggestion'); setShowForm(false); setShowPreview(false); })
      .catch(() => {});
  };

  const filtered = posts
    .filter(v => filter === 'all' || v.category === filter)
    .sort((a, b) => sort === 'popular' ? b.upvotes - a.upvotes : 0);

  const post = selected ? posts.find(v => v.id === selected) : null;

  // Fetch detail (with comments) from API when a post is selected
  const [detail, setDetail] = React.useState(null);
  const [commentText, setCommentText] = React.useState('');
  React.useEffect(() => {
    if (!selected) { setDetail(null); return; }
    api.voc.get(selected).then(setDetail).catch(() => {});
  }, [selected]);

  const submitComment = () => {
    if (!commentText.trim() || !selected) return;
    api.voc.comment(selected, { content: commentText.trim() })
      .then(() => { setCommentText(''); api.voc.get(selected).then(setDetail).catch(() => {}); })
      .catch(() => {});
  };

  if (selected && (detail || post)) {
    const d = detail || post;
    const comments = d.comments || [];
    const commentCount = typeof d.comment_count === 'number' ? d.comment_count : (Array.isArray(comments) ? comments.length : 0);
    return (
      <div className="page fade-in">
        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{marginBottom: 16}}>
          {t('voc_back')}
        </button>
        <div className="card card-pad" style={{padding: 28}}>
          <div className="row gap-8" style={{marginBottom: 10}}>
            <span className={`chip ${statusChip[d.status]}`}>{statusLabels[d.status]}</span>
            <span className="chip chip-neutral">{catLabels[d.category]}</span>
          </div>
          <h2 className="h2" style={{marginBottom: 12}}>{d.title}</h2>
          <div className="row gap-8 muted-sm" style={{marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)'}}>
            <span style={{fontWeight: 500, color: 'var(--text-2)'}}>{d.author?.name}</span>
            <span>·</span>
            <span>{fmtDate(d.created_at)}</span>
            <span className="spacer"/>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icons.Star size={12}/> {d.upvote_count ?? d.upvotes ?? 0}</span>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Icons.Comment size={12}/> {commentCount}</span>
          </div>
          <div style={{marginBottom: 28}}>
            <Markdown>{d.content}</Markdown>
          </div>
          <div style={{borderTop: '1px solid var(--line)', paddingTop: 20}}>
            <div className="h3" style={{marginBottom: 14}}>{t('voc_comments')} {commentCount}</div>
            {Array.isArray(comments) && comments.map(c => (
              <div key={c.id} style={{padding: 14, background: 'var(--bg-muted)', borderRadius: 8, marginBottom: 10}}>
                <div className="row gap-8" style={{marginBottom: 6}}>
                  <div className="avatar sm" style={{background: 'var(--accent-bg)', color: 'var(--accent-fg)'}}>{(c.author?.name || '?')[0]}</div>
                  <span style={{fontWeight: 600, fontSize: 13}}>{c.author?.name}</span>
                  <span className="muted-sm">· {fmtDate(c.created_at)}</span>
                </div>
                <div style={{fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6}}>{c.content}</div>
              </div>
            ))}
            {commentCount === 0 && !Array.isArray(comments) && (
              <div className="muted-sm" style={{padding: 14}}>아직 댓글이 없습니다.</div>
            )}
            <div className="row gap-8" style={{marginTop: 16}}>
              <input className="input" placeholder={t('voc_comment_write')} style={{flex: 1}} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}/>
              <button className="btn btn-accent btn-sm" onClick={submitComment}>{t('voc_comment_submit')}</button>
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
          <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>{t('voc_eyebrow')}</div>
          <div className="h1">{t('voc_title')}</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>{t('voc_subtitle')}</div>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(!showForm)}>
          <Icons.Plus size={12}/> {t('voc_write')}
        </button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{marginBottom: 20}}>
          <div className="h3" style={{marginBottom: 14}}>{t('voc_form_title')}</div>
          <div className="field">
            <label className="field-label">{t('voc_field_category')} <span className="req">*</span></label>
            <div className="segmented">
              {[['suggestion', t('cat_suggestion')],['bug', t('cat_bug')],['question', t('cat_question')],['other', t('cat_other')]].map(([v,l]) => (
                <button key={v} className={`segmented-item ${formCat===v?'active':''}`} onClick={() => setFormCat(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t('voc_field_title')} <span className="req">*</span></label>
            <input className="input" placeholder={t('voc_title_placeholder')} value={formTitle} onChange={e => setFormTitle(e.target.value)}/>
          </div>
          <div className="field">
            <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
              <label className="field-label" style={{margin: 0}}>{t('voc_field_content')} <span className="req">*</span></label>
              <div className="row gap-8">
                <ImageUploadButton onInsert={md => setFormContent(c => c + '\n' + md)}/>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(!showPreview)} style={{fontSize: 12}}>
                  <Icons.Eye size={11}/> {showPreview ? t('voc_edit') : t('voc_preview')}
                </button>
              </div>
            </div>
            {!showPreview ? (
              <>
                <textarea ref={vocTextareaRef} className="textarea" rows="6" placeholder={t('voc_content_placeholder')} value={formContent} onChange={e => setFormContent(e.target.value)}/>
                <div className="field-hint">{t('voc_md_hint')}</div>
              </>
            ) : (
              <div style={{minHeight: 120, padding: 16, border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--bg-muted)'}}>
                {formContent ? <Markdown>{formContent}</Markdown> : <span className="muted-sm">...</span>}
              </div>
            )}
          </div>
          <div className="row gap-8" style={{justifyContent: 'flex-end'}}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setShowPreview(false); }}>{t('voc_cancel')}</button>
            <button className="btn btn-accent btn-sm" onClick={handleSubmit} disabled={!formTitle.trim() || !formContent.trim()} style={{opacity: (!formTitle.trim() || !formContent.trim()) ? 0.5 : 1}}>
              <Icons.Check size={11}/> {t('voc_register')}
            </button>
          </div>
        </div>
      )}

      <div className="row gap-8" style={{marginBottom: 20}}>
        <div className="segmented">
          {[['all', t('filter_all')], ['suggestion', t('cat_suggestion')], ['bug', t('cat_bug')], ['question', t('cat_question')]].map(([v, l]) => (
            <button key={v} className={`segmented-item ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
        <div className="spacer"/>
        <div className="segmented">
          {[['popular', t('sort_popular')], ['newest', t('sort_new')]].map(([v, l]) => (
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
                <button className="btn btn-icon btn-ghost" style={{color: v.is_upvoted ? '#f59e0b' : 'var(--text-3)'}} onClick={e => { e.stopPropagation(); api.voc.upvote(v.id).then(() => { loadVoc(); }).catch(() => {}); }}><Icons.Star size={16} filled={v.is_upvoted}/></button>
                <span className="mono" style={{fontSize: 13, fontWeight: 700, color: v.is_upvoted ? '#f59e0b' : undefined}}>{v.upvote_count ?? v.upvotes ?? 0}</span>
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div className="row gap-8" style={{marginBottom: 6}}>
                  <span className={`chip ${statusChip[v.status]}`} style={{fontSize: 10.5}}>{statusLabels[v.status]}</span>
                  <span className="chip chip-neutral" style={{fontSize: 10.5}}>{catLabels[v.category]}</span>
                  <span style={{fontWeight: 700, fontSize: 14.5}}>{v.title}</span>
                </div>
                <div className="muted-sm" style={{display: 'flex', gap: 12}}>
                  <span>{v.author.name}</span>
                  <span>{fmtDate(v.created_at)}</span>
                  <span><Icons.Comment size={11}/> {v.comment_count ?? v.comments ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div style={{textAlign: 'center', marginTop: 16}}>
          <button className="btn btn-secondary btn-sm" onClick={() => loadVoc(true)} disabled={loadingMore} style={{opacity: loadingMore ? 0.5 : 1}}>
            {loadingMore ? 'Loading...' : t('load_more') || 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NoticePage, VocPage });
