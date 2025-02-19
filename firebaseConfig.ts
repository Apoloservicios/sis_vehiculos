import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // ✅ Usa solo getAuth
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB1lao1z0Q-h637kIVKHgN6fbKx1iP8tyQ",
    authDomain: "gestionvehiculos-5ac64.firebaseapp.com",
    projectId: "gestionvehiculos-5ac64",
    storageBucket: "gestionvehiculos-5ac64.firebasestorage.app",
    messagingSenderId: "791995867670",
    appId: "1:791995867670:web:6d994e313fc46e499a8b37",
    measurementId: "G-CGS8RE2316"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // ✅ No uses initializeAuth
const db = getFirestore(app);

export { auth, db };
