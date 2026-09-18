import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, User, Wallet, Bell, X, Calendar } from 'lucide-react';
import { saveOrder, fetchEmployees, fetchProducts, saveExpense, saveEmployee, fetchClubMembers, subscribeToNewOnlineReservations } from '../services/api';
import { printTicketTCP } from '../utils/printer';


const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [clubMembers, setClubMembers] = useState([]);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isClientClub, setIsClientClub] = useState(false);
  
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  
  // Print Receipt State
  const [printData, setPrintData] = useState(null);

  // Online RDV Notification
  const [rdvNotif, setRdvNotif] = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);

  // Quick Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Petite Dépense');
  const [expenseEmployee, setExpenseEmployee] = useState('');

  // Customization Mode State
  const posCustomMode = localStorage.getItem('pos_custom_mode_enabled') === 'true';
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [globalZoom, setGlobalZoom] = useState(parseFloat(localStorage.getItem('global_app_zoom')) || 1);
  const [cartWidth, setCartWidth] = useState(parseInt(localStorage.getItem('pos_cart_width')) || 320);
  const [cartScale, setCartScale] = useState(parseFloat(localStorage.getItem('pos_cart_scale')) || 1);
  const [cartFooterScale, setCartFooterScale] = useState(parseFloat(localStorage.getItem('pos_cart_footer_scale')) || 1);
  const [itemScale, setItemScale] = useState(parseFloat(localStorage.getItem('pos_item_scale')) || 1);
  const [catScale, setCatScale] = useState(parseFloat(localStorage.getItem('pos_cat_scale')) || 1);
  const [printerIp, setPrinterIp] = useState(localStorage.getItem('printer_ip') || '');
  const [ticketShopName, setTicketShopName] = useState(localStorage.getItem('ticket_shop_name') || 'MAJOLICA POS');
  const [ticketAddress, setTicketAddress] = useState(localStorage.getItem('ticket_address') || 'Tanger, Maroc');
  const [ticketPhone, setTicketPhone] = useState(localStorage.getItem('ticket_phone') || '06 00 00 00 00');

  const updateGlobalZoom = (val) => {
    setGlobalZoom(val);
    localStorage.setItem('global_app_zoom', val);
    window.dispatchEvent(new Event('app-zoom-changed'));
  };
  const updateCartWidth = (val) => { setCartWidth(val); localStorage.setItem('pos_cart_width', val); };
  const updateCartScale = (val) => { setCartScale(val); localStorage.setItem('pos_cart_scale', val); };
  const updateCartFooterScale = (val) => { setCartFooterScale(val); localStorage.setItem('pos_cart_footer_scale', val); };
  const updateItemScale = (val) => { setItemScale(val); localStorage.setItem('pos_item_scale', val); };
  const updateCatScale = (val) => { setCatScale(val); localStorage.setItem('pos_cat_scale', val); };
  const updatePrinterIp = (val) => { setPrinterIp(val); localStorage.setItem('printer_ip', val); };
  const updateTicketShopName = (val) => { setTicketShopName(val); localStorage.setItem('ticket_shop_name', val); };
  const updateTicketAddress = (val) => { setTicketAddress(val); localStorage.setItem('ticket_address', val); };
  const updateTicketPhone = (val) => { setTicketPhone(val); localStorage.setItem('ticket_phone', val); };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees().then(setEmployees);
    fetchClubMembers().then(setClubMembers);
    fetchProducts().then(data => {
      setProducts(data);
      if (data.length > 0) {
        const uniqueCats = [...new Set(data.map(p => p.category))];
        if (uniqueCats.length > 0) setActiveCategory(uniqueCats[0]);
      }
    });
  }, []);

  // Subscribe to new online reservations
  useEffect(() => {
    const unsub = subscribeToNewOnlineReservations((newRdv) => {
      setRdvNotif(newRdv);
      setNotifVisible(true);
      // Auto-dismiss after 15 seconds
      setTimeout(() => setNotifVisible(false), 15000);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (clientPhone && clientPhone.length >= 9) {
      const isMember = clubMembers.some(m => m.phone === clientPhone);
      setIsClientClub(isMember);
      
      // If we found a member and don't have a name yet, auto-fill it
      if (isMember && !clientName) {
        const member = clubMembers.find(m => m.phone === clientPhone);
        if (member && member.name) {
          setClientName(member.name);
        }
      }
    }
  }, [clientPhone, clubMembers]);

  useEffect(() => {
    if (location.state?.reservationForCheckout && employees.length > 0 && products.length > 0) {
      const res = location.state.reservationForCheckout;
      
      const newCart = [];
      res.serviceIds.forEach(id => {
        const p = products.find(p => p.id === id);
        if (p) {
          const existing = newCart.find(item => item.id === p.id);
          if (existing) {
            existing.qty += 1;
          } else {
            newCart.push({ ...p, qty: 1 });
          }
        }
      });
      
      setCart(newCart);
      setClientName(res.name || '');
      setClientPhone(res.phone || '');
      
      const emp = employees.find(e => e.id.toString() === res.employeeId?.toString());
      if (emp) setSelectedEmployee(emp.name);

      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, employees, products]);

  const categories = [...new Set(products.map(p => p.category))];

  const getCategoryEmoji = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('manucure')) return '👐';
    if (c.includes('dicure')) return '🦶';
    if (c.includes('semi')) return '💅';
    if (c.includes('pose')) return '🧴';
    if (c.includes('brow') || c.includes('lash')) return '👁️';
    if (c.includes('extension') || c.includes('renforcement')) return '🖐️';
    if (c.includes('art') || c.includes('dǸco') || c.includes('déco')) return '✨';
    if (c.includes('divers')) return '💳';
    return '📌';
  };

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category === activeCategory)
    : products;

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const getItemPrice = (item) => {
    return (isClientClub && item.clubPrice !== undefined) ? item.clubPrice : item.price;
  };

  const total = cart.reduce((sum, item) => sum + getItemPrice(item) * item.qty, 0);

  const handleCheckout = async () => {
    const orderItems = cart.map(item => ({
      ...item,
      price: getItemPrice(item), // Save the effective price based on Club status
      originalPrice: item.price
    }));

    const orderData = { 
      items: orderItems, 
      total: total, 
      employeeName: selectedEmployee, 
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      isClubMember: isClientClub,
      date: new Date() 
    };
    await saveOrder(orderData);
    
    // Set data for the receipt
    setPrintData({
      ...orderData,
      amountReceived: parseFloat(amountReceived),
      changeToReturn: parseFloat(amountReceived) - total
    });

    // Send WhatsApp Thank You Message
    if (clientPhone.trim()) {
      fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clientPhone.trim(),
          message: `Merci ${clientName.trim() || 'chère cliente'} pour votre visite chez Majolica ! ❤️\n\nNous espérons que votre prestation vous a plu.\nÀ la prochaine ! 💅✨`
        })
      }).catch(err => console.log("WhatsApp API not reachable"));
    }
    
    setCart([]);
    setSelectedEmployee('');
    setAmountReceived('');
    setClientName('');
    setClientPhone('');
    setIsClientClub(false);
    setIsPaymentModalOpen(false);
    
    // Trigger print dialog after React renders the receipt component
    setTimeout(async () => {
      const savedIp = localStorage.getItem('printer_ip');
      if (savedIp) {
        const processedCart = cart.map(item => ({
          name: item.name,
          qty: item.qty,
          totalPrice: (getItemPrice(item) * item.qty).toFixed(2)
        }));

        const ticketInfo = {
          shopName: ticketShopName,
          shopAddress: ticketAddress,
          shopPhone: ticketPhone,
          employee: selectedEmployee,
          clientName: clientName,
          cart: processedCart,
          total: total,
          amountReceived: amountReceived,
          change: parseFloat(amountReceived) - total,
          date: new Date()
        };
        
        try {
          await printTicketTCP(savedIp, ticketInfo);
        } catch (e) {
          alert(e.message);
          window.print();
        }
      } else {
        window.print();
      }
      setPrintData(null); 
    }, 500);
  };

  const openPaymentModal = () => {
    if (!selectedEmployee) {
      alert('Veuillez sélectionner l\'employée qui a réalisé la prestation !');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const changeToReturn = parseFloat(amountReceived) - total;

  return (
    <div className="flex flex-col md:flex-row gap-4 lg:gap-6 h-full min-h-[80vh]">

      {/* ── NOTIFICATION RDV ONLINE ── */}
      {rdvNotif && (
        <div
          className="fixed top-4 right-4 z-[200] transition-all duration-500"
          style={{
            transform: notifVisible ? 'translateX(0)' : 'translateX(120%)',
            opacity: notifVisible ? 1 : 0,
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden w-80">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <Bell size={14} />
                </div>
                <span className="font-bold text-sm">Nouveau RDV en ligne !</span>
              </div>
              <button onClick={() => setNotifVisible(false)} className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                  <User size={14} className="text-rose-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{rdvNotif.name || 'Cliente'}</div>
                  {rdvNotif.phone && <div className="text-xs text-gray-400">{rdvNotif.phone}</div>}
                </div>
              </div>
              <div className="bg-rose-50 rounded-xl px-3 py-2 mb-3">
                <div className="text-xs text-rose-600 font-bold mb-0.5 flex items-center gap-1">
                  <Calendar size={11} /> {rdvNotif.time} — {rdvNotif.date ? new Date(rdvNotif.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}) : ''}
                </div>
                <div className="text-xs text-gray-600 truncate">{rdvNotif.service}</div>
              </div>
              <button
                onClick={() => { setNotifVisible(false); navigate('/reservations'); }}
                className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-rose-600 transition-colors"
              >
                Voir les réservations →
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Left side: Products */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex justify-between items-center mb-6 relative">
          <div className="flex items-center gap-3">
            <h1 className="page-header mb-0">Caisse Enregistreuse</h1>
            {posCustomMode && (
              <button 
                onClick={() => setShowCustomPanel(!showCustomPanel)}
                className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors shadow-sm"
                title="Personnaliser l'affichage"
              >
                <span className="text-xl">⚙️</span>
              </button>
            )}
            
            {showCustomPanel && (
              <div className="absolute top-14 left-0 bg-white shadow-2xl border border-gray-100 rounded-2xl p-4 w-72 z-50">
                <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                  Personnalisation
                  <button onClick={() => setShowCustomPanel(false)} className="text-gray-400 hover:text-red-500">✕</button>
                </h3>
                
                <div className="space-y-4">
                  <div className="pb-3 border-b border-gray-100 mb-3 bg-purple-50 p-3 rounded-xl border border-purple-100">
                    <label className="text-sm font-black text-purple-700 flex justify-between mb-2">
                      IP Imprimante (Tenda)
                    </label>
                    <input 
                      type="text" 
                      value={printerIp} 
                      onChange={(e) => updatePrinterIp(e.target.value)} 
                      className="w-full border-2 border-purple-200 rounded-lg px-3 py-2 text-sm font-mono text-center font-bold text-gray-700 focus:border-purple-500 outline-none" 
                      placeholder="192.168.1.100" 
                    />
                    <p className="text-[10px] text-purple-500 font-medium mt-1 text-center">Laissez vide pour désactiver l'impression auto</p>
                  </div>
                  <div className="pb-3 border-b border-gray-100 mb-3 bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-2">
                    <label className="text-sm font-black text-blue-700 block mb-1">Ticket de caisse</label>
                    <input 
                      type="text" value={ticketShopName} onChange={(e) => updateTicketShopName(e.target.value)} 
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none" placeholder="Nom du magasin (ex: MAJOLICA)" 
                    />
                    <input 
                      type="text" value={ticketAddress} onChange={(e) => updateTicketAddress(e.target.value)} 
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none" placeholder="Adresse" 
                    />
                    <input 
                      type="text" value={ticketPhone} onChange={(e) => updateTicketPhone(e.target.value)} 
                      className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none" placeholder="Téléphone" 
                    />
                  </div>
                  <div className="pb-3 border-b border-gray-100 mb-3">
                    <label className="text-sm font-black text-purple-600 flex justify-between">
                      Zoom Global (Toute l'App) <span>{Math.round(globalZoom * 100)}%</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={globalZoom} onChange={(e) => updateGlobalZoom(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                      Largeur Panier <span>{cartWidth}px</span>
                    </label>
                    <input type="range" min="150" max="500" value={cartWidth} onChange={(e) => updateCartWidth(parseInt(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                      Zoom Contenu Panier <span>{Math.round(cartScale * 100)}%</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={cartScale} onChange={(e) => updateCartScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                      Zoom Bas du Panier <span>{Math.round(cartFooterScale * 100)}%</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={cartFooterScale} onChange={(e) => updateCartFooterScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                      Zoom Prestations <span>{Math.round(itemScale * 100)}%</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={itemScale} onChange={(e) => updateItemScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                      Zoom Catégories <span>{Math.round(catScale * 100)}%</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={catScale} onChange={(e) => updateCatScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Wallet size={18} />
            <span className="hidden sm:inline">Sortie de Caisse</span>
          </button>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x shrink-0 items-center" style={posCustomMode ? { zoom: catScale } : {}}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`min-h-[56px] px-6 py-3 rounded-xl text-base whitespace-nowrap transition-all duration-200 font-bold border-2 active:scale-95 active:opacity-80 flex items-center gap-2 ${activeCategory === cat ? 'bg-accent border-accent text-white shadow-md shadow-accent/30 scale-105' : 'bg-white border-transparent hover:bg-gray-50 hover:border-accent/30 text-gray-700 shadow-sm'}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="text-xl">{getCategoryEmoji(cat)}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 overflow-y-auto pr-2 content-start pb-20 lg:pb-0" style={posCustomMode ? { zoom: itemScale } : {}}>
          {filteredProducts.map(product => (
            <button 
              key={product.id} 
              className="glass product-card flex flex-col items-center justify-center p-4 min-h-[120px] min-w-[48px] cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl active:scale-95 active:bg-gray-100 transition-all duration-100 bg-gradient-to-br from-white/90 to-white/40 border border-white/60 group focus:outline-none" 
              onClick={() => addToCart(product)}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{product.icon}</div>
              <div className="font-bold text-sm sm:text-base text-center mb-2 text-secondary/90 leading-tight">{product.name}</div>
              <div className="flex flex-col items-center">
                <span className="text-accent font-black text-base sm:text-lg">{product.price.toFixed(2)} DH</span>
                {product.clubPrice !== undefined && product.clubPrice !== product.price && (
                  <span className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-md mt-1 border border-rose-100">Club: {product.clubPrice.toFixed(2)} DH</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Cart */}
      <div 
        className={`glass flex flex-col p-0 h-[400px] md:h-[calc(100vh-24px)] shrink-0 border-t-[8px] border-t-accent shadow-2xl relative overflow-hidden bg-white/95 ${!posCustomMode ? 'w-full md:w-[220px] lg:w-[280px] xl:w-[400px]' : ''}`}
        style={posCustomMode ? { width: `${cartWidth}px` } : {}}
      >
        <div className="p-6 pb-2 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2 text-secondary uppercase tracking-wide">
            <ShoppingCart size={22} className="text-accent" />
            Ticket Actuel
          </h2>
          <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
            {cart.reduce((s, i) => s + i.qty, 0)} articles
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 pr-4 custom-scrollbar" style={posCustomMode ? { zoom: cartScale } : {}}>
          {cart.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">Le panier est vide</div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200 group cursor-pointer hover:bg-gray-50 p-2 rounded-lg active:scale-95 transition-all"
                onClick={() => setSelectedCartItem(item)}
              >
                <div className="flex-1 pr-2">
                  <div className="font-bold text-sm sm:text-sm text-secondary mb-1 leading-tight">{item.name}</div>
                  <div className="text-accent text-sm font-black flex items-center gap-2">
                    {getItemPrice(item).toFixed(2)} DH
                    {isClientClub && item.clubPrice !== undefined && item.clubPrice !== item.price && (
                       <span className="text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200 line-through opacity-70">{item.price} DH</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-gray-100 min-w-[42px] min-h-[42px] rounded-xl font-black text-secondary text-lg">
                    x{item.qty}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50/80 border-t border-dashed border-gray-200 mt-auto shrink-0" style={posCustomMode ? { zoom: cartFooterScale } : {}}>
          {cart.length > 0 && (
            <div className="input-group mb-4">
              <label className="flex items-center justify-between text-sm w-full">
                <span className="flex items-center gap-2"><User size={16} className="text-accent" /> Employée</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-600 uppercase">Tarif Club</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isClientClub} onChange={(e) => setIsClientClub(e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </label>
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                <option value="">-- Choisir une employée --</option>
                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-between items-end mb-6">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Total à payer</span>
            <span className="text-4xl font-black text-secondary leading-none">{total.toFixed(2)} <span className="text-xl">DH</span></span>
          </div>
          
          <button 
            className="btn btn-primary w-full h-16 text-xl font-bold active:scale-95 transition-transform" 
            disabled={cart.length === 0 || !selectedEmployee}
            onClick={openPaymentModal}
          >
            Encaisser
          </button>
          
          {cart.length > 0 && (
            <button 
              className="btn btn-danger w-full mt-3 h-14 active:scale-95 transition-transform"
              onClick={() => setCart([])}
            >
              <Trash2 size={20} /> Annuler la commande
            </button>
          )}
        </div>
      </div>

      {/* Payment Calculator Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass w-full max-w-md p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-secondary">Encaissement</h2>
            </div>
            
            <div className="mb-4 bg-white/50 p-4 rounded-xl text-center border border-gray-200">
              <div className="text-gray-500 font-medium mb-1">Total à Payer</div>
              <div className="text-3xl font-bold text-accent">{total.toFixed(2)} MAD</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="input-group">
                <label className="text-sm">Nom Cliente (Optionnel)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Sara" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="py-2"
                />
              </div>
              <div className="input-group">
                <label className="text-sm">Téléphone (Optionnel)</label>
                <input 
                  type="tel" 
                  placeholder="06 XX XX XX XX" 
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="py-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-lg block text-center mb-2 font-bold text-gray-700">Espèces reçues (MAD)</label>
              <input 
                type="number"
                inputMode="numeric"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full text-3xl text-center font-black text-secondary bg-white border-2 border-accent/30 rounded-2xl py-4 shadow-inner"
                placeholder="0.00"
              />
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button 
                className="px-4 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-xl font-bold text-accent transition-colors shadow-sm" 
                onClick={() => setAmountReceived(total.toString())}
              >
                Le Compte Juste ({total.toFixed(2)} DH)
              </button>
              {(() => {
                const nearest50 = Math.ceil((total + 1) / 50) * 50;
                const nearest100 = Math.ceil((total + 1) / 100) * 100;
                const nearest200 = Math.ceil((total + 1) / 200) * 200;
                
                const suggestions = Array.from(new Set([
                  nearest50, 
                  nearest100, 
                  nearest200, 
                  nearest100 + 100,
                  nearest200 + 200
                ]))
                .filter(val => val > total)
                .sort((a, b) => a - b)
                .slice(0, 3);
                
                return suggestions.map(val => (
                  <button 
                    key={val} 
                    className="px-5 py-3 min-h-[48px] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 border border-gray-200 rounded-xl font-bold text-gray-700 transition-all shadow-sm" 
                    onClick={() => setAmountReceived(val.toString())}
                  >
                    {val} DH
                  </button>
                ));
              })()}
            </div>

            {amountReceived !== '' && parseFloat(amountReceived) > 0 && (
              <div className={`p-4 rounded-xl text-center mb-6 border ${changeToReturn >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                <div className="text-sm font-medium mb-1">
                  {changeToReturn >= 0 ? 'Monnaie à rendre (Sarf)' : 'Il manque'}
                </div>
                <div className={`text-3xl font-bold ${changeToReturn >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {Math.abs(changeToReturn).toFixed(2)} MAD
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button 
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 flex-1 h-14 text-lg font-bold"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Retour
              </button>
              <button 
                className="btn btn-primary flex-1 h-14 text-lg font-bold active:scale-95"
                disabled={!amountReceived || changeToReturn < 0}
                onClick={handleCheckout}
              >
                Valider Paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Item Action Modal */}
      {selectedCartItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="glass w-full max-w-sm p-6 shadow-2xl rounded-3xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-secondary">{selectedCartItem.name}</h3>
              <p className="text-gray-500 font-medium">Prix unitaire: {getItemPrice(selectedCartItem).toFixed(2)} DH</p>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-bold text-gray-500 block text-center mb-2">Quantité</label>
              <div className="flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <button 
                  className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-600 hover:text-accent active:scale-95 border border-gray-100"
                  onClick={() => {
                    if (cart.find(i => i.id === selectedCartItem.id)?.qty === 1) {
                      updateQty(selectedCartItem.id, -1);
                      setSelectedCartItem(null);
                    } else {
                      updateQty(selectedCartItem.id, -1);
                    }
                  }}
                >
                  <Minus size={24} strokeWidth={3} />
                </button>
                <span className="text-4xl font-black text-secondary w-16 text-center">
                  {cart.find(i => i.id === selectedCartItem.id)?.qty || 0}
                </span>
                <button 
                  className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-600 hover:text-accent active:scale-95 border border-gray-100"
                  onClick={() => updateQty(selectedCartItem.id, 1)}
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button 
                className="btn btn-danger h-14 text-lg w-full flex items-center justify-center gap-2 font-bold active:scale-95"
                onClick={() => {
                  updateQty(selectedCartItem.id, -(cart.find(i => i.id === selectedCartItem.id)?.qty || 0));
                  setSelectedCartItem(null);
                }}
              >
                <Trash2 size={20} /> Supprimer l'article
              </button>
              <button 
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 h-14 text-lg font-bold w-full"
                onClick={() => setSelectedCartItem(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Receipt */}
      {printData && (
        <div id="receipt-print-area" className="bg-white text-black p-4 text-xs font-mono hidden print:block" style={{ width: '80mm', margin: '0 auto' }}>
          <div className="text-center border-b border-black pb-4 mb-4">
            <img src="/logo1.jpg" alt="Majolica Logo" className="mx-auto h-12 mb-2 grayscale" />
            <div className="font-bold text-lg">MAJOLICA BEAUTY STUDIO</div>
            <div>CASABLANCA</div>
            <div className="mt-2 text-gray-600">{printData.date.toLocaleDateString()} {printData.date.toLocaleTimeString()}</div>
            <div>Servi par : <span className="font-bold">{printData.employeeName}</span></div>
            {printData.clientName && (
              <div className="mt-1">Cliente : {printData.clientName} {printData.clientPhone && `(${printData.clientPhone})`}</div>
            )}
          </div>
          
          <div className="mb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-1">Qte</th>
                  <th className="py-1">Désignation</th>
                  <th className="py-1 text-right">Prix</th>
                </tr>
              </thead>
              <tbody>
                {printData.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-1 align-top">{item.qty}</td>
                    <td className="py-1 align-top pr-2">{item.name}</td>
                    <td className="py-1 align-top text-right whitespace-nowrap">{(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-black pt-2 mb-6">
            <div className="flex justify-between font-bold text-base mb-1">
              <span>TOTAL A PAYER</span>
              <span>{printData.total.toFixed(2)} MAD</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Espèces</span>
              <span>{printData.amountReceived.toFixed(2)} MAD</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Rendu (Sarf)</span>
              <span>{printData.changeToReturn.toFixed(2)} MAD</span>
            </div>
          </div>
          
          <div className="text-center font-bold">
            MERCI DE VOTRE VISITE !<br/>
            A TRES BIENTOT
          </div>
        </div>
      )}

      {/* Quick Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass w-full max-w-md p-6 shadow-2xl rounded-3xl">
            <div className="flex items-center gap-3 mb-6 text-rose-600">
              <Wallet size={28} />
              <h2 className="text-2xl font-bold">Sortie de Caisse</h2>
            </div>
            
            <p className="text-gray-500 mb-6 text-sm">
              Enregistrez un achat payé directement depuis la caisse du jour (Ex: Café, produits d'entretien).
            </p>

            <div className="space-y-4 mb-6">
              <div className="input-group">
                <label>Type de sortie</label>
                <select 
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="Petite Dépense">Petite Dépense (Café, etc.)</option>
                  <option value="Avance Salaire">Avance sur Salaire</option>
                  <option value="Retrait Patronne">Retrait Patronne (Vider la caisse)</option>
                </select>
              </div>

              {expenseCategory === 'Avance Salaire' && (
                <div className="input-group">
                  <label>Employée</label>
                  <select 
                    value={expenseEmployee}
                    onChange={(e) => setExpenseEmployee(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- Choisir une employée --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Montant retiré (MAD)</label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field font-bold text-lg text-rose-500"
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Description / Motif</label>
                <input 
                  type="text" 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder={expenseCategory === 'Avance Salaire' ? "Avance" : (expenseCategory === 'Retrait Patronne' ? "Retrait espèces" : "Ex: Achat Sanicroix")}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1"
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  setExpenseAmount('');
                  setExpenseDesc('');
                  setExpenseCategory('Petite Dépense');
                  setExpenseEmployee('');
                }}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary flex-1"
                disabled={!expenseAmount || !expenseDesc || (expenseCategory === 'Avance Salaire' && !expenseEmployee)}
                onClick={async () => {
                  const amount = parseFloat(expenseAmount);
                  
                  if (expenseCategory === 'Avance Salaire') {
                    const emp = employees.find(e => e.id.toString() === expenseEmployee.toString());
                    if (emp) {
                      // Add advance to employee record
                      const newAdvance = {
                        date: new Date().toISOString().split('T')[0],
                        amount: amount,
                        source: 'caisse',
                        timestamp: new Date().toISOString()
                      };
                      await saveEmployee({
                        ...emp,
                        advances: [...(emp.advances || []), newAdvance]
                      });
                      
                      // Also save as expense
                      await saveExpense({
                        amount: amount,
                        category: 'Salaires',
                        description: `Avance sur salaire - ${emp.name} (${expenseDesc})`,
                        paymentMethod: 'caisse',
                        date: new Date().toISOString().split('T')[0],
                        createdAt: new Date().toISOString()
                      });
                    }
                  } else {
                    // Normal small expense or Retrait Patronne
                    await saveExpense({
                      amount: amount,
                      category: expenseCategory === 'Retrait Patronne' ? 'Retrait Patronne' : 'Divers',
                      description: expenseDesc,
                      paymentMethod: 'caisse', // Retrait always takes from the physical cash register
                      date: new Date().toISOString().split('T')[0],
                      createdAt: new Date().toISOString()
                    });
                  }
                  
                  setIsExpenseModalOpen(false);
                  setExpenseAmount('');
                  setExpenseDesc('');
                  setExpenseCategory('Petite Dépense');
                  setExpenseEmployee('');
                  alert('Sortie de caisse enregistrée avec succès !');
                }}
              >
                Valider Sortie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
