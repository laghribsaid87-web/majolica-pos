import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Crown, Download, User } from 'lucide-react';
import { fetchClubMembers } from '../services/api';
import { toPng } from 'html-to-image';
import QRCode from 'react-qr-code';

const ClientCardPage = () => {
  const { phone } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    const loadClient = async () => {
      const members = await fetchClubMembers();
      const found = members.find(m => m.phone === phone);
      setClient(found);
      setLoading(false);
    };
    loadClient();
  }, [phone]);

  const getValidityDate = (joinDate) => {
    if (!joinDate) return 'N/A';
    const date = new Date(joinDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString('fr-FR');
  };

  const handleDownload = () => {
    if (cardRef.current === null) return;
    toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `carte_club_majolica.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Erreur lors de la generation de limage', err);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Crown className="w-12 h-12 text-yellow-400 mb-4" />
          <p className="text-gray-500">Chargement de votre carte...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <Crown className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Carte Introuvable</h1>
        <p className="text-gray-500 mb-6">Ce numéro de téléphone n'est associé à aucun abonnement VIP actif.</p>
        <Link to="/" className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const memberId = client.phone ? client.phone.slice(-6) : '000000';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto" />
          <h1 className="text-3xl font-serif font-bold text-yellow-400">MAJOLICA CLUB</h1>
          <p className="text-gray-400">Bienvenue dans votre espace VIP</p>
        </div>

        {/* Virtual Card Design */}
        <div className="flex justify-center">
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

                <div className="flex gap-4">
                  <div>
                    <div className="text-yellow-500/60 text-[8px] uppercase tracking-widest mb-0.5">Membre depuis</div>
                    <div className="text-gray-300 font-mono text-xs">{client.clubJoinDate ? new Date(client.clubJoinDate).toLocaleDateString('fr-FR') : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-yellow-500/60 text-[8px] uppercase tracking-widest mb-0.5">Valable jusqu'au</div>
                    <div className="text-gray-300 font-mono text-xs">{getValidityDate(client.clubJoinDate)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-1.5 rounded-lg shadow-lg">
                <QRCode
                  value={`VIP-${memberId}-${client.phone}`}
                  size={60}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:scale-105 transition-transform"
        >
          <Download size={20} />
          Télécharger ma Carte
        </button>

        <p className="text-center text-gray-500 text-sm mt-8">
          Veuillez présenter cette carte lors de votre passage au salon pour profiter de vos avantages.
        </p>
      </div>
    </div>
  );
};

export default ClientCardPage;
