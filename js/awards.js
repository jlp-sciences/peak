/* Peak — goals, goal eras, weekly streak with jokers, and the trophies.
   Everything is worked out from the logged data, so it is retroactive and needs no sync of its own.
   Only the goal eras (D.eras) are stored. Which unlocks were already shown is kept on this device only. */

const SEEN_KEY = 'peak.seen.v1';
const METALS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const METAL_COL = { Bronze: '#D08B57', Silver: '#C3CBD6', Gold: '#F2C14E', Platinum: '#7FE0D6', Diamond: '#A9C4FF' };
const metalOf = (i, n) => (n === 1 ? 'Gold' : n <= 5 ? METALS[i] : METALS[Math.min(4, Math.floor(i * 5 / n))]);
const CORE_CATS = () => [...new Set(Object.values(D.exercises).map((e) => e.cat))].filter((c) => c !== 'Conditioning' && c !== 'Mobility');

/* ---------- dates ---------- */
const dOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = dOf(s); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = (s) => { const d = dOf(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const monthOf = (s) => s.slice(0, 7);
const nextMonth = (m) => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? (y + 1) + '-01' : y + '-' + String(mo + 1).padStart(2, '0'); };
const monthEnd = (m) => addDays(nextMonth(m) + '-01', -1);
const daysBetween = (a, b) => Math.round((dOf(b) - dOf(a)) / 86400000);

/* ---------- progression helpers: a stat is a list of [date, value], value never decreasing ---------- */
const counter = (dates) => dates.slice().sort().map((d, i) => [d, i + 1]);
function best(points) { points.sort((a, b) => a[0].localeCompare(b[0])); const out = []; let m = -Infinity; points.forEach(([d, v]) => { if (v > m) { m = v; out.push([d, v]); } }); return out; }
function cumul(points) { points.sort((a, b) => a[0].localeCompare(b[0])); let s = 0; return points.map(([d, v]) => [d, (s += v)]); }
const valueOf = (stat) => (stat && stat.length ? stat[stat.length - 1][1] : 0);
const dateFor = (stat, t) => { const p = (stat || []).find(([, v]) => v >= t - 1e-9); return p ? p[0] : null; };

/* ---------- goal eras ---------- */
function finished() { return D.workouts.filter((w) => w.end && !w.mob).slice().sort((a, b) => (a.date === b.date ? (a.start || 0) - (b.start || 0) : a.date.localeCompare(b.date))); }
function erasList() { return Object.values(D.eras || {}).sort((a, b) => a.from.localeCompare(b.from)); }
function ensureEra() {
  D.eras = D.eras || {};
  if (erasList().some((e) => !e.to)) return false;
  const first = finished()[0]; const id = uid();
  D.eras[id] = { id, from: mondayOf(first ? first.date : iso()), to: null, weekly: 3, monthly: 10, runs: 0, upd: Date.now() };
  return true;
}
const currentEra = () => erasList().find((e) => !e.to);
function setGoals(g) {
  const cur = currentEra(); const thisMon = mondayOf(iso());
  const same = cur && cur.weekly === g.weekly && cur.monthly === g.monthly && (cur.runs || 0) === (g.runs || 0);
  if (same) return false;
  if (cur && cur.from >= thisMon) { Object.assign(cur, g, { upd: Date.now() }); return 'updated'; }
  if (cur) { cur.to = addDays(thisMon, -1); cur.upd = Date.now(); cur.summary = eraSummary(cur); }
  const id = uid(); D.eras[id] = Object.assign({ id, from: thisMon, to: null, upd: Date.now() }, g);
  return 'new';
}

/* weeks, months, streak and jokers of one era */
function evalEra(e, ws) {
  const today = iso(); const end = e.to || today;
  const inEra = ws.filter((w) => w.date >= e.from && w.date <= end);
  const runs = Object.keys(D.runs || {}).filter((d) => d >= e.from && d <= end);
  const st = { onTarget: [], hot: [], months: [], iron: [], perfect: [], over: [], fullMarks: [], runWeeks: [], comeback: [], joker: [], unbroken: [] };
  const weekMet = {}; let streak = 0, bestStreak = 0, jokers = 0, metN = 0, lost = false, comebackDone = false, noJoker = 0;
  let now = { count: 0, goal: e.weekly, runs: 0, runGoal: e.runs || 0 };
  for (let mon = mondayOf(e.from); mon <= end; mon = addDays(mon, 7)) {
    const sun = addDays(mon, 6); const complete = e.to ? sun <= e.to : sun < today;
    const wk = inEra.filter((w) => w.date >= mon && w.date <= sun); const rn = runs.filter((d) => d >= mon && d <= sun).length;
    if (mon <= today && today <= sun && !e.to) now = { count: wk.length, goal: e.weekly, runs: rn, runGoal: e.runs || 0 };
    const met = wk.length >= e.weekly; const when = met ? wk[e.weekly - 1].date : sun;
    if (met) {
      weekMet[mon] = true; streak += 1; noJoker += 1; metN += 1; bestStreak = Math.max(bestStreak, streak);
      st.onTarget.push(when); st.hot.push([when, streak]); st.unbroken.push([when, noJoker]);
      if (metN % 4 === 0) jokers = Math.min(2, jokers + 1);
      if (wk.length >= e.weekly + 1) st.over.push(wk[e.weekly].date);
      if (wk.every((w) => w.pct != null && w.pct >= 100)) st.fullMarks.push(when);
      if (lost && !comebackDone && streak >= 4) { st.comeback.push(when); comebackDone = true; }
    } else if (complete) {
      if (jokers > 0 && streak > 0) { jokers -= 1; st.joker.push(sun); weekMet[mon] = 'frozen'; noJoker = 0; }
      else { if (streak > 0) lost = true; streak = 0; noJoker = 0; }
    }
    if (e.runs && rn >= e.runs) st.runWeeks.push(runs.filter((d) => d >= mon && d <= sun).sort()[e.runs - 1]);
  }
  let ironRun = 0;
  for (let m = monthOf(e.from); m <= monthOf(end); m = nextMonth(m)) {
    const mws = inEra.filter((w) => monthOf(w.date) === m); const mEnd = monthEnd(m); const complete = e.to ? mEnd <= e.to : mEnd < today;
    if (mws.length >= e.monthly) { st.months.push(mws[e.monthly - 1].date); ironRun += 1; st.iron.push([mws[e.monthly - 1].date, ironRun]); }
    else if (complete) ironRun = 0;
    if (complete) {
      const mons = []; for (let mon = mondayOf(m + '-01'); mon <= mEnd; mon = addDays(mon, 7)) { if (monthOf(addDays(mon, 3)) === m && mon >= e.from) mons.push(mon); }
      if (mons.length && mons.every((mon) => weekMet[mon] === true)) st.perfect.push(mEnd);
    }
  }
  const mNow = monthOf(today); const monthNow = { count: inEra.filter((w) => monthOf(w.date) === mNow).length, goal: e.monthly };
  return {
    stats: {
      onTarget: counter(st.onTarget), hot: best(st.hot), months: counter(st.months), iron: best(st.iron), perfect: counter(st.perfect),
      over: counter(st.over), fullMarks: counter(st.fullMarks), runWeeks: counter(st.runWeeks.filter(Boolean)), comeback: counter(st.comeback), joker: counter(st.joker), unbroken: best(st.unbroken)
    },
    streak, bestStreak, jokers, now, monthNow, weeksMet: metN, rawHot: st.hot.slice()
  };
}
function eraSummary(e) {
  const r = evalEra(e, finished()); const got = [];
  TROPHIES.filter((t) => t.fam === 'goal').forEach((t) => { const lv = levelOf(t, r.stats); if (lv.level > 0) got.push({ id: t.id, level: lv.level, date: lv.dates[lv.level - 1] }); });
  return { weeksMet: r.weeksMet, bestStreak: r.bestStreak, trophies: got };
}

/* ---------- career and secret stats ---------- */
function bwAt(date) {
  const ms = ((D.body && D.body.measures) || []).filter((m) => m.weight).sort((a, b) => a.date.localeCompare(b.date));
  const before = ms.filter((m) => m.date <= date); const m = before.length ? before[before.length - 1] : ms[0];
  return m ? m.weight : null;
}
function careerStats(ws) {
  const s = {}; const sets = []; ws.forEach((w) => w.sets.forEach((x) => sets.push(Object.assign({ date: w.date, wid: w.id }, x))));
  const exOf = (x) => D.exercises[x.exId] || {};
  s.sessions = counter(ws.map((w) => w.date));
  s.full = counter(ws.filter((w) => w.pct >= 100).map((w) => w.date));
  let run = 0; s.flawless = best(ws.filter((w) => w.pct != null).map((w) => [w.date, (run = w.pct >= 100 ? run + 1 : 0)]));
  // records: a set that beats every earlier set of the same exercise and side
  const isMob = (x) => exOf(x).cat === 'Mobility'; const work = sets.filter((x) => !isMob(x));
  const bestSoFar = {}; const bestDate = {}; const prs = []; const first = {}; const glow = [];
  const wOf = {}; ws.forEach((w, i) => { wOf[w.id] = { w, gap: i ? daysBetween(ws[i - 1].date, w.date) : 0 }; });
  work.forEach((x) => {
    const ex = exOf(x); if (!ex.type || typeof METRICS === 'undefined') return; const m = primaryMetric(ex); const v = METRICS[m].f([x]); const k = x.exId + (x.side || '');
    if (v > 0 && bestSoFar[k] != null && v > bestSoFar[k]) prs.push({ date: x.date, wid: x.wid, cat: ex.cat, exId: x.exId, side: x.side, old: bestDate[k] });
    if (bestSoFar[k] == null || v > bestSoFar[k]) { bestSoFar[k] = v; bestDate[k] = x.date; }
    if (ex.type === 'wr' && v > 0) { const f = first[k]; if (!f) first[k] = { wid: x.wid, v }; else if (f.wid === x.wid) f.v = Math.max(f.v, v); else glow.push([x.date, Math.round(100 * (v / f.v - 1))]); }
  });
  const seenPR = new Set(); s.recordEx = best(prs.map((p) => { seenPR.add(p.exId); return [p.date, seenPR.size]; }));
  s.plate = best(work.filter((x) => exOf(x).equip === 'bar' && exOf(x).type === 'wr' && (x.r || 0) >= 1).map((x) => [x.date, x.w || 0]));
  s.glow = best(glow);
  s.plateau = counter(prs.filter((p) => p.old && daysBetween(p.old, p.date) >= 90).map((p) => p.date));
  s.stillGot = counter([...new Set(prs.filter((p) => wOf[p.wid] && wOf[p.wid].gap >= 14).map((p) => p.wid))].map((id) => wOf[id].w.date));
  s.twin = counter(Object.values(prs.reduce((o, p) => { if (p.side) { const k = p.wid + p.exId; (o[k] = o[k] || { date: p.date, s: new Set() }).s.add(p.side); } return o; }, {})).filter((x) => x.s.size === 2).map((x) => x.date));
  s.sneaky = counter([...new Set(prs.filter((p) => wOf[p.wid] && wOf[p.wid].w.light).map((p) => p.wid))].map((id) => wOf[id].w.date));
  Object.keys(CATS).forEach((c) => { s['cat_' + c] = counter(sets.filter((x) => exOf(x).cat === c).map((x) => x.date)); });
  // daily mobility sessions are not sessions, but their sets count for Stretch Goals
  const mobSets = D.workouts.filter((w) => w.mob && w.end).flatMap((w) => w.sets.map((x) => w.date));
  if (mobSets.length) s.cat_Mobility = counter(sets.filter((x) => exOf(x).cat === 'Mobility').map((x) => x.date).concat(mobSets).sort());
  s.records = counter(prs.map((p) => p.date));
  const perW = {}; s.prByW = perW; prs.forEach((p) => { perW[p.wid] = (perW[p.wid] || 0) + 1; s.triple = s.triple || []; s.triple.push([p.date, perW[p.wid]]); }); s.triple = best(s.triple || []);
  const cats = CORE_CATS(); const seenC = new Set(); s.allRound = best(prs.filter((p) => cats.includes(p.cat)).map((p) => { seenC.add(p.cat); return [p.date, seenC.size]; }));
  s.allRoundNeed = cats.length;
  const prWeeks = [...new Set(prs.map((p) => mondayOf(p.date)))].sort(); let r = 0; s.roll = best(prWeeks.map((mon, i) => [addDays(mon, 6) < iso() ? addDays(mon, 6) : iso(), (r = i && daysBetween(prWeeks[i - 1], mon) === 7 ? r + 1 : 1)]));
  const kg = (x) => (exOf(x).type === 'wr' ? (x.w || 0) * (x.r || 0) : 0);
  s.tonnage = cumul(ws.map((w) => [w.date, w.sets.reduce((n, x) => n + kg(x), 0) / 1000]));
  s.bigDay = best(ws.map((w) => [w.date, w.sets.reduce((n, x) => n + kg(x), 0) / 1000]));
  const ratio = (id, minR, k, mult) => best(sets.filter((x) => x.exId === id && (x.r || 0) >= minR && x.w).map((x) => { const bw = bwAt(x.date); return bw ? [x.date, Math.round(100 * (mult || 1) * x.w / bw) / 100] : null; }).filter(Boolean));
  s.squat = ratio('squat', 1); s.dead = ratio('deadlift', 1); s.oneLeg = ratio('bulgarian', 6, null, 2);
  s.grip = best(sets.filter((x) => x.exId === 'farmer' && (x.d || 0) >= 30 && x.w).map((x) => { const bw = bwAt(x.date); return bw ? [x.date, Math.round(200 * x.w / bw) / 100] : null; }).filter(Boolean));
  s.pullups = best(sets.filter((x) => x.exId === 'pullups' && !x.w).map((x) => [x.date, x.r || 0]));
  s.wpull = best(sets.filter((x) => x.exId === 'pullups' && x.w && (x.r || 0) >= 1).map((x) => [x.date, x.w]));
  s.pushups = best(sets.filter((x) => x.exId === 'pushup').map((x) => [x.date, x.r || 0]));
  s.plank = best(ws.map((w) => { const L = w.sets.filter((x) => x.exId === 'sideplank' && x.side === 'L').map((x) => x.t || 0); const R = w.sets.filter((x) => x.exId === 'sideplank' && x.side === 'R').map((x) => x.t || 0); return L.length && R.length ? [w.date, Math.min(Math.max(...L), Math.max(...R))] : null; }).filter(Boolean));
  s.sets = counter(work.map((x) => x.date));
  s.reps = cumul(ws.map((w) => [w.date, w.sets.reduce((n, x) => n + (isMob(x) ? 0 : (x.r || 0)), 0)]));
  s.hours = cumul(ws.map((w) => [w.date, w.late ? 0 : Math.min(240, Math.max(0, ((w.end || 0) - (w.start || 0)) / 60000)) / 60]));
  s.left = counter(work.filter((x) => x.side === 'L').map((x) => x.date));
  s.balanced = counter(ws.filter((w) => { const u = (w.items || []).filter((it) => (D.exercises[it.exId] || {}).uni && it.rows && it.rows.length); return u.length && u.every((it) => it.rows.every((row) => row.done)); }).map((w) => w.date));
  const seenE = new Set(); s.explorer = best(sets.map((x) => { seenE.add(x.exId); return [x.date, seenE.size]; }));
  const wkCats = {}; s.spectrum = counter(Object.entries(sets.reduce((o, x) => { const k = mondayOf(x.date); (o[k] = o[k] || new Set()).add(exOf(x).cat); wkCats[k] = x.date; return o; }, {})).filter(([, set]) => cats.every((c) => set.has(c))).map(([k]) => wkCats[k]));
  s.engine = counter(ws.filter((w) => w.sets.some((x) => exOf(x).cat === 'Conditioning')).map((w) => w.date));
  const runDays = Object.keys(D.runs || {}).sort(); s.runs = counter(runDays);
  const wDays = new Set(ws.map((w) => w.date)); s.double = counter(runDays.filter((d) => wDays.has(d)));
  const meas = ((D.body && D.body.measures) || []).slice().sort((a, b) => a.date.localeCompare(b.date)); const tests = ((D.body && D.body.tests) || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  s.checkin = counter(meas.map((m) => m.date)); s.tested = counter(tests.map((t) => t.date));
  const keys = []; (typeof TESTS !== 'undefined' ? TESTS : []).filter((t) => !['arm', 'feel'].includes(t.k)).forEach((t) => (t.lr ? [t.k + 'L', t.k + 'R'] : [t.k]).forEach((k) => keys.push({ k, lower: !!t.lower })));
  const better = (k, a, b) => (k.lower ? b < a : b > a); const last = {}; const imp = [];
  tests.forEach((t) => keys.forEach((k) => { const v = t.values[k.k]; if (v == null) return; if (last[k.k] != null && better(k, last[k.k], v)) imp.push(t.date); last[k.k] = v; }));
  s.better = counter(imp);
  s.levelUp = []; if (tests.length > 1) { const f = tests[0]; for (let i = 1; i < tests.length; i++) { const t = tests[i]; const common = keys.filter((k) => f.values[k.k] != null && t.values[k.k] != null); if (common.length && common.every((k) => better(k, f.values[k.k], t.values[k.k]))) { s.levelUp = [[t.date, 1]]; break; } } }
  const mWeeks = [...new Set(meas.filter((m) => m.weight).map((m) => mondayOf(m.date)))].sort(); let cr = 0; s.habit = best(mWeeks.map((mon, i) => [mon, (cr = i && daysBetween(mWeeks[i - 1], mon) === 7 ? cr + 1 : 1)]));
  const months = [...new Set(ws.map((w) => monthOf(w.date)))].sort(); s.months = counter(months.map((m) => ws.find((w) => monthOf(w.date) === m).date));
  let mr = 0; s.allYear = best(months.map((m, i) => [ws.filter((w) => monthOf(w.date) === m).slice(-1)[0].date, (mr = i && nextMonth(months[i - 1]) === m ? mr + 1 : 1)]));
  s.anniv = []; if (ws.length) { const f = dOf(ws[0].date); for (let y = 1; y <= 3; y++) { const d = new Date(f); d.setFullYear(f.getFullYear() + y); if (iso(d) <= iso()) s.anniv.push([iso(d), y]); } }
  s.comeback = counter(ws.filter((w, i) => i && daysBetween(ws[i - 1].date, w.date) >= 21).map((w) => w.date));
  // plan weeks, cycles, light weeks, full house
  const wc = [], cyc = [], light = [], house = [], block = []; const inst = {};
  ws.filter((w) => w.planId && D.plans[w.planId]).forEach((w) => {
    const plan = D.plans[w.planId]; const key = w.cycle + '|' + w.week; let I = inst[w.planId];
    if (!I || I.key !== key) I = inst[w.planId] = Object.assign({ key, done: new Set(), counted: false, house: false, light: false, cycles: (I && I.cycles) || [] });
    I.done.add(w.sessionId); if (w.light) I.light = true;
    const req = plan.sessions.filter((x) => x.required);
    if (!I.counted && req.length && req.every((x) => I.done.has(x.id))) {
      I.counted = true; wc.push(w.date); if (I.light) light.push(w.date);
      if (w.week === plan.weeks) { cyc.push(w.date); I.cycles.push(w.cycle); const n = plan.cycles.length; const lastN = I.cycles.slice(-n); if (n >= 2 && lastN.length === n && new Set(lastN).size === n && plan.cycles.every((c, j) => lastN[j] === c.key)) block.push(w.date); }
    }
    if (!I.house && plan.sessions.every((x) => I.done.has(x.id))) { I.house = true; house.push(w.date); }
  });
  s.weeks = counter(wc); s.cycles = counter(cyc); s.light = counter(light); s.house = counter(house); s.block = counter(block);
  const seedIds = (typeof SEED_PLANS !== 'undefined' ? SEED_PLANS : []).map((p) => p.id); s.architect = counter(ws.filter((w) => w.planId && !seedIds.includes(w.planId)).map((w) => w.date).slice(0, 1));
  s.schedule = counter(Object.values(D.planned || {}).filter((p) => ws.some((w) => w.date === p.date && (p.free ? w.free : w.planId === p.planId && w.sessionId === p.sessionId))).map((p) => p.date));
  // secrets
  const hour = (w) => { const d = new Date(w.start); return d.getHours() + d.getMinutes() / 60; };
  s.early = counter(ws.filter((w) => !w.late && hour(w) < 7.5).map((w) => w.date));
  s.night = counter(ws.filter((w) => !w.late && hour(w) >= 21).map((w) => w.date));
  s.newYear = counter(ws.filter((w) => w.date.slice(5) === '01-01').map((w) => w.date).slice(0, 1));
  s.sunday = counter(ws.filter((w) => dOf(w.date).getDay() === 0).map((w) => w.date));
  const active = [...new Set(ws.map((w) => w.date).concat(runDays))].sort(); let ar = 0; s.seven = best(active.map((d, i) => [d, (ar = i && daysBetween(active[i - 1], d) === 1 ? ar + 1 : 1)]));
  s.planB = counter(ws.flatMap((w) => (w.items || []).filter((it) => it.replaced).map(() => w.date)));
  s.steady = counter(ws.filter((w) => w.pct >= 100 && w.sets.length && w.sets.every((x) => x.feel === 'good')).map((w) => w.date));
  s.leap = counter(ws.filter((w) => w.date.slice(5) === '02-29').map((w) => w.date).slice(0, 1));
  let mir = 0; s.mirror = best(ws.filter((w) => w.sets.some((x) => x.side)).map((w) => {
    const ok = [...new Set(w.sets.filter((x) => x.side).map((x) => x.exId))].every((id) => { const L = w.sets.filter((x) => x.exId === id && x.side === 'L'), R = w.sets.filter((x) => x.exId === id && x.side === 'R'); return L.length === R.length && L.every((l, i) => (l.r != null ? R[i].r === l.r : R[i].t === l.t)); });
    return [w.date, (mir = ok ? mir + 1 : 0)];
  }));
  const cl = typeof climbStats === 'function' ? climbStats(ws, s.prByW) : null;
  s.summits = cl ? cl.summits : []; s.expeditions = cl ? cl.expeditions : []; s.climb = cl;
  return s;
}

/* ---------- the trophies ---------- */
const T_ = (id, fam, group, name, cond, stat, tiers, fmt) => ({ id, fam, group, name, cond, stat, tiers, fmt: fmt || ((v) => String(Math.round(v))) });
const fT = (v) => (v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en')) + ' t';
const fX = (v) => '× ' + (Math.round(v * 100) / 100);
const fH = (v) => Math.floor(v) + ' h';
const fS = (v) => Math.round(v) + ' s';
const TROPHIES = [
  T_('on-target', 'goal', 'Goals', 'On Target', 'Meet your weekly goal', 'onTarget', [1]),
  T_('hot-streak', 'goal', 'Goals', 'Hot Streak', 'Meet your weekly goal weeks in a row', 'hot', [3, 6, 12, 26, 52]),
  T_('monthly-mission', 'goal', 'Goals', 'Monthly Mission', 'Meet your monthly goal', 'months', [1, 3, 6, 12]),
  T_('iron-habit', 'goal', 'Goals', 'Iron Habit', 'Meet your monthly goal months in a row', 'iron', [3, 6, 12]),
  T_('perfect-month', 'goal', 'Goals', 'Perfect Month', 'Meet the weekly goal every week of a calendar month', 'perfect', [1, 3, 6]),
  T_('overachiever', 'goal', 'Goals', 'Overachiever', 'Beat your weekly goal by one session or more', 'over', [1, 5, 15]),
  T_('full-marks', 'goal', 'Goals', 'Full Marks Week', 'Meet the weekly goal with every session at 100 %', 'fullMarks', [1, 5, 15]),
  T_('runners-rhythm', 'goal', 'Goals', "Runner's Rhythm", 'Meet your weekly run goal', 'runWeeks', [4, 12, 26]),
  T_('comeback-streak', 'goal', 'Goals', 'Comeback Streak', 'Rebuild a 4-week streak after losing one', 'comeback', [1]),
  T_('joker', 'goal', 'Goals', 'Saved by the Joker', 'Keep a streak alive with a joker week', 'joker', [1]),

  T_('first-step', 'career', 'Consistency', 'First Step', 'Finish your first session', 'sessions', [1]),
  T_('sessions', 'career', 'Consistency', 'Sessions', 'Finish sessions', 'sessions', [10, 50, 100, 200, 300]),
  T_('club-500', 'career', 'Consistency', '500 Club', 'Finish 500 sessions', 'sessions', [500]),
  T_('finisher', 'career', 'Consistency', 'Finisher', 'Finish sessions at 100 %', 'full', [1, 10, 50, 100, 250]),
  T_('flawless', 'career', 'Consistency', 'Flawless Run', 'Finish sessions at 100 % in a row', 'flawless', [3, 5, 10, 20, 40]),
  T_('week-complete', 'career', 'Plan', 'Week Complete', 'Complete every required session of a plan week', 'weeks', [1, 10, 25, 50, 100]),
  T_('cycle-done', 'career', 'Plan', 'Cycle Done', 'Complete a full plan cycle', 'cycles', [1, 3, 6, 12]),
  T_('full-block', 'career', 'Plan', 'Full Block', 'Complete every cycle of a plan in a row', 'block', [1]),
  T_('smart-deload', 'career', 'Plan', 'Smart Deload', 'Finish every session of a light week', 'light', [1, 5, 10]),
  T_('architect', 'career', 'Plan', 'Architect', 'Create a plan and finish a session from it', 'architect', [1]),
  T_('on-schedule', 'career', 'Plan', 'Right on Schedule', 'Do a session on the day you planned it', 'schedule', [1, 10, 50, 100]),
  T_('first-record', 'career', 'Strength', 'First Record', 'Set your first personal record', 'records', [1]),
  T_('record-breaker', 'career', 'Strength', 'Record Breaker', 'Set personal records', 'records', [10, 25, 50, 100, 250]),
  T_('all-rounder', 'career', 'Strength', 'All-Rounder', 'Set a record in every category', 'allRound', ['cats']),
  T_('heavy-lifter', 'career', 'Strength', 'Heavy Lifter', 'Total weight lifted', 'tonnage', [1, 10, 50, 250, 1000], fT),
  T_('squat-std', 'career', 'Strength', 'Squat Standard', 'Back squat one rep at bodyweight ×', 'squat', [1, 1.25, 1.5, 1.75], fX),
  T_('deadlift-std', 'career', 'Strength', 'Deadlift Standard', 'Deadlift one rep at bodyweight ×', 'dead', [1.5, 1.75, 2], fX),
  T_('pullup-power', 'career', 'Strength', 'Pull-up Power', 'Strict pull-ups in one set', 'pullups', [5, 10, 15, 20]),
  T_('weighted-pullup', 'career', 'Strength', 'Weighted Pull-up', 'One pull-up with added weight (kg)', 'wpull', [10, 20, 30], (v) => '+' + v + ' kg'),
  T_('one-leg', 'career', 'Strength', 'One Leg Strong', 'Bulgarian split squat, 6 reps, dumbbells totalling bodyweight ×', 'oneLeg', [0.5, 0.75, 1], fX),
  T_('pushup-power', 'career', 'Strength', 'Push-up Power', 'Push-ups in one set', 'pushups', [20, 30, 40, 50]),
  T_('core-steel', 'career', 'Strength', 'Core of Steel', 'Side plank hold on each side', 'plank', [60, 90, 120], fS),
  T_('iron-grip', 'career', 'Strength', 'Iron Grip', 'Farmer carry 30 m, dumbbells totalling bodyweight ×', 'grip', [0.75, 1, 1.25], fX),
  T_('record-collector', 'career', 'Records', 'Record Collector', 'Set a record on different exercises', 'recordEx', [5, 15, 25, 40]),
  T_('plate-club', 'career', 'Records', 'Plate Club', 'Lift a barbell loaded with 1, 2 then 3 plates a side', 'plate', [60, 100, 140], (v) => Math.round(v) + ' kg'),
  T_('glow-up', 'career', 'Records', 'Glow Up', 'Beat your first session on a weighted exercise by', 'glow', [25, 50, 100], (v) => '+' + Math.round(v) + ' %'),
  T_('plateau-breaker', 'career', 'Records', 'Plateau Breaker', 'Beat a record that stood for 3 months or more', 'plateau', [1, 5, 15]),
  T_('still-got-it', 'career', 'Records', 'Still Got It', 'Set a record in your first session after 2 weeks off', 'stillGot', [1]),
  T_('twin-records', 'career', 'Records', 'Twin Records', 'Set a record on the left and on the right in the same session', 'twin', [1, 10, 25]),
  T_('on-a-roll', 'career', 'Strength', 'On a Roll', 'Set a personal record weeks in a row', 'roll', [2, 4, 8]),
  T_('cat-legs', 'career', 'Categories', 'Never Skip Leg Day', 'Sets of leg exercises', 'cat_Legs', [100, 400, 1000, 2000, 4500]),
  T_('cat-power', 'career', 'Categories', 'Explosive Personality', 'Sets of power exercises', 'cat_Power', [150, 400, 1200, 2500, 5000]),
  T_('cat-back', 'career', 'Categories', 'Got Your Back', 'Sets of back exercises', 'cat_Back', [75, 200, 650, 1300, 2500]),
  T_('cat-core', 'career', 'Categories', 'Core Values', 'Sets of core exercises', 'cat_Core', [75, 200, 650, 1300, 2500]),
  T_('cat-shoulders', 'career', 'Categories', 'Boulder Shoulders', 'Sets of shoulder exercises', 'cat_Shoulders', [30, 100, 300, 550, 1100]),
  T_('cat-chest', 'career', 'Categories', 'Chest Quest', 'Sets of chest exercises', 'cat_Chest', [30, 100, 300, 550, 1100]),
  T_('cat-biceps', 'career', 'Categories', 'Gun Show', 'Sets of biceps and forearm exercises', 'cat_Biceps', [20, 50, 150, 300, 600]),
  T_('cat-triceps', 'career', 'Categories', 'Tri Hard', 'Sets of triceps exercises', 'cat_Triceps', [20, 50, 150, 300, 600]),
  T_('cat-cond', 'career', 'Categories', 'Sweat Equity', 'Sets of conditioning exercises', 'cat_Conditioning', [25, 70, 200, 400, 800]),
  T_('cat-mobility', 'career', 'Categories', 'Stretch Goals', 'Warm-up, mobility and cool-down sets', 'cat_Mobility', [40, 125, 375, 750, 1500]),
  T_('set-collector', 'career', 'Volume', 'Set Collector', 'Sets completed', 'sets', [500, 1000, 2500, 5000, 10000]),
  T_('rep-machine', 'career', 'Volume', 'Rep Machine', 'Reps completed', 'reps', [5000, 10000, 25000, 50000, 100000]),
  T_('hours-in', 'career', 'Volume', 'Hours In', 'Hours of training', 'hours', [10, 50, 100, 250, 500], fH),
  T_('big-day', 'career', 'Volume', 'Big Day', 'Weight lifted in a single session', 'bigDay', [5, 10, 15], fT),
  T_('left-leads', 'career', 'Balance', 'Left Leads', 'Sets on the left side', 'left', [250, 500, 1000, 2500, 5000]),
  T_('balanced', 'career', 'Balance', 'Balanced', 'Sessions with every planned left and right set done', 'balanced', [10, 25, 50]),
  T_('explorer', 'career', 'Variety', 'Explorer', 'Different exercises used', 'explorer', [10, 25, 50]),
  T_('full-spectrum', 'career', 'Variety', 'Full Spectrum', 'Train every category in one week', 'spectrum', [1]),
  T_('engine', 'career', 'Cardio', 'Engine', 'Conditioning sessions finished', 'engine', [5, 25, 50, 100]),
  T_('first-run', 'career', 'Cardio', 'First Run', 'Log your first run', 'runs', [1]),
  T_('runner', 'career', 'Cardio', 'Runner', 'Runs logged', 'runs', [10, 25, 50, 100, 250]),
  T_('double-day', 'career', 'Cardio', 'Double Day', 'A session and a run on the same day', 'double', [1, 10, 25]),
  T_('first-checkin', 'career', 'Body and tests', 'First Check-in', 'Log your first body measurement', 'checkin', [1]),
  T_('tested', 'career', 'Body and tests', 'Tested', 'Complete the test battery', 'tested', [1, 3, 6, 12]),
  T_('getting-better', 'career', 'Body and tests', 'Getting Better', 'Improve a test result', 'better', [1, 5, 15, 30]),
  T_('level-up', 'career', 'Body and tests', 'Level Up', 'Beat your first results on every test', 'levelUp', [1]),
  T_('checkin-habit', 'career', 'Body and tests', 'Check-in Habit', 'Log your body weight weeks in a row', 'habit', [4, 12, 26]),
  T_('active-months', 'career', 'Loyalty', 'Active Months', 'Train in different months', 'months', [3, 6, 12, 24, 36]),
  T_('all-year', 'career', 'Loyalty', 'All Year Round', 'Train every month for 12 months in a row', 'allYear', [12]),
  T_('anniversary', 'career', 'Loyalty', 'Anniversary', 'Years since your first session', 'anniv', [1, 2, 3]),
  T_('comeback', 'career', 'Loyalty', 'Comeback', 'Come back after 3 weeks or more without a session', 'comeback', [1]),
  T_('summit', 'career', 'Expeditions', 'Summit', 'Reach a summit', 'summits', Array.from({ length: 25 }, (_, i) => i + 1)),
  T_('expedition', 'career', 'Expeditions', 'Expedition Complete', 'Finish an expedition', 'expeditions', [1, 2, 3]),

  T_('early-bird', 'secret', 'Secret', 'Early Bird', 'Finish 10 sessions started before 7:30', 'early', [10]),
  T_('night-owl', 'secret', 'Secret', 'Night Owl', 'Finish 10 sessions started after 21:00', 'night', [10]),
  T_('fresh-start', 'secret', 'Secret', 'Fresh Start', 'Train on 1 January', 'newYear', [1]),
  T_('weekend-warrior', 'secret', 'Secret', 'Weekend Warrior', 'Finish 10 sessions on a Sunday', 'sunday', [10]),
  T_('seven-days', 'secret', 'Secret', 'Seven Days', 'Train or run 7 days in a row', 'seven', [7]),
  T_('plan-b', 'secret', 'Secret', 'Plan B', 'Replace 10 exercises during sessions', 'planB', [10]),
  T_('steady-hands', 'secret', 'Secret', 'Steady Hands', 'Finish 10 sessions at 100 % with every set rated Good', 'steady', [10]),
  T_('unbreakable', 'secret', 'Secret', 'Unbreakable', 'Reach a 52-week streak without using a joker', 'unbroken', [52]),
  T_('triple-crown', 'secret', 'Secret', 'Triple Crown', 'Set 3 personal records in one session', 'triple', [3]),
  T_('sneaky-strong', 'secret', 'Secret', 'Sneaky Strong', 'Set a record during a light week', 'sneaky', [1]),
  T_('perfect-mirror', 'secret', 'Secret', 'Perfect Mirror', 'Match your left reps on the right in every set, 10 sessions in a row', 'mirror', [10]),
  T_('leap-day', 'secret', 'Secret', 'Leap Day', 'Train on 29 February', 'leap', [1]),
  T_('full-house', 'secret', 'Secret', 'Full House', 'Finish every session of your plan, optional ones included, in one week', 'house', [1]),

  T_('mind-over-body', 'ultimate', 'Ultimate', 'Mind Over Body', 'Unlock every other trophy at its highest level', 'maxed', ['all'])
];

function tiersOf(t, stats) { return t.tiers.map((x) => (x === 'cats' ? stats.allRoundNeed || 1 : x === 'all' ? TROPHIES.length - 1 : x)); }
function levelOf(t, stats) {
  const tiers = tiersOf(t, stats); const stat = stats[t.stat] || []; const v = valueOf(stat); let level = 0; const dates = [];
  tiers.forEach((x) => { const d = dateFor(stat, x); if (d) { level += 1; dates.push(d); } });
  return { level, max: tiers.length, value: v, next: tiers[level], dates, tiers };
}

/* ---------- one cached computation of everything ---------- */
let AW = { key: null, data: null };
function awardsKey() {
  const ws = D.workouts; const last = ws.length ? (ws[ws.length - 1].upd || 0) : 0;
  return [ws.length, ws.filter((w) => w.end).length, last, Object.keys(D.runs || {}).length, ((D.body || {}).measures || []).length, ((D.body || {}).tests || []).length, JSON.stringify(D.eras || {}).length, Object.keys(D.planned || {}).length, Object.keys(D.exercises).length, iso()].join('|');
}
function awards() {
  if (ensureEra()) save();
  const key = awardsKey(); if (AW.key === key && AW.data) return AW.data;
  const ws = finished(); const career = careerStats(ws);
  const eraRes = erasList().map((e) => ({ era: e, res: evalEra(e, ws) }));
  const cur = eraRes.find((x) => !x.era.to);
  career.unbroken = best([].concat(...eraRes.map((x) => x.res.stats.unbroken)));
  const out = { career, eras: eraRes, cur, list: [] };
  TROPHIES.filter((t) => t.fam !== 'ultimate').forEach((t) => {
    if (t.fam === 'goal') {
      const lv = levelOf(t, cur.res.stats);
      const bestEver = Math.max(lv.level, ...eraRes.map((x) => levelOf(t, x.res.stats).level));
      const applies = t.id !== 'runners-rhythm' || !!cur.era.runs;
      out.list.push(Object.assign({ t, eraId: cur.era.id, bestEver, applies }, lv));
    } else out.list.push(Object.assign({ t }, levelOf(t, career)));
  });
  const maxedDates = out.list.map((x) => (x.t.fam === 'goal' ? (x.bestEver >= x.max ? 'y' : null) : (x.level >= x.max ? x.dates[x.max - 1] : null)));
  const maxed = maxedDates.filter(Boolean).length;
  const ult = TROPHIES.find((t) => t.fam === 'ultimate');
  out.list.push(Object.assign({ t: ult }, { level: maxed >= TROPHIES.length - 1 ? 1 : 0, max: 1, value: maxed, next: TROPHIES.length - 1, dates: maxed >= TROPHIES.length - 1 ? [iso()] : [], tiers: [TROPHIES.length - 1] }));
  AW = { key, data: out };
  return out;
}
const unlockedKeys = (A) => A.list.flatMap((x) => Array.from({ length: x.level }, (_, i) => x.t.id + ':' + (i + 1) + (x.eraId ? ':' + x.eraId : '')));

/* ---------- streak chip + goals card on Today ---------- */
const FLAME = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 2 2s-.5-4 1-7z"/></svg>';
const FLAKE = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3"/></svg>';
const CUP = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>';
function ring(v, goal, size, label, sub) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, f = Math.min(1, goal ? v / goal : 0);
  return `<div class="g-ring${f >= 1 ? ' met' : ''}"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="trk"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="val" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span class="g-num">${v}<small>/${goal}</small></span><span class="g-lab">${label}</span>${sub ? `<span class="muted sm">${sub}</span>` : ''}</div>`;
}
function goalsCardHTML() {
  const A = awards(); const r = A.cur.res; const e = A.cur.era; const unlocked = A.list.reduce((n, x) => n + (x.level > 0 ? 1 : 0), 0);
  return `<section class="card goals-card"><div class="row between"><span class="eyebrow">GOALS</span><button class="link" data-act="go" data-v="progress">Progress ›</button></div>
    <div class="goals-row">${ring(r.now.count, e.weekly, 76, 'This week')}${ring(r.monthNow.count, e.monthly, 76, MONTHS[new Date().getMonth()])}
      <div class="streak-box${r.streak ? ' lit' : ''}"><span class="flame">${FLAME}</span><span class="big-num">${r.streak}</span><span class="g-lab">week streak</span><span class="jokers" aria-label="${r.jokers} joker${r.jokers === 1 ? '' : 's'}">${Array.from({ length: 2 }, (_, i) => `<i class="${i < r.jokers ? 'on' : ''}">${FLAKE}</i>`).join('')}</span></div></div>
    ${e.runs ? `<p class="muted sm">Runs this week: ${r.now.runs}/${e.runs}</p>` : ''}
    <button class="trophy-line" data-act="go" data-v="progress"><span class="cup">${CUP}</span><span><b>${unlocked}</b> of ${TROPHIES.length} trophies</span><span class="muted sm">See all ›</span></button></section>`;
}


/* ---------- medal artwork: shape by metal, icon by family, Peak ribbon ---------- */
const MED = { Bronze: ['#D9935E', '#A8673A', '#C47F4C'], Silver: ['#D3DAE3', '#8E99A8', '#BCC5D1'], Gold: ['#F5C95A', '#B8862A', '#E8B53F'], Platinum: ['#8FE6DC', '#3FA79B', '#74D3C8'], Diamond: ['#B9D0FF', '#5C7FD1', '#9CB9F7'], Locked: ['#4B5260', '#2F343D', '#3E444F'], Secret: ['#2A2F38', '#1B1F26', '#232830'], Ultimate: ['#F5C95A', '#B8862A', '#E8B53F'] };
const FAM_IC = { bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>', arm: '<path d="M5 18c2-6 4-9 7-10 2-.7 3 .5 2.5 2l-1.5 2c2-1 4.5-.5 5.5 1.5 1 2.5-1 4.5-4 4.5H5z"/><path d="M9 11c.8-1.5 1.8-2.4 3-2.8"/>', flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 2 2s-.5-4 1-7z"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>', cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4"/>', clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9.5 3.5h5v3h-5zM9 11h6M9 15h4"/>', db: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>', stack: '<path d="M12 4l9 4-9 4-9-4zM3 12l9 4 9-4M3 16l9 4 9-4"/>', scale: '<path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z"/>', grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>', run: '<circle cx="15" cy="4.5" r="2"/><path d="M13 8l-3 5 4 3v5M10 13l-4 1M14 9l3 3h3"/>', ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v2"/>', heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>', mount: '<path d="M3 20l6-10 4 6 2-3 6 7zM15 10V4l4 1.5-4 1.5"/>', moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>', lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>', crown: '<path d="M4 17l1.5-9 4.5 4 2-6 2 6 4.5-4L20 17zM4 20h16"/>' };
const GROUP_IC = { Records: 'bolt', Categories: 'arm', Goals: 'target', Consistency: 'cal', Plan: 'clip', Strength: 'db', Volume: 'stack', Balance: 'scale', Variety: 'grid', Cardio: 'run', 'Body and tests': 'ruler', Loyalty: 'heart', Expeditions: 'mount', Secret: 'moon', Ultimate: 'crown' };
const iconOf = (t) => (['hot-streak', 'unbreakable', 'comeback-streak', 'joker'].includes(t.id) ? 'flame' : GROUP_IC[t.group] || 'target');
function medalSVG(metal, icon, S) {
  const [f, d, inner] = MED[metal]; const ink = metal === 'Secret' ? '#9AA3B2' : metal === 'Locked' ? '#8A93A3' : '#3A2A12';
  let shape;
  if (metal === 'Platinum') shape = `<polygon points="28,12 72,12 94,50 72,88 28,88 6,50" fill="${d}"/><polygon points="31,17 69,17 88,50 69,83 31,83 12,50" fill="${f}"/><polygon points="35,25 65,25 80,50 65,75 35,75 20,50" fill="${inner}"/>`;
  else if (metal === 'Diamond') shape = `<polygon points="26,10 74,10 96,40 50,94 4,40" fill="${d}"/><polygon points="28,15 72,15 90,40 50,87 10,40" fill="${f}"/><path d="M10 40h80M28 15l10 25 12-25 12 25 10-25M38 40l12 47 12-47" stroke="${d}" stroke-width="1.6" fill="none" opacity=".7"/>`;
  else {
    shape = `<circle cx="50" cy="50" r="40" fill="${d}"/><circle cx="50" cy="50" r="35" fill="${f}"/><circle cx="50" cy="50" r="27" fill="${inner}"/>`;
    if (metal === 'Silver') shape = `<circle cx="50" cy="50" r="46" fill="none" stroke="${d}" stroke-width="3" stroke-dasharray="5 4"/>` + shape;
    if (metal === 'Gold' || metal === 'Ultimate') { let l = ''; for (let i = 0; i < 6; i++) { [200 + i * 22, -20 - i * 22].forEach((deg) => { const a = deg * Math.PI / 180; const cx = 50 + 46 * Math.cos(a), cy = 50 - 46 * Math.sin(a); l += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="7" ry="3.5" fill="#B8862A" transform="rotate(${(90 - deg).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`; }); } shape = l + shape; }
    if (metal === 'Ultimate') shape = '<circle cx="50" cy="50" r="48" fill="none" stroke="#5EA2FF" stroke-width="3"/><circle cx="50" cy="50" r="44" fill="none" stroke="#FF9E4A" stroke-width="2"/>' + shape;
  }
  const plain = metal === 'Locked' || metal === 'Secret';
  const ribbon = plain ? '' : '<polygon points="30,70 42,70 38,104 31,97 24,102" fill="#5EA2FF"/><polygon points="58,70 70,70 76,102 69,97 62,104" fill="#FF9E4A"/>';
  const hl = plain ? '' : '<path d="M24 38a28 28 0 0 1 22-20" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/>';
  const ic = metal === 'Secret' ? `<text x="50" y="62" text-anchor="middle" font-size="34" font-weight="800" fill="${ink}">?</text>` : `<g transform="translate(32 32) scale(1.5)" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${FAM_IC[icon]}</g>`;
  return `<svg class="medal-svg" width="${S}" height="${Math.round(S * 1.1)}" viewBox="0 -2 100 110" aria-hidden="true">${ribbon}${shape}${hl}${ic}</svg>`;
}

/* ---------- Progress screen ---------- */
function trophyCard(x) {
  const t = x.t; const locked = x.level === 0; const secretHidden = t.fam === 'secret' && locked;
  const metal = t.fam === 'ultimate' ? (locked ? 'Locked' : 'Ultimate') : x.level ? metalOf(x.level - 1, x.max) : null; const col = metal && MED[metal] ? MED[metal][0] : '#4B5260';
  const art = secretHidden ? medalSVG('Secret', null, 52) : t.fam === 'ultimate' ? medalSVG(locked ? 'Locked' : 'Ultimate', 'crown', 52) : locked ? medalSVG('Locked', 'lock', 52) : medalSVG(metal, iconOf(t), 52);
  const nextTxt = x.level < x.max ? `${t.fmt(Math.min(x.value, x.next))} / ${t.fmt(x.next)}` : 'Max level';
  const pct = x.level < x.max ? Math.max(0, Math.min(100, 100 * x.value / x.next)) : 100;
  const MC = ['#D9935E', '#D3DAE3', '#F5C95A', '#8FE6DC', '#B9D0FF'];
  const dots = x.max > 1 && x.max <= 5 ? `<span class="tdots">${Array.from({ length: x.max }, (_, i) => `<i style="${i < x.level ? 'background:' + MED[metalOf(i, x.max)][0] : ''}"></i>`).join('')}</span>` : x.max > 5 ? `<span class="muted sm">${x.level}/${x.max}</span>` : '';
  const na = x.applies === false;
  return `<button class="trophy${locked ? ' locked' : ''}${t.fam === 'ultimate' ? ' ultimate' : ''}${na ? ' na' : ''}" data-act="tr-open" data-v="${t.id}" aria-label="${secretHidden ? 'Secret trophy' : esc(t.name)}: details"><span class="medal-wrap">${art}</span>
    <span class="tbody"><b>${secretHidden ? '???' : esc(t.name)}</b><small>${secretHidden ? 'Secret trophy' : esc(na ? 'Set a weekly run goal to unlock' : t.cond)}</small>
    ${secretHidden || na ? '' : `<span class="tbar"><i style="width:${pct}%;background:${col}"></i></span><span class="trow"><span class="muted sm">${metal && !locked ? metal + ' · ' : ''}${nextTxt}</span>${dots}</span>`}</span></button>`;
}
function progressView() {
  const A = awards(); const e = A.cur.era; const r = A.cur.res;
  const seg = UI.prTab || 'overview';
  const segs = [['overview', 'Overview'], ['trophies', 'Trophies'], ['gear', 'Gear'], ['archive', 'Archive']];
  const unlocked = A.list.reduce((n, x) => n + (x.level > 0 ? 1 : 0), 0);
  let body = '';
  if (seg === 'overview') {
    const recent = A.list.flatMap((x) => x.dates.map((d, i) => ({ x, d, lvl: i + 1 }))).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 5);
    body = `<div class="prog-grid"><div class="col">
      <section class="card"><div class="row between"><span class="eyebrow">YOUR GOALS</span><button class="btn small outline" data-act="sheet" data-v="goals">Edit goals</button></div>
        <div class="goals-row">${ring(r.now.count, e.weekly, 84, 'This week', e.weekly + ' sessions')}${ring(r.monthNow.count, e.monthly, 84, MONTHS[new Date().getMonth()], e.monthly + ' sessions')}${e.runs ? ring(r.now.runs, e.runs, 84, 'Runs', 'this week') : ''}</div>
        <p class="muted sm">Since ${longDate(e.from)}. Changing a goal archives these goal trophies and opens a new set.</p></section>
      <section class="card streak-card"><div class="streak-box big${r.streak ? ' lit' : ''}"><span class="flame">${FLAME}</span><span class="big-num">${r.streak}</span><span class="g-lab">week streak</span></div>
        <div class="streak-meta"><span><b>${r.bestStreak}</b> best</span><span><b>${r.weeksMet}</b> weeks at goal</span><span class="jokers">${Array.from({ length: 2 }, (_, i) => `<i class="${i < r.jokers ? 'on' : ''}">${FLAKE}</i>`).join('')} <b>${r.jokers}</b> joker${r.jokers === 1 ? '' : 's'}</span></div>
        <p class="muted sm">A joker is earned every 4 weeks at goal (2 max). It saves your streak when a week is missed.</p></section>
    </div><div class="col">
      ${typeof climbCardHTML === 'function' ? climbCardHTML(true) : ''}
      ${withinReachHTML(A)}
      <section class="card"><div class="row between"><span class="eyebrow">TROPHIES · ${unlocked}/${TROPHIES.length}</span><button class="link" data-act="pr-tab" data-v="trophies">All ›</button></div>
        ${recent.length ? `<div class="recent-tro">${recent.map(({ x, d, lvl }) => `<button class="rt" data-act="tr-open" data-v="${x.t.id}">${medalSVG(x.t.fam === 'ultimate' ? 'Ultimate' : metalOf(lvl - 1, x.max), x.t.fam === 'ultimate' ? 'crown' : iconOf(x.t), 44)}<b>${esc(x.t.name)}</b><small>${shortDate(d)}</small></button>`).join('')}</div>` : '<p class="muted sm">Finish a session to unlock your first trophy.</p>'}</section>
      ${trophyCard(A.list.find((x) => x.t.fam === 'ultimate'))}
    </div></div>`;
  } else if (seg === 'trophies') {
    const tab = UI.trTab || 'goal'; const fams = [['goal', 'Goals'], ['career', 'Career'], ['secret', 'Secret']];
    const list = A.list.filter((x) => x.t.fam === tab); const groups = {}; list.forEach((x) => { (groups[x.t.group] = groups[x.t.group] || []).push(x); });
    body = `<div class="seg-ctl">${fams.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" aria-pressed="${tab === k}" data-act="tr-tab" data-v="${k}">${l} <small>${A.list.filter((x) => x.t.fam === k && x.level > 0).length}/${A.list.filter((x) => x.t.fam === k).length}</small></button>`).join('')}</div>
      <p class="muted sm">${unlocked} of ${TROPHIES.length} trophies unlocked.</p>
      ${Object.entries(groups).map(([g, xs]) => `${tab === 'career' ? `<span class="eyebrow">${esc(g.toUpperCase())}</span>` : ''}<div class="trophies">${xs.map((x) => trophyCard(x)).join('')}</div>`).join('')}
      ${trophyCard(A.list.find((x) => x.t.fam === 'ultimate'))}`;
  } else if (seg === 'gear') {
    body = typeof gearGridHTML === 'function' ? gearGridHTML() : '';
  } else {
    const past = A.eras.filter((x) => x.era.to).reverse();
    body = `<div class="prog-grid"><div class="col"><section class="card"><span class="eyebrow">PAST GOALS</span>${past.length ? past.map(({ era }) => { const sm = era.summary || eraSummary(era); return `<div class="era"><b>${era.weekly}/week · ${era.monthly}/month${era.runs ? ' · ' + era.runs + ' runs/week' : ''}</b><span class="muted sm">${shortDate(era.from)} – ${shortDate(era.to)} · ${sm.weeksMet} weeks at goal · best streak ${sm.bestStreak}</span><div class="chips">${sm.trophies.map((g) => { const t = TROPHIES.find((x) => x.id === g.id); const n = t.tiers.length; return `<span class="chip"><i class="dot" style="background:${MED[metalOf(g.level - 1, n)][0]}"></i>${esc(t.name)}</span>`; }).join('') || '<span class="muted sm">No goal trophy</span>'}</div></div>`; }).join('') : '<p class="muted sm">When you change a goal, the trophies of the old goal are kept here with their dates.</p>'}</section></div>
      <div class="col"><section class="card">${typeof summitsArchiveHTML === 'function' ? summitsArchiveHTML() : ''}</section></div></div>`;
  }
  return `<header class="top"><div class="grow"><h1>Progress</h1></div>${typeof accountButton === 'function' ? accountButton() : ''}</header>
    <div class="seg-ctl pr-seg">${segs.map(([k, l]) => `<button class="${seg === k ? 'on' : ''}" aria-pressed="${seg === k}" data-act="pr-tab" data-v="${k}">${l}</button>`).join('')}</div>
    ${body}`;
}
function goalsSheet() {
  const e = currentEra(); const g = UI.goalDraft || { weekly: e.weekly, monthly: e.monthly, runs: e.runs || 0 }; UI.goalDraft = g;
  const step = (k, label, min, max, unit) => `<div class="row between goal-step"><span><b>${label}</b><small class="muted sm"> ${unit}</small></span><div class="st-row"><button class="st-btn" aria-label="Less" data-act="goal-step" data-k="${k}" data-d="-1"${g[k] <= min ? ' aria-disabled="true"' : ''}>−</button><span class="st-val pe-num">${g[k] || (k === 'runs' ? 'Off' : 0)}</span><button class="st-btn" aria-label="More" data-act="goal-step" data-k="${k}" data-d="1">+</button></div></div>`;
  const changed = g.weekly !== e.weekly || g.monthly !== e.monthly || (g.runs || 0) !== (e.runs || 0);
  return `<h2>Your goals</h2>${step('weekly', 'Sessions per week', 1, 7, '')}${step('monthly', 'Sessions per month', 1, 31, '')}${step('runs', 'Runs per week', 0, 7, 'optional')}
    ${changed && e.from < mondayOf(iso()) ? '<p class="note">Saving archives the trophies of your current goals and opens a new set. Your streak restarts.</p>' : ''}
    <button class="btn primary big" data-act="goal-save">Save goals</button>`;
}

/* ---------- unlock pop-ups ---------- */
const POP = { queue: [], open: false };
function readSeen() { try { return JSON.parse(localStorage.getItem(SEEN_KEY)); } catch (e) { return null; } }
function writeSeen(s) { try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
function awardsAfterRender() {
  if (UI.view === 'session' || UI.sheet) return;
  if (typeof climbAfterRender === 'function') climbAfterRender();
  const A = awards(); const keys = unlockedKeys(A); const seen = readSeen();
  if (!seen) { writeSeen(keys); if (keys.length) setTimeout(() => toast(keys.length + ' trophy level' + (keys.length > 1 ? 's' : '') + ' unlocked from your history'), 400); return; }
  const fresh = keys.filter((k) => !seen.includes(k)); if (!fresh.length) return;
  writeSeen(seen.concat(fresh));
  fresh.forEach((k) => { const [id, lvl] = k.split(':'); const x = A.list.find((y) => y.t.id === id); if (x) POP.queue.push({ x, level: Number(lvl) }); });
  showNextPop();
}
function showNextPop() {
  if (POP.open || !POP.queue.length) return; const item = POP.queue.shift(); POP.open = true;
  if (item.summit) { const host = document.createElement('div'); host.className = 'award-pop'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-label', 'Summit reached'); host.innerHTML = summitPopHTML(item.summit); document.body.appendChild(host); try { if (navigator.vibrate) navigator.vibrate([30, 60, 30]); } catch (e) { /* none */ } host.addEventListener('click', (ev) => { if (ev.target.closest('[data-pop="ok"]')) { host.classList.add('out'); setTimeout(() => { host.remove(); POP.open = false; showNextPop(); }, 220); } }); return; }
  const { x, level } = item;
  const metal = metalOf(level - 1, x.max); const col = MED[metal][0];
  const host = document.createElement('div'); host.className = 'award-pop'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-label', 'Trophy unlocked');
  host.innerHTML = `<div class="award-card" style="--m:${col}"><div class="award-face"><span class="pop-medal"><span class="rays" aria-hidden="true"></span>${medalSVG(x.t.fam === 'ultimate' ? 'Ultimate' : metal, x.t.fam === 'ultimate' ? 'crown' : iconOf(x.t), 108)}</span><span class="eyebrow">${x.t.fam === 'secret' ? 'SECRET TROPHY' : 'TROPHY UNLOCKED'}</span><h2>${esc(x.t.name)}</h2><p class="soft">${esc(x.t.cond)}</p><span class="tag" style="color:${col};border-color:${col}">${metal}${x.max > 1 ? ' · level ' + level + '/' + x.max : ''}</span><button class="btn primary big" data-pop="ok">Nice</button></div></div>${['Gold', 'Platinum', 'Diamond'].includes(metal) ? confettiHTML() : ''}`;
  document.body.appendChild(host);
  try { if (navigator.vibrate) navigator.vibrate([20, 40, 30]); } catch (e) { /* no vibration */ }
  host.addEventListener('click', (ev) => { if (ev.target.closest('[data-pop="ok"]') || ev.target === host) { host.classList.add('out'); setTimeout(() => { host.remove(); POP.open = false; showNextPop(); }, 220); } });
}
function confettiHTML() {
  const cols = ['#5EA2FF', '#FF9E4A', '#F2C14E', '#4ADE80', '#F472B6'];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${cols[i % 5]};animation-delay:${(i % 7) * 60}ms;transform:rotate(${i * 47}deg)"></i>`).join('')}</div>`;
}

/* ---------- hooks ---------- */
const EXTRA_VIEWS = { progress: progressView };
const _extraSheetAwards = typeof extraSheet === 'function' ? extraSheet : () => '';
const SECRET_HINTS = {
  'early-bird': 'Some people train before the sun is up.', 'night-owl': 'Some people train when everyone else is asleep.',
  'fresh-start': 'A new year deserves a new start.', 'weekend-warrior': 'Rest day? Not for everyone.',
  'seven-days': 'A full week, without a single day off.', 'plan-b': 'When the machine is taken, adapt.',
  'steady-hands': 'Not too easy, not too hard — again and again.', 'unbreakable': 'A whole year, no safety net.',
  'triple-crown': 'Some days, everything goes up at once.', 'perfect-mirror': 'Left and right, perfectly balanced.',
  'leap-day': 'A day that only comes every four years.', 'sneaky-strong': 'Who said easy weeks are easy?', 'full-house': 'Every box ticked, even the optional ones.'
};
/* ---------- how to get it: one concrete tip per trophy ---------- */
const MONO = new Set(['sessions', 'full', 'records', 'recordEx', 'sets', 'reps', 'hours', 'left', 'tonnage', 'runs', 'engine', 'weeks', 'cycles', 'months', 'balanced', 'explorer', 'checkin', 'double', 'schedule', 'summits', 'better', 'tested', 'light']);
function ratePerWeek(stat) { if (!stat || !stat.length) return 0; const cut = addDays(iso(), -28); const before = stat.slice().reverse().find(([d]) => d <= cut); return Math.max(0, (valueOf(stat) - (before ? before[1] : 0)) / 4); }
const inWeeks = (n) => (n <= 1.5 ? 'about a week' : n < 8 ? '~' + Math.round(n) + ' weeks' : n < 104 ? '~' + Math.round(n / 4.35) + ' months' : 'over 2 years');
const CAT_ROUTINE = { Legs: 'Leg day', Chest: 'Push', Triceps: 'Push', Shoulders: 'Push', Back: 'Pull', Biceps: 'Pull', Core: 'Core', Power: 'Power & athletic', Conditioning: 'Full body C' };
function tipFor(x, A) {
  const t = x.t; const s = A.career; if (x.level >= x.max) return ''; if (t.fam === 'secret' && x.level === 0) return SECRET_HINTS[t.id] || '';
  const rem = x.next - x.value; const bw = typeof bwAt === 'function' ? bwAt(iso()) : null; const kg = (v) => Math.ceil(v / 2.5) * 2.5;
  const paced = (unit) => { const r = ratePerWeek(s[t.stat]); return r > 0 ? `About ${r < 10 ? Math.round(r * 10) / 10 : Math.round(r)} ${unit} a week lately → next level in ${inWeeks(rem / r)}.` : ''; };
  if (t.fam === 'goal') {
    const e = A.cur.era; const ws = finished(); const wk = ws.filter((w) => w.date >= mondayOf(iso())).length; const mo = ws.filter((w) => w.date.slice(0, 7) === iso().slice(0, 7)).length;
    const left = Math.max(0, e.weekly - wk); const week = left ? `${left} more session${left > 1 ? 's' : ''} this week (${wk}/${e.weekly}).` : `This week's goal is met (${wk}/${e.weekly}).`;
    switch (t.id) {
      case 'monthly-mission': case 'iron-habit': return `${mo}/${e.monthly} sessions this month. ${t.id === 'iron-habit' ? 'Meet the monthly goal several months in a row.' : 'About ' + Math.ceil(e.monthly / 4.3) + ' a week does it.'}`;
      case 'runners-rhythm': return `Log ${e.runs} run(s) a week with “I ran today”.`;
      case 'overachiever': return `Do one session more than your goal in a week: ${e.weekly + 1} this week.`;
      case 'full-marks': return `Meet the weekly goal with every session at 100 % — tick every set. ${week}`;
      case 'perfect-month': return 'Meet the weekly goal every week of one calendar month.';
      case 'joker': return 'Miss a week while holding a joker: it saves your streak (earned every 4 weeks at goal).';
      case 'comeback-streak': return 'After losing a streak, meet your weekly goal 4 weeks in a row again.';
      default: return week + ' Plan the rest in the calendar.';
    }
  }
  if (t.stat.startsWith('cat_')) {
    const c = t.stat.slice(4); const p = paced('sets');
    if (p) return p + (c === 'Mobility' ? ' Daily mobility adds about 8 sets a day.' : '');
    return c === 'Mobility' ? 'Do the daily mobility from Today: 8 sets in 10 minutes.' : `Not in your recent sessions. Start a ${CAT_ROUTINE[c] || 'routine'} routine from Free session to get going.`;
  }
  switch (t.id) {
    case 'plate-club': return x.value ? `Your best barbell lift is ${Math.round(x.value)} kg: ${Math.round(rem)} kg to go. The deadlift usually gets there first.` : 'Load a barbell with one 20 kg plate a side (60 kg) on a deadlift or a squat.';
    case 'glow-up': return `Best so far: ${t.fmt(x.value)}. Accessory exercises grow fastest — follow the suggested weights and rate every set.`;
    case 'record-collector': return `Records on ${x.value} exercises. Any exercise done twice can give a record: a routine brings in new ones.`;
    case 'plateau-breaker': return 'Pick a lift stuck for 3 months: drop the weight 10 % for two weeks, then go back for a record.';
    case 'still-got-it': return 'After 2 weeks or more off, go for a rep record on a light accessory exercise in your first session back.';
    case 'twin-records': return 'On a left/right exercise (Bulgarian split squat, DB row…), add one rep on the left and match it on the right in the same session.';
    case 'on-a-roll': return 'Set at least one record every week — any exercise, any side counts.';
    case 'first-record': case 'record-breaker': return paced('records') || 'Beat your last best on any exercise: one more rep at the same weight counts.';
    case 'squat-std': case 'deadlift-std': return bw ? `At ${bw} kg body weight: one rep at ${kg(x.next * bw)} kg (best so far ${t.fmt(x.value)}).` : 'Log your body weight in Body to see the weight to lift.';
    case 'one-leg': return bw ? `At ${bw} kg: 6 reps per leg with two ${kg(x.next * bw / 2)} kg dumbbells.` : 'Log your body weight in Body to see the dumbbells to use.';
    case 'iron-grip': return bw ? `At ${bw} kg: 30 m with two ${kg(x.next * bw / 2)} kg dumbbells.` : 'Log your body weight in Body to see the dumbbells to use.';
    case 'pullup-power': return `Best ${x.value} strict reps: ${rem} to go. Add one rep every week or two; on weighted weeks, finish with a body-weight max set.`;
    case 'weighted-pullup': return `Best +${x.value} kg: add 2 kg once you reach 4 × 8 clean, as in your plan.`;
    case 'pushup-power': return `Best ${x.value}: ${rem} to go. One max set at the end of a Push routine, once a week.`;
    case 'core-steel': return `Best ${t.fmt(x.value)} per side: add 10 s every week.`;
    case 'finisher': case 'flawless': return 'Tick every set, warm-up and mobility included — optional blocks never count against you.';
    case 'explorer': return `${x.value} different exercises so far. Routines pick the ones you have not done yet.`;
    case 'full-spectrum': return 'One week with every category: your plan plus a Push routine covers chest and triceps.';
    case 'all-rounder': return 'A record in every category: a Push routine covers chest and triceps, the plan does the rest.';
    case 'big-day': return 'A long Leg day or Full body A at 1 h 30 adds up fast.';
    case 'on-schedule': return 'Plan your next session in the calendar, then do it that day.';
    case 'mind-over-body': return 'Every other trophy at its highest level — the list below shows what is left.';
    default: break;
  }
  if (MONO.has(t.stat)) { const U = { hours: 'hours', tonnage: 'tonnes', sets: 'sets', reps: 'reps', left: 'left sets', runs: 'runs', summits: 'summits', records: 'records' }; const p = paced(U[t.stat] || 'times'); if (p) return p; }
  return `${t.fmt(Math.max(0, rem))} to go for the next level.`;
}
function withinReach(A) {
  return A.list.filter((x) => x.t.fam !== 'ultimate' && !(x.t.fam === 'secret' && x.level === 0) && x.applies !== false && x.level < x.max && x.next > 0)
    .map((x) => ({ x, p: Math.min(0.999, x.value / x.next) })).sort((a, b) => b.p - a.p)
    .filter((y, i, arr) => y.x.t.fam !== 'goal' || arr.findIndex((z) => z.x.t.fam === 'goal') === i).slice(0, 3); // at most one goal trophy
}
function withinReachHTML(A) {
  const L = withinReach(A); if (!L.length) return '';
  return `<section class="card"><span class="eyebrow">WITHIN REACH</span><div class="reach">${L.map(({ x, p }) => { const m = metalOf(x.level, x.max);
    return `<button class="reach-row" data-act="tr-open" data-v="${x.t.id}">${medalSVG(m, iconOf(x.t), 40)}<span class="grow"><span class="row between"><b>${esc(x.t.name)}</b><span class="muted sm">${x.t.fmt(x.value)} / ${x.t.fmt(x.next)}</span></span><span class="tbar"><i style="width:${Math.round(p * 100)}%;background:${MED[m][0]}"></i></span><small class="muted">${esc(tipFor(x, A))}</small></span></button>`; }).join('')}</div></section>`;
}
function trophySheet() {
  const A = awards(); const x = A.list.find((y) => y.t.id === UI.trId); if (!x) return '';
  const t = x.t; const locked = x.level === 0; const secretHidden = t.fam === 'secret' && locked;
  const metal = t.fam === 'ultimate' ? (locked ? 'Locked' : 'Ultimate') : x.level ? metalOf(x.level - 1, x.max) : null;
  const art = secretHidden ? medalSVG('Secret', null, 120) : t.fam === 'ultimate' ? medalSVG(locked ? 'Locked' : 'Ultimate', 'crown', 120) : locked ? medalSVG('Locked', 'lock', 120) : medalSVG(metal, iconOf(t), 120);
  const head = `<div class="tr-head${locked ? ' locked' : ''}"><div class="pop-medal">${locked ? '' : '<span class="rays"></span>'}${art}</div>
    <span class="eyebrow">${esc(t.fam === 'goal' ? 'GOAL TROPHY' : t.fam === 'secret' ? 'SECRET TROPHY' : t.fam === 'ultimate' ? 'ULTIMATE TROPHY' : String(t.group).toUpperCase())}</span>
    <h2>${secretHidden ? '???' : esc(t.name)}</h2><p class="soft">${secretHidden ? esc(SECRET_HINTS[t.id] || 'Keep training — it will reveal itself.') : esc(t.cond)}</p></div>`;
  if (secretHidden) return head + '<p class="muted sm center">The condition stays hidden until you unlock it.</p>';
  let era = '';
  if (t.fam === 'goal') {
    const e = A.cur.era; era = `<p class="muted sm">Current goals since ${longDate(e.from)} · ${e.weekly}/week · ${e.monthly}/month${e.runs ? ' · ' + e.runs + ' run' + (e.runs > 1 ? 's' : '') + '/week' : ''}${x.bestEver > x.level ? ` · best with earlier goals: level ${x.bestEver}` : ''}</p>`;
    if (x.applies === false) era += '<p class="muted sm">Set a weekly run goal to unlock this trophy.</p>';
  }
  const pct = x.level < x.max ? Math.max(0, Math.min(100, 100 * x.value / x.next)) : 100;
  const prog = x.level < x.max
    ? `<section class="card tr-prog"><div class="row between"><span class="eyebrow">NEXT · ${esc(t.fam === 'ultimate' ? 'Ultimate' : metalOf(x.level, x.max))}</span><b>${t.fmt(Math.min(x.value, x.next))} / ${t.fmt(x.next)}</b></div><span class="tbar"><i style="width:${pct}%;background:${MED[t.fam === 'ultimate' ? 'Ultimate' : metalOf(x.level, x.max)][0]}"></i></span><small class="muted">${Math.round(pct)} %</small></section>`
    : `<section class="card tr-prog"><b>Highest level reached 🎉</b></section>`;
  const tip = tipFor(x, A); const tipHTML = tip ? `<section class="card tr-tip"><span class="eyebrow">HOW TO GET IT</span><p>${esc(tip)}</p></section>` : '';
  let levels = '';
  if (t.fam !== 'ultimate') {
    const many = x.max > 8; const show = many ? x.tiers.map((v, i) => i).filter((i) => i < x.level + 2 && (i >= x.level - 3 || i === 0)) : x.tiers.map((v, i) => i);
    levels = `<section class="card"><span class="eyebrow">LEVELS · ${x.level}/${x.max}</span><ul class="tr-levels">${show.map((i) => { const m = metalOf(i, x.max); const got = i < x.level;
      return `<li class="${got ? 'got' : ''}"><span class="lv-dot" style="background:${got ? MED[m][0] : 'transparent'};border-color:${MED[m][0]}"></span><span class="grow">${m} · ${esc(t.fmt(x.tiers[i]))}</span><span class="muted sm">${got ? (x.dates[i] ? longDate(x.dates[i]) : 'unlocked') : 'locked'}</span></li>`; }).join('')}</ul>${many && show.length < x.max ? `<p class="muted sm">${x.max} levels in total.</p>` : ''}</section>`;
  } else {
    const left = A.list.filter((y) => y.t.fam !== 'ultimate' && (y.t.fam === 'goal' ? y.bestEver < y.max : y.level < y.max));
    levels = `<section class="card"><span class="eyebrow">STILL TO MAX · ${left.length}</span><ul class="tr-left">${left.map((y) => `<li><button class="linkish" data-act="tr-open" data-v="${y.t.id}">${y.t.fam === 'secret' && y.level === 0 ? '???' : esc(y.t.name)}</button><span class="muted sm">${y.t.fam === 'goal' ? y.bestEver : y.level}/${y.max}</span></li>`).join('')}</ul></section>`;
  }
  return head + era + prog + tipHTML + levels;
}
function timerSheet() {
  const w = active(); const it = w && w.items[w.cur]; const ex = it && D.exercises[it.exId]; const def = ex && ex.rest;
  const opts = [30, 60, 90, 120, 180]; if (def && !opts.includes(def)) opts.push(def); opts.sort((a, b) => a - b);
  return `<h2>Rest timer</h2><p class="muted sm">${ex ? esc(ex.name) + ' · default ' + fmtT(def || 0) : 'Pick a duration'}</p>
    <div class="timer-grid">${opts.map((v) => `<button class="btn ${v === def ? 'primary' : 'outline'} big" data-act="timer-go" data-v="${v}">${fmtT(v)}</button>`).join('')}</div>`;
}
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'trophy') return trophySheet();
  if (name === 'timer') return timerSheet();
  if (name === 'goals') return goalsSheet();
  return _extraSheetAwards(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'tr-open') { UI.trId = b.dataset.v; UI.sheet = 'trophy'; render(); const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; return; }
  if (a === 'timer-go') { const w = active(); const it = w && w.items[w.cur]; const ex = it && D.exercises[it.exId]; UI.sheet = null; render(); startRest(Number(b.dataset.v), ex ? ex.name : 'Rest', ex ? ex.id : null); return; }
  if (a === 'tr-tab') { UI.trTab = b.dataset.v; render(); }
  if (a === 'pr-tab') { UI.prTab = b.dataset.v; render(); window.scrollTo(0, 0); }
  if (a === 'goal-step') { const k = b.dataset.k; const lim = { weekly: [1, 7], monthly: [1, 31], runs: [0, 7] }[k]; const g = UI.goalDraft; g[k] = Math.max(lim[0], Math.min(lim[1], (g[k] || 0) + Number(b.dataset.d))); render(); }
  if (a === 'goal-save') {
    const res = setGoals(UI.goalDraft); UI.goalDraft = null; UI.sheet = null; AW.key = null;
    if (res) { save(); toast(res === 'new' ? 'New goals saved — a fresh set of goal trophies is open' : 'Goals updated'); }
    render();
  }
  if (a === 'sheet' && b.dataset.v === 'goals') UI.goalDraft = null;
}, true);

/* ---------- end-of-session summary: ring to the %, records, weekly goal ---------- */
function showSummary(w) {
  AW.key = null; const A = awards(); const r = A.cur.res; const e = A.cur.era;
  const prs = (A.career.prByW || {})[w.id] || 0; const pct = w.pct || 0;
  const weekNow = w.date >= mondayOf(iso()) ? r.now.count : null; const justMet = weekNow != null && weekNow === e.weekly;
  const R = 46, C = 2 * Math.PI * R;
  const gain = typeof climbGainFor === 'function' ? climbGainFor(w) : null;
  const host = document.createElement('div'); host.className = 'award-pop summary'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-label', 'Session summary');
  const cheer = pct >= 100 && typeof pickCheer === 'function' ? pickCheer(w, prs, justMet) : '';
  host.innerHTML = `<div class="award-card"><div class="award-face"><span class="eyebrow">SESSION SAVED</span>${cheer ? `<p class="sum-cheer">${esc(cheer)}</p>` : ''}<h2>${esc(w.name.split(' — ')[0])}</h2>
    <div class="sum-ring"><svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R}" class="trk"/><circle cx="60" cy="60" r="${R}" class="val" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-to="${C * (1 - pct / 100)}" transform="rotate(-90 60 60)"/></svg><span class="big-num" data-count="${pct}">0 %</span></div>
    <p class="soft">${w.sets.length} set${w.sets.length === 1 ? '' : 's'}${w.late ? ' · logged for ' + shortDate(w.date) : ''}</p>
    ${prs ? `<div class="sum-pr"><span class="stars">${'★'.repeat(Math.min(prs, 5))}</span><b>${prs} personal record${prs > 1 ? 's' : ''}</b></div>` : ''}
    ${weekNow != null ? `<div class="sum-week${justMet ? ' met' : ''}">${justMet ? `<span class="flame grow">${FLAME}</span><b>Weekly goal reached</b><span class="muted sm">${r.streak} week streak</span>` : `<b>${weekNow}/${e.weekly}</b><span class="muted sm">sessions this week</span>`}</div>` : ''}
    ${gain ? `<div class="sum-climb"><b>+${gain.m} m</b><span class="muted sm">${esc(gain.label)}</span></div>` : ''}
    <button class="btn primary big" data-pop="ok">Continue</button></div></div>${pct >= 100 ? confettiHTML() : ''}`;
  document.body.appendChild(host);
  const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (f) => setTimeout(() => f(Date.now()), 16);
  raf(() => raf(() => {
    const v = host.querySelector('.val'); if (v) v.style.strokeDashoffset = v.dataset.to;
    const n = host.querySelector('[data-count]'); const to = Number(n.dataset.count); const t0 = Date.now();
    const step = () => { const k = Math.min(1, (Date.now() - t0) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + ' %'; if (k < 1) raf(step); };
    raf(step);
  }));
  host.addEventListener('click', (ev) => { if (ev.target.closest('[data-pop="ok"]')) { host.classList.add('out'); setTimeout(() => { host.remove(); POP.open = false; render(); showNextPop(); }, 220); } });
}
