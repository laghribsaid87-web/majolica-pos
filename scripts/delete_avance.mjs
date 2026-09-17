import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWAV15xxmD253EAVL_F-iye0O2zjSg4Ck",
  authDomain: "majolica-71ea6.firebaseapp.com",
  projectId: "majolica-71ea6",
  storageBucket: "majolica-71ea6.firebasestorage.app",
  messagingSenderId: "683014494710",
  appId: "1:683014494710:web:632cea1531bde70d0f8fd7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔍 Recherche des avances/salaires dans Firebase...');

const snap = await getDocs(collection(db, 'expenses'));
const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

const avances = all.filter(e => ['Salaires', 'Avance Salaire'].includes(e.category));
console.log(`\n📋 Avances trouvées (${avances.length}):`);
avances.forEach(a => console.log(`  - ID: ${a.id} | ${a.description} | ${a.amount} DH | ${a.date}`));

if (avances.length > 0) {
  console.log('\n🗑️  Suppression en cours...');
  for (const a of avances) {
    await deleteDoc(doc(db, 'expenses', a.id.toString()));
    console.log(`  ✅ Supprimé: ${a.description} (${a.amount} DH)`);
  }
  console.log('\n✅ Toutes les avances ont été supprimées de Firebase!');
} else {
  console.log('\n✅ Aucune avance trouvée - Firebase est déjà propre!');
}

process.exit(0);
