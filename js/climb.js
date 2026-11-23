/* Peak — the climber. Metres come from the work done; they climb real summits, three expeditions long.
   Worked out from the logged data like the trophies. Only the climber's name is stored (settings). */

const EXPEDITIONS = [
  { name: 'Expedition 1', title: 'The 7 summits of Peak', base: 0, peaks: [['Puy de Dôme', 1465, 'Hiking boots'], ['Pic du Midi de Bigorre', 2877, 'Backpack'], ['Aneto', 3404, 'Trekking poles'], ['Mont Blanc', 4806, 'Ice axe and crampons'], ['Kilimanjaro', 5895, 'Down jacket'], ['Aconcagua', 6961, 'Helmet and goggles'], ['Everest', 8849, 'Summit flag and gold outfit']] },
  { name: 'Expedition 2', title: 'Finish the Seven Summits', base: 0, peaks: [['Kosciuszko', 2228, 'Bush hat'], ['Puncak Jaya', 4884, 'Climbing rope'], ['Vinson', 4892, 'Polar suit'], ['Elbrus', 5642, 'Wool beanie'], ['Denali', 6190, 'Seven Summits badge and red outfit']] },
  { name: 'Expedition 3', title: 'The 8,000ers', base: 5000, peaks: [['Shishapangma', 8027, 'Prayer flags'], ['Gasherbrum II', 8035, 'Bivouac'], ['Broad Peak', 8051, 'Glacier glasses'], ['Gasherbrum I', 8080, 'Karakoram outfit colour'], ['Annapurna', 8091, 'Annapurna outfit colour'], ['Nanga Parbat', 8126, 'Technical ice axe'], ['Manaslu', 8163, 'Oxygen mask'], ['Dhaulagiri', 8167, 'Climbing ladder'], ['Cho Oyu', 8188, 'Altitude tent'], ['Makalu', 8485, 'Altitude gloves'], ['Lhotse', 8516, 'Head torch'], ['Kangchenjunga', 8586, '8,000 m suit'], ['K2', 8611, '14 × 8,000 badge, black and gold outfit']] }
];
const PEAKS = EXPEDITIONS.flatMap((e, ei) => e.peaks.map(([name, alt, gear], pi) => ({ name, alt, gear, ei, pi, need: alt - e.base, base: e.base })));
let acc = 0; PEAKS.forEach((p) => { p.from = acc; acc += p.need; p.to = acc; });
const CLIMB_SEEN = 'peak.climb.v1';

function climbStats(ws, perW) {
  perW = perW || {};
  const evs = []; const eras = erasList().map((e) => evalEra(e, ws));
  const hot = [].concat(...eras.map((r) => r.rawHot || [])).sort((a, b) => a[0].localeCompare(b[0]));
  const streakAt = (d) => { let v = 0; hot.forEach(([dd, s]) => { if (dd <= d) v = s; }); return v; };
  ws.forEach((w) => {
    const pct = w.pct != null ? w.pct : 100;
    const m = (100 * pct / 100 + (pct >= 100 ? 30 : 0) + Math.min(4, perW[w.id] || 0) * 25) * (1 + Math.min(0.5, 0.05 * streakAt(w.date)));
    evs.push([w.date, m, w.id]);
  });
  eras.forEach((r) => { r.stats.onTarget.forEach(([d]) => evs.push([d, 150, 'week'])); r.stats.months.forEach(([d]) => evs.push([d, 400, 'month'])); });
  Object.keys(D.runs || {}).forEach((d) => evs.push([d, 40, 'run']));
  evs.sort((a, b) => a[0].localeCompare(b[0]));
  let tot = 0; const alt = evs.map(([d, m]) => [d, (tot += m)]);
  const summits = []; const expeditions = [];
  PEAKS.forEach((p, i) => { const d = dateFor(alt, p.to); if (d) { summits.push([d, i + 1]); if (p.pi === EXPEDITIONS[p.ei].peaks.length - 1) expeditions.push([d, p.ei + 1]); } });
  return { summits, expeditions, total: tot, events: evs };
}
function climbNow() {
  const A = awards(); const c = A.career.climb || { total: 0, events: [] }; const total = c.total;
  const idx = Math.min(PEAKS.length - 1, PEAKS.findIndex((p) => total < p.to) < 0 ? PEAKS.length - 1 : PEAKS.findIndex((p) => total < p.to));
  const p = PEAKS[idx]; const done = total >= PEAKS[PEAKS.length - 1].to;
  const inPeak = Math.min(p.need, Math.max(0, total - p.from));
  return { total, idx, peak: p, inPeak, frac: done ? 1 : inPeak / p.need, done, summitsDone: PEAKS.filter((x) => total >= x.to).length, c };
}
function climbGainFor(w) {
  const n = climbNow(); const m = Math.round(n.c.events.filter((e) => e[2] === w.id || (e[0] === w.date && (e[2] === 'week' || e[2] === 'month'))).reduce((s, e) => s + e[1], 0));
  if (!m) return null;
  return { m, label: n.peak.name + ' · ' + Math.round(n.inPeak + n.peak.base).toLocaleString('en') + ' / ' + n.peak.alt.toLocaleString('en') + ' m' };
}

/* ---------- drawing ---------- */
function climberSVG(gear, ei) {
  const outfit = ei >= 2 ? '#E8C35A' : ei >= 1 ? '#E35D5D' : gear >= 7 ? '#F2C14E' : gear >= 5 ? '#5EA2FF' : '#C9D0DB';
  let s = '';
  if (gear >= 2) s += '<rect x="-11" y="-30" width="9" height="13" rx="3" fill="#8A6B3A"/>';
  s += `<line x1="0" y1="-28" x2="0" y2="-12" stroke="${outfit}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<circle cx="1" cy="-35" r="5" fill="#E6C3A0"/>`;
  if (gear >= 6) s += '<path d="M-5 -37 a6 6 0 0 1 12 0 z" fill="#F2C14E"/>';
  s += `<line x1="0" y1="-12" x2="-5" y2="0" stroke="${outfit}" stroke-width="3.5" stroke-linecap="round" class="leg-a"/><line x1="0" y1="-12" x2="5" y2="-1" stroke="${outfit}" stroke-width="3.5" stroke-linecap="round" class="leg-b"/>`;
  s += `<line x1="0" y1="-24" x2="7" y2="-17" stroke="${outfit}" stroke-width="3" stroke-linecap="round"/>`;
  if (gear >= 3) s += '<line x1="7" y1="-17" x2="10" y2="1" stroke="#9AA3B2" stroke-width="1.6"/>';
  if (gear >= 4) s += '<path d="M-3 -24 L-10 -16 M-12 -18 L-7 -14" stroke="#C9D0DB" stroke-width="1.8" stroke-linecap="round"/>';
  if (gear >= 1) s += '<rect x="-8" y="-2" width="6" height="3" rx="1" fill="#6B4A2A"/><rect x="2" y="-3" width="6" height="3" rx="1" fill="#6B4A2A"/>';
  return s;
}
function trail(f) { // point on the path for a fraction of the climb
  const pts = [[24, 142], [96, 118], [70, 98], [150, 76], [128, 58], [196, 40], [232, 22]];
  const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let t = Math.max(0, Math.min(1, f)) * L; for (let i = 0; i < seg.length; i++) { if (t <= seg[i]) { const k = t / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } t -= seg[i]; }
  return pts[pts.length - 1];
}
function climbCardHTML(full) {
  const n = climbNow(); const p = n.peak; const exp = EXPEDITIONS[p.ei];
  const gear = p.ei === 0 ? n.summitsDone : 7; const name = (D.settings.climberName || 'Your climber');
  const seen = readClimbSeen(); const fromF = seen && seen.idx === n.idx && seen.total < n.total ? seen.frac : n.frac;
  const [x, y] = trail(fromF); const camps = [0.25, 0.5, 0.75].map((f, i) => { const [cx, cy] = trail(f); return `<g class="camp${n.frac >= f ? ' on' : ''}" transform="translate(${cx} ${cy})"><path d="M-7 0 L0 -10 L7 0 Z" fill="${n.frac >= f ? '#FF9E4A' : '#3A404B'}"/><text x="10" y="-2" class="camp-t">C${i + 1}</text></g>`; }).join('');
  const hues = ['#2E6B4F', '#2C5C8F', '#4B4796'][p.ei];
  const svgScene = `<svg class="climb-scene" viewBox="0 0 340 150" role="img" aria-label="${esc(name)} on ${esc(p.name)}, ${Math.round(n.frac * 100)} % of the climb">
    <path d="M0 150 L70 96 L110 112 L180 52 L232 18 L290 70 L340 60 L340 150 Z" fill="${hues}" opacity=".55"/>
    <path d="M0 150 L120 104 L232 18 L340 120 L340 150 Z" fill="${hues}"/>
    <path d="M212 34 L232 18 L252 34 L240 30 L232 38 L224 30 Z" fill="#F1EFE8"/>
    <path d="M24 142 L96 118 L70 98 L150 76 L128 58 L196 40 L232 22" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-dasharray="3 5"/>
    ${camps}
    <g class="flag${n.frac >= 1 ? ' on' : ''}"><line x1="232" y1="18" x2="232" y2="2" stroke="#C9D0DB" stroke-width="2"/><path d="M232 2 L246 6 L232 10 Z" fill="${n.frac >= 1 ? '#E35D5D' : '#4B5260'}"/></g>
    <ellipse class="cloud c1" cx="290" cy="28" rx="26" ry="8" fill="rgba(255,255,255,.12)"/><ellipse class="cloud c2" cx="60" cy="40" rx="30" ry="9" fill="rgba(255,255,255,.08)"/>
    <g class="climber" data-to="${n.frac}" style="transform:translate(${x}px,${y}px)">${climberSVG(gear, p.ei)}</g>
  </svg>`;
  const nextGear = p.ei === 0 ? p.gear : p.gear;
  const list = full ? `<div class="peaks">${EXPEDITIONS.map((e, ei) => `<span class="eyebrow">${esc(e.name.toUpperCase())} · ${esc(e.title.toUpperCase())}</span>${e.peaks.map(([nm, alt, g], pi) => { const P = PEAKS.find((q) => q.ei === ei && q.pi === pi); const st = n.total >= P.to ? 'done' : P === p ? 'cur' : ''; return `<div class="peak-row ${st}"><span class="pk-dot">${st === 'done' ? svg('check', 12, 3) : ''}</span><span class="grow"><b>${esc(nm)}</b><small>${alt.toLocaleString('en')} m · ${esc(g)}</small></span>${st === 'cur' ? `<span class="muted sm">${Math.round(n.frac * 100)} %</span>` : ''}</div>`; }).join('')}`).join('')}</div>` : '';
  return `<section class="card climb-card"><div class="row between"><span class="eyebrow">${esc(exp.name.toUpperCase())} · ${p.pi + 1}/${exp.peaks.length}</span><button class="link" data-act="sheet" data-v="climber">${esc(name)} ✎</button></div>
    ${svgScene}
    <div class="row between"><span><b>${esc(p.name)}</b> <span class="muted sm">${Math.round(n.inPeak + p.base).toLocaleString('en')} / ${p.alt.toLocaleString('en')} m</span></span><span class="muted sm">${Math.round(n.total).toLocaleString('en')} m climbed</span></div>
    <div class="bar"><i style="width:${Math.round(n.frac * 100)}%"></i></div>
    <p class="muted sm">${n.done ? 'Every expedition complete.' : 'At the summit: ' + esc(nextGear) + '.'}${full ? '' : ' <button class="link" data-act="go" data-v="progress">All summits ›</button>'}</p>${list}</section>`;
}

/* ---------- animations: walk up, camps, summit pop ---------- */
function readClimbSeen() { try { return JSON.parse(localStorage.getItem(CLIMB_SEEN)); } catch (e) { return null; } }
function climbAfterRender() {
  const n = climbNow(); const seen = readClimbSeen();
  const el = document.querySelector('.climber');
  if (el && seen && seen.idx === n.idx && seen.total < n.total) {
    const [x, y] = trail(n.frac); setTimeout(() => { el.classList.add('walking'); el.style.transform = `translate(${x}px,${y}px)`; setTimeout(() => el.classList.remove('walking'), 1600); }, 300);
    [0.25, 0.5, 0.75].forEach((f, i) => { if (seen.frac < f && n.frac >= f) setTimeout(() => { const c = document.querySelectorAll('.camp')[i]; if (c) c.classList.add('pitch'); toast('Camp ' + (i + 1) + ' reached on ' + n.peak.name); }, 1500); });
  }
  if (seen && n.summitsDone > (seen.summits || 0) && typeof POP !== 'undefined') {
    for (let i = seen.summits || 0; i < n.summitsDone; i++) POP.queue.push({ summit: PEAKS[i] });
    if (typeof showNextPop === 'function') showNextPop();
  }
  if (!seen || seen.total !== n.total) { try { localStorage.setItem(CLIMB_SEEN, JSON.stringify({ total: n.total, idx: n.idx, frac: n.frac, summits: n.summitsDone })); } catch (e) { /* ignore */ } }
}
function summitPopHTML(P) {
  const exp = EXPEDITIONS[P.ei]; const last = P.pi === exp.peaks.length - 1;
  return `<div class="award-card"><div class="award-face summit-face"><svg viewBox="0 0 200 110" width="200" height="110" aria-hidden="true"><path d="M10 105 L100 18 L190 105 Z" fill="#2C5C8F"/><path d="M84 34 L100 18 L116 34 L106 31 L100 38 L94 31 Z" fill="#F1EFE8"/><g class="plant"><line x1="100" y1="18" x2="100" y2="-4" stroke="#C9D0DB" stroke-width="3"/><path d="M100 -4 L122 2 L100 8 Z" fill="#E35D5D"/></g><ellipse class="cl l" cx="40" cy="40" rx="34" ry="10" fill="rgba(255,255,255,.35)"/><ellipse class="cl r" cx="160" cy="34" rx="34" ry="10" fill="rgba(255,255,255,.35)"/></svg>
    <span class="eyebrow">${last ? esc(exp.name.toUpperCase()) + ' COMPLETE' : 'SUMMIT REACHED'}</span><h2>${esc(P.name)}</h2><p class="soft">${P.alt.toLocaleString('en')} m</p>
    <div class="gear-drop"><span class="bag"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7V5a4 4 0 0 1 8 0v2"/><rect x="5" y="7" width="14" height="14" rx="4"/><path d="M9 14h6"/></svg></span><span><small class="muted">New gear</small><b>${esc(P.gear)}</b></span></div>
    <button class="btn primary big" data-pop="ok">Onwards</button></div></div>${confettiHTML()}`;
}
const _extraSheetClimb = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'climber') return `<h2>Your climber</h2><label class="field">Name<input id="cl-name" type="text" maxlength="24" value="${esc(D.settings.climberName || '')}" placeholder="Give your climber a name"></label><button class="btn primary big" data-act="climber-save">Save</button>`;
  return _extraSheetClimb(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'climber-save') { const v = ($('#cl-name').value || '').trim(); D.settings.climberName = v; D.settings.upd = Date.now(); UI.sheet = null; save(); render(); toast(v ? v + ' is ready to climb' : 'Name cleared'); }
});
