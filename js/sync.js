/* Peak — Google Drive sync, record model.
   Every piece of data is a record with a stable path ("workouts:<id>", "settings:goalWeight"…).
   Each device keeps per-path metadata {t, h, d} (time, hash, deleted) and merges record by record
   with one hidden file in the Drive appDataFolder: {app, v, av, at, meta, recs}.
   Rules learned the hard way: unknown paths are kept and sent back, a newer app version stops
   the sync, an entry without content never deletes local data, writes re-check the file version,
   big deletions go to a local trash first. */
'use strict';

const GOOGLE_CLIENT_ID = '859253354600-g5tmdfv09ec2abh8cf5du7ioqlngehpd.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const DRIVE_FILE = 'peak-sync.json';
const SYNC_ORIGIN = 'https://jlp-sciences.github.io';
const TOKEN_KEY = 'peak.gtoken', META_KEY = 'peak.meta', TRASH_KEY = 'peak.trash';
const TRASH_MIN = 10, TRASH_KEEP = 5, FILE_V = 2;
const KNOWN = ['workouts', 'exercises', 'plans', 'progress', 'settings', 'runs', 'measures', 'tests', 'planned', 'eras', 'quotes'];
const LOCAL_SETTINGS = ['sound', 'vibrate', 'upd'];

const SYNC = { token: null, exp: 0, client: null, busy: false, state: 'idle', err: null, timer: null, last: 0, pendingRender: false, blocked: false, rev: 0 };
const syncAvailable = () => location.origin === SYNC_ORIGIN;
const syncKnown = (path) => KNOWN.includes(path.split(':')[0]);

/* ---------- records ---------- */
function recordsOf(db) {
  const m = new Map();
  (db.workouts || []).forEach((w) => m.set('workouts:' + w.id, w));
  Object.values(db.exercises || {}).forEach((e) => m.set('exercises:' + e.id, e));
  Object.values(db.plans || {}).forEach((p) => m.set('plans:' + p.id, p));
  Object.keys(db.progress || {}).forEach((k) => m.set('progress:' + k, db.progress[k]));
  Object.keys(db.settings || {}).filter((k) => !LOCAL_SETTINGS.includes(k)).forEach((k) => m.set('settings:' + k, db.settings[k]));
  Object.keys(db.runs || {}).forEach((d) => m.set('runs:' + d, true));
  Object.keys(db.quotes || {}).forEach((d) => m.set('quotes:' + d, true));
  Object.values(db.planned || {}).forEach((p) => m.set('planned:' + p.id, p));
  Object.values(db.eras || {}).forEach((e) => m.set('eras:' + e.id, e));
  ((db.body || {}).measures || []).forEach((x) => m.set('measures:' + x.date, x));
  ((db.body || {}).tests || []).forEach((x) => m.set('tests:' + x.date, x));
  Object.keys(db.extra || {}).forEach((p) => m.set(p, db.extra[p]));
  return m;
}
function putRec(db, path, content) {
  const i = path.indexOf(':'); const coll = path.slice(0, i), id = path.slice(i + 1);
  const del = content === undefined;
  if (!db.body) db.body = { measures: [], tests: [] };
  const byKey = (arr, key, val) => { const j = arr.findIndex((x) => x[key] === val); if (j >= 0) arr.splice(j, 1); if (!del) arr.push(content); };
  if (!syncKnown(path)) { db.extra = db.extra || {}; if (del) delete db.extra[path]; else db.extra[path] = content; return; }
  switch (coll) {
    case 'workouts': byKey(db.workouts, 'id', id); db.workouts.sort((a, b) => (a.start || 0) - (b.start || 0)); break;
    case 'exercises': case 'plans': case 'progress': if (del) delete db[coll][id]; else db[coll][id] = content; break;
    case 'settings': if (del) delete db.settings[id]; else db.settings[id] = content; break;
    case 'runs': if (del) delete db.runs[id]; else db.runs[id] = true; break;
    case 'quotes': db.quotes = db.quotes || {}; if (del) delete db.quotes[id]; else db.quotes[id] = true; break;
    case 'planned': db.planned = db.planned || {}; if (del) delete db.planned[id]; else db.planned[id] = content; break;
    case 'eras': db.eras = db.eras || {}; if (del) delete db.eras[id]; else db.eras[id] = content; break;
    case 'measures': byKey(db.body.measures, 'date', id); db.body.measures.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'tests': byKey(db.body.tests, 'date', id); db.body.tests.sort((a, b) => a.date.localeCompare(b.date)); break;
    default: break;
  }
}
function hashOf(obj) {
  const s = JSON.stringify(obj); let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + s.length.toString(36);
}
const weightOf = (content) => 1 + (content && Array.isArray(content.sets) ? content.sets.length : 0);

/* ---------- local metadata ---------- */
let META = {};
function loadMeta() { try { META = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { META = {}; } }
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) { /* ignore */ } }
/* compare hashes with the last ones seen: changed → t = now; vanished → tombstone.
   Data created by a fresh install (seed) gets t = 0 so it never overrides real edits. */
function syncTrack(db, meta, now) {
  const recs = recordsOf(db); const base = db._seeded ? 0 : now;
  recs.forEach((c, p) => {
    const h = hashOf(c); const m = meta[p];
    if (!m) meta[p] = { t: base, h };
    else if (m.d || m.h !== h) meta[p] = { t: now, h };
  });
  Object.keys(meta).forEach((p) => { if (!recs.has(p) && !meta[p].d) meta[p] = { t: now, h: '', d: 1 }; });
  delete db._seeded;
  return recs;
}

/* ---------- version compare (numeric: 0.10 > 0.9) ---------- */
function cmpVer(a, b) {
  const pa = String(a || '0').split(/[.-]/).map((x) => parseInt(x, 10) || 0), pb = String(b || '0').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}

/* ---------- merge, record by record, newest wins ----------
   returns { changedLocal, needUpload, deletions: [{path, content}], deletedWeight } */
function mergeInto(db, meta, remote, opts = {}) {
  const res = { changedLocal: false, needUpload: !remote, deletions: [], deletedWeight: 0 };
  if (!remote) return res;
  const rmeta = remote.meta || {}, rrecs = remote.recs || {};
  const local = recordsOf(db);
  const paths = new Set([...Object.keys(meta), ...Object.keys(rmeta)]);
  const actions = [];
  paths.forEach((p) => {
    const L = meta[p], R = rmeta[p];
    if (!R) { if (L) res.needUpload = true; return; }
    const remoteWins = !L || R.t > L.t || (R.t === L.t && !!R.d === !!L.d && (R.h || '') > (L.h || ''));
    if (!remoteWins) { if (R.t !== L.t || R.h !== L.h || !!R.d !== !!L.d) res.needUpload = true; return; }
    if (R.d) {
      if (opts.activeId && p === 'workouts:' + opts.activeId) { res.needUpload = true; return; } // never delete the session in progress
      if (local.has(p)) actions.push({ p, del: true, content: local.get(p) });
      meta[p] = { t: R.t, h: '', d: 1 };
      return;
    }
    if (!(p in rrecs)) { res.needUpload = true; return; } // incomplete file: keep local, send it back
    if (!L || L.h !== R.h || L.d || !local.has(p)) actions.push({ p, content: rrecs[p] });
    meta[p] = { t: R.t, h: R.h };
  });
  actions.forEach((a) => { if (a.del) { res.deletions.push({ path: a.p, content: a.content }); res.deletedWeight += weightOf(a.content); } });
  if (res.deletedWeight >= TRASH_MIN && opts.onTrash) opts.onTrash(res.deletions, res.deletedWeight);
  actions.forEach((a) => { putRec(db, a.p, a.del ? undefined : a.content); res.changedLocal = true; });
  return res;
}
function buildFile(db, meta, now) {
  const recs = {}; recordsOf(db).forEach((c, p) => { if (meta[p] && !meta[p].d) recs[p] = c; });
  return JSON.parse(JSON.stringify({ app: 'peak', v: FILE_V, av: APP_VERSION, at: now, meta, recs }));
}

/* ---------- trash ---------- */
function loadTrash() { try { return JSON.parse(localStorage.getItem(TRASH_KEY)) || []; } catch (e) { return []; } }
function pushTrash(deletions, weight) {
  const t = loadTrash(); t.unshift({ at: Date.now(), weight, items: deletions });
  try { localStorage.setItem(TRASH_KEY, JSON.stringify(t.slice(0, TRASH_KEEP))); } catch (e) { /* ignore */ }
}
function restoreTrash(i) {
  const t = loadTrash(); const e = t[i]; if (!e) return;
  e.items.forEach((x) => putRec(D, x.path, x.content));
  t.splice(i, 1); try { localStorage.setItem(TRASH_KEY, JSON.stringify(t)); } catch (err) { /* ignore */ }
  save(); UI.sheet = null; toast('Restored — it will reach your other devices'); render();
}

/* ---------- Google token ---------- */
function loadToken() { try { const t = JSON.parse(localStorage.getItem(TOKEN_KEY)); if (t && t.exp > Date.now() + 60000) { SYNC.token = t.token; SYNC.exp = t.exp; } } catch (e) { /* none */ } }
const hasToken = () => !!SYNC.token && SYNC.exp > Date.now() + 30000;
function initGoogle() {
  if (!syncAvailable() || document.getElementById('gis')) return;
  const sc = document.createElement('script'); sc.id = 'gis'; sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
  sc.onload = () => {
    try {
      SYNC.client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE + ' openid email profile',
        callback: (r) => {
          if (r && r.access_token) {
            SYNC.token = r.access_token; SYNC.exp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
            try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: SYNC.token, exp: SYNC.exp })); } catch (e) { /* ignore */ }
            D.sync = Object.assign(D.sync || {}, { connected: true });
            fetchProfile();
            try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* ignore */ }
            syncNow();
          } else setState('reconnect');
        },
        error_callback: () => setState('reconnect')
      });
    } catch (e) { setState('error', 'Google sign-in unavailable'); }
  };
  document.head.appendChild(sc);
}
function connectGoogle() {
  if (!syncAvailable()) { toast('Sync works on the published app'); return; }
  if (!SYNC.client) { toast('Google is still loading, try again'); initGoogle(); return; }
  SYNC.client.requestAccessToken({ prompt: D.sync && D.sync.connected ? '' : 'consent' });
}

/* ---------- Drive REST (appDataFolder) ---------- */
async function gfetch(url, opts = {}) {
  const res = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + SYNC.token }, opts.headers || {}) }));
  if (res.status === 401) { SYNC.token = null; try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } throw new Error('auth'); }
  if (!res.ok) throw new Error('Drive ' + res.status);
  return res;
}
async function fileInfo() {
  const q = encodeURIComponent(`name='${DRIVE_FILE}' and trashed=false`);
  const r = await (await gfetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,version)&orderBy=modifiedTime desc`)).json();
  return r.files && r.files[0] ? { id: r.files[0].id, version: String(r.files[0].version) } : null;
}
async function fileVersion(id) { const r = await (await gfetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=version`)).json(); return String(r.version); }
async function download(id) { return (await gfetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)).json(); }
async function upload(id, data) {
  const body = JSON.stringify(data);
  if (id) { await gfetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }); return id; }
  const b = 'peak' + Date.now();
  const multi = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: DRIVE_FILE, parents: ['appDataFolder'] })}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
  const r = await (await gfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: multi })).json();
  return r.id;
}

/* ---------- the sync ---------- */
async function syncNow() {
  if (!syncAvailable() || SYNC.busy || SYNC.blocked) return;
  if (!hasToken()) { setState('reconnect'); return; }
  if (!navigator.onLine) { setState('offline'); return; }
  SYNC.busy = true; setState('busy');
  let again = false;
  try {
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      const rev0 = SYNC.rev;
      const info = await fileInfo();
      const remote = info ? await download(info.id) : null;
      if (remote && cmpVer(remote.av, APP_VERSION) > 0) { SYNC.blocked = true; setState('update'); done = true; break; }
      const now = Date.now();
      const work = JSON.parse(JSON.stringify(D)); const meta = JSON.parse(JSON.stringify(META));
      syncTrack(work, meta, now);
      let trash = null;
      const res = mergeInto(work, meta, remote, { activeId: D.active, onTrash: (items, w) => { trash = [items, w]; } });
      let fileId = info && info.id;
      if (res.needUpload || res.changedLocal) {
        syncTrack(work, meta, now);
        if (info && (await fileVersion(info.id)) !== info.version) continue; // someone wrote meanwhile: merge again
        fileId = await upload(fileId, buildFile(work, meta, now));
      }
      if (trash) pushTrash(trash[0], trash[1]);
      if (SYNC.rev === rev0) { D = work; META = meta; } // nothing typed during the sync
      else { mergeInto(D, META, remote, { activeId: D.active }); syncTrack(D, META, Date.now()); again = true; } // keep what was typed meanwhile
      D.sync = Object.assign({}, D.sync || {}, { connected: true, fileId, last: now });
      saveMeta(); try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* ignore */ }
      SYNC.last = now; setState('ok'); done = true;
      if (trash) toast(trash[1] + ' items removed by another device — a copy is in Settings › Trash');
    }
    if (!done) setState('error', 'file kept changing, will retry');
  } catch (e) {
    if (e.message === 'auth') setState('reconnect'); else setState(navigator.onLine ? 'error' : 'offline', e.message);
  }
  SYNC.busy = false; safeRender();
  if (again) { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncNow, 3000); }
}

/* local change (called by save): track now, sync 10 s later */
function onLocalChange() {
  if (!D) return;
  SYNC.rev += 1;
  syncTrack(D, META, Date.now()); saveMeta();
  if (!syncAvailable() || !hasToken() || SYNC.blocked) return;
  clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncNow, 10000);
}

/* ---------- never redraw while typing, scrolling or filling a form ---------- */
let lastScroll = 0;
window.addEventListener('scroll', () => { lastScroll = Date.now(); }, { passive: true });
function busyUser() {
  const a = document.activeElement;
  if (a && ['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName)) return true;
  if (Date.now() - lastScroll < 800) return true;
  return ['newex', 'editex', 'measure', 'tests', 'picker', 'confirm', 'match'].includes(UI.sheet);
}
function safeRender() {
  clearTimeout(safeRender.t);
  if (busyUser()) { SYNC.pendingRender = true; safeRender.t = setTimeout(safeRender, 1000); return; }
  SYNC.pendingRender = false; const y = window.scrollY; render(); window.scrollTo(0, y);
}
function setState(s, err) { SYNC.state = s; SYNC.err = err || null; document.querySelectorAll('.sync-chip').forEach((c) => { c.outerHTML = syncChip(); }); }

/* ---------- update before the first sync ---------- */
async function updateThenSync() {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const txt = await (await fetch('sw.js', { cache: 'no-store' })).text();
      const m = txt.match(/VERSION\s*=\s*'([^']+)'/); const latest = m && m[1];
      const running = await new Promise((res) => {
        const ch = new MessageChannel(); ch.port1.onmessage = (e) => res(e.data);
        navigator.serviceWorker.controller.postMessage({ type: 'version' }, [ch.port2]); setTimeout(() => res(null), 1500);
      });
      if (latest && running && latest !== running && sessionStorage.getItem('peak.reloaded') !== latest) {
        sessionStorage.setItem('peak.reloaded', latest);
        const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update();
        setTimeout(() => location.reload(), 800); return;
      }
    }
  } catch (e) { /* offline: carry on with the version we have */ }
  if (hasToken()) { syncNow(); if (!(D.sync && D.sync.profile)) fetchProfile(); } else setState(D.sync && D.sync.last ? 'reconnect' : 'idle');
  welcomeOnce();
}

/* ---------- UI ---------- */
const CLOUD = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/></svg>';
const hhmm = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function syncLabel() {
  const last = (D.sync && D.sync.last) || SYNC.last;
  switch (SYNC.state) {
    case 'busy': return ['Syncing…', ''];
    case 'offline': return ['Offline', ' warn'];
    case 'update': return ['Update the app', ' warn'];
    case 'error': return ['Error: ' + (SYNC.err || 'sync'), ' warn'];
    case 'reconnect': return [last ? 'Reconnect needed' : 'Connect Drive', ' warn'];
    default: return hasToken() ? [last ? 'Synced ' + hhmm(last) : 'Sync', ''] : [last ? 'Reconnect needed' : 'Connect Drive', ' warn'];
  }
}
function syncChip() {
  if (!syncAvailable()) return '';
  const [label, cls] = syncLabel();
  return `<button class="sync-chip${cls}" data-act="sync" aria-label="Google Drive sync: ${esc(label)}">${CLOUD}<span>${esc(label)}</span></button>`;
}
function syncSettings() {
  const trash = loadTrash();
  const drive = syncAvailable()
    ? `<button class="list-btn" data-act="sync"><span><b>${hasToken() ? 'Sync now' : 'Connect Google Drive'}</b><small>${esc(syncLabel()[0])} · hidden app file in your Drive</small></span></button>`
    : '<div class="toggle"><span><b>Google Drive sync</b><small>Works on the published app (jlp-sciences.github.io/peak). Here, data stays on this device.</small></span></div>';
  const tr = trash.length ? `<div class="card inset"><span class="eyebrow">TRASH · COPIES KEPT WHEN A SYNC REMOVED ${TRASH_MIN}+ ITEMS</span>${trash.map((t, i) => `<div class="recent"><span class="sm">${longDate(iso(new Date(t.at)))} · ${t.weight} items</span><button class="btn small outline" data-act="trash-restore" data-v="${i}">Restore</button></div>`).join('')}</div>` : '';
  return drive + tr + '<button class="list-btn" data-act="sync-tests"><span><b>Run sync tests</b><small>7 checks on a demo copy — your data is not touched</small></span></button>';
}

/* ---------- built-in tests (demo copies only) ---------- */
function runSyncTests() {
  const out = [];
  const T = (name, fn) => { try { out.push([name, !!fn()]); } catch (e) { out.push([name, false]); } };
  const demo = () => { const db = seed(); db.workouts.push({ id: 'w1', date: '2026-11-18', start: 1, end: 2, sets: [{ id: 's1', exId: 'dbrow', side: 'L', w: 30, r: 10 }], items: [], name: 'Gym 2' }); const m = {}; syncTrack(db, m, 1000); return [db, m]; };
  const device = (src) => [JSON.parse(JSON.stringify(src[0])), JSON.parse(JSON.stringify(src[1]))];
  const fileOf = (dev, now) => { syncTrack(dev[0], dev[1], now); return buildFile(dev[0], dev[1], now); };
  T('Different records on two devices are all merged', () => {
    const base = demo(); const A = device(base), B = device(base);
    A[0].runs['2026-11-20'] = true; B[0].body.measures.push({ date: '2026-11-21', weight: 81 });
    const fA = fileOf(A, 2000); syncTrack(B[0], B[1], 2100); const r = mergeInto(B[0], B[1], fA);
    return B[0].runs['2026-11-20'] && B[0].body.measures.length === 1 && r.needUpload;
  });
  T('Same record changed on both: the newest wins', () => {
    const base = demo(); const A = device(base), B = device(base);
    A[0].exercises.dbrow.rest = 120; syncTrack(A[0], A[1], 2000);
    B[0].exercises.dbrow.rest = 60; const fB = fileOf(B, 3000);
    mergeInto(A[0], A[1], fB);
    return A[0].exercises.dbrow.rest === 60;
  });
  T('Deleted on one device: deleted on the other, no resurrection', () => {
    const base = demo(); const A = device(base), B = device(base);
    A[0].workouts = []; mergeInto(B[0], B[1], fileOf(A, 2000));
    mergeInto(A[0], A[1], fileOf(B, 2500));
    return !B[0].workouts.length && !A[0].workouts.length;
  });
  T('Unknown data from a newer version is kept and sent back', () => {
    const base = demo(); const A = device(base);
    const f = buildFile(A[0], A[1], 2000); f.meta['photos:p1'] = { t: 2000, h: 'x' }; f.recs['photos:p1'] = { src: 'demo' };
    mergeInto(A[0], A[1], f); const back = fileOf(A, 2500);
    return back.recs['photos:p1'] && !back.meta['photos:p1'].d;
  });
  T('Incomplete file: nothing local is lost', () => {
    const base = demo(); const A = device(base);
    const f = buildFile(A[0], A[1], 2000); f.meta['workouts:w1'] = { t: 5000, h: 'zzz' }; delete f.recs['workouts:w1'];
    const r = mergeInto(A[0], A[1], f);
    return A[0].workouts.length === 1 && r.needUpload;
  });
  T('Mass deletion goes to the trash and a restore spreads back', () => {
    const base = demo(); const A = device(base), B = device(base);
    for (let i = 0; i < 12; i++) B[0].workouts[0].sets.push({ id: 'x' + i, exId: 'dbrow', side: 'R', w: 30, r: 10 });
    mergeInto(A[0], A[1], fileOf(B, 1500));
    A[0].workouts = [];
    let caught = null; mergeInto(B[0], B[1], fileOf(A, 2000), { onTrash: (items, w) => { caught = { items, w }; } });
    if (!caught || caught.w < TRASH_MIN || B[0].workouts.length) return false;
    caught.items.forEach((x) => putRec(B[0], x.path, x.content));
    mergeInto(A[0], A[1], fileOf(B, 3000));
    return A[0].workouts.length === 1 && A[0].workouts[0].sets.length === 13;
  });
  T('A newer app version on Drive stops the sync (0.10 > 0.9)', () => cmpVer('0.10.0', '0.9.0') > 0 && cmpVer('0.4.0', '0.4.0') === 0 && cmpVer('0.4.0', '0.4.1') < 0);
  return out;
}

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'sync') { if (SYNC.state === 'update') { location.reload(); return; } if (hasToken()) syncNow(); else connectGoogle(); }
  if (b.dataset.act === 'trash-restore') restoreTrash(Number(b.dataset.v));
  if (b.dataset.act === 'sync-tests') { UI.testResults = runSyncTests(); UI.sheet = 'sync-tests'; render(); }
});
const _extraSheet = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'sync-tests') {
    const ok = UI.testResults.every((x) => x[1]);
    return `<h2>Sync tests — ${ok ? 'all passed' : 'failure'}</h2>${UI.testResults.map(([n, p]) => `<div class="recent"><span>${esc(n)}</span><b class="${p ? 'pass' : 'fail'}">${p ? 'OK' : 'FAIL'}</b></div>`).join('')}<p class="muted sm">Run on demo copies. Your sessions were not touched.</p>`;
  }
  return _extraSheet(name);
};

window.addEventListener('online', () => { if (hasToken()) syncNow(); });
document.addEventListener('visibilitychange', () => { if (hasToken()) syncNow(); });
setInterval(() => { if (document.visibilityState === 'visible' && hasToken()) syncNow(); }, 5 * 60000);
document.addEventListener('focusout', () => { if (SYNC.pendingRender) setTimeout(safeRender, 300); });

loadMeta();
if (typeof window !== 'undefined' && !window.__PEAK_NO_BOOT__) {
  loadToken(); initGoogle();
  const start = () => setTimeout(updateThenSync, 800);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}

/* ---------- account: the Google account is the Peak account ---------- */
const WELCOME_KEY = 'peak.welcomed';
async function fetchProfile() {
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + SYNC.token } });
    if (!r.ok) return; const p = await r.json();
    D.sync = Object.assign(D.sync || {}, { profile: { name: p.name || '', email: p.email || '', picture: p.picture || '' } });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* ignore */ }
    if (typeof safeRender === 'function') safeRender(); else render();
  } catch (e) { /* offline */ }
}
function welcomeOnce() {
  let seen = null; try { seen = localStorage.getItem(WELCOME_KEY); } catch (e) { /* ignore */ }
  if (seen || !syncAvailable() || (D.sync && D.sync.connected) || D.workouts.some((w) => w.end)) return;
  try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) { /* ignore */ }
  if (!UI.sheet) { UI.sheet = 'welcome'; render(); }
}
const profileOf = () => (D.sync && D.sync.profile) || null;
function avatarHTML(size) {
  const p = profileOf(); const initials = p && p.name ? p.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase() : '';
  return `<span class="avatar" style="width:${size}px;height:${size}px">${p && p.picture ? `<img src="${esc(p.picture)}" alt="" referrerpolicy="no-referrer">` : initials ? esc(initials) : '<svg aria-hidden="true" width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'}</span>`;
}
function accountButton() { return `<button class="icon-btn acct-btn" aria-label="Account" data-act="go" data-v="account">${avatarHTML(30)}</button>`; }
function accountView() {
  const p = profileOf(); const signed = !!(D.sync && D.sync.connected);
  const ws = D.workouts.filter((w) => w.end); const first = ws.map((w) => w.date).sort()[0];
  const A = typeof awards === 'function' ? awards() : null; const tro = A ? A.list.filter((x) => x.level > 0).length : 0;
  const cn = typeof climbNow === 'function' ? climbNow() : null;
  const [label] = syncLabel();
  return `<header class="top"><button class="icon-btn" aria-label="Back" data-act="go" data-v="today">${svg('back')}</button><div class="grow"><h1>Account</h1></div></header>
  <div class="acct-grid">
    <section class="card acct-card">${avatarHTML(72)}
      <div class="acct-id"><b>${p && p.name ? esc(p.name) : signed ? 'Google account' : 'Not signed in'}</b><span class="muted sm">${p && p.email ? esc(p.email) : signed ? 'Connected to Google Drive' : 'Your data is only on this device'}</span></div>
      ${syncAvailable() ? (signed
        ? `<div class="acct-sync"><span class="sync-dot${hasToken() ? ' on' : ''}"></span><span class="sm">${esc(label)}</span></div><div class="row wrap"><button class="btn outline" data-act="sync">${hasToken() ? 'Sync now' : 'Reconnect'}</button><button class="btn outline danger-t" data-act="acct-signout">Sign out</button></div>`
        : `<button class="btn primary big gbtn" data-act="sync"><span class="g">G</span> Sign in with Google</button><p class="muted sm">Your sessions are saved in a hidden file of your own Google Drive and come back on any device where you sign in.</p>`)
        : '<p class="muted sm">Sign-in works on the published app (jlp-sciences.github.io/peak). Here, data stays on this device.</p>'}
    </section>
    <section class="card"><span class="eyebrow">YOUR DATA</span>
      <div class="tiles"><div class="tile"><span class="muted sm">Sessions</span><span class="big-num">${ws.length}</span></div><div class="tile"><span class="muted sm">Trophies</span><span class="big-num">${tro}</span></div><div class="tile"><span class="muted sm">Climbed</span><span class="big-num">${cn ? Math.round(cn.total).toLocaleString('en') : 0} m</span></div><div class="tile"><span class="muted sm">Since</span><span class="big-num sm-num">${first ? shortDate(first) : '—'}</span></div></div>
      <button class="list-btn" data-act="export"><span><b>Export my data</b><small>Download a JSON backup</small></span></button></section>
    <section class="card"><span class="eyebrow">SHARING</span><p class="soft sm">Each person uses Peak with their own Google account, on their own phone. Sharing progress between two accounts will come later.</p></section>
  </div>`;
}
EXTRA_VIEWS.account = accountView;
const _extraSheetAcct = typeof extraSheet === 'function' ? extraSheet : () => '';
extraSheet = function (name) { // eslint-disable-line no-global-assign
  if (name === 'welcome') return `<div class="welcome">${typeof LOGO === 'function' ? LOGO(64) : ''}<h2>Welcome to Peak</h2><p class="soft">Already used Peak on another phone? Sign in with Google to bring your sessions back.</p>
    <button class="btn primary big gbtn" data-act="sync"><span class="g">G</span> Sign in with Google</button><button class="btn ghost" data-act="close">Start without an account</button></div>`;
  return _extraSheetAcct(name);
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'sync' && UI.sheet === 'welcome') { UI.sheet = null; }
  if (b.dataset.act === 'acct-signout') ask('Sign out? Your data stays on this phone; sync stops until you sign in again.', 'Sign out', () => {
    try { if (SYNC.token && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(SYNC.token, () => {}); } catch (e) { /* ignore */ }
    SYNC.token = null; SYNC.exp = 0; try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
    D.sync = {}; save(); UI.sheet = null; setState('idle'); render(); toast('Signed out');
  });
});
