/* Peak — Calendar, Exercises, Analysis and Body screens. Loaded after app.js. */
'use strict';

Object.assign(UI, { calMonth: null, calSel: null, exCat: null, exId: null, exTab: 'history', metric: null, anPeriod: 'week', testCol: 0 });

const SHORT_M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (isoStr) => { const [, m, d] = isoStr.split('-').map(Number); return d + ' ' + SHORT_M[m - 1]; };
const doneWorkouts = () => D.workouts.filter((w) => w.end);
const e1rm = (s) => (s.w != null && s.r ? s.w * (1 + (s.r > 1 ? s.r / 30 : 0)) : 0);

/* ---------- metrics ---------- */
const METRICS = {
  e1rm: { label: 'Est. 1RM', unit: 'kg', f: (ss) => Math.max(0, ...ss.map(e1rm)) },
  maxw: { label: 'Max weight', unit: 'kg', f: (ss) => Math.max(0, ...ss.map((s) => s.w || 0)) },
  added: { label: 'Added kg', unit: 'kg', f: (ss) => Math.max(0, ...ss.map((s) => s.w || 0)) },
  vol: { label: 'Volume', unit: 'kg', f: (ss) => ss.reduce((a, s) => a + (s.w || 0) * (s.r || 0), 0) },
  maxr: { label: 'Max reps', unit: 'reps', f: (ss) => Math.max(0, ...ss.map((s) => s.r || 0)) },
  totr: { label: 'Total reps', unit: 'reps', f: (ss) => ss.reduce((a, s) => a + (s.r || 0), 0) },
  maxt: { label: 'Max time', unit: 's', f: (ss) => Math.max(0, ...ss.map((s) => s.t || 0)) },
  dist: { label: 'Max distance', unit: 'm', f: (ss) => Math.max(0, ...ss.map((s) => s.d || 0)) }
};
const METRICS_BY_TYPE = { wr: ['e1rm', 'maxw', 'vol'], bwkg: ['maxr', 'added'], reps: ['maxr', 'totr'], time: ['maxt'], wd: ['maxw', 'dist'], wt: ['maxw', 'maxt'] };
const primaryMetric = (ex) => METRICS_BY_TYPE[ex.type][0];

/* per workout, per side values of a metric for one exercise */
function series(exId, metric) {
  const ex = D.exercises[exId]; const out = [];
  doneWorkouts().forEach((w) => {
    const ss = setsOf(w, exId); if (!ss.length) return;
    const row = { date: w.date };
    if (ex.uni) {
      const L = ss.filter((s) => s.side === 'L'), R = ss.filter((s) => s.side === 'R');
      row.L = L.length ? METRICS[metric].f(L) : null; row.R = R.length ? METRICS[metric].f(R) : null;
    } else row.v = METRICS[metric].f(ss);
    out.push(row);
  });
  return out;
}
const fmtMetric = (v, m) => (v == null ? '—' : m === 'maxt' ? fmtT(v) : fmtW(Math.round(v * 10) / 10) + ' ' + METRICS[m].unit);

/* ---------- calendar ---------- */
function calendarView() {
  const today = iso();
  if (!UI.calMonth) UI.calMonth = today.slice(0, 7);
  if (!UI.calSel) UI.calSel = today;
  const [y, m] = UI.calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1); const offset = (first.getDay() + 6) % 7;
  const byDate = {};
  doneWorkouts().forEach((w) => { (byDate[w.date] = byDate[w.date] || []).push(w); });
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dt = new Date(y, m - 1, 1 - offset + i); const k = iso(dt); const inM = dt.getMonth() === m - 1;
    const cats = []; (byDate[k] || []).forEach((w) => w.sets.forEach((s) => { const c = D.exercises[s.exId] && D.exercises[s.exId].cat; if (c && !cats.includes(c)) cats.push(c); }));
    const cls = ['cal-day', inM ? '' : 'out', k === today ? 'today' : '', k === UI.calSel ? 'sel' : ''].join(' ');
    const pl = plannedFor(k).filter((p) => !p.done);
    cells.push(`<button class="${cls}" data-act="cal-day" data-d="${k}" aria-label="${longDate(k)}${byDate[k] ? ', ' + byDate[k].length + ' session' : ''}${pl.length ? ', ' + pl.length + ' planned' : ''}${D.runs[k] ? ', run' : ''}"><span>${dt.getDate()}</span><span class="cal-dots">${cats.slice(0, 5).map((c) => `<i class="dot sm" style="background:${CATS[c]}"></i>`).join('')}${pl.length ? `<i class="ring${k < today ? ' past' : ''}${k === UI.calPop ? ' pop' : ''}"></i>` : ''}</span>${D.runs[k] ? `<span class="cal-run">${svg('run', 16, 2.2)}</span>` : ''}</button>`);
  }
  const sel = UI.calSel; const ws = byDate[sel] || []; const ran = !!D.runs[sel];
  const detail = ws.map((w) => {
    const cats = {}; w.sets.forEach((s) => { const c = D.exercises[s.exId] && D.exercises[s.exId].cat; if (c) cats[c] = (cats[c] || 0) + 1; });
    const exs = [...new Set(w.sets.map((s) => s.exId))];
    return `<div class="day-sess"><div class="row between"><b>${esc(w.name)}</b><button class="btn small outline" data-act="hist-open" data-v="${w.id}">Open</button></div>${w.note ? `<p class="soft sm">“${esc(w.note)}”</p>` : ''}<span class="muted sm">${w.planId ? 'Cycle ' + esc(w.cycle) + ' · week ' + w.week + ' · ' : ''}${w.pct != null ? w.pct + ' % · ' : ''}${w.sets.length} sets · ${Math.max(1, Math.round((w.end - w.start) / 60000))} min</span>
      <div class="chips">${Object.keys(cats).map((c) => `<span class="chip"><i class="dot" style="background:${CATS[c]}"></i>${esc(c)} ${cats[c]}</span>`).join('')}</div>
      <div class="day-ex">${exs.map((id) => `<button class="link" data-act="open-ex" data-v="${id}">${esc(D.exercises[id] ? D.exercises[id].name : id)}</button>`).join('')}</div></div>`;
  }).join('');
  const seg = `<div class="seg-ctl cal-seg"><button class="${UI.calMode !== 'list' ? 'on' : ''}" aria-pressed="${UI.calMode !== 'list'}" data-act="cal-mode" data-v="month">Month</button><button class="${UI.calMode === 'list' ? 'on' : ''}" aria-pressed="${UI.calMode === 'list'}" data-act="cal-mode" data-v="list">List</button></div>`;
  if (UI.calMode === 'list' && typeof historyListHTML === 'function') return `<header class="top"><h1>Calendar</h1></header>${seg}<div class="hist-list">${historyListHTML()}</div>`;
  return `<header class="top"><h1>Calendar</h1></header>${seg}
  <div class="cal-wrap">
    <section class="card cal">
      <div class="row between"><button class="icon-btn" aria-label="Previous month" data-act="cal-month" data-d="-1">${svg('back')}</button><span class="strong">${MONTHS[m - 1]} ${y}</span><button class="icon-btn flip" aria-label="Next month" data-act="cal-month" data-d="1">${svg('back')}</button></div>
      <div class="cal-head">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal-grid">${cells.join('')}</div>
      <div class="legend"><span><i class="dot sm" style="background:var(--soft)"></i> Categories trained</span><span><i class="ring"></i> Planned</span><span>${svg('run', 16, 2)} Run</span></div>
    </section>
    <section class="card">
      <span class="eyebrow">${esc(longDate(sel).toUpperCase())}${sel === today ? ' · TODAY' : ''}</span>
      ${detail || (plannedFor(sel).length ? '' : '<p class="muted">No gym session this day.</p>')}
      ${plannedDayHTML(sel)}
      <button class="btn ${ran ? 'primary' : 'outline'}" data-act="cal-run" aria-pressed="${ran}">${svg('run', 18, 2)} ${ran ? 'Ran this day ✓' : 'I ran this day'}</button>
    </section>
  </div>`;
}

/* ---------- guides ---------- */
function guideHTML(exId) {
  const g = typeof GUIDES !== 'undefined' && GUIDES[exId]; if (!g) return '';
  const frames = g.frames.map(([label, s], i) => `<figure class="frame"><figcaption>${i + 1} · ${esc(label)}</figcaption><svg viewBox="0 0 340 230" role="img" aria-label="${esc(label)}">${GUIDE_DEFS}${s}</svg></figure>`).join('');
  const row = (k, v, cls) => `<div class="g-row"><span class="eyebrow${cls ? ' ' + cls : ''}">${k}</span><span>${esc(v)}</span></div>`;
  return `<div class="frames">${frames}</div><div class="g-text">${row('SETUP', g.setup)}${row('MOVE', g.move)}${row('KEY', g.key)}${row('BENEFIT', g.benefit, 'ben')}</div>`;
}

/* ---------- exercises ---------- */
function exercisesView() {
  const counts = {}; doneWorkouts().forEach((w) => w.sets.forEach((s) => { counts[s.exId] = (counts[s.exId] || 0) + 1; }));
  const inPlan = new Set(); Object.values(D.plans).forEach((p) => p.sessions.forEach((s) => Object.values(s.tpl).forEach((bl) => bl.forEach(([, items]) => items.forEach((it) => inPlan.add(it.ex))))));
  const all = Object.values(D.exercises);
  const list = all.filter((e) => !UI.exCat || e.cat === UI.exCat).sort((a, b) => a.name.localeCompare(b.name));
  const catsUsed = Object.keys(CATS).filter((c) => all.some((e) => e.cat === c));
  return `<header class="top"><h1>Exercises</h1><button class="icon-btn solid" aria-label="New exercise" data-act="sheet" data-v="newex">${svg('plus', 22, 2.4)}</button></header>
  <div class="chips scroll mb"><button class="chip-btn${!UI.exCat ? ' on' : ''}" data-act="ex-cat" data-v="">All</button>${catsUsed.map((c) => `<button class="chip-btn${UI.exCat === c ? ' on' : ''}" data-act="ex-cat" data-v="${c}"><i class="dot" style="background:${CATS[c]}"></i>${c}</button>`).join('')}</div>
  <section class="card list-card">${list.map((e) => `<button class="ex-line" data-act="open-ex" data-v="${e.id}"><i class="dot" style="background:${CATS[e.cat]}"></i><span class="ex-name"><b>${esc(e.name)}</b><small>${esc(e.cat)} · ${esc(TYPES[e.type])} · rest ${fmtT(e.rest || 0)}${inPlan.has(e.id) ? ' · in plan' : ''}</small></span>${e.uni ? '<span class="tag">L/R</span>' : ''}<span class="muted sm">${counts[e.id] ? counts[e.id] + ' sets' : ''}</span></button>`).join('')}</section>`;
}

function chartSVG(rows, ex, metric) {
  const W = 340, H = 190, pl = 34, pr = 34, pt = 14, pb = 26;
  const vals = []; rows.forEach((r) => ['L', 'R', 'v'].forEach((k) => { if (r[k] != null) vals.push(r[k]); }));
  if (rows.length < 2 || !vals.length) return '<p class="muted">The graph appears after two sessions with this exercise.</p>';
  let lo = Math.min(...vals), hi = Math.max(...vals); if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
  const pad = (hi - lo) * 0.12; lo = Math.max(0, lo - pad); hi += pad;
  const X = (i) => pl + (rows.length === 1 ? 0 : i * (W - pl - pr) / (rows.length - 1));
  const Y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const line = (k, color, dash) => { const pts = rows.map((r, i) => (r[k] != null ? X(i).toFixed(1) + ',' + Y(r[k]).toFixed(1) : null)).filter(Boolean); return pts.length ? `<polyline fill="none" stroke="${color}" stroke-width="${dash ? 2.5 : 3}" ${dash ? 'stroke-dasharray="6 4"' : ''} stroke-linejoin="round" stroke-linecap="round" points="${pts.join(' ')}"/>` : ''; };
  const last = rows[rows.length - 1];
  const grid = [lo, (lo + hi) / 2, hi].map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="#2A2F38"/><text x="${pl - 6}" y="${(Y(v) + 4).toFixed(1)}" fill="#9AA3B2" font-size="10" text-anchor="end">${Math.round(v)}</text>`).join('');
  const lbl = (k, color) => (last[k] != null ? `<text x="${W - pr + 4}" y="${(Y(last[k]) + 4).toFixed(1)}" fill="${color}" font-size="11" font-weight="700">${k === 'v' ? '' : k + ' '}${Math.round(last[k])}</text>` : '');
  const body = ex.uni ? line('R', '#FF9E4A', true) + line('L', '#5EA2FF', false) + lbl('L', '#8FC0FF') + lbl('R', '#FFB47A') : line('v', '#F2F4F7', false) + lbl('v', '#F2F4F7');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(METRICS[metric].label)} over ${rows.length} sessions">${grid}${body}
    <text x="${pl}" y="${H - 6}" fill="#9AA3B2" font-size="10">${shortDate(rows[0].date)}</text><text x="${W - pr}" y="${H - 6}" fill="#9AA3B2" font-size="10" text-anchor="end">${shortDate(last.date)}</text></svg>
    ${ex.uni ? '<div class="legend"><span><i class="ln L"></i> Left (solid)</span><span><i class="ln R"></i> Right (dashed)</span></div>' : ''}`;
}

function exerciseView() {
  const ex = D.exercises[UI.exId]; if (!ex) { UI.view = 'exercises'; return exercisesView(); }
  const d = exDetail(ex);
  return `<header class="top"><button class="icon-btn" aria-label="Back to exercises" data-act="go" data-v="exercises">${svg('back')}</button><div class="grow"><div class="strong">${esc(ex.name)}</div><span class="muted sm"><i class="dot" style="background:${CATS[ex.cat]}"></i> ${esc(ex.cat)} · ${esc(TYPES[ex.type])}${ex.uni ? ' · L/R' : ''} · rest ${fmtT(ex.rest || 0)}</span></div><button class="btn small outline" data-act="sheet" data-v="editex">Edit</button></header>
  ${d.tabs}<section class="card">${d.body}</section>`;
}
/* tabs + body of an exercise (used by the Exercises screen and by the sheet opened from a session) */
function exDetail(ex) {
  const metrics = METRICS_BY_TYPE[ex.type]; if (!metrics.includes(UI.metric)) UI.metric = metrics[0];
  const ws = doneWorkouts().filter((w) => w.sets.some((s) => s.exId === ex.id)).reverse();
  const tabs = (typeof GUIDES !== 'undefined' && GUIDES[ex.id] ? [['guide', 'Guide']] : []).concat([['history', 'History'], ['graph', 'Graph'], ['records', 'Records']]);
  if (!UI.exTab || (UI.exTab === 'guide' && !GUIDES[ex.id])) UI.exTab = 'history';
  let body = '';
  const fmtSet = (s) => [s.w != null ? (ex.type === 'bwkg' ? (s.w ? 'BW+' + fmtW(s.w) : 'BW') : fmtW(s.w)) : null, s.r != null ? s.r : null, s.t != null ? fmtT(s.t) : null, s.d != null ? s.d + ' m' : null].filter((x) => x != null).join(' × ');
  if (UI.exTab === 'guide') {
    body = guideHTML(ex.id);
  } else if (UI.exTab === 'history') {
    body = ws.map((w) => {
      const ss = setsOf(w, ex.id);
      const col = (side) => ss.filter((s) => s.side === side).map((s) => `<span>${fmtSet(s)}</span>`).join('');
      const itNote = ((w.items || []).find((it) => it.exId === ex.id && it.note) || {}).note; const sNotes = ss.filter((s) => s.note);
      return `<div class="hist"><div class="row between hist-h"><b>${esc(longDate(w.date).toUpperCase())}</b><span class="muted sm">${w.planId ? 'Cycle ' + esc(w.cycle) + ' · wk ' + w.week : 'Free session'}</span></div>${itNote ? `<p class="set-note">${esc(itNote)}</p>` : ''}${sNotes.map((s) => `<p class="set-note sm">${s.side ? s.side + ' · ' : ''}${fmtSet(s)}: ${esc(s.note)}</p>`).join('')}
        ${ex.uni ? `<div class="hist-cols"><div><span class="badge L">L</span>${col('L')}</div><div><span class="badge R">R</span>${col('R')}</div></div>` : `<div class="hist-one">${ss.map((s) => `<span>${fmtSet(s)}</span>`).join('')}</div>`}</div>`;
    }).join('') || '<p class="muted">No session with this exercise yet.</p>';
    if (ex.ref) body += `<div class="note">FitNotes reference · ${esc(ex.ref.date)} · ${esc(ex.ref.text)}</div>`;
  } else if (UI.exTab === 'graph') {
    const rows = series(ex.id, UI.metric);
    let sym = '';
    if (ex.uni) {
      const both = rows.filter((r) => r.L && r.R); const lastB = both[both.length - 1], firstB = both[0];
      if (lastB) sym = `<div class="card inset"><span class="eyebrow">SYMMETRY · L ÷ R</span><div class="row"><span class="big-num">${Math.round(100 * lastB.L / lastB.R)} %</span>${both.length > 1 ? `<span class="soft">was ${Math.round(100 * firstB.L / firstB.R)} % on ${shortDate(firstB.date)}</span>` : ''}</div><span class="muted sm">Above 100 % = left stronger. Based on ${esc(METRICS[UI.metric].label.toLowerCase())}.</span></div>`;
    }
    body = `<div class="seg-ctl">${metrics.map((m) => `<button class="${UI.metric === m ? 'on' : ''}" aria-pressed="${UI.metric === m}" data-act="metric" data-v="${m}">${METRICS[m].label}</button>`).join('')}</div>
      <div class="chart-box">${chartSVG(rows, ex, UI.metric)}</div>${sym}`;
  } else {
    const all = ws.flatMap((w) => setsOf(w, ex.id).map((s) => Object.assign({ date: w.date }, s)));
    const best = (side) => {
      const ss = all.filter((s) => !ex.uni || s.side === side); if (!ss.length) return null;
      const m = primaryMetric(ex); let top = ss[0], tv = -1;
      ss.forEach((s) => { const v = METRICS[m].f([s]); if (v > tv) { tv = v; top = s; } });
      return { s: top, v: tv, m };
    };
    const card = (side, title, cls) => { const b = best(side); return `<div class="rec ${cls}"><span class="eyebrow">${title}</span>${b ? `<span class="big-num">${fmtSet(b.s)}</span><span class="muted sm">${esc(METRICS[b.m].label)} ${fmtMetric(b.v, b.m)} · ${shortDate(b.s.date)}</span>` : '<span class="muted">—</span>'}</div>`; };
    body = ex.uni ? `<div class="rec-grid">${card('L', 'BEST · LEFT', 'L')}${card('R', 'BEST · RIGHT', 'R')}</div>` : `<div class="rec-grid one">${card(null, 'BEST SET', '')}</div>`;
    body += `<p class="muted sm">${all.length} sets logged since you started with Peak.</p>`;
  }
  return { tabs: `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${UI.exTab === k}" class="${UI.exTab === k ? 'on' : ''}" data-act="ex-tab" data-v="${k}">${l}</button>`).join('')}</div>`, body };
}

/* ---------- analysis ---------- */
function periodStart() {
  const pr = progOf(activePlan().id);
  if (UI.anPeriod === 'week') return pr.since;
  if (UI.anPeriod === 'cycle') return pr.csince;
  const d = new Date(); d.setDate(d.getDate() - 29); return iso(d);
}
function analysisView() {
  const from = periodStart();
  const ws = doneWorkouts().filter((w) => w.date >= from);
  const sets = ws.flatMap((w) => w.sets);
  const runs = Object.keys(D.runs).filter((k) => k >= from).length;
  // personal records: sets beating every earlier set of the same exercise and side
  let prs = 0; const bestSoFar = {};
  doneWorkouts().forEach((w) => w.sets.forEach((s) => {
    const ex = D.exercises[s.exId]; if (!ex) return; const m = primaryMetric(ex); const k = s.exId + (s.side || '');
    const v = METRICS[m].f([s]); if (v > 0 && bestSoFar[k] != null && v > bestSoFar[k] && w.date >= from) prs += 1;
    if (bestSoFar[k] == null || v > bestSoFar[k]) bestSoFar[k] = v;
  }));
  const byCat = {}; sets.forEach((s) => { const c = D.exercises[s.exId] && D.exercises[s.exId].cat; if (c) byCat[c] = (byCat[c] || 0) + 1; });
  const maxC = Math.max(1, ...Object.values(byCat));
  const cats = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  const uniIds = [...new Set(sets.map((s) => s.exId))].filter((id) => D.exercises[id] && D.exercises[id].uni);
  const sym = uniIds.map((id) => {
    const ex = D.exercises[id]; const m = primaryMetric(ex);
    const ss = sets.filter((s) => s.exId === id); const L = ss.filter((s) => s.side === 'L'), R = ss.filter((s) => s.side === 'R');
    if (!L.length || !R.length) return null; const l = METRICS[m].f(L), r = METRICS[m].f(R); if (!r) return null;
    return { ex, pct: Math.round(100 * l / r) };
  }).filter(Boolean).sort((a, b) => a.pct - b.pct);
  const periods = [['week', 'Plan week'], ['cycle', 'Cycle'], ['month', '30 days']];
  return `<header class="top"><h1>Analysis</h1></header>
  <div class="seg-ctl mb">${periods.map(([k, l]) => `<button class="${UI.anPeriod === k ? 'on' : ''}" aria-pressed="${UI.anPeriod === k}" data-act="an-period" data-v="${k}">${l}</button>`).join('')}</div>
  <p class="muted sm mb">Since ${longDate(from)}</p>
  <div class="tiles">${[['Sessions', ws.length], ['Sets', sets.length], ['Runs', runs], ['Records', prs]].map(([l, v]) => `<div class="tile"><span class="muted sm">${l}</span><span class="big-num">${v}</span></div>`).join('')}</div>
  ${(() => { const wp = ws.filter((w) => w.pct != null); if (!wp.length) return ''; const full = wp.filter((w) => w.pct >= 100).length; const avg = Math.round(wp.reduce((n, w) => n + w.pct, 0) / wp.length);
    return `<section class="card completion"><span class="eyebrow">SESSION COMPLETION</span><div class="row between"><span><span class="big-num">${full}</span><span class="soft"> of ${wp.length} sessions finished at 100 %</span></span><span class="muted sm">average ${avg} %</span></div><div class="bar"><i style="width:${Math.round(100 * full / wp.length)}%"></i></div></section>`; })()}
  <div class="an-grid">
    <section class="card"><span class="eyebrow">SETS BY CATEGORY</span>${cats.length ? cats.map((c) => `<div class="hbar"><span>${esc(c)}</span><div class="track"><i style="width:${(100 * byCat[c] / maxC).toFixed(0)}%;background:${CATS[c]}"></i></div><b>${byCat[c]}</b></div>`).join('') : '<p class="muted">No set in this period yet.</p>'}</section>
    <section class="card"><div class="row between"><span class="eyebrow">SYMMETRY · L ÷ R</span><span class="muted sm">100 % = even</span></div>
      ${sym.length ? sym.map((x) => { const d = Math.max(-25, Math.min(25, x.pct - 100)); return `<button class="sym" data-act="open-ex" data-v="${x.ex.id}"><span>${esc(x.ex.name)}</span><div class="sym-track"><i class="mid"></i><i class="fill ${d >= 0 ? 'L' : 'R'}" style="${d >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(d) * 2}%"></i></div><b>${x.pct} %</b></button>`; }).join('') + '<p class="muted sm">Blue to the right = left stronger · orange to the left = right stronger.</p>' : '<p class="muted">Log a unilateral exercise on both sides to see this.</p>'}
    </section>
  </div>`;
}

/* ---------- body ---------- */
const TESTS = [
  { k: 'broad', label: 'Broad jump', unit: 'cm' },
  { k: 'hop', label: 'Single-leg hop', unit: 'cm', lr: true },
  { k: 'bound', label: 'Lateral bound', unit: 'cm', lr: true },
  { k: 'shuttle', label: '5-10-5 (start side)', unit: 's', lr: true, lower: true },
  { k: 'row', label: 'DB row max reps @ 20 kg', unit: 'reps', lr: true },
  { k: 'arm', label: 'Arm, relaxed', unit: 'cm', lr: true },
  { k: 'feel', label: 'TT feel', unit: '/10' }
];
function bodyView() {
  const ms = D.body.measures.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastW = ms.filter((x) => x.weight).slice(-1)[0]; const firstW = ms.filter((x) => x.weight)[0];
  const lastWaist = ms.filter((x) => x.waist).slice(-1)[0];
  const goal = D.settings.goalWeight;
  let pct = 0; if (lastW && firstW && firstW.weight > goal) pct = Math.max(0, Math.min(100, 100 * (firstW.weight - lastW.weight) / (firstW.weight - goal)));
  const wpts = ms.filter((x) => x.weight);
  let spark = '';
  if (wpts.length > 1) {
    const vals = wpts.map((x) => x.weight); const lo = Math.min(...vals, goal) - 0.5, hi = Math.max(...vals) + 0.5;
    const pts = wpts.map((x, i) => `${(4 + i * 252 / (wpts.length - 1)).toFixed(1)},${(4 + 52 * (1 - (x.weight - lo) / (hi - lo))).toFixed(1)}`).join(' ');
    const gy = (4 + 52 * (1 - (goal - lo) / (hi - lo))).toFixed(1);
    spark = `<svg class="spark" viewBox="0 0 260 60" role="img" aria-label="Weight trend"><line x1="0" x2="260" y1="${gy}" y2="${gy}" stroke="#3A404B" stroke-dasharray="4 4"/><polyline fill="none" stroke="#F2F4F7" stroke-width="2.5" stroke-linejoin="round" points="${pts}"/></svg>`;
  }
  const tests = D.body.tests.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (UI.testCol >= tests.length) UI.testCol = 0;
  const t = tests[UI.testCol];
  const ratio = (row, def) => { const l = row[def.k + 'L'], r = row[def.k + 'R']; if (!l || !r) return '—'; return Math.round(100 * (def.lower ? r / l : l / r)) + ' %'; };
  const table = t ? `<div class="ttable"><div class="tr th"><span>Test</span><span class="Lc">L</span><span class="Rc">R</span><span>L ÷ R</span></div>
    ${TESTS.map((d) => d.lr ? `<div class="tr"><span>${d.label} <small>${d.unit}</small></span><span>${t.values[d.k + 'L'] != null ? t.values[d.k + 'L'] : '—'}</span><span>${t.values[d.k + 'R'] != null ? t.values[d.k + 'R'] : '—'}</span><b>${ratio(t.values, d)}</b></div>` : `<div class="tr"><span>${d.label} <small>${d.unit}</small></span><span class="span2">${t.values[d.k] != null ? t.values[d.k] : '—'}</span><span></span></div>`).join('')}</div>
    <p class="muted sm">Below 100 % = left behind (for 5-10-5, the faster start side counts).</p>` : '<p class="muted">No test logged yet. Tests come back every last week of a cycle.</p>';
  return `<header class="top"><h1>Body</h1></header>
  <div class="an-grid">
    <div class="col">
      <div class="tiles two">
        <div class="tile"><span class="eyebrow">WEIGHT</span><span class="big-num">${lastW ? fmtW(lastW.weight) : '—'} <small>kg</small></span><div class="bar"><i style="width:${pct}%"></i></div><span class="muted sm">Goal ${fmtW(goal)} kg${lastW ? ' · ' + fmtW(Math.max(0, Math.round((lastW.weight - goal) * 10) / 10)) + ' to go' : ''}</span></div>
        <div class="tile"><span class="eyebrow">WAIST AT NAVEL</span><span class="big-num">${lastWaist ? fmtW(lastWaist.waist) : '—'} <small>cm</small></span><span class="muted sm">${lastWaist ? shortDate(lastWaist.date) : 'Monday, fasted'}</span></div>
      </div>
      ${spark ? `<section class="card">${spark}<span class="muted sm">Weight · dashed line = goal</span></section>` : ''}
      <button class="btn outline wide" data-act="sheet" data-v="measure">${svg('plus', 18, 2)} Log weight / waist</button>
    </div>
    <section class="card">
      <div class="row between"><span class="eyebrow">TESTS</span><button class="btn small primary" data-act="sheet" data-v="tests">Log tests</button></div>
      ${tests.length > 1 ? `<div class="chips scroll">${tests.map((x, i) => `<button class="chip-btn${i === UI.testCol ? ' on' : ''}" data-act="test-col" data-v="${i}">${shortDate(x.date)}</button>`).join('')}</div>` : ''}
      ${table}
    </section>
  </div>`;
}

/* ---------- sheets ---------- */
function extraSheet(name) {
  if (name === 'guide') { const e = D.exercises[UI.guideEx]; return `<h2>${esc(e ? e.name : '')}</h2>${guideHTML(UI.guideEx)}`; }
  if (name === 'measure') {
    return `<h2>Log weight / waist</h2>
      <label class="field">Date<input id="ms-date" type="date" value="${iso()}"></label>
      <label class="field">Weight (kg)<input id="ms-w" type="number" inputmode="decimal" step="0.1" placeholder="e.g. 81.4"></label>
      <label class="field">Waist at navel (cm)<input id="ms-waist" type="number" inputmode="decimal" step="0.5" placeholder="optional"></label>
      <label class="field">Goal weight (kg)<input id="ms-goal" type="number" inputmode="decimal" step="0.5" value="${D.settings.goalWeight}"></label>
      <button class="btn primary big" data-act="measure-save">Save</button>`;
  }
  if (name === 'tests') {
    const inp = (id, ph) => `<input id="ts-${id}" type="number" inputmode="decimal" step="0.01" placeholder="${ph}">`;
    return `<h2>Log tests</h2><p class="muted sm">Fully warmed up, best of 3 attempts. Leave empty what you skip.</p>
      <label class="field">Date<input id="ts-date" type="date" value="${iso()}"></label>
      ${TESTS.map((d) => d.lr ? `<div class="field">${d.label} (${d.unit})<div class="lr-in"><label><span class="badge L">L</span>${inp(d.k + 'L', 'left')}</label><label><span class="badge R">R</span>${inp(d.k + 'R', 'right')}</label></div></div>` : `<label class="field">${d.label} (${d.unit})${inp(d.k, '')}</label>`).join('')}
      <button class="btn primary big" data-act="tests-save">Save tests</button>`;
  }
  if (name === 'editex') {
    const e = D.exercises[UI.exId]; if (!e) return '';
    return `<h2>Edit exercise</h2>
      <label class="field">Name<input id="nx-name" type="text" value="${esc(e.name)}"></label>
      <label class="field">Category<select id="nx-cat">${Object.keys(CATS).map((c) => `<option${c === e.cat ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field">Type<select id="nx-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${k === e.type ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">Equipment<select id="nx-eq">${Object.entries(EQUIP).map(([k, v]) => `<option value="${k}"${k === e.equip ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">Default rest (seconds)<input id="nx-rest" type="number" inputmode="numeric" value="${e.rest || 0}"></label>
      <label class="toggle"><span><b>Unilateral · track L / R</b><small>Left first, right matches</small></span><input type="checkbox" id="nx-uni"${e.uni ? ' checked' : ''}></label>
      <button class="btn primary big" data-act="editex-save">Save changes</button>`;
  }
  return '';
}

function afterRender() { /* hook kept for later screens */ }

/* ---------- actions ---------- */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'cal-month': { const [y, m] = UI.calMonth.split('-').map(Number); const d = new Date(y, m - 1 + Number(b.dataset.d), 1); UI.calMonth = iso(d).slice(0, 7); render(); break; }
    case 'cal-day': UI.calSel = b.dataset.d; if (UI.calSel.slice(0, 7) !== UI.calMonth) UI.calMonth = UI.calSel.slice(0, 7); render(); break;
    case 'cal-run': { toggleRun(UI.calSel || iso()); save(); render(); break; }
    case 'ex-cat': UI.exCat = v || null; render(); break;
    case 'open-ex': UI.exId = v; UI.exTab = (typeof GUIDES !== 'undefined' && GUIDES[v]) ? 'guide' : 'history'; UI.metric = null; go('exercise'); break;
    case 'guide': UI.guideEx = v; UI.sheet = 'guide'; render(); break;
    case 'ex-tab': UI.exTab = v; render(); break;
    case 'metric': UI.metric = v; render(); break;
    case 'an-period': UI.anPeriod = v; render(); break;
    case 'test-col': UI.testCol = Number(v); render(); break;
    case 'measure-save': {
      const num = (id) => { const x = $(id).value; return x === '' ? null : Number(String(x).replace(',', '.')); };
      const date = $('#ms-date').value || iso(); const weight = num('#ms-w'); const waist = num('#ms-waist'); const goal = num('#ms-goal');
      if (goal) { D.settings.goalWeight = goal; D.settings.upd = Date.now(); }
      if (weight || waist) {
        const ex = D.body.measures.find((x) => x.date === date);
        if (ex) { if (weight) ex.weight = weight; if (waist) ex.waist = waist; ex.upd = Date.now(); } else D.body.measures.push({ date, weight, waist, upd: Date.now() });
      }
      save(); UI.sheet = null; toast('Saved'); render(); break;
    }
    case 'tests-save': {
      const values = {}; let any = false;
      TESTS.forEach((d) => (d.lr ? [d.k + 'L', d.k + 'R'] : [d.k]).forEach((k) => { const x = $('#ts-' + k).value; if (x !== '') { values[k] = Number(String(x).replace(',', '.')); any = true; } }));
      if (!any) { toast('Nothing to save'); break; }
      const date = $('#ts-date').value || iso();
      const old = D.body.tests.find((x) => x.date === date);
      if (old) { Object.assign(old.values, values); old.upd = Date.now(); } else D.body.tests.push({ date, values, upd: Date.now() });
      UI.testCol = 0; save(); UI.sheet = null; toast('Tests saved'); if (UI.view !== 'body') go('body'); else render(); break;
    }
    case 'editex-save': {
      const e = D.exercises[UI.exId]; if (!e) break;
      const name = ($('#nx-name').value || '').trim(); if (!name) { toast('Give the exercise a name'); break; }
      Object.assign(e, { upd: Date.now(), name, cat: $('#nx-cat').value, type: $('#nx-type').value, equip: $('#nx-eq').value, uni: $('#nx-uni').checked, rest: Math.max(0, Number($('#nx-rest').value) || 0) });
      save(); UI.sheet = null; toast('Exercise updated'); render(); break;
    }
    default: break;
  }
});
