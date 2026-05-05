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

  // Fetch full component data (including readme) if not already present
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-') && c.readme === undefined) {
      api.components.get(c.id).then(full => setC(apiToCard(full))).catch(() => {});
    }
  }, [c.id]);

  // Fetch real file content if component has UUID
  React.useEffect(() => {
    if (c.id && String(c.id).includes('-')) {
      api.components.file(c.id)
        .then(d => { setFileContent(d.content); setFileName(d.filename); })
        .catch(() => { setFileContent(SAMPLE_PY_CODE); setFileName('smart_chunker.py'); });
    } else {
      setFileContent(SAMPLE_PY_CODE);
      setFileName('smart_chunker.py');
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
            {c.rank === 1 && <><span className="breadcrumb-sep">·</span><span style={{color: '#92400e', fontWeight: 600}}><Icons.Trophy size={11}/> 2026 1위</span></>}
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
          <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(fileContent || ''); }}><Icons.Copy size={13}/> 코드 복사</button>
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
        <Stat label="Star" value={starCount} icon={<Icons.Star size={12}/>}/>
        <Stat label="다운로드" value={c.downloads_count ?? c.downloads ?? 0} icon={<Icons.Download size={12}/>}/>
        <Stat label="복사" value={c.copies ?? 0} icon={<Icons.Copy size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', '개요 / 사용법'],
          ['code', '코드 미리보기'],
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} {count != null && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      <div>
        {tab === 'readme' && <ReadmeContent c={c}/>}
        {tab === 'code' && <CodePreview code={fileContent || SAMPLE_PY_CODE} filename={fileName || 'code.py'}/>}
      </div>
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

function CodePreview({ code, filename }) {
  const [copied, setCopied] = React.useState(false);
  const src = code || '';
  const handleCopy = () => {
    navigator.clipboard?.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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


window.ComponentDetail = ComponentDetail;
