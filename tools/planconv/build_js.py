"""Build Peak's SEED_PLANS (tt-season + away) from the converted plan."""
import json, math, sys, subprocess
d = json.loads(subprocess.check_output(['python3', 'convert.py', sys.argv[1], 'types.json']))
assert not d['warn'], d['warn']
CATS = json.load(open('cats.json'))
S = {s['id']: s for s in d['sessions']}
NOLIGHT_BLOCKS = ('Warm-up', 'Mobility', 'Cool-down (optional)')
floor25 = lambda v: math.floor(v / 2.5 + 1e-9) * 2.5
def num(v): return int(v) if float(v).is_integer() else v

def light(it, block):
    """week 4: −1 set (never below 2), −10 % load; jumps / med ball and warm-up / mobility unchanged"""
    if block in NOLIGHT_BLOCKS or CATS.get(it['ex']) == 'Power' or 'sw' in it: return
    w4 = {}
    for k in ('s', 'L', 'R'):
        if k in it and it[k] > 2: w4[k] = max(2, it[k] - 1)
    if 'load' in it:
        last = it['load']['3'] if isinstance(it['load'], dict) else it['load']
        w4['load'] = num(floor25(last * 0.9))
    if w4: it['w4'] = w4

for s in d['sessions']:
    for blocks in s['tpl'].values():
        for b, items in blocks:
            for it in items:
                if s['id'] == 'cond' and it['ex'] == 'shuttle': it['sw'] = {'1': 3, '2': 4, '3': 5, '4': 2}; it.pop('s', None)
                light(it, b)

# match-eve version of Gym 3 → "match" overrides on Gym 3 (the app's Light version)
g3, g3m = S['gym3'], S['gym3m']
m_items = {}
for b, items in g3m['tpl']['A']:
    for it in items: m_items.setdefault(it['ex'], it)
for b, items in g3['tpl']['A']:
    for it in items:
        mi = m_items.get(it['ex'])
        if not mi: it['match'] = None; continue
        ov = {k: mi[k] for k in ('s', 'L', 'R', 'r', 't', 'd') if k in mi and mi.get(k) != it.get(k)}
        if mi.get('cue') and mi.get('cue') != it.get('cue'): ov['cue'] = mi['cue']
        it['match'] = ov

def sess(s, required=None):
    o = {'id': s['id'], 'name': s['name'], 'title': s['title'], 'required': s['required'] if required is None else required, 'minutes': s['minutes'], 'tpl': s['tpl']}
    if s['id'] == 'gym3': o['matchable'] = True  # its match-eve version is the app's Light version
    return o
tt = {'id': 'tt-season', 'v': 2, 'name': 'TT Season 2026–27', 'weeks': d['head']['weeks'], 'lightLast': True,
      'cycles': [{'key': 'A', 'name': 'Strength'}, {'key': 'B', 'name': 'Power'}, {'key': 'C', 'name': 'Speed & transfer'}],
      'sessions': [sess(S[k]) for k in ('gym1', 'gym2', 'gym3', 'cond', 'aero')]}
S['cond']['name'] = 'Sunday A'; S['aero']['name'] = 'Sunday B'
tt['sessions'] = [sess(S[k]) for k in ('gym1', 'gym2', 'gym3', 'cond', 'aero')]
away = {'id': 'away', 'v': 2, 'name': 'Away — no gym', 'weeks': 1, 'lightLast': False, 'cycles': [{'key': 'A', 'name': 'Weekly'}],
        'sessions': [dict(sess(S[k], True), name=n) for k, n in (('outA', 'Out A'), ('outB', 'Out B'), ('outC', 'Out C'))]}
for s in away['sessions']: s['title'] = s['title']
js = '/* Built from the plan document (plan conversation, ' + sys.argv[2] + ') with tools/planconv — do not edit by hand, re-import the plan instead. */\nconst SEED_PLANS = ' + json.dumps([tt, away], ensure_ascii=False, indent=1) + ';\n'
open('seed_plans.js', 'w').write(js)
if len(sys.argv) > 3:  # path of js/data.js: replace the SEED_PLANS block
    lines = open(sys.argv[3]).read().split('\n')
    st = next(i for i, l in enumerate(lines) if l.startswith('const SEED_PLANS'))
    if st and lines[st - 1].startswith('/* Built from the plan document'): st -= 1
    en = next(i for i in range(st + 1, len(lines)) if lines[i] == '];')
    lines[st:en + 1] = js.rstrip('\n').split('\n')
    open(sys.argv[3], 'w').write('\n'.join(lines))
print(len(js))
