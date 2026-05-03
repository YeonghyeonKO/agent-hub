// Home page (landing / browse)

// Map API response to card-compatible shape
function apiToCard(item) {
  return {
    ...item,
    desc: item.description || item.desc || '',
    stars: item.stars_count ?? item.stars ?? 0,
    downloads: item.downloads_count ?? item.downloads ?? 0,
    author: item.author || { name: '', id: '', initial: '' },
    minLF: item.min_langflow_ver || item.minLF || '',
    maxLF: item.max_langflow_ver || item.maxLF || '',
    standard: item.is_standard ?? item.standard ?? false,
    incompat: item.min_langflow_ver && item.max_langflow_ver && item.min_langflow_ver === item.max_langflow_ver && item.min_langflow_ver < '1.8.0',
    updatedAgo: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : item.updatedAgo || '',
  };
}
window.apiToCard = apiToCard;

function Home({ onOpenComponent, onOpenUpload, onGoAdmin, onGoNotice }) {
  const [activeCat, setActiveCat] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('popular');
  const [query, setQuery] = React.useState('');
  const { t } = useI18n();

  // Fetch from API, fallback to mock
  const [components, setComponents] = React.useState(COMPONENTS);
  const [notices, setNotices] = React.useState(MOCK_NOTICES);
  React.useEffect(() => {
    api.components.list({ sort: sortBy, search: query || undefined, category: activeCat === 'all' ? undefined : activeCat })
      .then(d => { if (d.items && d.items.length > 0) setComponents(d.items.map(apiToCard)); })
      .catch(() => {});
    api.notices.list()
      .then(d => { if (d && d.length > 0) setNotices(d.map(n => ({...n, is_pinned: n.is_pinned, author: n.author || {name:'', id:'', initial:''}}))); })
      .catch(() => {});
  }, []);

  const filtered = components.filter(c => {
    const desc = c.desc || c.description || '';
    if (query && !c.title.toLowerCase().includes(query.toLowerCase()) && !desc.includes(query)) return false;
    if (activeCat === 'all') return true;
    if (activeCat === 'rag') return c.category === 'RAG / 검색';
    if (activeCat === 'doc') return c.category === '문서 처리';
    if (activeCat === 'data') return c.category === '데이터 / ERP';
    if (activeCat === 'workflow') return c.category === '워크플로우';
    return false;
  }).sort((a, b) => {
    if (sortBy === 'new') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return ((b.stars || b.stars_count || 0) + (b.downloads || b.downloads_count || 0)) - ((a.stars || a.stars_count || 0) + (a.downloads || a.downloads_count || 0));
  });

  const catI18n = { all: t('filter_all'), rag: t('cat_rag'), doc: t('cat_doc'), data: t('cat_data'), workflow: t('cat_workflow'), agent: t('cat_agent'), utility: t('cat_util') };

  return (
    <div className="page fade-in">
      {/* Hero / season banner */}
      <div className="season-banner">
        <div>
          <div className="season-eyebrow">{t('season_eyebrow')}</div>
          <div className="season-title">{t('season_title')}</div>
          <div className="season-meta">
            <span><Icons.Clock size={11}/> {t('season_deadline')}</span>
            <span><Icons.Users size={11}/> {t('season_participants')}</span>
            <span><Icons.Trophy size={11}/> {t('season_first')}</span>
          </div>
        </div>
        <div className="season-cta row gap-8">
          <button className="btn btn-secondary" onClick={onGoAdmin} style={{background: 'transparent', borderColor: '#3d3d3a', color: 'var(--bg)'}}>
            <Icons.Settings size={13}/> {t('season_admin')}
          </button>
          <button className="btn btn-accent" onClick={onOpenUpload}>
            <Icons.Plus/> {t('season_new')}
          </button>
        </div>
      </div>

      {/* Pinned notices */}
      {notices.filter(n => n.is_pinned).length > 0 && (
        <div style={{marginBottom: 22}}>
          {notices.filter(n => n.is_pinned).map(n => (
            <div key={n.id} onClick={onGoNotice} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', marginBottom: 6,
              background: 'var(--bg-elev)', border: '1px solid var(--line)',
              borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius)',
              fontSize: 13, cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-elev)'}>
              <span style={{fontWeight: 700, color: 'var(--accent-fg)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('pinned_label')}</span>
              <span style={{fontWeight: 600, flex: 1}}>{n.title}</span>
              <span className="muted-sm">{fmtDate(n.created_at)}</span>
              <Icons.ChevronRight size={12} style={{color: 'var(--text-4)'}}/>
            </div>
          ))}
        </div>
      )}

      {/* Title row */}
      <div className="gallery-head">
        <div>
          <div className="h1">{t('home_title')}</div>
          <div className="gallery-tagline">{t('home_tagline')}</div>
        </div>
        <div className="row gap-8">
          <div className="segmented" style={{height: 32}}>
            <button className={`segmented-item ${sortBy==='popular'?'active':''}`} onClick={() => setSortBy('popular')}>{t('sort_popular')}</button>
            <button className={`segmented-item ${sortBy==='new'?'active':''}`} onClick={() => setSortBy('new')}>{t('sort_new')}</button>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="filter-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`filter-pill ${activeCat === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {catI18n[cat.id] || cat.label} <span className="filter-pill-count">{cat.count}</span>
          </button>
        ))}
        <div className="spacer"/>
        <div className="nav-search" style={{width: 240, height: 32}}>
          <Icons.Search size={13}/>
          <input placeholder={t('search_inline')} value={query} onChange={e => setQuery(e.target.value)}/>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-3">
        {filtered.map(c => <ComponentCard key={c.id} c={c} onClick={() => onOpenComponent(c)} />)}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card card-pad">
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4}}>{t('empty_title')}</div>
          <div style={{fontSize: 12.5}}>{t('empty_desc')}</div>
        </div>
      )}
    </div>
  );
}

function ComponentCard({ c: raw, onClick }) {
  const c = raw.stars_count !== undefined ? apiToCard(raw) : raw;
  const Icon = Icons[c.icon] || Icons.Box;
  const chipClass = c.type === 'py' ? 'chip-py' : 'chip-json';
  const isIncompat = c.incompat;
  const { t } = useI18n();

  return (
    <div className={`cc ${isIncompat ? 'cc-incompat' : ''}`} onClick={onClick}>
      {c.rank && c.rank <= 3 && (
        <div className={`trophy trophy-${c.rank}`}>
          <Icons.Trophy size={12}/>
        </div>
      )}
      <div className="cc-top">
        <div className="cc-chips">
          <span className={`chip ${chipClass}`}>
            {c.type === 'py' ? '.py' : '.json'}
          </span>
          <span className="chip chip-neutral">
            {c.type === 'py' ? t('type_component') : t('type_flow')}
          </span>
          {c.standard && <span className="chip chip-ok"><Icons.Check size={10}/> {t('chip_standard')}</span>}
          {isIncompat && <span className="chip chip-warn"><Icons.Warn size={10}/> {t('chip_incompat')}</span>}
        </div>
      </div>
      <div>
        <div className="cc-title">{c.title}</div>
        <div className="cc-desc" style={{marginTop: 4}}>{c.desc}</div>
      </div>
      <div style={{
        background: 'var(--bg-muted)',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>Langflow {c.minLF === c.maxLF ? c.minLF : `${c.minLF} ~ ${c.maxLF}`}</span>
        {c.nodes && <span>{c.nodes} nodes</span>}
      </div>
      <div className="cc-meta">
        <div className="cc-meta-item"><Icons.Star size={12}/> {c.stars}</div>
        <div className="cc-meta-item"><Icons.Download size={12}/> {c.downloads}</div>
        <div className="spacer"/>
        <div className="cc-author">
          <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{c.author.initial}</div>
          <span>{c.author.name}</span>
          <span className="mono cc-author-id">({c.author.id})</span>
        </div>
      </div>
    </div>
  );
}

window.Home = Home;
window.ComponentCard = ComponentCard;
