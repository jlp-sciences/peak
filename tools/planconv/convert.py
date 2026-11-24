"""Convert the plan text format (agreed with the plan conversation) into Peak's SEED_PLANS entries."""
import re, json, sys

NAME2ID = {
  'stationary bike': 'easybike', 'single-leg glute bridge': 'slbridge', 'banded lateral walk': 'bandwalk', 'low pogo': 'pogo',
  'skater hop': 'skater', 'isometric squat pin push': 'isosquat', 'back squat': 'squat', 'suitcase carry': 'suitcase',
  'bulgarian split squat': 'bulgarian', 'kickstand romanian deadlift': 'kickstand', 'hip 90/90': 'hip9090', 'couch stretch': 'couch',
  'rowing machine': 'easyrow', 'band pull-apart': 'pullapart', 'quadruped thoracic rotation': 'thoracic', 'thoracic rotation': 'thoracic',
  'medicine ball rotational scoop toss': 'scoop', 'weighted pull-up': 'pullups', 'pull-up': 'pullups', 'single-arm dumbbell z-press': 'zpress',
  'single-arm dumbbell row': 'dbrow', 'single-arm dumbbell curl': 'curl', 'standing cable rotation': 'cablerot', 'side plank': 'sideplank',
  'doorway pec stretch': 'doorpec', 'sleeper stretch': 'sleeper', 'leg swing': 'legswing', 'lateral shuffle': 'lowshuffle',
  'split-stance switch jump': 'switchjump', 'shuffle to sprint': 'shuffle', 'medicine ball rotational throw': 'mbthrow', 'deadlift': 'deadlift',
  'pallof press': 'pallof', 'single-leg romanian deadlift': 'slrdl', 'single-arm cable row': 'cablerow', 'stationary bike sprint': 'bikesprint',
  'ankle wall drill': 'anklewall', 'easy jog': 'easyjog', 'lateral shuttle game': 'shuttle', 'easy run': 'easyrun',
  'split squat isometric hold': 'splithold', 'explosive push-up': 'plyopush', 'pike push-up': 'pike', 'single-arm backpack row': 'bprow',
  'single-arm backpack curl': 'bpcurl', 'standing band rotation': 'bandrot'
}
# exercise types in the app (for reps given on a timed exercise, etc.)
TYPES = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
SESSION_IDS = {'G1': 'gym1', 'G2': 'gym2', 'G3': 'gym3', 'G3M': 'gym3m', 'C1': 'cond', 'C2': 'aero', 'O1': 'outA', 'O2': 'outB', 'O3': 'outC'}

def secs(v):
    m, s = v.split(':'); return int(m) * 60 + int(s)

def one(v):
    """'6–8' → r, '1:00' → t, '20 m' → d"""
    v = v.strip()
    if re.fullmatch(r'\d+:\d\d', v): return {'t': secs(v)}
    m = re.fullmatch(r'(\d+(?:\.\d+)?)\s*m', v)
    if m: return {'d': float(m.group(1)) if '.' in m.group(1) else int(m.group(1))}
    m = re.fullmatch(r'(\d+)\s*[–-]\s*(\d+)', v)
    if m: return {'r': [int(m.group(1)), int(m.group(2))]}
    if re.fullmatch(r'\d+', v): return {'r': [int(v), int(v)]}
    raise ValueError('dose? ' + v)

def dose(txt):
    txt = txt.strip()
    m = re.fullmatch(r'L\s*(\d+)\s*×\s*(.+?)\s*/\s*R\s*(\d+)\s*×\s*(.+)', txt)
    if m:
        d = one(m.group(2)); d.update({'L': int(m.group(1)), 'R': int(m.group(3))}); return d
    m = re.fullmatch(r'L\s*(\d+)\s*/\s*R\s*(\d+)\s*×\s*(.+)', txt)
    if m:
        d = one(m.group(3)); d.update({'L': int(m.group(1)), 'R': int(m.group(2))}); return d
    m = re.fullmatch(r'(\d+)\s*×\s*(.+)', txt)
    if m:
        d = one(m.group(2)); d['s'] = int(m.group(1)); return d
    raise ValueError('dose? ' + txt)

def item(line, warn):
    parts = [p.strip() for p in line[1:].split('|')]
    name = parts[0]; ex = NAME2ID.get(name.lower())
    if not ex: warn.append('unknown exercise: ' + name); return None
    it = {'ex': ex}; it.update(dose(parts[1]))
    cue = []; base = None
    for p in parts[2:]:
        if p.lower().startswith('cue:'): cue.append(p[4:].strip()); continue
        m = re.fullmatch(r'\+\s*(\d+(?:\.\d+)?)\s*kg per week.*', p)
        if m and base is not None:
            inc = float(m.group(1)); it['load'] = {str(w): base + inc * (w - 1) for w in (1, 2, 3)}
            continue
        m = re.fullmatch(r'BW\s*\+\s*(\d+(?:\.\d+)?)\s*kg', p)
        if m: base = float(m.group(1)); it['load'] = base; continue
        m = re.fullmatch(r'(\d+(?:\.\d+)?)\s*kg', p)
        if m: base = float(m.group(1)); it['load'] = base; continue
        if p == 'BW': continue
        cue.append(p)
    t = TYPES.get(ex)
    if t == 'time' and 'r' in it and 't' not in it:  # reps given for a timed exercise
        cue.insert(0, f"{it['r'][0]} reps per side" if 'L' in it else f"{it['r'][0]} reps"); it['t'] = 30; del it['r']
    if t == 'reps' and 'd' in it:  # distance on a reps exercise: 1 rep = the distance
        cue.insert(0, f"{it['d']} m" + (' each way' if 'L' in it else '')); it['r'] = [1, 1]; del it['d']
    if t == 'wd' and 'd' not in it: warn.append(ex + ': distance missing')
    if cue: it['cue'] = ' · '.join(cue)
    for k in ('load',):
        if isinstance(it.get(k), dict): it[k] = {kk: (int(v) if float(v).is_integer() else v) for kk, v in it[k].items()}
        elif isinstance(it.get(k), float) and it[k].is_integer(): it[k] = int(it[k])
    return it

def parse(text):
    warn = []; sessions = []; daily = []; head = {}; cur = None; cyc = None; block = None; mode = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line: continue
        if line.startswith('PLAN:'): head['name'] = line[5:].strip(); continue
        if line.startswith('WEEKS PER CYCLE:'): head['weeks'] = int(re.search(r'\d+', line).group()); continue
        if line.startswith('CYCLES:'): continue
        if line.startswith('NEW:'): continue
        if line == 'DAILY MOBILITY': mode = 'daily'; continue
        m = re.match(r'SESSION\s+(\S+)\s*\|\s*(.+?)\s*—\s*(.+?)\s*\|\s*(required|optional)\s*\|\s*~?(\d+)\s*min', line)
        if m:
            mode = 'session'; cur = {'code': m.group(1), 'id': SESSION_IDS.get(m.group(1), m.group(1).lower()), 'name': m.group(2), 'title': m.group(3),
                                     'required': m.group(4) == 'required', 'minutes': int(m.group(5)), 'tpl': {}}
            sessions.append(cur); cyc = None; continue
        m = re.match(r'CYCLE\s+(\S+)', line)
        if m: cyc = 'A' if m.group(1) == 'ALL' else m.group(1); cur['tpl'][cyc] = []; continue
        if line.startswith('## '): block = [line[3:].strip(), []]; cur['tpl'][cyc].append(block); continue
        if line.startswith('- '):
            it = item(line, warn)
            if not it: continue
            if mode == 'daily': daily.append(it)
            else: block[1].append(it)
    return head, sessions, daily, warn

if __name__ == '__main__':
    head, sessions, daily, warn = parse(open(sys.argv[1]).read())
    print(json.dumps({'head': head, 'sessions': sessions, 'daily': daily, 'warn': warn}, ensure_ascii=False, indent=1))
