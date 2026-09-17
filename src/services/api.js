// Ce fichier contient les appels API, maintenant connectés à Firebase avec un fallback sur localStorage.
import { db, auth, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';

export const PRODUCTS = [
  // MANUCURE
  { id: 1, name: 'Manucure classique', price: 80.00, clubPrice: 60.00, category: 'Manucure', icon: '💅', duration: 45 },
  { id: 2, name: 'Manucure russe', price: 100.00, clubPrice: 80.00, category: 'Manucure', icon: '💅', duration: 60 },
  { id: 3, name: 'Manucure japonaise', price: 150.00, clubPrice: 120.00, category: 'Manucure', icon: '🌸', duration: 60 },
  { id: 4, name: 'Manucure spa', price: 140.00, clubPrice: 120.00, category: 'Manucure', icon: '💆‍♀️', duration: 60 },
  { id: 5, name: 'Manucure vip', price: 220.00, clubPrice: 200.00, category: 'Manucure', icon: '✨', duration: 75 },

  // PÉDICURE
  { id: 6, name: 'Pédicure classique', price: 100.00, clubPrice: 80.00, category: 'Pédicure', icon: '🦶', duration: 45 },
  { id: 7, name: 'Pédicure russe', price: 140.00, clubPrice: 120.00, category: 'Pédicure', icon: '🦶', duration: 60 },
  { id: 8, name: 'Pédicure japonaise', price: 150.00, clubPrice: 130.00, category: 'Pédicure', icon: '🌸', duration: 60 },
  { id: 9, name: 'Pédicure spa', price: 200.00, clubPrice: 180.00, category: 'Pédicure', icon: '💆‍♀️', duration: 75 },
  { id: 10, name: 'Pédicure vip', price: 240.00, clubPrice: 220.00, category: 'Pédicure', icon: '✨', duration: 90 },

  // SEMI PERMANENT
  { id: 11, name: 'Semi permanent', price: 70.00, clubPrice: 50.00, category: 'Semi Permanent', icon: '🎨', duration: 30 },
  { id: 12, name: 'Semi permanent + capsules', price: 140.00, clubPrice: 120.00, category: 'Semi Permanent', icon: '💅', duration: 60 },

  // DÉPOSE
  { id: 13, name: 'Dépose permanent', price: 40.00, clubPrice: 30.00, category: 'Dépose', icon: '🧴', duration: 20 },
  { id: 14, name: 'Dépose capsule permanent', price: 60.00, clubPrice: 50.00, category: 'Dépose', icon: '🧴', duration: 30 },
  { id: 15, name: 'Dépose biab', price: 60.00, clubPrice: 50.00, category: 'Dépose', icon: '🧴', duration: 30 },
  { id: 16, name: 'Dépose gel', price: 60.00, clubPrice: 50.00, category: 'Dépose', icon: '🧴', duration: 30 },
  { id: 17, name: 'Dépose capsule biab / gel / chablon', price: 80.00, clubPrice: 60.00, category: 'Dépose', icon: '🧴', duration: 45 },

  // BROW & LASH
  { id: 18, name: 'Brow lift', price: 350.00, clubPrice: 350.00, category: 'Brow & Lash', icon: '👁️', duration: 60 },
  { id: 19, name: 'Lash lift', price: 350.00, clubPrice: 350.00, category: 'Brow & Lash', icon: '👁️', duration: 60 },

  // EXTENSIONS & RENFORCEMENTS
  { id: 20, name: 'Biab normal', price: 180.00, clubPrice: 170.00, category: 'Extensions', icon: '✨', duration: 60 },
  { id: 21, name: 'Biab gel bottle', price: 200.00, clubPrice: 190.00, category: 'Extensions', icon: '✨', duration: 60 },
  { id: 22, name: 'Biab + couleur', price: 250.00, clubPrice: 230.00, category: 'Extensions', icon: '🎨', duration: 75 },
  { id: 23, name: 'Chablon', price: 500.00, clubPrice: 300.00, category: 'Extensions', icon: '💅', duration: 120 },
  { id: 24, name: 'Chablon + permanent', price: 550.00, clubPrice: 350.00, category: 'Extensions', icon: '💅', duration: 120 },
  { id: 25, name: 'Gel', price: 300.00, clubPrice: 280.00, category: 'Extensions', icon: '✨', duration: 90 },
  { id: 26, name: 'Remplissage gel', price: 180.00, clubPrice: 160.00, category: 'Extensions', icon: '🧴', duration: 60 },
  { id: 27, name: 'Gainage gel', price: 250.00, clubPrice: 230.00, category: 'Extensions', icon: '✨', duration: 75 },
  { id: 28, name: 'Poly gel', price: 300.00, clubPrice: 280.00, category: 'Extensions', icon: '✨', duration: 90 },

  // NAIL ART & DÉCO
  { id: 29, name: 'Chrome', price: 50.00, clubPrice: 50.00, category: 'Nail Art', icon: '✨', duration: 15 },
  { id: 30, name: 'Cat eye avec capsule', price: 200.00, clubPrice: 180.00, category: 'Nail Art', icon: '👁️', duration: 60 },
  { id: 31, name: 'Cat eye sans capsule', price: 150.00, clubPrice: 100.00, category: 'Nail Art', icon: '👁️', duration: 45 },
  { id: 32, name: 'Nail art', price: 50.00, clubPrice: 40.00, category: 'Nail Art', icon: '🎨', duration: 20 },
  { id: 33, name: 'Nail art 3d', price: 100.00, clubPrice: 80.00, category: 'Nail Art', icon: '🎨', duration: 30 },
  { id: 34, name: 'Baby boomer', price: 70.00, clubPrice: 50.00, category: 'Nail Art', icon: '💅', duration: 20 },
  { id: 35, name: 'Acrylic gel babyboomer', price: 170.00, clubPrice: 150.00, category: 'Nail Art', icon: '✨', duration: 45 },

  // DIVERS
  { id: 37, name: 'Dépôt de Vernis Simple', price: 20.00, clubPrice: 20.00, category: 'Divers', icon: 'Sparkles', duration: 15 },
];

// ---- IN-MEMORY CACHE (0ms loading after first fetch) ----
const _cache = {
  products: null,
  employees: null,
};

const DUMMY_EMPLOYEES = [
  { id: 1, name: 'Celine', role: 'Coiffeuse/Onglerie', status: 'Actif', sales: 0 },
  { id: 2, name: 'Leaticia', role: 'Coiffeuse/Onglerie', status: 'Actif', sales: 0 }
];

export const fetchProducts = async () => {
  // Return instantly from cache if available
  if (_cache.products && _cache.products.length > 0) return _cache.products;

  const MENU_VERSION = 'v3_full'; // bumped to restore all categories

  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      let fetchedProducts = snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const localVersion = localStorage.getItem('majolica_menu_version');
      
      // If version mismatch or missing, we FORCE reset to the exact hardcoded PRODUCTS
      if (localVersion !== MENU_VERSION) {
        console.log("Upgrading menu to " + MENU_VERSION);
        
        // 1. Delete all old products from Firebase
        for (const p of fetchedProducts) {
          await deleteDoc(doc(db, 'products', p.id.toString()));
        }
        
        // 2. Upload the new clean PRODUCTS to Firebase
        for (const p of PRODUCTS) {
          await setDoc(doc(db, 'products', p.id.toString()), p);
        }
        
        // 3. Reset LocalStorage
        localStorage.setItem('majolica_products', JSON.stringify(PRODUCTS));
        localStorage.setItem('majolica_menu_version', MENU_VERSION);
        
        fetchedProducts = [...PRODUCTS];
      }
      
      _cache.products = fetchedProducts;
      return _cache.products;
    } catch (e) {
      console.error("Firebase fetchProducts err:", e);
      // Fall through to local fallback below
    }
  }

  // Fallback: localStorage or hardcoded default list
  const localVersion = localStorage.getItem('majolica_menu_version');
  let fallback = [];
  
  if (localVersion !== MENU_VERSION) {
      fallback = [...PRODUCTS];
      localStorage.setItem('majolica_products', JSON.stringify(fallback));
      localStorage.setItem('majolica_menu_version', MENU_VERSION);
  } else {
      const prodStr = localStorage.getItem('majolica_products');
      fallback = prodStr ? JSON.parse(prodStr) : PRODUCTS;
  }
  
  _cache.products = fallback.length > 0 ? fallback : PRODUCTS;
  return _cache.products;
};

export const saveProduct = async (product) => {
  product.id = product.id || Date.now().toString();
  _cache.products = null; // Invalidate cache
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'products', product.id.toString()), product);
      return product;
    } catch (e) { console.error("Firebase err", e); }
  }
  const products = JSON.parse(localStorage.getItem('majolica_products')) || PRODUCTS;
  products.push(product);
  localStorage.setItem('majolica_products', JSON.stringify(products));
  return product;
};

export const deleteProduct = async (id) => {
  _cache.products = null; // Invalidate cache
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'products', id.toString()));
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  let products = JSON.parse(localStorage.getItem('majolica_products')) || PRODUCTS;
  products = products.filter(p => p.id !== id);
  localStorage.setItem('majolica_products', JSON.stringify(products));
};

export const fetchWhatsAppLogs = async () => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'whatsapp_logs'), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return [];
};

export const subscribeToWhatsAppLogs = (callback) => {
  if (isFirebaseConfigured) {
    const q = query(collection(db, 'whatsapp_logs'), orderBy('timestamp', 'asc')); // asc so oldest is first in chat
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(logs);
    }, (error) => {
      console.error("Error subscribing to whatsapp logs:", error);
      callback([]);
    });
  }
  return () => {};
};

export const sendAndLogWhatsAppMessage = async (phone, message) => {
  try {
    // Format Moroccan phone number to international format for WhatsApp (e.g., 06... -> 2126...)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '212' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const response = await fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur serveur HTTP: ${response.status}`);
    }
    
    if (isFirebaseConfigured) {
      await addDoc(collection(db, 'whatsapp_logs'), {
        to: phone,
        body: message,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    }
    return { success: true };
  } catch (err) {
    if (isFirebaseConfigured) {
      await addDoc(collection(db, 'whatsapp_logs'), {
        to: phone,
        body: message,
        status: 'failed',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    throw err; // Bubble up error to UI
  }
};

export const fetchAdminPhone = async () => {
  if (isFirebaseConfigured) {
    try {
      const d = await getDoc(doc(db, 'settings', 'admin_phone'));
      if (d.exists()) return d.data().phone;
      else {
        const local = localStorage.getItem('majolica_admin_phone');
        if (local) {
          console.log("Migrating admin phone to Firebase...");
          await setDoc(doc(db, 'settings', 'admin_phone'), { phone: local });
          return local;
        }
      }
    } catch (e) { console.error("Firebase err", e); }
  }
  return localStorage.getItem('majolica_admin_phone') || "212644538903";
};

export const saveAdminPhone = async (phone) => {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'admin_phone'), { phone });
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_admin_phone', phone);
};

export const fetchSalonConfig = async () => {
  if (isFirebaseConfigured) {
    try {
      const d = await getDoc(doc(db, 'settings', 'salon_config'));
      if (d.exists()) return d.data();
    } catch (e) { console.error("Firebase err", e); }
  }
  return JSON.parse(localStorage.getItem('majolica_config')) || { monthlyRent: 5500, monthlyElec: 1500 };
};

export const saveSalonConfig = async (config) => {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'salon_config'), config);
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_config', JSON.stringify(config));
};

export const fetchHistory = async () => {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'history'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const local = localStorage.getItem('majolica_history');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.length > 0) {
            console.log("Migrating history to Firebase...");
            for (const item of parsed) {
              item.id = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
              await setDoc(doc(db, 'history', item.id.toString()), item);
            }
            return parsed;
          }
        }
      }
    } catch (e) { console.error("Firebase err", e); }
  }
  const history = localStorage.getItem('majolica_history');
  return history ? JSON.parse(history) : [];
};

export const saveOrder = async (orderData) => {
  orderData.id = orderData.id || Date.now().toString();
  orderData.timestamp = orderData.timestamp || new Date().toISOString();
  
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'history', orderData.id), orderData);
    } catch (e) { console.error("Firebase err", e); }
  } else {
    const existingHistory = JSON.parse(localStorage.getItem('majolica_history')) || [];
    existingHistory.push(orderData);
    localStorage.setItem('majolica_history', JSON.stringify(existingHistory));
  }
  
  // Notification Patronne
  const adminPhone = await fetchAdminPhone();
  const amalsOrderMessage = `💰 *Nouvel Encaissement (Caisse)*\n\nTotal : ${orderData.total.toFixed(2)} MAD\nEmployée : ${orderData.employeeName}\nCliente : ${orderData.clientName || 'Anonyme'}\nPrestations : ${orderData.items.map(i => i.name).join(', ')}`;
  sendAndLogWhatsAppMessage(adminPhone, amalsOrderMessage);

  return { success: true };
};

export const fetchReservations = async () => {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'reservations'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const res = localStorage.getItem('majolica_reservations');
        if (res) {
          const parsed = JSON.parse(res);
          if (parsed.length > 0) {
            console.log("Migrating reservations to Firebase...");
            for (const item of parsed) {
              item.id = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
              await setDoc(doc(db, 'reservations', item.id.toString()), item);
            }
            return parsed;
          }
        }
      }
    } catch (e) { console.error("Firebase err", e); }
  }
  const res = localStorage.getItem('majolica_reservations');
  if (res) return JSON.parse(res);
  return [];
};

export const saveReservation = async (reservation) => {
  reservation.id = reservation.id || Date.now().toString();
  if (!reservation.status) reservation.status = 'Confirmé';
  
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'reservations', reservation.id.toString()), reservation);
    } catch (e) { console.error("Firebase err", e); }
  } else {
    const resList = await fetchReservations();
    resList.push(reservation);
    localStorage.setItem('majolica_reservations', JSON.stringify(resList));
  }

  const formattedDate = reservation.date ? new Date(reservation.date).toLocaleDateString('fr-FR') : '';
  const adminPhone = await fetchAdminPhone();

  // Notification Patronne
  const amalsResMessage = `🔔 *Nouvelle Réservation*\n\nCliente : ${reservation.name || 'Non renseigné'} (${reservation.phone || 'Pas de num'})\nDate : ${formattedDate} à ${reservation.time}\nPrestation : ${reservation.service || 'Non renseigné'}\nOrigine : ${reservation.isOnlineBooking ? 'Site Web 🌐' : 'Agenda (Manuel) 📅'}`;
  sendAndLogWhatsAppMessage(adminPhone, amalsResMessage);

  // Send Instant Confirmation WhatsApp to Client
  if (reservation.phone) {
    sendAndLogWhatsAppMessage(
      reservation.phone,
      `Bonjour ${reservation.name} ✨,\n\nMajolica vous confirme avec plaisir votre rendez-vous pour le ${formattedDate} à ${reservation.time}.\n\nNous avons hâte de vous chouchouter ! 💅💖`
    )
    .then(() => {
      const locationMessage = `📍 *MAJOLICA BEAUTY STUDIO*\n\nVoici notre adresse exacte pour votre rendez-vous :\n🏢 Immeuble Hakim | 1er Etage | Bureau 04\n🌍 Ave Mohamed Taieb Naciri, Casablanca 20220\n\n📌 *Lien GPS :* https://maps.google.com/?q=33.549417,-7.677516`;
      return sendAndLogWhatsAppMessage(reservation.phone, locationMessage);
    })
    .catch(err => console.log("WhatsApp API not reachable"));
  }
};

export const updateReservation = async (updatedRes) => {
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'reservations', updatedRes.id.toString()), updatedRes);
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  const resList = await fetchReservations();
  const index = resList.findIndex(r => r.id === updatedRes.id);
  if (index !== -1) {
    resList[index] = updatedRes;
    localStorage.setItem('majolica_reservations', JSON.stringify(resList));
  }
};

export const deleteReservation = async (resId) => {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'reservations', resId.toString()));
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  let resList = await fetchReservations();
  resList = resList.filter(r => r.id !== resId);
  localStorage.setItem('majolica_reservations', JSON.stringify(resList));
};

export const fetchEmployees = async () => {
  if (_cache.employees) return _cache.employees;

  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      if (!snap.empty) {
        _cache.employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return _cache.employees;
      } else {
        const empStr = localStorage.getItem('majolica_employees');
        const localData = empStr ? JSON.parse(empStr) : DUMMY_EMPLOYEES;
        if (localData && localData.length > 0) {
          console.log("Migrating employees to Firebase...");
          for (const item of localData) {
            item.id = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
            await setDoc(doc(db, 'employees', item.id.toString()), item);
          }
          _cache.employees = localData;
          return _cache.employees;
        }
      }
    } catch (e) { console.error("Firebase err", e); }
  }
  const empStr = localStorage.getItem('majolica_employees');
  _cache.employees = empStr ? JSON.parse(empStr) : DUMMY_EMPLOYEES;
  return _cache.employees;
};

export const saveEmployee = async (employee) => {
  employee.id = employee.id || Date.now().toString();
  employee.status = employee.status || 'Actif';
  employee.sales = employee.sales || 0;
  _cache.employees = null; // Invalidate cache
  
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'employees', employee.id.toString()), employee);
      return employee;
    } catch (e) { console.error("Firebase err", e); }
  }
  const employees = JSON.parse(localStorage.getItem('majolica_employees')) || DUMMY_EMPLOYEES;
  const index = employees.findIndex(emp => emp.id === employee.id);
  if (index !== -1) {
    employees[index] = employee;
  } else {
    employees.push(employee);
  }
  localStorage.setItem('majolica_employees', JSON.stringify(employees));
  return employee;
};

export const deleteEmployee = async (id) => {
  _cache.employees = null; // Invalidate cache
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'employees', id.toString()));
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  let employees = JSON.parse(localStorage.getItem('majolica_employees')) || DUMMY_EMPLOYEES;
  employees = employees.filter(emp => emp.id !== id);
  localStorage.setItem('majolica_employees', JSON.stringify(employees));
};

// --- AUTHENTICATION ---

export const loginUser = async (email, password) => {
  const safePassword = password ? password.trim() : '';
  const safeEmail = email ? email.trim() : '';

  const config = await fetchSalonConfig();
  const cashierPin = config?.cashierPin || '0000';

  // Cashier PIN mode
  if (safePassword === cashierPin && !safeEmail) {
    localStorage.setItem('majolica_offline_auth', 'cashier');
    window.dispatchEvent(new Event('offline_auth_changed'));
    return { email: 'offline_cashier' };
  }

  // Fallback/Setup mode: hardcoded pin '1234' bypasses Firebase
  // This allows the user to log in and reach Settings to create their real account.
  if (safePassword === '1234' && !safeEmail) {
    localStorage.setItem('majolica_offline_auth', 'true');
    // We dispatch a custom event to notify App.jsx of the manual login
    window.dispatchEvent(new Event('offline_auth_changed'));
    return { email: 'offline_admin' };
  }

  if (isFirebaseConfigured && auth) {
    if (!safeEmail) {
      throw new Error('Veuillez entrer une adresse email valide.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, safeEmail, safePassword);
    return userCredential.user;
  } else {
    throw new Error('Mot de passe incorrect (Mode hors-ligne: 1234)');
  }
};

export const registerUser = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
  throw new Error("Firebase n'est pas configuré. Impossible de créer un compte.");
};

export const logoutUser = async () => {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  localStorage.removeItem('majolica_offline_auth');
  window.dispatchEvent(new Event('offline_auth_changed'));
};

export const subscribeToAuthChanges = (callback) => {
  const checkOffline = () => {
    const isOfflineAuth = localStorage.getItem('majolica_offline_auth');
    if (isOfflineAuth === 'cashier') return { email: 'offline_cashier' };
    if (isOfflineAuth === 'true') return { email: 'offline_admin' };
    return null;
  };

  const handleCustomEvent = () => {
    callback(checkOffline());
  };

  window.addEventListener('offline_auth_changed', handleCustomEvent);

  if (isFirebaseConfigured && auth) {
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (user) {
        callback(user);
      } else {
        callback(checkOffline());
      }
    });

    return () => {
      unsubscribeFirebase();
      window.removeEventListener('offline_auth_changed', handleCustomEvent);
    };
  } else {
    callback(checkOffline());
    return () => {
      window.removeEventListener('offline_auth_changed', handleCustomEvent);
    };
  }
};

// --- CLIENT MANAGEMENT (Blocked/Deleted) ---

export const fetchDeletedClients = async () => {
  if (isFirebaseConfigured) {
    try {
      const d = await getDoc(doc(db, 'settings', 'deleted_clients'));
      if (d.exists()) return d.data().list || [];
    } catch (e) { console.error("Firebase err", e); }
  }
  return JSON.parse(localStorage.getItem('majolica_deleted')) || [];
};

export const saveDeletedClients = async (list) => {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'deleted_clients'), { list });
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_deleted', JSON.stringify(list));
};

export const fetchBlockedClients = async () => {
  if (isFirebaseConfigured) {
    try {
      const d = await getDoc(doc(db, 'settings', 'blocked_clients'));
      if (d.exists()) return d.data().list || [];
    } catch (e) { console.error("Firebase err", e); }
  }
  return JSON.parse(localStorage.getItem('majolica_blocked')) || [];
};

export const saveBlockedClients = async (list) => {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'blocked_clients'), { list });
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_blocked', JSON.stringify(list));
};

// --- CLUB MEMBERSHIP MANAGEMENT ---

export const fetchClubMembers = async () => {
  if (isFirebaseConfigured) {
    try {
      const d = await getDoc(doc(db, 'settings', 'club_members'));
      if (d.exists()) return d.data().list || [];
    } catch (e) { console.error("Firebase err", e); }
  }
  return JSON.parse(localStorage.getItem('majolica_club_members')) || [];
};

export const saveClubMember = async (member) => {
  const members = await fetchClubMembers();
  const existingIndex = members.findIndex(m => m.phone === member.phone);
  if (existingIndex !== -1) {
    members[existingIndex] = member;
  } else {
    members.push(member);
  }
  
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'club_members'), { list: members });
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_club_members', JSON.stringify(members));
};

export const deleteClubMember = async (phone) => {
  let members = await fetchClubMembers();
  members = members.filter(m => m.phone !== phone);
  
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'club_members'), { list: members });
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  localStorage.setItem('majolica_club_members', JSON.stringify(members));
};

// --- EXPENSES MANAGEMENT ---

export const fetchExpenses = async () => {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) { console.error("Firebase err", e); }
  }
  return JSON.parse(localStorage.getItem('majolica_expenses')) || [];
};

export const saveExpense = async (expense) => {
  expense.id = expense.id || Date.now().toString();
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'expenses', expense.id.toString()), expense);
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  const expensesList = await fetchExpenses();
  expensesList.push(expense);
  localStorage.setItem('majolica_expenses', JSON.stringify(expensesList));
};

export const deleteExpense = async (id) => {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'expenses', id.toString()));
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  let expensesList = await fetchExpenses();
  expensesList = expensesList.filter(e => e.id.toString() !== id.toString());
  localStorage.setItem('majolica_expenses', JSON.stringify(expensesList));
};

export const updateExpense = async (updatedExpense) => {
  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'expenses', updatedExpense.id.toString()), updatedExpense);
      return;
    } catch (e) { console.error("Firebase err", e); }
  }
  const expensesList = await fetchExpenses();
  const index = expensesList.findIndex(e => e.id.toString() === updatedExpense.id.toString());
  if (index !== -1) {
    expensesList[index] = updatedExpense;
    localStorage.setItem('majolica_expenses', JSON.stringify(expensesList));
  }
};

export const updateClientGlobal = async (oldName, oldPhone, newName, newPhone) => {
  const isTarget = (n, p) => (n === oldName && p === oldPhone) || (oldPhone !== 'Non renseigné' && p === oldPhone) || (oldPhone === 'Non renseigné' && n === oldName);
  
  if (isFirebaseConfigured) {
    try {
      // Update History
      const histSnap = await getDocs(collection(db, 'history'));
      for (const d of histSnap.docs) {
        const data = d.data();
        const cName = data.clientName || data.name || 'Inconnu';
        const cPhone = data.clientPhone || data.phone || 'Non renseigné';
        if (isTarget(cName, cPhone)) {
          await updateDoc(doc(db, 'history', d.id), { clientName: newName, clientPhone: newPhone });
        }
      }
      
      // Update Reservations
      const resSnap = await getDocs(collection(db, 'reservations'));
      for (const d of resSnap.docs) {
        const data = d.data();
        const cName = data.name || 'Inconnu';
        const cPhone = data.phone || 'Non renseigné';
        if (isTarget(cName, cPhone)) {
          await updateDoc(doc(db, 'reservations', d.id), { name: newName, phone: newPhone });
        }
      }
    } catch (e) { console.error("Firebase update client err", e); }
  }
  
  // LocalStorage update
  let history = JSON.parse(localStorage.getItem('majolica_history')) || [];
  history = history.map(h => {
    const cName = h.clientName || h.name || 'Inconnu';
    const cPhone = h.clientPhone || h.phone || 'Non renseigné';
    if (isTarget(cName, cPhone)) {
      return { ...h, clientName: newName, clientPhone: newPhone };
    }
    return h;
  });
  localStorage.setItem('majolica_history', JSON.stringify(history));

  let reservations = JSON.parse(localStorage.getItem('majolica_reservations')) || [];
  reservations = reservations.map(r => {
    const cName = r.name || 'Inconnu';
    const cPhone = r.phone || 'Non renseigné';
    if (isTarget(cName, cPhone)) {
      return { ...r, name: newName, phone: newPhone };
    }
    return r;
  });
  localStorage.setItem('majolica_reservations', JSON.stringify(reservations));
};

// Real-time listener — notifie quand un nouveau RDV online arrive
export const subscribeToNewOnlineReservations = (onNewReservation) => {
  if (!isFirebaseConfigured || !db) return () => {};
  
  // Track already-seen IDs to only trigger on truly new ones
  let knownIds = null;
  
  const unsubscribe = onSnapshot(collection(db, 'reservations'), (snapshot) => {
    const pending = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.status === 'En attente' && r.isOnlineBooking === true);
    
    if (knownIds === null) {
      // First load — just record IDs, don't notify
      knownIds = new Set(pending.map(r => r.id));
      return;
    }
    
    // Find truly new ones
    const newOnes = pending.filter(r => !knownIds.has(r.id));
    newOnes.forEach(r => {
      knownIds.add(r.id);
      onNewReservation(r);
    });
  });
  
  return unsubscribe;
};
