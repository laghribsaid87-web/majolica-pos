# Serveur WhatsApp Majolica (Version VPS)

Ce dossier contient le serveur WhatsApp spécialement conçu et optimisé pour tourner sur un VPS Linux (comme Ubuntu) sans surcharger la mémoire (RAM).

## Comment l'installer sur le VPS :

1. **Envoyez ce dossier** (`majolica-whatsapp-server`) sur votre nouveau VPS (via FTP, FileZilla, ou SSH).

2. **Connectez-vous à votre VPS** et naviguez dans le dossier :
   ```bash
   cd chemin/vers/majolica-whatsapp-server
   ```

3. **Installez les dépendances** :
   ```bash
   npm install
   ```
   *(Si npm n'est pas installé sur le VPS, installez d'abord Node.js : `sudo apt install nodejs npm`)*

4. **Installez les prérequis pour Puppeteer (Chrome)** sur le VPS (indispensable) :
   ```bash
   sudo apt-get update
   sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
   ```

5. **Démarrez le serveur avec PM2** (pour qu'il tourne en arrière-plan) :
   ```bash
   npm install -g pm2
   pm2 start index.js --name "whatsapp-majolica"
   ```

6. **Scannez le QR Code** :
   Affichez les logs pour voir le QR Code et le scanner avec votre téléphone :
   ```bash
   pm2 logs whatsapp-majolica
   ```

7. **Sauvegardez PM2** (pour qu'il se lance automatiquement au redémarrage du VPS) :
   ```bash
   pm2 save
   pm2 startup
   ```

## Pourquoi c'est mieux que l'ancien script ?
- Il est **totalement isolé** de "Mon Bocadillo".
- Il contient des **optimisations de RAM** (`--disable-dev-shm-usage`, `--no-sandbox`, `--single-process`) vitales pour que Chrome ne plante pas sur un petit VPS.
- Il inclut un outil de génération de QR Code directement dans le terminal (`qrcode-terminal`), ce qui rend la connexion beaucoup plus facile via SSH.
