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
  const [tab, setTab] = React.useState('published');
  const me = { name: '고영현', id: '2074795', initial: '고' };

  const mine = COMPONENTS.filter(c => c.author?.name === me.name);
  const drafts = [
    { id: 'd-1', type: 'py', title: 'SmartChunker', desc: '의미 단위로 자동 분할하는 한국어 특화 청커', version: 'v1.3.0-rc.1', updatedAgo: '32분 전', state: 'review', validation: { ok: 4, total: 5 } },
    { id: 'd-2', type: 'json', title: '계약서 검토 Flow', desc: '계약서 PDF → 위험 조항 추출 → Slack 알림', version: 'v0.1.0', updatedAgo: '어제', state: 'draft', validation: { ok: 2, total: 5 } },
  ];
  const activity = [
    { kind: 'star', who: '김정호', target: 'SmartChunker', when: '2시간 전' },
    { kind: 'download', who: '박지원', target: 'KoreanReranker', when: '4시간 전' },
    { kind: 'comment', who: '최서연', target: 'PDFTableParser', when: '어제', body: '표 안의 병합 셀 처리가 깔끔하네요. 우리 팀에서도 도입할게요.' },
    { kind: 'review', who: '심사팀', target: 'SmartChunker v1.3.0', when: '1일 전', body: '코드 품질 88점 · 문서 92점' },
    { kind: 'rank', who: '랭킹', target: 'SmartChunker → 1위', when: '3일 전' },
  ];

  // Aggregates
  const totals = mine.reduce((a, c) => ({
    stars: a.stars + c.stars, downloads: a.downloads + c.downloads, copies: a.copies + c.copies,
  }), { stars: 0, downloads: 0, copies: 0 });

  return (
    <div className="page fade-in">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22}}>
        <div>
          <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>{me.id} · {me.name}</div>
          <div className="h1">내 Component / Flow</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>내가 등록한 Component·Flow와 진행 중인 초안을 한눈에 관리하세요.</div>
        </div>
        <div className="row gap-8">
          <button className="btn btn-secondary"><Icons.Download size={13}/> CSV 내보내기</button>
          <button className="btn btn-accent" onClick={onOpenUpload}><Icons.Plus/> 새 Component / Flow</button>
        </div>
      </div>

      <div className="grid-4" style={{marginBottom: 28}}>
        <StatTile label="내 등록" value={mine.length} icon={<Icons.Box size={12}/>} />
        <StatTile label="누적 Star" value={totals.stars} icon={<Icons.Star size={12}/>} delta="+12 이번 주"/>
        <StatTile label="누적 다운로드" value={totals.downloads} icon={<Icons.Download size={12}/>} delta="+38 이번 주"/>
        <StatTile label="2026 랭킹" value="#1" icon={<Icons.Trophy size={12}/>} delta="유지"/>
      </div>

      <div className="tabs">
        {[
          ['published', '게시됨', mine.length],
          ['drafts', '초안 / 심사 중', drafts.length],
          ['activity', '활동', activity.length],
        ].map(([id, label, count]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
            {label} <span className="tab-count">{count}</span>
          </button>
        ))}
      </div>

      {tab === 'published' && (
        <div className="my-table">
          <div className="my-table-head">
            <div style={{width: 36}}></div>
            <div>이름</div>
            <div style={{width: 96}}>버전</div>
            <div style={{width: 92, textAlign: 'right'}}>Star</div>
            <div style={{width: 110, textAlign: 'right'}}>다운로드</div>
            <div style={{width: 100}}>업데이트</div>
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
                    {c.standard && <span className="chip chip-ok"><Icons.Check size={10}/> 표준</span>}
                    {c.rank === 1 && <span className="chip chip-warn trophy"><Icons.Trophy size={10}/> 1위</span>}
                  </div>
                  <div className="muted-sm" style={{fontSize: 12.5}}>{c.desc}</div>
                </div>
                <div className="mono" style={{fontSize: 12.5, color: 'var(--text-2)'}}>{c.version}</div>
                <div className="mono" style={{textAlign: 'right', fontWeight: 600}}>{c.stars}</div>
                <div className="mono" style={{textAlign: 'right', fontWeight: 600}}>{c.downloads}</div>
                <div className="muted-sm">{c.updatedAgo}</div>
                <div style={{color: 'var(--text-3)'}}><Icons.ChevronRight size={14}/></div>
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
                  <span className="chip chip-warn"><Icons.Clock size={10}/> 심사 중</span>
                ) : (
                  <span className="chip chip-neutral">초안</span>
                )}
                <span className="muted-sm">· {d.updatedAgo}</span>
              </div>
              <div className="muted" style={{fontSize: 13, marginBottom: 14}}>{d.desc}</div>

              <div className="draft-progress">
                <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
                  <span className="muted-sm">자동 검증</span>
                  <span className="mono muted-sm">{d.validation.ok} / {d.validation.total} 통과</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width: `${(d.validation.ok / d.validation.total) * 100}%`}}/>
                </div>
              </div>

              <div className="row gap-8" style={{marginTop: 16}}>
                <button className="btn btn-secondary btn-sm">이어서 작성</button>
                <button className="btn btn-ghost btn-sm">미리보기</button>
                <span className="spacer"/>
                {d.state === 'review' && <button className="btn btn-ghost btn-sm" style={{color: 'var(--err-fg)'}}>제출 취소</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="activity-feed">
          {activity.map((a, i) => (
            <div key={i} className="activity-row">
              <div className={`activity-icon activity-${a.kind}`}>
                {a.kind === 'star' && <Icons.Star size={13}/>}
                {a.kind === 'download' && <Icons.Download size={13}/>}
                {a.kind === 'comment' && <Icons.Comment size={13}/>}
                {a.kind === 'review' && <Icons.Check size={13}/>}
                {a.kind === 'rank' && <Icons.Trophy size={13}/>}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 13.5}}>
                  <span style={{fontWeight: 600}}>{a.who}</span>
                  {a.kind === 'star' && <span> 님이 <strong>{a.target}</strong>에 Star를 눌렀어요</span>}
                  {a.kind === 'download' && <span> 님이 <strong>{a.target}</strong>를 다운로드했어요</span>}
                  {a.kind === 'comment' && <span> 님이 <strong>{a.target}</strong>에 댓글</span>}
                  {a.kind === 'review' && <span>이 <strong>{a.target}</strong> 1차 심사를 완료했어요</span>}
                  {a.kind === 'rank' && <span>: <strong>{a.target}</strong></span>}
                </div>
                {a.body && <div className="activity-body">"{a.body}"</div>}
              </div>
              <div className="muted-sm" style={{whiteSpace: 'nowrap'}}>{a.when}</div>
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
function RankingPage({ onOpenComponent, starWeight = 2, downloadWeight = 1 }) {
  const [scope, setScope] = React.useState('all'); // all | py | json
  const [period, setPeriod] = React.useState('h1'); // h1 | week | month

  const ranked = [...COMPONENTS]
    .filter(c => scope === 'all' ? true : c.type === scope)
    .sort((a, b) => (b.stars * starWeight + b.downloads * downloadWeight) - (a.stars * starWeight + a.downloads * downloadWeight));

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // Top 3 podium order: 2, 1, 3 (height-based reordering for visual)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const trophyColors = ['#94a3b8', '#f59e0b', '#a16207']; // for podium order: silver, gold, bronze
  const heights = [180, 220, 150];
  const placeLabel = ['2nd', '1st', '3rd'];

  return (
    <div className="page fade-in">
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18}}>
        <div>
          <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, color: 'var(--accent-fg)'}}>2026 상반기</div>
          <div className="h1">랭킹</div>
          <div className="muted" style={{fontSize: 13.5, marginTop: 4}}>매일 오전 9시 갱신 · 자기 Star·다운로드 제외</div>
        </div>
        <div className="row gap-8">
          <div className="segmented">
            {[['h1', '상반기'], ['month', '이번 달'], ['week', '이번 주']].map(([v, l]) => (
              <button key={v} className={`segmented-item ${period===v?'active':''}`} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
          <div className="segmented">
            {[['all', '전체'], ['py', '.py'], ['json', '.json']].map(([v, l]) => (
              <button key={v} className={`segmented-item ${scope===v?'active':''}`} onClick={() => setScope(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Score formula card */}
      <div className="score-formula">
        <div className="score-formula-label">
          <Icons.Sparkle size={11}/>
          <span>점수 계산식</span>
        </div>
        <div className="score-formula-eq">
          <span className="sf-token">Score</span>
          <span className="sf-op">=</span>
          <span className="sf-token sf-star">Star</span>
          <span className="sf-op">×</span>
          <span className="sf-num">{starWeight}</span>
          <span className="sf-op">+</span>
          <span className="sf-token sf-dl">다운로드</span>
          <span className="sf-op">×</span>
          <span className="sf-num">{downloadWeight}</span>
        </div>
        <div className="score-formula-hint">매일 오전 9시 갱신</div>
      </div>

      {/* Podium */}
      <div className="podium-wrap">
        {podiumOrder.map((c, i) => {
          if (!c) return null;
          const Icon = Icons[c.icon] || Icons.Box;
          const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          return (
            <div key={c.id} className="podium-col" onClick={() => onOpenComponent(c)}>
              <div className="podium-card">
                <div className={`podium-medal medal-${realRank}`}>
                  <Icons.Trophy size={14}/>
                  <span>{placeLabel[i]}</span>
                </div>
                <div className="card-icon-md" style={{background: c.iconBg, color: c.iconFg, margin: '14px auto 12px'}}>
                  <Icon size={22}/>
                </div>
                <div style={{fontWeight: 700, fontSize: 15, textAlign: 'center', marginBottom: 4}}>{c.title}</div>
                <div className="muted-sm" style={{textAlign: 'center', marginBottom: 4}}>{c.author?.name}</div>
                <div className="mono muted-sm" style={{textAlign: 'center', marginBottom: 10, fontSize: 11}}>({c.author?.id})</div>
                <div className="podium-stats">
                  <div><span className="mono" style={{fontWeight: 700}}>{c.stars}</span><span className="muted-sm"> Star</span></div>
                  <div className="podium-stats-sep"/>
                  <div><span className="mono" style={{fontWeight: 700}}>{c.downloads}</span><span className="muted-sm"> 다운로드</span></div>
                </div>
              </div>
              <div className="podium-block" style={{height: heights[i], background: trophyColors[i]}}>
                <div className="podium-rank-num">{realRank}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div style={{marginTop: 36}}>
        <div className="h2" style={{marginBottom: 14}}>전체 순위</div>
        <div className="rank-table">
          <div className="rank-table-head">
            <div style={{width: 56}}>#</div>
            <div>Component / Flow</div>
            <div style={{width: 140}}>개발자</div>
            <div style={{width: 96, textAlign: 'right'}}>Star</div>
            <div style={{width: 110, textAlign: 'right'}}>다운로드</div>
            <div style={{width: 90, textAlign: 'right'}}>점수</div>
            <div style={{width: 80, textAlign: 'right'}}>변동</div>
          </div>
          {ranked.map((c, i) => {
            const Icon = Icons[c.icon] || Icons.Box;
            const score = +(c.stars * starWeight + c.downloads * downloadWeight).toFixed(1);
            const trends = ['+2', '—', '+1', '-1', '+3', '—', '-2', '+1'];
            const trend = trends[i] || '—';
            return (
              <div key={c.id} className="rank-table-row" onClick={() => onOpenComponent(c)}>
                <div className="rank-num" style={{width: 56}}>
                  {i < 3 ? <Icons.Trophy size={14} className={`medal-icon medal-${i+1}`}/> : <span className="mono">{i + 1}</span>}
                </div>
                <div className="row gap-8">
                  <div className="card-icon-sm" style={{background: c.iconBg, color: c.iconFg}}><Icon size={14}/></div>
                  <div>
                    <div style={{fontWeight: 600, fontSize: 13.5}}>{c.title}</div>
                    <div className="muted-sm" style={{fontSize: 12}}>{c.category}</div>
                  </div>
                </div>
                <div className="row gap-8" style={{width: 180}}>
                  <div className="avatar-xs">{c.author?.initial}</div>
                  <div style={{minWidth: 0}}>
                    <div style={{fontSize: 13, lineHeight: 1.2}}>{c.author?.name}</div>
                    <div className="mono muted-sm" style={{fontSize: 10.5}}>({c.author?.id})</div>
                  </div>
                </div>
                <div className="mono" style={{textAlign: 'right', fontWeight: 600, width: 96}}>{c.stars}</div>
                <div className="mono" style={{textAlign: 'right', fontWeight: 600, width: 110}}>{c.downloads}</div>
                <div className="mono" style={{textAlign: 'right', fontWeight: 700, width: 90, color: 'var(--accent-fg)'}}>{score}</div>
                <div className="mono" style={{textAlign: 'right', width: 80, color: trend.startsWith('+') ? 'var(--ok-fg)' : trend.startsWith('-') ? 'var(--err-fg)' : 'var(--text-3)'}}>{trend}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 가이드 — documentation hub
// ─────────────────────────────────────────────────────────────────────
function GuidePage() {
  const [active, setActive] = React.useState('quickstart');

  const sections = [
    { id: 'quickstart', title: '빠른 시작', icon: 'Zap' },
    { id: 'naming', title: '네이밍 규칙', icon: 'Code' },
    { id: 'standard', title: '표준 인증 기준', icon: 'Check' },
    { id: 'review', title: '심사 프로세스', icon: 'Settings' },
    { id: 'versioning', title: '버전 호환성', icon: 'Layers2' },
    { id: 'faq', title: '자주 묻는 질문', icon: 'Comment' },
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
    { q: '심사가 너무 오래 걸려요.', a: '제출 후 영업일 기준 평균 1.8일이며, 이슈가 발견되면 댓글로 안내됩니다. 7일 이상 지연 시 #agenthub-help 채널에 문의해주세요.' },
  ];

  return (
    <div className="page fade-in">
      <div style={{marginBottom: 24}}>
        <div className="muted-sm" style={{textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6}}>Documentation</div>
        <div className="h1">AgentHub 가이드</div>
        <div className="muted" style={{fontSize: 13.5, marginTop: 4, maxWidth: 720}}>Langflow Component·Flow를 사내에서 안전하게 공유하기 위한 표준과 절차를 안내합니다. 처음이라면 빠른 시작부터 읽어보세요.</div>
      </div>

      {/* External Langflow guide promo */}
      <a className="lf-promo" href="https://langflow-guide.posong.space" target="_blank" rel="noopener">
        <div className="lf-promo-mark">
          <Icons.Globe size={22}/>
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="lf-promo-eyebrow">Langflow 공식 가이드</div>
          <div className="lf-promo-title">langflow-guide.posong.space</div>
          <div className="lf-promo-desc">설치, 노드 구성, 디버깅, 배포까지 Langflow 자체의 사용법은 외부 가이드에서 확인하세요.</div>
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
            <div className="muted-sm" style={{fontSize: 11.5, marginBottom: 6}}>외부 자료</div>
            <a className="guide-side-link" href="https://langflow-guide.posong.space" target="_blank" rel="noopener"><Icons.Globe size={11}/> Langflow 공식 가이드</a>
            <a className="guide-side-link"><Icons.Comment size={11}/> #agenthub-help</a>
            <a className="guide-side-link"><Icons.FileText size={11}/> 정책 문서 (Confluence)</a>
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

              <div className="callout" style={{marginTop: 28}}>
                <Icons.Zap size={14} style={{flexShrink: 0, marginTop: 2, color: 'var(--accent-fg)'}}/>
                <div>
                  <div style={{fontWeight: 600, marginBottom: 2}}>팁 — 표준 인증을 노리세요</div>
                  <div className="muted" style={{fontSize: 13}}>표준 마크가 붙은 Component·Flow는 검색 노출이 2배, 내 부서 KPI에도 가산됩니다. 체크리스트는 옆 메뉴 "표준 인증 기준"에서 확인하세요.</div>
                </div>
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
              <div className="muted" style={{fontSize: 13.5, marginTop: 6, marginBottom: 20}}>여기에서 답을 찾지 못했다면 #agenthub-help 채널을 이용해주세요.</div>
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
