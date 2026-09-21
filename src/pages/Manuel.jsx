
import React from 'react';
import { BookOpen } from 'lucide-react';

const Manuel = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-10 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BookOpen size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Manuel d'Utilisation</h1>
          <p className="text-white/80 text-lg">Guide complet pour la gestion de Majolica POS</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">📖 Manuel d'Utilisation Complet & Détaillé - Majolica Beauty Studio</h1>

<p className="mb-4 text-gray-700 leading-relaxed text-lg">Bienvenue dans le guide de formation de <strong className="font-bold text-gray-900">Majolica POS</strong>. Ce document vous explique <strong className="font-bold text-gray-900">étape par étape</strong> comment utiliser chaque fonctionnalité du système.</p>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">1. 🔐 Démarrage et Accès au Système</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">L'écran de connexion protège vos données et différencie le personnel de la direction.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789999028795.png" alt="Capture Écran Login" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment se connecter ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Pour le Caissier / Personnel :</strong> Cliquez sur l'onglet "Caissier", cliquez dans la case "Code PIN", tapez le code à 4 chiffres fourni par la direction, puis cliquez sur <strong className="font-bold text-gray-900">Se connecter</strong>.</li>
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Pour l'Administrateur (Patronne) :</strong> Cliquez sur l'onglet "Patronne", entrez votre adresse e-mail et votre mot de passe administrateur, puis cliquez sur <strong className="font-bold text-gray-900">Se connecter</strong>. L'administrateur a accès à des pages cachées (comme le Dashboard et les Paramètres).</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">2. 💰 La Caisse (Écran POS)</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">C'est ici que vous encaissez les clients rapidement.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998831476.png" alt="Capture Écran Caisse" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment prendre une commande et encaisser ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Choisir la catégorie :</strong> En haut de l'écran, cliquez sur le bouton rouge ou blanc correspondant au type de soin (ex: <em className="text-gray-600">Manucure</em>, <em className="text-gray-600">Pédicure</em>).</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Ajouter un service :</strong> Cliquez sur la case du service souhaité (ex: <em className="text-gray-600">Manucure classique</em>). Il s'ajoutera automatiquement dans le <strong className="font-bold text-gray-900">Ticket Actuel</strong> sur la droite de l'écran.</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Modifier le ticket :</strong> Dans le ticket à droite, vous pouvez cliquer sur `+` ou `-` pour changer la quantité, ou sur l'icône de poubelle pour retirer un article.</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Appliquer une réduction Club :</strong> Si la cliente est membre du VIP Club, recherchez son nom dans la barre en haut du ticket pour lui appliquer le "Prix Club".</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Encaisser :</strong> Cliquez sur le gros bouton <strong className="font-bold text-gray-900">Encaisser</strong> en bas à droite. Une fenêtre s'ouvre : choisissez le mode de paiement (Espèces, Carte Bancaire, ou Mixte), puis validez. Le ticket s'imprimera tout seul !</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">3. 📅 Réservations et Rendez-vous (Agenda)</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Gérez le flux de vos clients sans stress ni double réservation.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998849153.png" alt="Capture Écran Réservations" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment ajouter un nouveau Rendez-vous ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed">Cliquez sur le bouton <strong className="font-bold text-gray-900">+ Nouveau RDV</strong> en haut à droite.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Saisissez le nom de la cliente et son numéro de téléphone.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Choisissez le jour et l'heure prévus, ainsi que l'employée demandée (ex: <em className="text-gray-600">Celine</em> ou <em className="text-gray-600">Leaticia</em>).</li>
<li className="mb-3 text-gray-700 leading-relaxed">Sélectionnez les prestations qu'elle souhaite faire.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Cliquez sur <strong className="font-bold text-gray-900">Enregistrer</strong>. Le RDV apparaîtra dans la colonne de l'employée.</li>
</ul>

<strong className="font-bold text-gray-900">👉 Comment transformer un RDV en encaissement ?</strong>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Une fois que la cliente a terminé son soin, cliquez sur son rendez-vous dans l'agenda, puis cliquez sur le bouton <strong className="font-bold text-gray-900">Envoyer à la caisse</strong>. Le ticket sera préparé automatiquement, vous n'aurez plus qu'à encaisser !</p>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">4. 👑 Club et Fichier Client</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Récompensez la fidélité de vos clientes.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998867413.png" alt="Capture Écran Fiche Client" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment ajouter une cliente et voir son historique ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed">Allez dans l'onglet <strong className="font-bold text-gray-900">Fichier Client</strong>. Vous verrez la liste de toutes les clientes enregistrées, classées par fidélité.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Pour ajouter une nouvelle cliente, allez dans l'onglet <strong className="font-bold text-gray-900">Abonnements (Club)</strong> et cliquez sur <strong className="font-bold text-gray-900">+ Nouvel Abonnement</strong>. Saisissez ses informations.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Dès qu'elle est inscrite, ses futurs passages en caisse se feront au tarif "Prix Club" si vous sélectionnez son nom lors de l'encaissement.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">5. 💅 Catalogue des Prestations</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">C'est ici que vous définissez les prix de votre salon.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998883600.png" alt="Capture Écran Prestations" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment ajouter ou modifier un soin ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Ajouter :</strong> Regardez le formulaire "Ajouter un service" sur la droite. Remplissez le nom (ex: <em className="text-gray-600">Soin de visage</em>), le prix normal (ex: <em className="text-gray-600">300</em>), le prix club (ex: <em className="text-gray-600">250</em>), la catégorie, et la durée. Cliquez sur le bouton gris <strong className="font-bold text-gray-900">+ Ajouter service</strong>.</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Modifier/Supprimer :</strong> Sur chaque case de prestation au milieu de l'écran, vous avez un petit bouton "Stylo" pour changer le prix, et un bouton "Poubelle" pour la supprimer définitivement.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">6. 👥 Gestion des Employés</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Suivez votre équipe, leurs plannings et leurs salaires.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998977217.png" alt="Capture Écran Employés" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment ajouter un nouvel employé au système ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed">Allez dans l'onglet <strong className="font-bold text-gray-900">Employés</strong>.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Dans le panneau de droite "Ajouter un employé", tapez son nom complet.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Choisissez son Rôle (Coiffeuse/Onglerie, Manager, etc.).</li>
<li className="mb-3 text-gray-700 leading-relaxed">Tapez son Salaire de Base (ex: 3000) et choisissez sa date d'entrée.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Cliquez sur <strong className="font-bold text-gray-900">Ajouter au personnel</strong>. L'employé apparaîtra désormais dans la liste lors des réservations.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">7. 📦 Inventaire et Stock</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Évitez les ruptures de stock de vos produits (vernis, crèmes).</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998900148.png" alt="Capture Écran Inventaire" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment gérer le stock ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed">Utilisez le bouton d'ajout pour entrer un nouveau produit (ex: <em className="text-gray-600">Vernis Rouge OPI</em>), son coût d'achat, et la quantité reçue.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Le système déduira automatiquement les quantités ou vous avertira dans la case <strong className="font-bold text-gray-900">Alertes Rupture</strong> (en rouge) quand un produit est presque épuisé.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">8. 💸 Dépenses et Achats</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">C'est crucial pour que le tiroir-caisse physique corresponde au système.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998955343.png" alt="Capture Écran Dépenses" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment enregistrer une dépense (Avance salaire, Achat matériel) ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-3 text-gray-700 leading-relaxed">Cliquez sur le bouton noir <strong className="font-bold text-gray-900">+ Nouvel Achat / Dépense</strong> en haut à droite.</li>
<li className="mb-3 text-gray-700 leading-relaxed">Écrivez la description (ex: <em className="text-gray-600">Avance sur salaire - Celine</em> ou <em className="text-gray-600">Achat Serviettes</em>).</li>
<li className="mb-3 text-gray-700 leading-relaxed">Saisissez le montant (ex: 200).</li>
<li className="mb-3 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Très important :</strong> Choisissez si cet argent a été pris du tiroir <strong className="font-bold text-gray-900">Caisse</strong> ou payé depuis votre <strong className="font-bold text-gray-900">Poche / Banque</strong>. (Seules les dépenses "Caisse" diminuent l'argent physique attendu dans le tiroir à la fin de la journée).</li>
<li className="mb-3 text-gray-700 leading-relaxed">Validez.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">9. 📱 Centre WhatsApp (WhatsApp Hub)</h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Votre outil marketing intégré.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789998928942.png" alt="Capture Écran WhatsApp" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment ça marche ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-2 text-gray-700 leading-relaxed">La première fois, vous devez scanner le QR Code avec votre téléphone (comme pour WhatsApp Web).</li>
<li className="mb-2 text-gray-700 leading-relaxed">Ensuite, le système enverra automatiquement des messages de confirmation aux clientes lorsqu'elles prennent un RDV. Vous pourrez voir toutes les discussions directement ici.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">10. 📊 Tableau de Bord (Dashboard) - <em className="text-gray-600">Accès Admin Uniquement</em></h2>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Votre outil de contrôle financier total.</p>

<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789999008247.png" alt="Capture Écran Dashboard 1" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>
<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789999028795.png" alt="Capture Écran Dashboard 2" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Comment lire les chiffres ?</strong>
<ul className="list-disc pl-6 mb-6 space-y-2">
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Filtre de période :</strong> En haut, choisissez "Aujourd'hui", "Ce mois", etc., pour voir les résultats d'une période précise.</li>
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Reste Caisse (Vert) :</strong> ⚠️ C'est le montant EXACT en <strong className="font-bold text-gray-900">argent liquide</strong> (espèces) qui doit se trouver physiquement dans votre tiroir-caisse (le coffre du salon). <strong className="font-bold text-gray-900">Ce n'est pas l'argent en banque.</strong> Le système calcule cela en prenant tout l'argent encaissé, moins toutes les dépenses que vous avez payées directement depuis la caisse.</li>
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Sorties Poche / Banque :</strong> C'est l'argent que vous avez dépensé avec votre propre carte bancaire ou votre poche. Ça ne diminue pas l'argent du tiroir-caisse.</li>
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Bénéfice Net (Rouge/Vert) :</strong> C'est la vraie rentabilité du jour. Il déduit vos provisions (Loyer, Électricité) et les salaires au prorata du jour pour vous dire si vous avez réellement gagné de l'argent.</li>
<li className="mb-2 text-gray-700 leading-relaxed"><strong className="font-bold text-gray-900">Exporter CSV :</strong> Cliquez sur ce bouton vert pour télécharger toutes les données sur Excel et les envoyer à votre comptable.</li>
</ul>

<hr className="my-10 border-t-2 border-gray-100" />

<h2 className="text-2xl font-bold text-primary border-b-2 border-primary/20 pb-2 mt-12 mb-6">⚙️ 11. Paramètres</h2>
<div className="my-8 flex justify-center"><img src="/assets/manuel/media_1789999000495.png" alt="Capture Écran Paramètres" className="rounded-xl shadow-lg border border-gray-200 max-h-[500px] object-contain" /></div>

<strong className="font-bold text-gray-900">👉 Configuration avancée :</strong>
<p className="mb-4 text-gray-700 leading-relaxed text-lg">Dans cet onglet, vous pouvez configurer l'imprimante thermique, gérer les accès de vos administrateurs, modifier les mots de passe, et paramétrer les messages automatiques envoyés par WhatsApp.</p>

<hr className="my-10 border-t-2 border-gray-100" />
<strong className="font-bold text-gray-900">💡 Astuce :</strong> Pensez à faire une "Clôture de Caisse" à la fin de chaque journée pour remettre les compteurs à zéro et bien séparer les jours de travail.

          </div>
        </div>

      </div>
    </div>
  );
};

export default Manuel;
