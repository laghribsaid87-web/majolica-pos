import React, { useState, useEffect, useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchReservations, saveReservation, fetchEmployees, fetchProducts, fetchAdminPhone } from "../services/api";
import { Check, ChevronRight, CheckCircle, ArrowLeft, X, Star, Clock, MessageCircle, ShoppingBag, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

const Booking = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reservations, setReservations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [adminPhone, setAdminPhone] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchReservations().then(setReservations);
    fetchEmployees().then(setEmployees);
    fetchProducts().then(data => {
      // Hide Carte Club from online booking services
      const bookableProducts = data.filter(p => p.id !== 36);
      setProducts(bookableProducts);
      if (bookableProducts.length > 0) setActiveCategory(bookableProducts[0].category);
    });
    fetchAdminPhone().then(setAdminPhone);
  }, []);

  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => p.category === activeCategory);

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalDuration = useMemo(() =>
    selectedServices.reduce((sum, id) => {
      const p = products.find(p => p.id === id);
      return sum + (p ? p.duration : 0);
    }, 0), [selectedServices, products]);

  const totalPrice = useMemo(() =>
    selectedServices.reduce((sum, id) => {
      const p = products.find(p => p.id === id);
      return sum + (p ? p.price : 0);
    }, 0), [selectedServices, products]);

  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));
  const timeToMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 11; h <= 19; h++) {
      slots.push(String(h).padStart(2, "0") + ":00");
      if (h !== 19) slots.push(String(h).padStart(2, "0") + ":30");
    }
    return slots;
  };

  const availableTimeSlots = useMemo(() => {
    if (totalDuration === 0) return [];
    const allSlots = generateTimeSlots();
    const dayRes = reservations.filter(r =>
      format(new Date(r.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") && r.status !== "Annule"
    );
    return allSlots.filter(slot => {
      const reqStart = timeToMinutes(slot);
      const reqEnd = reqStart + totalDuration;
      return employees.some(emp => {
        const empRes = dayRes.filter(r => r.employeeId?.toString() === emp.id?.toString());
        return !empRes.some(r => {
          const rStart = timeToMinutes(r.time);
          const rEnd = rStart + r.duration;
          return Math.max(reqStart, rStart) < Math.min(reqEnd, rEnd);
        });
      });
    });
  }, [selectedDate, totalDuration, reservations, employees]);

  const handleSubmit = () => {
    const reqStart = timeToMinutes(selectedTime);
    const reqEnd = reqStart + totalDuration;
    const dayRes = reservations.filter(r =>
      format(new Date(r.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") && r.status !== "Annule"
    );
    const assigned = employees.find(emp => {
      const empRes = dayRes.filter(r => r.employeeId?.toString() === emp.id?.toString());
      return !empRes.some(r => {
        const rStart = timeToMinutes(r.time);
        const rEnd = rStart + r.duration;
        return Math.max(reqStart, rStart) < Math.min(reqEnd, rEnd);
      });
    });
    if (!assigned) { alert("Ce creneau n'est plus disponible."); return; }
    saveReservation({
      employeeId: assigned.id.toString(),
      time: selectedTime,
      duration: totalDuration,
      name: clientName.trim(),
      phone: clientPhone.trim(),
      service: selectedServices.map(id => products.find(p => p.id === id)?.name).join(" + "),
      serviceIds: selectedServices,
      status: "En attente",
      date: selectedDate.toISOString(),
      isOnlineBooking: true
    });
    setIsSuccess(true);
  };

  const steps = ["Prestations", "Date et Heure", "Vos infos"];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-rose-200/50">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation envoyee ! 🎉</h2>
          <p className="text-gray-500 mb-2">Merci <strong className="text-gray-800">{clientName}</strong> !</p>
          <p className="text-gray-500 mb-6 text-sm">
            Votre RDV du <strong>{format(selectedDate, "dd/MM")} a {selectedTime}</strong> est en attente.
          </p>
          {adminPhone && (
            <a
              href={"https://wa.me/" + adminPhone.replace(/\D/g, "") + "?text=Bonjour ! Je viens de faire une reservation en ligne pour le " + format(selectedDate, "dd/MM") + " a " + selectedTime + ". Je suis " + clientName}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-2xl font-bold text-sm mb-3"
            >
              <MessageCircle size={18} /> Confirmer via WhatsApp
            </a>
          )}
          <button onClick={() => window.location.reload()} className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold">
            Nouvelle reservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ paddingBottom: "80px" }}>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : null}
            className={"p-2 rounded-full transition-colors " + (step > 1 ? "text-gray-700 hover:bg-gray-100" : "text-gray-300 cursor-default")}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="text-xs text-gray-400 font-medium">Majolica Beauty</div>
            <div className="text-sm font-bold text-gray-800">{steps[step - 1]}</div>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={"h-1.5 rounded-full transition-all duration-300 " + (i + 1 === step ? "w-6 bg-rose-500" : i + 1 < step ? "w-1.5 bg-rose-300" : "w-1.5 bg-gray-200")} />
            ))}
          </div>
        </div>
      </header>

      {/* SALON BANNER — identité RDV */}
      {step === 1 && (
        <div style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)" }} className="text-white px-5 pt-5 pb-4">
          {/* Main title — très visible */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📅</span>
            <div>
              <div className="font-black text-lg leading-tight tracking-tight">Réservez votre</div>
              <div className="font-black text-xl leading-tight tracking-tight">Rendez-vous 🌸</div>
            </div>
          </div>
          <div className="text-white/80 text-xs mb-3 pl-9">Choisissez vos soins, votre date et votre heure</div>

          {/* Salon info — petite */}
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            <img src="/logo1.jpg" alt="Majolica" className="w-8 h-8 rounded-lg object-cover border border-white/30 shrink-0" onError={e => { e.target.style.display = "none"; }} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">Majolica Beauty</div>
              <div className="text-white/70 text-xs flex items-center gap-1">
                <Star size={9} className="fill-yellow-300 text-yellow-300" /> 4.4 · Casablanca
              </div>
            </div>
            <div className="text-white/60 text-xs font-medium">Salon de beauté</div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1">

        {/* STEP 1: SERVICES */}
        {step === 1 && (
          <div>
            <div className="sticky top-14 z-40 bg-white border-b border-gray-100">
              <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={"px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 " + (activeCategory === cat ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-4 space-y-3">
              {filteredProducts.map(product => {
                const isSelected = selectedServices.includes(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleService(product.id)}
                    className={"w-full text-left rounded-2xl p-4 flex justify-between items-center transition-all duration-200 border-2 " + (isSelected ? "border-rose-400 bg-rose-50" : "border-gray-100 bg-white shadow-sm")}
                  >
                    <div className="flex-1 pr-3">
                      <div className={"font-bold text-base mb-1 " + (isSelected ? "text-rose-700" : "text-gray-800")}>{product.name}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock size={11} /> {product.duration} min
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={"font-black text-base " + (isSelected ? "text-rose-600" : "text-gray-700")}>
                        {product.price.toFixed(0)} DH
                      </div>
                      <div className={"w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all " + (isSelected ? "bg-rose-500 border-rose-500 text-white" : "border-gray-200 text-gray-300")}>
                        {isSelected ? <Check size={14} strokeWidth={3} /> : <span className="text-lg leading-none">+</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* PROMO CARTE CLUB — soft feminine */}
            <div className="px-4 pb-6">
              <div className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "linear-gradient(120deg, #fce4ec 0%, #f8bbd0 50%, #e1bee7 100%)" }}>
                {/* Decorative circle */}
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #e91e8c, transparent)" }} />

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl shadow-sm" style={{ background: "linear-gradient(135deg, #f48fb1, #ce93d8)" }}>
                  🌸
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-0.5">Offre Exclusive • 1 An</div>
                  <div className="font-black text-rose-800 text-sm leading-tight">Carte Club Majolica</div>
                  <div className="text-rose-600 text-xs mt-0.5 truncate">Avantages & réductions membres ✦</div>
                </div>

                {/* CTA */}
                <a
                  href={"https://wa.me/" + (adminPhone || "").replace(/\D/g, "") + "?text=Bonjour%20Majolica%20!%20Je%20souhaite%20demander%20ma%20Carte%20Club%20virtuelle%20(1%20an)%20%F0%9F%8C%B8"}
                  target="_blank" rel="noreferrer"
                  className="shrink-0 rounded-xl px-3 py-2 font-bold text-xs text-white active:scale-95 transition-all shadow-sm"
                  style={{ background: "linear-gradient(135deg, #e91e8c, #9c27b0)" }}
                >
                  Demander →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === 2 && (
          <div className="px-4 py-5">
            <h2 className="font-bold text-gray-800 text-base mb-4">Choisissez une date</h2>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 mb-7">
              {availableDates.map(date => {
                const isSel = isSameDay(selectedDate, date);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { setSelectedDate(date); setSelectedTime(""); }}
                    className={"flex flex-col items-center justify-center min-w-16 py-3.5 rounded-2xl border-2 transition-all shrink-0 " + (isSel ? "bg-rose-500 border-rose-500 text-white shadow-lg" : "bg-white border-gray-100 text-gray-700")}
                  >
                    <span className={"text-xs font-semibold uppercase mb-1 " + (isSel ? "text-rose-100" : "text-gray-400")}>
                      {format(date, "EEE", { locale: fr })}
                    </span>
                    <span className="text-xl font-black">{format(date, "d")}</span>
                    <span className={"text-xs font-semibold uppercase mt-0.5 " + (isSel ? "text-rose-100" : "text-gray-400")}>
                      {format(date, "MMM", { locale: fr })}
                    </span>
                  </button>
                );
              })}
            </div>
            <h2 className="font-bold text-gray-800 text-base mb-4">Choisissez une heure</h2>
            {availableTimeSlots.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl text-sm">
                Aucune disponibilite pour ce jour.<br />Essayez une autre date.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {availableTimeSlots.map(time => {
                  const isSel = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={"py-3.5 rounded-2xl text-center font-bold text-base border-2 transition-all " + (isSel ? "bg-rose-500 border-rose-500 text-white shadow-md" : "bg-white border-gray-100 text-gray-700")}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CLIENT INFO */}
        {step === 3 && (
          <div className="px-4 py-5">
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-2">
                <Clock size={14} /> Votre reservation
              </div>
              <div className="text-gray-800 font-bold">{format(selectedDate, "EEEE d MMMM", { locale: fr })} a {selectedTime}</div>
              <div className="text-gray-500 text-xs mt-1">{selectedServices.map(id => products.find(p => p.id === id)?.name).join(" + ")}</div>
              <div className="font-black text-rose-600 text-lg mt-2">{totalPrice.toFixed(0)} DH</div>
            </div>
            <h2 className="font-bold text-gray-800 text-base mb-4">Vos coordonnees</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prenom et Nom</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Sara Alaoui"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 outline-none focus:border-rose-400 transition-colors text-base text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Telephone</label>
                <div className="flex gap-2">
                  <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-600 font-bold text-sm shrink-0">+212</div>
                  <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="06 00 00 00 00"
                    className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 outline-none focus:border-rose-400 transition-colors text-base text-gray-800" />
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Sparkles size={11} className="text-rose-400" /> Vous recevrez une confirmation
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
        {step === 1 && selectedServices.length > 0 && (
          <div>
            {cartOpen && (
              <div className="border-b border-gray-100 bg-white px-4 py-3 max-h-48 overflow-y-auto">
                {selectedServices.map(id => {
                  const p = products.find(p => p.id === id);
                  return p ? (
                    <div key={id} className="flex justify-between items-center py-2 text-sm">
                      <span className="text-gray-700 font-medium flex-1 pr-2">{p.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-rose-600 font-bold">{p.price.toFixed(0)} DH</span>
                        <button onClick={() => toggleService(id)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            <button onClick={() => setCartOpen(!cartOpen)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={13} className="text-rose-400" />
                <strong className="text-gray-700">{selectedServices.length} prestation{selectedServices.length > 1 ? "s" : ""}</strong>
                &nbsp;&bull; {totalDuration} min
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                {cartOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </span>
            </button>
          </div>
        )}
        <div className="px-4 py-3">
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && selectedServices.length > 0) setStep(2);
                else if (step === 2 && selectedTime) setStep(3);
              }}
              disabled={step === 1 ? selectedServices.length === 0 : !selectedTime}
              className="w-full bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:shadow-none"
            >
              {step === 1
                ? (selectedServices.length === 0 ? "Selectionnez une prestation" : "Continuer - " + totalPrice.toFixed(0) + " DH")
                : "Confirmer l'heure"}
              {((step === 1 && selectedServices.length > 0) || (step === 2 && !!selectedTime)) && (
                <ChevronRight size={18} strokeWidth={3} />
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!clientName.trim() || !clientPhone.trim()}
              className="w-full bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:shadow-none"
            >
              Reserver mon moment ✨
            </button>
          )}
        </div>
      </div>

      {adminPhone && (
        <a
          href={"https://wa.me/" + adminPhone.replace(/\D/g, "") + "?text=Bonjour%20Majolica%20!%20Je%20voudrais%20reserver."}
          target="_blank" rel="noreferrer"
          className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <MessageCircle size={22} />
        </a>
      )}
    </div>
  );
};

export default Booking;
