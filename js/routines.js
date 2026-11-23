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
const R_SIZE = { 45: { warm: 3, main: 1, acc: 3, fin: 0, stretch: 2 }, 60: { warm: 3, main: 2, acc: 4, fin: 1, stretch: 2 }, 90: { warm: 4, main: 2, acc: 6, fin: 1, stretch: 3 } };
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
function buildRoutine(key, dur, home) {
  const R = ROUTINES[key]; const Z = R_SIZE[dur] || R_SIZE[60]; const eq = home ? 'home' : 'gym';
  const used = new Set(); const last = lastUsedMap(); const items = [];
  const add = (ids, part, block) => ids.forEach((id) => { const p = prescribe(doseFor(id, part, R.style), 1, false, false); if (p) items.push({ exId: id, block, presc: p }); });
  add(pickSlots(R_WARM[R.warm][eq], Z.warm, used, last), 'warm', 'Warm-up');
  add(pickSlots(R.main[eq], Z.main, used, last), 'main', 'Main');
  add(pickSlots(R.acc[eq], Z.acc, used, last), 'acc', 'Accessories');
  if (Z.fin) add(pickSlots(R.fin[eq], Z.fin, used, last), 'fin', 'Finisher (optional)');
  add(pickSlots(R_STRETCH[R.stretch], Z.stretch, used, last), 'stretch', 'Stretch');
  return items;
}
function startRoutine(key, dur, home) {
  if (active()) { go('session'); return; }
  const items = buildRoutine(key, dur, home);
  startWorkout(null, null); const w = active();
  Object.assign(w, { name: ROUTINES[key].name + (home ? ' · home' : ''), routine: { key, dur, home: !!home }, items });
  w.cur = items.findIndex((it) => it.block === 'Warm-up'); if (w.cur < 0) w.cur = 0;
  save(); render();
}

/* ---------- sheets ---------- */
function routineSheet() {
  const dur = UI.rDur || 60; const home = !!UI.rHome;
  return `<h2>Start a session</h2>
    <button class="btn outline big mb" data-act="free-empty">${svg('plus', 18, 2)} Empty session</button>
    <span class="eyebrow">OR A ROUTINE</span>
    <div class="seg-ctl mt">${[['0', 'Gym'], ['1', 'Dumbbells · home']].map(([v, l]) => `<button class="${String(+home) === v ? 'on' : ''}" aria-pressed="${String(+home) === v}" data-act="r-home" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="seg-ctl mt">${[45, 60, 90].map((m) => `<button class="${dur === m ? 'on' : ''}" aria-pressed="${dur === m}" data-act="r-dur" data-v="${m}">${m === 90 ? '1 h 30' : m === 60 ? '1 h' : '45 min'}</button>`).join('')}</div>
    <div class="r-list">${Object.entries(ROUTINES).map(([k, r]) => `<button class="cat-tile" data-act="r-start" data-v="${k}"><span><b>${esc(r.name)}</b><small>${esc(r.sub)}</small></span>${svg('chev', 18, 2)}</button>`).join('')}</div>
    <p class="muted sm">Warm-up → main lifts → accessories → optional finisher → stretch. Exercises you have not done for a while come first; use Replace to swap one.</p>`;
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
    default: break;
  }
});
