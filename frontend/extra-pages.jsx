// ─────────────────────────────────────────────────────────────────────
// 내 Component / Flow — personal dashboard (mine + drafts + activity)
// ─────────────────────────────────────────────────────────────────────

// Local Stat (each Babel script has its own scope)
function StatTile({ label, value, icon, delta }) {
  return (
    <div className="stat">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value">{value}</div>
      {delta && <div className="stat-delta">↑ {delta}</div>}
    </div>
  );
}

function MyAssetsPage({ onOpenComponent, onOpenUpload }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState('published');
  const [me, setMe] = React.useState({ name: '고영현', id: '2074795', initial: '고' });
  const [myComponents, setMyComponents] = React.useState([]);
  const [mineLoading, setMineLoading] = React.useState(true);

  React.useEffect(() => {
    api.users.me().then(u => setMe({ name: u.name, id: u.employee_id, initial: u.name?.[0] || '?' })).catch(() => {});
    api.users.myComponents().then(items => { setMyComponents(items || []); setMineLoading(false); }).catch(() => setMineLoading(false));
  }, []);

  const mine = myComponents.filter(c => c.status === 'approved' && !c.deleted_at).map(apiToCard);
  const deleted = myComponents.filter(c => c.deleted_at || c.status === 'rejected').map(c => ({ ...c, desc: c.description || '', updatedAgo: fmtDate(c.created_at), isRejected: c.status === 'rejected', isDeleted: !!c.deleted_at }));
  const drafts = myComponents.filter(c => (c.status === 'pending' || c.status === 'draft') && !c.deleted_at).map(c => ({
    ...c, desc: c.description || '', state: c.status === 'pending' ? 'review' : 'draft',
    updatedAgo: fmtDate(c.created_at),
  }));

  // Aggregates
  const totals = mine.reduce((a, c) => ({
    stars: a.stars + c.stars, downloads: a.downloads + c.downloads, copies: a.copies + c.copies,
  }), { stars: 0, downloads: 0, copies: 0 });

  return (
    <div className="page fade-in">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22}}>
        <div>
          <div className="h1">{t('mine_title')}</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>{t('mine_desc')}</div>
        </div>
        <div className="row gap-8">
          <button className="btn btn-secondary" onClick={() => {
            const rows = [['Title','Type','Version','Stars','Downloads','Updated']];
            mine.forEach(c => rows.push([c.title, c.type, c.version, c.stars, c.downloads, c.updatedAgo]));
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'my-components.csv'; a.click();
            URL.revokeObjectURL(url);
          }}><Icons.Download size={13}/> {t('mine_export')}</button>
          <button className="btn btn-accent" onClick={onOpenUpload}><Icons.Plus/> {t('mine_new')}</button>
        </div>
      </div>

      {mineLoading ? <LoadingIndicator/> : (
        <div className="grid-4" style={{marginBottom: 28}}>
          <StatTile label={t('mine_registered')} value={mine.length} icon={<Icons.Box size={12}/>} />
          <StatTile label={t('mine_total_stars')} value={totals.stars} icon={<Icons.Star size={12}/>}/>
          <StatTile label={t('mine_total_dl')} value={totals.downloads} icon={<Icons.Download size={12}/>}/>
          <StatTile label={t('tab_drafts')} value={drafts.length} icon={<Icons.Clock size={12}/>}/>
        </div>
      )}

      <div className="tabs" style={{display: 'flex', alignItems: 'center'}}>
        {[
          ['published', t('tab_published'), mine.length],
          ['drafts', t('tab_drafts'), drafts.length],
          ...(deleted.length > 0 ? [['deleted', t('tab_deleted') || '삭제됨', deleted.length]] : []),
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} <span className="tab-count">{count}</span>
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" title="새로고침" onClick={() => { setMineLoading(true); api.users.myComponents().then(items => { setMyComponents(items || []); setMineLoading(false); }).catch(() => setMineLoading(false)); }} style={{fontSize: 12, padding: '4px 6px', marginLeft: 4}}>
          <Icons.Reset size={12}/>
        </button>
      </div>

      {tab === 'published' && mineLoading && <LoadingIndicator/>}
      {tab === 'published' && !mineLoading && (
        <div className="my-table">
          <div className="my-table-head">
            <div style={{width: 36}}></div>
            <div>{t('col_name')}</div>
            <div style={{width: 96}}>{t('col_version')}</div>
            <div style={{width: 92, textAlign: 'right'}}>{t('col_star')}</div>
            <div style={{width: 110, textAlign: 'right'}}>{t('col_download')}</div>
            <div style={{width: 100}}>{t('col_update')}</div>
            <div style={{width: 32}}></div>
          </div>
          {mine.map(c => {
            const Icon = Icons[c.icon] || Icons.Box;
            return (
              <div key={c.id} className="my-table-row" onClick={() => onOpenComponent(c)}>
                <div className="card-icon-sm" style={{background: c.iconBg, color: c.iconFg}}><Icon size={15}/></div>
                <div>
                  <div className="row gap-8" style={{marginBottom: 2}}>
                    <span style={{fontWeight: 600, fontSize: 14}}>{c.title}</span>
                    <span className={`chip chip-${c.type}`}>{c.type === 'py' ? '.py' : '.json'}</span>
                    {c.standard && <span className="chip chip-ok"><Icons.Check size={10}/> {t('chip_standard')}</span>}
                  </div>
                  <div className="muted-sm" style={{fontSize: 12.5}}>{c.desc}</div>
                </div>
                <div className="mono" style={{fontSize: 12.5, color: 'var(--text-2)'}}>{c.version}</div>
                <div className="mono my-stat-cell" style={{textAlign: 'right', fontWeight: 600}}><Icons.Star size={12}/> {c.stars}</div>
                <div className="mono my-stat-cell" style={{textAlign: 'right', fontWeight: 600}}><Icons.Download size={12}/> {c.downloads}</div>
                <div className="muted-sm">{c.updatedAgo}</div>
                <div></div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'drafts' && (
        <div className="col" style={{gap: 12}}>
          {drafts.map(d => (
            <div key={d.id} className="draft-card">
              <div className="row gap-8" style={{marginBottom: 10}}>
                <span className={`chip chip-${d.type}`}>{d.type === 'py' ? '.py' : '.json'}</span>
                <span style={{fontWeight: 600, fontSize: 15}}>{d.title}</span>
                <span className="mono muted-sm">{d.version}</span>
                <span className="spacer"/>
                {d.state === 'review' ? (
                  <span className="chip chip-warn"><Icons.Clock size={10}/> {t('draft_reviewing')}</span>
                ) : (
                  <span className="chip chip-neutral">{t('draft_draft')}</span>
                )}
                <span className="muted-sm">· {d.updatedAgo}</span>
              </div>
              <div className="muted" style={{fontSize: 13, marginBottom: 14}}>{d.desc}</div>

              <div className="row gap-8" style={{marginTop: 16}}>
                <button className="btn btn-secondary btn-sm" onClick={() => onOpenComponent && onOpenComponent(apiToCard(d))}>{t('draft_preview')}</button>
                <button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)', fontSize: 11}} onClick={() => {
                  if (!confirm(t('admin_delete_confirm') || 'Delete this item?')) return;
                  api.del('/components/' + d.id).then(() => { setMyComponents(prev => prev.filter(c => c.id !== d.id)); }).catch(e => alert('Delete failed: ' + e.message));
                }}><Icons.X size={10}/> {t('status_deleted') || 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'deleted' && (
        <div className="col" style={{gap: 12}}>
          <div className="card card-pad" style={{padding: '12px 16px', background: 'var(--warn-bg)', border: '1px solid var(--warn)', fontSize: 13, color: 'var(--warn-fg)'}}>
            {t('deleted_notice')}
          </div>
          {deleted.map(d => (
            <div key={d.id} className="draft-card" style={{opacity: 0.75}}>
              <div className="row gap-8" style={{marginBottom: 10}}>
                <span className={`chip chip-${d.type}`}>{d.type === 'py' ? '.py' : '.json'}</span>
                <span style={{fontWeight: 600, fontSize: 15}}>{d.title}</span>
                <span className="spacer"/>
                <span className="chip chip-err" style={{fontSize: 11}}>{d.isRejected ? t('status_rejected') : t('status_deleted')}</span>
              </div>
              <div className="muted" style={{fontSize: 13, marginBottom: 10}}>{d.desc}</div>
              <div className="row gap-8">
                <button className="btn btn-accent btn-sm" onClick={() => onOpenUpload && onOpenUpload(d)}><Icons.Upload size={11}/> {t('btn_resubmit')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 2026 랭킹 — leaderboard
// ─────────────────────────────────────────────────────────────────────
function RankColumn({ title, chipClass, ranked, onOpenComponent, starWeight, downloadWeight }) {
  const { t } = useI18n();
  const score = (c) => c.stars * starWeight + c.downloads * downloadWeight;
  return (
    <div style={{flex: 1, minWidth: 0}}>
      <div className="h3" style={{marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8}}>
        <span className={`chip ${chipClass}`} style={{padding: '0 6px'}}>{chipClass === 'chip-py' ? '.py' : '.json'}</span>
        {title}
      </div>
      <div style={{border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden'}}>
        {ranked.length === 0 && <div className="muted-sm" style={{padding: 28, textAlign: 'center'}}>{t('ranking_empty')}</div>}
        {ranked.map((c, i) => {
          const Icon = Icons[c.icon] || Icons.Box;
          const s = score(c);
          return (
            <div key={c.id} onClick={() => onOpenComponent(c)} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: i < ranked.length - 1 ? '1px solid var(--line)' : 'none', transition: 'background 0.12s'}} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-muted)'} onMouseOut={e => e.currentTarget.style.background = ''}>
              <div style={{width: 28, fontWeight: 700, color: i < 3 ? 'var(--accent-fg)' : 'var(--text-3)', fontSize: 13, textAlign: 'center'}}>{i + 1}</div>
              <div className="card-icon-sm" style={{background: c.iconBg, color: c.iconFg, flexShrink: 0}}><Icon size={14}/></div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.title}</div>
                <div style={{fontSize: 11, color: 'var(--text-3)'}}>{c.author?.name}</div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flexShrink: 0}}>
                <span className="mono" style={{display: 'flex', alignItems: 'center', gap: 3}}><Icons.Star size={11}/> {c.stars}</span>
                <span className="mono" style={{display: 'flex', alignItems: 'center', gap: 3}}><Icons.Download size={11}/> {c.downloads}</span>
                <span className="mono" style={{fontWeight: 700, color: 'var(--accent-fg)', minWidth: 36, textAlign: 'right'}}>{s}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingPage({ onOpenComponent, starWeight = 1, downloadWeight = 2 }) {
  const { t } = useI18n();
  const [pyData, setPyData] = React.useState([]);
  const [jsonData, setJsonData] = React.useState([]);
  const [rankLoading, setRankLoading] = React.useState(true);

  const mapRank = (r) => ({ ...r, id: r.component_id, author: r.author || { name: '' }, icon: r.icon || 'Box', iconBg: 'var(--bg-muted)', iconFg: 'var(--text-2)' });

  const loadRankings = () => {
    setRankLoading(true);
    Promise.all([
      api.rankings.list({ scope: 'py' }).then(d => setPyData((d.items || []).map(mapRank))),
      api.rankings.list({ scope: 'json' }).then(d => setJsonData((d.items || []).map(mapRank))),
    ]).catch(() => {}).finally(() => setRankLoading(false));
  };

  React.useEffect(loadRankings, []);
  React.useEffect(() => {
    window.addEventListener('agenthub:reload', loadRankings);
    return () => window.removeEventListener('agenthub:reload', loadRankings);
  }, []);

  return (
    <div className="page fade-in">
      <div style={{marginBottom: 22}}>
        <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, color: 'var(--accent-fg)'}}>{t('ranking_eyebrow')}</div>
        <div className="h1">{t('ranking_title')}</div>
        <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>{t('ranking_subtitle')}</div>
      </div>

      {/* Score formula */}
      <div className="score-formula" style={{marginBottom: 28}}>
        <div className="score-formula-label">
          <Icons.Sparkle size={11}/>
          <span>{t('ranking_formula')}</span>
        </div>
        <div className="score-formula-eq">
          <span className="sf-token">Score</span>
          <span className="sf-op">=</span>
          <span className="sf-token sf-star">Star</span>
          <span className="sf-op">×</span>
          <span className="sf-num">{starWeight}</span>
          <span className="sf-op">+</span>
          <span className="sf-token sf-dl">{t('col_download')}</span>
          <span className="sf-op">×</span>
          <span className="sf-num">{downloadWeight}</span>
        </div>
        <div className="score-formula-hint">{t('ranking_formula_hint')}</div>
      </div>

      {/* Two-column ranking */}
      {rankLoading ? <LoadingIndicator/> : (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
          <RankColumn title={t('ranking_comp')} chipClass="chip-py" ranked={pyData} onOpenComponent={onOpenComponent} starWeight={starWeight} downloadWeight={downloadWeight}/>
          <RankColumn title={t('ranking_flow')} chipClass="chip-json" ranked={jsonData} onOpenComponent={onOpenComponent} starWeight={starWeight} downloadWeight={downloadWeight}/>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 가이드 — documentation hub
// ─────────────────────────────────────────────────────────────────────
function GuidePage() {
  const { t } = useI18n();
  const [active, setActive] = React.useState('quickstart');
  const [contactChannel, setContactChannel] = React.useState('#agenthub-help');
  React.useEffect(() => {
    api.get('/admin/settings').then(d => { if (d && d.contact_channel) setContactChannel(d.contact_channel); }).catch(() => {});
  }, []);

  const sections = [
    { id: 'quickstart', title: t('guide_quickstart'), icon: 'Zap' },
    { id: 'naming', title: t('guide_naming'), icon: 'Code' },
    { id: 'standard', title: t('guide_standard'), icon: 'Check' },
    { id: 'review', title: t('guide_review'), icon: 'Settings' },
    { id: 'versioning', title: t('guide_versioning'), icon: 'Layers2' },
    { id: 'faq', title: t('guide_faq'), icon: 'Comment' },
  ];

  const steps = [
    { n: 1, title: 'Langflow 프로젝트에서 Component 또는 Flow 추출', body: '내 Langflow 작업 화면 > 우상단 ⋯ 메뉴 > "Export"로 .py / .json 파일을 받습니다.' },
    { n: 2, title: 'AgentHub에서 새 제출 시작', body: '상단 우측 [제출] 버튼 또는 홈의 [+ 새 Component / Flow]를 누르고 파일을 드래그합니다.' },
    { n: 3, title: '기준 정보 입력 및 자동 검증', body: '제목 · 설명 · 카테고리를 입력하면 코드 lint, 시크릿 스캔, 호환성 체크가 자동으로 실행됩니다.' },
    { n: 4, title: '심사 통과 후 게시', body: '심사위원 3명의 평균 점수가 70점 이상이면 게시되며, 표준 기준 충족 시 "표준" 마크가 부여됩니다.' },
  ];

  const standardChecklist = [
    { ok: true, label: '한글 + 영문 README 포함' },
    { ok: true, label: '입력 / 출력 타입 명세' },
    { ok: true, label: 'Langflow 1.8.0 이상 호환' },
    { ok: true, label: '예제 입력값 1건 이상' },
    { ok: true, label: '하드코딩된 시크릿 없음' },
    { ok: false, label: '단위 테스트 (권장, 가산점)' },
  ];

  const faqs = [
    { q: '외부 OSS Component를 그대로 올려도 되나요?', a: '라이선스가 MIT / Apache 2.0인 경우, 출처 명시 후 등록 가능합니다. GPL 계열은 사내 정책상 등록 불가합니다.' },
    { q: '제출한 Component를 수정하고 싶어요.', a: '"내 Component / Flow" > 해당 항목 > [새 버전] 버튼으로 patch 버전을 올려주세요. 이전 버전은 보존되며 사용자가 선택할 수 있습니다.' },
    { q: '랭킹 점수는 어떻게 계산되나요?', a: 'Star × 2 + 다운로드 수. 자기 자신의 Star · 다운로드는 집계에서 제외됩니다. 매일 09:00 KST에 갱신됩니다.' },
    { q: '심사가 너무 오래 걸려요.', a: '제출 후 영업일 기준 평균 1.8일이며, 이슈가 발견되면 댓글로 안내됩니다. 7일 이상 지연 시 문의 채널에 문의해주세요.' },
  ];

  return (
    <div className="page fade-in">
      <div style={{marginBottom: 24}}>
        <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>{t('guide_eyebrow')}</div>
        <div className="h1">{t('guide_title')}</div>
        <div className="muted" style={{fontSize: 13.5, marginTop: 4, maxWidth: 720}}>{t('guide_subtitle')}</div>
      </div>

      {/* External Langflow guide promo */}
      <a className="lf-promo" href="https://langflow-guide.posong.space" target="_blank" rel="noopener">
        <div className="lf-promo-mark">
          <Icons.Globe size={22}/>
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="lf-promo-eyebrow">{t('guide_lf_promo_eyebrow')}</div>
          <div className="lf-promo-title">https://langflow-guide.posong.space</div>
          <div className="lf-promo-desc">{t('guide_lf_promo_desc')}</div>
        </div>
        <div className="lf-promo-arrow">
          <Icons.ArrowRight size={16}/>
        </div>
      </a>

      <div className="guide-layout">
        <aside className="guide-side">
          {sections.map(s => {
            const Icon = Icons[s.icon] || Icons.Box;
            return (
              <button key={s.id} className={`guide-side-item ${active===s.id?'active':''}`} onClick={() => setActive(s.id)}>
                <Icon size={13}/>
                <span>{s.title}</span>
              </button>
            );
          })}
          <div className="guide-side-foot">
            <div className="muted-sm" style={{fontSize: 11.5, marginBottom: 6}}>{t('guide_external')}</div>
            <a className="guide-side-link" href="https://docs.langflow.org/" target="_blank" rel="noopener"><Icons.Globe size={11}/> {t('guide_lf_docs')}</a>
            <a className="guide-side-link" href="https://langflow-guide.posong.space" target="_blank" rel="noopener"><Icons.Globe size={11}/> {t('guide_lf_internal')}</a>
            <a className="guide-side-link" href={contactChannel.startsWith('http') ? contactChannel : undefined} target="_blank" rel="noopener"><Icons.Users size={11}/> {t('guide_voc_channel')}</a>
          </div>
        </aside>

        <main className="guide-main">
          {active === 'quickstart' && (
            <div>
              <div className="h2">빠른 시작 — 4단계로 등록하기</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 24}}>처음 제출하는 분도 약 10분이면 등록을 마칠 수 있습니다.</div>
              <div className="col" style={{gap: 14}}>
                {steps.map(s => (
                  <div key={s.n} className="guide-step">
                    <div className="guide-step-num">{s.n}</div>
                    <div>
                      <div style={{fontWeight: 600, fontSize: 14, marginBottom: 4}}>{s.title}</div>
                      <div className="muted" style={{fontSize: 13, lineHeight: 1.6}}>{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {active === 'naming' && (
            <div>
              <div className="h2">네이밍 규칙</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 24}}>일관된 이름은 검색과 재사용을 쉽게 만듭니다.</div>
              <div className="grid-2" style={{gap: 14}}>
                <div className="naming-card good">
                  <div className="naming-head"><Icons.Check size={12}/> 권장</div>
                  <ul>
                    <li>PascalCase · 명사형 · <span className="mono">SmartChunker</span></li>
                    <li>약어는 가능한 한 풀어서 · <span className="mono">PdfTableParser</span></li>
                    <li>한국어 특화는 접두사 <span className="mono">Korean</span></li>
                  </ul>
                </div>
                <div className="naming-card bad">
                  <div className="naming-head"><Icons.Warn size={12}/> 지양</div>
                  <ul>
                    <li><span className="mono">v2_final_real_chunker</span></li>
                    <li>팀 내부 약어 (<span className="mono">SCH_X</span>)</li>
                    <li>영문/한글 혼용 (<span className="mono">스마트Chunker</span>)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {active === 'standard' && (
            <div>
              <div className="h2">표준 인증 기준</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 24}}>아래 5개 항목을 모두 충족하면 자동으로 "표준" 마크가 부여됩니다.</div>
              <div className="col" style={{gap: 8}}>
                {standardChecklist.map((c, i) => (
                  <div key={i} className={`std-row ${c.ok ? 'ok' : 'todo'}`}>
                    <div className="std-icon">{c.ok ? <Icons.Check size={12}/> : <Icons.Clock size={12}/>}</div>
                    <span style={{fontSize: 13.5}}>{c.label}</span>
                    {!c.ok && <span className="chip chip-neutral" style={{marginLeft: 'auto'}}>가산점</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'review' && (
            <div>
              <div className="h2">심사 프로세스</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 24}}>제출부터 게시까지 평균 1.8 영업일이 걸립니다.</div>
              <div className="review-pipeline">
                {['제출', '자동 검증', '심사위원 배정', '리뷰 (3인)', '게시'].map((s, i, arr) => (
                  <React.Fragment key={s}>
                    <div className="pipe-step">
                      <div className="pipe-dot">{i + 1}</div>
                      <div className="pipe-label">{s}</div>
                    </div>
                    {i < arr.length - 1 && <div className="pipe-arrow">→</div>}
                  </React.Fragment>
                ))}
              </div>
              <div className="muted" style={{fontSize: 13, marginTop: 24, lineHeight: 1.7}}>
                심사는 코드 품질 (40%), 문서화 (30%), 재사용성 (20%), 보안 (10%) 4개 축으로 평가됩니다.
                평균 70점 이상이면 게시되며, 한 명이라도 반려를 누르면 자동으로 보류 상태로 전환됩니다.
              </div>
            </div>
          )}

          {active === 'versioning' && (
            <div>
              <div className="h2">버전 호환성</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 24}}>SemVer를 따르며, Langflow 호환 버전은 메타데이터에 명시합니다.</div>
              <table className="ver-table">
                <thead>
                  <tr>
                    <th>버전 변경</th>
                    <th>의미</th>
                    <th>예시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="mono">major</td><td>호환되지 않는 변경 (입출력 타입 변경 등)</td><td className="mono muted-sm">1.x.x → 2.0.0</td></tr>
                  <tr><td className="mono">minor</td><td>하위 호환 기능 추가</td><td className="mono muted-sm">1.2.x → 1.3.0</td></tr>
                  <tr><td className="mono">patch</td><td>버그 수정, 성능 개선</td><td className="mono muted-sm">1.2.0 → 1.2.1</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {active === 'faq' && (
            <div>
              <div className="h2">자주 묻는 질문</div>
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 20}}>여기에서 답을 찾지 못했다면 문의 채널({contactChannel})을 이용해주세요.</div>
              <div className="col" style={{gap: 8}}>
                {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a}/>)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span style={{fontWeight: 600, fontSize: 13.5, textAlign: 'left'}}>{q}</span>
        <Icons.ChevronRight size={14} style={{transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', color: 'var(--text-3)'}}/>
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

Object.assign(window, { MyAssetsPage, RankingPage, GuidePage });
