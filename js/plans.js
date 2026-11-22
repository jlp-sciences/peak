/* Peak — plan editor. Works on a draft copy of the plan; nothing changes until "Save plan". */
const clone = (o) => JSON.parse(JSON.stringify(o));
const PE = () => UI.pe;

function openPlanEditor(id) {
  if (!UI.pe || UI.pe.id !== id) {
    const src = D.plans[id];
    UI.pe = { id, draft: clone(src), cyc: src.cycles[0].key, open: src.sessions[0] ? src.sessions[0].id : null, isNew: false, dirty: false };
  }
  UI.sheet = null; go('planedit');
}
function newPlan() {
  const id = 'p' + uid(); const sid = 's' + uid();
  UI.pe = { id, isNew: true, dirty: true, cyc: 'A', open: sid,
    draft: { id, name: 'New plan', weeks: 1, lightLast: false, cycles: [{ key: 'A', name: 'Main' }],
      sessions: [{ id: sid, name: 'Session 1', title: '', required: true, minutes: 45, tpl: { A: [['Main', []]] } }] } };
  UI.sheet = null; go('planedit');
}
const peSess = (sid) => PE().draft.sessions.find((s) => s.id === sid);
const peBlocks = (s, key) => s.tpl[key];
const firstKey = (s) => Object.keys(s.tpl)[0];
const cycleKeys = () => PE().draft.cycles.map((c) => c.key);
function nextCycleKey() { const used = new Set(cycleKeys()); for (const k of 'ABCDEFGHIJ') if (!used.has(k)) return k; return 'X' + uid().slice(0, 3); }
function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); }
const peDirty = () => { PE().dirty = true; };

/* one line describing a template item, like the session screen does */
function peItemText(it) {
  const ex = D.exercises[it.ex]; if (!ex) return 'Unknown exercise';
  const p = prescribe(it, 1, false, false); let t = p ? prescShort(p, ex) : '';
  if (it.load && typeof it.load === 'object') t += ' · load by week';
  if (it.sw) t += ' · sets by week';
  return t || TYPES[ex.type];
}

function planEditView() {
  const pe = PE();
  if (!pe) return `<header class="top"><h1>Plans</h1></header><section class="card"><p class="muted">Nothing to edit.</p><button class="btn primary" data-act="go" data-v="today">Back to Today</button></section>`;
  const d = pe.draft; const cyc = pe.cyc;
  const cycles = d.cycles.map((c, i) => `<div class="pe-cyc"><span class="tag">${esc(c.key)}</span><input class="pe-in" data-pf="cname:${i}" value="${esc(c.name)}" aria-label="Cycle ${esc(c.key)} name">${d.cycles.length > 1 ? `<button class="icon-btn sm" aria-label="Remove cycle ${esc(c.key)}" data-act="pe-cyc-del" data-i="${i}">${svg('close', 16)}</button>` : ''}</div>`).join('');
  const sessions = d.sessions.map((s, si) => {
    const open = pe.open === s.id;
    const own = !!s.tpl[cyc]; const fk = firstKey(s);
    const blocks = own ? s.tpl[cyc] : (s.tpl[fk] || []);
    const nEx = blocks.reduce((n, [, l]) => n + l.length, 0);
    let body = '';
    if (open) {
      body = `<div class="pe-grid">
          <label class="field">Name<input data-pf="s:${si}:name" value="${esc(s.name)}"></label>
          <label class="field">Minutes<input data-pf="s:${si}:minutes" type="number" inputmode="numeric" value="${s.minutes || ''}"></label></div>
        <label class="field">Focus<input data-pf="s:${si}:title" value="${esc(s.title || '')}" placeholder="e.g. Upper + rotational power"></label>
        <label class="toggle"><span><b>Required</b><small>Counts towards completing the week</small></span><input type="checkbox" data-pf="s:${si}:required" ${s.required ? 'checked' : ''}></label>
        <label class="toggle"><span><b>Match version</b><small>Offers a lighter version the day before a match</small></span><input type="checkbox" data-pf="s:${si}:matchable" ${s.matchable ? 'checked' : ''}></label>`;
      if (!own) {
        body += `<div class="pe-note"><p class="soft sm">Cycle ${esc(cyc)} uses the exercises of cycle ${esc(fk)} (${nEx}).</p><button class="btn small outline" data-act="pe-own" data-s="${si}">Give cycle ${esc(cyc)} its own exercises</button></div>`;
      } else {
        body += s.tpl[cyc].map(([bn, list], bi) => `<div class="pe-block">
            <div class="row"><input class="pe-in grow" data-pf="b:${si}:${bi}" value="${esc(bn)}" aria-label="Block name">
              <button class="icon-btn sm" aria-label="Move block up" data-act="pe-bmove" data-s="${si}" data-b="${bi}" data-d="-1">${svg('up', 16)}</button>
              <button class="icon-btn sm" aria-label="Move block down" data-act="pe-bmove" data-s="${si}" data-b="${bi}" data-d="1">${svg('down', 16)}</button>
              <button class="icon-btn sm" aria-label="Remove block" data-act="pe-bdel" data-s="${si}" data-b="${bi}">${svg('close', 16)}</button></div>
            ${list.map((it, ii) => { const ex = D.exercises[it.ex] || { name: it.ex, cat: 'Core' }; return `<button class="pe-item" data-act="pe-item" data-s="${si}" data-b="${bi}" data-i="${ii}"><i class="dot" style="background:${CATS[ex.cat] || '#888'}"></i><span><b>${esc(ex.name)}</b><small>${esc(peItemText(it))}</small></span>${svg('chev', 16)}</button>`; }).join('')}
            <button class="btn small outline" data-act="pe-add" data-s="${si}" data-b="${bi}">${svg('plus', 16, 2)} Exercise</button></div>`).join('');
        body += `<div class="row wrap"><button class="btn small outline" data-act="pe-badd" data-s="${si}">${svg('plus', 16, 2)} Block</button>${cyc !== fk ? `<button class="btn small outline" data-act="pe-unown" data-s="${si}">Use cycle ${esc(fk)}'s exercises</button>` : ''}</div>`;
      }
      body += `<div class="row wrap pe-sbar"><button class="btn small outline" data-act="pe-smove" data-s="${si}" data-d="-1">Move up</button><button class="btn small outline" data-act="pe-smove" data-s="${si}" data-d="1">Move down</button><button class="btn small outline danger-t" data-act="pe-sdel" data-s="${si}">Delete session</button></div>`;
    }
    return `<section class="card pe-sess${open ? ' open' : ''}"><button class="pe-shead" data-act="pe-open" data-s="${s.id}" aria-expanded="${open}"><span><b>${esc(s.name)}${s.title ? ' — ' + esc(s.title) : ''}</b><small>${s.required ? 'Required' : 'Optional'}${s.minutes ? ' · ' + s.minutes + ' min' : ''} · ${nEx} exercises${own ? '' : ' (from cycle ' + esc(fk) + ')'}</small></span>${svg(open ? 'up' : 'down', 18)}</button>${body}</section>`;
  }).join('');
  return `<header class="top sess-top"><button class="icon-btn" aria-label="Back" data-act="pe-cancel">${svg('back')}</button>
      <div class="grow"><div class="strong">${pe.isNew ? 'New plan' : 'Edit plan'}</div><span class="muted sm">${pe.dirty ? 'Unsaved changes' : 'No changes'}</span></div>
      <button class="btn small primary" data-act="pe-save">Save plan</button></header>
    <section class="card">
      <label class="field">Plan name<input data-pf="name" value="${esc(d.name)}"></label>
      <div class="row between"><span><b>Weeks per cycle</b></span><div class="st-row"><button class="st-btn" aria-label="Fewer weeks" data-act="pe-weeks" data-d="-1">−</button><span class="st-val pe-num">${d.weeks}</span><button class="st-btn" aria-label="More weeks" data-act="pe-weeks" data-d="1">+</button></div></div>
      ${d.weeks > 1 ? `<label class="toggle"><span><b>Last week is lighter</b><small>Each exercise can set its own light-week sets and load</small></span><input type="checkbox" data-pf="lightLast" ${d.lightLast ? 'checked' : ''}></label>` : ''}
    </section>
    <section class="card"><div class="row between"><span class="eyebrow">CYCLES</span><button class="btn small outline" data-act="pe-cyc-add">${svg('plus', 16, 2)} Cycle</button></div>
      ${cycles}<p class="muted sm">Cycles follow each other; each lasts ${d.weeks} week${d.weeks > 1 ? 's' : ''}. A cycle without its own exercises reuses those of cycle ${esc(d.cycles[0].key)}.</p></section>
    <div class="row wrap pe-tabs"><span class="eyebrow">EDITING CYCLE</span>${d.cycles.map((c) => `<button class="chip-btn${c.key === cyc ? ' on' : ''}" data-act="pe-cyc" data-v="${esc(c.key)}">${esc(c.key)} · ${esc(c.name)}</button>`).join('')}</div>
    ${sessions}
    <button class="btn outline big" data-act="pe-sadd">${svg('plus', 18, 2)} Add a session</button>
    ${pe.isNew ? '' : `<div class="row wrap pe-sbar"><button class="btn small outline" data-act="pe-dup">Duplicate plan</button><button class="btn small outline danger-t" data-act="pe-del">Delete plan</button></div>`}`;
}

/* ---------- item sheet ---------- */
function peItem() { const pe = PE(); const r = pe.item; return r && peSess(pe.draft.sessions[r.s].id).tpl[pe.cyc][r.b][1][r.i]; }
function numIn(id, label, val, ph) { return `<label class="field">${label}<input id="${id}" type="number" inputmode="decimal" value="${val == null ? '' : esc(val)}" placeholder="${ph || ''}"></label>`; }
function planItemSheet() {
  const pe = PE(); const it = peItem(); if (!it) return '<p class="muted">Item not found.</p>';
  const ex = D.exercises[it.ex] || { name: it.ex, type: 'wr', uni: false };
  const d = pe.draft; const s = d.sessions[pe.item.s];
  const hasR = ['wr', 'bwkg', 'reps'].includes(ex.type), hasT = ['time', 'wt'].includes(ex.type), hasD = ex.type === 'wd', hasW = ['wr', 'wd', 'wt'].includes(ex.type);
  const sets = ex.uni ? `<div class="pe-grid">${numIn('pi-L', 'Left sets', it.L != null ? it.L : it.s)}${numIn('pi-R', 'Right sets', it.R != null ? it.R : it.s)}</div>`
    : numIn('pi-s', 'Sets', it.s != null ? it.s : (it.sw ? it.sw[1] : ''));
  const weeks = Array.from({ length: d.weeks }, (_, i) => i + 1);
  const byWeek = (pre, obj, label) => d.weeks > 1 ? `<details class="pe-det"${obj ? ' open' : ''}><summary>${label} by week</summary><div class="pe-grid w${Math.min(d.weeks, 4)}">${weeks.map((k) => numIn(pre + k, 'Week ' + k, obj ? obj[k] : '')).join('')}</div><p class="muted sm">Empty = same as above.</p></details>` : '';
  const w4 = it.w4 || {}; const m = 'match' in it ? (it.match === null ? 'skip' : 'less') : 'keep'; const mm = it.match || {};
  let h = `<h2>${esc(ex.name)}</h2>
    <button class="list-btn" data-act="pe-change-ex"><span><b>Change exercise</b><small>Keeps sets, reps and notes</small></span></button>
    ${sets}${!ex.uni ? byWeek('pi-sw', it.sw, 'Sets') : ''}
    ${hasR ? `<div class="pe-grid">${numIn('pi-rmin', 'Reps from', it.r ? it.r[0] : '')}${numIn('pi-rmax', 'Reps to', it.r ? it.r[1] : '')}</div>` : ''}
    ${hasT ? numIn('pi-t', 'Time (seconds)', it.t) : ''}${hasD ? numIn('pi-d', 'Distance (m)', it.d) : ''}
    ${hasW ? numIn('pi-load', 'Plan load (kg)', typeof it.load === 'object' && it.load ? it.load[1] : it.load, 'empty = Peak suggests') + byWeek('pi-lw', typeof it.load === 'object' ? it.load : null, 'Load') : ''}
    ${hasW || ex.type === 'reps' ? `<label class="field">Load label (optional)<input id="pi-ltxt" value="${esc(it.loadTxt || '')}" placeholder="e.g. 3–4 kg ball"></label>` : ''}
    <label class="field">Cue<input id="pi-cue" value="${esc(it.cue || '')}" placeholder="One short reminder"></label>`;
  if (d.lightLast && d.weeks > 1) {
    h += `<div class="pe-sub"><span class="eyebrow">LIGHT WEEK (WEEK ${d.weeks})</span><p class="muted sm">Empty = same as a normal week.</p>
      ${ex.uni ? `<div class="pe-grid">${numIn('pi-w4L', 'Left sets', w4.L)}${numIn('pi-w4R', 'Right sets', w4.R)}</div>` : numIn('pi-w4s', 'Sets', w4.s)}
      ${hasR ? `<div class="pe-grid">${numIn('pi-w4rmin', 'Reps from', w4.r ? w4.r[0] : '')}${numIn('pi-w4rmax', 'Reps to', w4.r ? w4.r[1] : '')}</div>` : ''}
      ${hasW ? numIn('pi-w4load', 'Load (kg)', w4.load) : ''}</div>`;
  }
  if (s.matchable) {
    h += `<div class="pe-sub"><span class="eyebrow">MATCH VERSION</span>
      <label class="field">Day before a match<select id="pi-match"><option value="keep"${m === 'keep' ? ' selected' : ''}>Keep as planned</option><option value="less"${m === 'less' ? ' selected' : ''}>Fewer sets</option><option value="skip"${m === 'skip' ? ' selected' : ''}>Skip this exercise</option></select></label>
      ${ex.uni ? `<div class="pe-grid">${numIn('pi-mL', 'Left sets', mm.L)}${numIn('pi-mR', 'Right sets', mm.R)}</div>` : numIn('pi-ms', 'Sets', mm.s)}</div>`;
  }
  h += `<button class="btn primary big" data-act="pe-item-save">Save exercise</button>
    <div class="row wrap"><button class="btn small outline" data-act="pe-imove" data-d="-1">Move up</button><button class="btn small outline" data-act="pe-imove" data-d="1">Move down</button><button class="btn small outline danger-t" data-act="pe-idel">Remove</button></div>`;
  return h;
}
function readItemSheet() {
  const pe = PE(); const it = peItem(); if (!it) return;
  const ex = D.exercises[it.ex] || { type: 'wr', uni: false }; const d = pe.draft;
  const v = (id) => { const n = $('#' + id); if (!n || n.value === '') return null; const x = Number(String(n.value).replace(',', '.')); return isFinite(x) ? Math.max(0, x) : null; };
  const t = (id) => { const n = $('#' + id); return n ? n.value.trim() : ''; };
  const pos = (x, dflt) => (x == null ? dflt : Math.max(1, Math.round(x)));
  if (ex.uni) { it.L = pos(v('pi-L'), 3); it.R = pos(v('pi-R'), it.L); delete it.s; delete it.sw; }
  else {
    it.s = pos(v('pi-s'), 3); delete it.L; delete it.R;
    if (d.weeks > 1 && $('#pi-sw1')) { const sw = {}; let diff = false; for (let k = 1; k <= d.weeks; k++) { const x = v('pi-sw' + k); sw[k] = x == null ? it.s : Math.max(1, Math.round(x)); if (sw[k] !== it.s) diff = true; } if (diff) it.sw = sw; else delete it.sw; }
  }
  if ($('#pi-rmin')) { const a = v('pi-rmin'), b = v('pi-rmax'); if (a == null && b == null) delete it.r; else it.r = [Math.round(a != null ? a : b), Math.round(b != null ? b : a)].sort((x, y) => x - y); }
  if ($('#pi-t')) { const x = v('pi-t'); if (x) it.t = Math.round(x); else delete it.t; }
  if ($('#pi-d')) { const x = v('pi-d'); if (x) it.d = Math.round(x); else delete it.d; }
  if ($('#pi-load')) {
    const base = v('pi-load'); let byw = null;
    if (d.weeks > 1 && $('#pi-lw1')) { for (let k = 1; k <= d.weeks; k++) { const x = v('pi-lw' + k); if (x != null) { byw = byw || {}; byw[k] = x; } } }
    if (byw) { for (let k = 1; k <= d.weeks; k++) if (byw[k] == null && base != null) byw[k] = base; if (byw[1] == null) byw[1] = base != null ? base : Object.values(byw)[0]; it.load = byw; }
    else if (base != null) it.load = base; else delete it.load;
  }
  if ($('#pi-ltxt')) { const x = t('pi-ltxt'); if (x) it.loadTxt = x; else delete it.loadTxt; }
  const cue = t('pi-cue'); if (cue) it.cue = cue; else delete it.cue;
  if ($('#pi-w4load') || $('#pi-w4s') || $('#pi-w4L')) {
    const w4 = {};
    if (ex.uni) { const a = v('pi-w4L'), b = v('pi-w4R'); if (a != null) w4.L = Math.max(1, Math.round(a)); if (b != null) w4.R = Math.max(1, Math.round(b)); }
    else { const a = v('pi-w4s'); if (a != null) w4.s = Math.max(1, Math.round(a)); }
    if ($('#pi-w4rmin')) { const a = v('pi-w4rmin'), b = v('pi-w4rmax'); if (a != null || b != null) w4.r = [Math.round(a != null ? a : b), Math.round(b != null ? b : a)].sort((x, y) => x - y); }
    const l = v('pi-w4load'); if (l != null) w4.load = l;
    if (Object.keys(w4).length) it.w4 = w4; else delete it.w4;
  }
  const ms = $('#pi-match');
  if (ms) {
    if (ms.value === 'keep') delete it.match;
    else if (ms.value === 'skip') it.match = null;
    else { const o = {}; if (ex.uni) { const a = v('pi-mL'), b = v('pi-mR'); o.L = pos(a, 2); o.R = pos(b, Math.max(1, o.L - 1)); } else o.s = pos(v('pi-ms'), 2); it.match = o; }
  }
  peDirty();
}

/* exercise chosen in the picker while editing a plan */
function pePicked(exId) {
  const pe = PE(); if (!pe || !UI.pickPlan) return;
  const mode = UI.pickPlan; UI.pickPlan = null;
  if (mode.kind === 'change') { const it = peItem(); if (it) { it.ex = exId; const ex = D.exercises[exId]; if (ex && ex.uni && it.s != null && it.L == null) { it.L = it.s; it.R = it.s; delete it.s; delete it.sw; } if (ex && !ex.uni && it.L != null) { it.s = it.L; delete it.L; delete it.R; } } UI.sheet = 'pe-item'; }
  else {
    const s = pe.draft.sessions[mode.s]; const list = s.tpl[pe.cyc][mode.b][1]; const ex = D.exercises[exId];
    const it = ex && ex.uni ? { ex: exId, L: 3, R: 3 } : { ex: exId, s: 3 };
    if (ex && ['wr', 'bwkg', 'reps'].includes(ex.type)) it.r = [8, 10];
    if (ex && ['time', 'wt'].includes(ex.type)) it.t = 30;
    if (ex && ex.type === 'wd') it.d = 30;
    list.push(it); pe.item = { s: mode.s, b: mode.b, i: list.length - 1 }; UI.sheet = 'pe-item';
  }
  peDirty(); render();
}

function savePlan() {
  const pe = PE(); const d = pe.draft;
  d.name = (d.name || '').trim() || 'Plan';
  if (!d.sessions.length) { toast('A plan needs at least one session'); return; }
  d.sessions.forEach((s, i) => { s.name = (s.name || '').trim() || 'Session ' + (i + 1); Object.keys(s.tpl).forEach((k) => { if (!cycleKeys().includes(k)) delete s.tpl[k]; }); if (!Object.keys(s.tpl).length) s.tpl[d.cycles[0].key] = [['Main', []]]; });
  if (!d.sessions.some((s) => s.required)) d.sessions[0].required = true;
  d.upd = Date.now();
  D.plans[d.id] = clone(d);
  const pr = progOf(d.id);
  if (pr.week > d.weeks) pr.week = d.weeks;
  if (pr.cycle >= d.cycles.length) pr.cycle = 0;
  Object.keys(pr.done || {}).forEach((sid) => { if (!d.sessions.some((s) => s.id === sid)) delete pr.done[sid]; });
  pr.upd = Date.now();
  save(); const name = d.name; UI.pe = null; toast(name + ' saved'); go(UI.prev && UI.prev !== 'planedit' ? UI.prev : 'today', true);
}
function leaveEditor() { UI.pe = null; go(UI.prev && UI.prev !== 'planedit' ? UI.prev : 'today', true); }

const _extraSheetPlans = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'pe-item') return planItemSheet();
  return _extraSheetPlans(name);
};

document.addEventListener('change', (ev) => {
  const t = ev.target; const pf = t.dataset && t.dataset.pf; const pe = PE(); if (!pf || !pe) return;
  const d = pe.draft; const p = pf.split(':'); const val = t.type === 'checkbox' ? t.checked : t.value;
  if (p[0] === 'name') d.name = val;
  else if (p[0] === 'lightLast') d.lightLast = val;
  else if (p[0] === 'cname') d.cycles[Number(p[1])].name = val;
  else if (p[0] === 's') { const s = d.sessions[Number(p[1])]; if (p[2] === 'minutes') s.minutes = Math.max(0, Math.round(Number(val) || 0)); else s[p[2]] = val; if (p[2] === 'matchable' && !val) delete s.matchable; }
  else if (p[0] === 'b') { d.sessions[Number(p[1])].tpl[pe.cyc][Number(p[2])][0] = val; }
  peDirty(); render();
});

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act; if (!a.startsWith('pe-') && a !== 'plan-edit' && a !== 'plan-new') return;
  if (a === 'plan-edit') { openPlanEditor(b.dataset.v); return; }
  if (a === 'plan-new') { newPlan(); return; }
  const pe = PE(); if (!pe) return; const d = pe.draft;
  const si = Number(b.dataset.s), bi = Number(b.dataset.b), di = Number(b.dataset.d);
  const S_ = d.sessions[si];
  switch (a) {
    case 'pe-cancel': if (pe.dirty) ask('Leave without saving the changes?', 'Discard', leaveEditor); else leaveEditor(); return;
    case 'pe-save': savePlan(); return;
    case 'pe-weeks': d.weeks = Math.max(1, Math.min(12, d.weeks + di)); break;
    case 'pe-cyc': pe.cyc = b.dataset.v; render(); return;
    case 'pe-cyc-add': { const k = nextCycleKey(); d.cycles.push({ key: k, name: 'Cycle ' + k }); pe.cyc = k; break; }
    case 'pe-cyc-del': { const i = Number(b.dataset.i); const c = d.cycles[i]; ask('Remove cycle ' + c.key + ' and its exercises?', 'Remove', () => { d.cycles.splice(i, 1); d.sessions.forEach((s) => { delete s.tpl[c.key]; if (!Object.keys(s.tpl).length) s.tpl[d.cycles[0].key] = [['Main', []]]; }); if (pe.cyc === c.key) pe.cyc = d.cycles[0].key; peDirty(); UI.sheet = null; render(); }); return; }
    case 'pe-open': pe.open = pe.open === b.dataset.s ? null : b.dataset.s; render(); return;
    case 'pe-own': S_.tpl[pe.cyc] = clone(S_.tpl[firstKey(S_)] || [['Main', []]]); break;
    case 'pe-unown': ask('Drop cycle ' + pe.cyc + "'s own exercises for this session?", 'Drop', () => { delete S_.tpl[pe.cyc]; peDirty(); UI.sheet = null; render(); }); return;
    case 'pe-sadd': { const s = { id: 's' + uid(), name: 'Session ' + (d.sessions.length + 1), title: '', required: true, minutes: 45, tpl: {} }; s.tpl[pe.cyc] = [['Main', []]]; if (pe.cyc !== d.cycles[0].key) s.tpl[d.cycles[0].key] = [['Main', []]]; d.sessions.push(s); pe.open = s.id; break; }
    case 'pe-smove': move(d.sessions, si, di); break;
    case 'pe-sdel': ask('Delete ' + S_.name + '?', 'Delete', () => { d.sessions.splice(si, 1); peDirty(); UI.sheet = null; render(); }); return;
    case 'pe-badd': S_.tpl[pe.cyc].push(['New block', []]); break;
    case 'pe-bmove': move(S_.tpl[pe.cyc], bi, di); break;
    case 'pe-bdel': { const bl = S_.tpl[pe.cyc][bi]; const go_ = () => { S_.tpl[pe.cyc].splice(bi, 1); peDirty(); UI.sheet = null; render(); }; if (bl[1].length) ask('Remove the block ' + bl[0] + ' and its ' + bl[1].length + ' exercises?', 'Remove', go_); else go_(); return; }
    case 'pe-add': UI.pickPlan = { kind: 'add', s: si, b: bi }; UI.pq = ''; UI.sheet = 'picker'; render(); return;
    case 'pe-item': pe.item = { s: si, b: bi, i: Number(b.dataset.i) }; UI.sheet = 'pe-item'; render(); return;
    case 'pe-pick': pePicked(b.dataset.v); return;
    case 'pe-change-ex': UI.pickPlan = { kind: 'change' }; UI.pq = ''; UI.sheet = 'picker'; render(); return;
    case 'pe-item-save': readItemSheet(); UI.sheet = null; break;
    case 'pe-imove': { readItemSheet(); const r = pe.item; const list = d.sessions[r.s].tpl[pe.cyc][r.b][1]; const j = r.i + di; if (j >= 0 && j < list.length) { move(list, r.i, di); r.i = j; } break; }
    case 'pe-idel': { const r = pe.item; d.sessions[r.s].tpl[pe.cyc][r.b][1].splice(r.i, 1); pe.item = null; UI.sheet = null; break; }
    case 'pe-dup': { const id = 'p' + uid(); const c = clone(d); c.id = id; c.name = d.name + ' (copy)'; UI.pe = { id, isNew: true, dirty: true, cyc: pe.cyc, open: pe.open, draft: c }; render(); window.scrollTo(0, 0); toast('Copy created — save it to keep it'); return; }
    case 'pe-del': {
      if (Object.keys(D.plans).length < 2) { toast('Keep at least one plan'); return; }
      ask('Delete the plan ' + d.name + '? Past sessions stay in your history.', 'Delete plan', () => {
        delete D.plans[d.id]; delete D.progress[d.id];
        if (SEED_PLANS.some((x) => x.id === d.id)) { D.settings.removedPlans = (D.settings.removedPlans || []).concat(d.id); D.settings.upd = Date.now(); }
        if (D.settings.activePlan === d.id) { D.settings.activePlan = Object.keys(D.plans)[0]; D.settings.upd = Date.now(); }
        save(); UI.sheet = null; leaveEditor(); toast('Plan deleted');
      }); return;
    }
    default: return;
  }
  peDirty(); render();
});
