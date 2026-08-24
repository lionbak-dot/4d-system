// js/player.js (Firebase-backed, full-featured for menus & links)

// --- session check (stored locally by login process) ---
function ensurePlayerSession() {
    try {
      const s = readPlayerSession(); // from common.js (localStorage session)
      if (!s || !s.username) {
        alert("โปรดล็อกอินก่อน");
        window.location.href = "login.html";
        return null;
      }
      return s;
    } catch (e) {
      console.error(e);
      alert("โปรดล็อกอินก่อน");
      window.location.href = "login.html";
      return null;
    }
  }
  
  let session = ensurePlayerSession();
  if (!session) throw "no player session";
  let username = session.username;
  let currentUser = null; // will hold live user object from Firebase
  
  // --- UI helpers ---
  function setWhoAndCredit(u) {
    if (!u) return;
    const whoEl = document.getElementById("who");
    const creditEl = document.getElementById("creditShow");
    if (whoEl) whoEl.textContent = `ສະບາຍດີ, ${u.username}`;
    if (creditEl) creditEl.textContent = `ຍອດເສຍ: ${formatNumber(u.credit)}`;
  }
  
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
        <div class="small muted">(${time})</div>
      </div>
    `;
  
    // 📱 ทำให้เครื่องสั่น (มือถือ)
    if (navigator.vibrate) {
      navigator.vibrate([120, 80, 120]);
    }
  
    // ปิดกระพริบหลัง 3 วินาที (แต่ข้อความยังอยู่)
    setTimeout(() => {
      const box = document.getElementById("notifyBox");
      if (box) {
        box.classList.remove("notify-blink");
      }
    }, 3000);
  }
  
  
  // --- history rendering (reads user history from Firebase) ---
  async function renderHistory() {
    const box = document.getElementById("historyList");
    if (!box) return;
    try {
      const list = await getUserHistoryOnce(username); // from common.js
      box.innerHTML = list.length
        ? list.slice().reverse().map(i => `<div style="padding:8px;border-radius:8px;background:#f3f6fd;margin-bottom:6px">${i.time} ${i.text || i}</div>`).join('')
        : `<div class="muted">ยังไม่มีประวัติ</div>`;
    } catch (e) {
      console.error(e);
      box.innerHTML = `<div class="muted">ไม่สามารถอ่านประวัติ</div>`;
    }
  }
  
  function openLink(url) {
    if (!url) return;

    let target = String(url).trim();
    if (!/^[a-z][a-z0-9+.-]*:/i.test(target)) {
      target = `https://${target}`;
    }

    // Same-tab navigation is reliable on iPhone Safari even after an async
    // Firebase/history operation; opening a new tab here may be blocked.
    window.location.assign(target);
  }

  
  // --- CORE: menu handling ---
  // pendingMenu used to remember which menu the user opened while popup is shown
  let pendingMenu = null;
  
  window.openMenu = function (m) {
    // m expected 1..6
    pendingMenu = m;
    const popup = document.getElementById("popup");
    const title = document.getElementById("popupTitle");
    const body = document.getElementById("popupBody");
    if (!popup || !title || !body) return;
  
    title.textContent = `ເມນູ ${m}`;
    // short descriptions (you can customize)
    const RULES = {
      1: "📘 ຄືນຍອດ 5% 1.ທາງເຮົາຈະກຳນົດເອົາຍອດເສຍ ຕາມໂມງ ເວລາ ປິດເເລະເປີດໂຊນ ຂອງທຸກວັນຈັນ 2.ຍອດເສຍ ສາມາດນຳປັນເງີນສົດ ເເລະ ເປັນເຄດິດໃດ້ 3.ສຳລັບ ຢູ່ເຊີ້ທີ່ເປີດເປັນ ຢູ່ເຊີຖາວອນເທົ່ານັ້ນ 4.ກໍລະນີກວດພົບເຫັນ ການເຄື່ອນໄຫວຜິດປົກກະຕິ ຫຼືການໂກງຫູືບໍ່ເປັນໄປຕາມກະຕິກາດ້ານເທີງ ຖືກກວດພົບ, ຫຼັງຈາກນັ້ນຍອດເງິນທັງຫມົດໃນບັນຊີ Lion777 ແມ່ນມີສິດຖືກຖອນຄືນ. ທຸກຍອດເງິນຝາກ ແລະເງິນທີ່ຊະນະໃນ ID ນັ້ນ",
      2: "📘 Free Spin 1.ສຳລັບຢູ່ເຊີ້ປະຈຳ ຫລື ຢູ່ເຊີ້ທີ່ເປີດເປັນ ຢູ່ເຊີຖາວອນເທົ່ານັ້ນ  2.ລາງວັນ ສາມາດນຳເປັນເງີນສົດ ເເລະ ເປັນເຄດິດໃດ້   3.ກໍລະນີກວດພົບເຫັນ ການເຄື່ອນໄຫວຜິດປົກກະຕິ ຫຼືການໂກງຫູືບໍ່ເປັນໄປຕາມກະຕິກາດ້ານເທີງ ຖືກກວດພົບ, ຫຼັງຈາກນັ້ນຍອດເງິນທັງຫມົດໃນບັນຊີ Lion777 ແມ່ນມີສິດຖືກຖອນຄືນ. ທຸກຍອດເງິນຝາກ ແລະເງິນທີ່ຊະນະໃນ ID ນັ້ນ",
      3: "📘 Lucky Box",
      4: "📘 รูปจากแอดมิน 1.ເຕີມຄົບ200ບາດ ຈະໄດ້1ລະຫັດ ເເຮງມີລະຫັດຫຼາຍເເຮງມີໂອກາດໄດ້ລາງວັນ 2.ລະຫັດນີ້ເຮົາຈະນຳໄປເເລ່ນດ້ອມຫາ ຜູ້ໂຊກດີ ລາງວັນ ລົດຈັກໄຟຟ້າ 2ຄັນ ເເລະເງີນສົດອີກຈຳນວນ 19ລາງວັນ ລວມມູ່ນຄ່າ 35ລ້ານກີບ 3.ຄົນຕໍ່1ລາງວັນ 4.ກໍລະນີກວດພົບເຫັນ ການເຄື່ອນໄຫວຜິດປົກກະຕິ ຫຼືການໂກງຫູືບໍ່ເປັນໄປຕາມກະຕິກາດ້ານເທີງ ຖືກກວດພົບ, ຫຼັງຈາກນັ້ນຍອດເງິນທັງຫມົດໃນບັນຊີ Lion777 ແມ່ນມີສິດຖືກຖອນຄືນ. ທຸກຍອດເງິນຝາກ ແລະເງິນທີ່ຊະນະໃນ ID ນັ້ນ",
      5: "📘 Coming Soon",
      6: "📘 Coming Soon"
    };
    body.textContent = RULES[m] || "ไม่มีข้อมูลกติกา";
    popup.style.display = "flex";
  };
  
  // When popup closed we actually perform the action (this mimics previous behavior)
  document.getElementById("popupClose")?.addEventListener("click", async () => {
    const popup = document.getElementById("popup");
    if (popup) popup.style.display = "none";
  
    if (!pendingMenu) return;
    await doMenuAction(pendingMenu);
    pendingMenu = null;
  });
  
  // do the actual action for a menu number
  async function doMenuAction(m) {
    // ensure we have fresh user
    try {
      const snap = await getUserOnce(username);
      if (!snap) {
        alert("ไม่พบผู้ใช้ (อาจโดนลบหรือแก้ไข)");
        window.location.href = "login.html";
        return;
      }
      currentUser = snap;
      setWhoAndCredit(currentUser);
    } catch (e) {
      console.error(e);
    }
  
    // MENU 1 — คืนยอด 5%
    if (m === 1) {
      const credit = Number(currentUser.credit || 0);
      // Preserve the credit sign and round 5% to one decimal place.
      // Examples: -149.9 -> -7.5, 701.3 -> 35.1.
      const refund = calculateFivePercent(credit);
      // show immediate popup (reuse popup)
      const popup = document.getElementById("popup");
      const title = document.getElementById("popupTitle");
      const body = document.getElementById("popupBody");
      title.textContent = "ເມນູ 1 • ຄືນຍອດ 5%  ";
      body.innerHTML = `ຍອດເສຍ: ${formatNumber(credit)}<br>5% = ${formatNumber(refund)}`;
      if (popup) popup.style.display = "flex";
      await pushHistory(username, `ເມນູ 1 • ຄືນຍອດ ${formatNumber(refund)}`);
      return;
    }
  
    // MENU 2 — Spin
    if (m === 2) {
      await pushHistory(username, `ເມນູ 2 • ເປີດ Spin ສະບາຍດີ`);
      if (currentUser.spinLink) {
        openLink(currentUser.spinLink);
      } else {
        alert("ยังไม่มีลิงก์ Spin");
      }
      return;
    }
  
    // MENU 3 — Lucky Box
    if (m === 3) {
      await pushHistory(username, `ເມນູ 3 • Lucky Box`);
      if (currentUser.luckyLink) {
        openLink(currentUser.luckyLink);
      } else {
        alert("ยังไม่มีลิงก์ Lucky Box");
      }
      return;
    }
  
    // MENU 4 — Show Image
    if (m === 4) {
      await pushHistory(username, `ເມນູ 4 • ເບິ່ງຮູບ `);
      if (currentUser.menu4img) {
        const popup = document.getElementById("popup");
        const title = document.getElementById("popupTitle");
        const body = document.getElementById("popupBody");
        title.textContent = "ຮູບຈາກແອດມິນ ";
        body.innerHTML = `
          <img src="${currentUser.menu4img}" style="max-width:100%;border-radius:8px">
          <br>
          <a download="${currentUser.username}_menu4.png" href="${currentUser.menu4img}">
            <button class="btn btn-ghost" style="margin-top:8px">⬇ ดาวน์โหลด</button>
          </a>
        `;
        popup.style.display = "flex";
      } else {
        alert("ยังไม่มีรูปภาพกำหนดโดยแอดมิน");
      }
      return;
    }
  
    // MENU 5 & 6 — Placeholder actions (could open event link or show coming soon)
    if (m === 5 || m === 6) {
      await pushHistory(username, `ເມນູ ${m} • ໄວໆນີ້`);
      // if admin provided eventLink, open it; otherwise show coming soon
      if (currentUser.eventLink) {
        openLink(currentUser.eventLink);
      } else {
        alert("Coming soon");
      }
      return;
    }
  }
  
  // --- start listeners: watch user data & notifications live ---
  function startPlayerListeners() {
    // watch this user's node (realtime)
    db.ref(`users/${username}`).on('value', snap => {
      const u = snap.val();
      if (!u) {
        alert("บัญชีถูกลบหรือไม่พบผู้ใช้");
        window.location.href = "login.html";
        return;
      }
      currentUser = u;
      setWhoAndCredit(u);
      renderHistory();
    });
  
    // watch notify node
    watchNotify(n => displayNotify(n));
  
    // watch lastWinner if you want to show a banner or special UI action
    watchLastWinner(lw => {
      // optional: show toast or banner
      // console.log("lastWinner updated", lw);
    });
  }
  
  function logoutPlayer() {
    removePlayerSession();
    window.location.href = "login.html";
  }
  
  // bind logout button
  document.getElementById("logout")?.addEventListener("click", logoutPlayer);
  
  // start listeners when db exists
  function waitForDbAndStart() {
    if (typeof db === 'undefined') {
      setTimeout(waitForDbAndStart, 50);
      return;
    }
    startPlayerListeners();
  }
  waitForDbAndStart();
  
  
  
  
  
  
  
  
  
