import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

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

// === DONNÉES SEPTEMBRE 2026 (depuis Excel Patronne) ===
const caData = [
  { date: '2026-09-01', ca: 1600 },
  { date: '2026-09-02', ca: 4100 },
  { date: '2026-09-03', ca: 500  },
  { date: '2026-09-04', ca: 200  },
  { date: '2026-09-05', ca: 1000 },
  { date: '2026-09-06', ca: 700  },
  { date: '2026-09-07', ca: 1020 },
  { date: '2026-09-08', ca: 400  },
  { date: '2026-09-09', ca: 470  },
  // 10/09: CA=0, pas de ventes (juste dépenses)
  { date: '2026-09-11', ca: 700  },
];

// Dépenses (achat par poche/banque) depuis l'Excel
const depenses = [
  { date: '2026-09-07', amount: 150,  desc: 'Plomberie réparation chauffe eau', method: 'personnel' },
  { date: '2026-09-08', amount: 30,   desc: 'Autres',                            method: 'personnel' },
  { date: '2026-09-09', amount: 250,  desc: 'Plomberie réparation chauffe eau', method: 'personnel' },
  { date: '2026-09-10', amount: 8200, desc: 'Chaise + Peinture',                method: 'personnel' },
];

console.log('📥 Import des données Septembre 2026...\n');

// Save CA (sales)
for (const row of caData) {
  if (row.ca === 0) continue;
  const id = `import_${row.date}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  await setDoc(doc(db, 'history', id), {
    id,
    items: [{ id: 'import', name: 'Recette journalière (Import)', qty: 1, price: row.ca }],
    total: row.ca,
    employeeName: 'Import Manuel',
    clientName: '',
    clientPhone: '',
    timestamp: new Date(`${row.date}T12:00:00`).toISOString(),
    date: row.date,
  });
  console.log(`  ✅ CA ${row.date}: ${row.ca} DH`);
}

// Save dépenses
for (const exp of depenses) {
  const id = `import_exp_${exp.date}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  await setDoc(doc(db, 'expenses', id), {
    id,
    amount: exp.amount,
    category: 'Divers',
    description: exp.desc,
    paymentMethod: exp.method,
    date: exp.date,
    createdAt: new Date(`${exp.date}T12:00:00`).toISOString(),
  });
  console.log(`  ✅ Dépense ${exp.date}: ${exp.amount} DH (${exp.desc})`);
}

console.log('\n✅ Import terminé! Actualisez la page Dashboard.');
process.exit(0);
