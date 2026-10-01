import React from 'react';
import { MessageCircle } from 'lucide-react';

const SupportButton = () => {
  // Support number hardcoded for SaaS Admin
  const supportPhone = '212644538903'; 

  const handleSupportClick = () => {
    const text = encodeURIComponent("Bonjour le support Smart-Salon, j'ai besoin d'aide pour mon compte.");
    window.open(`https://wa.me/${supportPhone}?text=${text}`, '_blank');
  };

  return (
    <button 
      onClick={handleSupportClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all hover:scale-105 active:scale-95 group flex items-center justify-center"
      title="Support Technique"
    >
      <MessageCircle size={28} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-300 font-bold">
        Support Technique
      </span>
    </button>
  );
};

export default SupportButton;
