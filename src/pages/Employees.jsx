import React, { useState, useEffect } from 'react';
import { Plus, Shield, CircleDollarSign, Trash2, Calendar, Wallet, FileText, X, AlertCircle, Edit2, Check, TrendingUp, Clock } from 'lucide-react';
import { fetchEmployees, saveEmployee, deleteEmployee, saveExpense, fetchHistory, deleteExpense, fetchExpenses } from '../services/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Coiffeuse/Onglerie');
  const [newSalary, setNewSalary] = useState('');
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // History State for CA calculation
  const [history, setHistory] = useState([]);
  
  // Selected Employee State
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  // Absence State
  const [selectedAbsenceDates, setSelectedAbsenceDates] = useState([]);
  
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [editSalaryValue, setEditSalaryValue] = useState('');
  
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceSource, setAdvanceSource] = useState('caisse'); // caisse or poche
  const [activeTab, setActiveTab] = useState('paie'); // paie, actions

  const loadEmployees = async () => {
    const data = await fetchEmployees();
    setEmployees(data);
    if (selectedEmp) {
      const updated = data.find(e => e.id === selectedEmp.id);
      if (updated) setSelectedEmp(updated);
    }
  };

  // Clear absences when switching employee
  useEffect(() => {
    setSelectedAbsenceDates([]);
  }, [selectedEmp]);

  useEffect(() => {
    loadEmployees();
    fetchHistory().then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEmployee = async () => {
    if (!newName.trim()) return;
    await saveEmployee({ 
      name: newName.trim(), 
      role: newRole,
      baseSalary: parseFloat(newSalary) || 0,
      entryDate: newEntryDate,
      absences: [],
      advances: []
    });
    setNewName('');
    setNewSalary('');
    setNewRole('Coiffeuse/Onglerie');
    await loadEmployees();
  };

  const handleDeleteEmployee = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer cet employé ?')) {
      await deleteEmployee(id);
      if (selectedEmp && selectedEmp.id === id) setSelectedEmp(null);
      await loadEmployees();
    }
  };

  const handleAddAbsence = async () => {
    if (selectedAbsenceDates.length === 0 || !selectedEmp) return;
    
    const deductionPerDay = (selectedEmp.baseSalary || 0) / 30;
    const newAbsences = selectedAbsenceDates.map(dateStr => ({
      date: new Date(dateStr).toISOString(),
      days: 1,
      deduction: deductionPerDay,
      timestamp: new Date().toISOString() + Math.random().toString(36).substr(2, 5)
    }));
    
    const updatedEmp = {
      ...selectedEmp,
      absences: [...(selectedEmp.absences || []), ...newAbsences]
    };
    
    await saveEmployee(updatedEmp);
    setSelectedAbsenceDates([]);
    await loadEmployees();
  };

  const handleUpdateSalary = async () => {
    if (!selectedEmp || !editSalaryValue) return;
    
    const updatedEmp = {
      ...selectedEmp,
      baseSalary: parseFloat(editSalaryValue)
    };
    
    await saveEmployee(updatedEmp);
    setIsEditingSalary(false);
    await loadEmployees();
  };

  const handleAddAdvance = async () => {
    if (!advanceAmount || !selectedEmp) return;
    
    const amount = parseFloat(advanceAmount);
    const expenseId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    const newAdvance = {
      date: advanceDate,
      amount: amount,
      source: advanceSource,
      timestamp: new Date().toISOString(),
      expenseId: advanceSource === 'caisse' ? expenseId : null
    };
    
    const updatedEmp = {
      ...selectedEmp,
      advances: [...(selectedEmp.advances || []), newAdvance]
    };
    
    await saveEmployee(updatedEmp);
    
    // If paid from Caisse, register it in global expenses too
    if (advanceSource === 'caisse') {
      await saveExpense({
        id: expenseId,
        amount: amount,
        category: 'Salaires',
        description: `Avance sur salaire - ${selectedEmp.name}`,
        paymentMethod: 'caisse',
        date: advanceDate,
        createdAt: new Date().toISOString()
      });
    }
    
    setAdvanceAmount('');
    setAdvanceDate(new Date().toISOString().split('T')[0]);
    await loadEmployees();
  };

  const handleDeleteAdvance = async (advance) => {
    if (!selectedEmp || !window.confirm("Voulez-vous vraiment supprimer cette avance ?")) return;

    const updatedEmp = {
      ...selectedEmp,
      advances: (selectedEmp.advances || []).filter(a => a.timestamp !== advance.timestamp)
    };
    
    await saveEmployee(updatedEmp);
    
    if (advance.expenseId) {
      await deleteExpense(advance.expenseId);
    } else if (advance.source === 'caisse') {
      // Fallback for old advances without expenseId
      const expenses = await fetchExpenses();
      const match = expenses.find(e => 
        e.category === 'Salaires' && 
        e.amount === advance.amount && 
        e.description.includes(selectedEmp.name)
      );
      if (match) {
        await deleteExpense(match.id);
      }
    }
    
    await loadEmployees();
  };

  const handleDeleteAbsence = async (absence) => {
    if (!selectedEmp || !window.confirm("Voulez-vous vraiment annuler/supprimer cette absence ?")) return;

    const updatedEmp = {
      ...selectedEmp,
      absences: (selectedEmp.absences || []).filter(a => a.timestamp !== absence.timestamp)
    };
    
    await saveEmployee(updatedEmp);
    await loadEmployees();
  };


  const calculateCurrentMonthStats = (emp) => {
    if (!emp) return { advances: 0, absences: 0, reste: 0, ca: 0, profit: 0 };
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const monthAdvances = (emp.advances || [])
      .filter(a => a.date.startsWith(currentMonth))
      .reduce((sum, a) => sum + a.amount, 0);
      
    const monthAbsences = (emp.absences || [])
      .filter(a => a.date.startsWith(currentMonth))
      .reduce((sum, a) => sum + a.deduction, 0);
      
    const monthAdvancesDetails = (emp.advances || []).filter(a => a.date.startsWith(currentMonth));
    const monthAbsencesDetails = (emp.absences || []).filter(a => a.date.startsWith(currentMonth));
      
    const reste = (emp.baseSalary || 0) - monthAdvances - monthAbsences;
    
    // Calculate CA and Profit
    const monthOrders = history.filter(order => {
      const orderDate = order.timestamp ? order.timestamp.substring(0, 7) : order.date?.substring(0, 7);
      return orderDate === currentMonth && order.employeeName === emp.name;
    });
    
    const ca = monthOrders.reduce((sum, order) => sum + order.total, 0);
    const totalSalary = (emp.baseSalary || 0);
    const cost = totalSalary - monthAbsences;
    const profit = ca - cost;
    
    return { 
      advances: monthAdvances, 
      absences: monthAbsences, 
      advancesDetails: monthAdvancesDetails,
      absencesDetails: monthAbsencesDetails,
      reste: totalSalary - monthAdvances - monthAbsences, 
      commission,
      ca, 
      profit 
    };
  };

  const stats = calculateCurrentMonthStats(selectedEmp);

  // Helper to calculate CA for all employees list
  const getEmpCA = (empName) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return history
      .filter(order => order.employeeName === empName && (order.timestamp?.startsWith(currentMonth) || order.date?.startsWith(currentMonth)))
      .reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-10">
      {/* Left List */}
      <div className={`flex-1 ${selectedEmp ? 'hidden lg:block' : 'block'}`}>
        <h1 className="page-header">Gestion du Personnel</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
          {employees.map(emp => (
            <div 
              key={emp.id} 
              onClick={() => setSelectedEmp(emp)}
              className={`glass p-3 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-1 ${selectedEmp?.id === emp.id ? 'ring-2 ring-accent bg-red-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-secondary font-bold text-base shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-secondary text-base leading-tight">{emp.name}</div>
                  <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                    <Shield size={12} /> {emp.role}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50/80 rounded-lg p-2 text-xs">
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>Salaire Base:</span>
                  <span className="font-bold text-secondary">{emp.baseSalary || 0} DH</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>CA (Mois):</span>
                  <span className="font-bold text-accent">{getEmpCA(emp.name).toFixed(2)} DH</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Add Employee OR Employee Details */}
      <div className={`lg:w-[500px] xl:w-[600px] shrink-0 ${!selectedEmp ? 'hidden lg:block' : 'block'}`}>
        {!selectedEmp ? (
          <div className="glass p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-secondary flex items-center gap-2">
              <Plus size={24} className="text-accent" /> Ajouter un employé
            </h2>
            
            <div className="space-y-4">
              <div className="input-group">
                <label>Nom complet</label>
                <input type="text" placeholder="Ex: Amina" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              
              <div className="input-group">
                <label>Rôle</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option>Coiffeuse</option>
                  <option>Onglerie</option>
                  <option>Coiffeuse/Onglerie</option>
                  <option>Esthéticienne</option>
                  <option>Manager</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="input-group">
                  <label>Salaire Base (DH)</label>
                  <input type="number" placeholder="Ex: 3000" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Date d'entrée</label>
                <input type="date" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)} />
              </div>

              <button className="btn btn-primary w-full mt-4" onClick={handleAddEmployee} disabled={!newName.trim()}>
                Ajouter au personnel
              </button>
            </div>
          </div>
        ) : (
          <div className="glass p-0 sticky top-4 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent-light p-4 text-white relative">
              <button 
                onClick={() => setSelectedEmp(null)}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 p-1 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white text-accent flex items-center justify-center font-bold text-xl shadow-inner">
                  {selectedEmp.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedEmp.name}</h2>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Shield size={12} /> {selectedEmp.role}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex border-b border-gray-100 bg-white">
              <button 
                onClick={() => setActiveTab('paie')}
                className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold text-center border-b-2 transition-colors ${activeTab === 'paie' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                Bilan
              </button>
              <button 
                onClick={() => setActiveTab('avances')}
                className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold text-center border-b-2 transition-colors ${activeTab === 'avances' || activeTab === 'actions' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                Avances
              </button>
              <button 
                onClick={() => setActiveTab('absences')}
                className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold text-center border-b-2 transition-colors ${activeTab === 'absences' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                Absences
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar bg-gray-50/30">
              {activeTab === 'paie' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                  {/* Employee Info */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Date d'entrée</div>
                      <div className="text-xs font-semibold flex items-center gap-1">
                        <Calendar size={12} className="text-accent" /> 
                        {selectedEmp.entryDate ? new Date(selectedEmp.entryDate).toLocaleDateString('fr-FR') : 'Non définie'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5 flex items-center justify-end gap-1">
                        Salaire Base
                        {!isEditingSalary && (
                          <button 
                            onClick={() => {
                              setEditSalaryValue(selectedEmp.baseSalary || 0);
                              setIsEditingSalary(true);
                            }}
                            className="text-accent hover:text-accent-light bg-accent/10 p-1 rounded-md"
                          >
                            <Edit2 size={10} />
                          </button>
                        )}
                      </div>
                      {isEditingSalary ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={editSalaryValue}
                            onChange={(e) => setEditSalaryValue(e.target.value)}
                            className="w-20 text-right px-1 py-0.5 text-xs border border-gray-300 rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                          />
                          <button onClick={handleUpdateSalary} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setIsEditingSalary(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 p-1 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-base font-black text-secondary">{selectedEmp.baseSalary || 0} MAD</div>
                      )}
                    </div>
                  </div>

                  {/* Salary Calculation Board */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                      <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                        <FileText size={16} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">Fiche de Paie <span className="text-gray-400 font-normal text-[10px] ml-1">(Mois en cours)</span></h3>
                    </div>
                    
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex justify-between font-medium text-gray-600">
                        <span>Salaire de Base</span>
                        <span>{selectedEmp.baseSalary || 0} DH</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>- Avances reçues</span>
                        <span>-{stats.advances.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>- Jours d'absence</span>
                        <span>-{stats.absences.toFixed(2)} DH</span>
                      </div>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Reste à Payer</span>
                        <span className="text-base font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                          {stats.reste.toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profitability Board */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                        <TrendingUp size={16} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">Rentabilité <span className="text-gray-400 font-normal text-[10px] ml-1">(Mois en cours)</span></h3>
                    </div>
                    
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex justify-between font-medium text-gray-600">
                        <span>Chiffre d'Affaires généré</span>
                        <span className="text-blue-600 font-bold">{stats.ca.toFixed(2)} DH</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Coût de l'employée</span>
                        <span>- {((selectedEmp.baseSalary || 0) - stats.absences).toFixed(2)} DH</span>
                      </div>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-bold">Bénéfice Net</span>
                        <span className={`text-base font-black px-2 py-0.5 rounded-lg ${stats.profit >= 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
                          {stats.profit > 0 ? "+" : ""}{stats.profit.toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'avances' || activeTab === 'actions' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                  {/* Historique Avances */}
                  {stats.advancesDetails?.length > 0 && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-400" /> Historique (Ce mois)
                      </h4>
                      <div className="space-y-1 text-[11px] max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                        {stats.advancesDetails?.map((adv, idx) => (
                          <div key={`adv-${idx}`} className="flex justify-between items-center text-gray-600 py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <span>{new Date(adv.date).toLocaleDateString('fr-FR')} <span className="opacity-70">({adv.source})</span></span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 font-bold">-{Number(adv.amount).toFixed(2)} DH</span>
                              <button 
                                onClick={() => handleDeleteAdvance(adv)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Advance */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-t-4 border-t-blue-400">
                    <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                        <CircleDollarSign size={16} /> 
                      </div>
                      Donner une Avance
                    </h4>
                    <div className="space-y-2">
                      <input 
                        type="date" 
                        value={advanceDate}
                        onChange={e => setAdvanceDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                      <input 
                        type="number" 
                        placeholder="Montant (DH)" 
                        value={advanceAmount}
                        onChange={e => setAdvanceAmount(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                      <select 
                        value={advanceSource} 
                        onChange={e => setAdvanceSource(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors cursor-pointer"
                      >
                        <option value="caisse">Prélevé de la Caisse</option>
                        <option value="poche">Prélevé de ma Poche</option>
                      </select>
                      <button onClick={handleAddAdvance} disabled={!advanceAmount} className="w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 font-bold py-2 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:bg-gray-300">
                        Valider l'avance
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'absences' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                  {/* Historique Absences */}
                  {stats.absencesDetails?.length > 0 && (
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-400" /> Historique (Ce mois)
                      </h4>
                      <div className="space-y-1 text-[11px] max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                        {stats.absencesDetails?.map((abs, idx) => (
                          <div key={`abs-${idx}`} className="flex justify-between items-center text-gray-600 py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <span>{new Date(abs.date).toLocaleDateString('fr-FR')} {abs.days ? `(${abs.days} j)` : ''}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 font-bold">-{Number(abs.deduction).toFixed(2)} DH</span>
                              <button 
                                onClick={() => handleDeleteAbsence(abs)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Absence */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-t-4 border-t-red-400">
                    <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-red-50 text-red-500 rounded-md">
                        <AlertCircle size={16} /> 
                      </div>
                      Signaler des Absences
                    </h4>
                    
                    {(() => {
                      const today = new Date();
                      const currentMonth = today.getMonth();
                      const currentYear = today.getFullYear();
                      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                      let firstDay = new Date(currentYear, currentMonth, 1).getDay() - 1;
                      if (firstDay === -1) firstDay = 6; 
                      
                      const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
                      const emptyCells = Array.from({length: firstDay}, (_, i) => i);
                      const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('fr-FR', { month: 'long' });

                      const toggleDate = (day) => {
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        if (selectedAbsenceDates.includes(dateStr)) {
                          setSelectedAbsenceDates(selectedAbsenceDates.filter(d => d !== dateStr));
                        } else {
                          setSelectedAbsenceDates([...selectedAbsenceDates, dateStr]);
                        }
                      };
                      
                      const totalDeduction = ((selectedEmp?.baseSalary || 0) / 30) * selectedAbsenceDates.length;

                      return (
                        <div>
                          <div className="mb-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                            <div className="text-center font-bold text-gray-700 capitalize mb-2 text-xs">{monthName} {currentYear}</div>
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1 font-bold text-gray-400">
                              <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-xs">
                              {emptyCells.map(i => <div key={`empty-${i}`}></div>)}
                              {days.map(day => {
                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isAlreadyAbsent = stats.absencesDetails?.some(a => a.date.startsWith(dateStr));
                                const isSelected = selectedAbsenceDates.includes(dateStr);
                                const isToday = day === today.getDate();
                                
                                let className = "py-1 rounded-md transition-colors text-center ";
                                if (isAlreadyAbsent) {
                                  className += "bg-red-50 text-red-300 line-through cursor-not-allowed";
                                } else if (isSelected) {
                                  className += "bg-red-500 text-white font-bold shadow-sm cursor-pointer";
                                } else {
                                  className += "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500 cursor-pointer border border-gray-100";
                                  if (isToday) className += " border-red-200 text-red-500 font-bold bg-red-50/30";
                                }
                                
                                return (
                                  <button 
                                    key={day} 
                                    onClick={() => !isAlreadyAbsent && toggleDate(day)}
                                    disabled={isAlreadyAbsent}
                                    className={className}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2 mb-2 items-center justify-between bg-red-50/50 p-2 rounded-xl border border-red-100">
                            <div>
                              <span className="text-[9px] text-red-400 font-bold block uppercase tracking-wider">Jours</span>
                              <span className="text-lg font-black text-red-600">{selectedAbsenceDates.length}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-red-400 font-bold block uppercase tracking-wider">Déduction</span>
                              <span className="text-lg font-black text-red-600">- {totalDeduction.toFixed(2)} <span className="text-xs">DH</span></span>
                            </div>
                          </div>
                          <button 
                            onClick={handleAddAbsence} 
                            disabled={selectedAbsenceDates.length === 0} 
                            className="w-full bg-red-600 text-white shadow-sm hover:bg-red-700 font-bold py-2 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            Valider les absences
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : null}

              {/* Delete profile button available on all tabs */}
              <div className="mt-6 pt-4 pb-2 border-t border-gray-100 border-dashed">
                <button 
                  onClick={(e) => handleDeleteEmployee(selectedEmp.id, e)}
                  className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 border border-red-100 font-bold p-2 hover:bg-red-600 hover:text-white rounded-lg transition-all text-xs"
                >
                  <Trash2 size={14} /> Supprimer le profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
