/* Peak — app logic (vanilla JS, no build step). */
'use strict';

const APP_VERSION = '0.4.1';
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
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'
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
  SEED_PLANS.forEach((p) => { if (!D.plans[p.id]) { D.plans[p.id] = JSON.parse(JSON.stringify(p)); D.progress[p.id] = { cycle: 0, week: 1, done: {} }; } });
  if (!D.body) D.body = { measures: [], tests: [] };
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
    const repsTxt = side + top.join(', ');
    if (rmax != null && top.every((r) => r >= rmax)) return { w: roundTo(w + inc, ex.equip), why: 'Top of range last time (' + repsTxt + ') → +' + fmtW(inc) + ' kg' };
    if (rmin != null && top.some((r) => r < rmin)) return { w: roundTo(Math.max(0, w - inc), ex.equip), why: 'Below range last time (' + repsTxt + ') → −' + fmtW(inc) + ' kg' };
    return { w, why: 'In range last time (' + repsTxt + ') → same weight, +1 rep' };
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
  const w = { id: uid(), date: iso(), start: Date.now(), end: null, sets: [], cur: 0, free: !planId };
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
function itemCounts(w, item) {
  const ss = setsOf(w, item.exId);
  return { L: ss.filter((s) => s.side === 'L').length, R: ss.filter((s) => s.side === 'R').length, n: ss.length };
}
function itemDone(w, item) {
  const t = itemTargets(item), c = itemCounts(w, item);
  if (!t.total) return false;
  const ex = D.exercises[item.exId];
  return ex.uni ? (c.L >= t.L && c.R >= t.R) : c.n >= t.total;
}
function nextSide(w, item) {
  const t = itemTargets(item), c = itemCounts(w, item);
  if (c.R < c.L && (!t.total || c.R < t.R)) return 'R';
  if (t.total && c.L >= t.L && c.R < t.R) return 'R';
  return 'L';
}

/* default values for the entry panel */
function freshEntry(w, item) {
  const ex = D.exercises[item.exId]; const p = item.presc || {};
  const ss = setsOf(w, item.exId);
  const side = ex.uni ? nextSide(w, item) : null;
  const sug = suggestion(item.exId, p, w.id);
  const e = { exId: item.exId, side, w: 0, r: p.rmax || p.rmin || 8, t: p.t || 30, d: p.d || 20 };
  if (ex.type === 'time' && ex.ref && ex.ref.t && !p.t) e.t = ex.ref.t;
  if (sug) e.w = sug.w;
  const lastL = ss.filter((s) => s.side === 'L').slice(-1)[0];
  const last = ss.slice(-1)[0];
  if (side === 'R' && lastL) { e.w = lastL.w; e.r = lastL.r; e.t = lastL.t; e.d = lastL.d; }
  else if (last) {
    const inc = INC[ex.equip] || 1;
    const prev = ex.uni ? lastL || last : last;
    e.w = prev.w; e.r = prev.r; e.t = prev.t || e.t; e.d = prev.d || e.d;
    if (prev.feel === 'easy') e.w = roundTo((prev.w || 0) + inc, ex.equip);
    if (prev.feel === 'hard') e.w = roundTo(Math.max(0, (prev.w || 0) - inc), ex.equip);
  }
  return e;
}

function saveSet() {
  const w = active(); if (!w) return;
  const item = w.items[w.cur]; if (!item) return;
  const ex = D.exercises[item.exId]; const e = UI.entry;
  const s = { id: uid(), exId: item.exId, side: ex.uni ? e.side : null, ts: Date.now() };
  if (['wr', 'bwkg', 'wd', 'wt'].includes(ex.type)) s.w = Number(e.w) || 0;
  if (['wr', 'bwkg', 'reps'].includes(ex.type)) s.r = Number(e.r) || 0;
  if (['time', 'wt'].includes(ex.type)) s.t = Number(e.t) || 0;
  if (ex.type === 'wd') s.d = Number(e.d) || 0;
  w.sets.push(s); save();
  UI.lastSet = (s.side !== 'R' && s.w != null) ? s.id : null;
  const goR = ex.uni && s.side === 'L' && (() => { const c = itemCounts(w, item), t = itemTargets(item); return c.R < c.L && (!t.total || c.R < t.R); })();
  if (!goR && ex.rest) startRest(ex.rest, ex.name, ex.id);
  if (itemDone(w, item)) {
    const nxt = w.items.findIndex((it, i) => i > w.cur && !itemDone(w, it));
    const any = nxt >= 0 ? nxt : w.items.findIndex((it) => !itemDone(w, it));
    if (any >= 0 && any !== w.cur) { w.cur = any; save(); toast(ex.name + ' done'); }
  }
  UI.entry = freshEntry(w, w.items[w.cur]);
  render();
}

function finishWorkout() {
  const w = active(); if (!w) return;
  if (!w.sets.length) {
    ask('No set logged. Discard this session?', 'Discard', () => { D.workouts = D.workouts.filter((x) => x.id !== w.id); D.active = null; save(); stopRest(); releaseWake(); go('today'); });
    return;
  }
  ask('Finish and save this session?', 'Finish', () => closeWorkout(w));
}
function closeWorkout(w) {
  w.end = Date.now(); w.upd = w.end; D.active = null;
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
  save(); stopRest(); releaseWake(); go('today');
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
const UI = { view: 'today', entry: null, lastSet: null, sheet: null, pq: '', pcat: null, expanded: null };
function go(view) { UI.view = view; UI.sheet = null; render(); window.scrollTo(0, 0); }
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- views ---------- */
const navOn = (k) => UI.view === k || (k === 'exercises' && UI.view === 'exercise');
function navHTML() {
  const items = [['today', 'Today'], ['calendar', 'Calendar'], ['exercises', 'Exercises'], ['analysis', 'Analysis'], ['body', 'Body']];
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
  return `<header class="top"><div><span class="muted sm">${longDate(iso())}</span><h1>Today</h1></div><div class="row">${typeof syncChip === 'function' ? syncChip() : ''}<button class="icon-btn" aria-label="More options" data-act="sheet" data-v="more">${svg('more')}</button></div></header>
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
      <div class="quick">
        <button class="btn outline" data-act="free">${svg('plus', 18, 2)} Free session</button>
        <button class="btn ${ran ? 'filled' : 'outline'}" data-act="run" aria-pressed="${ran}">${svg('run', 18, 2)} ${ran ? 'Ran today ✓' : 'I ran today'}</button>
      </div>
      ${isLightWeek(plan) ? `<section class="card hero"><span class="eyebrow">WEEK ${plan.weeks} · TESTS</span><p class="soft">Light week: log your tests (jumps, 5-10-5, row max reps, arms, weight).</p><button class="btn primary" data-act="sheet" data-v="tests">Log tests</button></section>` : ''}
      ${recent.length ? `<section class="card"><span class="eyebrow">RECENT</span>${recent.map((x) => `<div class="recent"><span>${esc(x.name.split(' — ')[0])}</span><span class="muted sm">${longDate(x.date)} · ${x.sets.length} sets</span></div>`).join('')}</section>` : ''}
    </div>
  </div>`;
}

function entryHTML(w, item) {
  const ex = D.exercises[item.exId]; const p = item.presc || {};
  if (!UI.entry || UI.entry.exId !== item.exId) UI.entry = freshEntry(w, item);
  const e = UI.entry; const inc = INC[ex.equip] || 1;
  const sug = suggestion(item.exId, p, w.id);
  const step = (label, key, val, unit, dec, incr) => `<div class="stepper"><span class="lbl">${label}</span><div class="st-row">
      <button class="st-btn" aria-label="Decrease ${label}" data-act="step" data-k="${key}" data-d="${-dec}">−</button>
      <input class="st-val" inputmode="decimal" aria-label="${label}" data-in="${key}" value="${esc(val)}"><span class="unit">${unit}</span>
      <button class="st-btn" aria-label="Increase ${label}" data-act="step" data-k="${key}" data-d="${incr}">+</button></div></div>`;
  let fields = '';
  if (['wr', 'wd', 'wt'].includes(ex.type)) fields += step('Weight', 'w', fmtW(e.w), 'kg', inc, inc);
  if (ex.type === 'bwkg') fields += step('Added', 'w', fmtW(e.w), e.w ? 'kg' : 'kg · BW', inc, inc);
  if (['wr', 'bwkg', 'reps'].includes(ex.type)) fields += step('Reps', 'r', e.r, 'reps', 1, 1);
  if (['time', 'wt'].includes(ex.type)) { const st = e.t >= 300 ? 60 : 5; fields += step('Time', 't', e.t, 's', st, st); }
  if (ex.type === 'wd') fields += step('Distance', 'd', e.d, 'm', 5, 5);
  const c = itemCounts(w, item); const t = itemTargets(item);
  const lastL = setsOf(w, item.exId).filter((s) => s.side === 'L').slice(-1)[0];
  const sideHint = ex.uni ? (e.side === 'R' && lastL ? `Right target: ${lastL.r != null ? lastL.r + ' reps' : fmtT(lastL.t || 0)} — match the left, never more.` : 'Left goes first and sets the target.') : '';
  const fbSet = UI.lastSet && w.sets.find((s) => s.id === UI.lastSet && s.exId === item.exId);
  return `<div class="entry">
    ${sug ? `<div class="sugg"><div class="row between"><span class="eyebrow">SUGGESTED</span><span class="sugg-w">${ex.type === 'bwkg' ? (sug.w ? 'BW +' + fmtW(sug.w) + ' kg' : 'BW') : fmtW(sug.w) + ' kg'}${p.rmin != null ? ' × ' + (p.rmin === p.rmax ? p.rmin : p.rmin + '–' + p.rmax) : ''}</span></div><span class="soft sm">${esc(sug.why)}</span></div>` : ''}
    ${ex.ref ? `<p class="ref">FitNotes ref · ${esc(ex.ref.date)} · ${esc(ex.ref.text)}</p>` : ''}
    <div class="fields">${fields}</div>
    ${ex.uni ? `<div class="sides" role="group" aria-label="Side">
      <button class="side L${e.side === 'L' ? ' on' : ''}" aria-pressed="${e.side === 'L'}" data-act="side" data-v="L">L · Left <small>${c.L}/${t.L || '–'}</small></button>
      <button class="side R${e.side === 'R' ? ' on' : ''}" aria-pressed="${e.side === 'R'}" data-act="side" data-v="R">R · Right <small>${c.R}/${t.R || '–'}</small></button></div>
      <p class="soft sm">${sideHint}</p>` : ''}
    <button class="btn primary big" data-act="save">Save set</button>
    ${fbSet ? `<div class="feel"><span class="muted sm">Set ${setsOf(w, item.exId).filter((s) => (s.side || null) === (fbSet.side || null)).indexOf(fbSet) + 1}${fbSet.side ? ' ' + fbSet.side : ''} felt</span>
      ${['easy', 'good', 'hard'].map((f) => `<button class="feel-btn${fbSet.feel === f ? ' on' : ''}" aria-pressed="${fbSet.feel === f}" data-act="feel" data-v="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>` : ''}
  </div>`;
}

function setRowsHTML(w, item) {
  const ex = D.exercises[item.exId]; const ss = setsOf(w, item.exId);
  const counter = { L: 0, R: 0, x: 0 };
  return ss.map((s) => {
    const k = s.side || 'x'; counter[k] += 1;
    const val = [s.w != null ? (ex.type === 'bwkg' ? (s.w ? 'BW+' + fmtW(s.w) : 'BW') : fmtW(s.w) + ' kg') : '', s.r != null ? s.r + ' reps' : '', s.t != null ? fmtT(s.t) : '', s.d != null ? s.d + ' m' : ''].filter(Boolean).join(' × ');
    return `<div class="set-row"><span class="n">${counter[k]}</span>${s.side ? `<span class="badge ${s.side}">${s.side}</span>` : '<span></span>'}<span class="v">${val}</span>${s.feel ? `<span class="muted sm">${s.feel}</span>` : '<span></span>'}<button class="icon-btn sm" aria-label="Delete this set" data-act="delset" data-id="${s.id}">${svg('close', 16)}</button></div>`;
  }).join('');
}

function viewSession() {
  const w = active();
  if (!w) return `<header class="top"><h1>Session</h1></header><section class="card"><p class="muted">No session in progress.</p><button class="btn primary" data-act="go" data-v="today">Back to Today</button></section>`;
  if (w.cur >= w.items.length) w.cur = Math.max(0, w.items.length - 1);
  const item = w.items[w.cur];
  const doneN = w.items.filter((it) => itemDone(w, it)).length;
  const mins = Math.floor((Date.now() - w.start) / 60000);
  let detail = '';
  if (item) {
    const ex = D.exercises[item.exId];
    detail = `<section class="card current">
      <div class="row between top-al"><div><span class="eyebrow"><i class="dot" style="background:${CATS[ex.cat]}"></i> ${esc(item.block || ex.cat)}</span><h2>${esc(ex.name)}</h2><p class="soft">${esc(prescText(item.presc, ex))}</p></div><div class="row">${ex.uni ? '<span class="tag">L first</span>' : ''}${typeof GUIDES !== 'undefined' && GUIDES[ex.id] ? `<button class="icon-btn" aria-label="How to do ${esc(ex.name)}" data-act="guide" data-v="${ex.id}"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button>` : ''}</div></div>
      ${item.presc && item.presc.cue ? `<p class="cue">${esc(item.presc.cue)}</p>` : ''}
      <div class="sets">${setRowsHTML(w, item)}</div>
      ${entryHTML(w, item)}
    </section>`;
  } else {
    detail = `<section class="card current"><h2>Add a first exercise</h2><p class="muted">Free session: pick exercises as you go.</p><button class="btn primary big" data-act="sheet" data-v="picker">Add exercise</button></section>`;
  }
  let lastBlock = null;
  const list = w.items.map((it, i) => {
    const ex = D.exercises[it.exId]; const d = itemDone(w, it); const c = itemCounts(w, it); const t = itemTargets(it);
    const head = it.block !== lastBlock ? `<span class="eyebrow blk">${esc((it.block || '').toUpperCase())}</span>` : ''; lastBlock = it.block;
    return `${head}<button class="ex-row${i === w.cur ? ' on' : ''}${d ? ' done' : ''}" data-act="cur" data-i="${i}">
      <span class="tick">${d ? svg('check', 14, 3) : ''}</span><i class="dot" style="background:${CATS[ex.cat]}"></i>
      <span class="ex-name"><b>${esc(ex.name)}</b><small>${esc(prescShort(it.presc, ex) || TYPES[ex.type])}</small></span>
      <span class="muted sm">${t.total ? c.n + '/' + t.total : c.n}</span></button>`;
  }).join('');
  return `<header class="top sess-top"><button class="icon-btn" aria-label="Back to today" data-act="go" data-v="today">${svg('back')}</button>
      <div class="grow"><div class="strong">${esc(w.name.split(' — ')[0])}</div><span class="muted sm">${w.planId ? 'Cycle ' + esc(w.cycle) + ' · Week ' + w.week + (w.light ? ' · light' : '') + (w.match ? ' · match version' : '') + ' · ' : ''}${mins} min</span></div>
      <button class="btn small outline" data-act="finish">Finish</button></header>
    <div class="progress"><div class="row between muted sm"><span>${doneN} of ${w.items.length} exercises done</span><span>${w.sets.length} sets</span></div><div class="bar"><i style="width:${w.items.length ? (100 * doneN / w.items.length) : 0}%"></i></div></div>
    <div class="sess-grid">
      <div class="sess-detail">${detail}</div>
      <aside class="sess-list">${list}<button class="btn outline add-ex" data-act="sheet" data-v="picker">${svg('plus', 18, 2)} Add exercise</button></aside>
    </div>`;
}

/* ---------- sheets ---------- */
function sheetHTML() {
  if (!UI.sheet) return '';
  let body = '';
  const plan = activePlan(); const pr = progOf(plan.id);
  if (UI.sheet === 'confirm' && UI.confirm) {
    body = `<h2>${esc(UI.confirm.msg)}</h2><div class="quick"><button class="btn outline" data-act="close">Cancel</button><button class="btn primary" data-act="confirm-ok">${esc(UI.confirm.ok)}</button></div>`;
  } else if (UI.sheet === 'pick') {
    body = `<h2>Sessions of this week</h2>${plan.sessions.map((s) => `<button class="list-btn" data-act="start" data-s="${s.id}"><span><b>${esc(s.name)} — ${esc(s.title)}</b><small>${s.required ? 'Required' : 'Optional'}${pr.done[s.id] ? ' · done ✓' : ''}</small></span></button>`).join('')}`;
  } else if (UI.sheet === 'match') {
    const s = plan.sessions.find((x) => x.id === UI.pending);
    body = `<h2>${esc(s.name)} — ${esc(s.title)}</h2><label class="toggle"><span><b>Match version</b><small>Match tomorrow: 2 sets on speed work, no deadlift or bike sprints</small></span><input type="checkbox" id="match-cb"></label>
      <button class="btn primary big" data-act="start-confirm">Start</button>`;
  } else if (UI.sheet === 'plans') {
    body = `<h2>Plans</h2>${Object.values(D.plans).map((p) => { const ppr = progOf(p.id); const on = p.id === plan.id; return `<button class="list-btn${on ? ' on' : ''}" data-act="setplan" data-v="${p.id}"><span><b>${esc(p.name)}</b><small>${p.sessions.filter((s) => s.required).length} required${p.sessions.some((s) => !s.required) ? ' + optional' : ''} · now cycle ${esc(cycleOf(p).key)}, week ${ppr.week}</small></span>${on ? '<span class="tag">ACTIVE</span>' : ''}</button>`; }).join('')}
      <p class="muted sm">Each plan keeps its place when you switch. Plan editing arrives in a later step.</p>`;
  } else if (UI.sheet === 'more') {
    body = `<h2>Settings & data</h2>
      <label class="toggle"><span><b>Sound at end of rest</b></span><input type="checkbox" data-set="sound" ${D.settings.sound ? 'checked' : ''}></label>
      <label class="toggle"><span><b>Vibrate at end of rest</b></span><input type="checkbox" data-set="vibrate" ${D.settings.vibrate ? 'checked' : ''}></label>
      ${typeof syncSettings === 'function' ? syncSettings() : ''}
      <button class="list-btn" data-act="export"><span><b>Export my data</b><small>Download a JSON backup</small></span></button>
      <label class="list-btn"><span><b>Import a backup</b><small>Replaces the data on this device</small></span><input type="file" accept="application/json" id="import-file" hidden></label>
      <button class="list-btn danger" data-act="reset"><span><b>Reset this device</b><small>Deletes every session stored here</small></span></button>
      <p class="muted sm">Peak ${APP_VERSION}</p>`;
  } else if (UI.sheet === 'picker') {
    const q = UI.pq.trim().toLowerCase();
    const list = Object.values(D.exercises).filter((e) => (!UI.pcat || e.cat === UI.pcat) && (!q || e.name.toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
    body = `<h2>Add exercise</h2><input class="search" type="search" placeholder="Search exercises" aria-label="Search exercises" data-in="pq" value="${esc(UI.pq)}">
      <div class="chips scroll"><button class="chip-btn${!UI.pcat ? ' on' : ''}" data-act="pcat" data-v="">All</button>${Object.keys(CATS).map((c) => `<button class="chip-btn${UI.pcat === c ? ' on' : ''}" data-act="pcat" data-v="${c}"><i class="dot" style="background:${CATS[c]}"></i>${c}</button>`).join('')}</div>
      <div class="pick-list">${list.map((e) => `<button class="list-btn" data-act="addex" data-v="${e.id}"><i class="dot" style="background:${CATS[e.cat]}"></i><span><b>${esc(e.name)}</b><small>${esc(TYPES[e.type])}${e.uni ? ' · L/R' : ''}</small></span></button>`).join('') || '<p class="muted">No match.</p>'}</div>
      <button class="btn outline" data-act="sheet" data-v="newex">${svg('plus', 18, 2)} New exercise</button>`;
  } else if (UI.sheet === 'newex') {
    body = `<h2>New exercise</h2>
      <label class="field">Name<input id="nx-name" type="text" placeholder="e.g. Copenhagen plank"></label>
      <label class="field">Category<select id="nx-cat">${Object.keys(CATS).map((c) => `<option>${c}</option>`).join('')}</select></label>
      <label class="field">Type<select id="nx-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="field">Equipment<select id="nx-eq">${Object.entries(EQUIP).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="field">Default rest (seconds)<input id="nx-rest" type="number" inputmode="numeric" value="90"></label>
      <label class="toggle"><span><b>Unilateral · track L / R</b><small>Left first, right matches</small></span><input type="checkbox" id="nx-uni"></label>
      <button class="btn primary big" data-act="newex-save">Save exercise</button>`;
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
  const app = $('#app');
  app.className = 'app view-' + UI.view;
  $('#main').innerHTML = (views[UI.view] || viewToday)();
  $('#navwrap').innerHTML = UI.view === 'session' ? '' : navHTML();
  if (typeof afterRender === 'function') afterRender();
  $('#sheetwrap').innerHTML = sheetHTML();
  const f = $('#import-file'); if (f) f.addEventListener('change', importFile);
  if (UI.view === 'session') keepAwake();
  tickRest();
}

/* ---------- events ---------- */
document.addEventListener('click', (ev) => {
  unlockAudio();
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act; const w = active();
  switch (a) {
    case 'go': go(b.dataset.v); break;
    case 'sheet': UI.sheet = b.dataset.v; if (b.dataset.v === 'picker') { UI.pq = ''; } render(); break;
    case 'close': UI.sheet = null; render(); break;
    case 'start': {
      const s = activePlan().sessions.find((x) => x.id === b.dataset.s);
      if (s && s.matchable) { UI.pending = s.id; UI.sheet = 'match'; render(); }
      else startWorkout(activePlan().id, b.dataset.s, {});
      break;
    }
    case 'start-confirm': { const m = $('#match-cb'); startWorkout(activePlan().id, UI.pending, { match: !!(m && m.checked) }); break; }
    case 'free': startWorkout(null, null, {}); break;
    case 'run': { toggleRun(iso()); save(); render(); break; }
    case 'setplan': D.settings.activePlan = b.dataset.v; D.settings.upd = Date.now(); save(); UI.sheet = null; render(); break;
    case 'cur': if (w) { w.cur = Number(b.dataset.i); UI.entry = null; UI.lastSet = null; save(); render(); window.scrollTo(0, 0); } break;
    case 'step': {
      const k = b.dataset.k, d = Number(b.dataset.d); const ex = w && D.exercises[w.items[w.cur].exId];
      let v = (Number(UI.entry[k]) || 0) + d;
      if (k === 'w' && ex) v = roundTo(Math.max(0, v), ex.equip === 'db' ? 'db' : ex.equip);
      UI.entry[k] = Math.max(0, Math.round(v * 10) / 10); render(); break;
    }
    case 'side': {
      UI.entry.side = b.dataset.v;
      if (b.dataset.v === 'R' && w) { const lastL = setsOf(w, UI.entry.exId).filter((s) => s.side === 'L').slice(-1)[0]; if (lastL) { UI.entry.w = lastL.w; UI.entry.r = lastL.r; UI.entry.t = lastL.t; UI.entry.d = lastL.d; } }
      render(); break;
    }
    case 'save': saveSet(); break;
    case 'feel': { const s = w && w.sets.find((x) => x.id === UI.lastSet); if (s) { s.feel = s.feel === b.dataset.v ? null : b.dataset.v; save(); UI.entry = freshEntry(w, w.items[w.cur]); render(); } break; }
    case 'delset': if (w) { const id = b.dataset.id; ask('Delete this set?', 'Delete', () => { w.sets = w.sets.filter((s) => s.id !== id); if (UI.lastSet === id) UI.lastSet = null; UI.entry = null; save(); UI.sheet = null; render(); }); } break;
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
    case 'addex': if (w) { w.items.push({ exId: b.dataset.v, block: 'Added', presc: null }); w.cur = w.items.length - 1; UI.entry = null; UI.lastSet = null; save(); } UI.sheet = null; render(); break;
    case 'newex-save': {
      const name = ($('#nx-name').value || '').trim(); if (!name) { toast('Give the exercise a name'); break; }
      const e = { id: 'x' + uid(), name, cat: $('#nx-cat').value, type: $('#nx-type').value, equip: $('#nx-eq').value, uni: $('#nx-uni').checked, rest: Math.max(0, Number($('#nx-rest').value) || 0) };
      e.upd = Date.now(); D.exercises[e.id] = e;
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
  if (t.dataset && t.dataset.in && UI.entry && t.dataset.in !== 'pq') { UI.entry[t.dataset.in] = Math.max(0, Number(String(t.value).replace(',', '.')) || 0); render(); }
  if (t.dataset && t.dataset.set) { D.settings[t.dataset.set] = t.checked; save(); }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.dataset && t.dataset.in === 'pq') {
    UI.pq = t.value; const pos = t.selectionStart; render();
    const n = $('[data-in="pq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } }
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
