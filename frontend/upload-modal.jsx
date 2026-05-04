// Upload modal — multi-step submission (wired to API)

function UploadModal({ onClose }) {
  const { t } = useI18n();
  const [step, setStep] = React.useState(0);
  const [realFile, setRealFile] = React.useState(null);
  const [drag, setDrag] = React.useState(false);
  const [fileType, setFileType] = React.useState('py');
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [category, setCategory] = React.useState('RAG / Search');
  const [icon, setIcon] = React.useState('Box');
  const [tags, setTags] = React.useState([]);
  const [tagInput, setTagInput] = React.useState('');
  const [minVer, setMinVer] = React.useState('1.8.0');
  const [maxVer, setMaxVer] = React.useState('1.9.1');
  const [tested, setTested] = React.useState(['1.9.1', '1.9.0']);
  const [deps, setDeps] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitDone, setSubmitDone] = React.useState(false);

  // Real file validation
  const [validation, setValidation] = React.useState(null);

  // User info from API
  const [user, setUser] = React.useState(null);
  React.useEffect(() => { api.users.me().then(setUser).catch(() => {}); }, []);

  const validateFile = (file) => {
    const checks = [];
    const ext = file.name.split('.').pop()?.toLowerCase();
    // 1. File type
    checks.push({ label: `Valid file type (.${ext})`, ok: ext === 'py' || ext === 'json' });
    // 2. File size (< 5MB)
    checks.push({ label: 'File size OK (' + (file.size / 1024).toFixed(1) + ' KB)', ok: file.size < 5 * 1024 * 1024 });

    // Read content for deeper checks
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      // 3. Secret scan
      const hasSecrets = /(api_key|secret_key|password|token)\s*=\s*['"][^'"]{8,}/i.test(content);
      checks.push({ label: 'No secrets exposed', ok: !hasSecrets, warn: hasSecrets });
      // 4. Import check (py only)
      if (ext === 'py') {
        const hasImports = /^(import |from )/m.test(content);
        checks.push({ label: 'Import check', ok: hasImports });
        // 5. External packages
        const extPkgs = content.match(/^from\s+(?!langflow|app|\.)\S+/gm);
        if (extPkgs && extPkgs.length > 0) {
          checks.push({ label: `External packages ${extPkgs.length} detected`, ok: false, warn: true });
        } else {
          checks.push({ label: 'No external packages', ok: true });
        }
      }
      if (ext === 'json') {
        try { JSON.parse(content); checks.push({ label: 'JSON parsed OK', ok: true }); }
        catch { checks.push({ label: 'JSON parse failed', ok: false }); }
        checks.push({ label: 'Flow structure check', ok: content.includes('"nodes"') || content.includes('"edges"'), warn: !(content.includes('"nodes"')) });
      }
      setValidation(checks);
    };
    reader.readAsText(file);
  };

  const handleRealFile = (file) => {
    if (!file) return;
    setRealFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') setFileType('json');
    else setFileType('py');
    if (!title) setTitle(file.name.replace(/\.(py|json)$/i, ''));
    validateFile(file);
  };

  const handleSubmitToAPI = async () => {
    if (!realFile || !title.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', realFile);
      fd.append('title', title.trim());
      fd.append('type', fileType);
      fd.append('description', desc.trim());
      fd.append('category', category);
      fd.append('version', 'v1.0.0');
      fd.append('min_langflow_ver', minVer);
      fd.append('max_langflow_ver', maxVer === t('upload_no_limit') ? '' : maxVer);
      fd.append('tested_versions', tested.join(','));
      fd.append('icon', icon);
      await api.components.create(fd);
      setSubmitDone(true);
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVer = (v) => { setTested(t => t.includes(v) ? t.filter(x => x !== v) : [...t, v]); };
  const addTag = () => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } };
  const removeTag = (t) => { setTags(tags.filter(x => x !== t)); };

  const VERSIONS = ['1.9.1', '1.9.0', '1.8.3', '1.8.2', '1.8.1', '1.8.0'];
  const ICONS = ['Box', 'Scissors', 'Database', 'Plug', 'Ticket', 'FileText', 'Layers', 'Workflow'];

  const hasFile = !!realFile;
  const valOk = validation ? validation.filter(v => v.ok).length : 0;
  const valTotal = validation ? validation.length : 0;
  const valAllClear = validation ? validation.every(v => v.ok || v.warn) : false;

  if (submitDone) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{textAlign: 'center', padding: 48}}>
          <div style={{fontSize: 48, marginBottom: 16}}>✓</div>
          <div className="h2" style={{marginBottom: 8}}>{t('upload_done_title')}</div>
          <div className="muted">{t('upload_done_desc')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="h2">{t('upload_title')}</div>
            <div className="muted-sm" style={{marginTop: 4}}>{t('upload_subtitle')}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icons.X/></button>
        </div>

        <div style={{padding: '14px 24px 0'}}>
          <div className="stepper">
            <div className={`step ${step >= 0 ? (step === 0 ? 'active' : 'done') : ''}`}>
              <div className="step-num">{step > 0 ? <Icons.Check size={11}/> : 1}</div>
              <span>{t('upload_step_file')}</span>
            </div>
            <div className="step-line"/>
            <div className={`step ${step >= 1 ? (step === 1 ? 'active' : 'done') : ''}`}>
              <div className="step-num">{step > 1 ? <Icons.Check size={11}/> : 2}</div>
              <span>{t('upload_step_meta')}</span>
            </div>
            <div className="step-line"/>
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span>{t('upload_step_compat')}</span>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {step === 0 && (
            <div className="fade-in">
              <div className="field">
                <label className="field-label">{t('upload_type')}</label>
                <div className="segmented">
                  <button className={`segmented-item ${fileType==='py'?'active':''}`} onClick={() => setFileType('py')}>
                    <span className="chip chip-py" style={{padding: '0 6px'}}>.py</span> Component
                  </button>
                  <button className={`segmented-item ${fileType==='json'?'active':''}`} onClick={() => setFileType('json')}>
                    <span className="chip chip-json" style={{padding: '0 6px'}}>.json</span> Flow
                  </button>
                </div>
              </div>

              <div
                className={`dropzone ${drag ? 'drag' : ''} ${hasFile ? 'has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleRealFile(e.dataTransfer.files[0]); }}
                onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.py,.json'; inp.onchange = e => handleRealFile(e.target.files[0]); inp.click(); }}
              >
                {hasFile ? (
                  <div>
                    <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-elev)', borderRadius: 8, border: '1px solid var(--ok)'}}>
                      <Icons.Check size={14}/>
                      <span className="mono" style={{fontWeight: 600, fontSize: 13}}>{realFile.name}</span>
                      <span className="muted-sm">· {(realFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="muted-sm" style={{marginTop: 10, fontSize: 11.5}}>{t('upload_drop_replace')}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: 10}}>
                      <div style={{width: 36, height: 36, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 999, display: 'grid', placeItems: 'center', color: 'var(--text-3)'}}>
                        <Icons.Upload size={16}/>
                      </div>
                    </div>
                    <div className="dropzone-title">{t('upload_drop')}</div>
                    <div className="dropzone-hint">{t('upload_drop_hint')}</div>
                  </div>
                )}
              </div>

              {hasFile && validation && (
                <div style={{marginTop: 16, padding: 14, background: valAllClear ? 'var(--ok-bg)' : 'var(--warn-bg)', border: `1px solid ${valAllClear ? 'var(--ok)' : 'var(--warn)'}`, borderRadius: 8}}>
                  <div style={{fontSize: 12.5, fontWeight: 600, color: valAllClear ? 'var(--ok-fg)' : 'var(--warn-fg)', marginBottom: 8}}>
                    {valAllClear ? <Icons.Check size={11}/> : <Icons.Warn size={11}/>} {t('upload_validation')} ({valOk}/{valTotal})
                  </div>
                  <div className="checklist">
                    {validation.map((v, i) => (
                      <div key={i} className="check-item">
                        <div className={`check-icon ${v.ok ? 'ok' : v.warn ? 'warn' : 'err'}`}>
                          {v.ok ? <Icons.Check size={9}/> : <Icons.Warn size={9}/>}
                        </div>
                        {v.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="fade-in">
              <div className="field">
                <label className="field-label">{t('upload_field_title')} <span className="req">*</span></label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">{t('upload_field_desc')} <span className="req">*</span></label>
                <input className="input" value={desc} onChange={e => setDesc(e.target.value)}/>
                <div className="field-hint">{t('upload_desc_hint')} · {desc.length} / 80</div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label">{t('upload_field_category')} <span className="req">*</span></label>
                  <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>RAG / Search</option>
                    <option>Document</option>
                    <option>Data / ERP</option>
                    <option>Workflow</option>
                    <option>Agent</option>
                    <option>Utility</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">{t('upload_field_icon')}</label>
                  <div className="row gap-8">
                    {ICONS.map(name => {
                      const I = Icons[name] || Icons.Box;
                      const active = icon === name;
                      return (
                        <button key={name} className="btn btn-icon btn-secondary" onClick={() => setIcon(name)} style={{
                          width: 32, height: 32,
                          borderColor: active ? 'var(--accent)' : undefined,
                          background: active ? 'var(--accent-bg)' : undefined,
                          color: active ? 'var(--accent-fg)' : undefined,
                        }}>
                          <I size={14}/>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="field" style={{marginBottom: 0}}>
                <label className="field-label">{t('upload_field_tags')}</label>
                <div className="row gap-8" style={{flexWrap: 'wrap'}}>
                  {tags.map(t => (
                    <span key={t} className="tag" style={{cursor: 'pointer'}} onClick={() => removeTag(t)}>#{t} <Icons.X size={10}/></span>
                  ))}
                  <div className="row gap-8">
                    <input className="input" style={{width: 120, height: 28, fontSize: 12}} placeholder={t("upload_tag_placeholder")} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}/>
                    <button className="tag" style={{cursor: 'pointer', borderStyle: 'dashed'}} onClick={addTag}><Icons.Plus size={10}/> {t('upload_tag_add')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="val-card">
                <div className="val-card-title">{t('upload_compat_title')} <span className="req">*</span></div>
                <div className="muted-sm" style={{marginBottom: 12, fontSize: 12}}>{t('upload_compat_hint')}</div>
                <div className="grid-2" style={{gap: 12, marginBottom: 14}}>
                  <div>
                    <label className="field-label">{t('upload_min_ver')}</label>
                    <select className="select" value={minVer} onChange={e => setMinVer(e.target.value)}>
                      {VERSIONS.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">{t('upload_max_ver')}</label>
                    <select className="select" value={maxVer} onChange={e => setMaxVer(e.target.value)}>
                      <option>{t('upload_no_limit')}</option>
                      {VERSIONS.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="field-label">{t('upload_tested')}</label>
                  <div className="row gap-8" style={{flexWrap: 'wrap'}}>
                    {VERSIONS.map(v => {
                      const on = tested.includes(v);
                      return (
                        <button key={v} className="version-pill" onClick={() => toggleVer(v)} style={{
                          borderColor: on ? 'var(--ok)' : 'var(--line)',
                          color: on ? 'var(--ok-fg)' : 'var(--text-3)',
                          fontWeight: on ? 600 : 400, cursor: 'pointer',
                        }}>
                          {on && <Icons.Check size={9}/>} {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="field-label">{t('upload_deps')}</label>
                <input className="input mono" placeholder="e.g. kss>=4.0, kiwipiepy" value={deps} onChange={e => setDeps(e.target.value)}/>
                <div className="field-hint">{t('upload_deps_hint')}</div>
              </div>

              {user && (
                <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-muted)', border: '1px solid var(--line)', borderRadius: 8}}>
                  <div className="avatar sm" style={{background: 'var(--accent-bg)', color: 'var(--accent-fg)'}}>{user.name?.[0] || '?'}</div>
                  <div>
                    <div style={{fontSize: 12.5, fontWeight: 600}}>{user.name} <span className="mono muted-sm" style={{fontWeight: 400}}>{user.employee_id}</span></div>
                    <div className="muted-sm" style={{fontSize: 11.5}}>{user.team || user.org || 'SSO'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{t('upload_cancel')}</button>
          <div className="row gap-8">
            {step > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => s - 1)}>{t('upload_prev')}</button>
            )}
            {step < 2 ? (
              <button className="btn btn-accent btn-sm" disabled={step === 0 && !hasFile} style={{opacity: (step === 0 && !hasFile) ? 0.5 : 1}} onClick={() => setStep(s => s + 1)}>
                {t('upload_next')} <Icons.ArrowRight size={11}/>
              </button>
            ) : (
              <button className="btn btn-accent btn-sm" onClick={handleSubmitToAPI} disabled={submitting || !title.trim()} style={{opacity: (submitting || !title.trim()) ? 0.5 : 1}}>
                <Icons.Check size={11}/> {submitting ? t('upload_submitting') : t('upload_submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.UploadModal = UploadModal;
