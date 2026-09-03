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
        let user;
        try {
          // Secure path: Firebase Authentication verifies the password before
          // database rules allow access to this player's profile.
          const credential = await firebase.auth().signInWithEmailAndPassword(
            playerAuthEmail(username),
            playerAuthPassword(password)
          );
          // Most customers enter the username with its original casing. Read
          // that secured profile directly and avoid an extra database roundtrip.
          try {
            user = await getUserOnce(username);
          } catch (directReadError) {
            user = null;
          }
          if (!user || user.authUid !== credential.user.uid) {
            const account = await fbOnce(`playerAccounts/${credential.user.uid}`);
            if (!account || !account.username) throw new Error('player-profile-not-found');
            user = await getUserOnce(account.username);
          }
        } catch (error) {
          // Temporary compatibility path while the administrator is migrating
          // existing accounts. It stops working automatically after final
          // private database rules are published.
          try {
            await firebase.auth().signOut();
            user = await getUserCaseInsensitive(username);
            if (!user || String(user.password) !== String(password)) {
              alert("username หรือ password ผิด");
              return;
            }
          } catch (fallbackError) {
            console.error('Player sign-in failed:', error, fallbackError);
            alert('username หรือ password ผิด หรือไม่สามารถเชื่อมต่อระบบได้');
            return;
          }
        } finally {
          btn.disabled = false;
        }
        if (!user) {
          alert("username หรือ password ผิด (ไม่พบผู้ใช้)");
          return;
        }

        if (user.role !== "admin" && user.active === false) {
          alert("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อแอดมิน");
          return;
        }
  
        if (user.role === "admin") {
          alert("กรุณาเข้าสู่ระบบแอดมินด้วยอีเมลที่หน้า Admin");
          return;
        } else {
          savePlayerSession({
            username: user.username,
            ts: Date.now(),
            cachedUser: {
              username: user.username,
              credit: user.credit || 0,
              spinLink: user.spinLink || '',
              luckyLink: user.luckyLink || '',
              eventLink: user.eventLink || '',
              active: user.active !== false
            }
          });
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
