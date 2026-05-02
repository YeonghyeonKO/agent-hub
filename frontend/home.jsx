// Home page (landing / browse)

function Home({ onOpenComponent, onOpenUpload, onGoAdmin }) {
  const [activeCat, setActiveCat] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('popular');
  const [query, setQuery] = React.useState('');

  const filtered = COMPONENTS.filter(c => {
    if (query && !c.title.toLowerCase().includes(query.toLowerCase()) && !c.desc.includes(query)) return false;
    if (activeCat === 'all') return true;
    if (activeCat === 'rag') return c.category === 'RAG / 검색';
    if (activeCat === 'doc') return c.category === '문서 처리';
    if (activeCat === 'data') return c.category === '데이터 / ERP';
    if (activeCat === 'workflow') return c.category === '워크플로우';
    return false;
  });

  return (
    <div className="page fade-in">
      {/* Hero / season banner */}
      <div className="season-banner">
        <div>
          <div className="season-eyebrow">2026 · 상반기</div>
          <div className="season-title">AI Agent Builder Component · Flow</div>
          <div className="season-meta">
            <span><Icons.Clock size={11}/> 제출 마감 D-23</span>
            <span><Icons.Users size={11}/> 참여 38명 · 제출 62건</span>
            <span><Icons.Trophy size={11}/> 2026 1위 SmartChunker</span>
          </div>
        </div>
        <div className="season-cta row gap-8">
          <button className="btn btn-secondary" onClick={onGoAdmin} style={{background: 'transparent', borderColor: '#3d3d3a', color: 'var(--bg)'}}>
            <Icons.Settings size={13}/> 관리자
          </button>
          <button className="btn btn-accent" onClick={onOpenUpload}>
            <Icons.Plus/> 새 Component / Flow
          </button>
        </div>
      </div>

      {/* Title row */}
      <div className="gallery-head">
        <div>
          <div className="h1">홈</div>
          <div className="gallery-tagline">구성원이 직접 개발하여 공유한 Component·Flow를 활용하여 내 Agent를 업그레이드해보세요.</div>
        </div>
        <div className="row gap-8">
          <div className="segmented" style={{height: 32}}>
            <button className={`segmented-item ${sortBy==='popular'?'active':''}`} onClick={() => setSortBy('popular')}>인기순</button>
            <button className={`segmented-item ${sortBy==='new'?'active':''}`} onClick={() => setSortBy('new')}>최신순</button>
            <button className={`segmented-item ${sortBy==='trending'?'active':''}`} onClick={() => setSortBy('trending')}>트렌딩</button>
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
            {cat.label} <span className="filter-pill-count">{cat.count}</span>
          </button>
        ))}
        <div className="spacer"/>
        <div className="nav-search" style={{width: 240, height: 32}}>
          <Icons.Search size={13}/>
          <input placeholder="이름·설명 검색…" value={query} onChange={e => setQuery(e.target.value)}/>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-3">
        {filtered.map(c => <ComponentCard key={c.id} c={c} onClick={() => onOpenComponent(c)} />)}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card card-pad">
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4}}>검색 결과가 없습니다</div>
          <div style={{fontSize: 12.5}}>다른 키워드로 시도해보거나, 직접 만들어 제출해보세요.</div>
        </div>
      )}
    </div>
  );
}

function ComponentCard({ c, onClick }) {
  const Icon = Icons[c.icon] || Icons.Box;
  const chipClass = c.type === 'py' ? 'chip-py' : 'chip-json';
  const isIncompat = c.incompat;

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
            {c.type === 'py' ? 'Component' : 'Flow'}
          </span>
          {c.standard && <span className="chip chip-ok"><Icons.Check size={10}/> 표준</span>}
          {isIncompat && <span className="chip chip-warn"><Icons.Warn size={10}/> 호환 주의</span>}
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
        {c.nodes && <span>{c.nodes} 노드</span>}
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
