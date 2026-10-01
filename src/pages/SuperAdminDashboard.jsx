import React, { useState, useEffect } from 'react';
import { Shield, Plus, Building, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const SuperAdminDashboard = () => {
  const [salons, setSalons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSalon, setNewSalon] = useState({
    id: '',
    name: '',
    adminEmail: '',
    phone: '',
    isActive: true,
    subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    features: {
      whatsapp: true,
      club: true,
      expenses: true,
      catalog: true
    }
  });

  const fetchSalons = async () => {
    try {
      const snap = await getDocs(collection(db, 'salons'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSalons(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleCreateSalon = async (e) => {
    e.preventDefault();
    try {
      const salonId = newSalon.id || newSalon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      await setDoc(doc(db, 'salons', salonId), {
        ...newSalon,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      fetchSalons();
      
      alert(`Le salon ${newSalon.name} a été créé avec succès.\nID du Salon: ${salonId}`);
    } catch (e) {
      alert("Erreur lors de la création du salon");
      console.error(e);
    }
  };

  const handleToggleStatus = async (salon) => {
    try {
      await updateDoc(doc(db, 'salons', salon.id), {
        isActive: !salon.isActive
      });
      fetchSalons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFeature = async (salon, featureKey) => {
    try {
      const updatedFeatures = {
        ...(salon.features || {}),
        [featureKey]: !(salon.features && salon.features[featureKey])
      };
      await updateDoc(doc(db, 'salons', salon.id), {
        features: updatedFeatures
      });
      fetchSalons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 text-red-600 p-3 rounded-xl">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Super-Admin SaaS</h1>
              <p className="text-gray-500">Gestion des abonnements et des salons</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Plus size={20} />
              Nouveau Salon
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
            >
              <LogOut size={20} />
              Déconnexion
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-gray-500 font-medium">Salon</th>
                <th className="p-4 text-gray-500 font-medium">Contact</th>
                <th className="p-4 text-gray-500 font-medium text-center">Statut</th>
                <th className="p-4 text-gray-500 font-medium text-center">Abonnement</th>
                <th className="p-4 text-gray-500 font-medium text-center">Modules (W/C/D/P)</th>
                <th className="p-4 text-gray-500 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salons.map(salon => {
                const feats = salon.features || { whatsapp: true, club: true, expenses: true, catalog: true };
                return (
                <tr key={salon.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{salon.name}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {salon.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div>{salon.adminEmail}</div>
                    <div className="text-sm">{salon.phone}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${salon.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {salon.isActive ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-gray-700 text-sm">
                    {new Date(salon.subscriptionEnd).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleToggleFeature(salon, 'whatsapp')} className={`p-1 rounded text-xs font-bold ${feats.whatsapp ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`} title="WhatsApp">W</button>
                      <button onClick={() => handleToggleFeature(salon, 'club')} className={`p-1 rounded text-xs font-bold ${feats.club ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`} title="Club VIP">C</button>
                      <button onClick={() => handleToggleFeature(salon, 'expenses')} className={`p-1 rounded text-xs font-bold ${feats.expenses ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`} title="Dépenses">D</button>
                      <button onClick={() => handleToggleFeature(salon, 'catalog')} className={`p-1 rounded text-xs font-bold ${feats.catalog ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`} title="Prestations/Catalogue">P</button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggleStatus(salon)}
                      className={`p-2 rounded-lg transition-colors border ${salon.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}`}
                      title={salon.isActive ? "Suspendre l'accès" : "Réactiver l'accès"}
                    >
                      {salon.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                  </td>
                </tr>
              )})}
              {salons.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-gray-500">
                    Aucun salon inscrit. Ajoutez votre premier client SaaS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Plus size={24} className="text-black" />
                Ajouter un Salon
              </h2>
              
              <form onSubmit={handleCreateSalon} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Salon</label>
                  <input 
                    type="text" 
                    value={newSalon.name}
                    onChange={e => setNewSalon({...newSalon, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Administrateur</label>
                  <input 
                    type="email" 
                    value={newSalon.adminEmail}
                    onChange={e => setNewSalon({...newSalon, adminEmail: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone Contact</label>
                  <input 
                    type="text" 
                    value={newSalon.phone}
                    onChange={e => setNewSalon({...newSalon, phone: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Fin d'Abonnement</label>
                  <input 
                    type="date" 
                    value={newSalon.subscriptionEnd}
                    onChange={e => setNewSalon({...newSalon, subscriptionEnd: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none"
                    required
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 font-medium transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
