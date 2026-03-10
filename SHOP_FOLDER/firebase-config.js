    // firebase-config.js
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
    import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
    import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

    const firebaseConfig = {
        apiKey: "AIzaSyB4Hy_sEEH1twq0GDzKi5E1CZD5dVHn4Kk",
        authDomain: "cottage-9fa0c.firebaseapp.com",
        projectId: "cottage-9fa0c",
        storageBucket: "cottage-9fa0c.firebasestorage.app",
        messagingSenderId: "346971937714",
        appId: "1:346971937714:web:0f453c14862de16bede2ab"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log("✅ Firebase initialized successfully");

    export { auth, db };