import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWAV15xxmD253EAVL_F-iye0O2zjSg4Ck",
  authDomain: "majolica-71ea6.firebaseapp.com",
  projectId: "majolica-71ea6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const qHistory = collection(db, 'history');
  const snap1 = await getCountFromServer(qHistory);
  console.log("Total history docs:", snap1.data().count);

  const qRes = collection(db, 'reservations');
  const snap2 = await getCountFromServer(qRes);
  console.log("Total reservations docs:", snap2.data().count);

  process.exit(0);
}

check();
