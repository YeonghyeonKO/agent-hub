// Deploy modal — Component(.py)/Flow(.json)를 개인 Langflow 엔드포인트에 즉시 배포
// 엔드포인트는 최대 5개까지 추가, 각 엔드포인트는 연결 테스트로 상태(초록/빨강) 표시.

const MAX_ENDPOINTS = 5;

// Langflow 웹 UI / API 라우트의 첫 세그먼트. backend의 normalize_base_url 과 동일 규칙.
const LANGFLOW_ROUTE_SEGMENTS = new Set([
  'flow', 'flows', 'login', 'logout', 'signup', 'settings', 'store',
  'playground', 'admin', 'all', 'components', 'component', 'dashboard',
  'account', 'profile', 'view', 'files', 'mcp', 'health', 'api',
]);

// 사용자가 대충 입력한 주소를 일관된 base_url 로 보정한다(backend와 동일 규칙의 즉시 피드백용).
// backend가 저장·테스트 시 재정규화하므로 여기선 흔한 실수(scheme 누락, 주소창 통째 붙여넣기)만
// 잡아 입력란을 즉시 교정하면 충분하다.
function normalizeBaseUrl(url, defaultScheme = 'https') {
  let raw = (url || '').trim().replace(/^[<"']+|[>"']+$/g, '').trim();
  if (!raw) return '';
  const httpM = raw.match(/^(https?):\/{0,2}/i);
  const otherM = raw.match(/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//);
  if (httpM) raw = httpM[1].toLowerCase() + '://' + raw.slice(httpM[0].length);
  else if (otherM) raw = defaultScheme + '://' + raw.slice(otherM[0].length);
  else raw = defaultScheme + '://' + raw;
  let u;
  try { u = new URL(raw); } catch { return raw.replace(/\/+$/, ''); }
  const host = u.host.toLowerCase();
  if (!host) return '';
  const kept = [];
  for (const seg of u.pathname.split('/').filter(Boolean)) {
    if (LANGFLOW_ROUTE_SEGMENTS.has(seg.toLowerCase())) break;
    kept.push(seg);
  }
  const path = kept.length ? '/' + kept.join('/') : '';
  return (u.protocol + '//' + host + path).replace(/\/+$/, '');
}

function StatusDot({ status }) {
  const { t } = useI18n();
  // ok=초록, error=빨강, testing=주황(점멸), unknown/null=회색
  const color = status === 'ok' ? '#10b981'
    : status === 'error' ? '#ef4444'
    : status === 'testing' ? '#f59e0b'
    : 'var(--text-3)';
  const label = status === 'ok' ? t('deploy_status_ok')
    : status === 'error' ? t('deploy_status_error')
    : status === 'testing' ? t('deploy_status_testing')
    : t('deploy_status_unknown');
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

function AddEndpointForm({ onAdded, onCancel, suggestedUrl = '' }) {
  const { t } = useI18n();
  const [name, setName] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState(suggestedUrl);
  const [apiKey, setApiKey] = React.useState('');
  const [urlFixed, setUrlFixed] = React.useState(false); // 입력 보정이 적용됐는지
  const [testState, setTestState] = React.useState(null); // null/testing/ok/error
  const [testMsg, setTestMsg] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // 제안 URL의 scheme을 환경 기본 scheme으로 사용(사내가 http면 http로 보정).
  const defaultScheme = (suggestedUrl || '').toLowerCase().startsWith('http://') ? 'http' : 'https';

  const canTest = name.trim().length > 0 && baseUrl.trim().length > 0;
  const canSave = name.trim().length > 0 && baseUrl.trim().length > 0 && !saving;

  // 입력란을 떠날 때 주소를 즉시 보정해 보여준다. 바뀌었으면 안내 힌트를 노출.
  const applyUrlFix = () => {
    const fixed = normalizeBaseUrl(baseUrl, defaultScheme);
    if (fixed && fixed !== baseUrl) { setBaseUrl(fixed); setUrlFixed(true); }
    return fixed || baseUrl.trim();
  };

  const handleTest = () => {
    const clean = applyUrlFix();
    setTestState('testing'); setTestMsg('');
    api.deploy.test({ base_url: clean, api_key: apiKey.trim() || null })
      .then(r => { setTestState(r.ok ? 'ok' : 'error'); setTestMsg(r.ok ? (r.version ? `Agent Builder ${r.version}` : t('deploy_test_ok')) : (r.message || t('deploy_test_fail'))); })
      .catch(() => { setTestState('error'); setTestMsg(t('deploy_test_fail')); });
  };

  const handleSave = () => {
    const clean = applyUrlFix();
    setSaving(true);
    api.deploy.addEndpoint({ name: name.trim(), base_url: clean, api_key: apiKey.trim() || null })
      .then(ep => onAdded(ep))
      .catch(async (e) => {
        let detail = '';
        try { detail = (await e.response?.json())?.detail || ''; } catch {}
        alert(t('deploy_ep_add_fail') + (detail || e.message || ''));
        setSaving(false);
      });
  };

  return (
    <div className="card card-pad" style={{padding: 16, background: 'var(--bg-muted)', marginTop: 12}}>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">{t('deploy_ep_name')} <span className="req">*</span></label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t('deploy_ep_name_ph')}/>
      </div>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">{t('deploy_ep_url')} <span className="req">*</span></label>
        <input className="input" value={baseUrl}
          onChange={e => { setBaseUrl(e.target.value); setUrlFixed(false); setTestState(null); setTestMsg(''); }}
          onBlur={applyUrlFix}
          placeholder={t('deploy_ep_url_ph')}/>
        {urlFixed && (
          <div className="field-hint row gap-8" style={{marginTop: 6, color: 'var(--ok-fg)'}}>
            <Icons.Check size={11}/> {t('deploy_ep_url_fixed')}
          </div>
        )}
      </div>
      <div className="field" style={{marginBottom: 12}}>
        <label className="field-label">API Key <span className="muted-sm" style={{fontWeight: 400}}>{t('deploy_ep_apikey_opt')}</span></label>
        <input className="input" type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setTestState(null); setTestMsg(''); }} placeholder={t('deploy_ep_apikey_ph')}/>
      </div>
      <div className="row gap-8" style={{justifyContent: 'space-between', alignItems: 'center'}}>
        <div className="row gap-8">
          <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={!canTest || testState === 'testing'}>
            <Icons.Plug size={12}/> {t('deploy_test')}
          </button>
          {testState && <StatusDot status={testState}/>}
          {testMsg && <span style={{fontSize: 11, color: testState === 'ok' ? 'var(--ok-fg)' : 'var(--err-fg)'}}>{testMsg}</span>}
        </div>
        <div className="row gap-8">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>{t('btn_cancel')}</button>
          <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={!canSave} style={{opacity: canSave ? 1 : 0.5}}>
            {saving ? t('deploy_saving') : t('deploy_save')}
          </button>
        </div>
      </div>
      {!canSave && !saving && (
        <div className="field-hint" style={{marginTop: 8, color: 'var(--text-3)'}}>{t('deploy_ep_required_hint')}</div>
      )}
    </div>
  );
}

function DeployModal({ component, onClose }) {
  const { t } = useI18n();
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
  const [suggestedUrl, setSuggestedUrl] = React.useState('');

  React.useEffect(() => {
    api.deploy.suggestedUrl().then(r => setSuggestedUrl(r.suggested_url || '')).catch(() => {});
  }, []);

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
      .catch(e => setProjErr(e.message ? t('deploy_project_err') : t('deploy_project_err2')));
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
    if (!confirm(t('deploy_ep_del_confirm'))) return;
    api.deploy.delEndpoint(id).then(() => {
      setEndpoints(eps => eps.filter(ep => ep.id !== id));
      if (selectedEp === id) setSelectedEp(null);
    }).catch(() => alert(t('deploy_ep_del_fail')));
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
        // 백엔드가 보낸 detail(예: "인증 실패: API Key를 확인하세요.")을 그대로 노출한다.
        let detail = '';
        try { detail = (await e.response?.json())?.detail || ''; } catch {}
        setError(detail || (e.status === 502 ? t('deploy_err_502') : t('deploy_err_generic')));
        setDeploying(false);
      });
  };

  const canDeploy = selectedEp && !deploying && (projects !== null);

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{width: 560}}>
        <div className="modal-header">
          <div>
            <div className="row gap-8" style={{marginBottom: 4}}>
              <Icons.Zap size={16}/>
              <span style={{fontWeight: 700, fontSize: 16}}>{t('deploy_title')}</span>
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
              <div style={{fontWeight: 600, marginBottom: 6}}>{t('deploy_done')}</div>
              <div className="muted-sm" style={{marginBottom: 16}}>{t('deploy_done_desc').replace('{name}', result.name)}</div>
              <a className="btn btn-accent btn-sm" href={result.flow_url} target="_blank" rel="noopener">
                <Icons.ArrowRight size={12}/> {t('deploy_open_langflow')}
              </a>
            </div>
          ) : (
            <>
              {/* ── 엔드포인트 선택 ── */}
              <div className="field-label" style={{marginBottom: 8}}>{t('deploy_target_ep')}</div>
              {loadingEp ? (
                <div className="muted-sm" style={{padding: 12}}>{t('deploy_loading')}</div>
              ) : endpoints.length === 0 && !showAdd ? (
                <div className="card card-pad" style={{padding: 16, textAlign: 'center', color: 'var(--text-3)'}}>
                  <div style={{fontSize: 13, marginBottom: 8}}>{t('deploy_no_ep')}</div>
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
                      <button className="btn btn-ghost btn-sm" title={t('deploy_test')} onClick={(e) => { e.stopPropagation(); handleTestEndpoint(ep.id); }}><Icons.Plug size={12}/></button>
                      <button className="btn btn-ghost btn-sm" title={t('btn_delete')} onClick={(e) => { e.stopPropagation(); handleDelete(ep.id); }} style={{color: 'var(--err-fg)'}}><Icons.X size={12}/></button>
                    </div>
                  ))}
                </div>
              )}

              {showAdd ? (
                <AddEndpointForm
                  onAdded={(ep) => { setShowAdd(false); setEndpoints(eps => [...eps, ep]); setSelectedEp(ep.id); }}
                  onCancel={() => setShowAdd(false)}
                  suggestedUrl={suggestedUrl}
                />
              ) : (
                <div style={{marginTop: 10}}>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => setShowAdd(true)} disabled={endpoints.length >= MAX_ENDPOINTS}>
                    <Icons.Plus size={12}/> {t('deploy_add_ep')} ({endpoints.length}/{MAX_ENDPOINTS})
                  </button>
                  {endpoints.length >= MAX_ENDPOINTS && (
                    <div className="field-hint" style={{marginTop: 6, color: 'var(--text-3)'}}>
                      {t('deploy_ep_max').replace('{max}', MAX_ENDPOINTS)}
                    </div>
                  )}
                </div>
              )}

              {/* ── 배포 위치 선택 ── */}
              {selectedEp && (
                <div style={{marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 18}}>
                  <div className="field">
                    <label className="field-label">{t('deploy_project')}</label>
                    {projErr ? (
                      <div style={{fontSize: 12, color: 'var(--err-fg)'}}>{projErr} {t('deploy_retry_before')}(<Icons.Plug size={10}/>){t('deploy_retry_after')}</div>
                    ) : projects === null ? (
                      <div className="muted-sm">{t('deploy_project_loading')}</div>
                    ) : (
                      <select className="select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                        <option value="">{t('deploy_project_default')}</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </div>

                  {!isFlow && (
                    <div className="field">
                      <label className="field-label">{t('deploy_flow_target')}</label>
                      <select className="select" value={selectedFlow} onChange={e => setSelectedFlow(e.target.value)} disabled={!selectedProject}>
                        <option value="">{t('deploy_flow_new')}</option>
                        {(flows || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <div className="field-hint">
                        {selectedProject ? t('deploy_flow_hint_sel') : t('deploy_flow_hint_nosel')}
                      </div>
                    </div>
                  )}
                  {isFlow && (
                    <div className="field-hint" style={{marginTop: -6}}>{t('deploy_flow_json_hint')}</div>
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
            <span className="muted-sm">{isFlow ? t('deploy_footer_flow') : t('deploy_footer_comp')}</span>
            <div className="row gap-8">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>{t('btn_cancel')}</button>
              <button className="btn btn-accent btn-sm" onClick={handleDeploy} disabled={!canDeploy} style={{opacity: canDeploy ? 1 : 0.5}}>
                {deploying ? t('deploy_deploying') : <><Icons.Zap size={12}/> {t('deploy_btn')}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DeployModal = DeployModal;
