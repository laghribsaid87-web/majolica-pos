import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import POS from './pages/POS';
import Employees from './pages/Employees';
import Reservations from './pages/Reservations';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Booking from './pages/Booking';
import Settings from './pages/Settings';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Expenses from './pages/Expenses';
import Club from './pages/Club';
import ClientCardPage from './pages/ClientCardPage';
import WhatsAppHub from './pages/WhatsAppHub';
import Inventory from './pages/Inventory';
import Manuel from './pages/Manuel';
import { subscribeToAuthChanges, fetchSalonConfig } from './services/api';
import './index.css';

const InternalLayout = ({ isAdmin, adminOverride, setAdminOverride }) => {
  const [globalZoom, setGlobalZoom] = useState(parseFloat(localStorage.getItem('global_app_zoom')) || 1);

  useEffect(() => {
    const handleZoomChange = () => {
      setGlobalZoom(parseFloat(localStorage.getItem('global_app_zoom')) || 1);
    };
    window.addEventListener('app-zoom-changed', handleZoomChange);
    return () => window.removeEventListener('app-zoom-changed', handleZoomChange);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden" style={{ zoom: globalZoom }}>
      <Sidebar isAdmin={isAdmin} adminOverride={adminOverride} setAdminOverride={setAdminOverride} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);
  const [adminOverride, setAdminOverride] = useState(false);

  const effectiveIsAdmin = isAdmin || adminOverride;

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const config = await fetchSalonConfig();
          const userEmail = currentUser.email?.trim().toLowerCase() || '';
          const adminEmail = config?.adminEmail?.trim().toLowerCase() || '';

          if (userEmail === 'offline_admin') {
            setIsAdmin(true);
          } else if (userEmail === 'offline_cashier') {
            setIsAdmin(false);
          } else if (!adminEmail) {
            setIsAdmin(true); // If no admin is configured, allow full access
          } else {
            setIsAdmin(userEmail === adminEmail);
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Admin Route wrapper
  const AdminRoute = ({ children }) => {
    if (!effectiveIsAdmin) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reserver" element={<Booking />} />
        <Route path="/carte/:phone" element={<ClientCardPage />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        <Route path="/" element={<ProtectedRoute><InternalLayout isAdmin={isAdmin} adminOverride={adminOverride} setAdminOverride={setAdminOverride} /></ProtectedRoute>}>
          <Route index element={<POS />} />
          <Route path="pos" element={<POS />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="manuel" element={<Manuel />} />
          
          <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="clients" element={<AdminRoute><Clients /></AdminRoute>} />
          <Route path="whatsapp-hub" element={<AdminRoute><WhatsAppHub /></AdminRoute>} />
          <Route path="catalog" element={<AdminRoute><Catalog /></AdminRoute>} />
          <Route path="inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
          <Route path="expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
          <Route path="club" element={<AdminRoute><Club /></AdminRoute>} />
          <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
