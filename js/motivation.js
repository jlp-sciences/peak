/* Peak — a message for every day of the year (a new order every year) and encouragement after an unfinished session.
   All messages are original. */
const MOTD = [
  // snappy
  'Show up. Then show up again.', 'Heavy is a feeling. Make it lighter.', 'One more rep. Then decide.', 'Earn the rest day.',
  'Small plates add up.', 'Today counts.', 'Lift the weight, not your ego.', 'Slow down the way down.', 'Strong is built, not born.',
  'Sweat now, smile later.', 'Win the warm-up.', 'Breathe. Brace. Go.', 'Quiet effort, loud results.', 'You versus last week.',
  'Done beats perfect.', 'Ten minutes still counts.', 'Discipline is a quiet kind of loud.', 'Reps are votes for who you are.',
  'Be stubborn about the habit.', 'Start before you feel ready.', 'Strong knees, strong game.', 'Mind first. Muscles follow.',
  'Chase form, then load.', 'Hard days build easy days.', 'No zero days.', 'Train like it matters. It does.', 'Steady wins.',
  'Make Monday jealous.', 'Your future self is watching.', 'Effort is a skill.', 'Lighter weight, better reps.', 'Own the boring sets.',
  'Iron is honest.', 'The bar doesn’t care about excuses.', 'Consistency is the cheat code.', 'Progress, not perfection.',
  'Feet planted. Head up.', 'Earn every rep.', 'Calm mind, strong lift.', 'Built one set at a time.', 'Doubt less, lift more.',
  'Tired is not finished.', 'You’ve done hard things before.', 'Keep the promise to yourself.', 'Good form is fast form later.',
  'Rest. Reload. Repeat.', 'Grip it. Rip it. Control it.', 'Today is a good day to get stronger.', 'Plant the seed. Water it daily.',
  'Fast feet start in the gym.', 'Momentum loves company.', 'Just the first set.', 'Patience is a training tool.', 'Strong body, clear head.',
  'Less scrolling, more lifting.', 'Make it look easy. Later.', 'Trust the process. Log the process.', 'Small wins, every day.',
  'Fall in love with the routine.', 'Be the athlete you’d bet on.', 'Effort over mood.', 'Steel sharpens slowly.', 'Low stance, high standards.',
  'Bend the knees. Raise the bar.', 'Today: one percent.', 'Lift with intent.', 'You are the project.', 'Sets don’t lie.',
  'Ready is a decision.', 'Make the hard thing normal.', 'Do it for the you of June.', 'Reps today, rallies tomorrow.', 'Keep the chain unbroken.',
  'Effort is never wasted.', 'Brick by brick.', 'Earn your coffee.', 'Strong is a long game.', 'Show the bar who’s boss.',
  'Push the floor away.', 'Every rep is a choice.', 'Kind to yourself, hard on the work.', 'The work works.', 'Go again.',
  // longer
  'Nobody remembers the sessions you skipped. Your body remembers the ones you did.',
  'Motivation gets you started. Habit gets you to the gym on the days it doesn’t show up.',
  'The weight you lift today was impossible for you once. Remember that next time something feels heavy.',
  'You don’t need a perfect week. You need a week that is better than nothing — and that’s easy to beat.',
  'Rest is part of the plan, not a break from it. Muscles grow between sessions, not during them.',
  'The best programme is the one you actually follow. Follow yours today.',
  'Write it down, beat it next time. That’s the whole secret.',
  'A slow eccentric is free strength. Take your time on the way down.',
  'If it’s light today, move it perfectly. If it’s heavy, move it bravely.',
  'Every great season is built in the boring months. This is one of them.',
  'Your left side is waiting for its turn. Give it the same attention as your right.',
  'Strength isn’t only in the big lifts. It’s in the warm-up you didn’t skip.',
  'Sleep is the best supplement nobody sells. Earn it today, collect it tonight.',
  'Don’t count the days until you’re fit. Make the days count until you are.',
  'One good session won’t change you. A hundred will. Today is one of the hundred.',
  'The table doesn’t know how you trained. Your legs in the fifth set do.',
  'You can’t control how you feel walking in. You can control what you do once you’re there.',
  'Progress hides for weeks, then shows up all at once. Keep logging.',
  'Strong hips, quick feet, calm head — the gym builds all three.',
  'Not every session is a record. Every session is a deposit.',
  'Treat the warm-up like the first set, not a chore before it.',
  'The habit you build in November is the strength you bring in March.',
  'If you can only do half today, do the important half well.',
  'Pain is a signal, not a challenge. Listen to it. Effort is different — push that.',
  'Look how far you’ve come. Now look a little further.',
  'Big goals are just small sessions in a row.',
  'Hard work is quiet. Let the results make the noise.',
  'The days you don’t feel like it are the days that count double.',
  'Every rep you control is a rep that protects you on court.',
  'Stronger legs mean a lower stance for longer. Your opponents will notice.',
  'Recovery is training too. Stretch like you mean it.',
  'You are not behind. You are exactly one session away from being further ahead.',
  'Get comfortable being uncomfortable for a few seconds at a time.',
  'Respect the rest timer. It’s doing half the work.',
  'Goals point the way. Habits do the walking.',
  'The plan is the map. Showing up is the walking.',
  'Your best set today might be the one you almost didn’t do.',
  'You’re allowed to be proud of a normal session.',
  'Fitness isn’t a phase when you keep coming back.',
  'Train the movement, not just the muscle.',
  'A strong core turns your legs’ power into your racket’s speed.',
  'Keep a little in the tank on the light days. Spend it all on the heavy ones.',
  'Be patient with your body. It’s rebuilding itself because you asked it to.',
  'Every logged set is a promise kept.',
  'Strength is the skill that makes every other skill easier.',
  'You don’t have to be extreme. You have to be consistent.',
  'Think of today’s session as a vote for the athlete you’re becoming.',
  'Some days you lift the weight. Some days you lift your mood. Both count.',
  'Setbacks are just the start of a comeback story.',
  'There’s no shortcut, but there is a straight line: show up, log it, repeat.',
  'Feel the floor through your feet. Everything starts there.',
  'Quality reps now, quality rallies later.',
  'Rest days are not lazy days. They’re strategy days.',
  'You will never regret the session you finished.',
  'Let the bar move fast and your mind stay slow.',
  'Your body keeps the score of every session. Make it a good one.',
  'Strong today, stronger next month. That’s the deal.',
  'A deload is not a step back. It’s the run-up before the jump.',
  'Measure yourself against who you were, never against who’s next to you.',
  'Short on time? Do the main lift. Everything else is a bonus.',
  'The goal isn’t to be perfect. It’s to be unstoppable.',
  'Control the descent, own the ascent.',
  'Your future rallies are being trained right now.',
  'You don’t find time to train. You make it.',
  'The first five minutes are the hardest. After that, it’s just training.',
  'Mobility today is fewer niggles tomorrow.',
  'Look after your shoulders. They have a long season ahead.',
  'Two weeks of consistency beat two days of intensity.',
  'Even champions do the basics. Especially champions.',
  'You’re not starting over. You’re starting from experience.',
  'Leave the gym a little stronger than you walked in. That’s all.',
  'If you’re tired, lift lighter. Don’t lift never.',
  'The scoreboard of the gym is your logbook. Keep it honest.',
  'Strength doesn’t shout. It just stays.',
  'Train hard, recover harder, repeat for years.',
  'Celebrate the small numbers. They become big numbers.',
  'Breathe out on the effort. Let the tension go with it.',
  'Good posture is a habit you train between sets too.',
  'You are allowed to enjoy this.',
  'It’s not about having time. It’s about making it count.',
  'Some progress is invisible: better sleep, better mood, better focus. It’s still progress.',
  'Train both sides. Win from both sides.',
  'A champion is just someone who kept showing up after the excitement wore off.',
  'Every season is won before it starts.',
  'Make your warm-up so good it feels like a reward.',
  'Discomfort is temporary. The logbook is forever.',
  'Strong legs, steady mind, quick hands. Today we build the legs.',
  'The rep you grind is the rep you remember.',
  'Fatigue is information, not an order to stop.',
  'Change one small thing today. Then keep it.',
  'Ordinary sessions, done well, add up to something special.',
  'Get in, do the work, go home proud.',
  'There’s strength in coming back after a bad week.',
  'One session won’t fix everything. It will fix today.',
  'You’re building an engine. Engines need fuel, rest and time.',
  'Respect your past self for starting. Thank your future self by continuing.',
  'Train so the last point of the match feels like the first.',
  'Don’t wish it were easier. Get better.',
  'Your goals don’t care about your mood. Luckily, neither does the bar.',
  'Every set is a small conversation with your limits.',
  'Pick up where you left off. That’s all it takes.',
  'You are one decision away from a good session.',
  'Strong feet, strong ankles, fewer injuries. Do your mobility.',
  'Every extra set today is one less breath you’ll miss in the third game.',
  'Keep showing up and one day you’ll look back amazed.',
  'Results love patience.',
  'Make today’s session one you’d want on the highlight reel.',
  'Proud is better than perfect.',
  'You can do anything for one more set.',
  'Little by little becomes a lot.',
  'Train with purpose. Rest without guilt.',
  'There’s always a reason not to. Find the reason to.',
  'If the plan says light, go light. Discipline works both ways.',
  'The strongest muscle you train is the habit.',
  'You’ve got two hands, two legs and one session today. Use them all.',
  'Bodies adapt to what you ask. Ask for strong.',
  'Every rep is practice for the moment that matters.',
  'Track it, trust it, beat it.',
  'Stay low, stay ready.',
  'Hard work today, easy confidence tomorrow.',
  'It’s never too late for a good session.',
  'Steady breathing, steady bar, steady progress.',
  'The best time to train was this morning. The second best is now.',
  'Do it tired. Do it slowly. But do it.',
  'Small improvements, compounded, are unstoppable.',
  'Take care of your body. You need it for a long time.',
  'You’re not trying to win the week. You’re trying to win the year.',
  'Focus on the next rep, not the whole session.',
  'The gym is where you practise being brave in small doses.',
  'A good session starts with a good warm-up and ends with a good stretch.',
  'Make your weak side your secret weapon.',
  'Nobody is coming to do your reps. Good — they’re yours.',
  'Show yourself what you’re made of. Again.',
  'The work is the reward. The trophies are a bonus.',
  'Five more minutes of mobility, five more years of good joints.',
  'No gym? No problem. A floor and ten minutes will do.',
  'You’re stronger than your excuses.',
  'Today’s effort is tomorrow’s warm-up weight.',
  'Your first session felt hard. Look at you now.',
  'Keep the bar path straight and the goals clear.',
  'Every season has a bad week. Champions train through it gently.',
  'You can’t rush strength. You can only invite it, every session.',
  'Make your body a place you’re proud to live in.',
  'Better a short session than no session.',
  'Your logbook is a diary of you getting better.',
  'The real victory is coming back on Monday.',
  'Power comes from the ground up. Train the ground up.',
  'Patience, persistence, progress.',
  'Earn tonight’s sleep.',
  'Don’t stop when you’re tired. Stop when the plan says done.',
  'You’ve got this. You’ve always had this.',
  'Being consistent is more impressive than being intense once.',
  'Your body hears everything your mind says. Say good things.',
  'Train for the player you want to be in June.',
  'A small step every day is still a giant walk in a year.',
  'Even the mountain is climbed one step at a time.',
  'Every summit starts at base camp. Today is a step up.',
  'Don’t look at the top. Look at the next step.',
  'The climb is the point.',
  'Some days you climb, some days you rest at camp. Both get you to the summit.',
  'Strength you build now is strength you keep.',
  'Focus on what you can control: today’s reps.',
  'Strong is a decision you make again every day.',
  'Turn up the effort, turn down the noise.',
  'Let your training be louder than your doubts.',
  'You are the only competition in this logbook.',
  'Embrace the grind. It’s where the shine comes from.',
  'Respect the basics. They respect you back.',
  'The hard part is starting. You’re good at hard parts.',
  'Keep your promises small and your streak long.',
  'Good things come to those who log their sets.',
  'Pressure builds diamonds. Reps build athletes.',
  'Sweat is just your body applauding.',
  'Smart training is the fastest way to get strong.',
  'Healthy shoulders, happy forehands.',
  'Lift today, so you can play tomorrow.',
  'Show up for your future self — they’re counting on you.',
  'This is your hour. Use it well.',
  'Energy follows action. Start moving.',
  'Your best is enough. Bring it.',
  'Get strong, stay humble, keep logging.',
  'Be proud of the reps nobody saw.',
  'Strength is earned in silence and shown in the fifth set.',
  'Every hard session makes the next match a little easier.',
  'Move well first. Move heavy second. Move fast third.',
  'You don’t need more time. You need this session.',
  'You’re not just training muscles. You’re training trust in yourself.',
  'Finish what you start — even if you start small.',
  'Look how far the logbook goes back. Keep writing.',
  'Today’s you is the strongest you’ve ever been. Tomorrow’s will be stronger.',
  'Champions train. Others complain.',
  'Rest well, lift well, live well.',
  'Strong habits, strong season.',
  'Turn the music up and the doubts down.',
  'A little discomfort is the price of a lot of progress.',
  'Every hard rep is a gift to your future body.',
  'Even on bad days, you’re building something.',
  'The finish line keeps moving. Enjoy the run.',
  'Lift with your legs, play with your heart.',
  'Calm shoulders, busy legs.',
  'Be the reason you get stronger.',
  'Win the morning, win the day. Or win the evening — it still counts.',
  'Stretch your body, stretch your limits.',
  'You’re one workout closer than yesterday.',
  'Same movement, a hundred times, until it’s yours.',
  'The weights don’t get lighter. You get stronger.',
  'Grit today, glory later.',
  'A little sore means you asked for more. Good.',
  'Strong is the new normal.',
  'Make the effort, take the credit.',
  'A good session is the best stress relief.',
  'Your only limit is the one you haven’t tested yet.',
  'Train smart. Play hard.',
  'You set the goal. Now set the bar.',
  'Do the work. The numbers will follow.',
  'Every step counts. Every set counts. Every day counts.',
  'You’re building a body for the long rally.',
  'Persistence beats talent when talent skips the gym.',
  'Here’s to the quiet sessions that change everything.',
  'Stay hungry, stay steady.',
  'Keep stacking good days.',
  'Strength looks good on you.',
  'Make it a session to remember.',
  'Your next PR is waiting. Go say hello.',
  'Good form, good mood, good session.',
  'Commit to the next hour.',
  'Trust your training.',
  'Hold the plank. Hold the line.',
  'Your legs are your foundation. Build them strong.',
  'Clear head, full heart, strong legs.',
  'Today, choose progress.',
  'Show up for the person who started this logbook.',
  'Be relentless, not reckless.',
  'Train like there’s a match on Sunday.',
  'Every session sharpens the blade.',
  'Stronger together: mind and body.',
  'Your journey, your pace, your strength.',
  'Make this rep your best rep.',
  'Strength is a long conversation. Keep talking.',
  'Don’t break the chain. Add a link.',
  'Turn plans into reps.',
  'The best view comes after the hardest climb.',
  'Keep going. You’re closer than you think.',
  'Every season needs a strong foundation. Lay a brick today.',
  'Respect the recovery as much as the reps.',
  'Little steps, big summit.',
  'Good habits are hard to build and easy to live with.',
  'Lift, log, live.',
  'Fuel up, show up, level up.',
  'Strong mind, steady hands.',
  'Today is a fresh page in the logbook.',
  'Write a good line today.',
  'Rally with your doubts. Win the point.',
  'Serve yourself a good session.',
  'Spin the doubts, smash the session.',
  'Forehand strong, backhand stronger.',
  'Footwork is legwork. Legwork is gym work.',
  'Ready position starts in the gym.',
  'Short game, long training.',
  'Train the body that plays the game.',
  'The ball comes back faster when your legs are ready.',
  'Last point energy, first set focus.',
  'Every rep is a step towards the next level.',
  'You don’t have to go fast. You just have to go.',
  'Let today be the day you surprise yourself.',
  'Keep your eyes on the logbook, not the mirror.',
  'Progress loves a plan.',
  'The habit is the hero.',
  'Light weights, perfect form, zero regrets.',
  'Fresh week, fresh reps.',
  'You’re doing better than you think.',
  'End the day knowing you trained.',
  'Brave sets build bold athletes.',
  'Give today your best version.',
  'Unrack it like you mean it.', 'Count the reps, not the minutes.', 'One clean set beats three ugly ones.',
  'Strong backs carry long seasons.', 'Your hamstrings will thank you in the fifth set.', 'The quiet work makes the loud wins.',
  'Today is a training day. Train.', 'Thirty seconds of plank, a lifetime of good posture.', 'Keep it simple: warm up, lift, stretch, smile.'
];
/* the same order for everyone on a given year, a new order each year */
function motdFor(dateIso) {
  const y = Number(dateIso.slice(0, 4)); const d0 = new Date(y, 0, 1); const d = new Date(dateIso + 'T12:00');
  const day = Math.floor((d - d0) / 86400000); let seed = (y * 2654435761) >>> 0;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const idx = MOTD.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return MOTD[idx[day % idx.length]];
}
function motdHTML() { return `<section class="card motd"><span class="eyebrow">TODAY’S MOTIVATION</span><p>${esc(motdFor(iso()))}</p></section>`; }

/* ---------- unfinished sessions ---------- */
const WHY = [['time', 'Not enough time'], ['energy', 'Low energy'], ['pain', 'Pain'], ['none', 'No comment'], ['other', 'Other']];
const ENCOURAGE = {
  time: ['Short sessions still count. The habit is what you’re building.', 'You made time for the most important part. That’s smart training.',
    'A busy day and you still trained. That’s the kind of consistency that wins seasons.', 'Next time, start with the main lift — you just proved you can fit it in.',
    'Half a session on a full day is a full win.', 'Time was short, effort wasn’t. See you next session.', 'Life happens. You still showed up. That’s the part that matters.',
    'Plan the next one in the calendar and give it the time it deserves.'],
  energy: ['Showing up on a flat day is a win. Sleep well, the next one will feel lighter.', 'Low-energy days teach you the most. You trained anyway.',
    'Your body asked for less today and you listened. That’s not weakness, it’s wisdom.', 'Eat well, sleep early — tomorrow’s you will thank you.',
    'Some sessions are about keeping the streak alive. Mission accomplished.', 'Energy comes and goes. Habits stay. You kept yours.',
    'Rest up. A good night’s sleep is the best pre-workout there is.', 'Tired and still here. Respect.'],
  pain: ['Good call to stop. Rest it, and if it keeps hurting, get it checked before you push again.', 'Listening to pain is a strength skill too. Look after it.',
    'Stopping early today keeps you training for months. Smart move.', 'Give it a few days. If it’s still there, see a professional before loading it again.',
    'Pain is information. You used it well. Rest, ice if it helps, and come back gently.', 'No session is worth an injury. Recover well.',
    'Next time, try a lighter variation that doesn’t hurt — and get it checked if it persists.', 'Protecting your body is part of the plan. Rest up.'],
  any: ['70 % today beats 0 %. See you next session.', 'Not every session is complete. Every session is progress.', 'You started, you trained, you logged it. That’s a good day.',
    'The streak doesn’t care if it was perfect. It cares that you came.', 'Tomorrow is a fresh page in the logbook.', 'Some is always more than none.',
    'You did what today allowed. That’s enough.', 'Champions have unfinished sessions too. They just come back.', 'Shake it off. Next one’s yours.',
    'Be proud of what you did, not upset about what you didn’t.', 'Every set you logged today still counts towards your goals.', 'Progress isn’t a straight line. Keep going.']
};
const ENC_KEY = 'peak.enc.v1';
function pickEncourage(reason) {
  const pool = (ENCOURAGE[reason] || []).concat(ENCOURAGE.any); let seen = [];
  try { seen = JSON.parse(localStorage.getItem(ENC_KEY) || '[]'); } catch (e) { seen = []; }
  const fresh = pool.filter((m) => !seen.includes(m)); const list = fresh.length ? fresh : pool;
  const own = list.filter((m) => (ENCOURAGE[reason] || []).includes(m)); const from = own.length && Math.random() < 0.7 ? own : list;
  const msg = from[Math.floor(Math.random() * from.length)];
  try { localStorage.setItem(ENC_KEY, JSON.stringify(seen.concat(msg).slice(-12))); } catch (e) { /* storage unavailable */ }
  return msg;
}
const whyLabel = (k) => (WHY.find(([v]) => v === k) || [k, k])[1];
function whySheet() {
  const w = D.workouts.find((x) => x.id === UI.whyW); if (!w) return '';
  if (UI.whyMsg) return `<div class="why-done"><span class="why-ic">${svg('check', 26, 3)}</span><h2>Session saved · ${w.pct || 0} %</h2><p class="why-msg">${esc(UI.whyMsg)}</p>
    <button class="btn primary big" data-act="why-ok">Continue</button></div>`;
  return `<h2>Why couldn’t you finish today?</h2><p class="muted sm">${w.pct || 0} % done. This stays in your history so you can spot patterns.</p>
    <div class="why-opts">${WHY.map(([k, l]) => `<button class="chip-btn${UI.whyPick === k ? ' on' : ''}" aria-pressed="${UI.whyPick === k}" data-act="why-pick" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="field">Anything to add? <small class="muted">(optional)</small><textarea id="why-note" rows="2" placeholder="e.g. right knee, meeting ran late…">${esc(UI.whyNote || '')}</textarea></label>
    <button class="btn primary big" data-act="why-save"${UI.whyPick ? '' : ' disabled'}>Save</button>`;
}
function whyFinish() {
  const w = D.workouts.find((x) => x.id === UI.whyW); UI.sheet = null; UI.whyW = null; UI.whyMsg = null; UI.whyPick = null; UI.whyNote = '';
  render(); if (w && typeof showSummary === 'function') { POP.open = true; showSummary(w); }
}
const _extraSheetMot = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'why') return whySheet();
  return _extraSheetMot(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'close' && UI.sheet === 'why') { ev.stopImmediatePropagation(); const w = D.workouts.find((x) => x.id === UI.whyW); if (w && !w.reason) { w.reason = 'none'; w.upd = Date.now(); save(); } whyFinish(); return; }
  if (a === 'why-pick') { const n = $('#why-note'); UI.whyNote = n ? n.value : ''; UI.whyPick = b.dataset.v; render(); return; }
  if (a === 'why-save') {
    const w = D.workouts.find((x) => x.id === UI.whyW); if (!w || !UI.whyPick) return;
    const n = ($('#why-note') && $('#why-note').value || '').trim(); w.reason = UI.whyPick; if (n) w.reasonNote = n; else delete w.reasonNote; w.upd = Date.now(); save();
    UI.whyMsg = pickEncourage(UI.whyPick); render(); return;
  }
  if (a === 'why-ok') { whyFinish(); }
}, true);

/* ---------- session flow: what next once an exercise is complete ---------- */
const isOpt = (it) => /\(optional\)$/.test(it.block || '');
function pendingItems(w) {
  return w.items.map((it, i) => ({ it, i })).filter(({ it }) => !itemDone(w, it));
}
function pendingLabel(w, p) {
  const ex = D.exercises[p.it.exId]; const c = itemCounts(w, p.it); const rows = ensureRows(w, p.it);
  if (!c.n) return ex.name + ' · not started';
  const miss = rows.filter((r) => !r.done); const sides = ex.uni ? [...new Set(miss.map((r) => r.side))] : [];
  return `${ex.name} · ${miss.length} set${miss.length > 1 ? 's' : ''} missing${sides.length === 1 ? ' (' + sides[0] + ')' : ''}`;
}
function nextSheet() {
  const w = active(); if (!w) return '';
  const from = UI.nextFrom != null ? UI.nextFrom : w.cur; const doneEx = w.items[from] && D.exercises[w.items[from].exId];
  const pend = pendingItems(w); const req = pend.filter((p) => !isOpt(p.it));
  const head = doneEx ? `<p class="muted sm">${esc(doneEx.name)} done ✓</p>` : '';
  const select = (list) => `<label class="field">Exercise<select id="nx-pick">${list.map((p) => `<option value="${p.i}">${esc(pendingLabel(w, p))}</option>`).join('')}</select></label>`;
  if (!pend.length) {
    return `${head}<h2>All sets done ✓ — 100 %</h2><p class="soft">Great session. Ready to wrap it up?</p>
      <div class="menu-list"><button class="btn primary big" data-act="nx-finish">Finish session</button><button class="btn outline big" data-act="close">Not yet</button></div>`;
  }
  if (!req.length) {
    return `${head}<h2>Only optional left</h2><p class="soft">Every required set is done. Finish now, or do the optional part.</p>
      <div class="menu-list"><button class="btn primary big" data-act="nx-finish">Finish session</button></div>${select(pend)}
      <div class="menu-list"><button class="btn outline big" data-act="nx-go">Go</button></div>`;
  }
  const after = pend.filter((p) => p.i > from); const before = pend.filter((p) => p.i <= from);
  if (after.length) {
    return `${head}<h2>Up next</h2>${select(after.concat(before))}
      <div class="menu-list two"><button class="btn primary big" data-act="nx-go">Go</button><button class="btn outline big" data-act="close">Stay</button></div>`;
  }
  return `${head}<h2>Still to do</h2><p class="soft">This was the last exercise of the list, but some sets are missing.</p>${select(before)}
    <div class="menu-list two"><button class="btn primary big" data-act="nx-go">Go</button><button class="btn outline big" data-act="close">Stay</button></div>`;
}
const _extraSheetFlow = extraSheet;
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'next') return nextSheet();
  return _extraSheetFlow(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'nx-go') {
    const w = active(); const sel = $('#nx-pick'); if (!w || !sel) return;
    w.cur = Number(sel.value); UI.selRow = null; UI.lastSet = null; UI.sheet = null; UI.nextFrom = null; save(); render(); window.scrollTo(0, 0);
  } else if (b.dataset.act === 'nx-finish') { UI.sheet = null; UI.nextFrom = null; render(); finishWorkout(); }
});
