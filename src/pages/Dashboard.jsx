import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Upload, DollarSign, Award, Filter, Printer, Wallet, Activity, X, FileText, Minus, Plus, Trash2 } from 'lucide-react';
import { fetchHistory, fetchExpenses, fetchEmployees, fetchSalonConfig, saveOrder, saveExpense, deleteExpense } from '../services/api';
import { db, isFirebaseConfigured } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { format, isToday, isYesterday, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { printZReportTCP } from '../utils/printer';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [monthlyElec, setMonthlyElec] = useState(0);
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'yesterday', 'all', 'custom'
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Details Modal State
  const [detailModal, setDetailModal] = useState({ isOpen: false, title: '', data: [], type: '' });

  // Import Historique Modal State
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState([
    { date: format(new Date(), 'yyyy-MM-dd'), ca: '', sortieCaisse: '', descCaisse: '', sortiePoche: '', descPoche: '' }
  ]);
  const [importLoading, setImportLoading] = useState(false);
  const [importDone, setImportDone] = useState(false);

  useEffect(() => {
    fetchHistory().then(setHistory);
    fetchExpenses().then(setExpenses);
    fetchEmployees().then(setEmployees);
    fetchSalonConfig().then(c => {
      setMonthlyRent(c?.monthlyRent || 0);
      setMonthlyElec(c?.monthlyElec || 0);
    });
  }, []);

  // Filter history based on selected date range
  const filteredHistory = useMemo(() => {
    return history.filter(order => {
      const orderDate = new Date(order.timestamp || order.date); // Handle both formats if they exist
      if (isNaN(orderDate.getTime())) return true; // Fallback if date is missing
      
      switch (dateFilter) {
        case 'today':
          return isToday(orderDate);
        case 'yesterday':
          return isYesterday(orderDate);
        case 'custom':
          return isWithinInterval(orderDate, {
            start: startOfDay(new Date(customStartDate)),
            end: endOfDay(new Date(customEndDate))
          });
        case 'all':
        default:
          return true;
      }
    });
  }, [history, dateFilter, customStartDate, customEndDate]);

  // Filter expenses based on selected date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (isNaN(expenseDate.getTime())) return true;
      
      switch (dateFilter) {
        case 'today':
          return isToday(expenseDate);
        case 'yesterday':
          return isYesterday(expenseDate);
        case 'custom':
          return isWithinInterval(expenseDate, {
            start: startOfDay(new Date(customStartDate)),
            end: endOfDay(new Date(customEndDate))
          });
        case 'all':
        default:
          return true;
      }
    });
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  // Calculate period days for prorated salary
  const periodDays = useMemo(() => {
    switch(dateFilter) {
      case 'today': return 1;
      case 'yesterday': return 1;
      case 'custom': 
        return Math.max(1, Math.ceil((new Date(customEndDate) - new Date(customStartDate)) / (1000 * 60 * 60 * 24)) + 1);
      case 'all': 
        if (history.length === 0) return 1;
        const firstDate = new Date(Math.min(...history.map(h => new Date(h.timestamp || h.date).getTime())));
        return Math.max(1, Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24)));
      default: return 1;
    }
  }, [dateFilter, customStartDate, customEndDate, history]);

  // Calculate daily salary cost
  const dailySalariesCost = useMemo(() => {
    return employees.reduce((sum, emp) => sum + ((emp.baseSalary || 0) / 30), 0);
  }, [employees]);

  const totalSalariesCost = dailySalariesCost * periodDays;
  
  // Calculate daily rent cost
  const dailyRentCost = monthlyRent / 30;
  const totalRentCost = dailyRentCost * periodDays;

  // Calculate daily electricity/water cost
  const dailyElecCost = monthlyElec / 30;
  const totalElecCost = dailyElecCost * periodDays;

  // Aggregate stats globally
  const totalSales = filteredHistory.reduce((sum, order) => sum + order.total, 0);
  
  // Exclude fixed charges from recorded expenses since we calculate the true cost automatically
  const totalRecordedExpenses = filteredExpenses
    .filter(e => !['Salaires', 'Avance Salaire', 'Loyer', 'Électricité & Eau'].includes(e.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const totalExpenses = totalRecordedExpenses + totalSalariesCost + totalRentCost + totalElecCost;
  const netProfit = totalSales - totalExpenses;
  const totalTransactions = filteredHistory.length;

  const totalPersonnel = filteredExpenses.filter(e => e.paymentMethod === 'personnel').reduce((sum, e) => sum + e.amount, 0);

  // État de Caisse: CA - tout ce qui est sorti de la caisse (achats + avances + retrait patronne)
  const totalSortiesCaisse = filteredExpenses
    .filter(e => e.paymentMethod === 'caisse')
    .reduce((sum, e) => sum + e.amount, 0);
  const etatCaisse = totalSales - totalSortiesCaisse;
  
  // Part Patronne: Poche/Banque + Ce qu'elle a retiré de la caisse
  const totalRetraitsPatronne = filteredExpenses
    .filter(e => e.category === 'Retrait Patronne')
    .reduce((sum, e) => sum + e.amount, 0);

  // Specific splits for the cascade view
  const totalAvances = filteredExpenses
    .filter(e => ['Avance Salaire', 'Salaires'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalAvancesCaisse = filteredExpenses
    .filter(e => ['Avance Salaire', 'Salaires'].includes(e.category) && e.paymentMethod === 'caisse')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalSortiesCaisseSansAvanceEtRetrait = totalSortiesCaisse - totalAvancesCaisse - totalRetraitsPatronne;


  // Aggregate stats by employee
  const employeeStats = useMemo(() => {
    const stats = {};
    filteredHistory.forEach(order => {
      const empName = order.employeeName || 'Inconnu';
      if (!stats[empName]) {
        stats[empName] = { name: empName, totalSales: 0, transactions: 0, services: [] };
      }
      stats[empName].totalSales += order.total;
      stats[empName].transactions += 1;
      order.items.forEach(item => {
        stats[empName].services.push(`${item.qty}x ${item.name}`);
      });
    });
    
    // Add cost and profit calculations
    return Object.values(stats).map(stat => {
      const empData = employees.find(e => e.name === stat.name);
      const dailyCost = empData ? ((empData.baseSalary || 0) / 30) : 0;
      const costForPeriod = dailyCost * periodDays;
      return {
        ...stat,
        cost: costForPeriod,
        profit: stat.totalSales - costForPeriod
      };
    }).sort((a, b) => b.profit - a.profit); // Sort by profit instead of just sales
  }, [filteredHistory, employees, periodDays]);

  // Excel-like Daily Financials
  const dailyFinancials = useMemo(() => {
    const days = {};
    
    // Add all sales
    filteredHistory.forEach(order => {
      const orderDate = new Date(order.timestamp || order.date);
      if (isNaN(orderDate.getTime())) return;
      const dateStr = format(orderDate, 'yyyy-MM-dd');
      if (!days[dateStr]) days[dateStr] = { date: dateStr, ca: 0, sortieCaisse: 0, sortiePoche: 0 };
      days[dateStr].ca += order.total;
    });

    // Add all expenses
    filteredExpenses.forEach(exp => {
      const expenseDate = new Date(exp.date);
      if (isNaN(expenseDate.getTime())) return;
      const dateStr = format(expenseDate, 'yyyy-MM-dd');
      if (!days[dateStr]) days[dateStr] = { date: dateStr, ca: 0, sortieCaisse: 0, sortiePoche: 0 };
      
      if (exp.paymentMethod === 'caisse') {
        days[dateStr].sortieCaisse += exp.amount;
      } else if (exp.paymentMethod === 'personnel') {
        days[dateStr].sortiePoche += exp.amount;
      }
    });

    // Convert to array and sort by date descending (newest first) for better visibility,
    // but we need ascending to calculate cumulative properly.
    const sortedDays = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate running totals
    const calculatedDays = sortedDays.reduce((acc, day) => {
      const recetteCaisse = day.ca - day.sortieCaisse;
      const fluxPocheJour = recetteCaisse - day.sortiePoche;
      const prevSolde = acc.length > 0 ? acc[acc.length - 1].soldePocheCumul : 0;
      
      acc.push({
        ...day,
        recetteCaisse,
        soldePocheCumul: prevSolde + fluxPocheJour
      });
      return acc;
    }, []);

    // Return ascending (oldest first)
    return calculatedDays;
  }, [filteredHistory, filteredExpenses]);

  const handleExportCSV = () => {
    let csvContent = "Date,Employée,Détail des Prestations,Total (MAD)\n";
    filteredHistory.forEach(order => {
      const orderDate = new Date(order.timestamp || order.date);
      const dateStr = isNaN(orderDate.getTime()) ? '-' : `${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`;
      const itemsStr = order.items.map(item => `${item.qty}x ${item.name}`).join(' | ');
      const employee = order.employeeName || 'Inconnu';
      csvContent += `"${dateStr}","${employee}","${itemsStr}",${order.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Majolica_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <h1 className="page-header mb-0">Performances & Historique</h1>
        
        {/* Date Filter Controls */}
        <div className="glass px-4 py-2 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-secondary font-medium">
            <Filter size={18} /> Période :
          </div>
          <select 
            className="bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-secondary outline-none focus:border-secondary"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="all">Toujours</option>
            <option value="custom">Date Personnalisée...</option>
          </select>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white/50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-sm"
              />
              <span className="text-gray-500">à</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white/50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-sm"
              />
            </div>
          )}

          <button 
            onClick={async () => {
              const savedIp = localStorage.getItem('printer_ip');
              if (!savedIp) {
                alert("Veuillez configurer l'adresse IP de l'imprimante dans les Paramètres pour imprimer le Rapport Z.");
                return;
              }
              const reportInfo = {
                shopName: localStorage.getItem('ticket_shop_name') || 'MAJOLICA POS',
                date: new Date(),
                totalSales: totalSales,
                cashSales: totalSales, // everything is cash for now
                cardSales: 0,
                totalExpenses: totalSortiesCaisse,
                ordersCount: totalTransactions,
                paperSize: localStorage.getItem('printer_paper_size') || '80mm'
              };
              try {
                await printZReportTCP(savedIp, reportInfo);
              } catch (e) {
                alert(e.message);
              }
            }}
            className="btn btn-primary flex items-center gap-2 ml-auto"
            title="Imprimer un récapitulatif de la période sélectionnée"
          >
            <Printer size={18} /> Bilan de Caisse
          </button>
          <button 
            onClick={handleExportCSV}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            title="Télécharger l'historique en Excel/CSV"
          >
            <Upload size={18} className="rotate-180" /> Exporter CSV
          </button>
          <button 
            onClick={() => { setShowImport(true); setImportDone(false); }}
            className="btn flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
            title="Saisir les données historiques manuelles"
          >
            <Upload size={18} /> Saisie Historique
          </button>
        </div>
      </div>


      {/* === TABLEAU FLUX DE TRÉSORERIE (VISION PATRONNE) === */}
      <div className="glass p-6 overflow-x-auto print:hidden mb-8 shadow-xl border-2 border-purple-100 rounded-3xl">
        <h2 className="text-xl font-black mb-2 text-purple-800 flex items-center gap-2">
          <FileText className="text-purple-600" size={24} /> Trésorerie & Vision Patronne
        </h2>
        <p className="text-gray-500 text-sm mb-6">Suivi journalier du Chiffre d'Affaires, des dépenses en caisse ou de votre poche, et du reste accumulé.</p>
        
        <table className="w-full text-left border-collapse min-w-[800px] text-sm">
          <thead>
            <tr className="bg-purple-50">
              <th className="p-3 text-purple-800 font-bold border-b-2 border-purple-200 rounded-tl-xl">Date</th>
              <th className="p-3 text-purple-800 font-bold border-b-2 border-purple-200 text-right">CA (Ventes)</th>
              <th className="p-3 text-red-600 font-bold border-b-2 border-purple-200 text-right">Sortie Caisse</th>
              <th className="p-3 text-green-700 font-bold border-b-2 border-purple-200 text-right">Recette (Reste en Caisse)</th>
              <th className="p-3 text-orange-600 font-bold border-b-2 border-purple-200 text-right">Sortie Poche/Banque</th>
              <th className="p-3 text-blue-800 font-bold border-b-2 border-purple-200 text-right rounded-tr-xl">Total Cumulé (Poche/Banque)</th>
            </tr>
          </thead>
          <tbody>
            {dailyFinancials.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-400">
                  Aucune donnée financière pour cette période.
                </td>
              </tr>
            ) : (
              dailyFinancials.map((day, i) => (
                <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-bold text-gray-700">{format(parseISO(day.date), 'dd/MM/yyyy')}</td>
                  
                  {/* CA Cell */}
                  <td
                    className={`p-3 text-right font-medium text-gray-800 ${day.ca > 0 ? 'cursor-pointer hover:bg-purple-50 hover:text-purple-700' : ''}`}
                    onClick={() => {
                      if (day.ca === 0) return;
                      const daySales = filteredHistory.filter(o => {
                        const d = new Date(o.timestamp || o.date);
                        return format(d, 'yyyy-MM-dd') === day.date;
                      });
                      setDetailModal({ isOpen: true, title: `CA du ${format(parseISO(day.date), 'dd/MM/yyyy')}`, type: 'sales', data: daySales });
                    }}
                  >
                    {day.ca > 0 ? <span className="underline decoration-dotted">{day.ca.toFixed(2)}</span> : day.ca.toFixed(2)}
                  </td>

                  {/* Sortie Caisse Cell */}
                  <td
                    className={`p-3 text-right text-red-500 font-medium ${day.sortieCaisse > 0 ? 'cursor-pointer hover:bg-red-50' : ''}`}
                    onClick={() => {
                      if (day.sortieCaisse === 0) return;
                      const dayExp = filteredExpenses.filter(e => e.paymentMethod === 'caisse' && e.date === day.date);
                      setDetailModal({ isOpen: true, title: `Sorties Caisse du ${format(parseISO(day.date), 'dd/MM/yyyy')}`, type: 'expenses', data: dayExp });
                    }}
                  >
                    {day.sortieCaisse > 0 ? <span className="underline decoration-dotted">-{day.sortieCaisse.toFixed(2)}</span> : `-${day.sortieCaisse.toFixed(2)}`}
                  </td>

                  {/* Recette Cell */}
                  <td className="p-3 text-right text-green-600 font-bold bg-green-50/30">
                    {day.recetteCaisse.toFixed(2)}
                  </td>

                  {/* Sortie Poche Cell */}
                  <td
                    className={`p-3 text-right text-orange-500 font-medium ${day.sortiePoche > 0 ? 'cursor-pointer hover:bg-orange-50' : ''}`}
                    onClick={() => {
                      if (day.sortiePoche === 0) return;
                      const dayExp = filteredExpenses.filter(e => e.paymentMethod === 'personnel' && e.date === day.date);
                      setDetailModal({ isOpen: true, title: `Sorties Poche/Banque du ${format(parseISO(day.date), 'dd/MM/yyyy')}`, type: 'expenses', data: dayExp });
                    }}
                  >
                    {day.sortiePoche > 0 ? <span className="underline decoration-dotted">-{day.sortiePoche.toFixed(2)}</span> : `-${day.sortiePoche.toFixed(2)}`}
                  </td>

                  {/* Total Cumulé Cell */}
                  <td className="p-3 text-right font-black text-blue-700 bg-blue-50/30">
                    {day.soldePocheCumul.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
            {/* Totals Row */}
            {dailyFinancials.length > 0 && (
              <tr className="bg-gray-100 font-black">
                <td className="p-3 text-gray-700">TOTAL PÉRIODE</td>
                <td className="p-3 text-right text-gray-800">{dailyFinancials.reduce((sum, d) => sum + d.ca, 0).toFixed(2)}</td>
                <td className="p-3 text-right text-red-600">-{dailyFinancials.reduce((sum, d) => sum + d.sortieCaisse, 0).toFixed(2)}</td>
                <td className="p-3 text-right text-green-700">{dailyFinancials.reduce((sum, d) => sum + d.recetteCaisse, 0).toFixed(2)}</td>
                <td className="p-3 text-right text-orange-600">-{dailyFinancials.reduce((sum, d) => sum + d.sortiePoche, 0).toFixed(2)}</td>
                <td className="p-3 text-right text-blue-800">--</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === BILAN FINANCIER CASCADE === */}
      <div className="glass p-6 md:p-8 rounded-3xl mb-8 border-2 border-indigo-100 shadow-xl print:hidden">
        <h2 className="text-xl font-black text-secondary mb-6 flex items-center gap-2">
          <FileText className="text-indigo-500" size={28} /> Bilan Financier
        </h2>

        {/* Ligne CA */}
        <div 
          className="flex justify-between items-center mb-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
          onClick={() => setDetailModal({
            isOpen: true,
            title: "Détail du Chiffre d'Affaires",
            type: 'sales',
            data: filteredHistory
          })}
        >
          <span className="text-gray-600 font-bold flex items-center gap-2">
            <DollarSign size={18} className="text-accent" /> Chiffre d'Affaires
          </span>
          <span className="text-xl font-black text-secondary">{totalSales.toFixed(2)} DH</span>
        </div>

        {/* Ligne Sorties Caisse */}
        <div 
          className="flex justify-between items-center mb-2 text-sm cursor-pointer hover:bg-red-50 p-2 -mx-2 rounded-lg transition-colors"
          onClick={() => setDetailModal({
            isOpen: true,
            title: 'Détail des Sorties Caisse (Achats)',
            type: 'expenses',
            data: filteredExpenses.filter(e => e.paymentMethod === 'caisse' && !['Avance Salaire', 'Salaires', 'Retrait Patronne'].includes(e.category))
          })}
        >
          <span className="text-gray-500 flex items-center gap-2">
            <Minus size={14} className="text-red-500" /> Sorties Caisse (Achats)
          </span>
          <span className="font-bold text-red-500">{totalSortiesCaisseSansAvanceEtRetrait.toFixed(2)} DH</span>
        </div>

        {/* Ligne Avances */}
        <div 
          className="flex justify-between items-center mb-2 text-sm cursor-pointer hover:bg-orange-50 p-2 -mx-2 rounded-lg transition-colors"
          onClick={() => setDetailModal({
            isOpen: true,
            title: 'Détail des Avances & Salaires',
            type: 'expenses',
            data: filteredExpenses.filter(e => ['Avance Salaire', 'Salaires'].includes(e.category) && e.paymentMethod === 'caisse')
          })}
        >
          <span className="text-gray-500 flex items-center gap-2">
            <Minus size={14} className="text-orange-500" /> Avance / Paiement Salaire (Caisse)
          </span>
          <span className="font-bold text-orange-500">{totalAvancesCaisse.toFixed(2)} DH</span>
        </div>

        {/* Ligne Poche / Banque */}
        <div 
          className="flex justify-between items-center mb-2 text-sm cursor-pointer hover:bg-purple-50 p-2 -mx-2 rounded-lg transition-colors"
          onClick={() => setDetailModal({
            isOpen: true,
            title: 'Détail des Sorties Poche / Banque',
            type: 'expenses',
            data: filteredExpenses.filter(e => e.paymentMethod === 'personnel')
          })}
        >
          <span className="text-gray-500 flex items-center gap-2">
            <Minus size={14} className="text-purple-500" /> Sorties Poche / Banque (Ne touche pas la caisse)
          </span>
          <span className="font-bold text-purple-500">{totalPersonnel.toFixed(2)} DH</span>
        </div>

        {/* = RESTE CAISSE */}
        <div 
          className="mt-4 pt-4 mb-6 border-t border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-200 rounded-xl text-green-700">
              <Wallet size={24} />
            </div>
            <div>
              <div className="font-black text-green-800 text-lg">RESTE CAISSE</div>
              <div className="text-[10px] text-green-600 uppercase tracking-widest font-bold">Argent physique disponible</div>
            </div>
          </div>
          <div className="text-3xl font-black text-green-700">{etatCaisse.toFixed(2)} <span className="text-xl">DH</span></div>
        </div>

        {/* Separator for Profit calculation */}
        <div className="mt-8 mb-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center relative">
          <span className="bg-[#FAFAFA] px-4 relative z-10 text-indigo-400">Déductions pour le Bénéfice</span>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-indigo-100 -z-0"></div>
        </div>

        {/* Ligne Charges Fixes - Loyer */}
        <div className="flex justify-between items-center mb-2 text-sm p-2 -mx-2">
          <span className="text-gray-500 flex items-center gap-2">
            <Minus size={14} className="text-gray-400" /> Loyer (Provisionné)
          </span>
          <span className="font-bold text-gray-600">{totalRentCost.toFixed(2)} DH</span>
        </div>

        {/* Ligne Charges Fixes - Elec */}
        <div className="flex justify-between items-center mb-2 text-sm p-2 -mx-2">
          <span className="text-gray-500 flex items-center gap-2">
            <Minus size={14} className="text-gray-400" /> Eau & Élec (Provisionné)
          </span>
          <span className="font-bold text-gray-600">{totalElecCost.toFixed(2)} DH</span>
        </div>

        {/* Ligne Salaires Restants */}
        <div className="flex justify-between items-center mb-2 text-sm p-2 -mx-2 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium flex items-center gap-2">
            <Minus size={14} className="text-gray-500" /> Salaires Restants 
            {totalAvances > 0 && <span className="text-[10px] text-orange-500 font-bold bg-orange-100 px-2 py-0.5 rounded-full">(Après avance)</span>}
          </span>
          <span className="font-bold text-gray-700">{(totalSalariesCost - totalAvances).toFixed(2)} DH</span>
        </div>

        {/* = BÉNÉFICE NET */}
        <div className={`mt-6 pt-6 border-t flex justify-between items-center p-5 rounded-2xl border-2 shadow-sm ${netProfit >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${netProfit >= 0 ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'}`}>
              <Activity size={24} />
            </div>
            <div>
              <div className={`font-black text-lg ${netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>BÉNÉFICE NET</div>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Rentabilité du jour</div>
            </div>
          </div>
          <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {netProfit.toFixed(2)} <span className="text-xl">DH</span>
          </div>
        </div>

      </div>

      {/* === KPIs secondaires === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:hidden">
        <div 
          className="glass p-5 flex items-center gap-4 cursor-pointer hover:bg-white/60 transition-all hover:ring-2 hover:ring-blue-300"
          onClick={() => setDetailModal({
            isOpen: true,
            title: "Détail des Prestations",
            type: 'sales',
            data: filteredHistory
          })}
        >
          <div className="p-3 bg-blue-100 rounded-xl text-blue-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">Prestations</div>
            <div className="text-xl font-black text-secondary">{totalTransactions}</div>
          </div>
        </div>
      </div>

      {/* Employee Leaderboard */}
      <div className="mb-8 print:hidden">
        <h2 className="text-xl font-bold mb-4 text-secondary flex items-center gap-2">
          <Award size={24} className="text-yellow-500" /> Performances des Employées
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employeeStats.length === 0 ? (
             <div className="glass p-6 text-gray-500 col-span-2 text-center">Aucune donnée pour cette période.</div>
          ) : (
            employeeStats.map((emp, idx) => (
              <div key={emp.name} className="glass p-6 flex flex-col relative overflow-hidden">
                {idx === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">TOP</div>}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="font-bold text-lg text-secondary">{emp.name}</div>
                  </div>
                  <div className="text-2xl font-bold text-accent">{emp.totalSales.toFixed(2)} MAD</div>
                </div>
                
                {/* Employee Profitability metrics */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-50 p-2 rounded-lg text-center">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Coût Salarial</div>
                    <div className="text-sm font-bold text-red-500">-{emp.cost.toFixed(0)} DH</div>
                  </div>
                  <div className={`flex-1 p-2 rounded-lg text-center ${emp.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Bénéfice Net</div>
                    <div className={`text-sm font-bold ${emp.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {emp.profit > 0 ? '+' : ''}{emp.profit.toFixed(0)} DH
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded-xl p-4 text-sm">
                  <div className="font-semibold text-gray-700 mb-2">Total clients : {emp.transactions}</div>
                  <div className="text-gray-500 mb-1">Prestations réalisées :</div>
                  <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar text-gray-600 space-y-1">
                    {emp.services.map((svc, i) => (
                      <div key={i} className="flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-accent before:rounded-full">{svc}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Table */}
      <div id="historique-ventes" className="glass p-6 overflow-x-auto print:hidden">
        <h2 className="text-xl font-bold mb-6 text-secondary">Historique détaillé des encaissements</h2>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="p-4 text-gray-500 font-medium">Date & Heure</th>
              <th className="p-4 text-gray-500 font-medium">Employée</th>
              <th className="p-4 text-gray-500 font-medium">Détail des Prestations</th>
              <th className="p-4 text-gray-500 font-medium text-right">Total (MAD)</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-8 text-gray-400">
                  Aucune vente enregistrée pour la période sélectionnée.
                </td>
              </tr>
            ) : (
              filteredHistory.slice().reverse().map((order, i) => {
                const orderDate = new Date(order.timestamp || order.date);
                return (
                  <tr key={i} className="border-b border-glass-border hover:bg-white/30 transition-colors">
                    <td className="p-4 text-secondary">
                      {isNaN(orderDate.getTime()) ? '-' : (
                        <>
                          <div className="font-medium">{orderDate.toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                        {order.employeeName || 'Inconnu'}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold text-secondary">{item.qty}x</span> {item.name}
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-bold text-accent text-right">
                      {order.total.toFixed(2)} MAD
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Z REPORT PRINT TEMPLATE (Hidden on screen, visible on print) */}
      <div id="receipt-print-area" className="hidden print:block text-black bg-white p-4 font-sans text-sm" style={{ width: '80mm', margin: '0 auto' }}>
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase mb-1">MAJOLICA</h1>
          <h2 className="text-lg font-bold">RAPPORT Z</h2>
          <div className="text-xs text-gray-600 mt-1">
            Imprimé le : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="text-xs text-gray-600">
            Période : {dateFilter === 'today' ? "Aujourd'hui" : dateFilter === 'yesterday' ? "Hier" : dateFilter === 'all' ? "Toutes les dates" : `${customStartDate} au ${customEndDate}`}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2 mb-2">
          <div className="flex justify-between font-bold text-base">
            <span>CHIFFRE D'AFFAIRES</span>
            <span>{totalSales.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Dépenses Totales</span>
            <span>- {totalExpenses.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-2 border-t border-dashed border-gray-300 pt-1">
            <span>BÉNÉFICE NET</span>
            <span>{netProfit.toFixed(2)} DH</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 py-2 mb-4">
          <h3 className="font-bold mb-2">DÉTAIL PAR EMPLOYÉE</h3>
          {employeeStats.map(emp => (
            <div key={emp.name} className="mb-2">
              <div className="flex justify-between font-semibold">
                <span>{emp.name}</span>
                <span>{emp.totalSales.toFixed(2)} DH</span>
              </div>
              <div className="text-xs text-gray-500">
                {emp.transactions} clients
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs mt-6 pt-4 border-t border-solid border-black">
          Fin du rapport Z
        </div>
      </div>

      {/* Details Modal */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-secondary">{detailModal.title}</h2>
              <button 
                onClick={() => setDetailModal({ isOpen: false, title: '', data: [], type: '' })}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {detailModal.type === 'expenses' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-3 text-gray-500 font-medium">Date</th>
                      <th className="p-3 text-gray-500 font-medium">Catégorie</th>
                      <th className="p-3 text-gray-500 font-medium">Description</th>
                      <th className="p-3 text-gray-500 font-medium text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.data.length === 0 ? (
                      <tr><td colSpan="4" className="p-4 text-center text-gray-500">Aucune dépense trouvée.</td></tr>
                    ) : (
                      detailModal.data.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              {item.category || 'Autres'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{item.description || '-'}</td>
                          <td className="p-3 text-sm font-bold text-red-500 text-right">{item.amount.toFixed(2)} DH</td>
                          <td className="p-3 text-center">
                            <button
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                              onClick={async () => {
                                if (!window.confirm(`Supprimer cette dépense de ${item.amount.toFixed(2)} DH ?`)) return;
                                await deleteExpense(item.id);
                                setDetailModal(prev => ({ ...prev, data: prev.data.filter((_, i) => i !== idx) }));
                                setExpenses(prev => prev.filter(e => e.id !== item.id));
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
              {detailModal.type === 'sales' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-3 text-gray-500 font-medium">Date</th>
                      <th className="p-3 text-gray-500 font-medium">Employée</th>
                      <th className="p-3 text-gray-500 font-medium">Prestations</th>
                      <th className="p-3 text-gray-500 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.data.length === 0 ? (
                      <tr><td colSpan="4" className="p-4 text-center text-gray-500">Aucune vente trouvée.</td></tr>
                    ) : (
                      detailModal.data.map((item, idx) => {
                        const orderDate = new Date(item.timestamp || item.date);
                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3 text-sm">
                              {!isNaN(orderDate.getTime()) ? (
                                <>
                                  <div className="font-medium text-gray-800">{orderDate.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">{orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </>
                              ) : '-'}
                            </td>
                            <td className="p-3">
                              <span className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium">
                                {item.employeeName || 'Inconnu'}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {item.items?.map((svc, i) => (
                                <div key={i}><span className="font-bold">{svc.qty}x</span> {svc.name}</div>
                              ))}
                            </td>
                            <td className="p-3 text-sm font-bold text-accent text-right">{item.total?.toFixed(2)} DH</td>
                            <td className="p-3 text-center">
                              <button
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer cette vente"
                                onClick={async () => {
                                  if (!window.confirm(`Supprimer cette vente de ${item.total?.toFixed(2)} DH ?`)) return;
                                  if (isFirebaseConfigured) {
                                    await deleteDoc(doc(db, 'history', item.id.toString()));
                                  }
                                  setDetailModal(prev => ({ ...prev, data: prev.data.filter((_, i) => i !== idx) }));
                                  setHistory(prev => prev.filter(h => h.id !== item.id));
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Total</div>
                <div className="text-xl font-black text-secondary">
                  {detailModal.data.reduce((sum, item) => sum + (item.amount || item.total || 0), 0).toFixed(2)} DH
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Import Historique Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <div>
                <h2 className="text-xl font-black text-purple-800 flex items-center gap-2">
                  <Upload size={22} /> Saisie Historique des Données
                </h2>
                <p className="text-sm text-purple-600 mt-1">Entrez les données de vos jours passés (depuis votre Excel)</p>
              </div>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-purple-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {importDone ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-black text-green-700 mb-2">Import réussi !</h3>
                <p className="text-gray-500 mb-6">Les données ont été sauvegardées. Actualisez la page pour voir le tableau mis à jour.</p>
                <button
                  className="btn bg-purple-600 text-white hover:bg-purple-700"
                  onClick={() => { setShowImport(false); window.location.reload(); }}
                >
                  Fermer et actualiser
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 text-left font-bold text-gray-600 border border-gray-200">Date</th>
                        <th className="p-2 text-left font-bold text-green-700 border border-gray-200">CA (DH)</th>
                        <th className="p-2 text-left font-bold text-red-600 border border-gray-200">Sortie Caisse (DH)</th>
                        <th className="p-2 text-left font-bold text-gray-500 border border-gray-200">Motif Caisse</th>
                        <th className="p-2 text-left font-bold text-orange-600 border border-gray-200">Sortie Poche (DH)</th>
                        <th className="p-2 text-left font-bold text-gray-500 border border-gray-200">Motif Poche</th>
                        <th className="p-2 border border-gray-200"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="p-1 border border-gray-200">
                            <input type="date" value={row.date}
                              onChange={e => { const r=[...importRows]; r[i].date=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-purple-400"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input type="number" placeholder="0" value={row.ca}
                              onChange={e => { const r=[...importRows]; r[i].ca=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-green-400 text-green-700 font-bold"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input type="number" placeholder="0" value={row.sortieCaisse}
                              onChange={e => { const r=[...importRows]; r[i].sortieCaisse=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-red-400 text-red-500 font-bold"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input type="text" placeholder="Ex: Produits..." value={row.descCaisse}
                              onChange={e => { const r=[...importRows]; r[i].descCaisse=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input type="number" placeholder="0" value={row.sortiePoche}
                              onChange={e => { const r=[...importRows]; r[i].sortiePoche=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-orange-400 text-orange-500 font-bold"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input type="text" placeholder="Ex: Réparation..." value={row.descPoche}
                              onChange={e => { const r=[...importRows]; r[i].descPoche=e.target.value; setImportRows(r); }}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                            />
                          </td>
                          <td className="p-1 border border-gray-200 text-center">
                            <button onClick={() => setImportRows(importRows.filter((_,j)=>j!==i))}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl font-bold mb-6 w-full justify-center"
                  onClick={() => setImportRows([...importRows, { date: format(new Date(), 'yyyy-MM-dd'), ca: '', sortieCaisse: '', descCaisse: '', sortiePoche: '', descPoche: '' }])}
                >
                  <Plus size={18} /> Ajouter un jour
                </button>

                <div className="flex gap-4">
                  <button className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1" onClick={() => setShowImport(false)}>
                    Annuler
                  </button>
                  <button
                    className="btn bg-purple-600 text-white hover:bg-purple-700 flex-1 font-bold"
                    disabled={importLoading}
                    onClick={async () => {
                      setImportLoading(true);
                      for (const row of importRows) {
                        const dateStr = row.date;
                        if (!dateStr) continue;
                        const dateISO = new Date(dateStr).toISOString();

                        // Save CA as a single bulk order for the day
                        if (row.ca && parseFloat(row.ca) > 0) {
                          await saveOrder({
                            id: `import_${dateStr}_${Date.now()}`,
                            items: [{ id: 'import', name: 'Recette journalière (Import)', qty: 1, price: parseFloat(row.ca) }],
                            total: parseFloat(row.ca),
                            employeeName: 'Import Manuel',
                            clientName: '',
                            clientPhone: '',
                            timestamp: dateISO,
                            date: dateStr,
                          });
                        }
                        // Save sortie caisse
                        if (row.sortieCaisse && parseFloat(row.sortieCaisse) > 0) {
                          await saveExpense({
                            amount: parseFloat(row.sortieCaisse),
                            category: 'Divers',
                            description: row.descCaisse || 'Import - Sortie Caisse',
                            paymentMethod: 'caisse',
                            date: dateStr,
                            createdAt: dateISO,
                          });
                        }
                        // Save sortie poche/banque
                        if (row.sortiePoche && parseFloat(row.sortiePoche) > 0) {
                          await saveExpense({
                            amount: parseFloat(row.sortiePoche),
                            category: 'Divers',
                            description: row.descPoche || 'Import - Sortie Poche/Banque',
                            paymentMethod: 'personnel',
                            date: dateStr,
                            createdAt: dateISO,
                          });
                        }
                      }
                      setImportLoading(false);
                      setImportDone(true);
                    }}
                  >
                    {importLoading ? '⏳ Sauvegarde en cours...' : '✅ Valider l\'import'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
