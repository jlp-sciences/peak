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
