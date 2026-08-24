// js/admin.js (Firebase-backed)

const AUTHORIZED_ADMIN_UID = 'X14VGAI35NNtBYIJKRYTb8OVCMQ2';
let adminListenersStarted = false;

function showAdminArea(username) {
    document.getElementById("adminArea").style.display = "block";
    document.getElementById("loginGuard").style.display = "none";
    document.getElementById("adminInfo").textContent = `Logged as ${username}`;
  }
  
  function guardAdmin() {
    firebase.auth().onAuthStateChanged(async user => {
      if (!user || user.uid !== AUTHORIZED_ADMIN_UID) {
        if (user) await firebase.auth().signOut();
      document.getElementById("adminArea").style.display = "none";
      document.getElementById("loginGuard").style.display = "block";
        return;
      }

      showAdminArea(user.email || 'Admin');
      if (!adminListenersStarted) {
        adminListenersStarted = true;
        startAdminListeners();
      }
    });
  }
  
  // Admin login (replace previous localStorage-based flow)
  document.getElementById('doAdminLogin').addEventListener('click', async () => {
    const email = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;
  
    if (!email || !pass) { alert('กรอกอีเมลและรหัสผ่าน'); return; }
  
    try {
      const credential = await firebase.auth().signInWithEmailAndPassword(email, pass);
      if (!credential.user || credential.user.uid !== AUTHORIZED_ADMIN_UID) {
        await firebase.auth().signOut();
        alert('บัญชีนี้ไม่ได้รับสิทธิ์แอดมิน');
      }
    } catch (error) {
      console.error('Admin sign-in failed:', error.code || error);
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  });

  document.getElementById('adminPass').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') document.getElementById('doAdminLogin').click();
  });
  
  // logout
  document.getElementById('logoutAdmin').addEventListener('click', async () => {
    await firebase.auth().signOut();
    location.reload();
  });
  
  // create/update user (handle image upload to base64 in client)
  document.getElementById('createUser').addEventListener('click', async () => {
    const u = document.getElementById("u_name").value.trim();
    const p = document.getElementById("u_pass").value;
    if (!u || !p) { alert("กรอก username และ password"); return; }
  
    const code = document.getElementById("u_code").value.trim();
    const credit = Number(document.getElementById("u_credit").value) || 0;
    const spinLink = document.getElementById("u_spinLink").value.trim();
    const boxLink = document.getElementById("u_boxLink").value.trim();
    const eventLink = document.getElementById("u_eventLink").value.trim();
    const imgFile = document.getElementById("u_img").files[0];
  
    async function doSave(imgData) {
      const existingUser = await getUserOnce(u);
      const userObj = {
        username: u,
        password: p,
        role: "player",
        code,
        credit,
        spinLink,
        luckyLink: boxLink,
        eventLink,
        menu4img: imgData || (existingUser && existingUser.menu4img) || "",
        active: existingUser ? existingUser.active !== false : true
      };
      saveUser(userObj).then(()=> {
        alert("บันทึกสำเร็จ");
        // clear inputs optionally
        renderUsersTableCached(); // refresh UI quickly (listeners also update)
      }).catch(e => {
        console.error(e); alert("บันทึกล้มเหลว");
      });
    }
  
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = () => doSave(reader.result);
      reader.readAsDataURL(imgFile);
    } else {
      doSave('');
    }
  });
  
  // prize add
  document.getElementById('addPrize').addEventListener('click', async () => {
    const code = document.getElementById("pr_code").value.trim();
    const label = document.getElementById("pr_label").value.trim();
    const amt = Number(document.getElementById("pr_amount").value) || 0;
    if (!code || !label) { alert("กรอกข้อมูลรางวัล"); return; }
  
    const existing = await fbOnce(`prizes/${code}`);
    if (existing) { alert("รหัสซ้ำ"); return; }
    await savePrize({ code, label, amount: amt });
    document.getElementById("pr_code").value = "";
    document.getElementById("pr_label").value = "";
    document.getElementById("pr_amount").value = "";
  });
  
  // draw winner
  document.getElementById("drawBtn").addEventListener("click", async () => {
    const prizeCode = document.getElementById("prizeSelect").value;
    if (!prizeCode) { alert("ไม่มีรางวัล"); return; }
  
    const prizeObj = await fbOnce(`prizes/${prizeCode}`);
    const usersObj = await fbOnce('users');
    const players = usersObj ? Object.values(usersObj).filter(u => u.role === 'player') : [];
  
    if (!players.length) { alert("ยังไม่มีผู้เล่น"); return; }
    const idx = Math.floor(Math.random() * players.length);
    const winner = players[idx];
  
    const rec = {
      time: new Date().toLocaleString(),
      username: winner.username,
      userCode: winner.code || "",
      prizeCode: prizeObj.code,
      prizeLabel: prizeObj.label,
      prizeAmount: prizeObj.amount || 0
    };
  
    await saveWinner(rec);
    await setLastWinner(rec);
    await pushHistory(winner.username, `DRAW → ${rec.prizeLabel}`);
    alert(`ผู้ชนะ: ${winner.username} ได้ ${rec.prizeLabel}`);
  });
  
  // notify players
  document.getElementById("notifyPlayers").addEventListener("click", async () => {
    const msg = prompt("ข้อความแจ้งเตือนถึงผู้เล่น:", "มีรางวัลใหม่!");
    if (!msg) return;
    await setNotify(msg);
    alert("ส่งแจ้งเตือนแล้ว");
  });
  
  // export CSV
  document.getElementById("exportCSV").addEventListener("click", async () => {
    const winners = await getWinnersOnce();
    const rows = [["time","username","userCode","prizeCode","prizeLabel","prizeAmount"]];
    winners.forEach(w => rows.push([w.time, w.username, w.userCode || "", w.prizeCode, w.prizeLabel, w.prizeAmount || ""]));
    downloadCSV("winners.csv", rows);
  });
  
  // history view / clear user history
  document.getElementById("viewHist").addEventListener("click", async () => {
    const user = document.getElementById("histUser").value;
    const list = await getUserHistoryOnce(user);
    const box = document.getElementById("histList");
    box.innerHTML = list.length ? list.map(i => `<div style="padding:8px;border-radius:8px;background:#f3f6fd;margin-bottom:6px">${i.time} ${i.text || i}</div>`).join('') : `<div class="muted">ไม่มีประวัติ</div>`;
  });
  document.getElementById("clearHistUser").addEventListener("click", async () => {
    const user = document.getElementById("histUser").value;
    if (!confirm("ลบประวัติผู้ใช้?")) return;
    await clearUserHistory(user);
    document.getElementById("histList").innerHTML = "";
    alert("ลบแล้ว");
  });
  
  // ---------- Rendering helpers (use cached values from listeners) ----------
  let cachedUsers = [];
  let cachedPrizes = [];
  let cachedPromotionVisibility = {};

  function isPromotionEnabled(menu) {
    return cachedPromotionVisibility[String(menu)] !== false;
  }

  function renderPromotionControls() {
    document.querySelectorAll('.promoToggle').forEach(button => {
      const enabled = isPromotionEnabled(button.dataset.menu);
      button.style.background = enabled ? '#188038' : '#d93025';
      button.style.color = '#fff';
      button.textContent = `${button.textContent.replace(/\s•\s(ເປີດ|ປິດ)$/, '')} • ${enabled ? 'ເປີດ' : 'ປິດ'}`;
    });
  }

  document.querySelectorAll('.promoToggle').forEach(button => {
    button.addEventListener('click', async () => {
      const menu = button.dataset.menu;
      button.disabled = true;
      try {
        await setPromotionEnabled(menu, !isPromotionEnabled(menu));
      } catch (error) {
        console.error(error);
        alert('ไม่สามารถบันทึกสถานะโปรโมชั่นได้');
      } finally {
        button.disabled = false;
      }
    });
  });
  
  function renderUsersTableCached() {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    (cachedUsers || []).forEach((usr) => {
      if (usr.role === "admin") return;
      const credit = Number(usr.credit || 0);
      const fivePercent = calculateFivePercent(usr.credit);
      const creditColor = credit < 0 ? '#ff0000' : 'inherit';
      const fivePercentColor = fivePercent < 0 ? '#ff0000' : 'inherit';
      const isActive = usr.active !== false;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${usr.username}</td>
        <td>${usr.code || ""}</td>
        <td style="color:${creditColor}">${formatOneDecimal(credit)}</td>
        <td style="font-weight:700;color:${fivePercentColor};background:#a9d18e">${formatOneDecimal(fivePercent)}</td>
        <td style="font-weight:700;color:${isActive ? '#188038' : '#d93025'}">${isActive ? 'ເປີດໃຊ້' : 'ຢຸດໃຊ້'}</td>
        <td>${usr.menu4img ? `<img class="thumb" src="${usr.menu4img}">` : "-"}</td>
        <td>spin:${usr.spinLink ? "yes" : ""} box:${usr.luckyLink ? "yes" : ""}</td>
        <td>
          <button class="btn btn-ghost editUser" data-username="${usr.username}">Edit</button>
          <button class="btn ${isActive ? 'btn-danger' : 'btn-primary'} toggleUser" data-username="${usr.username}" data-active="${isActive}">${isActive ? 'ຢຸດໃຊ້' : 'ເປີດໃຊ້'}</button>
          <button class="btn btn-danger delUser" data-username="${usr.username}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  
    document.querySelectorAll(".delUser").forEach(btn => {
      btn.onclick = async () => {
        const username = btn.dataset.username;
        if (!confirm("ลบผู้เล่น?")) return;
        await deleteUser(username);
        // listeners will update UI
      };
    });
  
    document.querySelectorAll(".editUser").forEach(btn => {
      btn.onclick = async () => {
        const username = btn.dataset.username;
        const u = await getUserOnce(username);
        if (!u) return alert('ไม่พบผู้ใช้');
        document.getElementById("u_name").value = u.username;
        document.getElementById("u_pass").value = u.password;
        document.getElementById("u_code").value = u.code || "";
        document.getElementById("u_credit").value = u.credit || 0;
        document.getElementById("u_spinLink").value = u.spinLink || "";
        document.getElementById("u_boxLink").value = u.luckyLink || "";
        document.getElementById("u_eventLink").value = u.eventLink || "";
        alert('แก้ไขค่าแล้วกด "สร้าง/อัปเดต" เพื่อบันทึก');
      };
    });

    document.querySelectorAll('.toggleUser').forEach(btn => {
      btn.onclick = async () => {
        const username = btn.dataset.username;
        const currentlyActive = btn.dataset.active === 'true';
        const action = currentlyActive ? 'ຢຸດໃຊ້' : 'ເປີດໃຊ້';
        if (!confirm(`${action} ${username}?`)) return;
        btn.disabled = true;
        try {
          await setUserActive(username, !currentlyActive);
        } catch (error) {
          console.error(error);
          alert('ไม่สามารถเปลี่ยนสถานะผู้เล่นได้');
          btn.disabled = false;
        }
      };
    });
  
    // update history user select
    const sel = document.getElementById("histUser");
    sel.innerHTML = "";
    (cachedUsers || []).forEach(u => {
      if (u.role === "player") {
        const o = document.createElement("option");
        o.value = u.username; o.textContent = u.username;
        sel.appendChild(o);
      }
    });
  }
  
  function renderPrizesCached() {
    const tbody = document.querySelector("#prizeTable tbody");
    tbody.innerHTML = "";
    (cachedPrizes || []).forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.code}</td><td>${p.label}</td><td>${p.amount}</td><td><button class="btn btn-danger delPrize" data-code="${p.code}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
  
    document.querySelectorAll(".delPrize").forEach(btn => {
      btn.onclick = async () => {
        const code = btn.dataset.code;
        if (!confirm("ลบรางวัล?")) return;
        await deletePrize(code);
      };
    });
  
    // prize select
    const sel = document.getElementById("prizeSelect");
    sel.innerHTML = "";
    (cachedPrizes || []).forEach(p => {
      const o = document.createElement("option");
      o.value = p.code; o.textContent = `${p.label} (${p.code})`;
      sel.appendChild(o);
    });
  }
  
  // Start realtime listeners
  function startAdminListeners() {
    // users
    watchAllUsers(users => {
      cachedUsers = users;
      renderUsersTableCached();
    });
    // prizes
    watchPrizes(prs => {
      cachedPrizes = prs;
      renderPrizesCached();
    });
    // notify
    watchNotify(n => {
      // show small toast? left for admin
      console.log('notify changed', n);
    });
    // last winner watcher
    watchLastWinner(lw => {
      document.getElementById("lastWinner").textContent = lw ? `${lw.time} • ${lw.username} ได้ ${lw.prizeLabel}` : "-";
    });

    watchPromotionVisibility(value => {
      cachedPromotionVisibility = value;
      renderPromotionControls();
    });
  }
  
  // on load
  (function initAdmin() {
    guardAdmin();
  })();
