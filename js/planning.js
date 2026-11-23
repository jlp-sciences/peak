/* Peak — sessions planned on a day of the calendar, and sessions logged afterwards on a past day. */
function plannedFor(date) {
  return Object.values(D.planned || {}).filter((p) => p.date === date).sort((a, b) => a.created - b.created).map((p) => {
    const done = D.workouts.some((w) => w.end && w.date === date && (p.free ? w.free : (w.planId === p.planId && w.sessionId === p.sessionId)));
    return Object.assign({}, p, { done });
  });
}
function plannedName(p) {
  if (p.free) return 'Free session';
  const plan = D.plans[p.planId]; const s = plan && plan.sessions.find((x) => x.id === p.sessionId);
  return s ? s.name + (s.title ? ' — ' + s.title : '') : 'Removed session';
}
function startAttrs(p, date) {
  if (p.free) return `data-act="free"${date ? ` data-date="${date}"` : ''}`;
  return `data-act="start" data-plan="${p.planId}" data-s="${p.sessionId}"${date ? ` data-date="${date}"` : ''}`;
}
function plannedHero(list) {
  const p = list[0]; const plan = D.plans[p.planId]; const s = plan && plan.sessions.find((x) => x.id === p.sessionId);
  let info = '';
  if (s) { const items = buildItems(plan, s, {}); info = `<p class="muted">~${s.minutes || 45} min · ${items.length} exercises${plan.id !== D.settings.activePlan ? ' · ' + esc(plan.name) : ''}</p><div class="chips">${catChips(items)}</div>`; }
  return `<section class="card hero planned-hero"><span class="eyebrow"><i class="ring"></i> PLANNED TODAY</span><h2>${esc(plannedName(p))}</h2>${info}
    ${list.length > 1 ? `<p class="soft sm">Also planned: ${list.slice(1).map((x) => esc(plannedName(x))).join(', ')}</p>` : ''}
    <button class="btn primary big" ${startAttrs(p)}>Start</button>
    <button class="btn ghost" data-act="sheet" data-v="pick">Pick another session of this week</button></section>`;
}
function plannedDayHTML(date) {
  const today = iso(); const list = plannedFor(date);
  const rows = list.map((p) => {
    const state = p.done ? '<span class="tag ok">Done</span>' : date < today ? '<span class="tag">Not done</span>' : '<span class="tag">Planned</span>';
    const act = p.done ? '' : date === today ? `<button class="btn small primary" ${startAttrs(p)}>Start</button>` : date < today ? `<button class="btn small outline" ${startAttrs(p, date)}>Log it</button>` : '';
    return `<div class="plan-row"><i class="ring${date < today && !p.done ? ' past' : ''}"></i><span class="grow"><b>${esc(plannedName(p))}</b></span>${state}${act}<button class="icon-btn sm" aria-label="Remove ${esc(plannedName(p))} from this day" data-act="plan-del" data-v="${p.id}">${svg('close', 16)}</button></div>`;
  }).join('');
  const btns = (date >= today ? `<button class="btn outline" data-act="plan-open" data-v="plan">${svg('plus', 18, 2)} Plan a session</button>` : '')
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

const _extraSheetPlanning = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'plan-day' || name === 'log-day') return planDaySheet(name);
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
  if (a === 'plan-del') { const p = D.planned && D.planned[b.dataset.v]; if (!p) return; delete D.planned[b.dataset.v]; save(); render(); toast('Removed from ' + shortDate(p.date)); }
});
