/* Peak — Google Drive sync.
   The app keeps everything on the device; Drive holds one file, peak-data.json,
   that every device merges with. Token model (no server): an access token lasts
   about an hour and is asked for with a tap on "Sync". */
'use strict';

const GOOGLE_CLIENT_ID = '859253354600-g5tmdfv09ec2abh8cf5du7ioqlngehpd.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE = 'peak-data.json';
const SYNC_ORIGIN = 'https://jlp-sciences.github.io';
const TOKEN_KEY = 'peak.gtoken';

const SYNC = { token: null, exp: 0, client: null, busy: false, err: null, dirty: false, timer: null };
const syncAvailable = () => location.origin === SYNC_ORIGIN;

/* ---------- merge (pure, testable) ---------- */
const newer = (a, b) => ((b && (b.upd || 0)) > ((a && a.upd) || 0) ? b : a);
function mergeData(local, remote) {
  if (!remote || remote.v !== 1) return local;
  const out = JSON.parse(JSON.stringify(local));
  // deletions
  out.deleted = Object.assign({}, remote.deleted || {}, local.deleted || {});
  // workouts: union by id, newest version wins, deleted ids removed
  const byId = {};
  [...(remote.workouts || []), ...(local.workouts || [])].forEach((w) => { byId[w.id] = byId[w.id] ? newer(byId[w.id], w) : w; });
  out.workouts = Object.values(byId).filter((w) => !out.deleted[w.id]).sort((a, b) => (a.start || 0) - (b.start || 0));
  if (out.active && !out.workouts.some((w) => w.id === out.active)) out.active = null;
  // exercises & plans: union, newest wins
  out.exercises = Object.assign({}, remote.exercises || {});
  Object.values(local.exercises || {}).forEach((e) => { out.exercises[e.id] = newer(out.exercises[e.id], e) || e; });
  out.plans = Object.assign({}, remote.plans || {}, local.plans || {});
  // progress: the most recently changed state of each plan
  out.progress = Object.assign({}, remote.progress || {});
  Object.keys(local.progress || {}).forEach((id) => { out.progress[id] = newer(out.progress[id], local.progress[id]) || local.progress[id]; });
  // settings: newest wins, but the device keeps its own sound/vibrate choice
  const s = newer(local.settings, remote.settings) || local.settings;
  out.settings = Object.assign({}, s, { sound: local.settings.sound, vibrate: local.settings.vibrate });
  // runs: latest on/off decision per day
  out.runs = {}; out.runsOff = {};
  const days = new Set([...Object.keys(local.runs || {}), ...Object.keys(remote.runs || {}), ...Object.keys(local.runsOff || {}), ...Object.keys(remote.runsOff || {})]);
  days.forEach((d) => {
    const on = Math.max(Number((local.runs || {})[d]) || 0, Number((remote.runs || {})[d]) || 0);
    const off = Math.max(Number((local.runsOff || {})[d]) || 0, Number((remote.runsOff || {})[d]) || 0);
    if (on > off) out.runs[d] = on; else if (off) out.runsOff[d] = off;
  });
  // body: one entry per date, newest wins
  const byDate = (a, b) => { const m = {}; [...(b || []), ...(a || [])].forEach((x) => { m[x.date] = m[x.date] ? newer(m[x.date], x) : x; }); return Object.values(m).sort((x, y) => x.date.localeCompare(y.date)); };
  out.body = { measures: byDate((local.body || {}).measures, (remote.body || {}).measures), tests: byDate((local.body || {}).tests, (remote.body || {}).tests) };
  out.created = Math.min(local.created || Date.now(), remote.created || Date.now());
  return out;
}

/* ---------- Google token ---------- */
function loadToken() {
  try { const t = JSON.parse(localStorage.getItem(TOKEN_KEY)); if (t && t.exp > Date.now() + 60000) { SYNC.token = t.token; SYNC.exp = t.exp; } } catch (e) { /* none */ }
}
const hasToken = () => SYNC.token && SYNC.exp > Date.now() + 30000;
function initGoogle() {
  if (!syncAvailable() || document.getElementById('gis')) return;
  const sc = document.createElement('script');
  sc.id = 'gis'; sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.defer = true;
  sc.onload = () => {
    try {
      SYNC.client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE,
        callback: (r) => {
          if (r && r.access_token) {
            SYNC.token = r.access_token; SYNC.exp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
            try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: SYNC.token, exp: SYNC.exp })); } catch (e) { /* ignore */ }
            D.sync = Object.assign(D.sync || {}, { connected: true });
            syncNow();
          } else { SYNC.err = 'Google did not give access'; render(); }
        },
        error_callback: () => { SYNC.err = 'Sign-in closed'; render(); }
      });
    } catch (e) { SYNC.err = 'Google sign-in unavailable'; }
  };
  document.head.appendChild(sc);
}
function connectGoogle() {
  if (!syncAvailable()) { toast('Sync works on the published app'); return; }
  if (!SYNC.client) { toast('Google is still loading, try again'); initGoogle(); return; }
  SYNC.err = null;
  SYNC.client.requestAccessToken({ prompt: D.sync && D.sync.connected ? '' : 'consent' });
}

/* ---------- Drive REST ---------- */
async function gfetch(url, opts = {}) {
  const res = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + SYNC.token }, opts.headers || {}) }));
  if (res.status === 401) { SYNC.token = null; try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } throw new Error('auth'); }
  if (!res.ok) throw new Error('drive ' + res.status);
  return res;
}
async function findFile() {
  if (D.sync && D.sync.fileId) return D.sync.fileId;
  const q = encodeURIComponent(`name='${DRIVE_FILE}' and trashed=false`);
  const r = await (await gfetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`)).json();
  return r.files && r.files[0] ? r.files[0].id : null;
}
async function uploadFile(id, data) {
  const body = JSON.stringify(data);
  if (id) {
    await gfetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    return id;
  }
  const boundary = 'peak' + Date.now();
  const multi = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: DRIVE_FILE, mimeType: 'application/json' })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const r = await (await gfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multi })).json();
  return r.id;
}

async function syncNow() {
  if (!syncAvailable() || SYNC.busy) return;
  if (!hasToken()) { render(); return; }
  if (!navigator.onLine) { SYNC.err = 'Offline — will sync later'; render(); return; }
  SYNC.busy = true; SYNC.err = null; render();
  try {
    let id = await findFile();
    let remote = null;
    if (id) {
      try { remote = await (await gfetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)).json(); }
      catch (e) { if (String(e.message).includes('404')) { id = null; } else throw e; }
    }
    const keepActive = D.active;
    const merged = mergeData(D, remote);
    if (keepActive && merged.workouts.some((w) => w.id === keepActive)) merged.active = keepActive;
    merged.sync = Object.assign({}, D.sync || {}, { connected: true });
    const toSend = Object.assign({}, merged, { active: null, sync: undefined });
    id = await uploadFile(id, toSend);
    merged.sync.fileId = id; merged.sync.last = Date.now();
    D = merged; SYNC.dirty = false;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) { /* ignore */ }
  } catch (e) {
    SYNC.err = e.message === 'auth' ? 'Tap Sync to reconnect' : 'Sync failed — will retry';
    if (D.sync && String(e.message).includes('404')) D.sync.fileId = null;
  }
  SYNC.busy = false; render();
}

/* called by save(): schedule a background sync when connected */
function onLocalChange() {
  SYNC.dirty = true;
  if (!syncAvailable() || !hasToken()) return;
  clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncNow, 15000);
}

/* ---------- UI ---------- */
function agoTxt(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60); return h < 24 ? h + ' h ago' : Math.round(h / 24) + ' d ago';
}
function syncChip() {
  if (!syncAvailable()) return '';
  let label, cls = '';
  if (SYNC.busy) label = 'Syncing…';
  else if (SYNC.err) { label = SYNC.err.startsWith('Tap') || !hasToken() ? 'Tap to sync' : 'Sync error'; cls = ' warn'; }
  else if (!hasToken()) { label = D.sync && D.sync.last ? 'Tap to sync' : 'Connect Drive'; cls = ' warn'; }
  else label = D.sync && D.sync.last ? 'Synced ' + agoTxt(D.sync.last) : 'Sync';
  return `<button class="sync-chip${cls}" data-act="sync" aria-label="Google Drive sync: ${esc(label)}">${CLOUD}<span>${esc(label)}</span></button>`;
}
const CLOUD = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/></svg>';
function syncSettings() {
  if (!syncAvailable()) return `<div class="toggle"><span><b>Google Drive sync</b><small>Works on the published app (jlp-sciences.github.io/peak). Here, data stays on this device.</small></span></div>`;
  const last = D.sync && D.sync.last ? 'Last sync ' + agoTxt(D.sync.last) : 'Never synced';
  return `<button class="list-btn" data-act="sync"><span><b>${hasToken() ? 'Sync now' : 'Connect Google Drive'}</b><small>${esc(SYNC.err || last)} · file ${DRIVE_FILE}</small></span></button>`;
}

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act="sync"]'); if (!b) return;
  if (hasToken()) syncNow(); else connectGoogle();
});
window.addEventListener('online', () => { if (SYNC.dirty && hasToken()) syncNow(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && SYNC.dirty && hasToken()) syncNow(); });

if (typeof window !== 'undefined' && !window.__PEAK_NO_BOOT__) {
  loadToken(); initGoogle();
  setTimeout(() => { if (hasToken()) syncNow(); }, 1500);
}
