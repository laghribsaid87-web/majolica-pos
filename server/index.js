const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot, updateDoc, doc } = require('firebase/firestore');
const { differenceInMinutes, isToday } = require('date-fns');

// Firebase Setup
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

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('Nouveau QR Code généré');
    currentQR = qr;
});

let cronStarted = false;
let localReservations = [];

const startReminderCron = () => {
  if (cronStarted) return;
  cronStarted = true;
  console.log("⏳ Démarrage du service de rappel automatique (Mode Economie d'Energie)...");
  
  // 1. Écouter Firebase en temps réel (0 quota consommé pour la vérification !)
  onSnapshot(collection(db, 'reservations'), (snapshot) => {
    localReservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  });
  
  // 2. Vérifier uniquement la mémoire locale chaque minute
  setInterval(async () => {
    if (!isReady || localReservations.length === 0) return; 

    try {
      const now = new Date();
      
      for (const resData of localReservations) {
        // Ignorer si déjà rappelé, annulé ou données manquantes
        if (resData.reminded || resData.status === 'Annulé' || !resData.date || !resData.time || !resData.phone) continue;

        const resDateObj = new Date(resData.date);
        if (!isToday(resDateObj)) continue; // Seulement les rdv d'aujourd'hui

        // Parser l'heure "14:30"
        const [hours, minutes] = resData.time.split(':').map(Number);
        const appointmentTime = new Date(resDateObj);
        appointmentTime.setHours(hours, minutes, 0, 0);

        // Différence en minutes
        const diffMins = differenceInMinutes(appointmentTime, now);

        // Si le rdv est dans exactement 55 à 60 minutes
        if (diffMins > 0 && diffMins <= 60 && diffMins >= 55) {
          console.log(`[RAPPEL] Envoi du rappel à ${resData.name} pour ${resData.time}`);
          
          let cleanPhone = resData.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('0')) {
              cleanPhone = '212' + cleanPhone.substring(1);
          } else if (!cleanPhone.startsWith('212')) {
              cleanPhone = '212' + cleanPhone;
          }
          const chatId = cleanPhone + '@c.us';
          
          const message = `Bonjour ${resData.name} 🌸,\n\nPetit rappel : votre rendez-vous chez Majolica Beauty Studio est prévu dans 1 heure (à ${resData.time}).\n\nNous avons hâte de vous recevoir ! ✨`;

          try {
            await client.sendMessage(chatId, message);
            // Marquer comme rappelé dans Firebase
            await updateDoc(doc(db, 'reservations', resData.id), { reminded: true });
            console.log(`[SUCCES RAPPEL] Rappel envoyé et enregistré pour ${resData.name}`);
          } catch (err) {
            console.error(`Erreur d'envoi du rappel à ${resData.name}`, err);
          }
        }
      }
    } catch (e) {
      console.error("Erreur Cron Firebase Local:", e);
    }
  }, 60 * 1000); // Check toutes les minutes en mémoire
};

client.on('ready', () => {
    console.log('✅ BOT WHATSAPP CONNECTE ET PRET !');
    isReady = true;
    currentQR = '';
    startReminderCron();
});

client.on('disconnected', () => {
    isReady = false;
    client.initialize();
});

client.initialize();

// API Endpoint to get status and QR code
app.get('/api/whatsapp-status', (req, res) => {
    if (isReady) {
        return res.json({ status: 'connected' });
    }
    if (currentQR) {
        return res.json({ status: 'qr', qr: currentQR });
    }
    return res.json({ status: 'starting' });
});

// API Endpoint to send message
app.post('/api/send-whatsapp', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp bot is not ready yet.' });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required.' });
    }

    try {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '212' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('212')) {
            cleanPhone = '212' + cleanPhone;
        }

        const chatId = cleanPhone + '@c.us';
        
        // 1. Get Chat and simulate typing
        const chat = await client.getChatById(chatId);
        await chat.sendStateTyping();
        
        // 2. Wait for 2-4 seconds randomly to simulate human typing
        const typingDelay = Math.floor(Math.random() * 2000) + 2000;
        await new Promise(r => setTimeout(r, typingDelay));

        // 3. Send message
        await client.sendMessage(chatId, message);
        
        console.log(`[SUCCES] Message envoyé à ${phone}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

app.post('/api/whatsapp-logout', async (req, res) => {
    try {
        await client.logout();
        isReady = false;
        currentQR = '';
        res.json({ success: true, message: "Déconnecté" });
        
        // Relance l'initialisation pour générer un nouveau QR Code
        client.initialize();
    } catch (err) {
        console.error("Erreur de déconnexion:", err);
        res.status(500).json({ error: "Failed to logout" });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Serveur API en cours d'exécution sur le port ${PORT}`);
});
