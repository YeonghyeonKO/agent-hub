// Home page (landing / browse)

// Map API response to card-compatible shape
function apiToCard(item) {
  const author = item.author || {};
  return {
    ...item,
    desc: item.description || item.desc || '',
    stars: item.stars_count ?? item.stars ?? 0,
    downloads: item.downloads_count ?? item.downloads ?? 0,
    copies: item.copies ?? 0,
    comments: item.comments ?? 0,
    author: {
      name: author.name || '',
      id: author.employee_id || author.id || '',
      initial: author.initial || (author.name || '?')[0],
    },
    minLF: item.min_langflow_ver || item.minLF || '',
    maxLF: item.max_langflow_ver || item.maxLF || '',
    testedVersions: item.tested_versions || item.testedVersions || [],
    tags: item.tags || [],
    standard: item.is_standard ?? item.standard ?? false,
    incompat: item.min_langflow_ver && item.max_langflow_ver && item.min_langflow_ver === item.max_langflow_ver && item.min_langflow_ver < '1.8.0',
    updatedAgo: item.updated_at ? fmtDate(item.updated_at) : item.updatedAgo || '',
    typeLabel: item.type === 'py' ? '.py Component' : 'JSON Flow',
    version: item.version || 'v1.0.0',
    versions: item.versions ?? 1,
  };
}
window.apiToCard = apiToCard;

function Home({ onOpenComponent, onOpenUpload, onGoAdmin, onGoNotice }) {
  const [activeCat, setActiveCat] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('popular');
  const [query, setQuery] = React.useState('');
  const { t } = useI18n();

  // Fetch from API only — DB is seeded with real data
  const PAGE_SIZE = 20;
  const [components, setComponents] = React.useState([]);
  const [notices, setNotices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [season, setSeason] = React.useState(null);

  const loadComponents = (append = false, searchOverride) => {
    const searchQ = searchOverride !== undefined ? searchOverride : query;
    const offset = append ? components.length : 0;
    append ? setLoadingMore(true) : setLoading(true);
    api.components.list({ sort: sortBy, search: searchQ || undefined, limit: PAGE_SIZE, offset })
      .then(d => {
        const items = (d.items || []).map(item => { try { return apiToCard(item); } catch(e) { console.error('apiToCard error:', e, item); return null; } }).filter(Boolean);
        setComponents(prev => append ? [...prev, ...items] : items);
        setTotal(d.total || 0);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(e => { console.error('Failed to load components:', e); setLoading(false); setLoadingMore(false); });
  };

  // Refs so reload/focus handlers always see the latest paginated state
  const componentsCountRef = React.useRef(0);
  const queryRef = React.useRef('');
  const sortByRef = React.useRef(sortBy);
  React.useEffect(() => { componentsCountRef.current = components.length; }, [components.length]);
  React.useEffect(() => { queryRef.current = query; }, [query]);
  React.useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);

  // Re-fetch the same number of items already on screen, preserving pagination
  const refreshLoaded = () => {
    const n = Math.max(componentsCountRef.current, PAGE_SIZE);
    api.components.list({ sort: sortByRef.current, search: queryRef.current || undefined, limit: n, offset: 0 })
      .then(d => {
        const items = (d.items || []).map(item => { try { return apiToCard(item); } catch(e) { console.error('apiToCard error:', e, item); return null; } }).filter(Boolean);
        setComponents(items);
        setTotal(d.total || 0);
      })
      .catch(e => console.error('Failed to refresh components:', e));
  };

  // Load on mount, sort change, and when page gets focus (e.g. after admin approval)
  React.useEffect(() => loadComponents(false), [sortBy]);
  React.useEffect(() => {
    const onReload = () => refreshLoaded();
    const onSearch = () => {
      const q = window.__agenthub_search_query || '';
      window.__agenthub_search_query = '';
      setQuery(q);
      loadComponents(false, q);
    };
    window.addEventListener('focus', onReload);
    window.addEventListener('agenthub:reload', onReload);
    window.addEventListener('agenthub:search', onSearch);
    if (window.__agenthub_search_query) { onSearch(); }
    return () => { window.removeEventListener('focus', onReload); window.removeEventListener('agenthub:reload', onReload); window.removeEventListener('agenthub:search', onSearch); };
  }, []);
  React.useEffect(() => {
    api.notices.list().then(d => { if (d) setNotices(d); }).catch(() => {});
    api.get('/admin/settings').then(d => { if (d) setSeason(d); }).catch(() => {});
  }, []);

  const [activeTag, setActiveTag] = React.useState('');

  const filtered = components.filter(c => {
    if (activeTag && !(c.tags || []).includes(activeTag)) return false;
    const q = query.toLowerCase();
    const desc = c.desc || c.description || '';
    const tagMatch = (c.tags || []).some(t => t.toLowerCase().includes(q));
    if (query && !c.title.toLowerCase().includes(q) && !desc.toLowerCase().includes(q) && !tagMatch) return false;
    return true;
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
          <div className="season-eyebrow">{season?.name || t('season_eyebrow')}</div>
          <div className="season-title">{t('season_title')}</div>
          <div className="season-meta">
            <span><Icons.Users size={11}/> {components.length} Components / Flows</span>
            {season?.submit_end && <span>· 제출 마감: {season.submit_end}</span>}
          </div>
        </div>
        <div className="season-cta row gap-8">
          <button className="btn btn-accent" onClick={onOpenUpload}>
            <Icons.Plus/> {t('season_new')}
          </button>
        </div>
      </div>

      {/* Pinned notices */}
      {notices.filter(n => n.is_pinned).length > 0 && (
        <div style={{marginBottom: 22}}>
          {notices.filter(n => n.is_pinned).map(n => (
            <div key={n.id} onClick={() => onGoNotice(n.id)} style={{
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

      {/* Search */}
      <div className="filter-row">
        <div className="spacer"/>
        <div className="nav-search" style={{width: 280, height: 32}}>
          <Icons.Search size={13}/>
          <input placeholder={t('search_inline')} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadComponents(false); }}/>
        </div>
      </div>

      {/* Active tag filter */}
      {activeTag && (
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14}}>
          <span className="muted-sm">Tag:</span>
          <span className="chip chip-accent" style={{fontSize: 11, padding: '2px 10px', cursor: 'pointer'}} onClick={() => setActiveTag('')}>
            #{activeTag} <Icons.X size={9} style={{marginLeft: 4}}/>
          </span>
        </div>
      )}

      {/* Grid */}
      {loading && <LoadingIndicator/>}
      {!loading && (
        <div className="grid-3">
          {filtered.map(c => <ComponentCard key={c.id} c={c} onClick={() => onOpenComponent(c)} onTagClick={(tag) => setActiveTag(tag)}/>)}
        </div>
      )}

      {!loading && components.length < total && (
        <div style={{textAlign: 'center', marginTop: 20}}>
          <button className="btn btn-secondary" onClick={() => loadComponents(true)} disabled={loadingMore} style={{opacity: loadingMore ? 0.5 : 1}}>
            {loadingMore ? 'Loading...' : t('load_more') || 'Load More'} ({components.length} / {total})
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state card card-pad">
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4}}>{t('empty_title')}</div>
          <div style={{fontSize: 12.5}}>{t('empty_desc')}</div>
        </div>
      )}
    </div>
  );
}

function ComponentCard({ c: raw, onClick, onTagClick }) {
  const c = raw.stars_count !== undefined ? apiToCard(raw) : raw;
  const Icon = Icons[c.icon] || Icons.Box;
  const chipClass = c.type === 'py' ? 'chip-py' : 'chip-json';
  const isIncompat = c.incompat;
  const { t } = useI18n();
  const authorName = c.author?.name || c.author || '';

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
        {c.tags && c.tags.length > 0 && (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6}}>
            {c.tags.map(tag => <span key={tag} className="chip chip-neutral" style={{fontSize: 10, padding: '1px 6px', cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(tag); }}>#{tag}</span>)}
          </div>
        )}
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
          <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}><Icons.Users size={10}/></div>
          <span>{authorName}</span>
        </div>
      </div>
    </div>
  );
}

window.Home = Home;
window.ComponentCard = ComponentCard;
