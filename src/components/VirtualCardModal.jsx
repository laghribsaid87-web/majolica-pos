import React, { useRef } from 'react';
import { X, Download, Share2, Crown, Calendar, User, Hash } from 'lucide-react';
import { toPng } from 'html-to-image';
import QRCode from 'react-qr-code';

const VirtualCardModal = ({ isOpen, onClose, client, onRemoveVIP }) => {
  const cardRef = useRef(null);

  if (!isOpen || !client) return null;

  const getValidityDate = () => {
    if (!client.clubJoinDate) return 'N/A';
    const date = new Date(client.clubJoinDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString('fr-FR');
  };

  const handleDownload = () => {
    if (cardRef.current === null) return;
    toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `carte_club_${client.name?.replace(/\s+/g, '_') || 'client'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Erreur lors de la generation de limage', err);
      });
  };

  const handleShare = async () => {
    if (!client.phone) {
      alert("Ce client n'a pas de numéro de téléphone enregistré.");
      return;
    }

    const cardLink = `https://majolica.web.app/carte/${client.phone.replace(/^0/, '0')}`;
    const msg = `Bonjour ${client.name} ! Voici les détails de votre abonnement MAJOLICA CLUB :
*Valable jusqu'au:* ${getValidityDate()}

🔗 *Cliquez sur ce lien pour voir et télécharger votre carte VIP :*
${cardLink}

Veuillez présenter cette carte virtuelle (ou le QR code) lors de votre prochain passage en salon pour profiter de vos avantages exclusifs ! 💅✨`;
    
    try {
      const response = await fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: client.phone,
          message: msg
        })
      });

      if (response.ok) {
        alert("✅ La carte VIP a été envoyée avec succès sur WhatsApp !");
      } else {
        alert("❌ Erreur lors de l'envoi WhatsApp.");
      }
    } catch (err) {
      console.error("Erreur API WhatsApp:", err);
      alert("❌ Erreur de connexion au serveur WhatsApp. Assurez-vous que le serveur tourne en arrière-plan.");
    }
  };

  // Generate a mock membership ID based on phone or name
  const memberId = client.phone ? client.phone.slice(-6) : Math.floor(100000 + Math.random() * 900000).toString();

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-full">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold font-serif">MAJOLICA CLUB</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-8 bg-gray-50 flex flex-col items-center overflow-y-auto">
          {/* Virtual Card Design */}
          <div 
            ref={cardRef}
            className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1f1f1f 0%, #111111 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              aspectRatio: '1.586/1'
            }}
          >
            {/* Background design elements */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              {/* Chip */}
              <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-600 opacity-90 border border-yellow-700/30 shadow-inner"></div>
              
              <div className="flex flex-col items-end">
                <span className="text-yellow-500 font-serif font-bold text-xl tracking-widest leading-none mb-1">MAJOLICA</span>
                <span className="text-yellow-500/70 text-[9px] uppercase tracking-widest leading-none">Nails & Beauty</span>
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="text-yellow-500/60 text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User size={10} />
                    Membre VIP
                  </div>
                  <div className="text-white font-mono text-lg tracking-wider uppercase drop-shadow-md truncate">
                    {client.name || 'CLIENT INCONNU'}
                  </div>
                </div>

                <div className="flex gap-6">
                  <div>
                    <div className="text-yellow-500/60 text-[9px] uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <Hash size={10} />
                      ID Membre
                    </div>
                    <div className="text-gray-300 font-mono tracking-widest text-sm drop-shadow-md">
                      {memberId}
                    </div>
                  </div>
                  <div>
                    <div className="text-yellow-500/60 text-[9px] uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      Valable Jusqu'au
                    </div>
                    <div className="text-gray-300 font-mono tracking-widest text-sm drop-shadow-md">
                      {getValidityDate()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* QR Code Container */}
              <div className="bg-white p-1.5 rounded-lg shadow-lg shrink-0 ml-4">
                <QRCode 
                  value={`MAJOLICA_CLUB_${memberId}_${client.phone}`}
                  size={64}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 w-full">
            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 py-3.5 rounded-xl font-bold transition-all text-sm shadow-sm"
            >
              <Download size={18} />
              Télécharger
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#25D366]/30 transition-all text-sm"
            >
              <Share2 size={18} />
              WhatsApp
            </button>
          </div>
          
          {onRemoveVIP && (
            <button 
              onClick={onRemoveVIP}
              className="mt-4 w-full flex items-center justify-center text-red-500 hover:text-red-700 py-2 text-xs font-bold transition-all"
            >
              Retirer l'abonnement VIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualCardModal;
