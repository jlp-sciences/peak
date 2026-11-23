/* Peak — goals, goal eras, weekly streak with jokers, and the 70 trophies.
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
function finished() { return D.workouts.filter((w) => w.end).slice().sort((a, b) => (a.date === b.date ? (a.start || 0) - (b.start || 0) : a.date.localeCompare(b.date))); }
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
    streak, bestStreak, jokers, now, monthNow, weeksMet: metN
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
  const bestSoFar = {}; const prs = [];
  sets.forEach((x) => {
    const ex = exOf(x); if (!ex.type || typeof METRICS === 'undefined') return; const m = primaryMetric(ex); const v = METRICS[m].f([x]); const k = x.exId + (x.side || '');
    if (v > 0 && bestSoFar[k] != null && v > bestSoFar[k]) prs.push({ date: x.date, wid: x.wid, cat: ex.cat });
    if (bestSoFar[k] == null || v > bestSoFar[k]) bestSoFar[k] = v;
  });
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
  s.sets = counter(sets.map((x) => x.date));
  s.reps = cumul(ws.map((w) => [w.date, w.sets.reduce((n, x) => n + (x.r || 0), 0)]));
  s.hours = cumul(ws.map((w) => [w.date, w.late ? 0 : Math.min(240, Math.max(0, ((w.end || 0) - (w.start || 0)) / 60000)) / 60]));
  s.left = counter(sets.filter((x) => x.side === 'L').map((x) => x.date));
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
  const cl = typeof climbStats === 'function' ? climbStats(ws) : null;
  s.summits = cl ? cl.summits : []; s.expeditions = cl ? cl.expeditions : [];
  return s;
}

/* ---------- the 70 trophies ---------- */
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
  T_('on-a-roll', 'career', 'Strength', 'On a Roll', 'Set a personal record weeks in a row', 'roll', [2, 4, 8]),
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
    <button class="trophy-line" data-act="go" data-v="progress"><span class="cup">${CUP}</span><span><b>${unlocked}</b> of 70 trophies</span><span class="muted sm">See all ›</span></button></section>`;
}

/* ---------- Progress screen ---------- */
function trophyCard(x, compact) {
  const t = x.t; const locked = x.level === 0; const secretHidden = t.fam === 'secret' && locked;
  const metal = x.level ? metalOf(x.level - 1, x.max) : null; const col = metal ? METAL_COL[metal] : '#4B5260';
  const nextTxt = x.level < x.max ? `${t.fmt(Math.min(x.value, x.next))} / ${t.fmt(x.next)}` : 'Max level';
  const pct = x.level < x.max ? Math.max(0, Math.min(100, 100 * x.value / x.next)) : 100;
  const dots = x.max > 1 && x.max <= 5 ? `<span class="tdots">${Array.from({ length: x.max }, (_, i) => `<i style="${i < x.level ? 'background:' + METAL_COL[metalOf(i, x.max)] : ''}"></i>`).join('')}</span>` : x.max > 5 ? `<span class="muted sm">${x.level}/${x.max}</span>` : '';
  const na = x.applies === false;
  return `<div class="trophy${locked ? ' locked' : ''}${t.fam === 'ultimate' ? ' ultimate' : ''}${na ? ' na' : ''}"><span class="medal" style="--m:${col}">${secretHidden ? '?' : t.fam === 'ultimate' ? '★' : CUP}</span>
    <span class="tbody"><b>${secretHidden ? '???' : esc(t.name)}</b><small>${secretHidden ? 'Secret trophy' : esc(na ? 'Set a weekly run goal to unlock' : t.cond)}</small>
    ${secretHidden || na ? '' : `<span class="tbar"><i style="width:${pct}%;background:${col}"></i></span><span class="trow"><span class="muted sm">${metal ? metal + ' · ' : ''}${nextTxt}</span>${dots}</span>`}</span></div>`;
}
function progressView() {
  const A = awards(); const e = A.cur.era; const r = A.cur.res;
  const tab = UI.trTab || 'goal';
  const fams = [['goal', 'Goals'], ['career', 'Career'], ['secret', 'Secret']];
  const list = A.list.filter((x) => x.t.fam === tab);
  const groups = {}; list.forEach((x) => { (groups[x.t.group] = groups[x.t.group] || []).push(x); });
  const ult = A.list.find((x) => x.t.fam === 'ultimate');
  const past = A.eras.filter((x) => x.era.to).reverse();
  const unlocked = A.list.reduce((n, x) => n + (x.level > 0 ? 1 : 0), 0);
  return `<header class="top"><button class="icon-btn" aria-label="Back" data-act="go" data-v="today">${svg('back')}</button><div class="grow"><h1>Progress</h1></div></header>
  <div class="prog-grid">
    <div class="col">
      <section class="card"><div class="row between"><span class="eyebrow">YOUR GOALS</span><button class="btn small outline" data-act="sheet" data-v="goals">Edit goals</button></div>
        <div class="goals-row">${ring(r.now.count, e.weekly, 84, 'This week', e.weekly + ' sessions')}${ring(r.monthNow.count, e.monthly, 84, MONTHS[new Date().getMonth()], e.monthly + ' sessions')}${e.runs ? ring(r.now.runs, e.runs, 84, 'Runs', 'this week') : ''}</div>
        <p class="muted sm">Since ${longDate(e.from)}. Changing a goal archives these goal trophies and opens a new set.</p></section>
      <section class="card streak-card"><div class="streak-box big${r.streak ? ' lit' : ''}"><span class="flame">${FLAME}</span><span class="big-num">${r.streak}</span><span class="g-lab">week streak</span></div>
        <div class="streak-meta"><span><b>${r.bestStreak}</b> best</span><span><b>${r.weeksMet}</b> weeks at goal</span><span class="jokers">${Array.from({ length: 2 }, (_, i) => `<i class="${i < r.jokers ? 'on' : ''}">${FLAKE}</i>`).join('')} <b>${r.jokers}</b> joker${r.jokers === 1 ? '' : 's'}</span></div>
        <p class="muted sm">A joker is earned every 4 weeks at goal (2 max). It saves your streak when a week is missed.</p></section>
      ${trophyCard(ult)}
    </div>
    <div class="col">
      <div class="seg-ctl">${fams.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" aria-pressed="${tab === k}" data-act="tr-tab" data-v="${k}">${l} <small>${A.list.filter((x) => x.t.fam === k && x.level > 0).length}/${A.list.filter((x) => x.t.fam === k).length}</small></button>`).join('')}</div>
      <p class="muted sm">${unlocked} of 70 trophies unlocked.</p>
      ${Object.entries(groups).map(([g, xs]) => `${tab === 'career' ? `<span class="eyebrow">${esc(g.toUpperCase())}</span>` : ''}<div class="trophies">${xs.map((x) => trophyCard(x)).join('')}</div>`).join('')}
      ${tab === 'goal' ? `<span class="eyebrow">PAST GOALS</span>${past.length ? past.map(({ era }) => { const sm = era.summary || eraSummary(era); return `<div class="era"><b>${era.weekly}/week · ${era.monthly}/month${era.runs ? ' · ' + era.runs + ' runs/week' : ''}</b><span class="muted sm">${shortDate(era.from)} – ${shortDate(era.to)} · ${sm.weeksMet} weeks at goal · best streak ${sm.bestStreak}</span><div class="chips">${sm.trophies.map((g) => { const t = TROPHIES.find((x) => x.id === g.id); const n = t.tiers.length; return `<span class="chip"><i class="dot" style="background:${METAL_COL[metalOf(g.level - 1, n)]}"></i>${esc(t.name)}</span>`; }).join('') || '<span class="muted sm">No goal trophy</span>'}</div></div>`; }).join('') : '<p class="muted sm">When you change a goal, the trophies of the old goal are kept here with their dates.</p>'}` : ''}
    </div>
  </div>`;
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
  const A = awards(); const keys = unlockedKeys(A); const seen = readSeen();
  if (!seen) { writeSeen(keys); if (keys.length) setTimeout(() => toast(keys.length + ' trophy level' + (keys.length > 1 ? 's' : '') + ' unlocked from your history'), 400); return; }
  const fresh = keys.filter((k) => !seen.includes(k)); if (!fresh.length) return;
  writeSeen(seen.concat(fresh));
  fresh.forEach((k) => { const [id, lvl] = k.split(':'); const x = A.list.find((y) => y.t.id === id); if (x) POP.queue.push({ x, level: Number(lvl) }); });
  showNextPop();
}
function showNextPop() {
  if (POP.open || !POP.queue.length) return; const { x, level } = POP.queue.shift(); POP.open = true;
  const metal = metalOf(level - 1, x.max); const col = METAL_COL[metal];
  const host = document.createElement('div'); host.className = 'award-pop'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-label', 'Trophy unlocked');
  host.innerHTML = `<div class="award-card" style="--m:${col}"><div class="award-face"><span class="medal big" style="--m:${col}">${x.t.fam === 'ultimate' ? '★' : CUP}</span><span class="eyebrow">${x.t.fam === 'secret' ? 'SECRET TROPHY' : 'TROPHY UNLOCKED'}</span><h2>${esc(x.t.name)}</h2><p class="soft">${esc(x.t.cond)}</p><span class="tag" style="color:${col};border-color:${col}">${metal}${x.max > 1 ? ' · level ' + level + '/' + x.max : ''}</span><button class="btn primary big" data-pop="ok">Nice</button></div></div>${['Gold', 'Platinum', 'Diamond'].includes(metal) ? confettiHTML() : ''}`;
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
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'goals') return goalsSheet();
  return _extraSheetAwards(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'tr-tab') { UI.trTab = b.dataset.v; render(); }
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
  host.innerHTML = `<div class="award-card"><div class="award-face"><span class="eyebrow">SESSION SAVED</span><h2>${esc(w.name.split(' — ')[0])}</h2>
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
