// ─────────────────────────────────────────────────────────────────────
// Code diff — line-based LCS diff + git-style renderer
// ─────────────────────────────────────────────────────────────────────

// Compute line-level diff between two strings.
// Returns: array of { type: 'equal'|'add'|'remove', oldLine, newLine, text }
function computeLineDiff(oldText, newText) {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');
  const n = oldLines.length, m = newLines.length;

  // LCS table is O(n*m) memory. Cap so the Uint32Array allocation stays modest
  // (1500² × 4B ≈ 9MB) — safe on mobile. Beyond the cap we fall back below.
  const MAX = 1500;
  if (n > MAX || m > MAX) {
    // Fallback: emit everything as remove + add
    const out = [];
    for (let i = 0; i < n; i++) out.push({ type: 'remove', oldLine: i + 1, newLine: null, text: oldLines[i] });
    for (let j = 0; j < m; j++) out.push({ type: 'add', oldLine: null, newLine: j + 1, text: newLines[j] });
    return out;
  }

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      out.push({ type: 'equal', oldLine: i + 1, newLine: j + 1, text: oldLines[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'remove', oldLine: i + 1, newLine: null, text: oldLines[i] });
      i++;
    } else {
      out.push({ type: 'add', oldLine: null, newLine: j + 1, text: newLines[j] });
      j++;
    }
  }
  while (i < n) { out.push({ type: 'remove', oldLine: i + 1, newLine: null, text: oldLines[i] }); i++; }
  while (j < m) { out.push({ type: 'add', oldLine: null, newLine: j + 1, text: newLines[j] }); j++; }

  return out;
}

function summarizeDiff(diff) {
  let added = 0, removed = 0;
  for (const d of diff) {
    if (d.type === 'add') added++;
    else if (d.type === 'remove') removed++;
  }
  return { added, removed };
}

// Collapse long runs of equal lines, keeping `context` lines of padding around changes.
function collapseEqual(diff, context = 3) {
  const out = [];
  let i = 0;
  while (i < diff.length) {
    if (diff[i].type !== 'equal') { out.push(diff[i]); i++; continue; }

    // find run of equals
    let j = i;
    while (j < diff.length && diff[j].type === 'equal') j++;
    const runLen = j - i;

    const isStart = i === 0;
    const isEnd = j === diff.length;
    const head = isStart ? 0 : context;
    const tail = isEnd ? 0 : context;

    if (runLen <= head + tail) {
      // Short run: keep all
      for (let k = i; k < j; k++) out.push(diff[k]);
    } else {
      for (let k = i; k < i + head; k++) out.push(diff[k]);
      out.push({ type: 'hunk', skipped: runLen - head - tail });
      for (let k = j - tail; k < j; k++) out.push(diff[k]);
    }
    i = j;
  }
  return out;
}

function DiffView({ oldText, newText, collapse = true }) {
  const diff = React.useMemo(() => computeLineDiff(oldText || '', newText || ''), [oldText, newText]);
  const rendered = React.useMemo(() => collapse ? collapseEqual(diff, 3) : diff, [diff, collapse]);
  const { added, removed } = React.useMemo(() => summarizeDiff(diff), [diff]);
  const { t, lang } = useI18n();

  return (
    <div className="diff-view">
      <div className="diff-header">
        <span className="diff-stat added">+{added} {t('improvement_diff_added')}</span>
        <span className="diff-stat removed">-{removed} {t('improvement_diff_removed')}</span>
      </div>
      <div className="diff-body">
        {rendered.map((d, idx) => {
          if (d.type === 'hunk') {
            const hunkLabel = lang === 'en'
              ? `… ${d.skipped} ${t('diff_unchanged_lines')} …`
              : `… ${d.skipped}${t('diff_unchanged_lines')} …`;
            return (
              <div key={idx} className="diff-hunk">{hunkLabel}</div>
            );
          }
          const cls = d.type === 'add' ? 'add' : d.type === 'remove' ? 'remove' : 'equal';
          const marker = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' ';
          return (
            <div key={idx} className={`diff-line ${cls}`}>
              <span className="diff-gutter">{d.oldLine || ''}</span>
              <span className="diff-gutter">{d.newLine || ''}</span>
              <span className="diff-marker">{marker}</span>
              <span className="diff-text">{d.text || ' '}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { DiffView, computeLineDiff, summarizeDiff });
