import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchExpenses, saveExpense, updateExpense, deleteExpense, fetchSalonConfig } from '../services/api';
import { Plus, Trash2, Wallet, CreditCard, Filter, ArrowUpRight, ArrowDownRight, Coffee, Zap, Edit2 } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isQuickPayModalOpen, setIsQuickPayModalOpen] = useState(false);
  const [config, setConfig] = useState({ loyer: 0, edf: 0 });
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Matériel');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('caisse'); // 'caisse' or 'personnel'
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchExpenses();
    const salonConfig = await fetchSalonConfig();
    setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setConfig(salonConfig);
  };

  const handleSaveExpense = async (e, customAmount = null, customCat = null, customDesc = null) => {
    if (e) e.preventDefault();
    
    const finalAmount = customAmount || amount;
    const finalCategory = customCat || category;
    const finalDesc = customDesc || description;

    if (!finalAmount || !finalDesc) return;

    const expenseData = {
      amount: parseFloat(finalAmount),
      category: finalCategory,
      description: finalDesc,
      paymentMethod,
      date,
      createdAt: new Date().toISOString()
    };

    if (editingExpenseId) {
      expenseData.id = editingExpenseId;
      await updateExpense(expenseData);
    } else {
      await saveExpense(expenseData);
    }

    setIsModalOpen(false);
    setIsQuickPayModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      await deleteExpense(id);
      loadData();
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('Matériel');
    setDescription('');
    setPaymentMethod('caisse');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingExpenseId(null);
  };

  const handleEdit = (expense) => {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setPaymentMethod(expense.paymentMethod);
    setDate(expense.date);
    setEditingExpenseId(expense.id);
    setIsModalOpen(true);
  };

  const categories = ['Loyer', 'Électricité & Eau', 'Matériel', 'Fournitures', 'Divers'];

  // Filter expenses by selected month
  const filteredExpenses = expenses.filter(e => 
    e.date.startsWith(filterMonth)
  );

  const totalCaisse = filteredExpenses
    .filter(e => e.paymentMethod === 'caisse')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPersonnel = filteredExpenses
    .filter(e => e.paymentMethod === 'personnel')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Dépenses & Achats</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsQuickPayModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Zap size={20} />
            <span className="hidden sm:inline">Paiement Rapide</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span className="hidden sm:inline">Nouvel Achat</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="glass p-6 rounded-2xl border border-rose-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total payé de la Caisse</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalCaisse.toFixed(2)} MAD</h3>
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
              <ArrowDownRight size={14} /> Diminue la caisse du jour
            </p>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total payé Personnellement</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalPersonnel.toFixed(2)} MAD</h3>
            <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <ArrowUpRight size={14} /> Ne touche pas à la caisse du jour
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="font-bold text-lg text-secondary">Historique des Dépenses</h2>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input-field py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Catégorie</th>
                <th className="p-4 font-medium">Paiement</th>
                <th className="p-4 font-medium text-right">Montant</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <Coffee size={48} className="mx-auto mb-3 text-gray-300" />
                    Aucune dépense enregistrée pour ce mois.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">
                      {format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {expense.description}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {expense.paymentMethod === 'caisse' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                          <Wallet size={12} /> Caisse
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                          <CreditCard size={12} /> Poche / Banque
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      -{expense.amount.toFixed(2)} MAD
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-6 text-white">
              <h2 className="text-2xl font-bold">{editingExpenseId ? 'Modifier l\'achat' : 'Nouvel Achat'}</h2>
              <p className="opacity-90 text-sm mt-1">{editingExpenseId ? 'Modifier les détails de la dépense' : 'Enregistrer une sortie d\'argent'}</p>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="input-group">
                <label>Qu'avez-vous acheté ?</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Produits d'entretien, Café, Loyer..."
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Montant (MAD)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field font-bold text-lg text-rose-500"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Catégorie</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input-field"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group mt-2">
                <label>D'où avez-vous payé cet achat ?</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('caisse')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      paymentMethod === 'caisse' 
                        ? 'border-rose-400 bg-rose-50 text-rose-600' 
                        : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet size={24} />
                    <span className="text-xs font-bold text-center">De la Caisse<br/><span className="font-normal opacity-70">(- Caisse du jour)</span></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('personnel')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      paymentMethod === 'personnel' 
                        ? 'border-blue-400 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={24} />
                    <span className="text-xs font-bold text-center">Poche / Banque<br/><span className="font-normal opacity-70">(Ne touche pas la caisse)</span></span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn-primary"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Fixed Charges Modal */}
      {isQuickPayModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-6 text-white">
              <h2 className="text-2xl font-bold">⚡ Paiement Rapide</h2>
              <p className="opacity-90 text-sm mt-1">Enregistrer une charge fixe mensuelle</p>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Choisissez la charge que vous venez de payer. Le montant est pré-rempli depuis vos Paramètres.
              </p>

              {/* Loyer Card */}
              <QuickChargeItem
                icon="🏠"
                label="Loyer Mensuel"
                category="Loyer"
                defaultAmount={config?.monthlyRent || 5500}
                onPay={async (amount, method) => {
                  const month = format(new Date(), 'MMMM yyyy', { locale: fr });
                  await saveExpense({
                    amount: parseFloat(amount),
                    category: 'Loyer',
                    description: `Loyer - ${month}`,
                    paymentMethod: method,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    createdAt: new Date().toISOString()
                  });
                  loadData();
                  setIsQuickPayModalOpen(false);
                }}
              />

              {/* Eau & Elec Card */}
              <QuickChargeItem
                icon="⚡"
                label="Eau & Électricité"
                category="Électricité & Eau"
                defaultAmount={config?.monthlyElec || 1500}
                onPay={async (amount, method) => {
                  const month = format(new Date(), 'MMMM yyyy', { locale: fr });
                  await saveExpense({
                    amount: parseFloat(amount),
                    category: 'Électricité & Eau',
                    description: `Eau & Électricité - ${month}`,
                    paymentMethod: method,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    createdAt: new Date().toISOString()
                  });
                  loadData();
                  setIsQuickPayModalOpen(false);
                }}
              />

              <button
                onClick={() => setIsQuickPayModalOpen(false)}
                className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors mt-2"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for each Quick Charge Item
const QuickChargeItem = ({ icon, label, category, defaultAmount, onPay }) => {
  const [amount, setAmount] = React.useState(defaultAmount.toString());
  const [method, setMethod] = React.useState('caisse');
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{label}</div>
          <div className="text-sm text-gray-500">{parseFloat(amount).toFixed(2)} MAD</div>
        </div>
        <div className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50 space-y-3">
          <div className="input-group">
            <label className="text-xs text-gray-500">Montant réel (MAD)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-field font-bold text-orange-600"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-2">Payé depuis :</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod('caisse')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-xs font-bold transition-all ${method === 'caisse' ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-gray-200 text-gray-500'}`}
              >
                🏦 Caisse
              </button>
              <button
                onClick={() => setMethod('personnel')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-xs font-bold transition-all ${method === 'personnel' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}
              >
                💳 Poche/Banque
              </button>
            </div>
          </div>
          <button
            disabled={!amount || loading}
            onClick={async () => {
              setLoading(true);
              await onPay(amount, method);
              setLoading(false);
              setExpanded(false);
            }}
            className="w-full btn-primary py-2 text-sm flex items-center justify-center gap-2"
          >
            {loading ? '...' : `✅ Enregistrer le paiement de ${label}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Expenses;
