import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Pour configurer Firebase, vous devez créer un fichier .env.local à la racine du projet
// et y coller vos identifiants Firebase.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
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
