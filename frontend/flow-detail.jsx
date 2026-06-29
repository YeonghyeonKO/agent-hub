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
  const { t } = useI18n();
  const { latestVersion } = useLangflowVersions();
  const [c, setC] = React.useState(component);
  const [tab, setTab] = React.useState('readme');
  const [hoverNode, setHoverNode] = React.useState(null);
  const [starCount, setStarCount] = React.useState(c.stars_count ?? c.stars ?? 0);
  const [starred, setStarred] = React.useState(false);
  const [flowData, setFlowData] = React.useState(null);
  const [showUpdate, setShowUpdate] = React.useState(false);
  const [showDeploy, setShowDeploy] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState('');
  const [currentUser, setCurrentUser] = React.useState(null);
  const [versionHistory, setVersionHistory] = React.useState([]);

  // Fetch full component data (including readme) and check star status
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      if (c.readme === undefined) api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
      api.get(`/components/${c.id}/starred`).then(r => setStarred(r.starred)).catch(() => {});
    }
    api.users.me().then(u => setCurrentUser(u)).catch(() => {});
  }, [c.id]);

  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      api.components.file(c.id)
        .then(d => {
          try {
            const parsed = JSON.parse(d.content);
            // Langflow wraps in data: { nodes, edges } — unwrap if needed
            setFlowData(parsed.data?.nodes ? parsed.data : parsed);
          } catch {}
        })
        .catch(() => {});
    }
  }, [c.id]);

  return (
    <div className="page-narrow fade-in">
      <div className="breadcrumb">
        <a onClick={onBack} style={{cursor: 'pointer'}}>{t('nav_home')}</a>
        <span className="breadcrumb-sep">/</span>
        <span>{t('type_flow')}</span>
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
            <span>{t('flow_subtitle')}</span>
            <span className="breadcrumb-sep">·</span>
            <span>{c.version}</span>
          </div>
          <h1 className="detail-title">{c.title}</h1>
          <div className="detail-desc">{c.desc}</div>
          {c.tags && c.tags.length > 0 && (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8}}>
              {c.tags.map(tag => <span key={tag} className="chip chip-neutral" style={{fontSize: 11, padding: '2px 8px', cursor: 'pointer'}} onClick={() => { window.__agenthub_search_query = tag; onBack(); window.dispatchEvent(new Event('agenthub:search')); }}>#{tag}</span>)}
            </div>
          )}
          <div className="author-row">
            <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}><Icons.Users size={10}/></div>
            <span style={{color: 'var(--text-2)', fontWeight: 500}}>{c.author.name}</span>
            <span className="breadcrumb-sep">·</span>
            <span>{fmtDate(c.created_at)} {t('detail_registered')}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-accent" onClick={() => setShowDeploy(true)}><Icons.Zap size={13}/> {t('deploy_btn')}</button>
          <button className="btn btn-secondary" style={{color: starred ? '#f59e0b' : undefined, borderColor: starred ? '#f59e0b' : undefined}} onClick={() => { const id = c.id; if (id && String(id).includes('-')) api.components.star(id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } else { setStarCount(s => Math.max(0, s - 1)); setStarred(false); } }).catch(() => {}); }}><Icons.Star size={13}/> {starCount}</button>
          <button className="btn btn-secondary" onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(flowData || {name: c.title}, null, 2));
            if (c.id && String(c.id).includes('-') && !starred) {
              api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
            }
            setCopyToast(t('toast_copy_json')); setTimeout(() => setCopyToast(''), 3000);
          }}><Icons.Code size={13}/> {t('detail_copy_json')}</button>
          <button className="btn btn-primary" onClick={() => {
            if (c.id && String(c.id).includes('-')) {
              api.components.file(c.id).then(d => {
                const blob = new Blob([d.content], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = (c.title || 'flow').replace(/\s+/g, '_') + '.json'; a.click();
                URL.revokeObjectURL(url);
                api.components.download(c.id).catch(() => {});
              }).catch(() => alert(t('detail_download_failed')));
            }
          }}><Icons.Download size={13}/> {t('detail_download')}</button>
          <button className="btn btn-secondary" onClick={() => {
            const url = window.location.origin + window.location.pathname + '#/flow/' + c.id;
            navigator.clipboard?.writeText(url);
            setCopyToast(t('toast_copy_link')); setTimeout(() => setCopyToast(''), 2000);
          }}><Icons.Link size={13}/> {t('detail_copy_link')}</button>
          {currentUser && (currentUser.role === 'admin' || currentUser.employee_id === (c.author?.id || c.author_id)) && (
            <button className="btn btn-secondary" onClick={() => setShowUpdate(true)}><Icons.Upload size={13}/> {t('detail_update')}</button>
          )}
        </div>
      </div>

      {copyToast && (
        <div className="copy-toast">
          {copyToast}
        </div>
      )}

      <div className="version-row">
        <span className="version-row-label">{t('flow_compat')}</span>
        <span className="mono" style={{fontSize: 12, color: 'var(--text-2)'}}>{c.minLF} ~ {c.maxLF}</span>
        <span className="version-row-tag">{t('flow_tested')}</span>
        {c.testedVersions.map(v => (
          <span key={v} className="version-pill tested"><Icons.Check size={10}/> {v}</span>
        ))}
        <div className="version-row-sep"/>
        <span className="chip chip-ok"><Icons.Check size={10}/> {t('flow_std_compat').replace('{ver}', latestVersion)}</span>
      </div>

      <div className="grid-4" style={{marginTop: 24}}>
        <Stat label="Star" value={starCount} icon={<Icons.Star size={12}/>}/>
        <Stat label={t('detail_download')} value={c.downloads_count ?? c.downloads ?? 0} icon={<Icons.Download size={12}/>}/>
        <Stat label={t('flow_stat_nodes')} value={flowData ? (flowData.nodes?.length || 0) : (c.nodes ?? '—')} icon={<Icons.Workflow size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', t('upload_field_readme')],
          ['graph', t('flow_tab_graph')],
          ['json', t('flow_tab_json')],
          ['versions', t('flow_tab_versions')],
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
        {tab === 'json' && <FlowJsonView flowData={flowData} onCopy={() => {
          if (c.id && String(c.id).includes('-') && !starred) {
            api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
          }
          setCopyToast(t('toast_copy_json')); setTimeout(() => setCopyToast(''), 3000);
        }}/>}
        {tab === 'versions' && (
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '14px 18px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: 13}}>
              {t('flow_current')} {c.version}
            </div>
            {versionHistory.length === 0 && <div className="muted-sm" style={{padding: 24, textAlign: 'center'}}>{t('flow_no_versions')}</div>}
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
      {showDeploy && <DeployModal component={c} onClose={() => setShowDeploy(false)}/>}
    </div>
  );
}

function FlowReadme({ c }) {
  const { t } = useI18n();
  if (!c.readme) {
    return (
      <div className="card card-pad" style={{padding: 28, textAlign: 'center', color: 'var(--text-3)', marginBottom: 24}}>
        <div style={{fontSize: 36, marginBottom: 12, opacity: 0.4}}>📄</div>
        <div style={{fontWeight: 500, marginBottom: 6}}>{t('flow_readme_empty')}</div>
        <div style={{fontSize: 13}}>{t('flow_readme_empty_desc')}</div>
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
  const { t } = useI18n();
  // Extract real node/edge counts from flowData
  const nodeCount = flowData ? (flowData.nodes?.length || 0) : FLOW_NODES.length;
  const edgeCount = flowData ? (flowData.edges?.length || 0) : FLOW_EDGES.length;

  // If flowData exists but has no nodes/edges, show fallback
  if (flowData && (!flowData.nodes || flowData.nodes.length === 0)) {
    return (
      <div className="flow-graph-card">
        <div className="flow-graph-toolbar">
          <span className="h3">{t('flow_tab_graph')}</span>
        </div>
        <div style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
          <div style={{fontSize: 28, marginBottom: 10, opacity: 0.4}}>⚠</div>
          <div style={{fontWeight: 500, marginBottom: 6}}>{t('flow_graph_err')}</div>
          <div style={{fontSize: 13}}>{t('flow_graph_err_desc')}</div>
          <div style={{fontSize: 12, marginTop: 8, color: 'var(--text-4)'}}>{t('flow_graph_err_hint')}</div>
        </div>
      </div>
    );
  }

  // Auto-layout: topological left-to-right layers
  let layoutNodes;
  if (flowData && flowData.nodes) {
    const nodes = flowData.nodes.map(n => {
      const d = n.data || {};
      return { id: d.id || n.id, label: d.display_name || d.node?.display_name || d.type || n.type || 'Node', sub: d.type || '', kind: 'process' };
    });
    const edges = (flowData.edges || []).map(e => {
      const d = e.data || {};
      return { src: d.sourceHandle?.id || e.source, tgt: d.targetHandle?.id || e.target };
    });
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(e => nodeIds.has(e.src) && nodeIds.has(e.tgt));

    // Build adjacency + in-degree for topological layering
    const inDeg = {}; const children = {};
    nodes.forEach(n => { inDeg[n.id] = 0; children[n.id] = []; });
    validEdges.forEach(e => { inDeg[e.tgt] = (inDeg[e.tgt] || 0) + 1; children[e.src] = children[e.src] || []; children[e.src].push(e.tgt); });

    // BFS layering (Kahn's algorithm)
    const layers = []; const layerOf = {}; const queue = [];
    nodes.forEach(n => { if (inDeg[n.id] === 0) queue.push(n.id); });
    while (queue.length > 0) {
      const layer = [...queue]; layers.push(layer); queue.length = 0;
      for (const nid of layer) {
        layerOf[nid] = layers.length - 1;
        for (const ch of (children[nid] || [])) {
          inDeg[ch]--;
          if (inDeg[ch] === 0) queue.push(ch);
        }
      }
    }
    // Any remaining nodes (cycles) go to last layer
    nodes.forEach(n => { if (layerOf[n.id] === undefined) { layers.push([n.id]); layerOf[n.id] = layers.length - 1; } });

    const COL_GAP = 180, ROW_GAP = 80, PAD = 30;
    const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
    layoutNodes = [];
    layers.forEach((layer, col) => {
      const startY = PAD + (layers.reduce((max, l) => Math.max(max, l.length), 0) - layer.length) * ROW_GAP / 2;
      layer.forEach((nid, row) => {
        const n = nodeById[nid];
        if (n) layoutNodes.push({ ...n, x: PAD + col * COL_GAP, y: startY + row * ROW_GAP });
      });
    });
  } else {
    layoutNodes = FLOW_NODES;
  }

  const nodeMap = Object.fromEntries(layoutNodes.map(n => [n.id, n]));
  const NODE_W = 130, NODE_H = 50;
  const canvasW = layoutNodes.length > 0 ? Math.max(...layoutNodes.map(n => n.x)) + NODE_W + 40 : 600;
  const canvasH = layoutNodes.length > 0 ? Math.max(...layoutNodes.map(n => n.y)) + NODE_H + 40 : 300;

  // Build renderable edges — Langflow format: data.sourceHandle.id → data.targetHandle.id
  let layoutEdges;
  if (flowData && flowData.edges) {
    layoutEdges = flowData.edges.map(e => {
      const d = e.data || {};
      const src = d.sourceHandle?.id || e.source || e.from;
      const tgt = d.targetHandle?.id || e.target || e.to;
      return [src, tgt, false];
    }).filter(([f, t]) => nodeMap[f] && nodeMap[t]);
  } else {
    layoutEdges = FLOW_EDGES;
  }

  return (
    <div className="flow-graph-card">
      <div className="flow-graph-toolbar">
        <div className="row gap-8">
          <span className="h3">{t('flow_tab_graph')}</span>
          <span className="muted-sm">· {nodeCount} {t('flow_nodes_unit')} · {edgeCount} {t('flow_edges_unit')}</span>
        </div>
      </div>
      <div className="flow-graph-canvas" style={{height: Math.max(canvasH, 300)}}>
        <svg width={canvasW} height={canvasH} style={{position: 'absolute', top: 0, left: 0}}>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,1 L10,5 L0,9 z" fill="#94a3b8"/>
            </marker>
          </defs>
          {layoutEdges.map(([from, to, dashed], i) => {
            const a = nodeMap[from], b = nodeMap[to];
            if (!a || !b) return null;
            const cx1 = a.x + NODE_W/2, cy1 = a.y + NODE_H/2;
            const cx2 = b.x + NODE_W/2, cy2 = b.y + NODE_H/2;
            // Start from right edge of source, end at left edge of target
            const x1 = cx2 > cx1 ? a.x + NODE_W : a.x;
            const y1 = cy1;
            const x2 = cx2 > cx1 ? b.x : b.x + NODE_W;
            const y2 = cy2;
            const dx = Math.abs(x2 - x1) * 0.4;
            const path = `M ${x1} ${y1} C ${x1 + (cx2 > cx1 ? dx : -dx)} ${y1}, ${x2 + (cx2 > cx1 ? -dx : dx)} ${y2}, ${x2} ${y2}`;
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

function FlowJsonView({ flowData, onCopy }) {
  const { t } = useI18n();
  const json = flowData ? JSON.stringify(flowData, null, 2) : t('flow_json_empty');
  const sizeKB = (new Blob([json]).size / 1024).toFixed(1);
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => { navigator.clipboard?.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1500); if (onCopy) onCopy(); };
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <div className="row gap-8">
          <Icons.Code size={13}/>
          <span style={{fontWeight: 600}}>flow.json</span>
          <span style={{color: '#6b7d6b'}}>· {sizeKB} KB</span>
        </div>
        <button className="btn btn-sm btn-ghost" style={{color: '#b6b3ab'}} onClick={handleCopy}>
          {copied ? <><Icons.Check size={11}/> {t('detail_copied')}</> : <><Icons.Copy size={11}/> {t('detail_copy')}</>}
        </button>
      </div>
      <div className="codeblock-body">
        <div className="codeblock-content" style={{whiteSpace: 'pre', color: '#e6e4df'}}>{json}</div>
      </div>
    </div>
  );
}

window.FlowDetail = FlowDetail;
