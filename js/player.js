// js/player.js (Firebase-backed)

function ensurePlayerSession() {
  const session = readPlayerSession();
  if (!session || !session.username) {
    alert("โปรดล็อกอินก่อน");
    window.location.href = "login.html";
    return null;
  }
  return session;
}

let session = ensurePlayerSession();
if (!session) throw "no session";

let username = session.username;
let currentUser = null;

function onUserUpdate(u) {
  if (!u) {
    alert("ไม่พบผู้ใช้ (บัญชีโดนลบหรือแก้ไข)");
    window.location.href = "login.html";
    return;
  }
  currentUser = u;
  document.getElementById("who").textContent = `ສະບາຍດີ, ${u.username}`;
  document.getElementById("creditShow").textContent = `ຍອດເສຍ: ${formatNumber(u.credit)}`;
  renderHistory();
}

// watch user node realtime
function startPlayerListeners() {
  // watch single user
  db.ref(`users/${username}`).on('value', snap => {
    const u = snap.val();
    onUserUpdate(u);
  });
  // notify watcher
  watchNotify(n => {
    displayNotify(n);
  });
  // history and other changes handled via onUserUpdate + functions
  // also watch lastWinner if needed
  watchLastWinner(lw => {
    // optionally show last winner banner to player
    console.log('lastWinner', lw);
  });
}

function displayNotify(n) {
  const area = document.getElementById("notifyArea");
  if (!n) { area.innerHTML = ""; return; }
  area.innerHTML = `
    <div style="border-radius:8px;padding:10px;background:linear-gradient(90deg,#e6f0ff,transparent);color:#031026">
      ${n.msg}
      <span class="small muted">(admin @ ${new Date(n.ts).toLocaleString()})</span>
    </div>
  `;
}

// History functions (read from Firebase)
async function renderHistory() {
  const list = await getUserHistoryOnce(username);
  const box = document.getElementById("historyList");
  box.innerHTML = list.length
    ? list.slice().reverse().map(i => `<div style="padding:8px;border-radius:8px;background:#f3f6fd;margin-bottom:6px">${i.time} ${i.text || i}</div>`).join('')
    : `<div class="muted">ยังไม่มีประวัติ</div>`;
}

function pushLocalHistory(text) {
  return pushHistory(username, text);
}

// menu actions (use currentUser)
function openMenu(m) {
  window.openMenu && window.openMenu(m); // existing UI popup code calls openMenu
}

// logout
document.getElementById("logout").addEventListener("click", () => {
  removePlayerSession();
  window.location.href = "login.html";
});

// popup close -> when used, do menu actions (reuse existing popup handlers)
document.getElementById("popupClose").addEventListener("click", () => {
  document.getElementById("popup").style.display = "none";
  // previous code expects doMenuAction to be called; keep that binding
});

// connect UI functions used by existing player.js code
window.pushHistory = function(userName, text) { return pushHistory(userName, text); };
window.refreshUser = function() {
  // manual refresh, but we listen realtime so normally not needed
  if (currentUser) {
    document.getElementById("creditShow").textContent = `ຍອດເສຍ: ${formatNumber(currentUser.credit)}`;
    renderHistory();
  }
};

// start listeners when db ready
function waitStart() {
  if (typeof db === 'undefined') { setTimeout(waitStart, 50); return; }
  startPlayerListeners();
}
waitStart();
