import React, { useState, useEffect, useMemo } from 'react';
import { Crown, Search, Plus, Calendar, AlertCircle, CheckCircle2, CreditCard, Clock, Phone, Trash2, X } from 'lucide-react';
import { fetchClubMembers, saveClubMember, deleteClubMember } from '../services/api';
import VirtualCardModal from '../components/VirtualCardModal';

const Club = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Member Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  // Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const data = await fetchClubMembers();
    setMembers(data);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const joinDate = new Date();
    const clientData = {
      name: newName,
      phone: newPhone,
      clubJoinDate: joinDate.toISOString()
    };

    await saveClubMember(clientData);
    await loadMembers();
    
    // Ouvrir la carte directement
    setSelectedClient(clientData);
    setIsCardModalOpen(true);
    
    // Reset form
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleRemoveMember = async (phone, name) => {
    if (window.confirm(`Voulez-vous vraiment annuler l'abonnement de ${name} ?`)) {
      await deleteClubMember(phone);
      await loadMembers();
      setIsCardModalOpen(false);
    }
  };

  const getStatus = (joinDate) => {
    if (!joinDate) return { text: 'Inconnu', color: 'gray' };
    
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 1); // Toujours 1 an par défaut
    
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: 'Expiré', color: 'red', icon: <AlertCircle size={16} /> };
    } else if (daysLeft <= 30) {
      return { text: `Expire dans ${daysLeft}j`, color: 'orange', icon: <Clock size={16} /> };
    } else {
      return { text: 'Actif', color: 'green', icon: <CheckCircle2 size={16} /> };
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    const lower = searchTerm.toLowerCase();
    return members.filter(m => 
      (m.name && m.name.toLowerCase().includes(lower)) || 
      (m.phone && m.phone.includes(searchTerm))
    );
  }, [members, searchTerm]);

  // Stat computations
  const totalActive = members.filter(m => getStatus(m.clubJoinDate).color !== 'red').length;
  const totalExpired = members.filter(m => getStatus(m.clubJoinDate).color === 'red').length;
  const totalExpiringSoon = members.filter(m => getStatus(m.clubJoinDate).color === 'orange').length;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 font-serif">
            <span className="p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 rounded-2xl shadow-sm">
              <Crown size={28} />
            </span>
            Abonnements VIP
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gérez les cartes club Majolica de vos clientes.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-gray-900/20 flex items-center gap-2 hover:scale-105 transition-transform"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Annuler' : 'Nouvel Abonnement'}
        </button>
      </div>

      {/* STASTISQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shrink-0 z-10">
            <CheckCircle2 size={24} />
          </div>
          <div className="z-10">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Abonnements Actifs</div>
            <div className="text-3xl font-black text-gray-900">{totalActive}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 z-10">
            <Clock size={24} />
          </div>
          <div className="z-10">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Expire Bientôt</div>
            <div className="text-3xl font-black text-gray-900">{totalExpiringSoon}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 z-10">
            <AlertCircle size={24} />
          </div>
          <div className="z-10">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Expirés</div>
            <div className="text-3xl font-black text-gray-900">{totalExpired}</div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE D'AJOUT */}
      {isAdding && (
        <div className="bg-white rounded-3xl shadow-sm border border-yellow-200 p-8 mb-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-serif text-gray-900">
            <Crown size={24} className="text-yellow-500" /> 
            Créer une nouvelle carte VIP
          </h2>
          <form onSubmit={handleAddMember} className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-2">Nom de la cliente</label>
              <input 
                type="text" 
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Sara El Fassi"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors text-lg"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-2">Numéro de téléphone</label>
              <input 
                type="tel" 
                required
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Ex: 0612345678"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors text-lg"
              />
            </div>
            <div className="w-full md:w-auto">
              <button type="submit" className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-colors">
                <CreditCard size={20} />
                Générer la Carte
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTE DES MEMBRES */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Membres Actuels ({filteredMembers.length})</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-50 border-2 border-transparent focus:border-gray-200 rounded-2xl w-full md:w-72 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">Cliente</th>
                <th className="p-5 font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">Téléphone</th>
                <th className="p-5 font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">Date d'inscription</th>
                <th className="p-5 font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">Statut</th>
                <th className="p-5 font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const status = getStatus(member.clubJoinDate);
                const joinDate = member.clubJoinDate ? new Date(member.clubJoinDate).toLocaleDateString('fr-FR') : 'N/A';
                
                return (
                  <tr key={member.phone} className="border-b border-gray-50 hover:bg-yellow-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="font-bold text-gray-900">{member.name || 'Inconnu'}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <Phone size={14} className="text-gray-400" />
                        {member.phone || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        {joinDate}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-100`}>
                        {status.icon}
                        {status.text}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedClient(member);
                            setIsCardModalOpen(true);
                          }}
                          className="p-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 hover:from-yellow-200 hover:to-yellow-300 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 px-4 font-bold text-sm"
                        >
                          <CreditCard size={16} />
                          Ouvrir la Carte
                        </button>
                        <button 
                          onClick={() => handleRemoveMember(member.phone, member.name)}
                          className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                          title="Supprimer l'abonnement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    <Crown size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Aucun abonné trouvé.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VirtualCardModal 
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        client={selectedClient}
        onRemoveVIP={() => handleRemoveMember(selectedClient?.phone, selectedClient?.name)}
      />
    </div>
  );
};

export default Club;
