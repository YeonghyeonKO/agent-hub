// Component detail page (SmartChunker)

const SAMPLE_PY_CODE = `from langflow.custom import Component
from langflow.io import MessageTextInput, IntInput, Output
from kss import Kss


class SmartChunker(Component):
    display_name = "Smart Chunker"
    description = "의미 단위로 자동 분할하는 한국어 특화 청커"
    icon = "scissors"

    inputs = [
        MessageTextInput(name="text", display_name="원문"),
        IntInput(name="target_size", value=500),
    ]

    outputs = [
        Output(name="chunks", display_name="Chunks", method="split"),
    ]

    def split(self) -> list:
        kss = Kss("split_sentences")
        sentences = kss(self.text)
        # 의미 경계 + 목표 크기 기반 결합
        chunks, buf = [], ""
        for s in sentences:
            if len(buf) + len(s) > self.target_size and buf:
                chunks.append(buf.strip())
                buf = s
            else:
                buf += " " + s
        if buf:
            chunks.append(buf.strip())
        return chunks`;

function ComponentDetail({ component, onBack }) {
  const { t } = useI18n();
  // Read tab from hash query string (?tab=improvements&imp=...)
  const initialTab = (() => {
    const m = window.location.hash.match(/\?([^#]+)$/);
    if (!m) return 'readme';
    const qs = new URLSearchParams(m[1]);
    const tabParam = qs.get('tab');
    return ['readme', 'code', 'versions', 'improvements'].includes(tabParam) ? tabParam : 'readme';
  })();
  const initialImp = (() => {
    const m = window.location.hash.match(/\?([^#]+)$/);
    if (!m) return null;
    return new URLSearchParams(m[1]).get('imp');
  })();

  const [c, setC] = React.useState(component);
  const [tab, setTab] = React.useState(initialTab);
  const [fileContent, setFileContent] = React.useState(null);
  const [fileName, setFileName] = React.useState('');
  const [starCount, setStarCount] = React.useState(c.stars_count ?? c.stars ?? 0);
  const [starred, setStarred] = React.useState(false);
  const [showUpdate, setShowUpdate] = React.useState(false);
  const [showDeploy, setShowDeploy] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState('');
  const [currentUser, setCurrentUser] = React.useState(null);
  const [versionHistory, setVersionHistory] = React.useState([]);
  const [contributors, setContributors] = React.useState([]);
  const [versionCode, setVersionCode] = React.useState(null);  // { version, content, filename }

  const reloadComponent = React.useCallback(() => {
    if (c.id && String(c.id).includes('-')) {
      api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
      api.components.versions(c.id).then(setVersionHistory).catch(() => {});
      api.components.file(c.id)
        .then(d => { setFileContent(d.content); setFileName(d.filename); })
        .catch(() => {});
    }
  }, [c.id]);

  // Fetch full component data (including readme) and check star status
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      if (c.readme === undefined) api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
      api.get(`/components/${c.id}/starred`).then(r => setStarred(r.starred)).catch(() => {});
      api.components.contributors(c.id).then(setContributors).catch(() => {});
    }
    api.users.me().then(u => setCurrentUser(u)).catch(() => {});
  }, [c.id]);

  // Fetch real file content if component has UUID
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      api.components.file(c.id)
        .then(d => { setFileContent(d.content); setFileName(d.filename); })
        .catch(() => { setFileContent('// 파일을 불러올 수 없습니다'); setFileName(c.title || 'file'); });
    } else {
      setFileContent('// 파일을 불러올 수 없습니다');
      setFileName(c.title || 'file');
    }
  }, [c.id]);

  return (
    <div className="page-narrow fade-in">
      <div className="breadcrumb">
        <a onClick={onBack} style={{cursor: 'pointer'}}>홈</a>
        <span className="breadcrumb-sep">/</span>
        <span>Component</span>
        <span className="breadcrumb-sep">/</span>
        <span>RAG</span>
        <span className="breadcrumb-sep">/</span>
        <span className="current">{c.title}</span>
      </div>

      <div className="detail-header">
        <div className={`detail-icon ${c.type}`}>
          <Icons.Scissors/>
        </div>
        <div className="detail-title-block">
          <div className="detail-eyebrow">
            <span className={`chip chip-${c.type}`}>{c.type === 'py' ? '.py' : '.json'}</span>
            <span>{c.typeLabel}</span>
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
            <span>{fmtDate(c.created_at)} 등록</span>
            {contributors.length > 0 && (
              <>
                <span className="breadcrumb-sep">·</span>
                <span style={{color: 'var(--text-3)'}}>{t('contributors_title')}</span>
                <div className="contributors-list">
                  {contributors.slice(0, 6).map(co => (
                    <span key={co.user.employee_id} className="contributor-chip" title={`${co.user.name} · ${co.contributions}${t('contributions_label')}`}>
                      <Icons.Users size={9}/> {co.user.name}{co.contributions > 1 ? ` ×${co.contributions}` : ''}
                    </span>
                  ))}
                  {contributors.length > 6 && <span className="muted-sm">+{contributors.length - 6}</span>}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-accent" onClick={() => setShowDeploy(true)}><Icons.Zap size={13}/> 배포</button>
          <button className="btn btn-secondary" style={{color: starred ? '#f59e0b' : undefined, borderColor: starred ? '#f59e0b' : undefined}} onClick={() => { const id = c.id; if (id && String(id).includes('-')) api.components.star(id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } else { setStarCount(s => Math.max(0, s - 1)); setStarred(false); } }).catch(() => {}); }}><Icons.Star size={13}/> {starCount}</button>
          <button className="btn btn-secondary" onClick={() => {
            navigator.clipboard?.writeText(fileContent || '');
            if (c.id && String(c.id).includes('-') && !starred) {
              api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
            }
            setCopyToast('코드를 복사했어요! 개발자에게 star도 같이 전달할게요 ⭐️'); setTimeout(() => setCopyToast(''), 3000);
          }}><Icons.Copy size={13}/> 코드 복사</button>
          <button className="btn btn-primary" onClick={() => {
            if (c.id && String(c.id).includes('-')) {
              api.components.file(c.id).then(d => {
                const ext = c.type === 'json' ? '.json' : '.py';
                const blob = new Blob([d.content], {type: 'text/plain'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = (c.title || 'file').replace(/\s+/g, '_') + ext; a.click();
                URL.revokeObjectURL(url);
                api.components.download(c.id).catch(() => {});
              }).catch(() => alert('Download failed'));
            } else {
              const blob = new Blob([fileContent || ''], {type: 'text/plain'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = fileName || 'file'; a.click();
              URL.revokeObjectURL(url);
            }
          }}><Icons.Download size={13}/> 다운로드</button>
          <button className="btn btn-secondary" onClick={() => {
            const type = c.type === 'json' ? 'flow' : 'component';
            const url = window.location.origin + window.location.pathname + '#/' + type + '/' + c.id;
            navigator.clipboard?.writeText(url);
            setCopyToast('링크를 복사했어요!'); setTimeout(() => setCopyToast(''), 2000);
          }}><Icons.Link size={13}/> 링크 복사</button>
          {currentUser && (currentUser.role === 'admin' || currentUser.employee_id === (c.author?.id || c.author_id)) && (
            <button className="btn btn-secondary" onClick={() => setShowUpdate(true)}><Icons.Upload size={13}/> 업데이트</button>
          )}
        </div>
      </div>

      {copyToast && (
        <div className="copy-toast">
          {copyToast}
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
        <Stat label="복사" value={c.copies ?? 0} icon={<Icons.Copy size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', t('upload_field_readme') === 'Overview / Usage' ? 'Overview / Usage' : '개요 / 사용법'],
          ['code', '코드 미리보기'],
          ['versions', '버전 이력'],
          ...(c.type === 'py' ? [['improvements', t('tab_improvements')]] : []),
        ].map(([id, label]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => { setTab(id); if (id === 'versions' && versionHistory.length === 0 && c.id) api.components.versions(c.id).then(setVersionHistory).catch(() => {}); }}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'readme' && <ReadmeContent c={c}/>}
        {tab === 'code' && <CodePreview code={fileContent} filename={fileName || 'code.py'} componentId={c.id} onCopy={() => {
          if (c.id && String(c.id).includes('-') && !starred) {
            api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
          }
          setCopyToast('코드를 복사했어요! 개발자에게 star도 같이 전달할게요 ⭐️'); setTimeout(() => setCopyToast(''), 3000);
        }}/>}
        {tab === 'versions' && (
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '14px 18px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: 13}}>
              현재: {c.version}
            </div>
            {versionHistory.length === 0 && <div className="muted-sm" style={{padding: 24, textAlign: 'center'}}>이전 버전이 없습니다</div>}
            {versionHistory.map((v, i) => (
              <div key={v.id} style={{padding: '12px 18px', borderBottom: i < versionHistory.length - 1 ? '1px solid var(--line)' : 'none'}}>
                <div className="row gap-8" style={{marginBottom: 4, flexWrap: 'wrap'}}>
                  <span className="mono" style={{fontWeight: 700}}>{v.version}</span>
                  <span className="muted-sm">· {fmtDate(v.created_at)}</span>
                  {v.contributor && (
                    <span className="contributor-chip" title={v.contributor.name}>
                      <Icons.Users size={9}/> {t('versions_contributor')} {v.contributor.name}
                    </span>
                  )}
                  {v.has_content && (
                    <button className="btn btn-ghost btn-sm" style={{marginLeft: 'auto', fontSize: 11}} onClick={() => {
                      api.components.versionFile(c.id, v.id)
                        .then(d => setVersionCode({ version: v.version, content: d.content, filename: d.filename }))
                        .catch(() => alert('해당 버전 코드를 불러올 수 없습니다'));
                    }}>
                      <Icons.Code size={10}/> {t('versions_view_code')}
                    </button>
                  )}
                </div>
                <div style={{fontSize: 13, color: 'var(--text-2)'}}>{v.changelog}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'improvements' && (
          <ImprovementsTab
            component={c}
            currentUser={currentUser}
            currentCode={fileContent || ''}
            initialImpId={initialImp}
            onChanged={() => { reloadComponent(); api.components.contributors(c.id).then(setContributors).catch(() => {}); }}
          />
        )}
      </div>

      {versionCode && <VersionCodeModal info={versionCode} onClose={() => setVersionCode(null)}/>}

      {showUpdate && <UpdateModal component={c} onClose={() => setShowUpdate(false)} onUpdated={(updated) => { setC(apiToCard(updated)); setShowUpdate(false); }}/>}
      {showDeploy && <DeployModal component={c} onClose={() => setShowDeploy(false)}/>}
    </div>
  );
}

function Stat({ label, value, icon, delta }) {
  return (
    <div className="stat">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">↑ {delta}</div>}
    </div>
  );
}

function ReadmeContent({ c }) {
  if (!c.readme) {
    return (
      <div className="card card-pad" style={{padding: 28, textAlign: 'center', color: 'var(--text-3)'}}>
        <div style={{fontSize: 36, marginBottom: 12, opacity: 0.4}}>📄</div>
        <div style={{fontWeight: 500, marginBottom: 6}}>개요 / 사용법이 없습니다</div>
        <div style={{fontSize: 13}}>업로드 시 작성한 내용이 여기에 표시됩니다.</div>
      </div>
    );
  }
  const html = (typeof marked !== 'undefined' && marked.parse) ? marked.parse(c.readme) : c.readme.replace(/\n/g, '<br/>');
  return (
    <div className="card card-pad" style={{padding: 28}}>
      <div className="readme-body" dangerouslySetInnerHTML={{__html: html}}/>
    </div>
  );
}

function CodePreview({ code, filename, onCopy, componentId }) {
  const [copied, setCopied] = React.useState(false);
  const src = code || '';
  const sizeBytes = new Blob([src]).size;
  const sizeKB = (sizeBytes / 1024).toFixed(1);
  const tooLarge = sizeBytes > 1024 * 1024; // 1MB

  const handleCopy = () => {
    navigator.clipboard?.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (onCopy) onCopy();
  };

  if (tooLarge) {
    const dlUrl = (window.location.port === '3000' ? 'http://localhost:8000' : '') + '/api/v1/components/' + (componentId || '') + '/download-file';
    return (
      <div className="codeblock">
        <div className="codeblock-header">
          <div className="row gap-8">
            <Icons.Code size={13}/>
            <span style={{fontWeight: 600}}>{filename || 'code'}</span>
            <span style={{color: '#6b7d6b'}}>· {sizeKB} KB</span>
          </div>
        </div>
        <div style={{padding: 40, textAlign: 'center', color: 'var(--text-3)'}}>
          <Icons.Download size={24} style={{marginBottom: 10, opacity: 0.4}}/>
          <div style={{fontWeight: 500, marginBottom: 6}}>파일 크기가 1MB를 초과합니다</div>
          <div style={{fontSize: 13, marginBottom: 14}}>미리보기 대신 직접 다운로드해 주세요.</div>
          <a className="btn btn-accent btn-sm" href={dlUrl} target="_blank"><Icons.Download size={11}/> 다운로드 ({sizeKB} KB)</a>
        </div>
      </div>
    );
  }

  const lines = src.split('\n');
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <div className="row gap-8">
          <Icons.Code size={13}/>
          <span style={{fontWeight: 600}}>{filename || 'code'}</span>
          <span style={{color: '#6b7d6b'}}>· {sizeKB} KB · {lines.length} lines</span>
        </div>
        <button className="btn btn-sm btn-ghost" style={{color: '#b6b3ab'}} onClick={handleCopy}>
          {copied ? <><Icons.Check size={11}/> 복사됨</> : <><Icons.Copy size={11}/> 복사</>}
        </button>
      </div>
      <div className="codeblock-body">
        <div className="codeblock-gutter">
          {lines.map((_, i) => <div key={i}>{i+1}</div>)}
        </div>
        <div className="codeblock-content">
          {pythonHighlight(src)}
        </div>
      </div>
    </div>
  );
}


function UpdateModal({ component, onClose, onUpdated }) {
  const c = component;
  const expectedExt = c.type === 'json' ? '.json' : '.py';
  const [bump, setBump] = React.useState('patch');
  const [changelog, setChangelog] = React.useState('');
  const [readme, setReadme] = React.useState(c.readme || '');
  const [readmeMode, setReadmeMode] = React.useState('write');
  const [desc, setDesc] = React.useState(c.desc || c.description || '');
  const [newFile, setNewFile] = React.useState(null);
  const [fileError, setFileError] = React.useState('');
  const [tags, setTags] = React.useState([...new Set(c.tags || [])]);
  const [tagInput, setTagInput] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const safeClose = () => {
    const hasChanges = changelog.trim() || newFile || desc !== (c.desc || c.description || '') || readme !== (c.readme || '');
    if (hasChanges && !confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?')) return;
    onClose();
  };

  const curVer = (c.version || 'v1.0.0').replace('v', '');
  const parts = curVer.split('.').map(Number);
  const nextVer = bump === 'major' ? `v${parts[0]+1}.0.0` : bump === 'minor' ? `v${parts[0]}.${parts[1]+1}.0` : `v${parts[0]}.${parts[1]}.${parts[2]+1}`;

  const handleFile = (file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (ext !== expectedExt) { setFileError(`${expectedExt} 파일만 업로드 가능합니다 (현재: ${ext})`); setNewFile(null); return; }
    if (file.size > 5 * 1024 * 1024) { setFileError('파일 크기 5MB 초과'); setNewFile(null); return; }
    setFileError('');
    setNewFile(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('version_bump', bump);
      fd.append('changelog', changelog.trim() || 'Updated');
      fd.append('description', desc.trim());
      fd.append('readme', readme.trim());
      fd.append('tags', tags.join(','));
      if (newFile) fd.append('file', newFile);
      const result = await api.components.update(c.id, fd);
      onUpdated(result);
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={safeClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 540}}>
        <div className="modal-header">
          <div>
            <div className="h2">업데이트 · {c.title}</div>
            <div className="muted-sm" style={{marginTop: 4}}>
              <span className={`chip chip-${c.type}`}>{expectedExt}</span> {c.type === 'py' ? 'Component' : 'Flow'}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={safeClose}><Icons.X/></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label">버전 업 유형 <span className="req">*</span></label>
            <div className="segmented">
              {[['patch', 'Patch'], ['minor', 'Minor'], ['major', 'Major']].map(([v, l]) => (
                <button key={v} className={`segmented-item ${bump===v?'active':''}`} onClick={() => setBump(v)}>{l}</button>
              ))}
            </div>
            <div className="field-hint" style={{marginTop: 8}}>{c.version} → <strong>{nextVer}</strong></div>
          </div>
          <div className="field">
            <label className="field-label">변경 사항</label>
            <input className="input" placeholder="이번 업데이트에서 변경된 내용" value={changelog} onChange={e => setChangelog(e.target.value)}/>
          </div>
          <div className="field">
            <label className="field-label">파일 교체 (선택) — {expectedExt} 만 가능</label>
            <div className={`dropzone ${fileError ? 'drag' : ''}`} style={{padding: 16, cursor: 'pointer', textAlign: 'center'}} onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = expectedExt; inp.onchange = e => handleFile(e.target.files[0]); inp.click(); }}>
              {newFile ? <span className="mono" style={{fontSize: 13, color: 'var(--ok-fg)'}}><Icons.Check size={11}/> {newFile.name}</span> : <span className="muted-sm">클릭하여 새 {expectedExt} 파일 선택</span>}
            </div>
            {fileError && <div style={{color: 'var(--err-fg)', fontSize: 12, marginTop: 6}}>{fileError}</div>}
          </div>
          <div className="field">
            <label className="field-label">한줄설명</label>
            <input className="input" value={desc} onChange={e => setDesc(e.target.value)}/>
          </div>
          <div className="field">
            <label className="field-label">태그</label>
            <div className="row gap-8" style={{flexWrap: 'wrap'}}>
              {tags.map(t => (
                <span key={t} className="tag" style={{cursor: 'pointer'}} onClick={() => setTags(tags.filter(x => x !== t))}>#{t} <Icons.X size={10}/></span>
              ))}
              {tags.length < 5 && (
                <div className="row gap-8">
                  <input className="input" style={{width: 120, height: 28, fontSize: 12}} placeholder="태그 입력" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(''); } } }}/>
                  <button className="tag" style={{cursor: 'pointer', borderStyle: 'dashed'}} onClick={() => { if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) { setTags([...tags, tagInput.trim()]); setTagInput(''); } }}><Icons.Plus size={10}/> 추가</button>
                </div>
              )}
              {tags.length >= 5 && <span className="muted-sm" style={{fontSize: 11}}>max 5</span>}
            </div>
          </div>
          <div className="field">
            <label className="field-label">개요 / 사용법</label>
            <div style={{border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden'}}>
              <div style={{display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', background: 'var(--bg-muted)', padding: '4px 8px'}}>
                <button type="button" className="btn btn-ghost btn-sm" style={{fontSize: 12, fontWeight: readmeMode === 'write' ? 600 : 400, borderBottom: readmeMode === 'write' ? '2px solid var(--accent)' : '2px solid transparent'}} onClick={() => setReadmeMode('write')}>작성</button>
                <button type="button" className="btn btn-ghost btn-sm" style={{fontSize: 12, fontWeight: readmeMode === 'preview' ? 600 : 400, borderBottom: readmeMode === 'preview' ? '2px solid var(--accent)' : '2px solid transparent'}} onClick={() => setReadmeMode('preview')}>미리보기</button>
              </div>
              {readmeMode === 'write' ? (
                <textarea className="input" rows={6} style={{resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, border: 'none', borderRadius: 0, width: '100%', boxSizing: 'border-box'}} value={readme} onChange={e => setReadme(e.target.value)}/>
              ) : (
                <div style={{padding: 14, minHeight: 100, fontSize: 13.5, lineHeight: 1.7}}>
                  {readme.trim() ? <div className="readme-body" dangerouslySetInnerHTML={{__html: (typeof marked !== 'undefined' && marked.parse) ? marked.parse(readme) : readme.replace(/\n/g, '<br/>')}}/> : <div className="muted" style={{textAlign: 'center'}}>미리보기할 내용이 없습니다</div>}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={safeClose}>취소</button>
          <button className="btn btn-accent btn-sm" onClick={handleSubmit} disabled={submitting || !!fileError} style={{opacity: (submitting || fileError) ? 0.5 : 1}}>
            <Icons.Check size={11}/> {submitting ? '업데이트 중...' : `${nextVer} 업데이트`}
          </button>
        </div>
      </div>
    </div>
  );
}

function VersionCodeModal({ info, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 920}}>
        <div className="modal-header">
          <div>
            <div className="h2">{info.filename}</div>
            <div className="muted-sm" style={{marginTop: 4}}>{info.version}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icons.X/></button>
        </div>
        <div className="modal-body" style={{maxHeight: '65vh', overflow: 'auto'}}>
          <CodePreview code={info.content} filename={info.filename}/>
        </div>
      </div>
    </div>
  );
}

function ImprovementsTab({ component, currentUser, currentCode, initialImpId, onChanged }) {
  const { t, lang } = useI18n();
  const [improvements, setImprovements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showSubmit, setShowSubmit] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState(initialImpId || null);

  // apiToCard remaps author.employee_id -> author.id, so check both
  const authorId = component.author?.id || component.author?.employee_id || component.author_id;
  const isAuthor = currentUser && authorId && currentUser.employee_id === authorId;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canPropose = currentUser && !isAuthor;

  const reload = React.useCallback(() => {
    if (!component.id) return;
    setLoading(true);
    api.components.improvements(component.id)
      .then(items => { setImprovements(items); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [component.id]);

  React.useEffect(reload, [reload]);

  return (
    <div>
      <div className="row" style={{justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8}}>
        <div className="muted-sm">
          {improvements.length === 0
            ? null
            : (() => {
                const total = improvements.length;
                const pending = improvements.filter(i => i.status === 'pending').length;
                const approved = improvements.filter(i => i.status === 'approved').length;
                return lang === 'en'
                  ? `${total} ${t('improvement_summary_items')} · ${pending} ${t('improvement_summary_pending')} · ${approved} ${t('improvement_summary_approved')}`
                  : `${total}${t('improvement_summary_items')} · ${t('improvement_summary_pending')} ${pending} · ${t('improvement_summary_approved')} ${approved}`;
              })()}
        </div>
        {canPropose && (
          <button className="btn btn-accent btn-sm" onClick={() => setShowSubmit(true)}>
            <Icons.Plus size={11}/> {t('improvement_new')}
          </button>
        )}
        {isAuthor && (
          <div className="muted-sm" style={{fontSize: 12}}>{t('improvement_self_blocked')}</div>
        )}
      </div>

      {loading && <div className="muted-sm" style={{padding: 24, textAlign: 'center'}}>...</div>}
      {!loading && improvements.length === 0 && (
        <div className="card card-pad" style={{padding: 28, textAlign: 'center', color: 'var(--text-3)'}}>
          <div style={{fontSize: 36, marginBottom: 12, opacity: 0.4}}>🛠</div>
          <div style={{fontWeight: 500, marginBottom: 6}}>{t('improvement_empty')}</div>
          <div style={{fontSize: 13}}>{t('improvement_empty_desc')}</div>
        </div>
      )}

      {!loading && improvements.map(imp => (
        <ImprovementCard
          key={imp.id}
          improvement={imp}
          componentId={component.id}
          currentCode={currentCode}
          currentUser={currentUser}
          isAuthor={isAuthor}
          isAdmin={isAdmin}
          expanded={expandedId === imp.id}
          onToggle={() => setExpandedId(expandedId === imp.id ? null : imp.id)}
          onAction={() => { reload(); if (onChanged) onChanged(); }}
        />
      ))}

      {showSubmit && (
        <ImprovementSubmitModal
          component={component}
          currentCode={currentCode}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => { setShowSubmit(false); reload(); }}
        />
      )}
    </div>
  );
}

function ImprovementCard({ improvement, componentId, currentCode, currentUser, isAuthor, isAdmin, expanded, onToggle, onAction }) {
  const { t } = useI18n();
  const [detail, setDetail] = React.useState(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [reviewComment, setReviewComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const statusClass = improvement.status === 'approved' ? 'chip-ok'
    : improvement.status === 'rejected' ? 'chip-warn'
    : 'chip-neutral';
  const statusLabel = improvement.status === 'approved' ? t('improvement_approved')
    : improvement.status === 'rejected' ? t('improvement_rejected')
    : t('improvement_pending');

  React.useEffect(() => {
    if (expanded && !detail) {
      setLoadingDetail(true);
      api.components.improvement(componentId, improvement.id)
        .then(d => { setDetail(d); setLoadingDetail(false); })
        .catch(() => setLoadingDetail(false));
    }
  }, [expanded, componentId, improvement.id, detail]);

  const canReview = (isAuthor || isAdmin) && improvement.status === 'pending';
  const canWithdraw = currentUser && currentUser.employee_id === improvement.contributor.employee_id && improvement.status === 'pending';

  const handleReview = async (decision) => {
    const confirmMsg = decision === 'approve' ? t('improvement_review_confirm_approve') : t('improvement_review_confirm_reject');
    if (!confirm(confirmMsg)) return;
    setSubmitting(true);
    try {
      await api.components.reviewImprovement(componentId, improvement.id, {
        decision,
        review_comment: reviewComment,
      });
      if (onAction) onAction();
    } catch (e) {
      alert('Review failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm(t('improvement_withdraw_confirm'))) return;
    try {
      await api.components.withdrawImprovement(componentId, improvement.id);
      if (onAction) onAction();
    } catch (e) {
      alert('Withdraw failed: ' + e.message);
    }
  };

  return (
    <div className="card" style={{padding: 0, marginBottom: 10, overflow: 'hidden'}}>
      <div style={{padding: '14px 18px', cursor: 'pointer'}} onClick={onToggle}>
        <div className="row gap-8" style={{flexWrap: 'wrap', marginBottom: 6}}>
          <span className={`chip ${statusClass}`}>{statusLabel}</span>
          <span style={{fontWeight: 600, fontSize: 14}}>{improvement.title}</span>
          {improvement.applied_version && (
            <span className="mono muted-sm">→ {improvement.applied_version}</span>
          )}
          <span style={{marginLeft: 'auto', color: 'var(--text-3)'}}>
            <Icons.ArrowRight size={12} style={{transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s'}}/>
          </span>
        </div>
        <div className="muted-sm">
          <Icons.Users size={9}/> {improvement.contributor.name} · {fmtDate(improvement.created_at)} · {t('improvement_base_version')} {improvement.base_version || '—'}
        </div>
      </div>

      {expanded && (
        <div style={{padding: '0 18px 18px', borderTop: '1px solid var(--line)'}}>
          <div style={{padding: '12px 0', fontSize: 13.5, whiteSpace: 'pre-wrap', color: 'var(--text-2)'}}>
            {improvement.description}
          </div>

          {improvement.review_comment && (
            <div style={{padding: 12, background: 'var(--bg-muted)', borderRadius: 6, fontSize: 13, marginBottom: 12}}>
              <strong>{t('improvement_review_comment_label')}</strong> {improvement.review_comment}
            </div>
          )}

          {loadingDetail && <div className="muted-sm" style={{padding: 12}}>...</div>}
          {detail && (
            <>
              <div style={{fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8}}>{t('improvement_diff')}</div>
              <DiffView oldText={detail.base_content || currentCode || ''} newText={detail.file_content}/>
            </>
          )}

          {canReview && (
            <div style={{marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)'}}>
              <textarea
                className="input"
                rows={2}
                style={{resize: 'vertical', fontSize: 13, marginBottom: 10}}
                placeholder={t('improvement_review_comment_ph')}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
              <div className="row gap-8">
                <button className="btn btn-accent btn-sm" disabled={submitting} onClick={() => handleReview('approve')}>
                  <Icons.Check size={11}/> {t('improvement_approve')}
                </button>
                <button className="btn btn-secondary btn-sm" disabled={submitting} onClick={() => handleReview('reject')}>
                  <Icons.X size={11}/> {t('improvement_reject')}
                </button>
              </div>
            </div>
          )}

          {canWithdraw && (
            <div style={{marginTop: 12}}>
              <button className="btn btn-ghost btn-sm" onClick={handleWithdraw} style={{color: 'var(--err-fg)'}}>
                {t('improvement_withdraw')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImprovementSubmitModal({ component, currentCode, onClose, onSubmitted }) {
  const { t } = useI18n();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [mode, setMode] = React.useState('file');  // 'file' | 'paste'
  const [file, setFile] = React.useState(null);
  const [pastedCode, setPastedCode] = React.useState('');
  const [pastedFilename, setPastedFilename] = React.useState('');
  const [fileError, setFileError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const defaultFilename = React.useMemo(() => {
    const slug = (component.title || 'component').replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase();
    return `${slug}_improved.py`;
  }, [component.title]);

  const hasContent = mode === 'file' ? !!file : pastedCode.trim().length > 0;
  const safeClose = () => {
    if ((title.trim() || description.trim() || hasContent) && !confirm(t('improvement_unsaved_confirm'))) return;
    onClose();
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (ext !== '.py') { setFileError(t('improvement_py_only_error')); setFile(null); return; }
    if (f.size > 5 * 1024 * 1024) { setFileError(t('improvement_file_too_large')); setFile(null); return; }
    setFileError('');
    setFile(f);
  };

  const handlePastedChange = (val) => {
    setPastedCode(val);
    const bytes = new Blob([val]).size;
    if (bytes > 5 * 1024 * 1024) setFileError(t('improvement_code_too_large'));
    else setFileError('');
  };

  const canSubmit = title.trim() && description.trim().length >= 10 && hasContent && !fileError;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      if (mode === 'file') {
        fd.append('file', file);
      } else {
        const name = (pastedFilename.trim() || defaultFilename).replace(/\.py$/i, '') + '.py';
        const blob = new Blob([pastedCode], { type: 'text/x-python' });
        fd.append('file', blob, name);
      }
      await api.components.submitImprovement(component.id, fd);
      if (onSubmitted) onSubmitted();
    } catch (e) {
      alert(t('improvement_submit_failed') + ': ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={safeClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 640}}>
        <div className="modal-header">
          <div>
            <div className="h2">{t('improvement_modal_title')}</div>
            <div className="muted-sm" style={{marginTop: 4}}>{component.title} · {component.version}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={safeClose}><Icons.X/></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label">{t('improvement_title')} <span className="req">*</span></label>
            <input className="input" placeholder={t('improvement_title_ph')} value={title} onChange={e => setTitle(e.target.value)} maxLength={300}/>
          </div>
          <div className="field">
            <label className="field-label">{t('improvement_description')} <span className="req">*</span></label>
            <textarea className="input" rows={5} style={{resize: 'vertical', fontSize: 13.5}} placeholder={t('improvement_description_ph')} value={description} onChange={e => setDescription(e.target.value)}/>
            <div className="field-hint">{description.trim().length} / 10+ {t('improvement_description_hint_suffix')}</div>
          </div>
          <div className="field">
            <label className="field-label">{t('improvement_file')} <span className="req">*</span></label>
            <div className="segmented" style={{marginBottom: 10}}>
              <button type="button" className={`segmented-item ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>
                <Icons.Upload size={11}/> {t('improvement_input_mode_file')}
              </button>
              <button type="button" className={`segmented-item ${mode === 'paste' ? 'active' : ''}`} onClick={() => setMode('paste')}>
                <Icons.Code size={11}/> {t('improvement_input_mode_paste')}
              </button>
            </div>

            {mode === 'file' ? (
              <div className="dropzone" style={{padding: 16, cursor: 'pointer', textAlign: 'center'}} onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.py'; inp.onchange = e => handleFile(e.target.files[0]); inp.click(); }}>
                {file ? <span className="mono" style={{fontSize: 13, color: 'var(--ok-fg)'}}><Icons.Check size={11}/> {file.name} ({(file.size/1024).toFixed(1)} KB)</span> : <span className="muted-sm">{t('improvement_choose_py')}</span>}
              </div>
            ) : (
              <>
                <div className="row gap-8" style={{marginBottom: 8, flexWrap: 'wrap'}}>
                  <input
                    className="input"
                    style={{flex: '1 1 280px', fontSize: 13}}
                    placeholder={t('improvement_filename_ph')}
                    value={pastedFilename}
                    onChange={e => setPastedFilename(e.target.value)}
                  />
                  {currentCode && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handlePastedChange(currentCode)}>
                      <Icons.Copy size={11}/> {t('improvement_load_original')}
                    </button>
                  )}
                </div>
                <textarea
                  className="input"
                  rows={14}
                  style={{
                    resize: 'vertical',
                    fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace',
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    whiteSpace: 'pre',
                  }}
                  placeholder={t('improvement_code_placeholder')}
                  spellCheck={false}
                  value={pastedCode}
                  onChange={e => handlePastedChange(e.target.value)}
                />
                <div className="field-hint">
                  {(new Blob([pastedCode]).size / 1024).toFixed(1)} KB · {pastedCode.split('\n').length} lines
                </div>
              </>
            )}

            {fileError && <div style={{color: 'var(--err-fg)', fontSize: 12, marginTop: 6}}>{fileError}</div>}
            <div className="field-hint">{t('improvement_file_hint')}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={safeClose}>{t('btn_cancel')}</button>
          <button className="btn btn-accent btn-sm" onClick={handleSubmit} disabled={!canSubmit || submitting} style={{opacity: (!canSubmit || submitting) ? 0.5 : 1}}>
            <Icons.Upload size={11}/> {submitting ? t('improvement_submitting') : t('improvement_submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

window.ComponentDetail = ComponentDetail;
