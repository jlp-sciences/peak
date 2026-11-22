/* Peak — seed data: categories, exercises, plans.
   Plans are written in a compact form and expanded at runtime.
   Item keys: ex (exercise id), s (sets, bilateral) or L/R (sets per side),
   r [min,max] reps, t seconds, d metres, load {week: kg} or number,
   loadTxt (shown instead of a number), cue, w4 (week-4 override),
   match (match-version override; match:null = skipped), sw (sets by week). */

const CATS = {
  Power: '#F87171', Legs: '#2DD4BF', Back: '#818CF8', Shoulders: '#C084FC',
  Chest: '#F472B6', Biceps: '#FACC15', Triceps: '#4ADE80', Core: '#94A3B8',
  Conditioning: '#A3E635', Mobility: '#67E8F9'
};

const TYPES = {
  wr: 'Weight & reps', reps: 'Reps', time: 'Time', bwkg: 'Bodyweight + kg',
  wd: 'Weight & distance', wt: 'Weight & time'
};

const EQUIP = { db: 'Dumbbells (2 kg steps)', bar: 'Barbell (2.5 kg)', cable: 'Cable / machine (2.5 kg)', mb: 'Med ball (1 kg)', bw: 'Bodyweight (+2 kg)', none: 'Other (1 kg)' };
const INC = { db: 2, bar: 2.5, cable: 2.5, mb: 1, bw: 2, none: 1 };

const SEED_EXERCISES = [
  { id: 'pogo', name: 'Low pogos in TT stance', cat: 'Power', type: 'time', uni: false, equip: 'none', rest: 90 },
  { id: 'skater', name: 'Lateral skater hop + stick', cat: 'Power', type: 'reps', uni: true, equip: 'none', rest: 90 },
  { id: 'accel10', name: '10 m acceleration', cat: 'Power', type: 'reps', uni: false, equip: 'none', rest: 120 },
  { id: 'isosquat', name: 'Isometric squat pin push', cat: 'Legs', type: 'time', uni: false, equip: 'none', rest: 120 },
  { id: 'squat', name: 'Back squat', cat: 'Legs', type: 'wr', uni: false, equip: 'bar', rest: 150, ref: { date: '2026-10-26', text: '70 kg × 5, 5', w: 70, r: 5 } },
  { id: 'bulgarian', name: 'Bulgarian split squat', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90, ref: { date: '2026-09-25', text: 'Split Squat · 34 kg × 12, 12, 12' } },
  { id: 'kickstand', name: 'Kickstand RDL', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90 },
  { id: 'latlunge', name: 'Lateral lunge (goblet)', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90, ref: { date: '2024-09-09', text: '10 kg × 20 (L+R combined)', w: 10, r: 10 } },
  { id: 'suitcase', name: 'Suitcase carry', cat: 'Core', type: 'wd', uni: true, equip: 'db', rest: 60 },
  { id: 'sideplank', name: 'Side plank', cat: 'Core', type: 'time', uni: true, equip: 'none', rest: 60, ref: { date: '2026-03-11', text: '60 s × 3', t: 60 } },
  { id: 'scoop', name: 'Med ball scoop toss', cat: 'Power', type: 'wr', uni: true, equip: 'mb', rest: 90 },
  { id: 'plyopush', name: 'Plyo push-up', cat: 'Power', type: 'reps', uni: false, equip: 'none', rest: 90, ref: { date: '2025-07-02', text: '10, 10, 10, 10', r: 10 } },
  { id: 'pullups', name: 'Pull-ups', cat: 'Back', type: 'bwkg', uni: false, equip: 'bw', rest: 150, ref: { date: '2026-10-23', text: 'BW × 5, 5, 5', w: 0, r: 5 } },
  { id: 'zpress', name: 'Single-arm DB Z-press', cat: 'Shoulders', type: 'wr', uni: true, equip: 'db', rest: 150, ref: { date: '2026-11-11', text: 'Single Arm DB Press · 20 kg × 16, 16, 8 (L+R combined)', w: 20, r: 8 } },
  { id: 'dbrow', name: 'Single-arm DB row', cat: 'Back', type: 'wr', uni: true, equip: 'db', rest: 90, ref: { date: '2026-11-11', text: '30 kg × 16, 16, 8 (L+R combined)', w: 30, r: 8 } },
  { id: 'latpull', name: 'Half-kneeling 1-arm lat pulldown', cat: 'Back', type: 'wr', uni: true, equip: 'cable', rest: 90 },
  { id: 'curl', name: 'Single-arm DB curl', cat: 'Biceps', type: 'wr', uni: true, equip: 'db', rest: 90, ref: { date: '2026-08-01', text: '10 kg × 20, 20, 20 (L+R combined)', w: 10, r: 10 } },
  { id: 'facepull', name: 'Face pull', cat: 'Shoulders', type: 'wr', uni: false, equip: 'cable', rest: 90, ref: { date: '2026-07-14', text: '15 kg × 15, 15, 15', w: 15, r: 15 } },
  { id: 'cablerot', name: 'Standing cable rotation', cat: 'Core', type: 'wr', uni: true, equip: 'cable', rest: 60, ref: { date: '2026-07-13', text: 'Low Pulley Woodchops · 15 kg × 20 (L+R combined)', w: 15, r: 10 } },
  { id: 'pallof', name: 'Pallof press', cat: 'Core', type: 'wr', uni: true, equip: 'cable', rest: 60, ref: { date: '2026-11-11', text: '17.5 kg × 20, 20, 20 (L+R combined)', w: 17.5, r: 10 } },
  { id: 'switchjump', name: 'Split-stance switch jumps', cat: 'Power', type: 'reps', uni: false, equip: 'none', rest: 90 },
  { id: 'shuffle', name: 'Shuffle → sprint', cat: 'Power', type: 'reps', uni: true, equip: 'none', rest: 90 },
  { id: 'mbthrow', name: 'Med ball rotational throw', cat: 'Power', type: 'wr', uni: true, equip: 'mb', rest: 90, ref: { date: '2026-07-10', text: '8 kg × 8, 8, 8 (L+R combined)' } },
  { id: 'deadlift', name: 'Deadlift', cat: 'Legs', type: 'wr', uni: false, equip: 'bar', rest: 150, ref: { date: '2026-10-23', text: '120 kg × 4, 4, 4', w: 120, r: 4 } },
  { id: 'slrdl', name: 'Single-leg RDL', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90, ref: { date: '2026-08-06', text: '20 kg × 24, 24, 20 (L+R combined)', w: 20, r: 12 } },
  { id: 'cablerow', name: 'Single-arm cable row', cat: 'Back', type: 'wr', uni: true, equip: 'cable', rest: 90 },
  { id: 'bikesprint', name: 'Bike sprints', cat: 'Conditioning', type: 'time', uni: false, equip: 'none', rest: 50 },
  { id: 'ttgames', name: 'TT interval games', cat: 'Conditioning', type: 'reps', uni: false, equip: 'none', rest: 120 },
  { id: 'aerobic', name: 'Easy aerobic', cat: 'Conditioning', type: 'time', uni: false, equip: 'none', rest: 0 },
  { id: 'splithold', name: 'TT-stance split squat hold', cat: 'Legs', type: 'time', uni: true, equip: 'none', rest: 60 },
  { id: 'bprow', name: 'Single-arm backpack row', cat: 'Back', type: 'wr', uni: true, equip: 'none', rest: 90 },
  { id: 'pike', name: 'Pike push-up', cat: 'Shoulders', type: 'reps', uni: false, equip: 'none', rest: 90 },
  { id: 'bpcurl', name: 'Single-arm backpack curl', cat: 'Biceps', type: 'wr', uni: true, equip: 'none', rest: 60 },
  { id: 'bandrot', name: 'Band / towel rotation', cat: 'Core', type: 'reps', uni: true, equip: 'none', rest: 60 }
];

const SEED_PLANS = [
  {
    id: 'tt-season', name: 'TT Season 2026–27', weeks: 4, lightLast: true,
    cycles: [{ key: 'A', name: 'Strength' }, { key: 'B', name: 'Power' }, { key: 'C', name: 'Speed' }],
    sessions: [
      {
        id: 'gym1', name: 'Gym 1', title: 'Lower strength + low-stance reactivity', required: true, minutes: 75,
        tpl: { A: [
          ['Speed & Power', [
            { ex: 'pogo', s: 3, t: 10, cue: 'Knees stay bent, shortest ground contact' },
            { ex: 'skater', L: 4, R: 3, r: [4, 4], cue: 'Land low, hold 2 s, knee stays out' },
            { ex: 'accel10', s: 4, r: [1, 1], cue: 'Full recovery, only if there is space' }]],
          ['Strength', [
            { ex: 'isosquat', s: 4, t: 5, cue: '5 s max push, full intent' },
            { ex: 'squat', s: 4, r: [5, 5], load: { 1: 80, 2: 85, 3: 87.5 }, cue: '3 s down', w4: { s: 3, r: [3, 3], load: 75 } }]],
          ['Accessory', [
            { ex: 'bulgarian', L: 4, R: 3, r: [6, 8], cue: 'Left first, right matches', w4: { L: 2, R: 1 } },
            { ex: 'kickstand', L: 4, R: 3, r: [8, 8], cue: 'Slow lowering, glute focus', w4: { L: 2, R: 1 } },
            { ex: 'latlunge', L: 3, R: 3, r: [6, 6], cue: 'Sit deep into the hip, push back fast', w4: { L: 2, R: 1 } }]],
          ['Core', [
            { ex: 'suitcase', L: 3, R: 2, d: 30, cue: 'Heavy DB, no leaning', w4: { L: 2, R: 1 } },
            { ex: 'sideplank', L: 3, R: 2, t: 30, w4: { L: 2, R: 1 } }]]
        ] }
      },
      {
        id: 'gym2', name: 'Gym 2', title: 'Upper + rotational power', required: true, minutes: 70,
        tpl: { A: [
          ['Speed & Power', [
            { ex: 'scoop', L: 4, R: 3, r: [5, 5], load: 3, loadTxt: '3–4 kg', cue: 'Hips start, trunk follows, arms finish' },
            { ex: 'plyopush', s: 3, r: [5, 5], cue: 'Fast up, soft landing', w4: { s: 2 } }]],
          ['Strength', [
            { ex: 'pullups', s: 4, r: [5, 8], cue: 'At 4 × 8 clean → +2 kg, back to 5 reps', w4: { s: 2 } },
            { ex: 'zpress', L: 4, R: 3, r: [6, 8], cue: 'No leaning, core braced', w4: { L: 2, R: 1 } }]],
          ['Accessory', [
            { ex: 'dbrow', L: 4, R: 3, r: [8, 10], cue: 'Elbow to hip, 1 s squeeze', w4: { L: 2, R: 1 } },
            { ex: 'latpull', L: 3, R: 2, r: [10, 10], cue: 'Full stretch at the top', w4: { L: 2, R: 1 } },
            { ex: 'curl', L: 3, R: 2, r: [10, 12], cue: 'Strict, no swing', w4: { L: 2, R: 1 } },
            { ex: 'facepull', s: 2, r: [15, 15], cue: 'Shoulder health' }]],
          ['Core & transfer', [
            { ex: 'cablerot', L: 3, R: 2, r: [8, 8], cue: 'Hips lead, arms stay long', w4: { L: 2, R: 1 } },
            { ex: 'pallof', L: 3, R: 3, r: [10, 10], cue: 'Resist all rotation', w4: { L: 2, R: 1 } }]]
        ] }
      },
      {
        id: 'gym3', name: 'Gym 3', title: 'Power & agility', required: true, minutes: 55, matchable: true,
        tpl: { A: [
          ['Speed & Power', [
            { ex: 'switchjump', s: 3, r: [6, 6], cue: 'Stay low, quick switch', w4: { s: 2 }, match: { s: 2 } },
            { ex: 'shuffle', L: 4, R: 3, r: [1, 1], cue: '2 shuffle steps + 5 m sprint', w4: { L: 2, R: 1 }, match: { L: 2, R: 1 } },
            { ex: 'mbthrow', L: 3, R: 2, r: [4, 4], load: 2, loadTxt: '2–3 kg', cue: 'Pure speed, hips first', w4: { L: 2, R: 1 }, match: { L: 2, R: 1 } }]],
          ['Strength', [
            { ex: 'deadlift', s: 3, r: [3, 3], load: 105, cue: 'Fast off the floor, stop at any slowdown', w4: { s: 2, load: 100 }, match: null }]],
          ['Accessory', [
            { ex: 'slrdl', L: 3, R: 2, r: [6, 6], cue: 'Slow down, fast up', w4: { L: 2, R: 1 }, match: { L: 2, R: 1 } },
            { ex: 'cablerow', L: 3, R: 2, r: [10, 10], cue: 'Slight rotation with the pull', w4: { L: 2, R: 1 }, match: { L: 2, R: 1 } }]],
          ['Conditioning', [
            { ex: 'bikesprint', s: 6, t: 10, cue: '10 s all-out / 50 s easy', w4: { s: 2 }, match: null }]]
        ] }
      },
      {
        id: 'cond', name: 'Conditioning', title: 'TT intervals or easy aerobic', required: false, minutes: 40,
        tpl: { A: [
          ['After a free Saturday', [
            { ex: 'ttgames', sw: { 1: 3, 2: 4, 3: 5, 4: 2 }, r: [8, 8], cue: '8 × (10 s on / 20 s off), 2 min between games' }]],
          ['After a match', [
            { ex: 'aerobic', s: 1, t: 2700, cue: 'Conversational, ~140 bpm' }]]
        ] }
      }
    ]
  },
  {
    id: 'away', name: 'Away — no gym', weeks: 1, lightLast: false,
    cycles: [{ key: 'A', name: 'Weekly' }],
    sessions: [
      { id: 'outA', name: 'Out A', title: 'Legs & spring', required: true, minutes: 35, tpl: { A: [['Session', [
        { ex: 'pogo', s: 3, t: 10 }, { ex: 'skater', L: 4, R: 3, r: [4, 4] },
        { ex: 'bulgarian', L: 4, R: 3, r: [10, 10], cue: 'Backpack' }, { ex: 'slrdl', L: 3, R: 2, r: [10, 10], cue: 'Backpack' },
        { ex: 'splithold', L: 3, R: 3, t: 30 }, { ex: 'sideplank', L: 3, R: 2, t: 30 }]]] } },
      { id: 'outB', name: 'Out B', title: 'Upper & rotation', required: true, minutes: 35, tpl: { A: [['Session', [
        { ex: 'plyopush', s: 3, r: [6, 6] }, { ex: 'pullups', s: 4, r: [5, 8], cue: 'Or table / door rows' },
        { ex: 'bprow', L: 4, R: 3, r: [12, 12] }, { ex: 'pike', s: 3, r: [8, 8] },
        { ex: 'bpcurl', L: 3, R: 2, r: [12, 12] }, { ex: 'bandrot', L: 3, R: 2, r: [10, 10] }]]] } },
      { id: 'outC', name: 'Out C', title: 'Speed & engine', required: true, minutes: 35, tpl: { A: [['Session', [
        { ex: 'switchjump', s: 3, r: [6, 6] }, { ex: 'shuffle', L: 4, R: 3, r: [1, 1] },
        { ex: 'ttgames', s: 3, r: [8, 8], cue: '3–4 games of 8 × (10 s on / 20 s off)' }]]] } }
    ]
  }
];
