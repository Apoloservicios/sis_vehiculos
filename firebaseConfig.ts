
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Reemplaza con tu propia configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1lao1z0Q-h637kIVKHgN6fbKx1iP8tyQ",
    authDomain: "gestionvehiculos-5ac64.firebaseapp.com",
    projectId: "gestionvehiculos-5ac64",
    storageBucket: "gestionvehiculos-5ac64.firebasestorage.app",
    messagingSenderId: "791995867670",
    appId: "1:791995867670:web:6d994e313fc46e499a8b37",
    measurementId: "G-CGS8RE2316"
};

// Inicializa la app
const app = initializeApp(firebaseConfig);

// Exporta Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
