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
  { id: 'bandrot', name: 'Band / towel rotation', cat: 'Core', type: 'reps', uni: true, equip: 'none', rest: 60 },
  // alternatives used by Replace
  { id: 'goblet', name: 'Goblet squat', cat: 'Legs', type: 'wr', uni: false, equip: 'db', rest: 90 },
  { id: 'legpress', name: 'Leg press', cat: 'Legs', type: 'wr', uni: false, equip: 'cable', rest: 120 },
  { id: 'wallsit', name: 'Wall sit at TT depth', cat: 'Legs', type: 'time', uni: false, equip: 'none', rest: 90 },
  { id: 'revlunge', name: 'Reverse lunge (DB)', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90 },
  { id: 'splitsquat', name: 'Split squat (DB)', cat: 'Legs', type: 'wr', uni: true, equip: 'db', rest: 90 },
  { id: 'dbrdl', name: 'DB Romanian deadlift', cat: 'Legs', type: 'wr', uni: false, equip: 'db', rest: 90 },
  { id: 'trapbar', name: 'Trap bar deadlift', cat: 'Legs', type: 'wr', uni: false, equip: 'bar', rest: 150 },
  { id: 'farmer', name: 'Farmer carry', cat: 'Core', type: 'wd', uni: false, equip: 'db', rest: 60 },
  { id: 'jumprope', name: 'Jump rope', cat: 'Power', type: 'time', uni: false, equip: 'none', rest: 60 },
  { id: 'linehops', name: 'Lateral line hops', cat: 'Power', type: 'time', uni: false, equip: 'none', rest: 60 },
  { id: 'mbslam', name: 'Med ball slam', cat: 'Power', type: 'wr', uni: false, equip: 'mb', rest: 90 },
  { id: 'pushup', name: 'Push-up', cat: 'Chest', type: 'reps', uni: false, equip: 'none', rest: 90 },
  { id: 'latpullbi', name: 'Lat pulldown', cat: 'Back', type: 'wr', uni: false, equip: 'cable', rest: 90 },
  { id: 'invrow', name: 'Inverted row', cat: 'Back', type: 'reps', uni: false, equip: 'none', rest: 90 },
  { id: 'chestrow', name: 'Chest-supported 1-arm DB row', cat: 'Back', type: 'wr', uni: true, equip: 'db', rest: 90 },
  { id: 'kneelpress', name: 'Half-kneeling 1-arm DB press', cat: 'Shoulders', type: 'wr', uni: true, equip: 'db', rest: 120 },
  { id: 'hammer', name: 'Single-arm hammer curl', cat: 'Biceps', type: 'wr', uni: true, equip: 'db', rest: 90 },
  { id: 'bandpull', name: 'Band pull-apart', cat: 'Shoulders', type: 'reps', uni: false, equip: 'none', rest: 60 },
  { id: 'bandpallof', name: 'Band Pallof press', cat: 'Core', type: 'reps', uni: true, equip: 'none', rest: 60 },
  { id: 'deadbug', name: 'Dead bug', cat: 'Core', type: 'reps', uni: true, equip: 'none', rest: 60 },
  { id: 'rowsprint', name: 'Rower sprints', cat: 'Conditioning', type: 'time', uni: false, equip: 'none', rest: 50 }
];

/* Built from the plan document (plan conversation, 2026-11-24) with tools/planconv — do not edit by hand, re-import the plan instead. */
const SEED_PLANS = [
 {
  "id": "tt-season",
  "v": 2,
  "name": "TT Season 2026–27",
  "weeks": 4,
  "lightLast": true,
  "cycles": [
   {
    "key": "A",
    "name": "Strength"
   },
   {
    "key": "B",
    "name": "Power"
   },
   {
    "key": "C",
    "name": "Speed & transfer"
   }
  ],
  "sessions": [
   {
    "id": "gym1",
    "name": "Gym 1",
    "title": "Lower strength & low-stance reactivity",
    "required": true,
    "minutes": 55,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "easybike",
         "t": 180,
         "s": 1,
         "cue": "easy pace"
        },
        {
         "ex": "slbridge",
         "r": [
          12,
          12
         ],
         "L": 2,
         "R": 1,
         "cue": "left first, 2 s squeeze at the top"
        },
        {
         "ex": "bandwalk",
         "r": [
          10,
          10
         ],
         "s": 2,
         "cue": "10 steps each way, knees out"
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "pogo",
         "t": 10,
         "s": 2,
         "cue": "superset with skater hop; knees stay bent, shortest ground contact"
        },
        {
         "ex": "skater",
         "r": [
          4,
          4
         ],
         "L": 3,
         "R": 2,
         "cue": "land low, stick 2 s, knee stays out"
        }
       ]
      ],
      [
       "Strength",
       [
        {
         "ex": "isosquat",
         "t": 5,
         "s": 3,
         "cue": "max effort · bar against the pins at TT stance depth, 2 min rest",
         "w4": {
          "s": 2
         }
        },
        {
         "ex": "squat",
         "r": [
          5,
          5
         ],
         "s": 4,
         "load": {
          "1": 80,
          "2": 82.5,
          "3": 85
         },
         "cue": "3 s down, 2–3 min rest",
         "w4": {
          "s": 3,
          "load": 75
         }
        }
       ]
      ],
      [
       "Core",
       [
        {
         "ex": "suitcase",
         "d": 20,
         "L": 3,
         "R": 2,
         "cue": "done during back squat rest; one heavy dumbbell, stay tall, no leaning",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Accessory",
       [
        {
         "ex": "bulgarian",
         "r": [
          6,
          8
         ],
         "L": 3,
         "R": 2,
         "cue": "superset with kickstand RDL, RPE 8, left first, right matches",
         "w4": {
          "L": 2
         }
        },
        {
         "ex": "kickstand",
         "r": [
          8,
          8
         ],
         "L": 3,
         "R": 2,
         "cue": "one dumbbell, slow lowering, glute focus",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "hip9090",
         "t": 60,
         "L": 1,
         "R": 1
        },
        {
         "ex": "couch",
         "t": 90,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   },
   {
    "id": "gym2",
    "name": "Gym 2",
    "title": "Upper body & rotational power",
    "required": true,
    "minutes": 55,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "easyrow",
         "t": 180,
         "s": 1,
         "cue": "easy pace"
        },
        {
         "ex": "pullapart",
         "r": [
          15,
          15
         ],
         "s": 2
        },
        {
         "ex": "thoracic",
         "L": 1,
         "R": 1,
         "t": 30,
         "cue": "8 reps per side"
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "scoop",
         "r": [
          5,
          5
         ],
         "L": 3,
         "R": 2,
         "load": 4,
         "cue": "from TT stance against a wall; L = throws from the left hip; hips start, arms finish"
        }
       ]
      ],
      [
       "Strength",
       [
        {
         "ex": "pullups",
         "r": [
          5,
          5
         ],
         "s": 4,
         "load": {
          "1": 5,
          "2": 7.5,
          "3": 10
         },
         "cue": "superset with Z-press",
         "w4": {
          "s": 3,
          "load": 7.5
         }
        },
        {
         "ex": "zpress",
         "r": [
          6,
          8
         ],
         "L": 3,
         "R": 2,
         "cue": "seated on the floor, legs straight, no leaning, RPE 8",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Accessory",
       [
        {
         "ex": "dbrow",
         "r": [
          8,
          10
         ],
         "L": 4,
         "R": 3,
         "cue": "superset with curl; elbow to hip, 1 s squeeze, RPE 8",
         "w4": {
          "L": 3,
          "R": 2
         }
        },
        {
         "ex": "curl",
         "r": [
          10,
          12
         ],
         "L": 3,
         "R": 2,
         "cue": "strict, no swing",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Core",
       [
        {
         "ex": "cablerot",
         "r": [
          8,
          8
         ],
         "L": 3,
         "R": 2,
         "cue": "superset with side plank; from TT stance, hips lead, arms stay long",
         "w4": {
          "L": 2
         }
        },
        {
         "ex": "sideplank",
         "t": 30,
         "L": 3,
         "R": 2,
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "thoracic",
         "t": 60,
         "L": 1,
         "R": 1
        },
        {
         "ex": "doorpec",
         "t": 60,
         "L": 1,
         "R": 1
        },
        {
         "ex": "sleeper",
         "t": 60,
         "L": 1,
         "R": 2,
         "cue": "playing shoulder gets the extra set"
        }
       ]
      ]
     ]
    }
   },
   {
    "id": "gym3",
    "name": "Gym 3",
    "title": "Power & agility",
    "required": true,
    "minutes": 50,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "easybike",
         "t": 180,
         "s": 1,
         "cue": "easy pace",
         "match": {}
        },
        {
         "ex": "legswing",
         "r": [
          10,
          10
         ],
         "L": 1,
         "R": 1,
         "cue": "front-back and side to side",
         "match": {}
        },
        {
         "ex": "lowshuffle",
         "s": 2,
         "r": [
          1,
          1
         ],
         "cue": "10 m · low stance, each way",
         "match": {
          "cue": "10 m"
         }
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "switchjump",
         "r": [
          6,
          6
         ],
         "s": 2,
         "cue": "superset with shuffle to sprint; stay low, little air time",
         "match": {
          "cue": "replaces G3 the day before a match; nothing should feel hard"
         }
        },
        {
         "ex": "shuffle",
         "L": 3,
         "R": 2,
         "r": [
          1,
          1
         ],
         "cue": "5 m each way · 2 shuffle steps then sprint; L = starting toward the left",
         "match": {
          "L": 2,
          "R": 1,
          "cue": "5 m each way"
         }
        },
        {
         "ex": "mbthrow",
         "r": [
          4,
          4
         ],
         "L": 3,
         "R": 2,
         "load": 3,
         "cue": "pure speed, hips first",
         "match": {
          "L": 2,
          "R": 1
         }
        }
       ]
      ],
      [
       "Strength (optional)",
       [
        {
         "ex": "deadlift",
         "r": [
          3,
          3
         ],
         "s": 3,
         "load": 105,
         "cue": "free weekends only; fast off the floor, stop at any slowdown",
         "w4": {
          "s": 2,
          "load": 92.5
         },
         "match": null
        }
       ]
      ],
      [
       "Core",
       [
        {
         "ex": "pallof",
         "r": [
          10,
          10
         ],
         "L": 3,
         "R": 3,
         "cue": "done during deadlift rest; if no deadlift, after the accessory block; resist all rotation",
         "w4": {
          "L": 2,
          "R": 2
         },
         "match": {
          "L": 2,
          "R": 2,
          "cue": "resist all rotation"
         }
        }
       ]
      ],
      [
       "Accessory",
       [
        {
         "ex": "slrdl",
         "r": [
          6,
          6
         ],
         "L": 3,
         "R": 2,
         "cue": "superset with cable row; slow down, fast up",
         "w4": {
          "L": 2
         },
         "match": {
          "L": 2,
          "R": 1
         }
        },
        {
         "ex": "cablerow",
         "r": [
          10,
          10
         ],
         "L": 3,
         "R": 2,
         "cue": "split stance, slight rotation with the pull",
         "w4": {
          "L": 2
         },
         "match": {
          "L": 2,
          "R": 1
         }
        }
       ]
      ],
      [
       "Conditioning (optional)",
       [
        {
         "ex": "bikesprint",
         "t": 10,
         "s": 5,
         "cue": "free weekends only; all-out, 50 s easy between",
         "w4": {
          "s": 4
         },
         "match": null
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "anklewall",
         "t": 60,
         "L": 1,
         "R": 1,
         "match": {}
        },
        {
         "ex": "hip9090",
         "t": 60,
         "L": 1,
         "R": 1,
         "match": {}
        },
        {
         "ex": "thoracic",
         "t": 60,
         "L": 1,
         "R": 1,
         "match": null
        }
       ]
      ]
     ]
    },
    "matchable": true
   },
   {
    "id": "cond",
    "name": "Sunday A",
    "title": "TT interval games",
    "required": false,
    "minutes": 35,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "easyjog",
         "t": 300,
         "s": 1,
         "cue": "or easy bike"
        },
        {
         "ex": "legswing",
         "r": [
          10,
          10
         ],
         "L": 1,
         "R": 1
        },
        {
         "ex": "lowshuffle",
         "s": 2,
         "r": [
          1,
          1
         ],
         "cue": "10 m"
        }
       ]
      ],
      [
       "Conditioning",
       [
        {
         "ex": "shuttle",
         "t": 240,
         "cue": "after a free Saturday; each game = 8 × (10 s on / 20 s off) between cones 3 m apart, touch the floor at the left cone; 2 min rest; week 1: 3 games, week 2: 4, week 3: 5, week 4: 2",
         "sw": {
          "1": 3,
          "2": 4,
          "3": 5,
          "4": 2
         }
        }
       ]
      ],
      [
       "Cool-down (optional)",
       [
        {
         "ex": "hip9090",
         "t": 60,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   },
   {
    "id": "aero",
    "name": "Sunday B",
    "title": "Easy aerobic",
    "required": false,
    "minutes": 45,
    "tpl": {
     "A": [
      [
       "Conditioning",
       [
        {
         "ex": "easyrun",
         "t": 2700,
         "s": 1,
         "cue": "after a match; 5:45–6:00/km, HR ≈ 140, or bike if legs are heavy"
        }
       ]
      ],
      [
       "Cool-down (optional)",
       [
        {
         "ex": "couch",
         "t": 60,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   }
  ]
 },
 {
  "id": "away",
  "v": 2,
  "name": "Away — no gym",
  "weeks": 1,
  "lightLast": false,
  "cycles": [
   {
    "key": "A",
    "name": "Weekly"
   }
  ],
  "sessions": [
   {
    "id": "outA",
    "name": "Out A",
    "title": "Legs & spring",
    "required": true,
    "minutes": 35,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "slbridge",
         "r": [
          12,
          12
         ],
         "L": 2,
         "R": 1
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "pogo",
         "t": 10,
         "s": 2
        },
        {
         "ex": "skater",
         "r": [
          4,
          4
         ],
         "L": 3,
         "R": 2
        }
       ]
      ],
      [
       "Accessory",
       [
        {
         "ex": "bulgarian",
         "r": [
          10,
          10
         ],
         "L": 3,
         "R": 2,
         "cue": "loaded backpack",
         "w4": {
          "L": 2
         }
        },
        {
         "ex": "slrdl",
         "r": [
          10,
          10
         ],
         "L": 3,
         "R": 2,
         "cue": "loaded backpack",
         "w4": {
          "L": 2
         }
        },
        {
         "ex": "splithold",
         "t": 30,
         "L": 3,
         "R": 2,
         "cue": "at TT stance depth",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Core",
       [
        {
         "ex": "sideplank",
         "t": 30,
         "L": 3,
         "R": 2,
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "hip9090",
         "t": 60,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   },
   {
    "id": "outB",
    "name": "Out B",
    "title": "Upper body & rotation",
    "required": true,
    "minutes": 35,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "thoracic",
         "L": 1,
         "R": 1,
         "t": 30,
         "cue": "8 reps per side"
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "plyopush",
         "r": [
          6,
          6
         ],
         "s": 3
        }
       ]
      ],
      [
       "Strength",
       [
        {
         "ex": "pullups",
         "r": [
          6,
          8
         ],
         "s": 4,
         "cue": "stop 2 reps before failure; table or door rows if no bar",
         "w4": {
          "s": 3
         }
        },
        {
         "ex": "pike",
         "r": [
          8,
          8
         ],
         "s": 3,
         "w4": {
          "s": 2
         }
        }
       ]
      ],
      [
       "Accessory",
       [
        {
         "ex": "bprow",
         "r": [
          12,
          12
         ],
         "L": 3,
         "R": 2,
         "w4": {
          "L": 2
         }
        },
        {
         "ex": "bpcurl",
         "r": [
          12,
          12
         ],
         "L": 3,
         "R": 2,
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Core",
       [
        {
         "ex": "bandrot",
         "r": [
          10,
          10
         ],
         "L": 3,
         "R": 2,
         "cue": "hips lead",
         "w4": {
          "L": 2
         }
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "thoracic",
         "t": 60,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   },
   {
    "id": "outC",
    "name": "Out C",
    "title": "Speed & engine",
    "required": true,
    "minutes": 30,
    "tpl": {
     "A": [
      [
       "Warm-up",
       [
        {
         "ex": "lowshuffle",
         "s": 2,
         "r": [
          1,
          1
         ],
         "cue": "10 m"
        }
       ]
      ],
      [
       "Speed & Power",
       [
        {
         "ex": "switchjump",
         "r": [
          6,
          6
         ],
         "s": 2
        },
        {
         "ex": "shuffle",
         "L": 3,
         "R": 2,
         "r": [
          1,
          1
         ],
         "cue": "5 m each way"
        }
       ]
      ],
      [
       "Conditioning",
       [
        {
         "ex": "shuttle",
         "t": 240,
         "s": 3,
         "cue": "8 × (10 s on / 20 s off), 2 min rest",
         "w4": {
          "s": 2
         }
        }
       ]
      ],
      [
       "Mobility",
       [
        {
         "ex": "anklewall",
         "t": 60,
         "L": 1,
         "R": 1
        }
       ]
      ]
     ]
    }
   }
  ]
 }
];

/* Replace suggestions: [exercise id, why it fits] — same movement, other equipment. */
const ALTS = {
  pogo: [['jumprope', 'no space · rope'], ['linehops', 'bodyweight']],
  skater: [['linehops', 'less space'], ['shuffle', 'bodyweight']],
  accel10: [['shuffle', 'short space'], ['bikesprint', 'no space · bike']],
  isosquat: [['wallsit', 'no rack'], ['goblet', 'dumbbells']],
  squat: [['goblet', 'no rack · dumbbells'], ['legpress', 'machine'], ['bulgarian', 'dumbbells + bench']],
  bulgarian: [['splitsquat', 'no bench'], ['revlunge', 'dumbbells only']],
  kickstand: [['slrdl', 'dumbbells'], ['dbrdl', 'both legs']],
  latlunge: [['revlunge', 'dumbbells'], ['splitsquat', 'dumbbells']],
  suitcase: [['farmer', 'two dumbbells'], ['sideplank', 'no weight']],
  sideplank: [['pallof', 'cable'], ['bandpallof', 'band']],
  scoop: [['mbthrow', 'no wall · med ball'], ['cablerot', 'cable'], ['bandrot', 'band']],
  plyopush: [['pushup', 'bodyweight']],
  pullups: [['latpullbi', 'machine'], ['invrow', 'bar / rings']],
  zpress: [['kneelpress', 'dumbbell'], ['pike', 'bodyweight']],
  dbrow: [['cablerow', 'cable'], ['chestrow', 'incline bench'], ['invrow', 'bodyweight']],
  latpull: [['pullups', 'pull-up bar'], ['dbrow', 'dumbbell'], ['latpullbi', 'two arms']],
  curl: [['hammer', 'dumbbell'], ['bpcurl', 'backpack']],
  facepull: [['bandpull', 'band']],
  cablerot: [['bandrot', 'band'], ['mbthrow', 'med ball'], ['pallof', 'anti-rotation']],
  pallof: [['bandpallof', 'band'], ['deadbug', 'floor'], ['sideplank', 'floor']],
  switchjump: [['skater', 'lateral'], ['pogo', 'lower impact']],
  shuffle: [['accel10', 'straight line'], ['skater', 'no space']],
  mbthrow: [['scoop', 'wall'], ['cablerot', 'cable'], ['bandrot', 'band']],
  deadlift: [['trapbar', 'trap bar'], ['dbrdl', 'dumbbells'], ['kickstand', 'dumbbells, one side']],
  slrdl: [['kickstand', 'more stable'], ['dbrdl', 'both legs']],
  cablerow: [['dbrow', 'dumbbell + bench'], ['chestrow', 'incline bench'], ['invrow', 'bodyweight']],
  bikesprint: [['rowsprint', 'rower'], ['jumprope', 'rope']],
  ttgames: [['bikesprint', 'bike'], ['jumprope', 'rope']],
  bprow: [['dbrow', 'dumbbell'], ['invrow', 'table / bar']],
  pike: [['pushup', 'easier'], ['kneelpress', 'dumbbell']],
  bpcurl: [['curl', 'dumbbell'], ['hammer', 'dumbbell']],
  bandrot: [['cablerot', 'cable'], ['pallof', 'anti-rotation']],
  splithold: [['wallsit', 'wall'], ['isosquat', 'rack']]
};
