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
  
        let user;
        try {
          user = await getUserCaseInsensitive(username);
        } catch (error) {
          console.error('Unable to read user account:', error);
          alert('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
          return;
        }
        if (!user) {
          alert("username หรือ password ผิด (ไม่พบผู้ใช้)");
          return;
        }
        if (String(user.password) !== String(password)) {
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

      document.getElementById("password").addEventListener("keydown", (event) => {
        if (event.key === "Enter") btn.click();
      });
    }
  
    // wait for db available (common.js ensures admin exist)
    function waitReady() {
      if (typeof db === 'undefined') { setTimeout(waitReady, 50); return; }
      _ready();
    }
    waitReady();
  })();
