import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, CheckCircle, Loader, ShieldAlert, Phone, Save, UserPlus, AlertCircle, Printer } from 'lucide-react';
import { fetchAdminPhone, saveAdminPhone, registerUser, fetchSalonConfig, saveSalonConfig } from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp', 'admin', 'printer', 'pos'
  const [status, setStatus] = useState('starting'); // 'starting', 'qr', 'connected', 'error'
  const [qrCode, setQrCode] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [isPhoneSaved, setIsPhoneSaved] = useState(false);
  
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState(''); // 'success', 'error', ''
  const [authMessage, setAuthMessage] = useState('');
  
  const [monthlyRent, setMonthlyRent] = useState('');
  const [monthlyElec, setMonthlyElec] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [cashierPin, setCashierPin] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [isConfigSaved, setIsConfigSaved] = useState(false);
  const [posCustomMode, setPosCustomMode] = useState(localStorage.getItem('pos_custom_mode_enabled') === 'true');

  const [printerIp, setPrinterIp] = useState(localStorage.getItem('printer_ip') || '');
  const [ticketShopName, setTicketShopName] = useState(localStorage.getItem('ticket_shop_name') || 'MAJOLICA POS');
  const [ticketAddress, setTicketAddress] = useState(localStorage.getItem('ticket_address') || 'Tanger, Maroc');
  const [ticketPhone, setTicketPhone] = useState(localStorage.getItem('ticket_phone') || '06 00 00 00 00');
  const [ticketQrLink, setTicketQrLink] = useState(localStorage.getItem('ticket_qr_link') || '');
  const [printerPaperSize, setPrinterPaperSize] = useState(localStorage.getItem('printer_paper_size') || '80mm');
  const [isPrinterSaved, setIsPrinterSaved] = useState(false);

  useEffect(() => {
    fetchAdminPhone().then(setAdminPhone);
    fetchSalonConfig().then(config => {
      setMonthlyRent(config?.monthlyRent?.toString() || '5500');
      setMonthlyElec(config?.monthlyElec?.toString() || '1500');
      setAdminEmail(config?.adminEmail || '');
      setCashierPin(config?.cashierPin || '0000');
      setAdminPin(config?.adminPin || '1234');
    });
  }, []);
  
  const handleSavePhone = async () => {
    await saveAdminPhone(adminPhone);
    setIsPhoneSaved(true);
    setTimeout(() => setIsPhoneSaved(false), 3000);
  };

  const handleSaveFixedCharges = async () => {
    await saveSalonConfig({ 
      monthlyRent: parseFloat(monthlyRent) || 0,
      monthlyElec: parseFloat(monthlyElec) || 0,
      adminEmail: adminEmail.trim(),
      cashierPin: cashierPin.trim(),
      adminPin: adminPin.trim()
    });
    setIsConfigSaved(true);
    setTimeout(() => setIsConfigSaved(false), 3000);
  };

  const handleSavePrinterConfig = () => {
    localStorage.setItem('printer_ip', printerIp);
    localStorage.setItem('ticket_shop_name', ticketShopName);
    localStorage.setItem('ticket_address', ticketAddress);
    localStorage.setItem('ticket_phone', ticketPhone);
    localStorage.setItem('ticket_qr_link', ticketQrLink);
    localStorage.setItem('printer_paper_size', printerPaperSize);
    setIsPrinterSaved(true);
    setTimeout(() => setIsPrinterSaved(false), 3000);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAuthStatus('');
    if (!adminEmail) {
      setAuthStatus('error');
      setAuthMessage('Veuillez d\'abord entrer l\'Email de la Patronne dans la section au-dessus.');
      return;
    }
    try {
      await registerUser(adminEmail.trim(), authPassword);
      setAuthStatus('success');
      setAuthMessage(`Compte Firebase créé avec succès pour ${adminEmail.trim()} !`);
      setAuthPassword('');
    } catch (err) {
      setAuthStatus('error');
      setAuthMessage(err.message || 'Erreur lors de la création du compte.');
    }
  };

  useEffect(() => {
    let interval;
    
    const checkStatus = async () => {
      try {
        const response = await fetch('https://majolica.136.116.62.73.nip.io/api/whatsapp-status');
        const data = await response.json();
        
        setStatus(data.status);
        if (data.status === 'qr') {
          setQrCode(data.qr);
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pb-10">
      <h1 className="page-header">Paramètres du Salon</h1>
      
      <div className="max-w-4xl">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'whatsapp' ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <Smartphone size={18} /> WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'admin' ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <ShieldAlert size={18} /> Sécurité & Admin
          </button>
          <button 
            onClick={() => setActiveTab('printer')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'printer' ? 'bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <Printer size={18} /> Imprimante & Ticket
          </button>
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'pos' ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            <span className="text-lg">⚙️</span> Caisse
          </button>
        </div>

        {/* TAB: WhatsApp */}
        {activeTab === 'whatsapp' && (
        <div className="glass rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary">Connexion WhatsApp</h2>
              <p className="text-sm text-gray-500">Pour l'envoi automatique des confirmations</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            {status === 'error' && (
              <div className="text-center">
                <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-secondary mb-2">Le serveur WhatsApp n'est pas lancé</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  Veuillez double-cliquer sur le fichier <strong>Lancer-WhatsApp.bat</strong> sur votre bureau pour démarrer le serveur en arrière-plan.
                </p>
              </div>
            )}

            {status === 'starting' && (
              <div className="text-center">
                <Loader size={48} className="text-accent animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-secondary mb-2">Démarrage en cours...</h3>
                <p className="text-gray-500">Génération du code QR dans quelques secondes.</p>
              </div>
            )}

            {status === 'qr' && (
              <div className="text-center flex flex-col items-center">
                {pairingCode ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 inline-block w-full max-w-sm text-center">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Votre code de liaison</h4>
                    <div className="text-4xl font-mono font-bold text-accent tracking-[0.2em] mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      {pairingCode}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Sur votre téléphone : WhatsApp &gt; Appareils connectés &gt; Connecter avec numéro de téléphone &gt; Entrez ce code.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 inline-block">
                      <QRCode value={qrCode} size={256} />
                    </div>
                    <h3 className="text-lg font-bold text-secondary mb-2">Scannez ce QR Code</h3>
                    <p className="text-gray-500 max-w-md mx-auto text-sm mb-6">
                      1. Ouvrez WhatsApp sur votre téléphone<br/>
                      2. Allez dans <strong>Paramètres</strong> &gt; <strong>Appareils connectés</strong><br/>
                      3. Cliquez sur <strong>Connecter un appareil</strong> et scannez ce code.
                    </p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      <button 
                        onClick={() => {
                          const phone = window.prompt("Veuillez entrer le numéro WhatsApp (ex: 212612345678) pour recevoir un code à 8 chiffres :");
                          if (phone) {
                            setIsRequestingPairing(true);
                            fetch('https://majolica.136.116.62.73.nip.io/api/request-pairing-code', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phone })
                            })
                            .then(res => res.json())
                            .then(data => {
                              setIsRequestingPairing(false);
                              if (data.code) setPairingCode(data.code);
                              else alert("Erreur: " + data.error);
                            })
                            .catch(err => {
                              setIsRequestingPairing(false);
                              alert("Erreur de connexion");
                            });
                          }
                        }}
                        className="btn bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        disabled={isRequestingPairing}
                      >
                        {isRequestingPairing ? "Génération..." : "Erreur de scan ? Connecter par numéro"}
                      </button>
                      <button 
                        onClick={async () => {
                          if(window.confirm("Voulez-vous forcer la réinitialisation ? Utilisez ceci si le scan ne marche pas ou pour changer de téléphone.")) {
                            setStatus('starting');
                            try {
                              await fetch('https://majolica.136.116.62.73.nip.io/api/whatsapp-logout', { method: 'POST' });
                            } catch(e) {}
                          }
                        }}
                        className="btn bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                      >
                        🔄 Forcer la réinitialisation / Réparer
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-secondary mb-2">Connecté avec succès !</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Le robot WhatsApp fonctionne en arrière-plan. Il enverra automatiquement les messages de confirmation aux clientes.
                </p>
                <button 
                  onClick={async () => {
                    if(window.confirm("Voulez-vous vraiment déconnecter ce numéro WhatsApp pour en utiliser un autre ?")) {
                      setStatus('starting');
                      try {
                        await fetch('https://majolica.136.116.62.73.nip.io/api/whatsapp-logout', { method: 'POST' });
                      } catch(e) {}
                    }
                  }}
                  className="btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  Déconnecter / Changer de numéro
                </button>
              </div>
            )}
          </div>
        </div>

        )}

        {/* TAB: Admin & Securite */}
        {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary">Notification Gérante</h2>
                <p className="text-sm text-gray-500">Numéro pour recevoir les alertes</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="input-group">
                <label>Numéro de téléphone WhatsApp</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="Ex: 212600000000"
                    className="input-field font-mono"
                  />
                  <button 
                    onClick={handleSavePhone}
                    className="btn btn-primary px-6 flex items-center gap-2"
                  >
                    <Save size={18} />
                    {isPhoneSaved ? 'Enregistré' : 'Sauver'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Mettez l'indicatif pays sans le '+' (ex: 212 au lieu de 0).
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black">DH</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary">Charges Fixes & Admin</h2>
                <p className="text-sm text-gray-500">Loyer, charges et accès administrateur</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="input-group">
                <label>Montant du Loyer Mensuel (MAD)</label>
                <input 
                  type="number" 
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="Ex: 5500"
                  className="input-field font-bold text-orange-600"
                />
              </div>
              <div className="input-group">
                <label>Estimation Eau & Électricité Mensuelle (MAD)</label>
                <input 
                  type="number" 
                  value={monthlyElec}
                  onChange={(e) => setMonthlyElec(e.target.value)}
                  placeholder="Ex: 1500"
                  className="input-field font-bold text-blue-600"
                />
              </div>
              <div className="input-group">
                <label>Email de la Patronne (Admin) - <span className="text-xs text-red-500">Donne accès total. Laissez vide pour accès total à tous.</span></label>
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Ex: patronne@majolica.com"
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label>Code PIN du Caissier (4 chiffres)</label>
                <input 
                  type="text" 
                  value={cashierPin}
                  onChange={(e) => setCashierPin(e.target.value)}
                  placeholder="Ex: 0000"
                  maxLength="4"
                  className="input-field font-bold tracking-[0.5em]"
                />
              </div>
              <div className="input-group">
                <label>Code PIN Administrateur (Master PIN)</label>
                <input 
                  type="text" 
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Ex: 1234"
                  maxLength="8"
                  className="input-field font-bold tracking-[0.5em] text-red-600"
                />
                <p className="text-xs text-gray-400 mt-1">Utilisé pour déverrouiller le mode Admin depuis la caisse.</p>
              </div>
              <button 
                onClick={handleSaveFixedCharges}
                className="btn btn-primary w-full flex justify-center items-center gap-2 mt-2"
              >
                <Save size={18} />
                {isConfigSaved ? 'Enregistré avec succès' : 'Sauvegarder les configurations'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-1">
                Ces montants seront automatiquement déduits des bénéfices chaque mois sur le Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Authentication Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-secondary">Créer le mot de passe Patronne</h2>
              <p className="text-gray-500 text-sm">Créez le mot de passe pour l'email de la patronne ({adminEmail || 'Email non renseigné'})</p>
            </div>
          </div>
          
          {authStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <p>{authMessage}</p>
            </div>
          )}
          {authStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{authMessage}</p>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Administrateur</label>
              <input 
                type="email" 
                value={adminEmail}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">L'email se modifie dans la section "Charges Fixes & Admin" au-dessus.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Votre mot de passe secret"
                required
                minLength="6"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-secondary outline-none focus:border-red-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Le mot de passe doit contenir au moins 6 caractères.</p>
            </div>
            
            <div className="pt-2">
              <button 
                type="submit"
                className="btn-primary w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-red-600/20"
              >
                <UserPlus size={18} />
                Créer le compte
              </button>
            </div>
          </form>
        </div>
        </div>
        )}

        {/* TAB: Imprimante */}
        {activeTab === 'printer' && (
        <div className="glass rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Printer size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary">Configuration Imprimante & Ticket</h2>
              <p className="text-sm text-gray-500">Gérez l'impression automatique et l'en-tête du ticket de caisse.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2">Réseau Imprimante (Tenda)</h3>
              <div className="input-group">
                <label>Adresse IP Imprimante</label>
                <input 
                  type="text" 
                  value={printerIp} 
                  onChange={(e) => setPrinterIp(e.target.value)} 
                  className="input-field font-mono" 
                  placeholder="Ex: 192.168.1.100" 
                />
                <p className="text-xs text-gray-400 mt-1">Laissez vide pour désactiver l'impression automatique TCP.</p>
              </div>
              
              <div className="input-group mt-4">
                <label>Taille du papier (Largeur du ticket)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="paperSize" 
                      value="80mm" 
                      checked={printerPaperSize === '80mm'} 
                      onChange={() => setPrinterPaperSize('80mm')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">80mm (Standard)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="paperSize" 
                      value="58mm" 
                      checked={printerPaperSize === '58mm'} 
                      onChange={() => setPrinterPaperSize('58mm')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">58mm (Petit)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2">Informations Ticket</h3>
              <div className="input-group">
                <label>Nom du magasin</label>
                <input type="text" value={ticketShopName} onChange={(e) => setTicketShopName(e.target.value)} className="input-field" placeholder="MAJOLICA POS" />
              </div>
              <div className="input-group">
                <label>Adresse</label>
                <input type="text" value={ticketAddress} onChange={(e) => setTicketAddress(e.target.value)} className="input-field" placeholder="Ex: Tanger, Maroc" />
              </div>
              <div className="input-group">
                <label>Téléphone</label>
                <input type="text" value={ticketPhone} onChange={(e) => setTicketPhone(e.target.value)} className="input-field" placeholder="Ex: 06 00 00 00 00" />
              </div>
              <div className="input-group">
                <label>Lien Réservation (QR Code)</label>
                <input type="text" value={ticketQrLink} onChange={(e) => setTicketQrLink(e.target.value)} className="input-field" placeholder="Ex: https://majolicabeauty.com/booking" />
                <p className="text-xs text-gray-400 mt-1">Un code QR sera généré à la fin du ticket si ce champ est rempli.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSavePrinterConfig}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {isPrinterSaved ? 'Enregistré' : 'Sauvegarder Imprimante'}
            </button>
          </div>
        </div>
        )}

        {/* TAB: Personnalisation Caisse */}
        {activeTab === 'pos' && (
        <div className="glass rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary">Personnalisation de la Caisse</h2>
              <p className="text-sm text-gray-500">Ajustez la taille du panier et des produits (Zoom) directement dans la caisse.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-bold text-secondary">Activer le mode personnalisation</h3>
              <p className="text-xs text-gray-500">Affiche un bouton ⚙️ dans la caisse pour régler la largeur et le zoom.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={posCustomMode}
                onChange={(e) => {
                  const val = e.target.checked;
                  setPosCustomMode(val);
                  localStorage.setItem('pos_custom_mode_enabled', val.toString());
                }}
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
