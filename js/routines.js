/* Peak — routines à la carte (warm-up → main → accessories → finisher → stretch), daily mobility variants. */

/* daily mobility: A is the plan's, B and C rotate with it */
const DAILY_MOBS = {
  A: { name: 'Plan routine', sub: 'Hips, ankles, spine', items: [{ ex: 'hip9090', L: 1, R: 1, t: 120 }, { ex: 'anklewall', L: 1, R: 1, t: 60 }, { ex: 'thoracic', L: 1, R: 1, t: 60 }, { ex: 'couch', L: 1, R: 1, t: 60 }] },
  B: { name: 'Hips & hamstrings', sub: 'Lunge, glutes, back of the legs', items: [{ ex: 'wgs', L: 1, R: 1, r: [5, 5] }, { ex: 'pigeon', L: 1, R: 1, t: 60 }, { ex: 'hamstretch', L: 1, R: 1, t: 60 }, { ex: 'catcow', s: 1, r: [10, 10] }] },
  C: { name: 'Shoulders & back', sub: 'Right shoulder, chest, spine', items: [{ ex: 'sleeper', L: 1, R: 1, t: 60, cue: 'Right shoulder especially' }, { ex: 'doorpec', L: 1, R: 1, t: 60 }, { ex: 'deadhang', s: 2, t: 30 }, { ex: 'thoracic', L: 1, R: 1, t: 60 }] }
};
const nextMob = () => { const n = D.workouts.filter((w) => w.mob && w.end).length; return 'ABC'[n % 3]; };

/* routine catalogue: each slot lists candidates for the gym and for home (dumbbells + body weight) */
const R_WARM = {
  lower: { gym: [['easybike', 'easyrow'], ['legswing'], ['wgs'], ['bandwalk', 'slbridge']], home: [['jumprope', 'easyjog'], ['legswing'], ['wgs'], ['slbridge']] },
  upper: { gym: [['easyrow', 'jumprope'], ['armcircle'], ['pullapart'], ['scappush', 'thoracic']], home: [['jumprope'], ['armcircle'], ['scappush'], ['thoracic']] },
  full: { gym: [['easybike', 'easyrow', 'jumprope'], ['wgs'], ['armcircle'], ['legswing']], home: [['jumprope', 'easyjog'], ['wgs'], ['armcircle'], ['legswing']] },
  power: { gym: [['jumprope', 'easybike'], ['legswing'], ['askip'], ['lowshuffle']], home: [['jumprope'], ['legswing'], ['askip'], ['lowshuffle']] }
};
const R_STRETCH = {
  lower: [['couch'], ['pigeon'], ['hamstretch']], upper: [['doorpec'], ['sleeper', 'thoracic'], ['deadhang', 'catcow']],
  full: [['couch'], ['doorpec'], ['hamstretch', 'pigeon']], power: [['couch'], ['hamstretch'], ['anklewall']], core: [['catcow'], ['pigeon'], ['hamstretch']]
};
const ROUTINES = {
  legs: { name: 'Leg day', sub: 'Quads, hamstrings, glutes, calves', warm: 'lower', stretch: 'lower', style: 'strength',
    main: { gym: [['squat', 'frontsquat', 'trapbar', 'hacksquat'], ['bbrdl', 'deadlift', 'trapbar']], home: [['goblet', 'bulgarian'], ['dbrdl', 'slrdl']] },
    acc: { gym: [['walklunge', 'revlunge', 'stepup', 'splitsquat', 'legpress'], ['lyingcurl', 'seatedcurl', 'nordic'], ['hipthrust', 'glutebridge', 'kickbackc'], ['calfstand', 'calfseated'], ['legext', 'abduction', 'adduction', 'latlunge'], ['bulgarian', 'kickstand']],
      home: [['walklunge', 'revlunge', 'stepup', 'splitsquat'], ['nordic', 'slrdl'], ['kickstand', 'latlunge'], ['wallsit', 'splithold'], ['bulgarian', 'stepup'], ['latlunge', 'revlunge']] },
    fin: { gym: [['wallsit', 'boxjump']], home: [['wallsit', 'burpee']] } },
  push: { name: 'Push', sub: 'Chest, shoulders, triceps', warm: 'upper', stretch: 'upper', style: 'strength',
    main: { gym: [['bench', 'inclinedb', 'dbbench'], ['ohp', 'dbshoulder', 'arnold']], home: [['dbbench', 'pushup'], ['dbshoulder', 'arnold']] },
    acc: { gym: [['fly', 'dbfly', 'chestpress', 'dips'], ['latraise', 'cablelat'], ['pushdown', 'ohcable', 'skull', 'dbohext'], ['cgbench', 'dips', 'kickback'], ['reardelt', 'facepull', 'frontraise'], ['inclinedb', 'chestpress']],
      home: [['dbfly', 'pushup'], ['latraise'], ['dbohext', 'kickback'], ['benchdip', 'pike'], ['reardelt', 'frontraise'], ['pushup', 'kneelpress']] },
    fin: { gym: [['pushup', 'plyopush']], home: [['pushup', 'burpee']] } },
  pull: { name: 'Pull', sub: 'Back, biceps, grip', warm: 'upper', stretch: 'upper', style: 'strength',
    main: { gym: [['pullups', 'chinup', 'latpull'], ['bbrow', 'tbar', 'dbrow']], home: [['dbrow', 'chestrow'], ['bprow', 'invrow']] },
    acc: { gym: [['seatedrow', 'machinerow', 'cablerow', 'latpullbi'], ['straightarm', 'facepull', 'reardelt'], ['bbcurl', 'inclinecurl', 'bayesian', 'preacher', 'cablecurl'], ['hammer', 'revcurl', 'curl'], ['shrug', 'backext'], ['farmer', 'wristcurl']],
      home: [['bprow', 'invrow', 'chestrow'], ['reardelt', 'bandpull'], ['curl', 'inclinecurl'], ['hammer', 'bpcurl'], ['shrug'], ['farmer', 'wristcurl']] },
    fin: { gym: [['farmer']], home: [['farmer']] } },
  upper: { name: 'Upper body', sub: 'Push and pull in one session', warm: 'upper', stretch: 'upper', style: 'strength',
    main: { gym: [['bench', 'inclinedb'], ['pullups', 'bbrow', 'latpull']], home: [['dbbench', 'pushup'], ['dbrow', 'chestrow']] },
    acc: { gym: [['ohp', 'dbshoulder', 'arnold'], ['seatedrow', 'cablerow', 'machinerow'], ['latraise', 'cablelat'], ['bbcurl', 'bayesian', 'hammer'], ['pushdown', 'skull', 'dbohext'], ['facepull', 'reardelt']],
      home: [['dbshoulder', 'arnold'], ['bprow', 'invrow'], ['latraise'], ['curl', 'hammer'], ['dbohext', 'kickback'], ['reardelt']] },
    fin: { gym: [['pushup']], home: [['pushup']] } },
  core: { name: 'Core', sub: 'Abs, obliques, anti-rotation', warm: 'full', stretch: 'core', style: 'core',
    main: { gym: [['abwheel', 'hangleg'], ['pallof', 'cablerot', 'woodchop']], home: [['abwheel', 'deadbug'], ['bandpallof', 'bandrot']] },
    acc: { gym: [['suitcase', 'farmer'], ['sideplank'], ['cablecrunch', 'crunch'], ['russian', 'deadbug'], ['plank'], ['bandrot', 'woodchop']],
      home: [['suitcase', 'farmer'], ['sideplank'], ['crunch'], ['russian', 'deadbug'], ['plank'], ['bandrot']] },
    fin: { gym: [['mclimber', 'burpee']], home: [['mclimber', 'burpee']] } },
  power: { name: 'Power & athletic', sub: 'Jumps, throws, explosive lifts', warm: 'power', stretch: 'power', style: 'power',
    main: { gym: [['powerclean', 'pushpress', 'trapbar'], ['boxjump', 'mbslam', 'mbthrow']], home: [['switchjump', 'skater'], ['pogo', 'linehops']] },
    acc: { gym: [['kbswing', 'scoop', 'mbthrow'], ['bulgarian', 'stepup'], ['plyopush'], ['pallof', 'woodchop'], ['skater', 'switchjump'], ['pushpress', 'kbswing']],
      home: [['skater', 'switchjump'], ['bulgarian', 'stepup'], ['plyopush'], ['bandrot', 'bandpallof'], ['linehops', 'pogo'], ['revlunge']] },
    fin: { gym: [['sledpush', 'bikesprint', 'ropes']], home: [['burpee', 'mclimber']] } },
  fullA: { name: 'Full body A', sub: 'Strength — big lifts', warm: 'full', stretch: 'full', style: 'strength',
    main: { gym: [['squat', 'trapbar', 'frontsquat'], ['bench', 'ohp', 'pullups']], home: [['goblet', 'bulgarian'], ['dbbench', 'dbshoulder']] },
    acc: { gym: [['bbrdl', 'dbrdl'], ['bbrow', 'seatedrow', 'latpull'], ['walklunge', 'stepup'], ['inclinedb', 'dips'], ['plank', 'pallof', 'abwheel'], ['facepull', 'latraise']],
      home: [['dbrdl', 'slrdl'], ['dbrow', 'chestrow'], ['walklunge', 'revlunge'], ['pushup'], ['plank', 'deadbug'], ['latraise', 'reardelt']] },
    fin: { gym: [['farmer']], home: [['farmer']] } },
  fullB: { name: 'Full body B', sub: 'Volume — machines and dumbbells', warm: 'full', stretch: 'full', style: 'volume',
    main: { gym: [['legpress', 'goblet', 'hacksquat'], ['inclinedb', 'chestpress']], home: [['goblet', 'splitsquat'], ['dbbench', 'pushup']] },
    acc: { gym: [['latpull', 'seatedrow', 'machinerow'], ['lyingcurl', 'seatedcurl'], ['latraise', 'arnold'], ['bayesian', 'cablecurl', 'hammer'], ['pushdown', 'ohcable'], ['calfstand', 'calfseated']],
      home: [['dbrow', 'bprow'], ['nordic', 'dbrdl'], ['latraise', 'arnold'], ['curl', 'hammer'], ['dbohext', 'kickback'], ['wallsit']] },
    fin: { gym: [['mclimber']], home: [['mclimber']] } },
  fullC: { name: 'Full body C', sub: 'Circuit — heart rate up', warm: 'power', stretch: 'full', style: 'circuit',
    main: { gym: [['kbswing', 'wallball'], ['rowsprint', 'skierg', 'bikesprint']], home: [['burpee'], ['mclimber']] },
    acc: { gym: [['goblet', 'walklunge'], ['pushup'], ['sledpush', 'ropes'], ['farmer', 'sandbaglunge'], ['plank'], ['boxjump']],
      home: [['goblet', 'walklunge'], ['pushup'], ['switchjump', 'skater'], ['farmer'], ['plank'], ['revlunge']] },
    fin: { gym: [['burpee']], home: [['burpee']] } }
};
const R_SIZE = { 45: { warm: 3, main: 1, acc: 2, fin: 0, stretch: 2 }, 60: { warm: 3, main: 2, acc: 3, fin: 1, stretch: 2 }, 90: { warm: 3, main: 2, acc: 5, fin: 1, stretch: 3 } };
const R_DOSE = {
  strength: { main: { s: 4, r: [5, 8] }, acc: { s: 3, r: [8, 12] } }, power: { main: { s: 4, r: [3, 5] }, acc: { s: 3, r: [5, 6] } },
  volume: { main: { s: 3, r: [8, 12] }, acc: { s: 3, r: [10, 15] } }, circuit: { main: { s: 3, r: [12, 15] }, acc: { s: 3, r: [10, 15] } },
  core: { main: { s: 3, r: [8, 12] }, acc: { s: 3, r: [10, 15] } }
};

function lastUsedMap() { const m = {}; D.workouts.forEach((w) => w.sets.forEach((s) => { if (!m[s.exId] || m[s.exId] < w.date) m[s.exId] = w.date; })); return m; }
/* one exercise per slot: the one done longest ago (never done counts as oldest), ties at random */
function pickSlots(slots, n, used, last) {
  const out = [];
  slots.slice(0, n).forEach((cands) => {
    const ok = cands.filter((id) => D.exercises[id] && !used.has(id)); if (!ok.length) return;
    ok.sort((a, b) => ((last[a] || '') < (last[b] || '') ? -1 : (last[a] || '') > (last[b] || '') ? 1 : Math.random() - 0.5));
    used.add(ok[0]); out.push(ok[0]);
  });
  return out;
}
function doseFor(id, part, style) {
  const ex = D.exercises[id]; const d = (R_DOSE[style] || R_DOSE.strength)[part] || { s: 3, r: [8, 12] };
  const it = { ex: id, s: d.s };
  if (part === 'warm') { it.s = 1; if (ex.type === 'time') it.t = ['easybike', 'easyrow', 'easyjog', 'jumprope'].includes(id) ? 180 : 45; else it.r = [10, 10]; return it; }
  if (part === 'stretch') { it.s = 1; if (ex.type === 'time') it.t = id === 'deadhang' ? 30 : 60; else it.r = [8, 8]; return it; }
  if (part === 'fin') it.s = 2;
  if (ex.type === 'time') it.t = ex.cat === 'Conditioning' ? 30 : 40;
  else if (ex.type === 'wd') it.d = 30;
  else if (ex.type === 'wt') it.t = 30;
  else it.r = part === 'fin' ? [10, 15] : d.r;
  return it;
}
const R_PARTS = [['warm', 'Warm-up'], ['main', 'Main'], ['acc', 'Accessories'], ['fin', 'Finisher (optional)'], ['stretch', 'Stretch']];
/* the routine as it is used: defaults, with the person's permanent changes (Settings › Routines) on top */
function routineOf(key) {
  const R = ROUTINES[key]; const o = (D.settings.routines || {})[key] || {};
  const slots = (part, eq) => {
    if (o.pools && o.pools[eq] && o.pools[eq][part]) return o.pools[eq][part].map((id) => [id]).length ? [o.pools[eq][part].slice()] : [];
    if (part === 'warm') return R_WARM[R.warm][eq]; if (part === 'stretch') return R_STRETCH[R.stretch]; return R[part][eq];
  };
  const size = (dur, part) => { const v = o.size && o.size[dur] && o.size[dur][part]; return v != null ? v : (R_SIZE[dur] || R_SIZE[60])[part]; };
  const dose = (part) => Object.assign({}, (R_DOSE[R.style] || R_DOSE.strength)[part] || {}, (o.dose || {})[part] || {});
  return { R, slots, size, dose, edited: !!(o.pools || o.size || o.dose) };
}
/* pick n exercises for a part: one per slot, or n from a single pool (edited routines) */
function pickPart(slots, n, used, last) {
  if (slots.length === 1 && n > 1) {
    const ok = slots[0].filter((id) => D.exercises[id] && !used.has(id))
      .sort((a, b) => ((last[a] || '') < (last[b] || '') ? -1 : (last[a] || '') > (last[b] || '') ? 1 : Math.random() - 0.5)).slice(0, n);
    ok.forEach((id) => used.add(id)); return ok.map((id) => ({ id, cands: slots[0] }));
  }
  const ids = pickSlots(slots, n, used, last); return ids.map((id) => ({ id, cands: (slots.find((c) => c.includes(id)) || [id]) }));
}
function doseItem(id, part, RO) {
  const base = doseFor(id, part, RO.R.style); const d = RO.dose(part);
  if (part === 'main' || part === 'acc' || part === 'fin') { if (d.s) base.s = d.s; if (base.r && d.r) base.r = d.r.slice(); }
  return base;
}
function buildRoutine(key, dur, home) {
  const RO = routineOf(key); const eq = home ? 'home' : 'gym'; const used = new Set(); const last = lastUsedMap(); const items = [];
  R_PARTS.forEach(([part, block]) => {
    const n = RO.size(dur, part); if (!n) return;
    pickPart(RO.slots(part, eq), n, used, last).forEach(({ id, cands }) => { const p = prescribe(doseItem(id, part, RO), 1, false, false); if (p) items.push({ exId: id, block, presc: p, part, cands }); });
  });
  return items;
}
/* rough duration: work 40 s a set (or its time), the exercise's rest between sets, 1 min to change exercise */
function estimateMin(items) {
  return Math.round(items.reduce((sum, it) => {
    const ex = D.exercises[it.exId]; const p = it.presc || {}; const n = p.L != null ? (p.L || 0) + (p.R || 0) : (p.sets || 1);
    const work = p.t || 40; const rest = /Warm|Stretch/.test(it.block) ? 10 : (ex.rest || 60); const gaps = p.L != null ? Math.max(0, (p.L || 1) - 1) : Math.max(0, n - 1);
    return sum + n * work + gaps * rest + 60;
  }, 0) / 60);
}
function startRoutine(key, dur, home) { // opens the preview first
  if (active()) { go('session'); return; }
  UI.rDraft = { key, dur, home: !!home, items: buildRoutine(key, dur, home) }; UI.sheet = null; go('rpreview'); window.scrollTo(0, 0);
}
function launchDraft() {
  const d = UI.rDraft; if (!d || !d.items.length) return;
  const items = d.items.map(({ exId, block, presc }) => ({ exId, block, presc }));
  startWorkout(null, null); const w = active();
  Object.assign(w, { name: ROUTINES[d.key].name + (d.home ? ' · home' : ''), routine: { key: d.key, dur: d.dur, home: d.home }, items, cur: 0 });
  UI.rDraft = null; save(); render();
}
const rpSetsOf = (p) => (p.L != null ? `${p.L} L / ${p.R} R` : `${p.sets} set${p.sets > 1 ? 's' : ''}`);
function previewView() {
  const d = UI.rDraft; if (!d) { return `<header class="top"><h1>Routine</h1></header><section class="card"><p class="muted">No routine selected.</p><button class="btn primary" data-act="go" data-v="today">Back to Today</button></section>`; }
  const R = ROUTINES[d.key]; let lastB = null;
  const rows = d.items.map((it, i) => { const ex = D.exercises[it.exId]; const head = it.block !== lastB ? `<span class="eyebrow blk">${esc(it.block.toUpperCase())}</span>` : ''; lastB = it.block;
    const alt = (it.cands || []).filter((id) => id !== it.exId && D.exercises[id] && !d.items.some((x) => x.exId === id)).length;
    return `${head}<div class="rp-row"><i class="dot" style="background:${CATS[ex.cat]}"></i><span class="ex-name grow"><b>${esc(ex.name)}</b><small>${esc(prescShort(it.presc, ex) || rpSetsOf(it.presc))}</small></span>
      <span class="rp-act"><button class="icon-btn sm" aria-label="Fewer sets" data-act="rp-sets" data-i="${i}" data-d="-1">−</button><button class="icon-btn sm" aria-label="More sets" data-act="rp-sets" data-i="${i}" data-d="1">+</button>
      <button class="icon-btn sm" aria-label="Swap ${esc(ex.name)}" data-act="rp-swap" data-i="${i}"${alt ? '' : ' disabled'}>${svg('swap', 17, 2)}</button><button class="icon-btn sm" aria-label="Remove ${esc(ex.name)}" data-act="rp-del" data-i="${i}">✕</button></span></div>`; }).join('');
  return `<header class="top"><button class="icon-btn" aria-label="Back" data-act="rp-back">${svg('back')}</button><div class="grow"><div class="strong">${esc(R.name)}${d.home ? ' · home' : ''}</div><span class="muted sm">~${estimateMin(d.items)} min · ${d.items.length} exercises · changes are for this session only</span></div></header>
    <section class="card rp-list">${rows || '<p class="muted">No exercise left.</p>'}</section>
    <div class="row gap mb"><button class="btn outline grow" data-act="rp-add">${svg('plus', 18, 2)} Add exercise</button><button class="btn outline grow" data-act="rp-shuffle">Shuffle</button></div>
    <button class="btn primary big" data-act="rp-start"${d.items.length ? '' : ' disabled'}>Start · ~${estimateMin(d.items)} min</button>
    <p class="muted sm center">To change this routine for good, use ⋮ › Routines.</p>`;
}

/* ---------- Routines editor (permanent changes) ---------- */
function routinesView() {
  return `<header class="top"><button class="icon-btn" aria-label="Back" data-act="go" data-v="today">${svg('back')}</button><h1 class="grow">Routines</h1></header>
    <p class="muted sm mb">Changes here are kept for every future session of the routine. Changes made before starting a session only apply to that session.</p>
    <div class="r-list">${Object.entries(ROUTINES).map(([k, r]) => `<button class="cat-tile" data-act="re-open" data-v="${k}"><span><b>${esc(r.name)}${routineOf(k).edited ? ' <i class="tag">Edited</i>' : ''}</b><small>${esc(r.sub)}</small></span>${svg('chev', 18, 2)}</button>`).join('')}</div>`;
}
function routineEditView() {
  const key = UI.reKey; const RO = routineOf(key); if (!RO.R) return routinesView(); const eq = UI.reHome ? 'home' : 'gym';
  const parts = R_PARTS.map(([part, block]) => {
    const pool = [...new Set(RO.slots(part, eq).flat())].filter((id) => D.exercises[id]);
    const d = RO.dose(part); const doseRow = ['main', 'acc', 'fin'].includes(part) ? `<div class="re-dose"><label>Sets<input type="number" min="1" max="8" data-re="s" data-part="${part}" value="${d.s || 3}"></label><label>Reps<input type="number" min="1" max="50" data-re="r0" data-part="${part}" value="${d.r ? d.r[0] : 8}"></label><span>–</span><label class="nolbl"><input type="number" min="1" max="50" data-re="r1" data-part="${part}" value="${d.r ? d.r[1] : 12}" aria-label="Reps up to"></label></div>` : '';
    return `<section class="card"><div class="row between"><span class="eyebrow">${esc(block.toUpperCase())}</span></div>
      <div class="re-size">${[45, 60, 90].map((m) => `<label>${m === 90 ? '1 h 30' : m === 60 ? '1 h' : '45 min'}<input type="number" min="0" max="8" data-re="size" data-dur="${m}" data-part="${part}" value="${RO.size(m, part)}"></label>`).join('')}<small class="muted">exercises per session</small></div>
      ${doseRow}
      <div class="re-pool">${pool.map((id) => `<span class="re-chip">${esc(D.exercises[id].name)}<button aria-label="Remove ${esc(D.exercises[id].name)}" data-act="re-del" data-part="${part}" data-v="${id}">✕</button></span>`).join('')}
      <button class="chip-btn" data-act="re-add" data-part="${part}">${svg('plus', 14, 2.4)} Add</button></div></section>`;
  }).join('');
  return `<header class="top"><button class="icon-btn" aria-label="Back" data-act="go" data-v="routines">${svg('back')}</button><div class="grow"><div class="strong">${esc(RO.R.name)}</div><span class="muted sm">Saved automatically</span></div></header>
    <div class="seg-ctl mb">${[['0', 'Gym'], ['1', 'Dumbbells · home']].map(([v, l]) => `<button class="${String(+!!UI.reHome) === v ? 'on' : ''}" data-act="re-home" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="muted sm mb">Exercises are picked from each list, the ones done longest ago first.</p>${parts}
    <button class="btn outline big" data-act="re-reset"${RO.edited ? '' : ' disabled'}>Reset to default</button>`;
}
function reOv(key) { D.settings.routines = D.settings.routines || {}; return (D.settings.routines[key] = D.settings.routines[key] || {}); }
function reSave() { D.settings.routines = Object.assign({}, D.settings.routines); save(); }
function rePool(key, eq, part) { const o = reOv(key); o.pools = o.pools || {}; o.pools[eq] = o.pools[eq] || {}; if (!o.pools[eq][part]) o.pools[eq][part] = [...new Set(routineOf(key).slots(part, eq).flat())].filter((id) => D.exercises[id]); return o.pools[eq][part]; }

/* ---------- sheets ---------- */
function routineSheet() {
  const dur = UI.rDur || 60; const home = !!UI.rHome;
  return `<h2>Start a session</h2>
    <button class="btn outline big mb" data-act="free-empty">${svg('plus', 18, 2)} Empty session</button>
    <span class="eyebrow">OR A ROUTINE</span>
    <div class="seg-ctl mt">${[['0', 'Gym'], ['1', 'Dumbbells · home']].map(([v, l]) => `<button class="${String(+home) === v ? 'on' : ''}" aria-pressed="${String(+home) === v}" data-act="r-home" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="seg-ctl mt">${[45, 60, 90].map((m) => `<button class="${dur === m ? 'on' : ''}" aria-pressed="${dur === m}" data-act="r-dur" data-v="${m}">${m === 90 ? '1 h 30' : m === 60 ? '1 h' : '45 min'}</button>`).join('')}</div>
    <div class="r-list">${Object.entries(ROUTINES).map(([k, r]) => `<button class="cat-tile" data-act="r-start" data-v="${k}"><span><b>${esc(r.name)}</b><small>${esc(r.sub)}</small></span>${svg('chev', 18, 2)}</button>`).join('')}</div>
    <p class="muted sm">You will see the routine and can change it before it starts. To change a routine for good: ⋮ › Routines.</p>`;
}
function mobSheet() {
  const nx = nextMob();
  return `<h2>Daily mobility · 10 min</h2><p class="muted sm">Three routines take turns; the next one is highlighted.</p>
    <div class="r-list">${Object.entries(DAILY_MOBS).map(([k, m]) => `<button class="cat-tile${k === nx ? ' on' : ''}" data-act="mob-start" data-v="${k}"><span><b>${k} · ${esc(m.name)}${k === nx ? ' <i class="tag">Up next</i>' : ''}</b><small>${esc(m.sub)} · ${m.items.map((i) => esc(D.exercises[i.ex] ? D.exercises[i.ex].name : i.ex)).join(', ')}</small></span>${svg('chev', 18, 2)}</button>`).join('')}</div>`;
}
function startMob(k) {
  if (active()) { go('session'); return; }
  const M = DAILY_MOBS[k] || DAILY_MOBS.A;
  startWorkout(null, null); const mw = active(); Object.assign(mw, { mob: k, free: false, name: 'Daily mobility · ' + M.name });
  mw.items = M.items.map((it) => ({ exId: it.ex, block: 'Daily mobility', presc: prescribe(it, 1, false, false) })).filter((x) => x.presc);
  save(); render();
}

const _extraSheetRoutines = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'routine') return routineSheet();
  if (name === 'mob') return mobSheet();
  return _extraSheetRoutines(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  switch (b.dataset.act) {
    case 'free-empty': UI.sheet = null; startWorkout(null, null); break;
    case 'r-home': UI.rHome = b.dataset.v === '1'; render(); break;
    case 'r-dur': UI.rDur = Number(b.dataset.v); render(); break;
    case 'r-start': UI.sheet = null; startRoutine(b.dataset.v, UI.rDur || 60, !!UI.rHome); break;
    case 'mob-start': UI.sheet = null; startMob(b.dataset.v); break;
    // preview
    case 'rp-back': UI.rDraft = null; go('today'); UI.sheet = 'routine'; render(); break;
    case 'rp-start': launchDraft(); break;
    case 'rp-shuffle': { const d = UI.rDraft; if (d) { d.items = buildRoutine(d.key, d.dur, d.home); render(); } break; }
    case 'rp-del': { const d = UI.rDraft; if (d) { d.items.splice(Number(b.dataset.i), 1); render(); } break; }
    case 'rp-sets': { const d = UI.rDraft; const it = d && d.items[Number(b.dataset.i)]; if (!it) break; const k = Number(b.dataset.d); const p = it.presc;
      if (p.L != null) { p.L = Math.max(1, Math.min(8, p.L + k)); p.R = Math.max(1, Math.min(8, p.R + k)); } else p.sets = Math.max(1, Math.min(8, (p.sets || 1) + k)); render(); break; }
    case 'rp-swap': { const d = UI.rDraft; const it = d && d.items[Number(b.dataset.i)]; if (!it) break;
      const alts = (it.cands || []).filter((id) => id !== it.exId && D.exercises[id] && !d.items.some((x) => x.exId === id)); if (!alts.length) break;
      const RO = routineOf(d.key); const id = alts[Math.floor(Math.random() * alts.length)]; const p = prescribe(doseItem(id, it.part || 'acc', RO), 1, false, false); if (p) Object.assign(it, { exId: id, presc: p }); render(); break; }
    case 'rp-add': UI.rpAdd = true; UI.pq = ''; UI.pcat = null; UI.sheet = 'picker'; render(); break;
    // editor
    case 're-open': UI.reKey = b.dataset.v; UI.reHome = false; go('routine-edit'); window.scrollTo(0, 0); break;
    case 're-home': UI.reHome = b.dataset.v === '1'; render(); break;
    case 're-del': { const pool = rePool(UI.reKey, UI.reHome ? 'home' : 'gym', b.dataset.part); const i = pool.indexOf(b.dataset.v); if (i >= 0) pool.splice(i, 1); reSave(); render(); break; }
    case 're-add': UI.reAdd = b.dataset.part; UI.pq = ''; UI.pcat = null; UI.sheet = 'picker'; render(); break;
    case 're-reset': ask('Reset ' + ROUTINES[UI.reKey].name + ' to the default routine?', 'Reset', () => { if (D.settings.routines) delete D.settings.routines[UI.reKey]; reSave(); render(); toast('Routine reset'); }); break;
    default: break;
  }
});
/* the exercise picker, used to add to a preview or to a routine list */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act="addex"]'); if (!b) return;
  if (UI.rpAdd && UI.view === 'rpreview' && UI.rDraft) {
    ev.stopImmediatePropagation(); UI.rpAdd = false; const id = b.dataset.v; const d = UI.rDraft; const RO = routineOf(d.key);
    const p = prescribe(doseItem(id, 'acc', RO), 1, false, false); if (p && !d.items.some((x) => x.exId === id)) {
      const at = d.items.map((x) => x.block).lastIndexOf('Accessories'); const ins = at >= 0 ? at + 1 : d.items.findIndex((x) => x.block === 'Stretch');
      d.items.splice(ins >= 0 ? ins : d.items.length, 0, { exId: id, block: 'Accessories', presc: p, part: 'acc', cands: [id] });
    }
    UI.sheet = null; render(); return;
  }
  if (UI.reAdd && UI.view === 'routine-edit') {
    ev.stopImmediatePropagation(); const pool = rePool(UI.reKey, UI.reHome ? 'home' : 'gym', UI.reAdd); if (!pool.includes(b.dataset.v)) pool.push(b.dataset.v);
    UI.reAdd = null; reSave(); UI.sheet = null; render();
  }
}, true);
document.addEventListener('change', (ev) => {
  const t = ev.target; if (!t.dataset || !t.dataset.re || UI.view !== 'routine-edit') return;
  const o = reOv(UI.reKey); const part = t.dataset.part; const v = Math.max(0, Math.round(Number(t.value) || 0));
  if (t.dataset.re === 'size') { o.size = o.size || {}; o.size[t.dataset.dur] = o.size[t.dataset.dur] || {}; o.size[t.dataset.dur][part] = Math.min(8, v); }
  else { o.dose = o.dose || {}; const cur = routineOf(UI.reKey).dose(part); const nd = o.dose[part] = Object.assign({ s: cur.s, r: (cur.r || [8, 12]).slice() }, o.dose[part] || {});
    if (t.dataset.re === 's') nd.s = Math.max(1, Math.min(8, v)); if (t.dataset.re === 'r0') nd.r = [Math.max(1, v), Math.max(v, nd.r[1])]; if (t.dataset.re === 'r1') nd.r = [Math.min(nd.r[0], Math.max(1, v)), Math.max(1, v)]; }
  reSave(); render();
});
if (typeof EXTRA_VIEWS !== 'undefined') Object.assign(EXTRA_VIEWS, { rpreview: previewView, routines: routinesView, 'routine-edit': routineEditView });
