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
  const [c, setC] = React.useState(component);
  const [tab, setTab] = React.useState('readme');
  const [fileContent, setFileContent] = React.useState(null);
  const [fileName, setFileName] = React.useState('');
  const [starCount, setStarCount] = React.useState(c.stars_count ?? c.stars ?? 0);
  const [starred, setStarred] = React.useState(false);
  const [showUpdate, setShowUpdate] = React.useState(false);
  const [copyToast, setCopyToast] = React.useState(false);
  const [versionHistory, setVersionHistory] = React.useState([]);

  // Fetch full component data (including readme) and check star status
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      if (c.readme === undefined) api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
      api.get(`/components/${c.id}/starred`).then(r => setStarred(r.starred)).catch(() => {});
    }
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
            navigator.clipboard?.writeText(fileContent || '');
            if (c.id && String(c.id).includes('-') && !starred) {
              api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
            }
            setCopyToast(true); setTimeout(() => setCopyToast(false), 3000);
          }}><Icons.Copy size={13}/> 코드 복사</button>
          <button className="btn btn-primary" onClick={() => {
            if (c.id && String(c.id).includes('-')) {
              window.open(`/api/v1/components/${c.id}/download-file`, '_blank');
            } else {
              const blob = new Blob([fileContent || ''], {type: 'text/plain'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = fileName || 'file'; a.click();
              URL.revokeObjectURL(url);
            }
          }}><Icons.Download size={13}/> 다운로드</button>
          <button className="btn btn-secondary" onClick={() => setShowUpdate(true)}><Icons.Upload size={13}/> 업데이트</button>
        </div>
      </div>

      {copyToast && (
        <div className="copy-toast">
          코드를 복사했어요! 개발자에게 star도 같이 전달할게요 ⭐️
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
          ['readme', '개요 / 사용법'],
          ['code', '코드 미리보기'],
          ['versions', '버전 이력'],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => { setTab(id); if (id === 'versions' && versionHistory.length === 0 && c.id) api.components.versions(c.id).then(setVersionHistory).catch(() => {}); }}>
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'readme' && <ReadmeContent c={c}/>}
        {tab === 'code' && <CodePreview code={fileContent} filename={fileName || 'code.py'} onCopy={() => {
          if (c.id && String(c.id).includes('-') && !starred) {
            api.components.star(c.id).then(r => { if (r.starred) { setStarCount(s => s + 1); setStarred(true); } }).catch(() => {});
          }
          setCopyToast(true); setTimeout(() => setCopyToast(false), 3000);
        }}/>}
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

function CodePreview({ code, filename, onCopy }) {
  const [copied, setCopied] = React.useState(false);
  const src = code || '';
  const handleCopy = () => {
    navigator.clipboard?.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (onCopy) onCopy();
  };
  const lines = src.split('\n');
  const sizeKB = (new Blob([src]).size / 1024).toFixed(1);
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
  const [submitting, setSubmitting] = React.useState(false);

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 540}}>
        <div className="modal-header">
          <div>
            <div className="h2">업데이트 · {c.title}</div>
            <div className="muted-sm" style={{marginTop: 4}}>
              <span className={`chip chip-${c.type}`}>{expectedExt}</span> {c.type === 'py' ? 'Component' : 'Flow'}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icons.X/></button>
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
          <button className="btn btn-ghost btn-sm" onClick={onClose}>취소</button>
          <button className="btn btn-accent btn-sm" onClick={handleSubmit} disabled={submitting || !!fileError} style={{opacity: (submitting || fileError) ? 0.5 : 1}}>
            <Icons.Check size={11}/> {submitting ? '업데이트 중...' : `${nextVer} 업데이트`}
          </button>
        </div>
      </div>
    </div>
  );
}

window.ComponentDetail = ComponentDetail;
