const http = require('http');
const net = require('net');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Ajouter les headers CORS pour autoriser l'application React
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Répondre directement aux requêtes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const printerIp = data.ip;
        const payload = data.payload;

        if (!printerIp || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "L'IP et le payload sont requis." }));
          return;
        }

        console.log(`\n[INFO] Tentative de connexion à l'imprimante ${printerIp}:9100...`);
        
        const client = new net.Socket();
        
        client.on('error', (err) => {
          console.error(`[ERREUR] Connexion échouée:`, err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          client.destroy();
        });

        client.connect(9100, printerIp, () => {
          console.log(`[SUCCES] Connecté à l'imprimante. Envoi de l'impression...`);
          
          // Envoyer en 'latin1' pour ne pas corrompre les caractères ESC/POS
          client.write(payload, 'latin1', () => {
             console.log(`[SUCCES] L'impression a été envoyée avec succès!`);
             res.writeHead(200, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ success: true, message: 'Imprimé!' }));
             
             // Attendre 500ms avant de couper la connexion proprement
             setTimeout(() => {
                client.destroy();
             }, 500);
          });
        });
      } catch (err) {
        console.error(`[ERREUR FATALE]`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n====================================================`);
  console.log(`🖨️   Serveur d'impression local démarré sur le port ${PORT}`);
  console.log(`✅  Laissez ce terminal ouvert pendant vos tests !`);
  console.log(`====================================================\n`);
});
