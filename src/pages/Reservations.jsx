import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sparkles, Plus, X, CheckSquare, Square, Trash2, Phone, ShoppingCart, List, User } from 'lucide-react';
import { fetchReservations, saveReservation, updateReservation, deleteReservation, fetchEmployees, fetchProducts } from '../services/api';

const HOURS = Array.from({ length: 10 }).map((_, i) => `${(i + 11).toString().padStart(2, '0')}:00`);

const PIXELS_PER_MINUTE = 1.2;

const Reservations = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [reservationsList, setReservationsList] = useState([]);
  
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  
  const loadData = async () => {
    const res = await fetchReservations();
    setReservationsList(res);
  };
  
  useEffect(() => {
    loadData();
    fetchEmployees().then(setEmployees);
    fetchProducts().then(data => {
      setProducts(data);
      if (data.length > 0) {
        const uniqueCats = [...new Set(data.map(p => p.category))];
        if (uniqueCats.length > 0) setActiveCategory(uniqueCats[0]);
      }
    });
  }, [isModalOpen]); // Reload when modal closes (after saving)
  
  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  
  // New Reservation Form State
  const [selectedServices, setSelectedServices] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedTime, setSelectedTime] = useState('11:00');
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [reservationStatus, setReservationStatus] = useState('Confirmé');

  const getTopOffset = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const startHour = 11;
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return totalMinutes * PIXELS_PER_MINUTE;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmé': return 'bg-rose-100 border-l-4 border-rose-500 text-rose-900';
      case 'En attente': return 'bg-amber-100 border-l-4 border-amber-500 text-amber-900';
      case 'En cours': return 'bg-black/5 border-l-4 border-black text-black';
      default: return 'bg-gray-100 border-l-4 border-gray-400 text-gray-600';
    }
  };

  const toggleService = (productId) => {
    if (selectedServices.includes(productId)) {
      setSelectedServices(selectedServices.filter(id => id !== productId));
    } else {
      setSelectedServices([...selectedServices, productId]);
    }
  };

  // Calculate total duration based on selected services
  const totalDuration = selectedServices.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    return sum + (product ? product.duration : 0);
  }, 0);

  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = activeCategory 
    ? products.filter(p => p.category === activeCategory)
    : products;

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setSelectedEmp('');
    setSelectedTime('11:00');
    setSelectedServices([]);
    setEditingReservationId(null);
    setReservationStatus('Confirmé');
    setIsModalOpen(false);
  };

  const handleEditReservation = (e, res) => {
    e.stopPropagation();
    setClientName(res.name || '');
    setClientPhone(res.phone || '');
    setSelectedEmp(res.employeeId.toString());
    setSelectedTime(res.time);
    
    // Fix: If serviceIds is missing (old reservation), reconstruct it from the service string
    let idsToSet = res.serviceIds || [];
    if (idsToSet.length === 0 && res.service) {
      const serviceNamesArray = res.service.split(' + ');
      idsToSet = products.filter(p => serviceNamesArray.includes(p.name)).map(p => p.id);
    }
    setSelectedServices(idsToSet);
    
    setReservationStatus(res.status || 'Confirmé');
    setEditingReservationId(res.id);
    setSelectedDate(new Date(res.date));
    setIsModalOpen(true);
  };

  const handleDeleteReservation = async () => {
    const reason = window.prompt("Veuillez indiquer la raison de l'annulation (qui sera envoyée à la cliente) :");
    if (reason !== null) {
      await deleteReservation(editingReservationId);
      
      if (clientPhone) {
        const cancelMsg = `Bonjour ${clientName || 'chère cliente'},\n\nNous sommes au regret de vous informer que votre rendez-vous chez Majolica a été annulé pour la raison suivante :\n"${reason || 'Indisponibilité exceptionnelle'}"\n\nVeuillez nous en excuser. Nous serons ravis de vous accueillir une prochaine fois ! ✨`;
        fetch('https://majolica.136.116.62.73.nip.io/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: clientPhone, message: cancelMsg })
        }).catch(err => console.log("WhatsApp API not reachable"));
      }
      
      resetForm();
    }
  };

  const handleSaveReservation = async () => {
    const serviceNames = selectedServices.map(id => products.find(p=>p.id===id)?.name).join(' + ');
    const resData = {
      employeeId: selectedEmp,
      time: selectedTime,
      duration: totalDuration || 60,
      name: clientName,
      phone: clientPhone,
      service: serviceNames,
      serviceIds: selectedServices,
      status: reservationStatus,
      date: selectedDate.toISOString()
    };
    
    if (editingReservationId) {
      await updateReservation({ ...resData, id: editingReservationId });
    } else {
      await saveReservation(resData);
    }
    
    resetForm();
  };

  const handleGridClick = (empId, hour) => {
    setSelectedEmp(empId.toString());
    setSelectedTime(hour);
    setIsModalOpen(true);
  };

  const waitingList = reservationsList.filter(r => r.status === 'En attente');

  return (
    <div className="flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="page-header mb-0">Agenda du Salon</h1>
        <div className="flex gap-4 items-center w-full sm:w-auto">
          <button className="btn bg-white text-secondary border border-gray-200 hover:bg-gray-50 flex items-center gap-2" onClick={() => setIsListModalOpen(true)}>
            <List size={20} /> Liste des Réservations
          </button>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={20} /> Nouveau RDV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          {/* Weekly Date Selector */}
          <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            {next7Days.map(date => {
              const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              
              const frDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
              const displayDay = isToday ? "Aujourd'hui" : frDay.charAt(0).toUpperCase() + frDay.slice(1);
              
              return (
                <button 
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`px-5 py-2 rounded-xl flex flex-col items-center justify-center min-w-[100px] transition-all border ${
                    isSelected 
                      ? 'bg-secondary text-white border-secondary shadow-md' 
                      : 'bg-white/60 text-secondary border-gray-200 hover:bg-white'
                  }`}
                >
                  <span className="font-bold text-sm">{displayDay}</span>
                  <span className={`text-xs ${isSelected ? 'opacity-90' : 'text-gray-500'}`}>{format(date, 'dd/MM')}</span>
                </button>
              )
            })}
          </div>

          {/* Agenda Board */}
          <div className="glass flex-1 flex flex-col overflow-x-auto min-h-[400px] shadow-sm border border-rose-900/10 custom-scrollbar">
            {/* Board Header */}
            <div className="flex border-b border-glass-border bg-rose-50/50 min-w-max md:min-w-0">
              <div className="w-16 sm:w-20 shrink-0 border-r border-glass-border"></div>
              {employees.map(emp => (
                <div key={emp.id} className="flex-1 min-w-[120px] p-3 text-center font-bold text-secondary text-xs sm:text-sm border-r border-glass-border break-words uppercase tracking-wider">
                  {emp.name}
                </div>
              ))}
            </div>

            {/* Board Body */}
            <div className="flex-1 overflow-y-auto flex relative min-w-max md:min-w-0">
              <div className="w-16 sm:w-20 shrink-0 border-r border-glass-border relative bg-white/30">
                {HOURS.map((hour) => (
                  <div key={hour} className="text-center text-xs text-gray-500 border-b border-glass-border" style={{ height: `${60 * PIXELS_PER_MINUTE}px`, padding: '8px' }}>
                    {hour}
                  </div>
                ))}
              </div>

              {employees.map(emp => {
                const employeeReservations = reservationsList.filter(r => 
                  r.employeeId.toString() === emp.id.toString() && 
                  isSameDay(new Date(r.date), selectedDate) &&
                  r.status !== 'En attente'
                );
                return (
                  <div key={emp.id} className="flex-1 border-r border-glass-border relative min-w-[120px]">
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="border-b border-glass-border cursor-pointer hover:bg-black/5 transition-colors" 
                        style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
                        onClick={() => handleGridClick(emp.id, hour)}
                      ></div>
                    ))}
                    
                    {employeeReservations.map(res => (
                      <div 
                        key={res.id} 
                        onClick={(e) => handleEditReservation(e, res)}
                        className={`absolute left-1 right-1 rounded-md p-2 shadow-sm cursor-pointer overflow-hidden text-xs sm:text-sm hover:shadow-md transition-shadow z-10 ${getStatusColor(res.status)}`}
                        style={{
                          top: `${getTopOffset(res.time)}px`,
                          height: `${res.duration * PIXELS_PER_MINUTE}px`,
                        }}
                      >
                        <div className="font-bold mb-1 truncate">{res.name}</div>
                        <div className="mb-1 flex items-center gap-1 opacity-90 truncate">
                          <Sparkles size={12} className="shrink-0" /> {res.service}
                        </div>
                        <div className="opacity-80 flex items-center gap-1">
                          <Clock size={12} className="shrink-0" /> {res.time} ({res.duration}m)
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Waiting List Sidebar */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="glass p-4 rounded-2xl border-t-4 border-amber-400">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
              <Clock size={20} /> Liste d'Attente
            </h3>
            
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
              {waitingList.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4 bg-white/50 rounded-lg">
                  Aucune cliente en attente.
                </div>
              ) : (
                waitingList.map(res => (
                  <div 
                    key={res.id} 
                    onClick={(e) => handleEditReservation(e, res)}
                    className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                    <div className="font-bold text-secondary mb-1 truncate pr-4">{res.name}</div>
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Phone size={12} /> {res.phone || 'Non renseigné'}
                    </div>
                    <div className="text-xs font-medium text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded-md mb-2 w-full truncate">
                      {res.service}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>Souhait: {new Date(res.date).toLocaleDateString()}</span>
                      <span className="font-medium text-secondary">{res.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Modifiez un RDV annulé pour y placer une cliente en attente.
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="glass w-full max-w-6xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between mb-6 text-secondary shrink-0 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold">{editingReservationId ? 'Modifier Rendez-vous' : 'Nouveau Rendez-vous'}</h2>
              <button onClick={resetForm} className="hover:text-accent">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 overflow-y-auto pr-2 pb-4 custom-scrollbar">
              {/* Left Column: Form details */}
              <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className="input-group">
                  <label>Cliente</label>
                  <input type="text" placeholder="Nom de la cliente" value={clientName} onChange={e=>setClientName(e.target.value)} />
                </div>

                <div className="input-group">
                  <label className="flex justify-between items-center w-full">
                    <span>Téléphone</span>
                    {clientPhone && editingReservationId && (
                      <a 
                        href={`https://wa.me/212${clientPhone.replace(/\D/g, '').replace(/^0/, '')}?text=Bonjour ${encodeURIComponent(clientName)}, votre rendez-vous chez Majolica est prévu dans 1 heure. Pouvez-vous nous confirmer votre présence ? 😊`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1 font-bold hover:bg-green-100 transition-colors"
                      >
                        <Phone size={12} /> Confirmer WhatsApp
                      </a>
                    )}
                  </label>
                  <input type="tel" placeholder="06 XX XX XX XX" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
                </div>

                <div className="flex gap-4">
                  <div className="input-group flex-1">
                    <label>Employée</label>
                    <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}>
                      <option value="">Choisir</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group flex-1">
                    <label>Heure</label>
                    <input type="time" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)} />
                  </div>
                </div>

                {editingReservationId && (
                  <div className="input-group">
                    <label>Statut</label>
                    <select value={reservationStatus} onChange={e=>setReservationStatus(e.target.value)}>
                      <option value="Confirmé">Confirmé</option>
                      <option value="En attente">En attente</option>
                      <option value="En cours">En cours</option>
                    </select>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center justify-between mt-auto shadow-sm">
                  <div>
                    <div className="font-bold">Durée estimée</div>
                    <div className="text-sm opacity-80">Le système bloquera ce temps</div>
                  </div>
                  <div className="text-2xl font-bold">{totalDuration} min</div>
                </div>

                {/* Panier des Prestations */}
                {selectedServices.length > 0 && (
                  <div className="mt-4 p-4 glass rounded-xl border-2 border-accent/20 bg-accent/5">
                    <h3 className="font-bold text-secondary mb-3 flex items-center gap-2">
                      <ShoppingCart size={16} className="text-accent" /> Prestations sélectionnées
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                      {selectedServices.map(id => {
                        const product = products.find(p => p.id === id);
                        if (!product) return null;
                        return (
                          <div key={id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg shadow-sm">
                            <span className="font-medium text-gray-700 truncate mr-2">{product.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-accent font-bold">{product.price.toFixed(2)} DH</span>
                              <button onClick={() => toggleService(id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: POS-style Services */}
              <div className="w-full lg:w-2/3 flex flex-col">
                <div className="font-bold mb-3 text-secondary text-sm uppercase tracking-wider">Prestations demandées</div>
                
                {/* Categories Tab */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-300 font-bold border-2 ${activeCategory === cat ? 'bg-accent border-accent text-white shadow-md shadow-accent/30 scale-105' : 'bg-white/60 border-transparent hover:bg-white hover:border-accent/30 text-gray-600 hover:shadow-sm'}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto content-start pb-4 max-h-[400px] custom-scrollbar">
                  {filteredProducts.map(product => {
                    const isSelected = selectedServices.includes(product.id);
                    return (
                      <div 
                        key={product.id} 
                        onClick={() => toggleService(product.id)}
                        className={`relative glass flex flex-col items-center justify-center p-3 min-h-[110px] cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-2 ${isSelected ? 'border-accent bg-accent/5' : 'border-white/60 bg-gradient-to-br from-white/90 to-white/40'}`}
                      >
                        <div className="text-3xl mb-2 drop-shadow-sm">{product.icon}</div>
                        <div className="font-semibold text-xs text-center mb-1 text-secondary/90 leading-tight">{product.name}</div>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-accent font-black text-sm">{product.price.toFixed(2)} DH</span>
                          <span className="text-gray-400 text-xs font-medium">{product.duration}m</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-accent">
                            <CheckSquare size={18} className="fill-accent/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4 pt-6 border-t border-gray-100 shrink-0">
              {editingReservationId && (
                <>
                  <button 
                    className="btn btn-danger flex-1"
                    onClick={handleDeleteReservation}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    className="btn flex-1 bg-green-500 text-white hover:bg-green-600 flex items-center justify-center gap-2"
                    onClick={() => {
                      navigate('/', { state: { 
                        reservationForCheckout: {
                          id: editingReservationId,
                          name: clientName,
                          phone: clientPhone,
                          serviceIds: selectedServices,
                          employeeId: selectedEmp
                        }
                      }});
                    }}
                  >
                    <ShoppingCart size={18} /> Encaisser
                  </button>
                </>
              )}
              <button 
                className={`btn btn-primary flex-1 ${!editingReservationId ? 'w-full' : ''}`}
                disabled={selectedServices.length === 0 || !selectedEmp || !clientName}
                onClick={handleSaveReservation}
              >
                {editingReservationId ? 'Enregistrer' : 'Ajouter Rendez-vous'}
              </button>
            </div>
          </div>
        </div>
      )}

    {isListModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <List className="text-primary" size={24} /> 
              Liste des Réservations à venir
            </h2>
            <button onClick={() => setIsListModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 overflow-y-auto">
            <div className="space-y-3">
              {reservationsList
                .filter(r => new Date(`${r.date}T${r.time}`) >= new Date(new Date().setHours(0,0,0,0)))
                .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
                .map(res => {
                  const emp = employees.find(e => e.id.toString() === res.employeeId?.toString());
                  return (
                    <div key={res.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all bg-white gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-lg">{res.name}</span>
                        {res.phone && <span className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone size={12} /> {res.phone}</span>}
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm">
                          {format(new Date(res.date), 'dd/MM/yyyy')} à {res.time}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <User size={14} className="text-gray-400" /> {emp ? emp.name : 'Non assigné'}
                        </span>
                      </div>
                    </div>
                  );
              })}
              {reservationsList.filter(r => new Date(`${r.date}T${r.time}`) >= new Date(new Date().setHours(0,0,0,0))).length === 0 && (
                <div className="text-center text-gray-500 py-10">Aucune réservation à venir.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default Reservations;
