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
/* ---------- style A climber: clothes and gear follow the summits reached ---------- */
function lookOf(n) {
  const out = (c, d) => ({ jacket: c, jd: d });
  let o = out('#5EA2FF', '#3F82DE');
  if (n >= 5) o = out('#E35D5D', '#C94848');
  if (n >= 7) o = out('#F2C14E', '#D9A72E');
  if (n >= 12) o = out('#B3263A', '#8C1C2D');
  if (n >= 16) o = out('#2DD4BF', '#1A9E8C');
  if (n >= 17) o = out('#C084FC', '#9A5FD8');
  if (n >= 24) o = out('#F2C14E', '#2A2A2E');
  if (n >= 25) o = out('#1F1F23', '#F2C14E');
  return Object.assign(o, { boots: n >= 1, pack: n >= 2, poles: n >= 3, axe: n >= 4, helmet: n >= 6, skin: '#E8BE96', pants: '#2B3A55', pants2: '#34466A', boot: n >= 1 ? '#6B4A2A' : '#9AA3B2', packC: '#FF9E4A', pp: '#D97B2E' });
}
function climberA(pose, L) {
  const leg = (cls, col, dx, dy) => `<g class="${cls}"><line x1="0" y1="0" x2="${dx / 2}" y2="17" stroke="${col}" stroke-width="8" stroke-linecap="round"/><line x1="${dx / 2}" y1="17" x2="${dx}" y2="${dy || 32}" stroke="${col}" stroke-width="7" stroke-linecap="round"/><rect x="${dx - 6}" y="${(dy || 32) - 2}" width="${L.boots ? 14 : 12}" height="${L.boots ? 6 : 5}" rx="3" fill="${L.boot}"/></g>`;
  const pack = L.pack ? `<rect x="-21" y="-33" width="14" height="27" rx="5" fill="${L.packC}"/><rect x="-19" y="-18" width="10" height="8" rx="2" fill="${L.pp}"/><rect x="-23" y="-9" width="18" height="5" rx="2.5" fill="#5EA2FF"/>${L.axe && pose !== 'sum' ? '<path d="M-14 -40 L-14 -6 M-20 -40 L-8 -38" stroke="#C9D0DB" stroke-width="2.2" stroke-linecap="round"/>' : ''}` : '';
  const torso = `<polygon points="-8,-32 8,-33 10,1 -7,2" fill="${L.jacket}"/><polygon points="-8,-32 -3,-32 -2,1 -7,2" fill="${L.jd}"/><line x1="2" y1="-31" x2="3" y2="0" stroke="${L.jd}" stroke-width="1.3"/>`;
  const hat = L.helmet ? '<path d="M-9,-45 a10,10 0 0 1 20,0 z" fill="#F1EFE8"/><rect x="-9" y="-47" width="21" height="4" rx="2" fill="#FF9E4A"/><rect x="2" y="-48" width="9" height="5" rx="2" fill="#5C7FD1"/>' : '<path d="M-8,-46 a9,9 0 0 1 18,0 z" fill="#E35D5D"/><rect x="-9" y="-49" width="20" height="4" rx="2" fill="#C94848"/><circle cx="1" cy="-56" r="3.2" fill="#F1EFE8"/>';
  const head = (face) => `<rect x="-2" y="-40" width="6" height="8" fill="${L.skin}"/><circle cx="1" cy="-45" r="9" fill="${L.skin}"/>${hat}${face}`;
  if (pose === 'walk') return `<g class="bob">${leg('lb', L.pants, -6)}${pack}${torso}${leg('lf', L.pants2, 7, 30)}<g class="arm"><line x1="5" y1="-28" x2="12" y2="-16" stroke="${L.jacket}" stroke-width="6" stroke-linecap="round"/><line x1="12" y1="-16" x2="18" y2="-21" stroke="${L.jd}" stroke-width="5" stroke-linecap="round"/>${L.poles ? '<line x1="19" y1="-25" x2="27" y2="34" stroke="#C9D0DB" stroke-width="2"/>' : ''}<circle cx="18" cy="-21" r="3.5" fill="${L.pants}"/></g>${head('<circle cx="6" cy="-44" r="1.3" fill="#2B2B2B"/><path d="M5,-40 q2,1 4,-1" stroke="#9A5B3C" stroke-width="1.1" fill="none"/>')}</g>`;
  if (pose === 'rest') return `${pack}<g class="breathe">${torso}</g><line x1="0" y1="0" x2="16" y2="-1" stroke="${L.pants}" stroke-width="8" stroke-linecap="round"/><line x1="16" y1="-1" x2="18" y2="14" stroke="${L.pants}" stroke-width="7" stroke-linecap="round"/><rect x="13" y="12" width="14" height="6" rx="3" fill="${L.boot}"/><line x1="5" y1="-28" x2="12" y2="-12" stroke="${L.jacket}" stroke-width="6" stroke-linecap="round"/><line x1="12" y1="-12" x2="20" y2="-8" stroke="${L.jd}" stroke-width="5" stroke-linecap="round"/><rect x="18" y="-14" width="7" height="8" rx="2" fill="#F1EFE8"/><path class="steam" d="M20,-17 q2,-4 0,-7 M23,-17 q2,-4 0,-7" stroke="rgba(255,255,255,.5)" stroke-width="1.2" fill="none"/>${head('<path d="M4,-45 q2,1.5 4,0" stroke="#2B2B2B" stroke-width="1.3" fill="none"/><path d="M5,-40 q2,1 4,0" stroke="#9A5B3C" stroke-width="1.1" fill="none"/>')}`;
  return `<g class="hop">${leg('', L.pants, -5)}${pack}${torso}${leg('', L.pants2, 6)}<g class="armL"><line x1="-6" y1="-28" x2="-14" y2="-46" stroke="${L.jacket}" stroke-width="6" stroke-linecap="round"/><line x1="-14" y1="-46" x2="-16" y2="-62" stroke="${L.jd}" stroke-width="5" stroke-linecap="round"/><circle cx="-16" cy="-63" r="3.5" fill="${L.pants}"/></g><g class="armR"><line x1="6" y1="-28" x2="16" y2="-46" stroke="${L.jacket}" stroke-width="6" stroke-linecap="round"/><line x1="16" y1="-46" x2="19" y2="-62" stroke="${L.jd}" stroke-width="5" stroke-linecap="round"/>${L.axe ? '<line x1="19" y1="-66" x2="19" y2="-56" stroke="#C9D0DB" stroke-width="2.5"/><path d="M14,-67 L25,-69" stroke="#C9D0DB" stroke-width="3" stroke-linecap="round"/>' : '<circle cx="19" cy="-63" r="3.5" fill="' + L.pants + '"/>'}</g>${head('<path d="M3,-45 q2,-2 4,0" stroke="#2B2B2B" stroke-width="1.3" fill="none"/><path d="M3,-41 q3,4 6,0 z" fill="#7A3B2A"/>')}</g>`;
}
function trail(f) { // point on the path for a fraction of the climb
  const pts = [[24, 142], [96, 118], [70, 98], [150, 76], [128, 58], [196, 40], [232, 22]];
  const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let t = Math.max(0, Math.min(1, f)) * L; for (let i = 0; i < seg.length; i++) { if (t <= seg[i]) { const k = t / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } t -= seg[i]; }
  return pts[pts.length - 1];
}
const SKIES = ['#1B2433', '#1C2240', '#231B36'];
function climbPose(n) {
  if (n.done) return 'sum';
  const last = D.workouts.filter((w) => w.end).map((w) => w.date).sort().pop();
  return !last || daysBetween(last, iso()) >= 4 ? 'rest' : 'walk';
}
function climbCardHTML(full) {
  const n = climbNow(); const p = n.peak; const exp = EXPEDITIONS[p.ei];
  const name = (D.settings.climberName || 'Your climber'); const L = lookOf(n.summitsDone); const pose = climbPose(n);
  const seen = readClimbSeen(); const fromF = seen && seen.idx === n.idx && seen.total < n.total ? seen.frac : n.frac;
  const [x, y] = trail(fromF); const sc = 0.6;
  const camps = [0.25, 0.5, 0.75].map((f, i) => { const [cx, cy] = trail(f); return `<g class="camp${n.frac >= f ? ' on' : ''}" transform="translate(${cx} ${cy})"><path d="M-7 0 L0 -10 L7 0 Z" fill="${n.frac >= f ? '#FF9E4A' : '#3A404B'}"/><text x="10" y="-2" class="camp-t">C${i + 1}</text></g>`; }).join('');
  const hues = ['#2E6B4F', '#2C5C8F', '#4B4796'][p.ei];
  const restProps = pose === 'rest' ? `<g transform="translate(${x + 26} ${y + 1})"><path d="M-12 0 L0 -16 L12 0 Z" fill="#FF9E4A"/><path d="M-3 0 L0 -7 L3 0 Z" fill="#D97B2E"/></g><g transform="translate(${x - 22} ${y})"><path class="fire" d="M-4 0 L0 -8 L4 0 Z" fill="#FAC775"/><path d="M-2 0 L0 -4 L2 0 Z" fill="#E35D5D"/></g>` : '';
  const svgScene = `<svg class="climb-scene" viewBox="0 0 340 150" role="img" aria-label="${esc(name)} on ${esc(p.name)}, ${Math.round(n.frac * 100)} % of the climb">
    <rect width="340" height="150" fill="${SKIES[p.ei]}"/><circle cx="40" cy="20" r="1.2" fill="#C9D0DB"/><circle cx="120" cy="12" r="1" fill="#C9D0DB"/><circle cx="300" cy="22" r="1.2" fill="#C9D0DB"/><circle cx="270" cy="54" r="1" fill="#C9D0DB"/>
    <path d="M0 150 L70 96 L110 112 L180 52 L232 18 L290 70 L340 60 L340 150 Z" fill="${hues}" opacity=".5"/>
    <path d="M0 150 L120 104 L232 18 L340 120 L340 150 Z" fill="${hues}"/>
    <path d="M232 18 L340 120 L340 150 L290 150 Q270 90 232 18" fill="#000" opacity=".12"/>
    <path d="M212 34 L232 18 L252 34 L240 30 L232 38 L224 30 Z" fill="#F1EFE8"/>
    <path d="M24 142 L96 118 L70 98 L150 76 L128 58 L196 40 L232 22" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-dasharray="3 5"/>
    ${camps}
    <g class="flag${n.frac >= 1 ? ' on' : ''}"><line x1="232" y1="18" x2="232" y2="2" stroke="#C9D0DB" stroke-width="2"/><path class="flagw" d="M232 2 L246 6 L232 10 Z" fill="${n.frac >= 1 ? '#E35D5D' : '#4B5260'}"/></g>
    <ellipse class="cloud c1" cx="290" cy="30" rx="26" ry="8" fill="rgba(255,255,255,.12)"/><ellipse class="cloud c2" cx="60" cy="42" rx="30" ry="9" fill="rgba(255,255,255,.08)"/>
    ${restProps}
    <g class="climber pose-${pose}" style="transform:translate(${x}px,${y - 34 * sc}px)"><g transform="scale(${sc})">${climberA(pose, L)}</g></g>
  </svg>`;
  const status = n.done ? 'Every expedition complete.' : pose === 'rest' ? esc(name) + ' is resting at camp — a session gets them moving again.' : 'At the summit: ' + esc(p.gear) + '.';
  return `<section class="card climb-card"><div class="row between"><span class="eyebrow">${esc(exp.name.toUpperCase())} · ${p.pi + 1}/${exp.peaks.length}</span><button class="link" data-act="sheet" data-v="climber">${esc(name)} ✎</button></div>
    ${svgScene}
    <div class="row between"><span><b>${esc(p.name)}</b> <span class="muted sm">${Math.round(n.inPeak + p.base).toLocaleString('en')} / ${p.alt.toLocaleString('en')} m</span></span><span class="muted sm">${Math.round(n.total).toLocaleString('en')} m climbed</span></div>
    <div class="bar"><i style="width:${Math.round(n.frac * 100)}%"></i></div>
    <p class="muted sm">${status}${full ? '' : ' <button class="link" data-act="go" data-v="progress">Progress ›</button>'}</p></section>`;
}

/* ---------- gear: grid, detail sheet, archive of summits ---------- */
function gearGridHTML() {
  const n = climbNow();
  return EXPEDITIONS.map((e, ei) => {
    const ps = PEAKS.filter((p) => p.ei === ei); const got = ps.filter((p) => n.total >= p.to).length;
    return `<div class="eyebrow row between"><span>${esc(e.name.toUpperCase())} · ${esc(e.title.toUpperCase())}</span><span>${got}/${ps.length}</span></div><div class="gear-grid">${ps.map((p) => { const i = PEAKS.indexOf(p); const own = n.total >= p.to;
      return `<button class="gear-tile${own ? '' : ' off'}" data-act="gear" data-v="${i}" aria-label="${own ? esc(p.gear) : 'Locked: reach ' + esc(p.name)}"><span class="gear-art">${own ? gearSVG(i) : `<span class="gear-lock">${gearSVG(i)}</span><svg class="lock" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="11" width="12" height="9" rx="2" fill="currentColor" stroke="none" opacity=".35"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/></svg>`}</span><b>${own ? esc(p.gear) : esc(p.name)}</b></button>`; }).join('')}</div>`;
  }).join('');
}
function gearSheet() {
  const i = Number(UI.gearIdx); const p = PEAKS[i]; if (!p) return ''; const n = climbNow(); const own = n.total >= p.to;
  const A = awards(); const d = own ? dateFor(A.career.summits, i + 1) : null; const L = lookOf(own ? i + 1 : n.summitsDone);
  return `<div class="gear-sheet"><div class="gear-big${own ? '' : ' off'}">${gearSVG(i)}</div>
    <h2>${own ? esc(p.gear) : '???'}</h2><p class="soft">${own ? 'Earned at ' : 'Reach '}${esc(p.name)} · ${p.alt.toLocaleString('en')} m</p>
    <div class="row wrap"><span class="chip">${esc(EXPEDITIONS[p.ei].name)} · summit ${p.pi + 1}</span>${d ? `<span class="chip">${longDate(d)}</span>` : `<span class="chip">${Math.max(0, Math.round(p.to - n.total)).toLocaleString('en')} m to go</span>`}</div>
    ${own ? `<div class="gear-worn"><svg viewBox="-32 -70 64 112" width="54" height="94" aria-hidden="true">${climberA('walk', L)}</svg><span class="soft sm">${esc(D.settings.climberName || 'Your climber')} has it from now on.</span></div>` : ''}</div>`;
}
function summitsArchiveHTML() {
  const A = awards(); const n = climbNow();
  return `<span class="eyebrow">SUMMITS</span><div class="peaks">${PEAKS.map((p, i) => { const d = dateFor(A.career.summits, i + 1); const cur = !d && i === n.idx;
    return `<div class="peak-row ${d ? 'done' : cur ? 'cur' : ''}"><span class="pk-dot">${d ? svg('check', 12, 3) : ''}</span><span class="grow"><b>${esc(p.name)}</b><small>${p.alt.toLocaleString('en')} m · ${esc(EXPEDITIONS[p.ei].name)}</small></span><span class="muted sm">${d ? shortDate(d) : cur ? Math.round(n.frac * 100) + ' %' : ''}</span></div>`; }).join('')}</div>`;
}

/* ---------- animations: walk up, camps, summit pop ---------- */
function readClimbSeen() { try { return JSON.parse(localStorage.getItem(CLIMB_SEEN)); } catch (e) { return null; } }
function climbAfterRender() {
  const n = climbNow(); const seen = readClimbSeen();
  const el = document.querySelector('.climber');
  if (el && seen && seen.idx === n.idx && seen.total < n.total) {
    const [x, y] = trail(n.frac); setTimeout(() => { el.classList.add('walking'); el.style.transform = `translate(${x}px,${y - 34 * 0.6}px)`; setTimeout(() => el.classList.remove('walking'), 1600); }, 300);
    [0.25, 0.5, 0.75].forEach((f, i) => { if (seen.frac < f && n.frac >= f) setTimeout(() => { const c = document.querySelectorAll('.camp')[i]; if (c) c.classList.add('pitch'); toast('Camp ' + (i + 1) + ' reached on ' + n.peak.name); }, 1500); });
  }
  if (seen && n.summitsDone > (seen.summits || 0) && typeof POP !== 'undefined') {
    for (let i = seen.summits || 0; i < n.summitsDone; i++) POP.queue.push({ summit: PEAKS[i] });
    if (typeof showNextPop === 'function') showNextPop();
  }
  if (!seen || seen.total !== n.total) { try { localStorage.setItem(CLIMB_SEEN, JSON.stringify({ total: n.total, idx: n.idx, frac: n.frac, summits: n.summitsDone })); } catch (e) { /* ignore */ } }
}
function summitPopHTML(P) {
  const exp = EXPEDITIONS[P.ei]; const last = P.pi === exp.peaks.length - 1; const i = PEAKS.indexOf(P);
  return `<div class="award-card"><div class="award-face summit-face"><svg viewBox="0 0 200 120" width="220" height="132" aria-hidden="true"><path d="M10 118 L100 40 L190 118 Z" fill="#2C5C8F"/><path d="M100 40 L190 118 L150 118 Q130 70 100 40" fill="#000" opacity=".15"/><path d="M84 54 L100 40 L116 54 L106 51 L100 58 L94 51 Z" fill="#F1EFE8"/><g class="plant"><line x1="116" y1="48" x2="116" y2="22" stroke="#C9D0DB" stroke-width="3"/><path d="M116 22 L136 27 L116 32 Z" fill="#E35D5D"/></g><g transform="translate(98 22) scale(.55)">${climberA('sum', lookOf(i + 1))}</g><ellipse class="cl l" cx="40" cy="50" rx="34" ry="10" fill="rgba(255,255,255,.35)"/><ellipse class="cl r" cx="160" cy="44" rx="34" ry="10" fill="rgba(255,255,255,.35)"/></svg>
    <span class="eyebrow">${last ? esc(exp.name.toUpperCase()) + ' COMPLETE' : 'SUMMIT REACHED'}</span><h2>${esc(P.name)}</h2><p class="soft">${P.alt.toLocaleString('en')} m</p>
    <div class="gear-drop"><span class="bag">${gearSVG(i, 64)}</span><span><small class="muted">New gear</small><b>${esc(P.gear)}</b></span></div>
    <button class="btn primary big" data-pop="ok">Onwards</button></div></div>${confettiHTML()}`;
}
const _extraSheetClimb = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'gear') return gearSheet();
  if (name === 'climber') return `<h2>Your climber</h2><label class="field">Name<input id="cl-name" type="text" maxlength="24" value="${esc(D.settings.climberName || '')}" placeholder="Give your climber a name"></label><button class="btn primary big" data-act="climber-save">Save</button>`;
  return _extraSheetClimb(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'gear') { UI.gearIdx = b.dataset.v; UI.sheet = 'gear'; render(); return; }
  if (b.dataset.act === 'climber-save') { const v = ($('#cl-name').value || '').trim(); D.settings.climberName = v; D.settings.upd = Date.now(); UI.sheet = null; save(); render(); toast(v ? v + ' is ready to climb' : 'Name cleared'); }
});
