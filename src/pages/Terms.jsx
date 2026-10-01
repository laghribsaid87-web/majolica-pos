import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 font-sans pb-20">
      <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">Retour</span>
        </button>

        <h1 className="text-4xl font-black text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-500 mb-8 font-medium">Dernière mise à jour : 22 Septembre 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Présentation du Service</h2>
            <p>
              Smart-Salon est une plateforme SaaS (Software as a Service) destinée aux salons de beauté, coiffure et onglerie. Elle permet la gestion des encaissements, des clients, des abonnements, des employés et l'intégration WhatsApp pour les confirmations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Abonnement et Paiement</h2>
            <p>
              L'accès à Smart-Salon est conditionné par un abonnement (mensuel ou annuel). En cas de non-paiement ou d'expiration de l'abonnement, l'accès au compte sera bloqué jusqu'à régularisation. Vos données sont conservées pendant 6 mois après l'expiration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Protection des Données (RGPD)</h2>
            <p>
              En tant que client (Salon), vous êtes responsable des données personnelles que vous collectez sur vos clients. Smart-Salon s'engage à sécuriser ces données via Google Cloud Firebase et à ne jamais les revendre ou les exploiter à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Support Technique</h2>
            <p>
              Le support technique est inclus dans l'abonnement et accessible via le bouton WhatsApp flottant en bas de l'application, du Lundi au Samedi de 9h à 19h.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Vous serez informé de tout changement majeur directement sur le tableau de bord de votre application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
