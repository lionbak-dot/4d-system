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

  // Player Firebase Authentication credentials are derived consistently from
  // the existing username/password so customers can keep their current login.
  function playerAuthEmail(username) {
    const normalized = String(username || '').trim().toLocaleLowerCase();
    const bytes = new TextEncoder().encode(normalized);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `p.${encoded}@players.4d-system.app`;
  }

  function playerAuthPassword(password) {
    return `L7!${String(password == null ? '' : password)}`;
  }
  
  // ---------- Users ----------
  function getUserOnce(username) {
    return fbOnce(`users/${username}`).then(v => v || null);
  }
  async function getUserCaseInsensitive(username) {
    const exact = await getUserOnce(username);
    if (exact) return exact;

    const wanted = String(username).toLocaleLowerCase();
    const users = await getAllUsersOnce();
    return users.find(user =>
      user && String(user.username || '').toLocaleLowerCase() === wanted
    ) || null;
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
  function setUserActive(username, active) {
    return fbSet(`users/${username}/active`, Boolean(active));
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

  // ---------- Promotion visibility ----------
  function setPromotionEnabled(menu, enabled) {
    return fbSet(`promotionVisibility/${menu}`, Boolean(enabled));
  }
  function watchPromotionVisibility(cb) {
    fbOn('promotionVisibility', value => cb(value || {}));
  }

  // ---------- Site images ----------
  function setSiteImage(slot, imageData) {
    return fbSet(`siteImages/${slot}`, imageData);
  }
  function watchSiteImages(cb) {
    fbOn('siteImages', value => cb(value || {}));
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

  function formatOneDecimal(n) {
    return Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  function calculateFivePercent(value) {
    return Number((Number(value || 0) * 0.05).toFixed(1));
  }
  
  // ---------- Session helpers (still in localStorage) ----------
  function saveAdminSession(data) { saveJSONLocal(KEYS.ADMIN_SESSION, data); }
  function readAdminSession() { return readJSONLocal(KEYS.ADMIN_SESSION, null); }
  function removeAdminSession() { localStorage.removeItem(KEYS.ADMIN_SESSION); }
  
  function savePlayerSession(data) { saveJSONLocal(KEYS.PLAYER_SESSION, data); }
  function readPlayerSession() { return readJSONLocal(KEYS.PLAYER_SESSION, null); }
  function removePlayerSession() { localStorage.removeItem(KEYS.PLAYER_SESSION); }
  
  
  
