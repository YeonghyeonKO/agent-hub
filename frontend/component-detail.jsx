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
  const c = component;
  const [tab, setTab] = React.useState('readme');

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
            <div className="avatar sm" style={{background: 'var(--bg-muted)', color: 'var(--text-2)'}}>{c.author.initial}</div>
            <span style={{color: 'var(--text-2)', fontWeight: 500}}>{c.author.name}</span>
            <span className="mono">({c.author.id})</span>
            <span className="breadcrumb-sep">·</span>
            <span>{c.updatedAgo} 등록 · 어제 업데이트</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={() => { const id = c.id; if (id && String(id).includes('-')) api.components.star(id).catch(() => {}); }}><Icons.Star size={13}/> {c.stars_count ?? c.stars}</button>
          <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(SAMPLE_PY_CODE); }}><Icons.Copy size={13}/> 코드 복사</button>
          <button className="btn btn-primary" onClick={() => {
            const blob = new Blob([SAMPLE_PY_CODE], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'smart_chunker.py'; a.click();
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
        <Stat label="Star" value={c.stars} icon={<Icons.Star size={12}/>} delta="+12 이번 주"/>
        <Stat label="다운로드" value={c.downloads} icon={<Icons.Download size={12}/>} delta="+34 이번 주"/>
        <Stat label="복사" value={c.copies} icon={<Icons.Copy size={12}/>}/>
        <Stat label="댓글" value={c.comments} icon={<Icons.Comment size={12}/>}/>
      </div>

      <div className="tabs" style={{marginTop: 32}}>
        {[
          ['readme', 'README'],
          ['code', '코드 미리보기'],
          ['versions', `버전`, c.versions],
          ['comments', '댓글', c.comments],
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} {count != null && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      <div className="detail-grid">
        <div>
          {tab === 'readme' && <ReadmeContent c={c}/>}
          {tab === 'code' && <CodePreview/>}
          {tab === 'versions' && <VersionsList/>}
          {tab === 'comments' && <CommentsList/>}
        </div>
        <aside>
          <div className="aside-card">
            <div className="aside-section-title">파일 목록</div>
            <div className="file-row" style={{padding: '8px 0', borderBottom: '1px dashed var(--line)'}}>
              <div className="file-row-name"><Icons.Code size={13}/> smart_chunker.py</div>
              <div className="file-row-size">4.2 KB</div>
            </div>
            <div className="file-row" style={{padding: '8px 0', borderBottom: '1px dashed var(--line)'}}>
              <div className="file-row-name"><Icons.FileText size={13}/> README.md</div>
              <div className="file-row-size">1.8 KB</div>
            </div>
            <div className="file-row" style={{padding: '8px 0', border: 'none'}}>
              <div className="file-row-name"><Icons.Workflow size={13}/> example_flow.json</div>
              <div className="file-row-size">6.1 KB</div>
            </div>
          </div>

          <div className="aside-card">
            <div className="aside-section-title">활용 사례</div>
            <div style={{fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6}}>
              사내 위키 RAG, 회의록 검색, 제안서 자동 분류 Flow에서 검증됨.
            </div>
            <div className="aside-stat">
              <span className="aside-stat-key">호환 버전</span>
              <span className="aside-stat-val">Langflow 1.8+</span>
            </div>
          </div>

          <div className="aside-card">
            <div className="aside-section-title">{c.author.name}님의 다른 Component / Flow</div>
            <div className="col" style={{gap: 8}}>
              <SiblingRow title="KoreanReranker" stars={64} downloads={198}/>
              <SiblingRow title="PDF Layout Parser" stars={31} downloads={87}/>
            </div>
          </div>
        </aside>
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
  return (
    <div className="card card-pad" style={{padding: 28}}>
      <h2 className="h2" style={{marginBottom: 8}}>개요</h2>
      <p style={{color: 'var(--text-2)', marginTop: 0, marginBottom: 20, lineHeight: 1.7}}>
        한국어 문서를 의미 단위로 분할하는 Langflow Component입니다. 단순 글자 수 기반 분할 대비 검색 정확도가
        평균 18% 향상되었습니다. KSS 형태소 분석기로 문장 경계를 잡고, 임베딩 유사도로 의미적 응집도를 함께 고려합니다.
      </p>

      <h3 className="h3" style={{marginBottom: 8}}>주요 특징</h3>
      <ul style={{margin: '0 0 20px', paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.8}}>
        <li>한국어 문장 경계 정확도 <strong>99.2%</strong> (KSS 4.5 기반)</li>
        <li>청크 크기 자동 조정 (200 ~ 800자 범위)</li>
        <li>표·리스트 구조 보존 (마크다운 입력 시)</li>
        <li>OpenAI / 사내 LLM 임베딩 모두 지원</li>
      </ul>

      <h3 className="h3" style={{marginBottom: 10}}>입력 / 출력</h3>
      <div style={{
        background: 'var(--bg-muted)',
        borderRadius: 8,
        padding: 14,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12.5,
        lineHeight: 1.9,
        marginBottom: 20,
      }}>
        <div className="io-section-label">→ 입력 (Inputs)</div>
        <div><span style={{color: 'var(--accent-fg)'}}>text</span> <span style={{color: 'var(--text-3)'}}>(str)</span> — 분할할 원문</div>
        <div><span style={{color: 'var(--accent-fg)'}}>target_size</span> <span style={{color: 'var(--text-3)'}}>(int, 기본 500)</span> — 목표 청크 크기</div>
        <div className="io-section-label" style={{marginTop: 10}}>← 출력 (Outputs)</div>
        <div><span style={{color: 'var(--accent-fg)'}}>chunks</span> <span style={{color: 'var(--text-3)'}}>(List[Document])</span> — 분할된 청크 리스트</div>
      </div>

      <h3 className="h3" style={{marginBottom: 8}}>설치</h3>
      <ol style={{margin: 0, paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.8}}>
        <li><span className="mono" style={{fontSize: 12.5}}>smart_chunker.py</span> 다운로드</li>
        <li><span className="mono" style={{fontSize: 12.5}}>components/custom/</span> 디렉토리에 배치</li>
        <li><span className="mono" style={{fontSize: 12.5}}>pip install kss&gt;=4.0 kiwipiepy</span></li>
        <li>Langflow 재시작</li>
      </ol>
    </div>
  );
}

function CodePreview() {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(SAMPLE_PY_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const lines = SAMPLE_PY_CODE.split('\n');
  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <div className="row gap-8">
          <Icons.Code size={13}/>
          <span style={{fontWeight: 600}}>smart_chunker.py</span>
          <span style={{color: '#6b7d6b'}}>· 4.2 KB · {lines.length} lines</span>
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
          {pythonHighlight(SAMPLE_PY_CODE)}
        </div>
      </div>
    </div>
  );
}

function VersionsList() {
  const versions = [
    { v: 'v1.2.0', when: '어제', author: '고영현', notes: '청크 크기 자동 조정 옵션 추가, 빈 줄 처리 버그 수정', tag: 'latest' },
    { v: 'v1.1.0', when: '2주 전', author: '고영현', notes: '마크다운 표·리스트 구조 보존 기능 추가' },
    { v: 'v1.0.0', when: '1개월 전', author: '고영현', notes: '최초 공개' },
  ];
  return (
    <div className="card">
      {versions.map((v, i) => (
        <div key={v.v} style={{padding: 18, borderBottom: i < versions.length - 1 ? '1px solid var(--line)' : 'none'}}>
          <div className="row gap-8" style={{marginBottom: 6}}>
            <span className="mono" style={{fontWeight: 700, fontSize: 14}}>{v.v}</span>
            {v.tag && <span className="chip chip-accent">최신</span>}
            <span className="muted-sm">· {v.when} · {v.author}</span>
          </div>
          <div style={{color: 'var(--text-2)', fontSize: 13}}>{v.notes}</div>
        </div>
      ))}
    </div>
  );
}

function CommentsList() {
  return (
    <div className="card card-pad">
      <div style={{color: 'var(--text-3)', fontSize: 13}}>댓글 23개. 가장 인기있는 댓글:</div>
      <div style={{marginTop: 14, padding: 14, background: 'var(--bg-muted)', borderRadius: 8}}>
        <div className="row gap-8" style={{marginBottom: 6}}>
          <div className="avatar sm" style={{background: '#fef3c7', color: '#92400e'}}>김</div>
          <span style={{fontWeight: 600, fontSize: 13}}>김정호</span>
          <span className="muted-sm">· 3일 전</span>
        </div>
        <div style={{fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6}}>
          위키 RAG에 그대로 사용 중입니다. 특히 표 구조 보존이 큰 도움이 되었어요. 👍
        </div>
      </div>
    </div>
  );
}

function SiblingRow({ title, stars, downloads }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-muted)',
      borderRadius: 6,
      cursor: 'pointer',
    }}>
      <div style={{fontWeight: 600, fontSize: 13, marginBottom: 4}}>{title}</div>
      <div className="mono muted-sm" style={{fontSize: 11}}>
        ★ {stars} · ↓ {downloads}
      </div>
    </div>
  );
}

window.ComponentDetail = ComponentDetail;
