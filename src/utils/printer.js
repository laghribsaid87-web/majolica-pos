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

// Helper to make text bold
const boldOn = ESC + "E" + String.fromCharCode(1);
const boldOff = ESC + "E" + String.fromCharCode(0);

// Helper for double height/width
const sizeDouble = GS + "!" + String.fromCharCode(0x11);
const sizeNormal = GS + "!" + String.fromCharCode(0x00);

export const printTicketTCP = async (printerIp, ticketInfo) => {
  if (!printerIp) {
    throw new Error("L'adresse IP dyal l'imprimante makhasshach tkon khawya.");
  }

  const { shopName, shopAddress, shopPhone, employee, clientName, cart, total, amountReceived, change, date } = ticketInfo;

  // Format date
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  // Formatting the payload
  let payload = INIT;
  
  // Header
  payload += alignCenter + boldOn + sizeDouble + (shopName || "MAJOLICA") + "\n" + sizeNormal + boldOff;
  if (shopAddress) payload += alignCenter + shopAddress + "\n";
  if (shopPhone) payload += alignCenter + "Tel: " + shopPhone + "\n";
  payload += "\n";
  
  // Info
  payload += alignLeft + `Date: ${dateStr}  Heure: ${timeStr}\n`;
  if (employee) payload += `Servi par: ${employee}\n`;
  if (clientName) payload += `Client: ${clientName}\n`;
  
  payload += "--------------------------------\n";
  
  // Items
  cart.forEach(item => {
    const qtyPriceStr = `${item.qty}x ${item.name}`;
    const totalItemStr = item.totalPrice;
    let spaceCount = 32 - qtyPriceStr.length - totalItemStr.length;
    if (spaceCount < 1) spaceCount = 1; // Fallback spacing
    payload += qtyPriceStr + " ".repeat(spaceCount) + totalItemStr + "\n";
  });
  
  payload += "--------------------------------\n";
  
  // Totals
  payload += boldOn + sizeDouble + `TOTAL: ${total.toFixed(2)} MAD\n` + sizeNormal + boldOff;
  payload += `Especes: ${amountReceived} MAD\n`;
  payload += `Rendu: ${change.toFixed(2)} MAD\n`;
  
  payload += "--------------------------------\n";
  payload += alignCenter + boldOn + "Merci pour votre visite!\n" + boldOff + "\n\n\n\n\n";
  
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

  // Si on est sur Tablette (Android/iOS), on utilise le vrai plugin TCP
  try {
    const { client } = await TcpSocket.connect({
      ipAddress: printerIp,
      port: 9100
    });
    
    // Send the raw ESC/POS payload
    await TcpSocket.send({ 
      client: client,
      data: payload 
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
