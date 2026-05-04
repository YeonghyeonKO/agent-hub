// Flow detail page (사내 위키 RAG)

const FLOW_NODES = [
  { id: 'in', label: 'Chat Input', sub: '사용자 질문', kind: 'io', x: 30, y: 60 },
  { id: 'intent', label: 'Intent', sub: '의도 분류', kind: 'process', x: 215, y: 60 },
  { id: 'conf', label: 'Confluence', sub: '위키 검색', kind: 'search', x: 400, y: 60, tooltip: { title: 'Confluence Search', meta: 'space: ALL · limit: 20\n사내 위키 전 영역에서 키워드 검색' } },
  { id: 'bm25', label: 'BM25', sub: '키워드 검색', kind: 'search', x: 400, y: 165 },
  { id: 'embed', label: 'Embedder', sub: '벡터화', kind: 'process', x: 215, y: 165 },
  { id: 'vdb', label: 'Vector DB', sub: '유사도 검색', kind: 'search', x: 30, y: 165 },
  { id: 'rerank', label: 'Reranker', sub: '재순위', kind: 'process', x: 30, y: 270 },
  { id: 'llm', label: '사내 LLM', sub: '답변 생성', kind: 'llm', x: 215, y: 270 },
  { id: 'cite', label: 'Cite Format', sub: '출처 첨부', kind: 'format', x: 400, y: 270 },
  { id: 'out', label: 'Chat Output', sub: '최종 답변', kind: 'io', x: 580, y: 270 },
];

const FLOW_EDGES = [
  ['in', 'intent'], ['intent', 'conf'], ['conf', 'bm25'],
  ['bm25', 'embed'], ['embed', 'vdb'], ['vdb', 'rerank'],
  ['rerank', 'llm'], ['llm', 'cite'], ['cite', 'out'],
  ['intent', 'embed', 'dashed'],
];

function FlowDetail({ component, onBack, onOpenComponent }) {
  const c = component;
  const [tab, setTab] = React.useState('readme');
  const [hoverNode, setHoverNode] = React.useState(null);

  return (
    <div className="page-narrow fade-in">
      <div className="breadcrumb">
        <a onClick={onBack} style={{cursor: 'pointer'}}>홈</a>
        <span className="breadcrumb-sep">/</span>
        <span>Flow</span>
        <span className="breadcrumb-sep">/</span>
        <span>RAG</span>
        <span className="breadcrumb-sep">/</span>
        <span className="current">{c.title}</span>
      </div>

      <div className="detail-header">
        <div className={`detail-icon ${c.type}`}>
          <Icons.Database/>
        </div>
        <div className="detail-title-block">
          <div className="detail-eyebrow">
            <span className="chip chip-json">.json</span>
            <span>JSON Flow</span>
            <span className="breadcrumb-sep">·</span>
            <span>{c.version}</span>
            <span className="breadcrumb-sep">·</span>
            <span style={{color: '#475569', fontWeight: 600}}><Icons.Trophy size={11}/> 2026 2위</span>
          </div>
          <h1 className="detail-title">{c.title}</h1>
          <div className="detail-desc">{c.desc}</div>
          <div className="author-row">
            <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}><Icons.Users size={10}/></div>
            <span style={{color: 'var(--text-2)', fontWeight: 500}}>{c.author.name}</span>
            <span className="breadcrumb-sep">·</span>
            <span>1주 전 등록</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={() => { const id = c.id; if (id && String(id).includes('-')) api.components.star(id).catch(() => {}); }}><Icons.Star size={13}/> {c.stars_count ?? c.stars}</button>
          <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({name: c.title, version: c.version, nodes: FLOW_NODES.map(n => ({id: n.id, type: n.label})), edges: FLOW_EDGES}, null, 2)); }}><Icons.Code size={13}/> JSON 복사</button>
          <button className="btn btn-primary" onClick={() => {
            const json = JSON.stringify({name: c.title, version: c.version, langflow: `>=${c.minLF},<=${c.maxLF}`, nodes: FLOW_NODES.map(n => ({id: n.id, type: n.label, config: n.tooltip?.meta || {}})), edges: FLOW_EDGES.map(([f,t,d]) => ({from: f, to: t, dashed: !!d}))}, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = c.title.replace(/\s+/g, '_') + '.json'; a.click();
            URL.revokeObjectURL(url);
          }}><Icons.Download size={13}/> 다운로드</button>
        </div>
      </div>

      <div className="version-row">
        <span className="version-row-label">Langflow 호환</span>
        <span className="mono" style={{fontSize: 12, color: 'var(--text-2)'}}>{c.minLF} ~ {c.maxLF}</span>
        <span className="version-row-tag">동작 확인:</span>
        {c.testedVersions.map(v => (
          <span key={v} className="version-pill tested"><Icons.Check size={10}/> {v}</span>
        ))}
        <div className="version-row-sep"/>
        <span className="chip chip-ok"><Icons.Check size={10}/> 사내 표준(1.9.0) 호환</span>
      </div>

      <div className="grid-4" style={{marginTop: 24}}>
        <Stat label="Star" value={c.stars} icon={<Icons.Star size={12}/>} delta="+8 이번 주"/>
        <Stat label="다운로드" value={c.downloads} icon={<Icons.Download size={12}/>} delta="+47 이번 주"/>
        <Stat label="복사" value={c.copies} icon={<Icons.Copy size={12}/>}/>
        <Stat label="노드 수" value={c.nodes} icon={<Icons.Workflow size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', '설명'],
          ['graph', 'Flow 그래프'],
          ['json', 'JSON 보기'],
          ['versions', '버전', 1],
          ['comments', '댓글', 14],
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} {count != null && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <div>
          {tab === 'readme' && <FlowReadme/>}
          {(tab === 'graph' || tab === 'readme') && tab !== 'json' && tab !== 'versions' && tab !== 'comments' && (
            <div style={{marginTop: tab === 'readme' ? 24 : 0}}>
              <FlowGraph hoverNode={hoverNode} setHoverNode={setHoverNode}/>
            </div>
          )}
          {tab === 'json' && <FlowJsonView/>}
          {tab === 'versions' && <div className="card card-pad muted">버전 1개 · v1.0.0 (1주 전)</div>}
          {tab === 'comments' && <div className="card card-pad muted">14개의 댓글</div>}
        </div>
        <aside>
          <div className="aside-card">
            <div className="aside-section-title">사용 전 준비</div>
            <ul style={{margin: 0, paddingLeft: 18, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.8}}>
              <li>환경 변수 <span className="mono" style={{fontSize: 11}}>CONFLUENCE_TOKEN</span></li>
              <li>사내 LLM 엔드포인트 접근 권한</li>
              <li>SmartChunker Component 선설치 권장</li>
            </ul>
          </div>
          <div className="aside-card">
            <div className="aside-section-title">사용된 사내 Component</div>
            <div className="col" style={{gap: 8}}>
              {[
                { title: 'SmartChunker', author: '고영현' },
                { title: 'KoreanReranker', author: '고영현' },
                { title: 'ConfluenceClient', author: '김정호' },
              ].map(item => (
                <div key={item.title} style={{
                  padding: '8px 12px',
                  background: 'var(--bg-muted)',
                  borderRadius: 6,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{fontWeight: 600}}>{item.title}</span>
                  <span className="muted-sm" style={{fontSize: 11}}>· {item.author}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aside-card">
            <div className="aside-section-title">검증 결과</div>
            <div className="aside-stat">
              <span className="aside-stat-key">평균 응답 정확도</span>
              <span className="aside-stat-val" style={{color: 'var(--ok-fg)'}}>87%</span>
            </div>
            <div className="aside-stat">
              <span className="aside-stat-key">테스트 부서</span>
              <span className="aside-stat-val">50개</span>
            </div>
            <div className="aside-stat">
              <span className="aside-stat-key">P95 응답시간</span>
              <span className="aside-stat-val">2.1s</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FlowReadme() {
  return (
    <div className="card card-pad" style={{padding: 24, marginBottom: 24}}>
      <h2 className="h2" style={{marginBottom: 8}}>개요</h2>
      <p style={{color: 'var(--text-2)', marginTop: 0, marginBottom: 20, lineHeight: 1.7}}>
        사내 Confluence 위키를 대상으로 한 RAG 챗봇 Flow입니다. 질문 → 의도 분류 → 위키 검색 → 재순위화 →
        출처가 포함된 답변까지 한 번에 처리합니다. 답변에 클릭 가능한 출처 링크가 자동 첨부되어 신뢰도 검증이 쉽습니다.
      </p>

      <h3 className="h3" style={{marginBottom: 8}}>주요 특징</h3>
      <ul style={{margin: '0 0 0', paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.8}}>
        <li>Confluence REST API 직접 연동 (사내망 인증 토큰 사용)</li>
        <li>Hybrid 검색 (BM25 + 임베딩) → Cross-encoder 재순위</li>
        <li>답변에 출처 페이지 링크 자동 삽입</li>
        <li>약 50개 부서 위키에서 평균 응답 정확도 87%</li>
      </ul>
    </div>
  );
}

function FlowGraph({ hoverNode, setHoverNode }) {
  const nodeMap = Object.fromEntries(FLOW_NODES.map(n => [n.id, n]));
  const NODE_W = 130, NODE_H = 50;

  return (
    <div className="flow-graph-card">
      <div className="flow-graph-toolbar">
        <div className="row gap-8">
          <span className="h3">Flow 그래프</span>
          <span className="muted-sm">· 9 노드 · 11 연결</span>
        </div>
        <div className="row gap-8">
          <button className="btn btn-sm btn-secondary"><Icons.Maximize size={11}/> 확대</button>
          <button className="btn btn-sm btn-secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({nodes: FLOW_NODES.map(n => ({id: n.id, type: n.label})), edges: FLOW_EDGES.map(([f,t]) => ({from: f, to: t}))}, null, 2)); }}><Icons.Code size={11}/> JSON 복사</button>
        </div>
      </div>
      <div className="flow-graph-canvas">
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#d8d6d2"/>
            </marker>
          </defs>
          {FLOW_EDGES.map(([from, to, dashed], i) => {
            const a = nodeMap[from], b = nodeMap[to];
            const x1 = a.x + NODE_W/2, y1 = a.y + NODE_H/2;
            const x2 = b.x + NODE_W/2, y2 = b.y + NODE_H/2;
            // path with bezier
            const dx = (x2 - x1) * 0.5;
            const path = `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
            return <path key={i} d={path} className={`flow-edge ${dashed ? 'dashed' : ''}`} markerEnd="url(#arr)"/>;
          })}
        </svg>
        {FLOW_NODES.map(n => (
          <div
            key={n.id}
            className={`flow-node ${n.kind}`}
            style={{left: n.x, top: n.y}}
            onMouseEnter={() => setHoverNode(n)}
            onMouseLeave={() => setHoverNode(null)}
          >
            <div className="flow-node-title">{n.label}</div>
            <div className="flow-node-sub">{n.sub}</div>
          </div>
        ))}
        {hoverNode?.tooltip && (
          <div className="flow-tooltip" style={{left: hoverNode.x + 140, top: hoverNode.y - 10}}>
            <div className="flow-tooltip-title">{hoverNode.tooltip.title}</div>
            {hoverNode.tooltip.meta.split('\n').map((l, i) => <div key={i} className="flow-tooltip-meta">{l}</div>)}
          </div>
        )}
      </div>
      <div className="legend">
        <div className="legend-item"><span className="legend-dot" style={{borderColor: '#94a3b8', background: '#f8fafc'}}/> 입출력</div>
        <div className="legend-item"><span className="legend-dot" style={{borderColor: '#c084fc', background: '#faf5ff'}}/> 분류 / 라우팅</div>
        <div className="legend-item"><span className="legend-dot" style={{borderColor: '#5eead4', background: '#f0fdfa'}}/> 검색</div>
        <div className="legend-item"><span className="legend-dot" style={{borderColor: '#fb923c', background: '#fff7ed'}}/> LLM</div>
        <div className="legend-item"><span className="legend-dot" style={{borderColor: '#f9a8d4', background: '#fdf2f8'}}/> 후처리</div>
        <div className="spacer"/>
        <span className="muted-sm">노드 hover 시 설명/값 표시</span>
      </div>
    </div>
  );
}

function FlowJsonView() {
  const json = `{
  "name": "사내 위키 RAG",
  "version": "1.0.0",
  "langflow": ">=1.9.0,<1.10.0",
  "nodes": [
    { "id": "in", "type": "ChatInput" },
    { "id": "intent", "type": "IntentClassifier" },
    { "id": "conf", "type": "ConfluenceClient", "config": { "space": "ALL", "limit": 20 } },
    { "id": "bm25", "type": "BM25Search" },
    { "id": "embed", "type": "OpenAIEmbedder" },
    { "id": "vdb", "type": "PgVector" },
    { "id": "rerank", "type": "KoreanReranker" },
    { "id": "llm", "type": "InternalLLM", "config": { "model": "gpt-4o-int" } },
    { "id": "cite", "type": "CitationFormatter" },
    { "id": "out", "type": "ChatOutput" }
  ],
  "edges": [...]
}`;
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <div className="row gap-8">
          <Icons.Code size={13}/>
          <span style={{fontWeight: 600}}>flow.json</span>
          <span style={{color: '#6b7d6b'}}>· 6.1 KB</span>
        </div>
        <button className="btn btn-sm btn-ghost" style={{color: '#b6b3ab'}}>
          <Icons.Copy size={11}/> 복사
        </button>
      </div>
      <div className="codeblock-body">
        <div className="codeblock-content" style={{whiteSpace: 'pre', color: '#e6e4df'}}>{json}</div>
      </div>
    </div>
  );
}

window.FlowDetail = FlowDetail;
