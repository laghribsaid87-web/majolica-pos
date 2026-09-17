import { TcpSocket } from 'capacitor-tcp-socket';

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

export const printTicketTCP = async (printerIp, ticketData) => {
  if (!printerIp) {
    throw new Error("L'adresse IP dyal l'imprimante makhasshach tkon khawya.");
  }

  // Formatting the payload
  let payload = INIT;
  
  // Example of building the ticket
  payload += alignCenter + boldOn + sizeDouble + "MAJOLICA POS\n" + sizeNormal + boldOff + "\n";
  payload += alignLeft + "--------------------------------\n";
  
  // Add the dynamic ticket data (items, total, etc)
  payload += ticketData + "\n";
  
  payload += "--------------------------------\n";
  payload += alignCenter + "Merci pour votre visite!\n\n\n\n\n";
  
  // Open drawer and cut paper
  payload += OPEN_DRAWER;
  payload += CUT_PAPER;

  try {
    const socket = new TcpSocket();
    await socket.connect({
      host: printerIp,
      port: 9100 // Default TCP port for thermal printers
    });
    
    // Send the raw ESC/POS payload
    await socket.write({ data: payload });
    
    // Give it a small delay before disconnecting
    setTimeout(async () => {
      await socket.disconnect();
    }, 500);
    
    return { success: true, message: "T'imprima b naja7!" };
  } catch (error) {
    console.error("Erreur d'impression TCP:", error);
    throw new Error("M9derch ytzda m3a l'imprimante. T'akd mn l'IP w wach l'imprimante cha3la.");
  }
};
