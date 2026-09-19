import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Search, Activity, DollarSign } from 'lucide-react';
import { fetchProducts, fetchHistory, fetchExpenses } from '../services/api';
import { format } from 'date-fns';

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const productsData = await fetchProducts();
      const historyData = await fetchHistory();
      const expensesData = await fetchExpenses();

      // Filter only resale products
      const resaleProducts = productsData.filter(p => p.type === 'Produit');

      // Calculate Total Exits (Ventes) from history
      const exitsMap = {};
      historyData.forEach(order => {
        if (order.status !== 'cancelled' && order.items) {
          order.items.forEach(item => {
            if (item.type === 'Produit' || item.isProduct) { // Ensure item is a product
              const current = exitsMap[item.id] || 0;
              exitsMap[item.id] = current + (item.quantity || 1);
            }
          });
        }
      });

      // Calculate Total Entries (Achats) from expenses
      const entriesMap = {};
      expensesData.forEach(expense => {
        if (expense.category === 'Achat Marchandise (Stock)' && expense.stockItems) {
          expense.stockItems.forEach(line => {
            if (line.productId && line.qty) {
              const current = entriesMap[line.productId] || 0;
              entriesMap[line.productId] = current + parseInt(line.qty, 10);
            }
          });
        }
      });

      let calculatedTotalValue = 0;
      let calculatedLowStock = 0;

      const finalInventory = resaleProducts.map(prod => {
        const exits = exitsMap[prod.id] || 0;
        const entries = entriesMap[prod.id] || 0;
        const stock = prod.stock || 0;
        
        calculatedTotalValue += stock * (parseFloat(prod.price) || 0);
        if (stock <= (prod.minStock || 3)) calculatedLowStock++;

        return {
          ...prod,
          totalExits: exits,
          totalEntries: entries,
          stockValue: stock * (parseFloat(prod.price) || 0)
        };
      });

      setInventoryData(finalInventory);
      setTotalValue(calculatedTotalValue);
      setLowStockCount(calculatedLowStock);
    } catch (error) {
      console.error("Erreur chargement inventaire", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventoryData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header mb-1">Inventaire & Stock</h1>
          <p className="text-sm text-gray-500">Suivi des entrées, sorties et valorisation du stock</p>
        </div>
        <button onClick={loadInventory} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Activity size={18} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Produits</p>
            <p className="text-2xl font-black text-secondary">{inventoryData.length}</p>
          </div>
        </div>

        <div className="glass p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Valeur Totale (Vente)</p>
            <p className="text-2xl font-black text-secondary">{totalValue.toFixed(2)} DH</p>
          </div>
        </div>

        <div className="glass p-6 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alertes Rupture</p>
            <p className="text-2xl font-black text-secondary">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="font-bold text-lg text-secondary">Tableau de Suivi</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40 text-gray-400">Chargement...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
                <tr className="text-gray-500 text-sm">
                  <th className="p-4 font-medium">Produit</th>
                  <th className="p-4 font-medium text-center">Catégorie</th>
                  <th className="p-4 font-medium text-center">Prix Unité</th>
                  <th className="p-4 font-medium text-center">Entrées (Total)</th>
                  <th className="p-4 font-medium text-center">Sorties (Ventes)</th>
                  <th className="p-4 font-medium text-center">Stock Actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0">
                            {item.icon || '📦'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500">Val: {item.stockValue.toFixed(2)} DH</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-gray-700">
                        {parseFloat(item.price).toFixed(2)} DH
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg">
                          <ArrowDownRight size={14} /> {item.totalEntries}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
                          <ArrowUpRight size={14} /> {item.totalExits}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg ${
                          item.stock <= (item.minStock || 3) ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
