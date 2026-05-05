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
  const [c, setC] = React.useState(component);
  const [tab, setTab] = React.useState('readme');
  const [hoverNode, setHoverNode] = React.useState(null);
  const [starCount, setStarCount] = React.useState(c.stars_count ?? c.stars ?? 0);
  const [starred, setStarred] = React.useState(false);
  const [flowData, setFlowData] = React.useState(null);
  const [showUpdate, setShowUpdate] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState(false);
  const [versionHistory, setVersionHistory] = React.useState([]);

  // Fetch full component data (including readme)
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-') && c.readme === undefined) {
      api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
    }
  }, [c.id]);

  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      api.components.file(c.id)
        .then(d => { try { setFlowData(JSON.parse(d.content)); } catch {} })
        .catch(() => {});
    }
  }, [c.id]);

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
          </div>
          <h1 className="detail-title">{c.title}</h1>
          <div className="detail-desc">{c.desc}</div>
          <div className="author-row">
            <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}><Icons.Users size={10}/></div>
            <span style={{color: 'var(--text-2)', fontWeight: 500}}>{c.author.name}</span>
            <span className="breadcrumb-sep">·</span>
            <span>{c.updatedAgo || fmtDate(c.created_at)} 등록</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" style={{color: starred ? '#f59e0b' : undefined, borderColor: starred ? '#f59e0b' : undefined}} onClick={() => { const id = c.id; if (id && String(id).includes('-')) api.components.star(id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } else { setStarCount(s => Math.max(0, s - 1)); setStarred(false); } }).catch(() => {}); }}><Icons.Star size={13}/> {starCount}</button>
          <button className="btn btn-secondary" onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(flowData || {name: c.title}, null, 2));
            if (c.id && String(c.id).includes('-') && !starred) {
              api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
            }
            setCopyToast(true); setTimeout(() => setCopyToast(false), 3000);
          }}><Icons.Code size={13}/> JSON 복사</button>
          <button className="btn btn-primary" onClick={() => {
            if (c.id && String(c.id).includes('-')) {
              window.open((window.location.port === '3000' ? 'http://localhost:8000' : '') + `/api/v1/components/${c.id}/download-file`, '_blank');
            }
          }}><Icons.Download size={13}/> 다운로드</button>
          <button className="btn btn-secondary" onClick={() => setShowUpdate(true)}><Icons.Upload size={13}/> 업데이트</button>
        </div>
      </div>

      {copyToast && (
        <div className="copy-toast">
          JSON을 복사했어요! 개발자에게 star도 같이 전달할게요 ⭐️
        </div>
      )}

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
        <Stat label="Star" value={starCount} icon={<Icons.Star size={12}/>}/>
        <Stat label="다운로드" value={c.downloads_count ?? c.downloads ?? 0} icon={<Icons.Download size={12}/>}/>
        <Stat label="노드 수" value={flowData ? (flowData.nodes?.length || 0) : (c.nodes ?? '—')} icon={<Icons.Workflow size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', '개요 / 사용법'],
          ['graph', 'Flow 그래프'],
          ['json', 'JSON 보기'],
          ['versions', '버전 이력'],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => { setTab(id); if (id === 'versions' && versionHistory.length === 0 && c.id) api.components.versions(c.id).then(setVersionHistory).catch(() => {}); }}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'readme' && <FlowReadme c={c}/>}
        {(tab === 'graph' || tab === 'readme') && tab !== 'json' && (
          <div style={{marginTop: tab === 'readme' ? 24 : 0}}>
            <FlowGraph hoverNode={hoverNode} setHoverNode={setHoverNode} flowData={flowData}/>
          </div>
        )}
        {tab === 'json' && <FlowJsonView flowData={flowData}/>}
        {tab === 'versions' && (
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '14px 18px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: 13}}>
              현재: {c.version}
            </div>
            {versionHistory.length === 0 && <div className="muted-sm" style={{padding: 24, textAlign: 'center'}}>이전 버전이 없습니다</div>}
            {versionHistory.map((v, i) => (
              <div key={v.id} style={{padding: '12px 18px', borderBottom: i < versionHistory.length - 1 ? '1px solid var(--line)' : 'none'}}>
                <div className="row gap-8" style={{marginBottom: 4}}>
                  <span className="mono" style={{fontWeight: 700}}>{v.version}</span>
                  <span className="muted-sm">· {fmtDate(v.created_at)}</span>
                </div>
                <div style={{fontSize: 13, color: 'var(--text-2)'}}>{v.changelog}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpdate && <UpdateModal component={c} onClose={() => setShowUpdate(false)} onUpdated={(updated) => { setC(apiToCard(updated)); setShowUpdate(false); }}/>}
    </div>
  );
}

function FlowReadme({ c }) {
  if (!c.readme) {
    return (
      <div className="card card-pad" style={{padding: 28, textAlign: 'center', color: 'var(--text-3)', marginBottom: 24}}>
        <div style={{fontSize: 36, marginBottom: 12, opacity: 0.4}}>📄</div>
        <div style={{fontWeight: 500, marginBottom: 6}}>개요 / 사용법이 없습니다</div>
        <div style={{fontSize: 13}}>업로드 시 작성한 내용이 여기에 표시됩니다.</div>
      </div>
    );
  }
  const html = (typeof marked !== 'undefined' && marked.parse) ? marked.parse(c.readme) : c.readme.replace(/\n/g, '<br/>');
  return (
    <div className="card card-pad" style={{padding: 24, marginBottom: 24}}>
      <div className="readme-body" dangerouslySetInnerHTML={{__html: html}}/>
    </div>
  );
}

function FlowGraph({ hoverNode, setHoverNode, flowData }) {
  // Extract real node/edge counts from flowData
  const nodeCount = flowData ? (flowData.nodes?.length || 0) : FLOW_NODES.length;
  const edgeCount = flowData ? (flowData.edges?.length || 0) : FLOW_EDGES.length;

  // If flowData exists but has no nodes/edges, show fallback
  if (flowData && (!flowData.nodes || flowData.nodes.length === 0)) {
    return (
      <div className="flow-graph-card">
        <div className="flow-graph-toolbar">
          <span className="h3">Flow 그래프</span>
        </div>
        <div style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
          <div style={{fontSize: 28, marginBottom: 10, opacity: 0.4}}>⚠</div>
          <div style={{fontWeight: 500, marginBottom: 6}}>그래프를 표시할 수 없습니다</div>
          <div style={{fontSize: 13}}>Flow JSON에 nodes/edges 구조가 없거나 형식이 다릅니다.</div>
          <div style={{fontSize: 12, marginTop: 8, color: 'var(--text-4)'}}>JSON 보기 탭에서 원본을 확인하세요.</div>
        </div>
      </div>
    );
  }

  // Auto-layout: arrange nodes in a grid if using real flowData
  let layoutNodes;
  if (flowData && flowData.nodes) {
    const cols = Math.ceil(Math.sqrt(flowData.nodes.length));
    layoutNodes = flowData.nodes.map((n, i) => ({
      id: n.id || n.data?.id || String(i),
      label: n.data?.type || n.type || n.id || 'Node',
      sub: n.data?.node?.display_name || n.data?.display_name || '',
      kind: 'process',
      x: (i % cols) * 170 + 30,
      y: Math.floor(i / cols) * 110 + 30,
    }));
  } else {
    layoutNodes = FLOW_NODES;
  }

  const nodeMap = Object.fromEntries(layoutNodes.map(n => [n.id, n]));
  const NODE_W = 130, NODE_H = 50;

  // Build renderable edges
  let layoutEdges;
  if (flowData && flowData.edges) {
    layoutEdges = flowData.edges.map(e => [e.source || e.from, e.target || e.to, false]).filter(([f, t]) => nodeMap[f] && nodeMap[t]);
  } else {
    layoutEdges = FLOW_EDGES;
  }

  return (
    <div className="flow-graph-card">
      <div className="flow-graph-toolbar">
        <div className="row gap-8">
          <span className="h3">Flow 그래프</span>
          <span className="muted-sm">· {nodeCount} 노드 · {edgeCount} 연결</span>
        </div>
      </div>
      <div className="flow-graph-canvas" style={{minHeight: flowData ? Math.ceil(nodeCount / Math.ceil(Math.sqrt(nodeCount))) * 110 + 80 : undefined}}>
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#d8d6d2"/>
            </marker>
          </defs>
          {layoutEdges.map(([from, to, dashed], i) => {
            const a = nodeMap[from], b = nodeMap[to];
            if (!a || !b) return null;
            const x1 = a.x + NODE_W/2, y1 = a.y + NODE_H/2;
            const x2 = b.x + NODE_W/2, y2 = b.y + NODE_H/2;
            const dx = (x2 - x1) * 0.5;
            const path = `M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;
            return <path key={i} d={path} className={`flow-edge ${dashed ? 'dashed' : ''}`} markerEnd="url(#arr)"/>;
          })}
        </svg>
        {layoutNodes.map(n => (
          <div
            key={n.id}
            className={`flow-node ${n.kind}`}
            style={{left: n.x, top: n.y}}
            onMouseEnter={() => setHoverNode(n)}
            onMouseLeave={() => setHoverNode(null)}
          >
            <div className="flow-node-title">{n.label}</div>
            {n.sub && <div className="flow-node-sub">{n.sub}</div>}
          </div>
        ))}
        {hoverNode?.tooltip && (
          <div className="flow-tooltip" style={{left: hoverNode.x + 140, top: hoverNode.y - 10}}>
            <div className="flow-tooltip-title">{hoverNode.tooltip.title}</div>
            {hoverNode.tooltip.meta.split('\n').map((l, i) => <div key={i} className="flow-tooltip-meta">{l}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowJsonView({ flowData }) {
  const json = flowData ? JSON.stringify(flowData, null, 2) : '(JSON 데이터를 불러올 수 없습니다)';
  const sizeKB = (new Blob([json]).size / 1024).toFixed(1);
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => { navigator.clipboard?.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <div className="row gap-8">
          <Icons.Code size={13}/>
          <span style={{fontWeight: 600}}>flow.json</span>
          <span style={{color: '#6b7d6b'}}>· {sizeKB} KB</span>
        </div>
        <button className="btn btn-sm btn-ghost" style={{color: '#b6b3ab'}} onClick={handleCopy}>
          {copied ? <><Icons.Check size={11}/> 복사됨</> : <><Icons.Copy size={11}/> 복사</>}
        </button>
      </div>
      <div className="codeblock-body">
        <div className="codeblock-content" style={{whiteSpace: 'pre', color: '#e6e4df'}}>{json}</div>
      </div>
    </div>
  );
}

window.FlowDetail = FlowDetail;
