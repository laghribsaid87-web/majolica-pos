import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Pour configurer Firebase, vous devez créer un fichier .env.local à la racine du projet
// et y coller vos identifiants Firebase.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDWAV15xxmD253EAVL_F-iye0O2zjSg4Ck",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "majolica-71ea6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "majolica-71ea6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "majolica-71ea6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "683014494710",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:683014494710:web:632cea1531bde70d0f8fd7"
};

// Vérifie si la clé API existe
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Activer la persistance hors-ligne de Firebase (Cache automatique des écritures)
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn("Firebase persistence error:", err.code);
    });

    console.log("🔥 Firebase connecté avec succès !");
  } catch (error) {
    console.error("Erreur d'initialisation Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase n'est pas configuré. Utilisation du mode hors-ligne (localStorage).");
}

export { db, auth };
