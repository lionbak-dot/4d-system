// js/firebase.js
// โหลดสคริปต์ compat แบบ dynamic (ต้องใส่ <script src="js/firebase.js"></script> ใน HTML ก่อน common.js)
(function(){
    // Inject compat libs (synchronous enough for small apps; ensures firebase global exists)
    document.write('<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"><\/script>');
    document.write('<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"><\/script>');
  })();
  
  // --- Firebase config (จากที่ให้มา) ---
  const firebaseConfig = {
    apiKey: "AIzaSyCQbfxWkqx5r8ObQdMIZDPjGNn4PocWFYk",
    authDomain: "d-system-d0fe9.firebaseapp.com",
    databaseURL: "https://d-system-d0fe9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "d-system-d0fe9",
    storageBucket: "d-system-d0fe9.firebasestorage.app",
    messagingSenderId: "777682067922",
    appId: "1:777682067922:web:31450ab7a0186eb52e680b",
    measurementId: "G-HQ3G1D44P6"
  };
  
  // wait a tick for firebase libs to load
  function _initFirebase() {
    if (typeof firebase === "undefined" || !firebase.database) {
      setTimeout(_initFirebase, 50);
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window.db = firebase.database();
  }
  _initFirebase();
  