// js/login.js (Firebase-backed)
(function(){
  function _ready() {
    const demoBtn = document.getElementById("demoCreate");
    if (demoBtn) {
      demoBtn.addEventListener("click", async () => {
        const demo = {
          username: "player01",
          password: "p1234",
          role: "player",
          code: "A001",
          credit: 200000,
          spinLink: "",
          luckyLink: "",
          eventLink: "",
          menu4img: ""
        };
        const exists = await getUserOnce(demo.username);
        if (!exists) {
          await saveUser(demo);
          alert("สร้าง player01 / p1234 สำเร็จ (Firebase)");
        } else {
          alert("player01 มีอยู่แล้ว");
        }
      });
    }

    const btn = document.getElementById("loginBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("กรอก username และ password");
        return;
      }

      const user = await getUserOnce(username);
      if (!user) {
        alert("username หรือ password ผิด (ไม่พบผู้ใช้)");
        return;
      }
      if (user.password !== password) {
        alert("รหัสผ่านไม่ถูกต้อง");
        return;
      }

      if (user.role === "admin") {
        saveAdminSession({ username: user.username, ts: Date.now() });
        window.location.href = "admin.html";
      } else {
        savePlayerSession({ username: user.username, ts: Date.now() });
        window.location.href = "player.html";
      }
    });
  }

  // wait for db available (common.js ensures admin exist)
  function waitReady() {
    if (typeof db === 'undefined') { setTimeout(waitReady, 50); return; }
    _ready();
  }
  waitReady();
})();
