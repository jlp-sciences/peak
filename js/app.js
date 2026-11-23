/* Peak — app logic (vanilla JS, no build step). */
'use strict';

const APP_VERSION = '1.8.0';
const STORE_KEY = 'peak.v1';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const iso = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fmtW = (w) => (w == null ? '—' : (Number.isInteger(w) ? String(w) : (Math.round(w * 10) / 10).toFixed(1)));
const fmtT = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return m ? m + ':' + String(r).padStart(2, '0') : r + ' s'; };
const fmtClock = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (isoStr) => { const [y, m, d] = isoStr.split('-').map(Number); const dt = new Date(y, m - 1, d); return DAYS[dt.getDay()] + ' ' + d + ' ' + MONTHS[m - 1]; };

const ICON = {
  today: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  exercises: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  analysis: '<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>',
  body: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7M7 10h10M9 21l3-7 3 7"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  more: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  run: '<path d="M2 16c3 0 3-6 6.5-6S12 16 15.5 16 19 10 22 9"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  progress: '<path d="M3 20l6-10 4 6 2-3 6 7zM15 10V4l4 1.5-4 1.5"/>'
};
const svg = (name, size = 22, sw = 1.8) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
const LOGO = (size) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 360 360"><path d="M92 272 L180 112" stroke="#5EA2FF" stroke-width="38" stroke-linecap="round"/><path d="M180 112 L268 272" stroke="#FF9E4A" stroke-width="38" stroke-linecap="round"/><circle cx="180" cy="58" r="22" fill="#F2F4F7"/></svg>`;

/* ---------- storage ---------- */
let D = null;
function seed() {
  const ex = {}; SEED_EXERCISES.forEach((e) => { ex[e.id] = JSON.parse(JSON.stringify(e)); });
  const plans = {}; SEED_PLANS.forEach((p) => { plans[p.id] = JSON.parse(JSON.stringify(p)); });
  const progress = {}; Object.keys(plans).forEach((id) => { progress[id] = { cycle: 0, week: 1, done: {}, since: iso(), csince: iso() }; });
  return { v: 1, created: Date.now(), settings: { activePlan: 'tt-season', sound: true, vibrate: true, goalWeight: 76 }, exercises: ex, plans, progress, workouts: [], runs: {}, body: { measures: [], tests: [] }, active: null };
}
function load() {
  try { D = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { D = null; }
  if (!D || D.v !== 1) { D = seed(); D._seeded = true; save(); return; }
  // add seed exercises / plans that appeared in a newer version, without touching user edits
  SEED_EXERCISES.forEach((e) => { if (!D.exercises[e.id]) D.exercises[e.id] = JSON.parse(JSON.stringify(e)); });
  SEED_PLANS.forEach((p) => { if (!D.plans[p.id] && !(D.settings.removedPlans || []).includes(p.id)) { D.plans[p.id] = JSON.parse(JSON.stringify(p)); D.progress[p.id] = { cycle: 0, week: 1, done: {} }; } });
  if (!D.settings.warmupV2 && typeof addWarmups === 'function') {
    addWarmups(Object.values(D.plans), !!D.settings.warmupV1); D.settings.warmupV2 = true;
    MOB_FIX.forEach((id) => { const e = D.exercises[id], sd = SEED_EXERCISES.find((x) => x.id === id); if (e && sd && !e.upd) Object.assign(e, { name: sd.name, type: sd.type, uni: sd.uni }); });
  }
  if (!D.body) D.body = { measures: [], tests: [] };
  if (!D.planned) D.planned = {};
  if (D.settings.goalWeight == null) D.settings.goalWeight = 76;
  Object.values(D.progress).forEach((pr) => { if (!pr.since) pr.since = iso(new Date(D.created || Date.now())); if (!pr.csince) pr.csince = pr.since; });
}
function toggleRun(k) { if (D.runs[k]) delete D.runs[k]; else D.runs[k] = true; }
function save() {
  const a = D.active && D.workouts.find((w) => w.id === D.active); if (a) a.upd = Date.now();
  if (typeof onLocalChange === 'function') onLocalChange();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { toast('Could not save on this device'); }
}

/* ---------- plan logic ---------- */
const activePlan = () => D.plans[D.settings.activePlan];
const progOf = (planId) => D.progress[planId] || (D.progress[planId] = { cycle: 0, week: 1, done: {}, since: iso(), csince: iso() });
function cycleOf(plan) { const p = progOf(plan.id); return plan.cycles[p.cycle % plan.cycles.length]; }
function isLightWeek(plan) { const p = progOf(plan.id); return plan.lightLast && plan.weeks > 1 && p.week === plan.weeks; }

function tplFor(session, cycleKey) {
  if (session.tpl[cycleKey]) return { blocks: session.tpl[cycleKey], fallback: false };
  const first = Object.keys(session.tpl)[0];
  return { blocks: session.tpl[first] || [], fallback: !!first };
}

/* Expand a template item into a prescription for a given week. */
function prescribe(item, week, light, match) {
  let it = Object.assign({}, item);
  if (light && item.w4) it = Object.assign(it, item.w4);
  if (match && 'match' in item) { if (item.match === null) return null; it = Object.assign(it, item.match); }
  const ex = D.exercises[it.ex];
  if (!ex) return null;
  const p = { ex: it.ex, cue: it.cue || '' };
  if (ex.uni) { p.L = it.L != null ? it.L : (it.s || 3); p.R = it.R != null ? it.R : (it.s || p.L); }
  else { p.sets = it.sw ? (it.sw[week] || it.sw[1]) : (it.s || 3); }
  if (it.r) { p.rmin = it.r[0]; p.rmax = it.r[1]; }
  if (it.t) p.t = it.t;
  if (it.d) p.d = it.d;
  if (it.load != null) p.load = typeof it.load === 'object' ? (it.load[week] != null ? it.load[week] : it.load[1]) : it.load;
  if (it.loadTxt) p.loadTxt = it.loadTxt;
  return p;
}

function buildItems(plan, session, opts) {
  const pr = progOf(plan.id);
  const cyc = cycleOf(plan);
  const { blocks } = tplFor(session, cyc.key);
  const light = isLightWeek(plan);
  const items = [];
  blocks.forEach(([block, list]) => list.forEach((it) => {
    const p = prescribe(it, pr.week, light, opts && opts.match);
    if (p) items.push({ exId: p.ex, block, presc: p });
  }));
  return items;
}

function prescShort(p, ex) { const t = prescText(p, ex); const i = t.indexOf('rest '); return (i <= 0 ? (p ? t : '') : t.slice(0, i - 3)); }
function prescText(p, ex) {
  const parts = [];
  if (p) {
    if (ex.uni && p.L != null) parts.push(p.L + ' L / ' + p.R + ' R');
    else if (p.sets) parts.push(p.sets + ' sets');
    if (p.rmin != null) parts.push((p.rmin === p.rmax ? p.rmin : p.rmin + '–' + p.rmax) + ' reps');
    if (p.t) parts.push(fmtT(p.t));
    if (p.d) parts.push(p.d + ' m');
    if (p.loadTxt) parts.push(p.loadTxt);
    else if (p.load != null && ex.type !== 'bwkg') parts.push(fmtW(p.load) + ' kg');
  }
  if (ex.type === 'bwkg') parts.push('BW');
  if (ex.rest) parts.push('rest ' + fmtT(ex.rest));
  return parts.join(' · ');
}

/* ---------- history & suggestions ---------- */
function setsOf(w, exId) { return w.sets.filter((s) => s.exId === exId); }
function lastWorkoutWith(exId, exceptId) {
  for (let i = D.workouts.length - 1; i >= 0; i--) {
    const w = D.workouts[i];
    if (w.id !== exceptId && w.end && w.sets.some((s) => s.exId === exId)) return w;
  }
  return null;
}
function roundTo(w, equip) {
  const inc = INC[equip] || 1;
  if (equip === 'db') return Math.max(0, Math.round(w / 2) * 2);
  return Math.max(0, Math.round(w / inc) * inc);
}
function suggestion(exId, presc, exceptId) {
  const ex = D.exercises[exId];
  if (!ex || !['wr', 'bwkg', 'wd', 'wt'].includes(ex.type)) return null;
  const inc = INC[ex.equip] || 1;
  if (presc && presc.load != null && ex.type !== 'bwkg') {
    return { w: presc.load, why: presc.loadTxt ? 'Plan: ' + presc.loadTxt : 'Plan load for this week' };
  }
  const rmin = presc && presc.rmin, rmax = presc && presc.rmax;
  const last = lastWorkoutWith(exId, exceptId);
  if (last) {
    let ss = setsOf(last, exId);
    if (ex.uni) ss = ss.filter((s) => s.side === 'L');
    if (!ss.length) return null;
    const w = Math.max(...ss.map((s) => s.w || 0));
    const top = ss.filter((s) => (s.w || 0) === w).map((s) => s.r || 0);
    const side = ex.uni ? 'L ' : '';
    const repsTxt = side + (top.length > 4 && top.every((r) => r === top[0]) ? top[0] + ' (' + top.length + ' sets)' : top.length > 4 ? top.slice(0, 4).join(', ') + '…' : top.join(', '));
    // how the heaviest sets felt: the most frequent answer (ties → the more cautious one)
    const fc = { easy: 0, good: 0, hard: 0 }; ss.filter((s) => (s.w || 0) === w && s.feel).forEach((s) => { fc[s.feel]++; });
    const feel = ['hard', 'good', 'easy'].reduce((b, f) => (fc[f] > (b ? fc[b] : 0) ? f : b), null);
    const zone = rmax != null && top.every((r) => r >= rmax) ? 'top' : rmin != null && top.some((r) => r < rmin) ? 'below' : rmin != null || rmax != null ? 'in' : 'none';
    const TABLE = { top: { easy: 1, good: 1, hard: 0, none: 1 }, in: { easy: 1, good: 0, hard: 0, none: 0 }, below: { easy: 0, good: -1, hard: -1, none: -1 }, none: { easy: 1, good: 0, hard: 0, none: 0 } };
    const step = TABLE[zone][feel || 'none'];
    const nw = roundTo(Math.max(0, w + step * inc), ex.equip);
    const lastTxt = 'Last time ' + (ex.type === 'bwkg' ? (w ? 'BW+' + fmtW(w) : 'BW') : wTxt(ex, w)) + (top.some((r) => r) ? ' × ' + repsTxt : '') + (zone === 'top' ? ' (top of range)' : zone === 'below' ? ' (below range)' : '') + (feel ? ' · felt ' + feel : '');
    const incTxt = dbEach(ex) ? fmtW(inc / 2) + ' kg each' : fmtW(inc) + ' kg';
    const action = step > 0 ? '+' + incTxt : step < 0 ? '−' + incTxt : 'same weight' + ((zone === 'in' || zone === 'none') && feel !== 'hard' ? ', +1 rep' : '');
    return { w: nw, why: lastTxt + ' → ' + action };
  }
  if (ex.ref && ex.ref.w != null) {
    let w = roundTo(ex.ref.w, ex.equip);
    let why = 'From FitNotes: ' + fmtW(ex.ref.w) + ' kg × ' + ex.ref.r + (ex.uni ? ' per side' : '');
    if (rmin != null && ex.ref.r < rmin) { w = roundTo(w - inc, ex.equip); why += ' → a bit lighter'; }
    return { w, why };
  }
  return null;
}

/* ---------- workout state ---------- */
const active = () => (D.active ? D.workouts.find((w) => w.id === D.active) : null);

function startWorkout(planId, sessionId, opts) {
  if (active()) { go('session'); return; }
  const w = { id: uid(), date: (opts && opts.date) || iso(), start: Date.now(), end: null, sets: [], cur: 0, free: !planId };
  if (w.date !== iso()) w.late = true;
  if (planId) {
    const plan = D.plans[planId]; const s = plan.sessions.find((x) => x.id === sessionId); const pr = progOf(planId);
    Object.assign(w, { planId, sessionId, name: s.name + ' — ' + s.title, cycle: cycleOf(plan).key, week: pr.week, light: isLightWeek(plan), match: !!(opts && opts.match), items: buildItems(plan, s, opts) });
  } else {
    Object.assign(w, { name: 'Free session', items: [] });
  }
  D.workouts.push(w); D.active = w.id; save();
  UI.entry = null; UI.lastSet = null;
  go('session');
}

function itemTargets(item) {
  const ex = D.exercises[item.exId]; const p = item.presc || {};
  if (ex.uni) return { L: p.L || 0, R: p.R || 0, total: (p.L || 0) + (p.R || 0) };
  return { total: p.sets || 0 };
}
/* Each exercise of a session holds its rows: planned sets shown in advance, ticked when done.
   A ticked row is also a set in w.sets (same id), which feeds history, graphs and sync. */
function ensureRows(w, item) {
  if (item.rows) return item.rows;
  const ex = D.exercises[item.exId]; const p = item.presc || {};
  const sug = suggestion(item.exId, p, w.id);
  const base = { w: sug ? sug.w : 0, r: p.rmax || p.rmin || 8, t: p.t || (ex.ref && ex.ref.t) || 30, d: p.d || 20 };
  const rows = setsOf(w, item.exId).map((s) => ({ id: s.id, side: s.side, w: s.w, r: s.r, t: s.t, d: s.d, done: true }));
  const mk = (side) => ({ id: uid(), side, w: base.w, r: base.r, t: base.t, d: base.d, done: false });
  const t = itemTargets(item);
  if (ex.uni) {
    const nL = rows.filter((r) => r.side === 'L').length, nR = rows.filter((r) => r.side === 'R').length;
    for (let i = 0; i < Math.max(t.L || 0, t.R || 0); i++) { if (i < (t.L || 0) && i >= nL) rows.push(mk('L')); if (i < (t.R || 0) && i >= nR) rows.push(mk('R')); }
  } else for (let i = rows.length; i < (t.total || 0); i++) rows.push(mk(null));
  if (!rows.length) rows.push(mk(ex.uni ? 'L' : null));
  item.rows = rows; return rows;
}
function itemCounts(w, item) {
  const rows = ensureRows(w, item); const done = rows.filter((r) => r.done);
  return { L: done.filter((r) => r.side === 'L').length, R: done.filter((r) => r.side === 'R').length, n: done.length, total: rows.length };
}
function sessionPct(w) {
  let done = 0, tot = 0;
  w.items.forEach((it) => { if (/\(optional\)$/.test(it.block || '')) return; const r = ensureRows(w, it); tot += r.length; done += r.filter((x) => x.done).length; });
  return { pct: tot ? Math.min(100, Math.round(100 * done / tot)) : 0, done, tot };
}
const isPair = (ex) => !!ex && ((typeof PAIR_IDS !== 'undefined' && PAIR_IDS.has(ex.id)) || ex.pair === true);
const dbEach = (ex) => isPair(ex) && ex.dbm === 'each';
const dispW = (ex, w) => (dbEach(ex) ? Math.round((w || 0) * 5) / 10 : w); // shown value (per dumbbell when chosen)
const wTxt = (ex, w) => (dbEach(ex) ? '2 × ' + fmtW(Math.round((w || 0) * 5) / 10) + ' kg' : fmtW(w) + ' kg');
function ringHTML(c, col, d) {
  const R = 9.5, C = 2 * Math.PI * R, f = c.total ? c.n / c.total : 0;
  return `<span class="ring${d ? ' full' : ''}" aria-label="${c.n} of ${c.total} sets"><svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="${R}" fill="none" stroke="var(--line2)" stroke-width="2.5"/>`
    + (f > 0 ? `<circle cx="13" cy="13" r="${R}" fill="${d ? col : 'none'}" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 13 13)"/>` : '')
    + (d ? '<path d="M8.5 13.4l3 3 6-6.2" fill="none" stroke="#0E1014" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' : '') + '</svg></span>';
}
function itemDone(w, item) { const rows = ensureRows(w, item); return rows.length > 0 && rows.every((r) => r.done); }
function selectedRow(w, item) {
  const rows = ensureRows(w, item);
  return rows.find((r) => r.id === UI.selRow) || rows.find((r) => !r.done) || rows[rows.length - 1];
}
function setFromRow(ex, row) {
  const s = { id: row.id, exId: ex.id, side: ex.uni ? row.side : null, ts: Date.now() };
  if (['wr', 'bwkg', 'wd', 'wt'].includes(ex.type)) s.w = Number(row.w) || 0;
  if (['wr', 'bwkg', 'reps'].includes(ex.type)) s.r = Number(row.r) || 0;
  if (['time', 'wt'].includes(ex.type)) s.t = Number(row.t) || 0;
  if (ex.type === 'wd') s.d = Number(row.d) || 0;
  if (row.note) s.note = row.note;
  return s;
}
function writeSet(w, ex, row) {
  const s = setFromRow(ex, row); const i = w.sets.findIndex((x) => x.id === row.id);
  if (i >= 0) { s.feel = w.sets[i].feel; s.ts = w.sets[i].ts; w.sets[i] = s; } else w.sets.push(s);
}
/* tick / untick a row: ticking logs the set, starts the rest (not between L and R) and prefills what follows */
function toggleRow(w, item, rowId) {
  const ex = D.exercises[item.exId]; const rows = ensureRows(w, item); const row = rows.find((r) => r.id === rowId); if (!row) return;
  if (row.done) {
    row.done = false; w.sets = w.sets.filter((s) => s.id !== row.id); if (UI.lastSet === row.id) UI.lastSet = null; UI.selRow = row.id;
    save(); render(); return;
  }
  row.done = true; writeSet(w, ex, row);
  UI.lastSet = row.id;
  rows.forEach((x) => {
    if (x.done || x.touched) return;
    x.w = row.w; x.t = row.t; x.d = row.d;
    if (!ex.uni || x.side === row.side || (row.side === 'L' && x.side === 'R')) x.r = row.r;
  });
  const next = rows.find((x) => !x.done);
  const goR = ex.uni && row.side === 'L' && next && next.side === 'R';
  if (!goR && ex.rest) startRest(ex.rest, ex.name, ex.id);
  UI.selRow = next ? next.id : null;
  if (!next && typeof nextSheet === 'function') { UI.nextFrom = w.items.indexOf(item); UI.sheet = 'next'; }
  save(); render();
}
function addRow(w, item) {
  const ex = D.exercises[item.exId]; const rows = ensureRows(w, item); const last = rows[rows.length - 1] || {};
  let side = null;
  if (ex.uni) { const nL = rows.filter((r) => r.side === 'L').length, nR = rows.filter((r) => r.side === 'R').length; side = nL > nR ? 'R' : 'L'; }
  const row = { id: uid(), side, w: last.w || 0, r: last.r || 8, t: last.t || 30, d: last.d || 20, done: false };
  rows.push(row); UI.selRow = row.id; save(); render();
}
/* Easy / Good / Hard on the last ticked set moves the weight of the next untouched sets of that side */
function applyFeel(w, item, setId, feel) {
  const ex = D.exercises[item.exId]; const s = w.sets.find((x) => x.id === setId); if (!s) return;
  s.feel = s.feel === feel ? null : feel;
  if (s.side === 'R' || !['wr', 'bwkg', 'wd', 'wt'].includes(ex.type)) { save(); render(); return; } // recorded only: the right side matches the left
  const inc = INC[ex.equip] || 1; const delta = s.feel === 'easy' ? inc : s.feel === 'hard' ? -inc : 0;
  ensureRows(w, item).forEach((x) => { if (!x.done && !x.touched && (!ex.uni || x.side === s.side || x.side === 'R')) x.w = roundTo(Math.max(0, (s.w || 0) + delta), ex.equip); });
  save(); render();
}
function editRow(w, item, key, value, touch = true) {
  const ex = D.exercises[item.exId]; const row = selectedRow(w, item); if (!row) return;
  row[key] = value; if (touch) row.touched = true;
  if (row.done) writeSet(w, ex, row);
  save(); render();
}

function replaceItem(w, i, newId) {
  const it = w.items[i]; const oldEx = D.exercises[it.exId], nx = D.exercises[newId]; if (!it || !nx) return;
  const p = Object.assign({}, it.presc || {}); delete p.load; delete p.loadTxt; p.ex = newId;
  if (nx.uni && !oldEx.uni && p.sets) { p.L = p.sets; p.R = p.sets; delete p.sets; }
  if (!nx.uni && oldEx.uni && p.L != null) { p.sets = p.L; delete p.L; delete p.R; }
  if (['time', 'wt'].includes(nx.type) && !p.t) p.t = 30;
  if (['wr', 'bwkg', 'reps'].includes(nx.type) && p.rmin == null) { p.rmin = 8; p.rmax = 10; }
  if (nx.type === 'wd' && !p.d) p.d = 30;
  if (!['time', 'wt'].includes(nx.type)) delete p.t;
  if (nx.type !== 'wd') delete p.d;
  w.items[i] = { exId: newId, block: it.block, presc: it.presc ? p : null, replaced: it.replaced || it.exId };
  UI.entry = null; UI.lastSet = null; save(); toast(oldEx.name + ' → ' + nx.name);
}

function finishWorkout() {
  const w = active(); if (!w) return;
  if (!w.sets.length) {
    ask('No set logged. Discard this session?', 'Discard', () => { D.workouts = D.workouts.filter((x) => x.id !== w.id); D.active = null; save(); stopRest(); releaseWake(); go('today'); });
    return;
  }
  const sp = sessionPct(w);
  if (sp.done < sp.tot && typeof whySheet === 'function') {
    ask(`Finish with ${sp.done} of ${sp.tot} sets done?`, 'Finish', () => { closeWorkout(w, true); UI.whyW = w.id; UI.whyPick = null; UI.whyMsg = null; UI.whyNote = ''; UI.sheet = 'why'; render(); });
    return;
  }
  ask('Finish and save this session?', 'Finish', () => closeWorkout(w));
}
function closeWorkout(w, quiet) {
  w.end = Date.now(); w.upd = w.end; w.pct = sessionPct(w).pct; D.active = null;
  if (w.planId) {
    const plan = D.plans[w.planId]; const pr = progOf(w.planId);
    if (pr.week === w.week) pr.done[w.sessionId] = true;
    pr.upd = Date.now();
    const req = plan.sessions.filter((s) => s.required);
    if (req.length && req.every((s) => pr.done[s.id])) {
      pr.done = {}; pr.week += 1; pr.since = iso();
      if (pr.week > plan.weeks) { pr.week = 1; pr.cycle = (pr.cycle + 1) % plan.cycles.length; pr.csince = iso(); }
      toast('Week complete — on to ' + cycleOf(plan).key + ' · week ' + pr.week);
    } else toast('Session saved');
  } else toast('Session saved');
  save(); stopRest(); releaseWake();
  if (quiet) { go('today'); return; }
  if (typeof showSummary === 'function') POP.open = true; go('today');
  if (typeof showSummary === 'function') showSummary(w);
}

/* ---------- rest timer ---------- */
const REST = { end: 0, total: 0, label: '', iv: null, exId: null, base: 0 };
let audioCtx = null;
function unlockAudio() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) { /* no audio */ } }
function beep() {
  if (!D.settings.sound || !audioCtx) return;
  try {
    [0, 0.25, 0.5].forEach((t) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18);
      o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch (e) { /* ignore */ }
}
function startRest(sec, label, exId) {
  REST.end = Date.now() + sec * 1000; REST.total = sec; REST.label = label || ''; REST.exId = exId || null; REST.base = sec;
  const db = $('#rest-default'); if (db) db.hidden = true;
  clearInterval(REST.iv); REST.iv = setInterval(tickRest, 250); tickRest();
}
function stopRest() { clearInterval(REST.iv); REST.iv = null; REST.end = 0; const el = $('#rest'); if (el) el.hidden = true; }
function tickRest() {
  const el = $('#rest'); if (!el) return;
  if (!REST.end) { el.hidden = true; return; }
  const left = (REST.end - Date.now()) / 1000;
  if (left <= 0) {
    stopRest();
    if (D.settings.vibrate && navigator.vibrate) navigator.vibrate([300, 150, 300]);
    beep(); toast('Rest over — next set');
    return;
  }
  el.hidden = false;
  $('#rest-time').textContent = fmtClock(left);
  $('#rest-bar').style.width = Math.max(0, Math.min(100, 100 * (1 - left / REST.total))) + '%';
}

/* ---------- wake lock ---------- */
let wakeLock = null;
async function keepAwake() {
  if (!active() || document.visibilityState !== 'visible') return;
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { wakeLock = null; }
}
function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { keepAwake(); tickRest(); } });

/* ---------- UI state ---------- */
function ask(msg, ok, cb) { UI.confirm = { msg, ok, cb }; UI.sheet = 'confirm'; render(); }
const UI = { view: 'today', entry: null, lastSet: null, sheet: null, pq: '', pcat: null, expanded: null, selMode: false, selItems: [] };
function go(view, fromBack) {
  if (!fromBack && view !== UI.view) UI.prev = UI.view;
  UI.view = view; UI.sheet = null; UI.replaceMode = false; UI.pickPlan = null; UI.selMode = false; UI.selItems = []; UI.noteOpen = null; UI.histAdd = false; render(); window.scrollTo(0, 0);
}
/* Phone back button: close the sheet, else previous tab, else Today; from Today the app closes.
   One history entry ("guard") exists whenever we are not on Today with nothing open. */
const NAV = { guarded: false, skip: false };
const atRoot = () => UI.view === 'today' && !UI.sheet;
function syncGuard() {
  try {
    if (!atRoot() && !NAV.guarded) { history.pushState({ peak: 1 }, ''); NAV.guarded = true; }
    else if (atRoot() && NAV.guarded) { NAV.guarded = false; NAV.skip = true; history.back(); }
  } catch (e) { /* history unavailable */ }
}
window.addEventListener('popstate', () => {
  NAV.guarded = false;
  if (NAV.skip) { NAV.skip = false; syncGuard(); return; }
  if (UI.sheet) { UI.sheet = null; UI.replaceMode = false; render(); }
  else if (UI.prev && UI.prev !== UI.view) { const p = UI.prev; UI.prev = null; go(p, true); }
  else if (UI.view !== 'today') { UI.prev = null; go('today', true); }
  syncGuard();
});
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- views ---------- */
const navOn = (k) => UI.view === k || (k === 'exercises' && UI.view === 'exercise') || (k === 'today' && ['account', 'rpreview', 'routines', 'routine-edit'].includes(UI.view)) || (k === 'calendar' && UI.view === 'workout');
function navHTML() {
  const items = [['today', 'Today'], ['calendar', 'Calendar'], ['progress', 'Progress'], ['exercises', 'Exercises'], ['analysis', 'Analysis'], ['body', 'Body']];
  return `<nav class="nav" aria-label="Main"><div class="nav-logo">${LOGO(34)}</div>${items.map(([k, l]) => `<button class="nav-btn${navOn(k) ? ' on' : ''}" data-act="go" data-v="${k}" ${navOn(k) ? 'aria-current="page"' : ''}>${svg(k, 24)}<span>${l}</span></button>`).join('')}</nav>`;
}

function catChips(items) {
  const counts = {};
  items.forEach((it) => { const c = D.exercises[it.exId] && D.exercises[it.exId].cat; if (c) counts[c] = (counts[c] || 0) + 1; });
  return Object.keys(counts).map((c) => `<span class="chip"><i class="dot" style="background:${CATS[c] || '#94A3B8'}"></i>${esc(c)} ${counts[c]}</span>`).join('');
}

function viewToday() {
  const plan = activePlan(); const pr = progOf(plan.id); const cyc = cycleOf(plan); const w = active();
  const segs = Array.from({ length: plan.weeks }, (_, i) => `<i class="seg${i + 1 < pr.week ? ' full' : i + 1 === pr.week ? ' cur' : ''}"></i>`).join('');
  const chips = plan.sessions.map((s) => {
    const done = !!pr.done[s.id];
    return `<div class="sess-chip${done ? ' done' : ''}${s.required ? '' : ' opt'}"><span class="tick">${done ? svg('check', 12, 3.5) : ''}</span>${esc(s.name)}${s.required ? '' : ' · opt.'}</div>`;
  }).join('');
  const next = plan.sessions.find((s) => s.required && !pr.done[s.id]) || plan.sessions.find((s) => !pr.done[s.id]);
  let nextHTML = '';
  if (w) {
    const doneN = w.items.filter((it) => itemDone(w, it)).length;
    nextHTML = `<section class="card hero"><span class="eyebrow">IN PROGRESS</span><h2>${esc(w.name)}</h2><p class="muted">${doneN} of ${w.items.length} exercises · ${w.sets.length} sets</p><button class="btn primary big" data-act="go" data-v="session">Resume session</button></section>`;
  } else if (typeof plannedFor === 'function' && plannedFor(iso()).some((p) => !p.done)) {
    nextHTML = plannedHero(plannedFor(iso()).filter((p) => !p.done));
  } else if (next) {
    const items = buildItems(plan, next, {});
    const lefty = items.filter((it) => D.exercises[it.exId].uni).length;
    const { fallback } = tplFor(next, cyc.key);
    const key = items.find((it) => it.presc.load != null && D.exercises[it.exId].type === 'wr' && !it.presc.loadTxt);
    nextHTML = `<section class="card hero"><span class="eyebrow">UP NEXT</span><h2>${esc(next.name)} — ${esc(next.title)}</h2>
      <p class="muted">~${next.minutes} min · ${items.length} exercises${lefty ? ' · ' + lefty + ' left-first' : ''}</p>
      <div class="chips">${catChips(items)}</div>
      ${key ? `<p class="soft">${esc(D.exercises[key.exId].name)} ${esc(prescShort(key.presc, D.exercises[key.exId]))}</p>` : ''}
      ${fallback ? `<p class="note">Cycle ${cyc.key} isn't written yet — using cycle A exercises.</p>` : ''}
      <button class="btn primary big" data-act="start" data-s="${next.id}">Start ${esc(next.name)}</button>
      <button class="btn ghost" data-act="sheet" data-v="pick">Pick another session of this week</button></section>`;
  }
  const ran = !!D.runs[iso()];
  const recent = D.workouts.filter((x) => x.end).slice(-3).reverse();
  return `<header class="top"><div><span class="muted sm">${longDate(iso())}</span><h1>Today</h1></div><div class="row">${typeof syncChip === 'function' ? syncChip() : ''}${typeof accountButton === 'function' ? accountButton() : ''}<button class="icon-btn" aria-label="More options" data-act="sheet" data-v="more">${svg('more')}</button></div></header>
  ${typeof motdHTML === 'function' ? motdHTML() : ''}
  <div class="today-grid">
    <div class="col">
      <section class="card">
        <div class="row between"><div><span class="eyebrow">ACTIVE PLAN</span><div class="strong">${esc(plan.name)}</div></div><button class="btn small outline" data-act="sheet" data-v="plans">Change</button></div>
        <div class="row between mt"><span class="strong sm2">Cycle ${esc(cyc.key)} · ${esc(cyc.name)}${isLightWeek(plan) ? ' · light + tests' : ''}</span><span class="muted sm">Week ${pr.week} of ${plan.weeks}</span></div>
        <div class="segs" style="grid-template-columns:repeat(${plan.weeks},1fr)">${segs}</div>
        <div class="week-grid">${chips}</div>
      </section>
      ${nextHTML}
    </div>
    <div class="col">
      ${typeof goalsCardHTML === 'function' ? goalsCardHTML() : ''}
      ${typeof climbCardHTML === 'function' ? climbCardHTML(false) : ''}
      <div class="quick">
        <button class="btn outline" data-act="sheet" data-v="routine">${svg('plus', 18, 2)} Free session</button>
        <button class="btn ${ran ? 'filled' : 'outline'}" data-act="run" aria-pressed="${ran}">${svg('run', 18, 2)} ${ran ? 'Ran today ✓' : 'I ran today'}</button>
        ${typeof DAILY_MOBS !== 'undefined' ? (() => { const mob = D.workouts.some((x) => x.mob && x.end && x.date === iso()); return `<button class="btn ${mob ? 'filled' : 'outline'} span2" data-act="daily-mob" aria-pressed="${mob}">${svg('body', 18, 2)} ${mob ? 'Daily mobility done ✓' : 'Daily mobility · 10 min' + (typeof nextMob === 'function' ? ' · ' + nextMob() : '')}</button>`; })() : ''}
      </div>
      ${isLightWeek(plan) ? `<section class="card hero"><span class="eyebrow">WEEK ${plan.weeks} · TESTS</span><p class="soft">Light week: log your tests (jumps, 5-10-5, row max reps, arms, weight).</p><button class="btn primary" data-act="sheet" data-v="tests">Log tests</button></section>` : ''}
      ${recent.length ? `<section class="card"><div class="row between"><span class="eyebrow">RECENT</span><button class="btn small ghost-link" data-act="view-history">View history ›</button></div>${recent.map((x) => `<button class="recent" data-act="hist-open" data-v="${x.id}" data-lpw="${x.id}" aria-label="${esc(x.name)}, ${longDate(x.date)}. Long press to edit or delete."><span>${esc(x.name.split(' — ')[0])}</span><span class="muted sm">${longDate(x.date)} · ${x.sets.length} sets</span></button>`).join('')}<p class="muted sm hint">Long press a session to edit or delete it.</p></section>` : ''}
    </div>
  </div>`;
}

function entryHTML(w, item) {
  const ex = D.exercises[item.exId]; const p = item.presc || {};
  const row = selectedRow(w, item); const inc = INC[ex.equip] || 1;
  const sug = suggestion(item.exId, p, w.id);
  const step = (label, key, val, unit, dec, incr) => `<div class="stepper"><span class="lbl">${label}</span><div class="st-row">
      <button class="st-btn" aria-label="Decrease ${label}" data-act="step" data-k="${key}" data-d="${-dec}">−</button>
      <input class="st-val" inputmode="decimal" aria-label="${label}" data-in="${key}" value="${esc(val)}"><span class="unit">${unit}</span>
      <button class="st-btn" aria-label="Increase ${label}" data-act="step" data-k="${key}" data-d="${incr}">+</button></div></div>`;
  let fields = '';
  if (row) {
    if (['wr', 'wd', 'wt'].includes(ex.type)) fields += step(isPair(ex) ? (dbEach(ex) ? 'Each dumbbell' : 'Both dumbbells') : 'Weight', 'w', fmtW(dispW(ex, row.w)), isPair(ex) ? (dbEach(ex) ? 'kg each' : 'kg total') : 'kg', inc, inc);
    if (ex.type === 'bwkg') fields += step('Added', 'w', fmtW(row.w), row.w ? 'kg' : 'kg · BW', inc, inc);
    if (['wr', 'bwkg', 'reps'].includes(ex.type)) fields += step('Reps', 'r', row.r, 'reps', 1, 1);
    if (['time', 'wt'].includes(ex.type)) { const st = row.t >= 300 ? 60 : 5; fields += step('Time', 't', row.t, 's', st, st); }
    if (ex.type === 'wd') fields += step('Distance', 'd', row.d, 'm', 5, 5);
  }
  const rows = ensureRows(w, item);
  const idx = row ? rows.filter((r) => r.side === row.side).indexOf(row) + 1 : 0;
  const lastL = rows.filter((r) => r.side === 'L' && r.done).slice(-1)[0];
  const sideHint = ex.uni && row ? (row.side === 'R' && lastL ? `Right target: ${lastL.r != null ? lastL.r + ' reps' : fmtT(lastL.t || 0)} — match the left, never more.` : 'Left goes first and sets the target.') : '';
  const fbSet = UI.lastSet && w.sets.find((s) => s.id === UI.lastSet && s.exId === item.exId);
  const fbIdx = fbSet ? rows.filter((r) => r.side === (fbSet.side || null)).findIndex((r) => r.id === fbSet.id) + 1 : 0;
  return `<div class="entry">
    ${fbSet ? `<div class="feel"><span class="muted sm">Set ${fbIdx}${fbSet.side ? ' ' + fbSet.side : ''} felt</span>
      ${['easy', 'good', 'hard'].map((f) => `<button class="feel-btn${fbSet.feel === f ? ' on' : ''}" aria-pressed="${fbSet.feel === f}" data-act="feel" data-v="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>` : ''}
    ${sug ? `<div class="sugg"><div class="row between"><span class="eyebrow">SUGGESTED</span><span class="sugg-w">${ex.type === 'bwkg' ? (sug.w ? 'BW +' + fmtW(sug.w) + ' kg' : 'BW') : wTxt(ex, sug.w)}${p.rmin != null ? ' × ' + (p.rmin === p.rmax ? p.rmin : p.rmin + '–' + p.rmax) : ''}</span></div><span class="soft sm">${esc(sug.why)}</span></div>` : ''}
    ${ex.ref ? `<p class="ref">FitNotes ref · ${esc(ex.ref.date)} · ${esc(ex.ref.text)}</p>` : ''}
    ${row ? `<span class="eyebrow">EDITING SET ${idx}${row.side ? ' · ' + row.side : ''}${row.done ? ' · DONE' : ''}</span>` : ''}
    <div class="fields">${fields}</div>
    ${row && isPair(ex) && ['wr', 'wd', 'wt'].includes(ex.type) ? `<div class="seg-ctl dbm" role="group" aria-label="How the weight is logged">${[['total', 'Total of both'], ['each', 'Each dumbbell']].map(([v, l]) => `<button class="${(ex.dbm || 'total') === v ? 'on' : ''}" aria-pressed="${(ex.dbm || 'total') === v}" data-act="dbm" data-v="${v}">${l}</button>`).join('')}</div>` : ''}
    ${ex.uni && row ? `<div class="sides" role="group" aria-label="Side of this set">
      <button class="side L${row.side === 'L' ? ' on' : ''}" aria-pressed="${row.side === 'L'}" data-act="side" data-v="L">L · Left</button>
      <button class="side R${row.side === 'R' ? ' on' : ''}" aria-pressed="${row.side === 'R'}" data-act="side" data-v="R">R · Right</button></div>
      <p class="soft sm">${sideHint}</p>` : ''}
    <button class="btn outline big" data-act="addrow">${svg('plus', 18, 2)} Add a set</button>
  </div>`;
}

function setRowsHTML(w, item) {
  const ex = D.exercises[item.exId]; const rows = ensureRows(w, item); const sel = selectedRow(w, item);
  const counter = { L: 0, R: 0, x: 0 };
  return rows.map((r) => {
    const k = r.side || 'x'; counter[k] += 1;
    const val = [['wr', 'wd', 'wt'].includes(ex.type) ? wTxt(ex, r.w) : ex.type === 'bwkg' ? (r.w ? 'BW+' + fmtW(r.w) : 'BW') : '', ['wr', 'bwkg', 'reps'].includes(ex.type) ? r.r + ' reps' : '', ['time', 'wt'].includes(ex.type) ? fmtT(r.t) : '', ex.type === 'wd' ? r.d + ' m' : ''].filter(Boolean).join(' × ');
    const s = r.done && w.sets.find((x) => x.id === r.id);
    const label = 'Set ' + counter[k] + (r.side ? ' ' + (r.side === 'L' ? 'left' : 'right') : '');
    return `<div class="set-row${r.done ? ' done' : ''}${sel && sel.id === r.id ? ' sel' : ''}">
      <button class="row-main" data-act="selrow" data-id="${r.id}" aria-label="Edit ${label}"><span class="n">${counter[k]}</span>${r.side ? `<span class="badge ${r.side}">${r.side}</span>` : '<span></span>'}<span class="v">${val}</span>${s && s.feel ? `<span class="muted sm">${s.feel}</span>` : ''}</button>
      <button class="icon-btn sm note-ic${r.note ? ' on' : ''}" aria-label="Note for ${label}" data-act="setnote" data-id="${r.id}">${typeof BUBBLE === 'function' ? BUBBLE(!!r.note) : 'N'}</button>
      <button class="check${r.done ? ' on' : ''}" role="checkbox" aria-checked="${r.done}" aria-label="${label} done" data-act="check" data-id="${r.id}">${svg('check', 18, 3)}</button>
      <button class="icon-btn sm" aria-label="Remove ${label}" data-act="delrow" data-id="${r.id}">${svg('close', 16)}</button></div>`;
  }).join('');
}

function viewSession() {
  const w = active();
  if (!w) return `<header class="top"><h1>Session</h1></header><section class="card"><p class="muted">No session in progress.</p><button class="btn primary" data-act="go" data-v="today">Back to Today</button></section>`;
  if (w.cur >= w.items.length) w.cur = Math.max(0, w.items.length - 1);
  const item = w.items[w.cur];
  const doneN = w.items.filter((it) => itemDone(w, it)).length; const sp = sessionPct(w);
  const mins = Math.floor((Date.now() - w.start) / 60000);
  let detail = '';
  if (item) {
    const ex = D.exercises[item.exId];
    detail = `<section class="card current">
      <div class="row between top-al"><div><span class="eyebrow"><i class="dot" style="background:${CATS[ex.cat]}"></i> ${esc(item.block || ex.cat)}</span><h2>${esc(ex.name)}</h2><p class="soft">${esc(prescText(item.presc, ex))}</p></div><div class="row">${ex.uni ? '<span class="tag">L first</span>' : ''}<button class="icon-btn" aria-label="${esc(ex.name)}: guide, history, graph and records" data-act="exinfo" data-v="${ex.id}"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button></div></div>
      ${item.replaced && D.exercises[item.replaced] ? `<p class="soft sm">Replaces ${esc(D.exercises[item.replaced].name)}</p>` : ''}
      ${item.presc && item.presc.cue && !item.replaced ? `<p class="cue">${esc(item.presc.cue)}</p>` : ''}
      <button class="btn small outline replace-btn" data-act="sheet" data-v="replace">Replace</button>
      ${(() => { const last = typeof lastExerciseNote === 'function' ? lastExerciseNote(item.exId, w.id) : null; return last && !item.note ? `<p class="last-note">Last note (${shortDate(last.date)}): ${esc(last.note)}</p>` : ''; })()}
      <div class="sets">${setRowsHTML(w, item)}</div>
      ${item.note || UI.noteOpen === 'item' ? `<label class="field sm-field">Exercise note<textarea rows="1" data-note="item" placeholder="e.g. seat at 4">${esc(item.note || '')}</textarea></label>` : '<button class="link" data-act="note-open" data-v="item">+ Exercise note</button>'}
      ${entryHTML(w, item)}
    </section>`;
  } else {
    detail = `<section class="card current"><h2>Add a first exercise</h2><p class="muted">Free session: pick exercises as you go.</p><button class="btn primary big" data-act="sheet" data-v="picker">Add exercise</button></section>`;
  }
  let lastBlock = null;
  const list = w.items.map((it, i) => {
    const ex = D.exercises[it.exId]; const d = itemDone(w, it); const c = itemCounts(w, it);
    const head = it.block !== lastBlock ? `<span class="eyebrow blk">${esc((it.block || '').toUpperCase())}</span>` : ''; lastBlock = it.block;
    const selOn = UI.selMode && UI.selItems.includes(i);
    return `${head}<button class="ex-row${i === w.cur && !UI.selMode ? ' on' : ''}${d ? ' done' : ''}${UI.selMode ? ' selecting' : ''}${selOn ? ' picked' : ''}" data-act="${UI.selMode ? 'selex' : 'cur'}" data-i="${i}"${UI.selMode ? ` role="checkbox" aria-checked="${selOn}"` : ''}>
      ${UI.selMode ? `<span class="selbox">${selOn ? svg('check', 14, 3) : ''}</span>` : ringHTML(c, CATS[ex.cat], d)}
      <span class="ex-name"><b>${esc(ex.name)}</b><small>${esc(prescShort(it.presc, ex) || TYPES[ex.type])}</small></span>
      <span class="muted sm">${c.n}/${c.total}</span></button>`;
  }).join('');
  return `<header class="top sess-top"><button class="icon-btn" aria-label="Back to today" data-act="go" data-v="today">${svg('back')}</button>
      <div class="grow"><div class="strong">${esc(w.name.split(' — ')[0])}</div><span class="muted sm">${w.late && typeof shortDate === 'function' ? 'Logged for ' + shortDate(w.date) + ' · ' : ''}${w.planId ? 'Cycle ' + esc(w.cycle) + ' · Week ' + w.week + (w.light ? ' · light' : '') + (w.match ? ' · light version' : '') + ' · ' : ''}${mins} min</span></div>
      <button class="icon-btn" aria-label="Start a rest timer" data-act="sheet" data-v="timer">${svg('timer', 21, 2)}</button>
      <button class="btn small outline" data-act="finish">Finish</button></header>
    <div class="progress"><div class="row between muted sm"><span><b class="pct">${sp.pct} %</b> · ${sp.done} of ${sp.tot} sets</span><span>${doneN}/${w.items.length} exercises</span></div><div class="bar"><i style="width:${sp.pct}%"></i></div>${w.note || UI.noteOpen === 'session' ? `<textarea class="sess-note" rows="1" data-note="session" placeholder="Session note (optional)">${esc(w.note || '')}</textarea>` : '<button class="link" data-act="note-open" data-v="session">+ Session note</button>'}</div>
    <div class="sess-grid">
      <div class="sess-detail">${detail}</div>
      <aside class="sess-list">${UI.selMode ? '' : '<p class="muted sm hint">Long-press an exercise to select and delete.</p>'}${list}${UI.selMode ? '<div class="sel-spacer"></div>' : `<button class="btn outline add-ex" data-act="sheet" data-v="picker">${svg('plus', 18, 2)} Add exercise</button>`}</aside>
    </div>
    ${UI.selMode ? `<div class="selbar" role="toolbar" aria-label="Selected exercises"><span><b>${UI.selItems.length}</b> selected</span><button class="btn small outline" data-act="sel-cancel">Cancel</button><button class="btn small danger-fill" data-act="sel-delete"${UI.selItems.length ? '' : ' aria-disabled="true"'}>Delete${UI.selItems.length ? ' (' + UI.selItems.length + ')' : ''}</button></div>` : ''}`;
}

/* small "i" that reveals a one-line explanation (pure DOM toggle: never re-renders a form) */
const INFO = { light: 'For example, the day before a competition.' };
const infoI = (k) => `<button type="button" class="info-i" aria-label="What is this?" aria-expanded="false" data-act="info" data-v="${k}">i</button>`;
const infoPop = (k) => `<p class="info-pop" data-info="${k}" hidden>${esc(INFO[k])}</p>`;

/* ---------- long-press selection of exercises in a session ---------- */
const LP = { t: null, x: 0, y: 0, fired: 0 };
document.addEventListener('pointerdown', (ev) => {
  clearTimeout(LP.t);
  const rw = ev.target.closest && ev.target.closest('[data-lpw]');
  if (rw && UI.view === 'today') {
    LP.x = ev.clientX; LP.y = ev.clientY;
    LP.t = setTimeout(() => { UI.wId = rw.dataset.lpw; UI.sheet = 'w-menu'; LP.fired = Date.now(); try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* no vibration */ } render(); }, 480);
    return;
  }
  const row = ev.target.closest && ev.target.closest('.ex-row');
  if (!row || UI.view !== 'session' || UI.selMode) return;
  LP.x = ev.clientX; LP.y = ev.clientY;
  LP.t = setTimeout(() => {
    UI.selMode = true; UI.selItems = [Number(row.dataset.i)]; LP.fired = Date.now();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* no vibration */ }
    render();
  }, 480);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, () => clearTimeout(LP.t)));
document.addEventListener('pointermove', (ev) => { if (Math.abs(ev.clientX - LP.x) + Math.abs(ev.clientY - LP.y) > 12) clearTimeout(LP.t); });
document.addEventListener('contextmenu', (ev) => { if (!ev.target.closest('input, textarea, select, [contenteditable]')) ev.preventDefault(); });
function deleteSelected(w) {
  const idx = UI.selItems.slice().sort((a, b) => a - b); if (!idx.length) return;
  const items = idx.map((i) => w.items[i]).filter(Boolean);
  const ids = new Set(); items.forEach((it) => ensureRows(w, it).forEach((r) => { if (r.done) ids.add(r.id); }));
  const doIt = () => {
    document.querySelectorAll('.ex-row.picked').forEach((n) => n.classList.add('removing'));
    setTimeout(() => {
      const curItem = w.items[w.cur];
      w.items = w.items.filter((_, i) => !idx.includes(i)); w.sets = w.sets.filter((s) => !ids.has(s.id));
      const k = w.items.indexOf(curItem); w.cur = k >= 0 ? k : Math.max(0, w.items.findIndex((it) => !itemDone(w, it)));
      UI.selMode = false; UI.selItems = []; UI.selRow = null; UI.lastSet = null; UI.sheet = null;
      save(); render(); toast(items.length + ' exercise' + (items.length > 1 ? 's' : '') + ' removed');
    }, 260);
  };
  if (ids.size) ask('Delete ' + items.length + ' exercise' + (items.length > 1 ? 's' : '') + ' and ' + ids.size + ' logged set' + (ids.size > 1 ? 's' : '') + '?', 'Delete', doIt); else doIt();
}

/* ---------- sheets ---------- */
function sheetHTML() {
  if (!UI.sheet) return '';
  let body = '';
  const plan = activePlan(); const pr = progOf(plan.id);
  if (UI.sheet === 'confirm' && UI.confirm) {
    body = `<h2>${esc(UI.confirm.msg)}</h2><div class="quick"><button class="btn outline" data-act="close">Cancel</button><button class="btn primary" data-act="confirm-ok">${esc(UI.confirm.ok)}</button></div>`;
  } else if (UI.sheet === 'replace') {
    const w = active(); const it = w && w.items[w.cur]; const ex = it && D.exercises[it.exId];
    const orig = it && it.replaced ? it.replaced : it && it.exId;
    const alts = ((typeof ALTS !== 'undefined' && ALTS[orig]) || []).filter(([id]) => D.exercises[id] && id !== (it && it.exId));
    if (it && it.replaced && D.exercises[it.replaced]) alts.unshift([it.replaced, 'back to the plan']);
    body = `<h2>Replace ${esc(ex ? ex.name : '')}</h2><p class="muted sm">Machine taken or missing equipment? Same movement, other equipment. Sets and reps stay; the plan itself is not changed.</p>
      ${alts.map(([id, why]) => { const e = D.exercises[id]; return `<button class="list-btn" data-act="replace-with" data-v="${id}"><i class="dot" style="background:${CATS[e.cat]}"></i><span><b>${esc(e.name)}</b><small>${esc(why)} · ${esc(TYPES[e.type])}${e.uni ? ' · L/R' : ''}</small></span></button>`; }).join('') || '<p class="muted">No suggestion for this one.</p>'}
      <button class="btn outline" data-act="replace-other">Other exercise…</button>`;
  } else if (UI.sheet === 'pick') {
    body = `<h2>Sessions of this week</h2>${plan.sessions.map((s) => `<button class="list-btn" data-act="start" data-s="${s.id}"><span><b>${esc(s.name)} — ${esc(s.title)}</b><small>${s.required ? 'Required' : 'Optional'}${pr.done[s.id] ? ' · done ✓' : ''}</small></span></button>`).join('')}`;
  } else if (UI.sheet === 'match') {
    const s = (D.plans[UI.pendingPlan] || plan).sessions.find((x) => x.id === UI.pending);
    body = `<h2>${esc(s.name)} — ${esc(s.title)}</h2><label class="toggle"><span><b>Light version ${infoI('light')}</b><small>Fewer sets, some exercises left out</small></span><input type="checkbox" id="match-cb"></label>${infoPop('light')}
      <button class="btn primary big" data-act="start-confirm">Start</button>`;
  } else if (UI.sheet === 'plans') {
    body = `<h2>Plans</h2>${Object.values(D.plans).map((p) => { const ppr = progOf(p.id); const on = p.id === plan.id; return `<button class="list-btn${on ? ' on' : ''}" data-act="setplan" data-v="${p.id}"><span><b>${esc(p.name)}</b><small>${p.sessions.filter((s) => s.required).length} required${p.sessions.some((s) => !s.required) ? ' + optional' : ''} · now cycle ${esc(cycleOf(p).key)}, week ${ppr.week}</small></span>${on ? '<span class="tag">ACTIVE</span>' : ''}</button>`; }).join('')}
      <div class="row wrap">${Object.values(D.plans).map((p) => `<button class="btn small outline" data-act="plan-edit" data-v="${p.id}">${svg('edit', 16)} Edit ${esc(p.name)}</button>`).join('')}</div>
      <button class="btn outline" data-act="plan-new">${svg('plus', 18, 2)} New plan</button>
      <p class="muted sm">Each plan keeps its place when you switch.</p>`;
  } else if (UI.sheet === 'more') {
    body = `<h2>Settings & data</h2>
      ${typeof routinesView === 'function' ? `<button class="list-btn" data-act="go" data-v="routines"><span><b>Routines</b><small>Change the routines for good</small></span>${svg('chev', 18, 2)}</button>` : ''}
      ${typeof avatarHTML === 'function' ? `<button class="list-btn acct-row" data-act="go" data-v="account">${avatarHTML(36)}<span><b>Account</b><small>${D.sync && D.sync.profile ? esc(D.sync.profile.email) : 'Sign in with Google'}</small></span></button>` : ''}
      <label class="toggle"><span><b>Sound at end of rest</b></span><input type="checkbox" data-set="sound" ${D.settings.sound ? 'checked' : ''}></label>
      <label class="toggle"><span><b>Vibrate at end of rest</b></span><input type="checkbox" data-set="vibrate" ${D.settings.vibrate ? 'checked' : ''}></label>
      ${typeof syncSettings === 'function' ? syncSettings() : ''}
      <button class="list-btn" data-act="export"><span><b>Export my data</b><small>Download a JSON backup</small></span></button>
      <label class="list-btn"><span><b>Import a backup</b><small>Replaces the data on this device</small></span><input type="file" accept="application/json" id="import-file" hidden></label>
      <button class="list-btn danger" data-act="reset"><span><b>Reset this device</b><small>Deletes every session stored here</small></span></button>
      <p class="muted sm">Peak ${APP_VERSION}</p>`;
  } else if (UI.sheet === 'picker') {
    const q = UI.pq.trim().toLowerCase();
    const list = Object.values(D.exercises).filter((e) => (q ? e.name.toLowerCase().includes(q) : e.cat === UI.pcat)).sort((a, b) => a.name.localeCompare(b.name));
    const counts = {}; Object.values(D.exercises).forEach((e) => { counts[e.cat] = (counts[e.cat] || 0) + 1; });
    const showCats = !q && !UI.pcat;
    body = `<h2>${UI.replaceMode ? 'Replace with…' : UI.pickPlan ? (UI.pickPlan.kind === 'change' ? 'Change to…' : 'Add to the plan') : 'Add exercise'}</h2><input class="search" type="search" placeholder="Search exercises" aria-label="Search exercises" data-in="pq" value="${esc(UI.pq)}">
      ${showCats ? `<div class="cat-grid">${Object.keys(CATS).filter((c) => counts[c]).map((c) => `<button class="cat-tile" style="--c:${CATS[c]}" data-act="pcat" data-v="${c}"><i class="dot" style="background:${CATS[c]}"></i><span><b>${c}</b><small>${counts[c]} exercise${counts[c] > 1 ? 's' : ''}</small></span></button>`).join('')}</div>` : `${!q ? `<button class="chip-btn back-cats" data-act="pcat" data-v="">${svg('back', 16)} All categories</button><span class="eyebrow"><i class="dot" style="background:${CATS[UI.pcat]}"></i> ${esc(UI.pcat)}</span>` : `<span class="eyebrow">${list.length} RESULT${list.length === 1 ? '' : 'S'}</span>`}
      <div class="pick-list">${list.map((e) => `<button class="list-btn" data-act="${UI.pickPlan ? 'pe-pick' : 'addex'}" data-v="${e.id}"><i class="dot" style="background:${CATS[e.cat]}"></i><span><b>${esc(e.name)}</b><small>${esc(TYPES[e.type])}${e.uni ? ' · L/R' : ''}</small></span></button>`).join('') || '<p class="muted">No match.</p>'}</div>`}
      <button class="btn outline" data-act="sheet" data-v="newex">${svg('plus', 18, 2)} New exercise</button>`;
  } else if (UI.sheet === 'newex') {
    body = `<h2>New exercise</h2>
      <label class="field">Name<input id="nx-name" type="text" placeholder="e.g. Copenhagen plank" data-dup=""></label><p class="dup-warn" id="nx-dup" hidden></p>
      <label class="field">Category<select id="nx-cat">${Object.keys(CATS).map((c) => `<option>${c}</option>`).join('')}</select></label>
      <label class="field">Type<select id="nx-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="field">Equipment<select id="nx-eq">${Object.entries(EQUIP).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="field">Default rest (seconds)<input id="nx-rest" type="number" inputmode="numeric" value="90"></label>
      <label class="toggle"><span><b>Unilateral · track L / R</b><small>Left first, right matches</small></span><input type="checkbox" id="nx-uni"></label>
      <label class="field">Description <small class="muted">(optional)</small><textarea id="nx-desc" rows="3" placeholder="How you do it, cues, machine settings…"></textarea></label>
      <button class="btn primary big" data-act="newex-save">Save exercise</button>`;
  } else if (UI.sheet === 'exinfo' && typeof exDetail === 'function' && D.exercises[UI.exId]) {
    const ex = D.exercises[UI.exId]; const d = exDetail(ex);
    body = `<h2>${esc(ex.name)}</h2><p class="muted sm"><i class="dot" style="background:${CATS[ex.cat]}"></i> ${esc(ex.cat)} · ${esc(TYPES[ex.type])}${ex.uni ? ' · L/R' : ''}</p>${d.tabs}<div class="exinfo-body">${d.body}</div>`;
  } else if (typeof extraSheet === 'function') {
    body = extraSheet(UI.sheet);
  }
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true"><button class="icon-btn sheet-x" aria-label="Close" data-act="close">${svg('close')}</button>${body}</div>`;
}

/* ---------- render ---------- */
function render() {
  const views = {
    today: viewToday, session: viewSession, calendar: calendarView, exercises: exercisesView,
    exercise: exerciseView, analysis: analysisView, body: bodyView
  };
  if (typeof planEditView === 'function') views.planedit = planEditView;
  if (typeof EXTRA_VIEWS !== 'undefined') Object.assign(views, EXTRA_VIEWS);
  const app = $('#app');
  app.className = 'app view-' + UI.view;
  $('#main').innerHTML = (views[UI.view] || viewToday)();
  $('#navwrap').innerHTML = (UI.view === 'session' || UI.view === 'planedit') ? '' : navHTML();
  if (typeof afterRender === 'function') afterRender();
  $('#sheetwrap').innerHTML = sheetHTML();
  if (typeof awardsAfterRender === 'function') { try { awardsAfterRender(); } catch (e) { console.error(e); } }
  const f = $('#import-file'); if (f) f.addEventListener('change', importFile);
  if (UI.view === 'session') keepAwake();
  tickRest();
  syncGuard();
}

/* ---------- events ---------- */
document.addEventListener('click', (ev) => {
  if (LP.fired && Date.now() - LP.fired < 700) { LP.fired = 0; ev.preventDefault(); ev.stopPropagation(); return; }
  unlockAudio();
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act; const w = active();
  switch (a) {
    case 'go': go(b.dataset.v); break;
    case 'sheet': UI.sheet = b.dataset.v; if (b.dataset.v === 'picker') { UI.pq = ''; UI.pcat = null; } render(); break;
    case 'close': if (UI.pickPlan && UI.pe) { const k = UI.pickPlan.kind; UI.pickPlan = null; UI.sheet = k === 'change' ? 'pe-item' : null; render(); break; } UI.sheet = null; UI.replaceMode = false; render(); break;
    case 'start': {
      const pid = b.dataset.plan || activePlan().id; const date = b.dataset.date || null;
      const s = D.plans[pid] && D.plans[pid].sessions.find((x) => x.id === b.dataset.s);
      if (s && s.matchable) { UI.pending = s.id; UI.pendingPlan = pid; UI.pendingDate = date; UI.sheet = 'match'; render(); }
      else startWorkout(pid, b.dataset.s, { date });
      break;
    }
    case 'start-confirm': { const m = $('#match-cb'); startWorkout(UI.pendingPlan || activePlan().id, UI.pending, { match: !!(m && m.checked), date: UI.pendingDate || null }); UI.pendingPlan = null; UI.pendingDate = null; break; }
    case 'free': startWorkout(null, null, { date: b.dataset.date || null }); break;
    case 'daily-mob': if (active()) go('session'); else { UI.sheet = 'mob'; render(); } break;
    case 'run': { toggleRun(iso()); save(); render(); break; }
    case 'setplan': D.settings.activePlan = b.dataset.v; D.settings.upd = Date.now(); save(); UI.sheet = null; render(); break;
    case 'exinfo': UI.exId = b.dataset.v; UI.exTab = hasGuide(UI.exId) ? 'guide' : 'history'; UI.sheet = 'exinfo'; render(); break;
    case 'info': { ev.preventDefault(); const pop = document.querySelector(`.info-pop[data-info="${b.dataset.v}"]`); if (pop) { pop.hidden = !pop.hidden; b.setAttribute('aria-expanded', String(!pop.hidden)); } break; }
    case 'selex': { const i = Number(b.dataset.i); UI.selItems = UI.selItems.includes(i) ? UI.selItems.filter((x) => x !== i) : UI.selItems.concat(i); render(); break; }
    case 'sel-cancel': UI.selMode = false; UI.selItems = []; render(); break;
    case 'sel-delete': if (w && UI.selItems.length) deleteSelected(w); break;
    case 'cur': if (w) { UI.noteOpen = null; w.cur = Number(b.dataset.i); UI.selRow = null; UI.lastSet = null; save(); render(); window.scrollTo(0, 0); } break;
    case 'selrow': { UI.selRow = b.dataset.id; const fs = w && w.sets.find((x) => x.id === b.dataset.id); if (fs) UI.lastSet = fs.id; render(); break; }
    case 'check': if (w) toggleRow(w, w.items[w.cur], b.dataset.id); break;
    case 'addrow': if (w) addRow(w, w.items[w.cur]); break;
    case 'delrow': if (w) {
      const item = w.items[w.cur]; const rows = ensureRows(w, item); const id = b.dataset.id; const r = rows.find((x) => x.id === id);
      const drop = () => { item.rows = rows.filter((x) => x.id !== id); w.sets = w.sets.filter((s) => s.id !== id); if (UI.selRow === id) UI.selRow = null; if (UI.lastSet === id) UI.lastSet = null; save(); UI.sheet = null; render(); };
      if (r && r.done) ask('Delete this set?', 'Delete', drop); else drop();
    } break;
    case 'dbm': if (w) { const ex = D.exercises[w.items[w.cur].exId]; ex.dbm = b.dataset.v === 'each' ? 'each' : 'total'; ex.upd = Date.now(); save(); render(); } break;
    case 'step': if (w) {
      const item = w.items[w.cur]; const ex = D.exercises[item.exId]; const row = selectedRow(w, item); const k = b.dataset.k;
      let v = (Number(row[k]) || 0) + Number(b.dataset.d) * (k === 'w' && dbEach(ex) ? 2 : 1);
      if (k === 'w') v = dbEach(ex) ? Math.max(0, Math.round(v * 2) / 2) : roundTo(Math.max(0, v), ex.equip);
      editRow(w, item, k, Math.max(0, Math.round(v * 10) / 10));
    } break;
    case 'side': if (w) { const item = w.items[w.cur]; const row = selectedRow(w, item); if (row) { row.side = b.dataset.v; row.touched = true; if (row.done) writeSet(w, D.exercises[item.exId], row); save(); render(); } } break;
    case 'feel': if (w && UI.lastSet) applyFeel(w, w.items[w.cur], UI.lastSet, b.dataset.v); break;
    case 'confirm-ok': { const c = UI.confirm; UI.confirm = null; UI.sheet = null; if (c && c.cb) c.cb(); else render(); break; }
    case 'finish': finishWorkout(); break;
    case 'rest-skip': stopRest(); break;
    case 'rest-add': {
      REST.end += Number(b.dataset.d) * 1000; REST.base += Number(b.dataset.d); REST.total = Math.max(REST.total, (REST.end - Date.now()) / 1000); tickRest();
      const db = $('#rest-default'); if (db && REST.exId && REST.base > 0 && REST.base !== D.exercises[REST.exId].rest) { db.hidden = false; db.textContent = 'Default ' + fmtT(REST.base); }
      break;
    }
    case 'rest-default': if (REST.exId && D.exercises[REST.exId]) { D.exercises[REST.exId].rest = REST.base; D.exercises[REST.exId].upd = Date.now(); save(); b.hidden = true; toast('New default rest for ' + D.exercises[REST.exId].name + ': ' + fmtT(REST.base)); } break;
    case 'pcat': UI.pcat = b.dataset.v || null; render(); break;
    case 'replace-with': if (w) { replaceItem(w, w.cur, b.dataset.v); } UI.sheet = null; render(); break;
    case 'replace-other': UI.replaceMode = true; UI.pq = ''; UI.pcat = null; UI.sheet = 'picker'; render(); break;
    case 'addex': if (w && UI.replaceMode) { UI.replaceMode = false; replaceItem(w, w.cur, b.dataset.v); UI.sheet = null; render(); break; }
      if (w) { w.items.push({ exId: b.dataset.v, block: 'Added', presc: null }); w.cur = w.items.length - 1; UI.entry = null; UI.lastSet = null; save(); } UI.sheet = null; render(); break;
    case 'ex-add-today': {
      const id = b.dataset.v; if (!D.exercises[id]) break;
      const fresh = !active(); if (fresh) startWorkout(null, null);
      const cw = active(); cw.items.push({ exId: id, block: 'Added', presc: null }); cw.cur = cw.items.length - 1; UI.entry = null; UI.lastSet = null;
      save(); toast(D.exercises[id].name + (fresh ? ' — free session started' : ' added')); go('session'); break;
    }
    case 'newex-save': {
      const name = ($('#nx-name').value || '').trim(); if (!name) { toast('Give the exercise a name'); break; }
      const dup = dupName(name); if (dup) { toast('“' + dup.name + '” already exists'); break; }
      const desc = ($('#nx-desc').value || '').trim();
      const e = { id: 'x' + uid(), custom: true, name, cat: $('#nx-cat').value, type: $('#nx-type').value, equip: $('#nx-eq').value, uni: $('#nx-uni').checked, rest: Math.max(0, Number($('#nx-rest').value) || 0) };
      if (desc) e.desc = desc; e.upd = Date.now(); D.exercises[e.id] = e;
      if (UI.pickPlan && typeof pePicked === 'function') { save(); toast(name + ' created'); pePicked(e.id); break; }
      if (w) { w.items.push({ exId: e.id, block: 'Added', presc: null }); w.cur = w.items.length - 1; UI.entry = null; }
      save(); UI.sheet = null; toast(name + ' created'); render(); break;
    }
    case 'export': {
      const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = 'peak-backup-' + iso() + '.json'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000); break;
    }
    case 'reset': ask('Delete every session stored on this device?', 'Delete all', () => { D = seed(); save(); stopRest(); go('today'); }); break;
    default: break;
  }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.dataset && t.dataset.in && t.dataset.in !== 'pq' && t.dataset.in !== 'exq') { const w = active(); if (w && w.items[w.cur]) { const v = Math.max(0, Number(String(t.value).replace(',', '.')) || 0); editRow(w, w.items[w.cur], t.dataset.in, t.dataset.in === 'w' && dbEach(D.exercises[w.items[w.cur].exId]) ? v * 2 : v); } }
  if (t.dataset && t.dataset.set) { D.settings[t.dataset.set] = t.checked; save(); }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'nx-name' && t.dataset.dup != null) {
    const d = dupName(t.value, t.dataset.dup || null), w = $('#nx-dup');
    if (w) { w.hidden = !d; w.textContent = d ? '“' + d.name + '” already exists in your list.' : ''; }
  }
  if (t.dataset && (t.dataset.in === 'pq' || t.dataset.in === 'exq')) {
    const k = t.dataset.in; UI[k] = t.value; const pos = t.selectionStart; render();
    const n = $(`[data-in="${k}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
  }
});
function importFile(ev) {
  const file = ev.target.files && ev.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let x = null;
    try { x = JSON.parse(r.result); } catch (e) { x = null; }
    if (!x || x.v !== 1 || !x.exercises) { toast('This file is not a Peak backup'); return; }
    ask('Replace the data on this device with this backup?', 'Replace', () => { D = x; save(); go('today'); toast('Backup imported'); });
  };
  r.readAsText(file);
}

/* ---------- boot ---------- */
function boot() {
  load();
  if (active()) UI.view = 'session';
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.host)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache unavailable */ });
  }
}
if (typeof window !== 'undefined' && !window.__PEAK_NO_BOOT__) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
}
