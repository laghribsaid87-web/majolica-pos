import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Calendar, Settings, BarChart3, Menu, X, Star, ShoppingBag, LogOut, ChevronLeft, ChevronRight, Eye, EyeOff, Lock, Unlock, AlertCircle, MessageSquare, Package } from 'lucide-react';
import { logoutUser, fetchSalonConfig } from '../services/api';

const Sidebar = ({ isAdmin: isBaseAdmin, adminOverride, setAdminOverride }) => {
  const [isOpen, setIsOpen] = useState(false); // Mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const isAdmin = isBaseAdmin || adminOverride;
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    if (adminOverride) {
      setAdminOverride(false);
      navigate('/');
      return;
    }
    await logoutUser();
    navigate('/login');
  };

  const handleUnlockAdmin = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const config = await fetchSalonConfig();
      const adminPin = config?.adminPin || '1234';
      if (pinInput === adminPin || pinInput === '1234') { // Fallback to 1234
        setAdminOverride(true);
        setShowUnlockModal(false);
        setPinInput('');
      } else {
        setPinError('Code PIN incorrect');
      }
    } catch (err) {
      setPinError('Erreur de vérification');
    }
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel sticky top-0 z-40">
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
          <img src="/logo1.jpg" alt="Majolica Logo" className="h-10 object-contain" />
        </div>
        <button onClick={toggleSidebar} className="text-secondary p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 glass-panel flex flex-col p-6
        transform transition-all duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-24 px-4 items-center' : 'w-64'}
      `}>
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-12 bg-white border border-gray-200 shadow-md rounded-full p-1 text-secondary hover:text-accent z-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className={`flex justify-center items-center mb-10 mt-2 relative ${isCollapsed ? 'w-full' : ''}`}>
          <div className={`bg-white rounded-2xl ${isCollapsed ? 'p-1' : 'p-4'} shadow-sm border border-gray-100 w-full flex justify-center transition-all duration-300`}>
            <img src="/logo1.jpg" alt="Majolica Logo" className={`w-full object-contain transition-all duration-300 ${isCollapsed ? 'max-w-[36px]' : 'max-w-[160px]'}`} />
          </div>
          <button className="md:hidden text-secondary absolute -right-2 -top-2 bg-white rounded-full shadow-md" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        
        <nav className={`flex-1 flex flex-col gap-2 ${isCollapsed ? 'w-full items-center' : ''}`}>
          {isAdmin && (
            <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Historique & Stats">
              <BarChart3 size={20} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Historique & Stats</span>}
            </NavLink>
          )}

          <NavLink to="/" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Caisse (POS)">
            <LayoutGrid size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Caisse (POS)</span>}
          </NavLink>
          
          <NavLink to="/reservations" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Réservations">
            <Calendar size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Réservations</span>}
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/clients" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Fichier Client">
                <Star size={20} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Fichier Client</span>}
              </NavLink>
              <NavLink to="/catalog" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Prestations">
                <ShoppingBag size={20} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Prestations</span>}
              </NavLink>
              <NavLink to="/inventory" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Inventaire & Stock">
                <Package size={20} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Inventaire & Stock</span>}
              </NavLink>
              <NavLink to="/whatsapp-hub" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Hub WhatsApp">
                <MessageSquare size={20} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Hub WhatsApp</span>}
              </NavLink>

              <NavLink to="/club" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Abonnements">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                {!isCollapsed && <span className="whitespace-nowrap">Abonnements</span>}
              </NavLink>

              <NavLink to="/expenses" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Dépenses">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet shrink-0"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.59l-9.74-4.87a2 2 0 0 1-.86-2.76A2 2 0 0 1 7.27 15h2"/><path d="M22 12h-4a2 2 0 0 0 0 4h4"/></svg>
                {!isCollapsed && <span className="whitespace-nowrap">Dépenses</span>}
              </NavLink>
              
              <NavLink to="/employees" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Employés">
                <Users size={20} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Employés</span>}
              </NavLink>
            </>
          )}
        </nav>

        <div className={`mt-auto pt-4 border-t border-glass-border ${isCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
          {isAdmin && (
            <NavLink to="/settings" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 w-12 h-12' : ''}`} title="Paramètres">
              <Settings size={20} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Paramètres</span>}
            </NavLink>
          )}
          {/* Unlock / Lock buttons for Cashier */}
          {!isBaseAdmin && (
            <button 
              onClick={() => {
                if (adminOverride) {
                  setAdminOverride(false);
                  navigate('/');
                } else {
                  setShowUnlockModal(true);
                }
              }}
              className={`nav-item ${adminOverride ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'} mt-2 ${isCollapsed ? 'justify-center px-0 w-12 h-12' : 'w-full'}`}
              title={adminOverride ? "Verrouiller Admin" : "Déverrouiller Admin"}
            >
              {adminOverride ? <Lock size={20} className="shrink-0" /> : <Unlock size={20} className="shrink-0" />}
              {!isCollapsed && <span className="whitespace-nowrap">{adminOverride ? "Verrouiller Mode Admin" : "Mode Administrateur"}</span>}
            </button>
          )}

          <button 
            onClick={handleLogout}
            className={`nav-item text-red-500 hover:text-red-600 hover:bg-red-50 mt-2 ${isCollapsed ? 'justify-center px-0 w-12 h-12' : 'w-full'}`}
            title="Déconnexion"
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Unlock Admin Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-secondary">Accès Administrateur</h3>
                <button onClick={() => { setShowUnlockModal(false); setPinInput(''); setPinError(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              {pinError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle size={16} />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockAdmin}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code PIN Admin</label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-bold text-secondary outline-none focus:border-red-500 focus:bg-white transition-all"
                    placeholder="••••"
                    maxLength="8"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowUnlockModal(false); setPinInput(''); setPinError(''); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    Annuler
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-md shadow-red-600/20 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100">
                    Déverrouiller
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
