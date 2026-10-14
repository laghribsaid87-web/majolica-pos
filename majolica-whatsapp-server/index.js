const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot, updateDoc, doc } = require('firebase/firestore');
const qrcode = require('qrcode-terminal');

// Initialisation Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
app.use(cors());
app.use(express.json());

let isReady = false;
let currentQR = '';
let client = null;
let cronStarted = false;
let localReservations = [];

// Helper Timezone Casablanca
function getCasablancaInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const p = {};
  parts.forEach(({ type, value }) => { p[type] = value; });
  return {
    todayDateStr: `${p.year}-${p.month}-${p.day}`,
    currentHour: parseInt(p.hour, 10),
    currentMinute: parseInt(p.minute, 10),
    now
  };
}

// Vérification de l'état réel de la connexion
async function checkIsConnected() {
  if (!isReady || !client) return false;
  try {
    const state = await client.getState();
    if (state === 'CONNECTED') return true;
    isReady = false;
    return false;
  } catch (e) {
    isReady = false;
    return false;
  }
}

// Service de rappels automatiques (Mode Economie d'Energie)
const startReminderCron = () => {
  if (cronStarted) return;
  cronStarted = true;
  console.log("⏳ Démarrage du service de rappel automatique (Casablanca TZ)...");
  
  // Écoute temps réel de Firebase
  onSnapshot(collection(db, 'reservations'), (snapshot) => {
    localReservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  });
  
  // Vérification toutes les minutes
  setInterval(async () => {
    const connected = await checkIsConnected();
    if (!connected || localReservations.length === 0) return;

    try {
      const { todayDateStr, currentHour, currentMinute } = getCasablancaInfo();
      const currentTotalMins = currentHour * 60 + currentMinute;

      for (const resData of localReservations) {
        if (!resData.date || !resData.time || !resData.phone) continue;
        if (resData.status === 'Annulé' || resData.status === 'Annule') continue;

        // Calcul de la date de réservation au format Casablanca (YYYY-MM-DD)
        let resDateStr = '';
        try {
          const resDateObj = new Date(resData.date);
          const resParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Africa/Casablanca',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).formatToParts(resDateObj);
          const rp = {};
          resParts.forEach(({ type, value }) => { rp[type] = value; });
          resDateStr = `${rp.year}-${rp.month}-${rp.day}`;
        } catch (e) {
          continue;
        }

        // On ne traite que les réservations d'AUJOURD'HUI
        if (resDateStr !== todayDateStr) continue;

        const [apptH, apptM] = resData.time.split(':').map(Number);
        if (isNaN(apptH) || isNaN(apptM)) continue;
        const apptTotalMins = apptH * 60 + apptM;
        const diffMins = apptTotalMins - currentTotalMins;

        let cleanPhone = resData.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
        else if (!cleanPhone.startsWith('212')) cleanPhone = '212' + cleanPhone;
        const chatId = cleanPhone + '@c.us';

        // 1. RAPPEL DU MATIN VERS 10H (entre 10h00 et 10h59)
        // Pour les clientes qui ont un RDV plus tard dans la journée
        if (!resData.remindedMorning && currentHour >= 10 && apptTotalMins > currentTotalMins) {
          console.log(`[RAPPEL MATIN 10H] Envoi à ${resData.name} pour son RDV de ${resData.time}`);
          const morningMsg = `Bonjour ${resData.name} 🌸,\n\nMajolica Beauty Studio vous rappelle votre rendez-vous prévu aujourd'hui à *${resData.time}* (${resData.service || 'Soin'}).\n\nNous avons hâte de vous accueillir et vous chouchouter ! ✨💅\n\n🏢 Immeuble Hakim | 1er Etage | Bureau 04\n🌍 Ave Mohamed Taieb Naciri, Casablanca\n📌 GPS : https://maps.google.com/?q=33.549417,-7.677516`;

          try {
            await client.sendMessage(chatId, morningMsg);
            await updateDoc(doc(db, 'reservations', resData.id), { 
              remindedMorning: true,
              remindedMorningAt: new Date().toISOString()
            });
            console.log(`[SUCCES RAPPEL MATIN] Envoyé à ${resData.name}`);
          } catch (err) {
            console.error(`Erreur envoi rappel matin à ${resData.name}:`, err.message);
          }
        }

        // 2. RAPPEL 1H30 AVANT LE RENDEZ-VOUS (entre 75 et 95 minutes avant le RDV)
        const alreadyReminded1h30 = resData.reminded1h30 || resData.reminded_1h30 || resData.reminded;
        if (!alreadyReminded1h30 && diffMins > 0 && diffMins <= 95 && diffMins >= 75) {
          console.log(`[RAPPEL 1H30] Envoi à ${resData.name} pour son RDV de ${resData.time} (dans ${diffMins} min)`);
          const reminder1h30Msg = `Bonjour ${resData.name} 🌸,\n\nPetit rappel : votre rendez-vous chez Majolica Beauty Studio commence dans *1 heure et demie* (à *${resData.time}*).\n\nNous vous attendons avec plaisir ! ✨💖`;

          try {
            await client.sendMessage(chatId, reminder1h30Msg);
            await updateDoc(doc(db, 'reservations', resData.id), { 
              reminded1h30: true,
              reminded: true,
              reminded1h30At: new Date().toISOString()
            });
            console.log(`[SUCCES RAPPEL 1H30] Envoyé à ${resData.name}`);
          } catch (err) {
            console.error(`Erreur envoi rappel 1h30 à ${resData.name}:`, err.message);
          }
        }
      }
    } catch (e) {
      console.error("Erreur Cron Rappels Local:", e);
    }
  }, 60 * 1000); 
};

// Initialisation du client WhatsApp
function initClient() {
  if (client) {
    try { client.removeAllListeners(); } catch (e) {}
  }

  isReady = false;
  currentQR = '';

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('\n\n======================================================');
    console.log('📱 SCANNEZ CE QR CODE AVEC WHATSAPP POUR CONNECTER MAJOLICA');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
    currentQR = qr;
    isReady = false;
  });

  client.on('ready', () => {
    console.log('✅ BOT WHATSAPP CONNECTE ET PRET !');
    isReady = true;
    currentQR = '';
    startReminderCron();
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Échec d\'authentification WhatsApp:', msg);
    isReady = false;
  });

  client.on('disconnected', (reason) => {
    console.log('❌ Déconnecté de WhatsApp:', reason);
    isReady = false;
    currentQR = '';
    setTimeout(() => {
      try { client.destroy(); } catch (e) {}
      initClient();
    }, 5000);
  });

  client.initialize().catch(err => {
    console.error("Erreur critique d'initialisation WhatsApp:", err.message);
  });
}

// Lancement initial
initClient();

// --- ROUTES DE L'API ---

app.get('/api/whatsapp-status', async (req, res) => {
  const connected = await checkIsConnected();
  if (connected) return res.json({ status: 'connected' });
  if (currentQR) return res.json({ status: 'qr', qr: currentQR });
  return res.json({ status: 'starting' });
});

app.post('/api/request-pairing-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required.' });

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('212')) cleanPhone = '212' + cleanPhone;

    if (!client) return res.status(503).json({ error: 'Client non prêt.' });
    const code = await client.requestPairingCode(cleanPhone);
    console.log(`[PAIRING] Code généré pour ${cleanPhone}: ${code}`);
    res.json({ success: true, code });
  } catch (err) {
    console.error("Erreur requestPairingCode:", err.message);
    res.status(500).json({ error: err.message || "Erreur de génération de code." });
  }
});

app.post('/api/send-whatsapp', async (req, res) => {
  const connected = await checkIsConnected();
  if (!connected) {
    return res.status(503).json({ error: 'WhatsApp bot is not ready yet.' });
  }

  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Phone and message are required.' });

  try {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '212' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('212')) cleanPhone = '212' + cleanPhone;

    const chatId = cleanPhone + '@c.us';
    
    try {
      const chat = await client.getChatById(chatId);
      if (chat) await chat.sendStateTyping();
    } catch (e) {
      // Ignorer l'erreur si on n'arrive pas à simuler la frappe
    }
    
    const typingDelay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(r => setTimeout(r, typingDelay));

    await client.sendMessage(chatId, message);
    console.log(`[SUCCES] Message envoyé à ${phone}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error.message);
    // Détection d'une session Chrome rompue ou détachée
    if (error.message && (error.message.includes('detached Frame') || error.message.includes('Session closed') || error.message.includes('Protocol error'))) {
      console.log('⚠️ Session Puppeteer rompue détectée. Relance automatique...');
      isReady = false;
      setTimeout(() => {
        try { client.destroy(); } catch (e) {}
        initClient();
      }, 2000);
    }
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

app.post('/api/whatsapp-logout', async (req, res) => {
  console.log('Demande de réinitialisation WhatsApp reçue...');
  isReady = false;
  currentQR = '';
  try {
    if (client) {
      try { await client.logout(); } catch (e) { console.log('Logout non bloquant:', e.message); }
      try { await client.destroy(); } catch (e) { console.log('Destroy non bloquant:', e.message); }
    }
  } catch (err) {
    console.error("Erreur lors de la réinitialisation:", err.message);
  }
  res.json({ success: true, message: "Réinitialisation en cours" });
  setTimeout(() => {
    initClient();
  }, 2000);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur API Majolica WhatsApp en cours d'exécution sur le port ${PORT}`);
});
