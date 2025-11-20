//----------------------------------------------------
// PLAYER SESSION CHECK
//----------------------------------------------------
function ensurePlayerSession() {
  try {
    const s = JSON.parse(localStorage.getItem("playerSession"));
    if (!s || !s.username) {
      window.location.href = "login.html";
      return null;
    }
    return s;
  } catch (e) {
    console.error(e);
    window.location.href = "login.html";
    return null;
  }
}

let session = ensurePlayerSession();
if (!session) throw "No session";

let username = session.username;
let currentUser = null;     // loaded from Firebase


//----------------------------------------------------
// UI UPDATE
//----------------------------------------------------
function setWhoAndCredit(u) {
  document.getElementById("who").textContent = `ສະບາຍດີ, ${u.username}`;
  document.getElementById("creditShow").textContent = `ຍອດເສຍ: ${Number(u.credit).toLocaleString()}`;
}


//----------------------------------------------------
// NOTIFY SYSTEM (Realtime)
//----------------------------------------------------
function displayNotify(n) {
  const area = document.getElementById("notifyArea");

  if (!n) {
    area.innerHTML = "";
    return;
  }

  const time = new Date(n.ts).toLocaleString();

  area.innerHTML = `
    <div id="notifyBox" class="notify-box notify-blink notify-pulse">
      🔔 <b>${n.msg}</b>
      <div style="font-size:11px; opacity:0.6; margin-top:4px;">
        (${time})
      </div>
    </div>
  `;

  // mobile vibration
  if (navigator.vibrate) navigator.vibrate([120, 80, 120]);

  // stop blinking after 3s
  setTimeout(() => {
    const box = document.getElementById("notifyBox");
    if (box) box.classList.remove("notify-blink");
  }, 3000);
}


//----------------------------------------------------
// HISTORY
//----------------------------------------------------
async function renderHistory() {
  const box = document.getElementById("historyList");
  try {
    const snap = await db.ref("history/" + username).once("value");
    const list = snap.val() || [];
    if (list.length === 0) {
      box.innerHTML = `<div class="small muted">ຍັງບໍ່ມີປະຫວັດ</div>`;
      return;
    }

    box.innerHTML = list
      .slice()
      .reverse()
      .map(i => `<div style="padding:6px;background:#eef3ff;border-radius:8px;margin-bottom:6px">${i.time} — ${i.text}</div>`)
      .join('');
  } catch (e) {
    console.error(e);
  }
}


//----------------------------------------------------
// PUSH HISTORY
//----------------------------------------------------
function pushHistory(u, text) {
  const item = {
    time: new Date().toLocaleString(),
    text: text
  };
  return db.ref("history/" + u).push(item);
}


//----------------------------------------------------
// LOGOUT
//----------------------------------------------------
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("playerSession");
  window.location.href = "login.html";
});


//----------------------------------------------------
// MAIN REALTIME LISTENERS
//----------------------------------------------------
function startListeners() {
  // watch user
  db.ref("users/" + username).on("value", snap => {
    const u = snap.val();
    if (!u) {
      alert("ຜູ້ໃຊ້ຖືກລຶບ ຫຼືບໍ່ມີຢູ່");
      localStorage.removeItem("playerSession");
      window.location.href = "login.html";
      return;
    }
    currentUser = u;
    setWhoAndCredit(u);
    renderHistory();
  });

  // watch notify
  db.ref("notify").on("value", snap => {
    displayNotify(snap.val());
  });
}

startListeners();


//----------------------------------------------------
// OPEN MENU — FIX FOR IPHONE SAFARI
//----------------------------------------------------
window.openMenu = function(m) {

  //--------------------------------------------
  // MENU 2 — SPIN (iPhone must open instantly)
  //--------------------------------------------
  if (m === 2 && currentUser && currentUser.spinLink) {
    window.open(currentUser.spinLink, "_blank");    // SAFE for iPhone
    pushHistory(username, "ກົດເປີດ Spin");
    return;
  }

  //--------------------------------------------
  // MENU 3 — LUCKY BOX
  //--------------------------------------------
  if (m === 3 && currentUser && currentUser.luckyLink) {
    window.open(currentUser.luckyLink, "_blank");
    pushHistory(username, "ກົດເປີດ Lucky Box");
    return;
  }

  //--------------------------------------------
  // MENU 5 / 6 — EVENT LINK
  //--------------------------------------------
  if ((m === 5 || m === 6) && currentUser && currentUser.eventLink) {
    window.open(currentUser.eventLink, "_blank");
    pushHistory(username, "ເປີດ Event");
    return;
  }

  //--------------------------------------------
  // OTHER MENUS (SHOW POPUP)
  //--------------------------------------------
  const popup = document.getElementById("popup");
  const title = document.getElementById("popupTitle");
  const body = document.getElementById("popupBody");

  const desc = {
    1: "ຄືນຍອດ 5%",
    4: "ເບິ່ງຮູບໂປຣເຈກ",
    5: "ກຳລັງມາໄວໆນີ້",
    6: "ກຳລັງມາໄວໆນີ້"
  };

  title.textContent = `ເມນູ ${m}`;
  body.textContent = desc[m] || "ບໍ່ມີຂໍ້ມູນ";
  popup.style.display = "flex";

  // History
  pushHistory(username, `ເຂົ້າເມນູ ${m}`);
};


//----------------------------------------------------
// POPUP CLOSE
//----------------------------------------------------
document.getElementById("popupClose").addEventListener("click", () => {
  document.getElementById("popup").style.display = "none";
});
