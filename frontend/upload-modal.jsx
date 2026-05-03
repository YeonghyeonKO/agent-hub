// Upload modal — multi-step submission

function UploadModal({ onClose }) {
  const [step, setStep] = React.useState(0); // 0: file, 1: meta, 2: confirm
  const [hasFile, setHasFile] = React.useState(false);
  const [realFile, setRealFile] = React.useState(null);
  const [drag, setDrag] = React.useState(false);
  const [fileType, setFileType] = React.useState('py');
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [category, setCategory] = React.useState('RAG / 검색');
  const [minVer, setMinVer] = React.useState('1.8.0');
  const [maxVer, setMaxVer] = React.useState('1.9.1');
  const [tested, setTested] = React.useState(['1.9.1', '1.9.0', '1.8.3']);
  const [deps, setDeps] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleRealFile = (file) => {
    if (!file) return;
    setRealFile(file);
    setHasFile(true);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') setFileType('json');
    else setFileType('py');
    if (!title) setTitle(file.name.replace(/\.(py|json)$/i, ''));
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
      fd.append('max_langflow_ver', maxVer === '제한 없음' ? '' : maxVer);
      fd.append('tested_versions', tested.join(','));
      fd.append('icon', fileType === 'json' ? 'Workflow' : 'Box');
      await api.components.create(fd);
      onClose();
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVer = (v) => {
    setTested(t => t.includes(v) ? t.filter(x => x !== v) : [...t, v]);
  };

  const VERSIONS = ['1.9.1', '1.9.0', '1.8.3', '1.8.2', '1.8.1', '1.8.0'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="h2">새 Component / Flow 제출</div>
            <div className="muted-sm" style={{marginTop: 4}}>
              .py Component 또는 .json Flow를 등록하세요
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><Icons.X/></button>
        </div>

        <div style={{padding: '14px 24px 0'}}>
          <div className="stepper">
            <div className={`step ${step >= 0 ? (step === 0 ? 'active' : 'done') : ''}`}>
              <div className="step-num">{step > 0 ? <Icons.Check size={11}/> : 1}</div>
              <span>파일</span>
            </div>
            <div className="step-line"/>
            <div className={`step ${step >= 1 ? (step === 1 ? 'active' : 'done') : ''}`}>
              <div className="step-num">{step > 1 ? <Icons.Check size={11}/> : 2}</div>
              <span>기준 정보</span>
            </div>
            <div className="step-line"/>
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span>호환성·확인</span>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {step === 0 && (
            <div className="fade-in">
              <div className="field">
                <label className="field-label">유형</label>
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
                      <span className="mono" style={{fontWeight: 600, fontSize: 13}}>{realFile ? realFile.name : 'file'}</span>
                      <span className="muted-sm">· {realFile ? (realFile.size / 1024).toFixed(1) + ' KB' : ''}</span>
                    </div>
                    <div className="muted-sm" style={{marginTop: 10, fontSize: 11.5}}>다른 파일로 교체하려면 클릭하세요</div>
                  </div>
                ) : (
                  <div>
                    <div style={{display: 'flex', justifyContent: 'center', marginBottom: 10}}>
                      <div style={{width: 36, height: 36, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 999, display: 'grid', placeItems: 'center', color: 'var(--text-3)'}}>
                        <Icons.Upload size={16}/>
                      </div>
                    </div>
                    <div className="dropzone-title">파일을 끌어 놓거나 클릭하여 선택</div>
                    <div className="dropzone-hint">.py · .json · 최대 5MB</div>
                  </div>
                )}
              </div>

              {hasFile && (
                <div style={{marginTop: 16, padding: 14, background: 'var(--ok-bg)', border: '1px solid var(--ok)', borderRadius: 8}}>
                  <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--ok-fg)', marginBottom: 8}}>
                    <Icons.Check size={11}/> 사전 검증 통과 (4/5)
                  </div>
                  <div className="checklist">
                    <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>파일 형식 유효 (.py)</div>
                    <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>임포트 검증 통과</div>
                    <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>비밀키 노출 없음</div>
                    <div className="check-item"><div className="check-icon ok"><Icons.Check size={9}/></div>파일 크기 적정</div>
                    <div className="check-item"><div className="check-icon warn"><Icons.Warn size={9}/></div>외부 패키지 2개 필요</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="fade-in">
              <div className="field">
                <label className="field-label">제목 <span className="req">*</span></label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">한 줄 설명 <span className="req">*</span></label>
                <input className="input" value={desc} onChange={e => setDesc(e.target.value)}/>
                <div className="field-hint">홈 카드와 검색 결과에 표시됩니다 · {desc.length} / 80자</div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label">카테고리 <span className="req">*</span></label>
                  <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>RAG / 검색</option>
                    <option>문서 처리</option>
                    <option>데이터 / ERP</option>
                    <option>워크플로우</option>
                    <option>에이전트</option>
                    <option>유틸</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">아이콘</label>
                  <div className="row gap-8">
                    {['Scissors', 'Database', 'Plug', 'Ticket', 'FileText', 'Layers'].map(name => {
                      const I = Icons[name] || Icons.Box;
                      return (
                        <button key={name} className="btn btn-icon btn-secondary" style={{width: 32, height: 32}}>
                          <I size={14}/>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="field" style={{marginBottom: 0}}>
                <label className="field-label">태그 (선택)</label>
                <div className="row gap-8" style={{flexWrap: 'wrap'}}>
                  {['한국어', 'KSS', '청크', 'RAG'].map(t => (
                    <span key={t} className="tag">#{t} <Icons.X size={10}/></span>
                  ))}
                  <button className="tag" style={{cursor: 'pointer', borderStyle: 'dashed'}}><Icons.Plus size={10}/> 추가</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <div className="val-card">
                <div className="val-card-title">Langflow 호환 버전 <span className="req">*</span></div>
                <div className="muted-sm" style={{marginBottom: 12, fontSize: 12}}>동작을 확인한 버전을 명시해주세요. 사용자에게 카드와 상세 페이지에서 안내됩니다.</div>
                <div className="grid-2" style={{gap: 12, marginBottom: 14}}>
                  <div>
                    <label className="field-label">최소 버전</label>
                    <select className="select" value={minVer} onChange={e => setMinVer(e.target.value)}>
                      {VERSIONS.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">최대 버전 (선택)</label>
                    <select className="select" value={maxVer} onChange={e => setMaxVer(e.target.value)}>
                      <option>제한 없음</option>
                      {VERSIONS.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="field-label">동작 확인한 버전 (체크)</label>
                  <div className="row gap-8" style={{flexWrap: 'wrap'}}>
                    {VERSIONS.map(v => {
                      const on = tested.includes(v);
                      return (
                        <button key={v} className="version-pill" onClick={() => toggleVer(v)} style={{
                          borderColor: on ? 'var(--ok)' : 'var(--line)',
                          color: on ? 'var(--ok-fg)' : 'var(--text-3)',
                          fontWeight: on ? 600 : 400,
                          cursor: 'pointer',
                        }}>
                          {on && <Icons.Check size={9}/>}
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="field-label">추가 의존성 (선택)</label>
                <input className="input mono" placeholder="예: kss>=4.0, kiwipiepy" value={deps} onChange={e => setDeps(e.target.value)}/>
                <div className="field-hint">requirements.txt 형식 · 쉼표로 구분</div>
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-muted)', border: '1px solid var(--line)', borderRadius: 8}}>
                <div className="avatar sm" style={{background: 'var(--bg-elev)', color: 'var(--text-2)', border: '1px solid var(--line)'}}>고</div>
                <div>
                  <div style={{fontSize: 12.5, fontWeight: 600}}>고영현 <span className="mono muted-sm" style={{fontWeight: 400}}>2074795</span></div>
                  <div className="muted-sm" style={{fontSize: 11.5}}>SSO 로그인 정보로 자동 입력됨</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>취소</button>
          <div className="row gap-8">
            <button className="btn btn-secondary btn-sm">임시 저장</button>
            {step > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => s - 1)}>이전</button>
            )}
            {step < 2 ? (
              <button className="btn btn-accent btn-sm" disabled={step === 0 && !hasFile} style={{opacity: (step === 0 && !hasFile) ? 0.5 : 1}} onClick={() => setStep(s => s + 1)}>
                다음 <Icons.ArrowRight size={11}/>
              </button>
            ) : (
              <button className="btn btn-accent btn-sm" onClick={handleSubmitToAPI} disabled={submitting} style={{opacity: submitting ? 0.5 : 1}}>
                <Icons.Check size={11}/> {submitting ? '제출 중...' : '제출하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.UploadModal = UploadModal;
