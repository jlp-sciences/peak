/* Peak — session history (Calendar → List), editing a past session, and notes on sessions, exercises and sets. */
const BUBBLE = (on) => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>`;
const wById = (id) => D.workouts.find((w) => w.id === id);
const fmtSetH = (ex, s) => [s.w != null && ex.type !== 'reps' && ex.type !== 'time' ? (ex.type === 'bwkg' ? (s.w ? 'BW+' + fmtW(s.w) : 'BW') : fmtW(s.w) + ' kg') : null, s.r != null ? s.r + ' reps' : null, s.t != null ? fmtT(s.t) : null, s.d != null ? s.d + ' m' : null].filter(Boolean).join(' × ');
const durOf = (w) => (w.late ? '' : Math.max(1, Math.round(((w.end || 0) - (w.start || 0)) / 60000)) + ' min');

/* ---------- list ---------- */
function historyListHTML() {
  const ws = D.workouts.filter((w) => w.end).slice().sort((a, b) => (b.date === a.date ? (b.start || 0) - (a.start || 0) : b.date.localeCompare(a.date)));
  if (!ws.length) return '<section class="card"><p class="muted">No session yet. Finished sessions appear here, newest first.</p></section>';
  const weeks = {}; ws.forEach((w) => { const k = mondayOf(w.date); (weeks[k] = weeks[k] || []).push(w); });
  return Object.entries(weeks).map(([mon, list]) => `<span class="eyebrow hist-wk">WEEK OF ${esc(longDate(mon).toUpperCase())} · ${list.length} SESSION${list.length > 1 ? 'S' : ''}</span>
    ${list.map((w) => { const exs = [...new Set(w.sets.map((s) => s.exId))]; const cats = [...new Set(exs.map((id) => D.exercises[id] && D.exercises[id].cat).filter(Boolean))];
      return `<button class="hist-row" data-act="hist-open" data-v="${w.id}"><span class="hr-date"><b>${dOf(w.date).getDate()}</b><small>${SHORT_M[dOf(w.date).getMonth()]}</small></span>
        <span class="grow"><b>${esc(w.name.split(' — ')[0])}</b><small>${w.pct != null ? w.pct + ' % · ' : ''}${w.sets.length} sets${durOf(w) ? ' · ' + durOf(w) : ''} · ${exs.length} exercises</small>
        <span class="cal-dots">${cats.slice(0, 6).map((c) => `<i class="dot sm" style="background:${CATS[c]}"></i>`).join('')}</span>${w.note ? `<small class="hr-note">“${esc(w.note)}”</small>` : ''}</span>${svg('chev', 16)}</button>`; }).join('')}`).join('');
}

/* ---------- one session ---------- */
function workoutView() {
  const w = wById(UI.wId); if (!w) { UI.view = 'calendar'; return calendarView(); }
  const order = []; w.sets.forEach((s) => { if (!order.includes(s.exId)) order.push(s.exId); });
  (w.items || []).forEach((it) => { if (!order.includes(it.exId) && it.note) order.push(it.exId); });
  const blocks = order.map((id) => {
    const ex = D.exercises[id] || { name: id, cat: 'Core', type: 'wr' }; const ss = w.sets.filter((s) => s.exId === id);
    const item = (w.items || []).find((it) => it.exId === id);
    return `<section class="card wk-ex"><div class="row between"><span><i class="dot" style="background:${CATS[ex.cat] || '#888'}"></i> <b>${esc(ex.name)}</b></span><button class="btn small outline" data-act="hset-add" data-v="${id}">${svg('plus', 14, 2)} Set</button></div>
      ${ss.map((s, i) => `<button class="hset" data-act="hset" data-v="${s.id}"><span class="n">${i + 1}</span>${s.side ? `<span class="badge ${s.side}">${s.side}</span>` : '<span></span>'}<span class="v">${fmtSetH(ex, s)}</span>${s.feel ? `<span class="muted sm">${s.feel}</span>` : ''}${s.note ? `<span class="note-ic on">${BUBBLE(true)}</span>` : ''}</button>${s.note ? `<p class="set-note">${esc(s.note)}</p>` : ''}`).join('')}
      <label class="field sm-field">Exercise note<textarea rows="1" data-note="witem" data-w="${w.id}" data-ex="${id}" placeholder="Optional">${esc((item && item.note) || '')}</textarea></label></section>`;
  }).join('');
  return `<header class="top"><button class="icon-btn" aria-label="Back to history" data-act="go" data-v="calendar">${svg('back')}</button>
      <div class="grow"><div class="strong">${esc(w.name.split(' — ')[0])}</div><span class="muted sm">${longDate(w.date)}${w.pct != null ? ' · ' + w.pct + ' %' : ''} · ${w.sets.length} sets${durOf(w) ? ' · ' + durOf(w) : ''}</span></div>
      <button class="btn small outline" data-act="sheet" data-v="w-edit">Edit</button></header>
    <section class="card"><label class="field">Session note<textarea rows="2" data-note="wsession" data-w="${w.id}" placeholder="How did it go? Optional">${esc(w.note || '')}</textarea></label></section>
    ${blocks || '<section class="card"><p class="muted">No set in this session.</p></section>'}
    <button class="btn outline" data-act="hist-addex">${svg('plus', 18, 2)} Add an exercise</button>
    <button class="btn outline danger-t" data-act="hist-del">Delete this session</button>`;
}

/* ---------- sheets ---------- */
function setEditSheet() {
  const w = wById(UI.wId); const s = w && w.sets.find((x) => x.id === UI.hSet); if (!s) return '';
  const ex = D.exercises[s.exId] || { type: 'wr', uni: false, name: s.exId };
  const f = (k, label, v) => `<label class="field">${label}<input id="hs-${k}" type="number" inputmode="decimal" value="${v == null ? '' : v}"></label>`;
  return `<h2>${esc(ex.name)}</h2>
    <div class="pe-grid">${['wr', 'wd', 'wt', 'bwkg'].includes(ex.type) ? f('w', ex.type === 'bwkg' ? 'Added weight (kg)' : 'Weight (kg)', s.w) : ''}${['wr', 'bwkg', 'reps'].includes(ex.type) ? f('r', 'Reps', s.r) : ''}${['time', 'wt'].includes(ex.type) ? f('t', 'Time (s)', s.t) : ''}${ex.type === 'wd' ? f('d', 'Distance (m)', s.d) : ''}</div>
    ${ex.uni ? `<div class="sides" role="group" aria-label="Side"><button class="side L${s.side === 'L' ? ' on' : ''}" data-act="hs-side" data-v="L">L · Left</button><button class="side R${s.side === 'R' ? ' on' : ''}" data-act="hs-side" data-v="R">R · Right</button></div>` : ''}
    <label class="field">Set note<textarea id="hs-note" rows="2" placeholder="Optional">${esc(s.note || '')}</textarea></label>
    <button class="btn primary big" data-act="hs-save">Save set</button><button class="btn outline danger-t" data-act="hs-del">Delete set</button>`;
}
function wEditSheet() {
  const w = wById(UI.wId); if (!w) return '';
  return `<h2>Edit session</h2><label class="field">Name<input id="we-name" value="${esc(w.name)}"></label><label class="field">Date<input id="we-date" type="date" value="${w.date}"></label>
    <button class="btn primary big" data-act="we-save">Save</button>`;
}
function setNoteSheet() {
  const w = active(); const row = w && w.items[w.cur] && ensureRows(w, w.items[w.cur]).find((r) => r.id === UI.noteRow); if (!row) return '';
  return `<h2>Note for this set</h2><textarea id="sn-text" rows="3" class="note-area" placeholder="e.g. last rep was hard">${esc(row.note || '')}</textarea><button class="btn primary big" data-act="sn-save">Save note</button>`;
}

const _extraSheetHist = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'hset') return setEditSheet();
  if (name === 'w-edit') return wEditSheet();
  if (name === 'setnote') return setNoteSheet();
  return _extraSheetHist(name);
};
EXTRA_VIEWS.workout = workoutView;

/* last note left on an exercise in an earlier session */
function lastExerciseNote(exId, exceptId) {
  const ws = D.workouts.filter((w) => w.end && w.id !== exceptId).slice().sort((a, b) => b.date.localeCompare(a.date));
  for (const w of ws) { const it = (w.items || []).find((x) => x.exId === exId && x.note); if (it) return { note: it.note, date: w.date }; }
  return null;
}

document.addEventListener('change', (ev) => {
  const t = ev.target; const k = t.dataset && t.dataset.note; if (!k) return;
  const v = t.value.trim();
  if (k === 'session') { const w = active(); if (w) { w.note = v || undefined; save(); } }
  if (k === 'item') { const w = active(); const it = w && w.items[w.cur]; if (it) { it.note = v || undefined; save(); } }
  if (k === 'wsession') { const w = wById(t.dataset.w); if (w) { w.note = v || undefined; w.upd = Date.now(); save(); } }
  if (k === 'witem') {
    const w = wById(t.dataset.w); if (!w) return; w.items = w.items || [];
    let it = w.items.find((x) => x.exId === t.dataset.ex); if (!it) { it = { exId: t.dataset.ex, block: 'Added', presc: null }; w.items.push(it); }
    it.note = v || undefined; w.upd = Date.now(); save();
  }
});

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  const w = wById(UI.wId);
  switch (a) {
    case 'cal-mode': UI.calMode = b.dataset.v; render(); break;
    case 'hist-open': UI.wId = b.dataset.v; go('workout'); window.scrollTo(0, 0); break;
    case 'hset': UI.hSet = b.dataset.v; UI.sheet = 'hset'; render(); break;
    case 'hs-side': { const s = w && w.sets.find((x) => x.id === UI.hSet); if (s) { s.side = b.dataset.v; document.querySelectorAll('.sheet .side').forEach((n) => n.classList.toggle('on', n === b)); } break; }
    case 'hs-save': {
      const s = w && w.sets.find((x) => x.id === UI.hSet); if (!s) break;
      const num = (k) => { const n = $('#hs-' + k); if (!n || n.value === '') return null; return Math.max(0, Number(String(n.value).replace(',', '.')) || 0); };
      ['w', 'r', 't', 'd'].forEach((k) => { if ($('#hs-' + k)) { const v = num(k); if (v == null) delete s[k]; else s[k] = v; } });
      const note = ($('#hs-note').value || '').trim(); if (note) s.note = note; else delete s.note;
      const row = (w.items || []).flatMap((it) => it.rows || []).find((r) => r.id === s.id); if (row) Object.assign(row, { w: s.w, r: s.r, t: s.t, d: s.d, side: s.side, note: s.note });
      w.upd = Date.now(); save(); UI.sheet = null; render(); toast('Set updated'); break;
    }
    case 'hs-del': ask('Delete this set?', 'Delete', () => { w.sets = w.sets.filter((x) => x.id !== UI.hSet); (w.items || []).forEach((it) => { if (it.rows) it.rows = it.rows.filter((r) => r.id !== UI.hSet); }); w.upd = Date.now(); save(); UI.sheet = null; render(); toast('Set deleted'); }); break;
    case 'hset-add': {
      if (!w) break; const ss = w.sets.filter((x) => x.exId === b.dataset.v); const last = ss[ss.length - 1] || { exId: b.dataset.v };
      const ex = D.exercises[b.dataset.v] || {}; const side = ex.uni ? (ss.filter((x) => x.side === 'L').length > ss.filter((x) => x.side === 'R').length ? 'R' : 'L') : null;
      const s = Object.assign({}, last, { id: uid(), side, ts: Date.now() }); delete s.note; delete s.feel;
      const i = w.sets.lastIndexOf(last); w.sets.splice(i >= 0 ? i + 1 : w.sets.length, 0, s); w.upd = Date.now(); save(); UI.hSet = s.id; UI.sheet = 'hset'; render(); break;
    }
    case 'hist-addex': UI.histAdd = true; UI.pq = ''; UI.pcat = null; UI.sheet = 'picker'; render(); break;
    case 'hist-del': if (!w) break; ask('Delete this session and its ' + w.sets.length + ' sets? This cannot be undone.', 'Delete', () => { D.workouts = D.workouts.filter((x) => x.id !== w.id); save(); UI.sheet = null; UI.wId = null; go('calendar'); toast('Session deleted'); }); break;
    case 'we-save': {
      if (!w) break; const name = ($('#we-name').value || '').trim(); const date = $('#we-date').value;
      if (name) w.name = name; if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { w.date = date; w.late = w.late || date !== iso(new Date(w.start)); }
      w.upd = Date.now(); save(); UI.sheet = null; render(); toast('Session updated'); break;
    }
    case 'setnote': UI.noteRow = b.dataset.id; UI.sheet = 'setnote'; render(); break;
    case 'sn-save': {
      const aw = active(); const it = aw && aw.items[aw.cur]; const row = it && ensureRows(aw, it).find((r) => r.id === UI.noteRow); if (!row) break;
      const v = ($('#sn-text').value || '').trim(); row.note = v || undefined;
      const s = aw.sets.find((x) => x.id === row.id); if (s) { if (v) s.note = v; else delete s.note; }
      save(); UI.sheet = null; render(); break;
    }
    case 'note-open': UI.noteOpen = b.dataset.v; render(); { const n = document.querySelector(`[data-note="${b.dataset.v}"]`); if (n) n.focus(); } break;
    default: break;
  }
});
/* the exercise picker adds to the past session being edited */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act="addex"]'); if (!b || !UI.histAdd || UI.view !== 'workout') return;
  ev.stopImmediatePropagation(); UI.histAdd = false;
  const w = wById(UI.wId); if (!w) return; const ex = D.exercises[b.dataset.v]; if (!ex) return;
  const s = { id: uid(), exId: ex.id, side: ex.uni ? 'L' : null, ts: Date.now() };
  if (['wr', 'bwkg', 'wd', 'wt'].includes(ex.type)) s.w = 0; if (['wr', 'bwkg', 'reps'].includes(ex.type)) s.r = 8; if (['time', 'wt'].includes(ex.type)) s.t = 30; if (ex.type === 'wd') s.d = 20;
  w.sets.push(s); w.upd = Date.now(); save(); UI.hSet = s.id; UI.sheet = 'hset'; render();
}, true);
