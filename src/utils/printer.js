import { TcpSocket } from 'capacitor-tcp-socket';
import { Capacitor } from '@capacitor/core';

// ESC/POS Commands
const ESC = String.fromCharCode(0x1B);
const GS = String.fromCharCode(0x1D);
const INIT = ESC + "@";
const CUT_PAPER = GS + "V" + String.fromCharCode(1); // Partial cut
const OPEN_DRAWER = ESC + "p" + String.fromCharCode(0) + String.fromCharCode(25) + String.fromCharCode(250);

// Helper to center text
const alignCenter = ESC + "a" + String.fromCharCode(1);
const alignLeft = ESC + "a" + String.fromCharCode(0);
const alignRight = ESC + "a" + String.fromCharCode(2);

// Standard formatting via ESC !
const textNormal = ESC + "!" + String.fromCharCode(0);
const textBold = ESC + "!" + String.fromCharCode(8);
const textTall = ESC + "!" + String.fromCharCode(16);
const textTallBold = ESC + "!" + String.fromCharCode(24);
const textDouble = ESC + "!" + String.fromCharCode(48);
const textDoubleBold = ESC + "!" + String.fromCharCode(56);

// Helper to convert string to Latin1 Base64
const payloadToLatin1Base64 = (str) => {
  let uint8Array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i) & 0xFF;
  }
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
};

export const printTicketTCP = async (printerIp, ticketInfo) => {
  if (!printerIp) {
    throw new Error("L'adresse IP dyal l'imprimante makhasshach tkon khawya.");
  }

  const { shopName, shopAddress, shopPhone, qrLink, employee, clientName, cart, total, amountReceived, change, date, paperSize, loyaltyPointsBalance } = ticketInfo;

  const maxWidth = paperSize === '58mm' ? 32 : 48;
  const divider = "-".repeat(maxWidth) + "\n\n";

  // Helper pour générer les commandes ESC/POS du QR Code (Model 2)
  const getQrCodeCommands = (url) => {
    if (!url) return '';
    const dataLen = url.length + 3;
    const pL = dataLen % 256;
    const pH = Math.floor(dataLen / 256);
    
    let cmd = "";
    cmd += alignCenter; // Centrer le QR code
    cmd += GS + "(k" + String.fromCharCode(4, 0, 49, 65, 50, 0); // Model 2
    cmd += GS + "(k" + String.fromCharCode(3, 0, 49, 67, 8); // Size 8
    cmd += GS + "(k" + String.fromCharCode(3, 0, 49, 69, 48); // Error correction L
    cmd += GS + "(k" + String.fromCharCode(pL, pH, 49, 80, 48) + url; // Data
    cmd += GS + "(k" + String.fromCharCode(3, 0, 49, 81, 48); // Print
    cmd += "\n\n";
    return cmd;
  };

  // Format date
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  // Formatting the payload
  let payload = INIT;
  
  // Header
  payload += "\n\n";
  payload += alignCenter + textDoubleBold + (shopName || "MAJOLICA") + "\n" + textNormal;
  if (shopAddress) payload += alignCenter + textNormal + shopAddress + "\n";
  if (shopPhone) payload += alignCenter + textNormal + "Tel: " + shopPhone + "\n";
  payload += "\n";
  
  // Info
  payload += alignLeft + textNormal + `Date: ${dateStr}  Heure: ${timeStr}\n`;
  if (employee) payload += `Servi par: ${employee}\n`;
  if (clientName) payload += `Client: ${clientName}\n`;
  
  payload += divider;
  
  // Items
  payload += textNormal;
  cart.forEach(item => {
    const qtyPriceStr = `${item.qty}x ${item.name}`;
    const totalItemStr = item.totalPrice;
    let spaceCount = maxWidth - qtyPriceStr.length - totalItemStr.length;
    if (spaceCount < 1) spaceCount = 1; // Fallback spacing
    payload += qtyPriceStr + " ".repeat(spaceCount) + totalItemStr + "\n";
  });
  
  payload += divider;
  
  // Totals
  payload += textDoubleBold + `TOTAL: ${total.toFixed(2)} MAD\n` + textNormal;
  payload += `Especes: ${amountReceived} MAD\n`;
  payload += `Rendu: ${change.toFixed(2)} MAD\n`;
  
  payload += divider;
  
  if (loyaltyPointsBalance !== undefined && loyaltyPointsBalance !== null) {
    payload += alignCenter + textBold + `Solde Fidelite: ${loyaltyPointsBalance} Points\n\n` + textNormal;
    payload += divider;
  }

  payload += alignCenter + textBold + "Merci pour votre visite!\n\n" + textNormal;
  
  if (qrLink) {
    payload += getQrCodeCommands(qrLink);
  }
  
  payload += "\n\n\n\n\n";

  // Open drawer and cut paper
  payload += OPEN_DRAWER;
  payload += CUT_PAPER;

  // Si on est sur le navigateur (PC de dev), on utilise le serveur d'impression local Node.js
  if (Capacitor.getPlatform() === 'web') {
    try {
      const response = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: printerIp, payload })
      });
      if (!response.ok) {
        throw new Error("Erreur du serveur local. Assurez-vous qu'il est allumé.");
      }
      return { success: true, message: "T'imprima mn Chrome b naja7!" };
    } catch (error) {
      console.error("Erreur Web Printing:", error);
      throw new Error("M9derch ytsel b serveur-impression.js. T'akd bli mkhadmo f terminal.");
    }
  }

  // Helper to convert string to Latin1 Base64
  const payloadToLatin1Base64 = (str) => {
    let uint8Array = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      uint8Array[i] = str.charCodeAt(i) & 0xFF;
    }
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
  };

  // Si on est sur Tablette (Android/iOS), on utilise le vrai plugin TCP
  try {
    const { client } = await TcpSocket.connect({
      ipAddress: printerIp,
      port: 9100
    });
    
    // Send the raw ESC/POS payload as base64 to avoid UTF-8 corruption
    await TcpSocket.send({ 
      client: client,
      data: payloadToLatin1Base64(payload),
      encoding: 'base64'
    });
    
    // Give it a small delay before disconnecting
    setTimeout(async () => {
      await TcpSocket.disconnect({ client: client });
    }, 500);
    
    return { success: true, message: "T'imprima b naja7!" };
  } catch (error) {
    console.error("Erreur d'impression TCP:", error);
    throw new Error("M9derch ytzda m3a l'imprimante. T'akd mn l'IP w wach l'imprimante cha3la.");
  }
};

export const printZReportTCP = async (printerIp, reportInfo) => {
  if (!printerIp) {
    throw new Error("L'adresse IP dyal l'imprimante makhasshach tkon khawya.");
  }

  const { shopName, date, totalSales, cashSales, cardSales, totalExpenses, ordersCount, paperSize } = reportInfo;

  const maxWidth = paperSize === '58mm' ? 32 : 48;
  const divider = "-".repeat(maxWidth) + "\n\n";

  // Format date
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  let payload = INIT;
  
  // Header
  payload += "\n\n";
  payload += alignCenter + textDoubleBold + (shopName || "MAJOLICA") + "\n" + textNormal;
  payload += textDoubleBold + "BILAN DE CAISSE\n" + textNormal;
  payload += `(Rapport X)\n\n`;
  
  // Info
  payload += alignLeft + textNormal + `Date: ${dateStr}\nHeure: ${timeStr}\n`;
  payload += divider;
  
  // Stats
  payload += textNormal;
  payload += `Nombre de tickets : ${ordersCount}\n\n`;
  payload += `Total Ventes    : ${totalSales.toFixed(2)} MAD\n`;
  payload += `  Especes       : ${cashSales.toFixed(2)} MAD\n`;
  if (cardSales) payload += `  Carte/Virement: ${cardSales.toFixed(2)} MAD\n`;
  payload += `Depenses/Sorties: ${totalExpenses.toFixed(2)} MAD\n\n`;
  
  payload += divider;
  
  // Caisse Attendue
  payload += textDoubleBold + `CAISSE ATTENDUE:\n${(cashSales - totalExpenses).toFixed(2)} MAD\n\n` + textNormal;
  
  payload += divider;
  payload += alignCenter + textBold + "Fin du Bilan\n\n\n\n\n" + textNormal;

  // Open drawer and cut paper
  payload += OPEN_DRAWER;
  payload += CUT_PAPER;

  // Web fallback
  if (Capacitor.getPlatform() === 'web') {
    try {
      const response = await fetch('http://localhost:3001/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: printerIp, payload })
      });
      if (!response.ok) throw new Error("Erreur serveur local.");
      return { success: true };
    } catch (error) {
      console.error("Erreur Web Printing Z:", error);
      throw new Error("M9derch ytsel b serveur-impression.js.");
    }
  }

  // Native TCP
  try {
    const { client } = await TcpSocket.connect({ ipAddress: printerIp, port: 9100 });
    await TcpSocket.send({ 
      client: client, 
      data: payloadToLatin1Base64(payload),
      encoding: 'base64'
    });
    setTimeout(async () => { await TcpSocket.disconnect({ client }); }, 500);
    return { success: true };
  } catch (error) {
    console.error("Erreur d'impression Z:", error);
    throw new Error("M9derch ytzda m3a l'imprimante.");
  }
};
