import React, { useState, useEffect, useMemo } from 'react';
import { Users, Phone, Star, Search, Award, Ban, Trash2, Megaphone, CheckSquare, Square, Edit2, X, Crown, CreditCard } from 'lucide-react';
import { fetchHistory, fetchReservations, fetchDeletedClients, saveDeletedClients, fetchBlockedClients, saveBlockedClients, updateClientGlobal, fetchClubMembers, saveClubMember, deleteClubMember } from '../services/api';
import VirtualCardModal from '../components/VirtualCardModal';

const Clients = () => {
  const [history, setHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [blockedClients, setBlockedClients] = useState([]);
  const [deletedClients, setDeletedClients] = useState([]);
  const [clubMembers, setClubMembers] = useState([]);
  
  // Virtual Card Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardClient, setSelectedCardClient] = useState(null);
  
  // Bulk selection state
  const [selectedClients, setSelectedClients] = useState([]);
  const [sendingProgress, setSendingProgress] = useState(null); // { current: 0, total: 0 }

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    fetchHistory().then(setHistory);
    fetchReservations().then(setReservations);
    fetchBlockedClients().then(setBlockedClients);
    fetchDeletedClients().then(setDeletedClients);
    fetchClubMembers().then(setClubMembers);
  }, []);

  const handleBlock = async (phone) => {
    if (phone === 'Non renseigné') return;
    const isBlocked = blockedClients.includes(phone);
    if (window.confirm(isBlocked ? "Débloquer cette cliente ?" : "Bloquer cette cliente ? Elle sera marquée en rouge.")) {
      let newBlocked;
      if (isBlocked) {
        newBlocked = blockedClients.filter(p => p !== phone);
      } else {
        newBlocked = [...blockedClients, phone];
      }
      setBlockedClients(newBlocked);
      saveBlockedClients(newBlocked);
    }
  };

  const handleToggleClub = async (client) => {
    const isClub = clubMembers.find(m => m.phone === client.phone);
    if (isClub) {
      if (window.confirm(`Voulez-vous retirer le statut VIP (Club) Ǹ ${client.name} ?`)) {
        await deleteClubMember(client.phone);
        const updated = await fetchClubMembers();
        setClubMembers(updated);
      }
    } else {
      if (window.confirm(`Abonner ${client.name} au MAJOLICA CLUB (200 DH/An) ?`)) {
        await saveClubMember({
          name: client.name,
          phone: client.phone,
          clubJoinDate: new Date().toISOString()
        });
        const updated = await fetchClubMembers();
        setClubMembers(updated);
      }
    }
  };

  const handleShowCard = (client) => {
    const clubData = clubMembers.find(m => m.phone === client.phone);
    setSelectedCardClient({ ...client, clubJoinDate: clubData?.clubJoinDate });
    setIsCardModalOpen(true);
  };

  const handleDelete = async (phone) => {
    if (window.confirm("Supprimer cette cliente de la liste ?")) {
      const newDeleted = [...deletedClients, phone];
      setDeletedClients(newDeleted);
      await saveDeletedClients(newDeleted);
      setSelectedClients(selectedClients.filter(p => p !== phone)); // unselect if deleted
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    if (window.confirm(`Voulez-vous vraiment supprimer les ${selectedClients.length} clientes sélectionnées ?`)) {
      const newDeleted = [...deletedClients, ...selectedClients];
      setDeletedClients(newDeleted);
      await saveDeletedClients(newDeleted);
      setSelectedClients([]); // unselect all
    }
  };

  const handleSendAd = (client) => {
    if (!client.phone || client.phone === 'Non renseigné') {
       alert("Le numéro de téléphone est indisponible pour cette cliente.");
       return;
    }
    const defaultMsg = `Bonjour ${client.name} 🌸,\n\nÇa fait un petit moment qu'on ne s'est pas vu chez Majolica Beauty Studio ! ✨\n\nPour vous remercier de votre fidélité, on voulait juste vous faire un petit coucou et vous dire qu'on a de superbes nouveautés qui vous attendent au salon. 💅\n\nN'hésitez pas à nous rendre visite bientôt ou à réserver en ligne. Prenez soin de vous ! ❤️`;
    
    const msg = window.prompt("Message marketing (Pub/Rappel) à envoyer :", defaultMsg);
    if (msg) {
      fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: client.phone, message: msg })
      }).catch(err => console.log("WhatsApp API not reachable"));
      alert("Le message a bien été envoyé ! 🚀");
    }
  };

  // Helper for Spintax
  const parseSpintax = (text) => {
    let newText = text;
    const matches = newText.match(/\{[^{}]+\}/g);
    if (matches) {
      matches.forEach(match => {
        const options = match.slice(1, -1).split('|');
        const randomOption = options[Math.floor(Math.random() * options.length)];
        newText = newText.replace(match, randomOption);
      });
    }
    return newText;
  };

  const handleBulkSendAd = async () => {
    if (selectedClients.length === 0) return;
    
    const defaultMsg = `{Bonjour|Coucou|Salut} 🌸,\n\n{Ça fait un petit moment qu'on ne s'est pas vu|On espère que vous allez bien|Tu nous as manqué} chez Majolica Beauty Studio ! ✨\n\nPour vous remercier de votre fidélité, on voulait juste vous faire un petit coucou et vous dire qu'on a de superbes nouveautés qui vous attendent au salon. 💅\n\nN'hésitez pas à nous rendre visite bientôt ou à réserver en ligne. Prenez soin de vous ! ❤️`;
    
    const msg = window.prompt(`Message marketing à envoyer à ${selectedClients.length} clientes\n(Astuce: Utilisez {Mot1|Mot2} pour varier les messages et éviter le blocage) :`, defaultMsg);
    
    if (msg) {
      setSendingProgress({ current: 0, total: selectedClients.length });
      
      let count = 0;
      for (const phone of selectedClients) {
        // Find the client name to customize if possible
        const clientObj = filteredClients.find(c => c.phone === phone);
        let personalizedMsg = msg.replace(/\{Bonjour\|Coucou\|Salut\} 🌸/gi, `{Bonjour|Coucou|Salut} ${clientObj ? clientObj.name : ''} 🌸`);
        
        // Parse Spintax
        personalizedMsg = parseSpintax(personalizedMsg);

        try {
          await fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, message: personalizedMsg })
          });
        } catch(err) {
          console.log("WhatsApp API not reachable for " + phone);
        }
        
        count++;
        setSendingProgress({ current: count, total: selectedClients.length });

        // Add random delay between 5000 and 12000 ms if not the last client
        if (count < selectedClients.length) {
          const randomDelay = Math.floor(Math.random() * 7000) + 5000;
          await new Promise(r => setTimeout(r, randomDelay));
        }
      }
      
      setSendingProgress(null);
      alert(`Les ${selectedClients.length} messages ont été envoyés avec succès ! 🚀`);
      setSelectedClients([]); // Clear selection after sending
    }
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setEditName(client.name !== 'Inconnu' ? client.name : '');
    setEditPhone(client.phone !== 'Non renseigné' ? client.phone : '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    await updateClientGlobal(
      editingClient.name,
      editingClient.phone,
      editName || 'Inconnu',
      editPhone || 'Non renseigné'
    );

    setIsEditModalOpen(false);
    setEditingClient(null);

    // Refresh data
    fetchHistory().then(setHistory);
    fetchReservations().then(setReservations);
  };

  // Aggregate clients from history and reservations
  const clientsData = useMemo(() => {
    const clientsMap = {};
    
    // Helper to process a record
    const processRecord = (record, isSale) => {
      if (!record.clientName && !record.clientPhone && !record.name && !record.phone) return;
      
      const name = record.clientName || record.name || 'Inconnu';
      const phone = record.clientPhone || record.phone || 'Non renseigné';
      const clientId = phone !== 'Non renseigné' ? phone : name;
      
      if (!clientsMap[clientId]) {
        const clubData = clubMembers.find(m => m.phone === phone);
        clientsMap[clientId] = {
          id: clientId,
          name: name,
          phone: phone,
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: record.timestamp || record.date,
          isClubMember: !!clubData,
          clubJoinDate: clubData?.clubJoinDate
        };
      }
      
      if (isSale) {
        clientsMap[clientId].totalVisits += 1;
        clientsMap[clientId].totalSpent += record.total || 0;
      }
      
      const recordDate = new Date(record.timestamp || record.date);
      const currentDate = new Date(clientsMap[clientId].lastVisit);
      if (recordDate > currentDate) {
        clientsMap[clientId].lastVisit = record.timestamp || record.date;
      }
    };

    history.forEach(order => processRecord(order, true));
    reservations.forEach(res => processRecord(res, false));
    
    // Ensure all club members are in the list even without history
    clubMembers.forEach(member => {
      const clientId = member.phone || member.name;
      if (!clientsMap[clientId]) {
        clientsMap[clientId] = {
          id: clientId,
          name: member.name || 'Inconnu',
          phone: member.phone || 'Non renseigné',
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: member.clubJoinDate || new Date().toISOString(),
          isClubMember: true,
          clubJoinDate: member.clubJoinDate
        };
      }
    });

    return Object.values(clientsMap)
      .filter(c => !deletedClients.includes(c.phone) && !deletedClients.includes(c.name))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [history, reservations, clubMembers, deletedClients]);

  const filteredClients = clientsData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const validClients = filteredClients.filter(c => c.phone !== 'Non renseigné');
  const isAllSelected = validClients.length > 0 && selectedClients.length === validClients.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedClients([]);
    } else {
      setSelectedClients(validClients.map(c => c.phone));
    }
  };

  const toggleClientSelection = (phone) => {
    if (phone === 'Non renseigné') return;
    if (selectedClients.includes(phone)) {
      setSelectedClients(selectedClients.filter(p => p !== phone));
    } else {
      setSelectedClients([...selectedClients, phone]);
    }
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="page-header mb-0 flex items-center gap-3">
          <Users className="text-accent" size={32} /> Fichier Client
        </h1>
        
        <div className="glass px-4 py-2 flex items-center gap-2 w-full sm:w-auto">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un nom, téléphone..." 
            className="bg-transparent border-none text-secondary outline-none w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="glass p-6 flex items-center gap-4">
          <div className="p-4 bg-accent/20 rounded-2xl text-accent">
            <Users size={28} />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium">Total Clientes Enregistrées</div>
            <div className="text-3xl font-bold text-secondary">{clientsData.length}</div>
          </div>
        </div>

        <div className="glass p-6 flex items-center gap-4">
          <div className="p-4 bg-yellow-500/20 rounded-2xl text-yellow-600">
            <Award size={28} />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium">Top Cliente (Chiffre d'Affaire)</div>
            <div className="text-2xl font-bold text-secondary truncate max-w-[200px]">
              {clientsData.length > 0 ? clientsData[0].name : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <Star size={20} className="text-yellow-500" /> Classement des Clientes Fidèles
          </h2>
          {selectedClients.length > 0 && (
            <div className="flex gap-3">
              {sendingProgress ? (
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-semibold">Envoi en cours : {sendingProgress.current} / {sendingProgress.total}...</span>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleBulkDelete}
                    className="btn flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm"
                  >
                    <Trash2 size={18} />
                    Supprimer ({selectedClients.length})
                  </button>
                  <button 
                    onClick={handleBulkSendAd}
                    className="btn btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-pulse"
                  >
                    <Megaphone size={18} />
                    Pub / Promo ({selectedClients.length})
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="p-4 text-gray-500 font-medium w-12 text-center">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-secondary">
                  {isAllSelected ? <CheckSquare size={20} className="text-accent" /> : <Square size={20} />}
                </button>
              </th>
              <th className="p-4 text-gray-500 font-medium">Nom de la Cliente</th>
              <th className="p-4 text-gray-500 font-medium">Téléphone</th>
              <th className="p-4 text-gray-500 font-medium text-center">Visites</th>
              <th className="p-4 text-gray-500 font-medium text-right">Total Dépensé</th>
              <th className="p-4 text-gray-500 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-400">
                  Aucune cliente trouvée.
                </td>
              </tr>
            ) : (
              filteredClients.map((client, i) => {
                const isBlocked = blockedClients.includes(client.phone);
                const isSelected = selectedClients.includes(client.phone);
                const hasPhone = client.phone !== 'Non renseigné';
                return (
                  <tr key={client.id} className={`border-b border-glass-border transition-colors ${isBlocked ? 'bg-red-50/50 opacity-75' : isSelected ? 'bg-accent/5' : 'hover:bg-white/30'}`}>
                    <td className="p-4 text-center">
                      {hasPhone && (
                        <button 
                          onClick={() => toggleClientSelection(client.phone)} 
                          className="text-gray-400 hover:text-secondary"
                        >
                          {isSelected ? <CheckSquare size={20} className="text-accent" /> : <Square size={20} />}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${isBlocked ? 'bg-red-400' : (i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-secondary')}`}>
                          {i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold flex items-center gap-2 ${isBlocked ? 'text-red-700 line-through' : 'text-secondary'}`}>
                            {client.name}
                            {client.isClubMember && <Crown size={14} className="text-yellow-500" title="Membre VIP Club" />}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="opacity-50" /> {client.phone}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${isBlocked ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {client.totalVisits}
                      </span>
                    </td>
                    <td className={`p-4 font-bold text-right text-lg ${isBlocked ? 'text-red-700' : 'text-accent'}`}>
                      {client.totalSpent.toFixed(2)} MAD
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {client.isClubMember ? (
                          <button 
                            onClick={() => handleShowCard(client)}
                            title="Voir la Carte VIP"
                            className="p-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 hover:from-yellow-200 hover:to-yellow-300 rounded-lg transition-colors border border-yellow-300 shadow-sm"
                          >
                            <CreditCard size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleClub(client)}
                            title="Ajouter au Club (VIP)"
                            className="p-2 bg-gray-50 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-gray-200 hover:border-yellow-200"
                          >
                            <Crown size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEdit(client)}
                          title="Modifier"
                          className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleSendAd(client)}
                          title="Envoyer une Pub / Message"
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                          <Megaphone size={16} />
                        </button>
                        <button 
                          onClick={() => handleBlock(client.phone)}
                          title={isBlocked ? "Débloquer" : "Bloquer"}
                          className={`p-2 rounded-lg transition-colors border ${isBlocked ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300' : 'bg-orange-50 text-orange-500 hover:bg-orange-100 border-orange-200'}`}
                        >
                          <Ban size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.phone !== 'Non renseigné' ? client.phone : client.name)}
                          title="Supprimer"
                          className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-secondary">
                <Edit2 size={24} className="text-accent" />
                Modifier Cliente
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="input-group">
                <label>Nom de la Cliente</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Ex: Sarah"
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label>Téléphone</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Ex: 0600000000"
                  className="input-field"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="btn btn-secondary flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <VirtualCardModal 
        isOpen={isCardModalOpen} 
        onClose={() => setIsCardModalOpen(false)} 
        client={selectedCardClient}
        onRemoveVIP={() => {
          handleToggleClub(selectedCardClient);
          setIsCardModalOpen(false);
        }}
      />
    </div>
  );
};

export default Clients;
