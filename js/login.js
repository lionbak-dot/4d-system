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
  
        btn.disabled = true;
        try {
          // Secure path: Firebase Authentication verifies the password before
          // database rules allow access to this player's profile.
          const credential = await firebase.auth().signInWithEmailAndPassword(
            playerAuthEmail(username),
            playerAuthPassword(password)
          );
          // Authentication is the only request that must finish on this page.
          // The secured profile is loaded on player.html so navigation feels
          // immediate even on a high-latency mobile connection.
          savePlayerSession({ username, authUid: credential.user.uid, ts: Date.now() });
          window.location.replace("player.html");
          return;
        } catch (error) {
          console.error('Player sign-in failed:', error);
          alert('username หรือ password ผิด หรือไม่สามารถเชื่อมต่อระบบได้');
          return;
        } finally {
          btn.disabled = false;
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
