// Deploy modal — Component(.py)/Flow(.json)를 개인 Langflow 엔드포인트에 즉시 배포
// 엔드포인트는 최대 5개까지 추가, 각 엔드포인트는 연결 테스트로 상태(초록/빨강) 표시.

const MAX_ENDPOINTS = 5;

function StatusDot({ status }) {
  // ok=초록, error=빨강, testing=주황(점멸), unknown/null=회색
  const color = status === 'ok' ? '#10b981'
    : status === 'error' ? '#ef4444'
    : status === 'testing' ? '#f59e0b'
    : 'var(--text-3)';
  const label = status === 'ok' ? '정상'
    : status === 'error' ? '실패'
    : status === 'testing' ? '확인 중'
    : '미확인';
  return (
    <span className="row gap-8" style={{fontSize: 11, color: 'var(--text-3)'}}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block',
        boxShadow: status === 'ok' ? '0 0 0 3px rgba(16,185,129,0.15)' : status === 'error' ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
        animation: status === 'testing' ? 'pulse 1s infinite' : 'none',
      }}/>
      {label}
    </span>
  );
}

function AddEndpointForm({ onAdded, onCancel }) {
  const [name, setName] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [testState, setTestState] = React.useState(null); // null/testing/ok/error
  const [testMsg, setTestMsg] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const canTest = baseUrl.trim().length > 0;
  const canSave = name.trim().length > 0 && baseUrl.trim().length > 0 && !saving;

  const handleTest = () => {
    setTestState('testing'); setTestMsg('');
    api.deploy.test({ base_url: baseUrl.trim(), api_key: apiKey.trim() || null })
      .then(r => { setTestState(r.ok ? 'ok' : 'error'); setTestMsg(r.ok ? (r.version ? `Langflow ${r.version}` : '연결 성공') : (r.message || '연결 실패')); })
      .catch(() => { setTestState('error'); setTestMsg('연결 실패'); });
  };

  const handleSave = () => {
    setSaving(true);
    api.deploy.addEndpoint({ name: name.trim(), base_url: baseUrl.trim(), api_key: apiKey.trim() || null })
      .then(ep => onAdded(ep))
      .catch(e => { alert('엔드포인트 추가 실패: ' + (e.message || '')); setSaving(false); });
  };

  return (
    <div className="card card-pad" style={{padding: 16, background: 'var(--bg-muted)', marginTop: 12}}>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">별칭 <span className="req">*</span></label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="예: 내 로컬 Langflow"/>
      </div>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">Langflow 주소 (Base URL) <span className="req">*</span></label>
        <input className="input" value={baseUrl} onChange={e => { setBaseUrl(e.target.value); setTestState(null); }} placeholder="https://langflow.mycorp 또는 http://localhost:7860"/>
      </div>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">API Key <span className="muted-sm" style={{fontWeight: 400}}>(선택)</span></label>
        <input className="input" type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setTestState(null); }} placeholder="x-api-key (인증이 필요한 경우)"/>
      </div>
      <div className="row gap-8" style={{justifyContent: 'space-between', alignItems: 'center'}}>
        <div className="row gap-8">
          <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={!canTest || testState === 'testing'}>
            <Icons.Plug size={12}/> 연결 테스트
          </button>
          {testState && <StatusDot status={testState}/>}
          {testMsg && <span style={{fontSize: 11, color: testState === 'ok' ? 'var(--ok-fg)' : 'var(--err-fg)'}}>{testMsg}</span>}
        </div>
        <div className="row gap-8">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>취소</button>
          <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={!canSave} style={{opacity: canSave ? 1 : 0.5}}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeployModal({ component, onClose }) {
  const c = component;
  const isFlow = c.type === 'json';

  const [endpoints, setEndpoints] = React.useState([]);
  const [loadingEp, setLoadingEp] = React.useState(true);
  const [selectedEp, setSelectedEp] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [testing, setTesting] = React.useState({}); // {epId: 'testing'} 일시 상태

  const [projects, setProjects] = React.useState(null);
  const [projErr, setProjErr] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');
  const [flows, setFlows] = React.useState(null);
  const [selectedFlow, setSelectedFlow] = React.useState('');

  const [deploying, setDeploying] = React.useState(false);
  const [result, setResult] = React.useState(null); // {flow_url, name}
  const [error, setError] = React.useState('');

  const loadEndpoints = React.useCallback(() => {
    setLoadingEp(true);
    api.deploy.endpoints()
      .then(list => { setEndpoints(list); setLoadingEp(false); if (list.length && !selectedEp) setSelectedEp(list[0].id); })
      .catch(() => { setLoadingEp(false); });
  }, [selectedEp]);

  React.useEffect(() => { loadEndpoints(); }, []);

  // 엔드포인트 선택 시 프로젝트 목록 로드
  React.useEffect(() => {
    if (!selectedEp) { setProjects(null); return; }
    setProjects(null); setProjErr(''); setSelectedProject(''); setFlows(null); setSelectedFlow('');
    api.deploy.projects(selectedEp)
      .then(setProjects)
      .catch(e => setProjErr(e.message ? '프로젝트를 불러오지 못했습니다. 연결 상태를 확인하세요.' : '프로젝트 조회 실패'));
  }, [selectedEp]);

  // (component 한정) 프로젝트 선택 시 Flow 목록 로드
  React.useEffect(() => {
    if (isFlow || !selectedEp || !selectedProject) { setFlows(null); return; }
    setFlows(null); setSelectedFlow('');
    api.deploy.flows(selectedEp, selectedProject).then(setFlows).catch(() => setFlows([]));
  }, [selectedEp, selectedProject, isFlow]);

  const handleTestEndpoint = (id) => {
    setTesting(t => ({ ...t, [id]: 'testing' }));
    api.deploy.testEndpoint(id)
      .then(r => {
        setEndpoints(eps => eps.map(ep => ep.id === id ? { ...ep, last_status: r.ok ? 'ok' : 'error' } : ep));
        setTesting(t => { const n = { ...t }; delete n[id]; return n; });
      })
      .catch(() => setTesting(t => { const n = { ...t }; delete n[id]; return n; }));
  };

  const handleDelete = (id) => {
    if (!confirm('이 엔드포인트를 삭제할까요?')) return;
    api.deploy.delEndpoint(id).then(() => {
      setEndpoints(eps => eps.filter(ep => ep.id !== id));
      if (selectedEp === id) setSelectedEp(null);
    }).catch(() => alert('삭제 실패'));
  };

  const handleDeploy = () => {
    setDeploying(true); setError('');
    api.deploy.deployAsset(c.id, {
      endpoint_id: selectedEp,
      project_id: selectedProject || null,
      flow_id: (!isFlow && selectedFlow) ? selectedFlow : null,
    })
      .then(r => { setResult(r); setDeploying(false); })
      .catch(async (e) => {
        let msg = '배포에 실패했습니다.';
        try { msg = (await e.response?.json())?.detail || msg; } catch {}
        // api 헬퍼는 message만 throw하므로 기본 메시지 사용
        setError(e.message && e.message.includes('502') ? '배포 대상 Langflow에서 오류가 발생했습니다.' : msg);
        setDeploying(false);
      });
  };

  const canDeploy = selectedEp && !deploying && (projects !== null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{width: 560}}>
        <div className="modal-header">
          <div>
            <div className="row gap-8" style={{marginBottom: 4}}>
              <Icons.Zap size={16}/>
              <span style={{fontWeight: 700, fontSize: 16}}>Langflow에 배포</span>
            </div>
            <div className="muted-sm">
              <span className={`chip ${isFlow ? 'chip-json' : 'chip-py'}`} style={{fontSize: 10, marginRight: 6}}>{isFlow ? '.json' : '.py'}</span>
              {c.title}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icons.X/></button>
        </div>

        <div className="modal-body">
          {result ? (
            <div style={{textAlign: 'center', padding: '20px 8px'}}>
              <div style={{fontSize: 36, marginBottom: 12}}>🚀</div>
              <div style={{fontWeight: 600, marginBottom: 6}}>배포 완료!</div>
              <div className="muted-sm" style={{marginBottom: 16}}>"{result.name}" Flow가 생성/업데이트되었습니다.</div>
              <a className="btn btn-accent btn-sm" href={result.flow_url} target="_blank" rel="noopener">
                <Icons.ArrowRight size={12}/> Langflow에서 열기
              </a>
            </div>
          ) : (
            <>
              {/* ── 엔드포인트 선택 ── */}
              <div className="field-label" style={{marginBottom: 8}}>배포 대상 엔드포인트</div>
              {loadingEp ? (
                <div className="muted-sm" style={{padding: 12}}>불러오는 중…</div>
              ) : endpoints.length === 0 && !showAdd ? (
                <div className="card card-pad" style={{padding: 16, textAlign: 'center', color: 'var(--text-3)'}}>
                  <div style={{fontSize: 13, marginBottom: 8}}>등록된 Langflow 엔드포인트가 없습니다.</div>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  {endpoints.map(ep => (
                    <div key={ep.id}
                      onClick={() => setSelectedEp(ep.id)}
                      style={{
                        border: `1px solid ${selectedEp === ep.id ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 'var(--radius)', padding: '10px 12px', cursor: 'pointer',
                        background: selectedEp === ep.id ? 'rgba(79,70,229,0.04)' : 'var(--bg-elev)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                      <input type="radio" checked={selectedEp === ep.id} onChange={() => setSelectedEp(ep.id)} style={{accentColor: 'var(--accent)'}}/>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{fontWeight: 600, fontSize: 13}}>{ep.name}</div>
                        <div className="mono" style={{fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{ep.base_url}</div>
                      </div>
                      <StatusDot status={testing[ep.id] || ep.last_status}/>
                      <button className="btn btn-ghost btn-sm" title="연결 테스트" onClick={(e) => { e.stopPropagation(); handleTestEndpoint(ep.id); }}><Icons.Plug size={12}/></button>
                      <button className="btn btn-ghost btn-sm" title="삭제" onClick={(e) => { e.stopPropagation(); handleDelete(ep.id); }} style={{color: 'var(--err-fg)'}}><Icons.X size={12}/></button>
                    </div>
                  ))}
                </div>
              )}

              {showAdd ? (
                <AddEndpointForm
                  onAdded={(ep) => { setShowAdd(false); setEndpoints(eps => [...eps, ep]); setSelectedEp(ep.id); }}
                  onCancel={() => setShowAdd(false)}
                />
              ) : (
                <button className="btn btn-secondary btn-sm" style={{marginTop: 10}}
                  onClick={() => setShowAdd(true)} disabled={endpoints.length >= MAX_ENDPOINTS}>
                  <Icons.Plus size={12}/> 엔드포인트 추가 ({endpoints.length}/{MAX_ENDPOINTS})
                </button>
              )}

              {/* ── 배포 위치 선택 ── */}
              {selectedEp && (
                <div style={{marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 18}}>
                  <div className="field">
                    <label className="field-label">프로젝트</label>
                    {projErr ? (
                      <div style={{fontSize: 12, color: 'var(--err-fg)'}}>{projErr} 연결 테스트(<Icons.Plug size={10}/>) 후 다시 시도하세요.</div>
                    ) : projects === null ? (
                      <div className="muted-sm">프로젝트 불러오는 중…</div>
                    ) : (
                      <select className="select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                        <option value="">기본 프로젝트 (자동 선택)</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </div>

                  {!isFlow && (
                    <div className="field">
                      <label className="field-label">대상 Flow</label>
                      <select className="select" value={selectedFlow} onChange={e => setSelectedFlow(e.target.value)} disabled={!selectedProject}>
                        <option value="">새 Flow 생성 (컴포넌트 단독)</option>
                        {(flows || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <div className="field-hint">
                        {selectedProject ? '선택한 Flow에 컴포넌트 노드를 추가합니다. 미선택 시 새 Flow를 만듭니다.' : '프로젝트를 먼저 선택하면 기존 Flow를 고를 수 있습니다.'}
                      </div>
                    </div>
                  )}
                  {isFlow && (
                    <div className="field-hint" style={{marginTop: -6}}>이 Flow(.json)는 선택한 프로젝트에 새 Flow로 생성됩니다.</div>
                  )}
                </div>
              )}

              {error && (
                <div className="card card-pad" style={{padding: 12, marginTop: 14, background: 'var(--err-bg)', color: 'var(--err-fg)', fontSize: 12}}>
                  <Icons.Warn size={12}/> {error}
                </div>
              )}
            </>
          )}
        </div>

        {!result && (
          <div className="modal-footer">
            <span className="muted-sm">{isFlow ? 'Flow를 새로 생성합니다' : '컴포넌트를 Flow에 배포합니다'}</span>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>취소</button>
              <button className="btn btn-accent btn-sm" onClick={handleDeploy} disabled={!canDeploy} style={{opacity: canDeploy ? 1 : 0.5}}>
                {deploying ? '배포 중…' : <><Icons.Zap size={12}/> 배포</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DeployModal = DeployModal;
