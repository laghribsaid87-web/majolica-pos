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

console.log('🔍 Recherche des ventes tests (Celine / 10/09) dans Firebase...');

const snap = await getDocs(collection(db, 'history'));
const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// Find test sales: employeeName Celine on 10/09/2026
const testSales = all.filter(o => {
  const d = new Date(o.timestamp || o.date);
  const dateStr = d.toISOString().slice(0, 10);
  return dateStr === '2026-09-10' && o.employeeName === 'Celine';
});

console.log(`\n📋 Ventes tests trouvées (${testSales.length}):`);
testSales.forEach(s => console.log(`  - ID: ${s.id} | ${s.employeeName} | ${s.total} DH | ${s.timestamp}`));

if (testSales.length > 0) {
  console.log('\n🗑️  Suppression en cours...');
  for (const s of testSales) {
    await deleteDoc(doc(db, 'history', s.id.toString()));
    console.log(`  ✅ Supprimé: ${s.total} DH (${s.employeeName})`);
  }
  console.log('\n✅ Ventes tests supprimées!');
} else {
  // Show all records to help identify what to delete
  console.log('\nToutes les ventes disponibles:');
  all.forEach(s => console.log(`  - ID: ${s.id} | ${s.employeeName} | ${s.total} DH | ${s.timestamp?.slice(0,10)}`));
}

process.exit(0);
