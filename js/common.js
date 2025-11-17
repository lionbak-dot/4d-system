// js/common.js (Firebase-backed helpers)

const KEYS = {
  ADMIN_SESSION: 'adminSession_v2',
  PLAYER_SESSION: 'playerSession_v2'
};

// Local helper (still used for sessions)
function saveJSONLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function readJSONLocal(key, def=null) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  catch { return def; }
}

// ---------- Firebase wrappers ----------
// expects global `db` from firebase.js
function fbOnce(path) {
  return db.ref(path).once('value').then(snap => snap.val());
}
function fbSet(path, value) {
  return db.ref(path).set(value);
}
function fbPush(path, value) {
  return db.ref(path).push(value);
}
function fbRemove(path) {
  return db.ref(path).remove();
}
function fbOn(path, cb) {
  return db.ref(path).on('value', snap => cb(snap.val()));
}
function fbOff(path) {
  db.ref(path).off();
}

// ---------- Users ----------
function getUserOnce(username) {
  return fbOnce(`users/${username}`).then(v => v || null);
}
function getAllUsersOnce() {
  return fbOnce('users').then(obj => {
    if (!obj) return [];
    return Object.values(obj);
  });
}
function watchAllUsers(cb) {
  fbOn('users', obj => cb(obj ? Object.values(obj) : []));
}
function saveUser(userObj) {
  // use username as key
  return fbSet(`users/${userObj.username}`, userObj);
}
function deleteUser(username) {
  return fbRemove(`users/${username}`);
}

// ---------- Prizes ----------
function getPrizesOnce() {
  return fbOnce('prizes').then(obj => obj ? Object.values(obj) : []);
}
function watchPrizes(cb) {
  fbOn('prizes', obj => cb(obj ? Object.values(obj) : []));
}
function savePrize(pr) {
  // save by code
  return fbSet(`prizes/${pr.code}`, pr);
}
function deletePrize(code) {
  return fbRemove(`prizes/${code}`);
}

// ---------- Winners ----------
function getWinnersOnce() {
  return fbOnce('winners').then(obj => obj ? Object.values(obj) : []);
}
function saveWinner(rec) {
  return fbPush('winners', rec);
}
function setLastWinner(rec) {
  return fbSet('lastWinner', rec);
}
function getLastWinnerOnce() {
  return fbOnce('lastWinner');
}
function watchLastWinner(cb) {
  fbOn('lastWinner', cb);
}

// ---------- History ----------
function getHistoryOnce() {
  return fbOnce('history').then(v => v || {});
}
function pushHistory(username, text) {
  const t = new Date().toLocaleString();
  const rec = { time: t, text };
  return fbPush(`history/${username}`, rec);
}
function getUserHistoryOnce(username) {
  return fbOnce(`history/${username}`).then(obj => obj ? Object.values(obj) : []);
}
function clearUserHistory(username) {
  return fbSet(`history/${username}`, null);
}

// ---------- Notify ----------
function setNotify(msg) {
  return fbSet('notify', { ts: Date.now(), msg });
}
function clearNotify() {
  return fbSet('notify', null);
}
function watchNotify(cb) {
  fbOn('notify', cb);
}
function getNotifyOnce() {
  return fbOnce('notify');
}

// ---------- Utilities ----------
function downloadCSV(filename, rows) {
  const csv = rows
    .map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

// ---------- Session helpers (still in localStorage) ----------
function saveAdminSession(data) { saveJSONLocal(KEYS.ADMIN_SESSION, data); }
function readAdminSession() { return readJSONLocal(KEYS.ADMIN_SESSION, null); }
function removeAdminSession() { localStorage.removeItem(KEYS.ADMIN_SESSION); }

function savePlayerSession(data) { saveJSONLocal(KEYS.PLAYER_SESSION, data); }
function readPlayerSession() { return readJSONLocal(KEYS.PLAYER_SESSION, null); }
function removePlayerSession() { localStorage.removeItem(KEYS.PLAYER_SESSION); }

// ---------- Ensure default admin exists ----------
function ensureAdminExists() {
  // create admin user if missing
  getUserOnce('admin').then(u => {
    if (!u) {
      const admin = {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        code: '',
        credit: 0,
        spinLink: '',
        luckyLink: '',
        eventLink: '',
        menu4img: ''
      };
      saveUser(admin).then(()=> console.log('Default admin created in Firebase'));
    }
  }).catch(e => console.error(e));
}

// Wait until db ready then ensure admin
function _waitDbAndEnsure() {
  if (typeof db === 'undefined') {
    setTimeout(_waitDbAndEnsure, 50);
    return;
  }
  ensureAdminExists();
}
_waitDbAndEnsure();
