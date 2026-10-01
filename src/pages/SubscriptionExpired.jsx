import React from 'react';
import { AlertTriangle, LogOut, Phone } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const SubscriptionExpired = () => {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-red-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
        
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={48} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Abonnement Expiré</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Votre abonnement Smart Salon est arrivé à son terme. 
          Veuillez contacter le support pour renouveler votre accès et retrouver toutes vos données.
        </p>

        <div className="space-y-4">
          <a 
            href="https://wa.me/212600000000" // Remplacez par le numéro du Super-Admin
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            <Phone size={20} />
            Contacter le Support
          </a>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
