/* Peak — sessions planned on a day of the calendar, and sessions logged afterwards on a past day. */
function plannedFor(date) {
  return Object.values(D.planned || {}).filter((p) => p.date === date).sort((a, b) => a.created - b.created).map((p) => {
    const done = D.workouts.some((w) => w.end && w.date === date && (p.copy ? w.copyOf === p.id : p.free ? w.free && !w.copyOf : (w.planId === p.planId && w.sessionId === p.sessionId)));
    return Object.assign({}, p, { done });
  });
}
function plannedName(p) {
  if (p.copy) return p.copy.name;
  if (p.free) return 'Free session';
  const plan = D.plans[p.planId]; const s = plan && plan.sessions.find((x) => x.id === p.sessionId);
  return s ? s.name + (s.title ? ' — ' + s.title : '') : 'Removed session';
}
function startAttrs(p, date) {
  if (p.copy) return `data-act="start-copy" data-v="${p.id}"${date ? ` data-date="${date}"` : ''}`;
  if (p.free) return `data-act="free"${date ? ` data-date="${date}"` : ''}`;
  return `data-act="start" data-plan="${p.planId}" data-s="${p.sessionId}"${date ? ` data-date="${date}"` : ''}`;
}
function plannedHero(list) {
  const p = list[0]; const plan = D.plans[p.planId]; const s = plan && plan.sessions.find((x) => x.id === p.sessionId);
  let info = '';
  if (p.copy) info = `<p class="muted">Copy of ${esc(longDate(p.copy.from))} · ${p.copy.items.length} exercises · weights pre-filled</p><div class="chips">${catChips(p.copy.items)}</div>`;
  else if (s) { const items = buildItems(plan, s, {}); info = `<p class="muted">~${s.minutes || 45} min · ${items.length} exercises${plan.id !== D.settings.activePlan ? ' · ' + esc(plan.name) : ''}</p><div class="chips">${catChips(items)}</div>`; }
  return `<section class="card hero planned-hero" data-lpp="1"><div class="row between"><span class="eyebrow"><i class="ring"></i> PLANNED TODAY</span><button class="icon-btn sm" aria-label="Skip or move the planned session" data-act="sheet" data-v="p-menu">✕</button></div><h2>${esc(plannedName(p))}</h2>${info}
    ${list.length > 1 ? `<p class="soft sm">Also planned: ${list.slice(1).map((x) => esc(plannedName(x))).join(', ')}</p>` : ''}
    <button class="btn primary big" ${startAttrs(p)}>Start</button>
    <button class="btn ghost" data-act="sheet" data-v="pick">Pick another session of this week</button><p class="muted sm center">Long press or ✕ to skip or move it.</p></section>`;
}
function plannedDayHTML(date) {
  const today = iso(); const list = plannedFor(date);
  const rows = list.map((p) => {
    const state = p.done ? '<span class="tag ok">Done</span>' : date < today ? '<span class="tag">Not done</span>' : '<span class="tag">Planned</span>';
    const act = p.done ? '' : date === today ? `<button class="btn small primary" ${startAttrs(p)}>Start</button>` : date < today ? `<button class="btn small outline" ${startAttrs(p, date)}>Log it</button>` : '';
    return `<div class="plan-row"><i class="ring${date < today && !p.done ? ' past' : ''}"></i><span class="grow"><b>${esc(plannedName(p))}</b></span>${state}${act}<button class="icon-btn sm" aria-label="Remove ${esc(plannedName(p))} from this day" data-act="plan-del" data-v="${p.id}">${svg('close', 16)}</button></div>`;
  }).join('');
  const hasAny = list.length || D.workouts.some((w) => w.end && w.date === date && !w.mob);
  const btns = (date >= today ? `<button class="btn outline" data-act="plan-open" data-v="plan">${svg('plus', 18, 2)} Plan a session</button>` : '')
    + (hasAny ? `<button class="btn outline" data-act="sheet" data-v="copy-day">${svg('copy', 18, 2)} Copy this day to…</button>` : '')
    + (date <= today && date !== today ? `<button class="btn outline" data-act="plan-open" data-v="log">${svg('plus', 18, 2)} Log a past session</button>` : '');
  return `${rows ? `<div class="plan-list">${rows}</div>` : ''}<div class="row wrap">${btns}</div>`;
}
function planDaySheet(mode) {
  const date = UI.calSel || iso(); const day = longDate(date);
  if (mode === 'plan-day') {
    const groups = Object.values(D.plans).sort((a, b) => (a.id === D.settings.activePlan ? -1 : b.id === D.settings.activePlan ? 1 : 0)).map((pl) => `<span class="eyebrow">${esc(pl.name.toUpperCase())}</span>${pl.sessions.map((s) => `<button class="list-btn" data-act="plan-add" data-plan="${pl.id}" data-s="${s.id}"><span><b>${esc(s.name)}${s.title ? ' — ' + esc(s.title) : ''}</b><small>${s.required ? 'Required' : 'Optional'} · ~${s.minutes || 45} min</small></span></button>`).join('')}`).join('');
    return `<h2>Plan for ${esc(day)}</h2>${groups}<button class="list-btn" data-act="plan-add" data-free="1"><span><b>Free session</b><small>Pick exercises as you go</small></span></button>`;
  }
  const plan = activePlan();
  return `<h2>Log a session on ${esc(day)}</h2><p class="muted sm">For a session you forgot to record. It counts on that date.</p>
    ${plan.sessions.map((s) => `<button class="list-btn" data-act="start" data-plan="${plan.id}" data-s="${s.id}" data-date="${date}"><span><b>${esc(s.name)}${s.title ? ' — ' + esc(s.title) : ''}</b><small>${esc(plan.name)}</small></span></button>`).join('')}
    <button class="list-btn" data-act="free" data-date="${date}"><span><b>Free session</b><small>Pick exercises as you go</small></span></button>`;
}

/* ---------- copy a day ---------- */
const dateChips = (act) => { const t = iso(); return [['Today', t], ['Tomorrow', addDays(t, 1)], ['In 2 days', addDays(t, 2)], ['In a week', addDays(t, 7)]].map(([l, d]) => `<button class="chip-btn" data-act="${act}" data-v="${d}">${l}<small> · ${shortDate(d)}</small></button>`).join(''); };
function copyDaySheet() {
  const from = UI.calSel || iso(); const ws = D.workouts.filter((w) => w.end && w.date === from && !w.mob); const pl = plannedFor(from).filter((p) => !p.done);
  return `<h2>Copy ${esc(longDate(from))}</h2>
    <p class="muted sm">${[...ws.map((w) => esc(w.name.split(' — ')[0])), ...pl.map((p) => esc(plannedName(p)))].join(' · ')}</p>
    <p class="soft sm">Everything is copied — exercises, sets, weights, notes — as sessions to do on the new day, with the weights pre-filled.</p>
    <div class="why-opts">${dateChips('copy-go')}</div>
    <label class="field">Or pick a date<input type="date" id="copy-date" value="${addDays(iso(), 1)}"></label>
    <button class="btn primary big" data-act="copy-go">Copy</button>`;
}
function copySessionOf(w) {
  return { from: w.date, name: w.name.split(' — ')[0] + (w.name.includes(' — ') ? ' — ' + w.name.split(' — ')[1] : ''), planId: w.planId || null, sessionId: w.sessionId || null, note: w.note || '',
    items: w.items.map((it) => { const ex = D.exercises[it.exId] || {}; const sets = w.sets.filter((x) => x.exId === it.exId);
      const rows = (sets.length ? sets : (it.rows || [])).map((x) => ({ side: x.side, w: x.w, r: x.r, t: x.t, d: x.d, note: x.note }));
      return { exId: it.exId, block: it.block, presc: it.presc || null, note: it.note || '', rows, cat: ex.cat }; }).filter((it) => D.exercises[it.exId]) };
}
function copyDay(from, to) {
  if (!to || to === from) { toast('Pick another day'); return 0; }
  D.planned = D.planned || {}; let n = 0; const now = Date.now();
  D.workouts.filter((w) => w.end && w.date === from && !w.mob).forEach((w, i) => { const id = uid(); D.planned[id] = { id, date: to, copy: copySessionOf(w), created: now + i, upd: now }; n++; });
  plannedFor(from).filter((p) => !p.done).forEach((p, i) => { const id = uid(); const c = JSON.parse(JSON.stringify(p)); delete c.done; D.planned[id] = Object.assign(c, { id, date: to, created: now + 50 + i, upd: now }); n++; });
  return n;
}
function startCopy(p, date) {
  if (active()) { go('session'); return; }
  const c = p.copy; startWorkout(c.planId && D.plans[c.planId] ? c.planId : null, c.planId && D.plans[c.planId] ? c.sessionId : null, { date: date || null });
  const w = active(); if (!w) return;
  w.items = c.items.map((it) => ({ exId: it.exId, block: it.block, presc: it.presc, note: it.note || undefined, rows: it.rows.length ? it.rows.map((r) => ({ id: uid(), side: r.side, w: r.w, r: r.r, t: r.t, d: r.d, note: r.note, done: false })) : undefined }));
  w.items.forEach((it) => { if (!it.note) delete it.note; if (!it.rows) delete it.rows; });
  Object.assign(w, { name: c.name, copyOf: p.id, cur: 0 }); if (c.note) w.note = c.note;
  save(); render();
}
/* ---------- skip or move a planned session from Today ---------- */
function plannedMenuSheet() {
  const list = plannedFor(iso()).filter((p) => !p.done);
  if (!list.length) return '<h2>Nothing planned today</h2>';
  return `<h2>Planned today</h2>${list.map((p) => `<div class="pm-row"><b>${esc(plannedName(p))}</b><div class="row gap"><button class="btn outline" data-act="p-skip" data-v="${p.id}">Skip today</button><button class="btn outline" data-act="p-move" data-v="${p.id}">Move to…</button></div></div>`).join('')}
    <p class="muted sm">Skipping only removes it from today: nothing is ticked in your plan week.</p>`;
}
function plannedMoveSheet() {
  const p = D.planned && D.planned[UI.pMove]; if (!p) return '';
  return `<h2>Move ${esc(plannedName(p))}</h2><div class="why-opts">${dateChips('p-move-go')}</div>
    <label class="field">Or pick a date<input type="date" id="move-date" value="${addDays(iso(), 1)}"></label><button class="btn primary big" data-act="p-move-go">Move</button>`;
}
const _extraSheetPlanning = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'plan-day' || name === 'log-day') return planDaySheet(name);
  if (name === 'copy-day') return copyDaySheet();
  if (name === 'p-menu') return plannedMenuSheet();
  if (name === 'p-move') return plannedMoveSheet();
  return _extraSheetPlanning(name);
};

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'plan-open') { UI.sheet = b.dataset.v === 'plan' ? 'plan-day' : 'log-day'; render(); return; }
  if (a === 'plan-add') {
    const date = UI.calSel || iso(); const id = uid();
    const p = b.dataset.free ? { id, date, free: true, created: Date.now(), upd: Date.now() } : { id, date, planId: b.dataset.plan, sessionId: b.dataset.s, created: Date.now(), upd: Date.now() };
    D.planned = D.planned || {}; D.planned[id] = p; UI.calPop = date; UI.sheet = null;
    save(); render(); toast(plannedName(p) + ' planned for ' + shortDate(date));
    setTimeout(() => { UI.calPop = null; }, 600);
    return;
  }
  if (a === 'copy-go') { const from = UI.calSel || iso(); const to = b.dataset.v || ($('#copy-date') && $('#copy-date').value); const n = copyDay(from, to); if (n) { UI.sheet = null; UI.calSel = to; UI.calMonth = to.slice(0, 7); save(); render(); toast(n + ' session' + (n > 1 ? 's' : '') + ' copied to ' + shortDate(to)); } return; }
  if (a === 'start-copy') { const p = D.planned && D.planned[b.dataset.v]; if (p) { UI.sheet = null; startCopy(p, b.dataset.date); } return; }
  if (a === 'p-skip') { const p = D.planned && D.planned[b.dataset.v]; if (!p) return; ask('Skip ' + plannedName(p) + ' today?', 'Skip', () => { delete D.planned[p.id]; save(); UI.sheet = null; render(); toast('Skipped — still to do this week'); }); return; }
  if (a === 'p-move') { UI.pMove = b.dataset.v; UI.sheet = 'p-move'; render(); return; }
  if (a === 'p-move-go') { const p = D.planned && D.planned[UI.pMove]; const to = b.dataset.v || ($('#move-date') && $('#move-date').value); if (!p || !to) return; p.date = to; p.upd = Date.now(); UI.pMove = null; UI.sheet = null; save(); render(); toast(plannedName(p) + ' moved to ' + shortDate(to)); return; }
  if (a === 'plan-del') { const p = D.planned && D.planned[b.dataset.v]; if (!p) return; delete D.planned[b.dataset.v]; save(); render(); toast('Removed from ' + shortDate(p.date)); }
});

/* long press on the planned card of Today */
(() => { let t = null;
  document.addEventListener('pointerdown', (ev) => { const c = ev.target.closest && ev.target.closest('[data-lpp]'); clearTimeout(t); if (!c || UI.view !== 'today' || ev.target.closest('button')) return;
    t = setTimeout(() => { UI.sheet = 'p-menu'; try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* no vibration */ } render(); }, 480); });
  ['pointerup', 'pointercancel', 'pointermove'].forEach((n) => document.addEventListener(n, (ev) => { if (n !== 'pointermove' || Math.abs(ev.movementX) + Math.abs(ev.movementY) > 6) clearTimeout(t); }));
})();
