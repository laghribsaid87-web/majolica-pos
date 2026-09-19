import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock, Tags, Loader, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { subscribeToProducts, saveProduct, deleteProduct } from '../services/api';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newClubPrice, setNewClubPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Manucure');
  const [newDuration, setNewDuration] = useState('60');
  const [newIcon, setNewIcon] = useState('💅');
  const [newType, setNewType] = useState('Service');
  const [newStock, setNewStock] = useState('');
  const [newMinStock, setNewMinStock] = useState('3');
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToProducts((data) => {
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveProduct = async () => {
    if (!newName.trim() || !newPrice) return;
    setIsSaving(true);
    try {
      const product = {
        name: newName.trim(),
        price: parseFloat(newPrice),
        clubPrice: parseFloat(newClubPrice) || parseFloat(newPrice),
        category: newCategory,
        duration: parseInt(newDuration, 10),
        icon: newIcon,
        type: newType,
        stock: newType === 'Produit' ? parseInt(newStock || 0, 10) : null,
        minStock: newType === 'Produit' ? parseInt(newMinStock || 3, 10) : null
      };
      
      if (editingProductId) {
        product.id = editingProductId;
      }
      
      await saveProduct(product);
      cancelEdit();
      // The product list will auto-update via subscribeToProducts listener
    } catch (err) {
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProductId(prod.id);
    setNewName(prod.name);
    setNewPrice(prod.price.toString());
    setNewClubPrice(prod.clubPrice ? prod.clubPrice.toString() : prod.price.toString());
    setNewCategory(prod.category || 'Manucure');
    setNewDuration((prod.duration || 60).toString());
    setNewIcon(prod.icon || '💅');
    setNewType(prod.type || 'Service');
    setNewStock(prod.stock !== undefined && prod.stock !== null ? prod.stock.toString() : '');
    setNewMinStock(prod.minStock !== undefined && prod.minStock !== null ? prod.minStock.toString() : '3');
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setNewName('');
    setNewPrice('');
    setNewClubPrice('');
    setNewCategory('Manucure');
    setNewDuration('60');
    setNewIcon('💅');
    setNewType('Service');
    setNewStock('');
    setNewMinStock('3');
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette prestation ?')) {
      try {
        await deleteProduct(id);
        // The product list will auto-update via subscribeToProducts listener
      } catch (err) {
        setError(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const commonCategories = ['Manucure', 'Dépose', 'Ongles', 'Vernis', 'Design', 'Coiffure', 'Esthétique'];
  const allCategories = [...new Set([...commonCategories, ...categories])];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="page-header mb-0">Catalogue des Prestations</h1>
          <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Actualiser">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Problème de chargement</p>
              <p>{error}</p>
              <p className="mt-1 text-xs text-red-400">Vérifiez les règles Firestore sur la console Firebase (les règles doivent autoriser lecture/écriture)</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader size={36} className="animate-spin mb-3" />
            <p>Chargement des prestations...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 glass rounded-2xl">
            <Tags size={40} className="mb-3 opacity-40" />
            <p className="font-semibold">Aucune prestation trouvée</p>
            <p className="text-sm mt-1">Ajoutez votre premier service depuis le formulaire à droite</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map(prod => (
              <div key={prod.id} className="glass p-3 flex flex-col sm:flex-row items-center sm:items-start gap-3 transition-transform hover:-translate-y-1 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center text-xl shrink-0">
                  {prod.icon}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="font-bold text-secondary text-sm mb-1 truncate">{prod.name}</div>
                  <div className="text-gray-500 text-xs mb-2 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <span className="flex items-center gap-1"><Tags size={12} /> {prod.category}</span>
                    {prod.type === 'Service' || !prod.type ? (
                      <span className="flex items-center gap-1"><Clock size={12} /> {prod.duration}m</span>
                    ) : (
                      <span className={`flex items-center gap-1 font-bold ${prod.stock <= (prod.minStock || 3) ? 'text-red-500' : 'text-blue-500'}`}>
                        📦 Stock: {prod.stock}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm mt-auto">
                    <div className="flex flex-col">
                      <span className="font-bold text-accent text-sm">
                        {parseFloat(prod.price).toFixed(2)} DH
                      </span>
                      {prod.clubPrice && (
                        <span className="text-yellow-600 text-xs font-bold bg-yellow-50 px-1 py-0.5 rounded w-fit">
                          Club: {parseFloat(prod.clubPrice).toFixed(2)} DH
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditProduct(prod)} className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <div className="glass p-6 lg:w-80 shrink-0 h-fit">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">{editingProductId ? 'Modifier le service' : 'Ajouter un service'}</h2>
          {editingProductId && (
            <button onClick={cancelEdit} className="p-1.5 bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="input-group">
          <label>NOM DU SERVICE / PRODUIT</label>
          <input type="text" placeholder="Ex: Soin de visage / Shampoing" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>

        <div className="input-group">
          <label>TYPE</label>
          <div className="flex gap-2 mt-1 mb-2">
            <button
              onClick={() => setNewType('Service')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${newType === 'Service' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Service
            </button>
            <button
              onClick={() => setNewType('Produit')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${newType === 'Produit' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Produit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="input-group">
            <label>PRIX NORMAL (MAD)</label>
            <input type="number" placeholder="Ex: 300" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} min="0" />
          </div>
          <div className="input-group">
            <label>PRIX CLUB (MAD)</label>
            <input type="number" placeholder="Ex: 250" value={newClubPrice} onChange={(e) => setNewClubPrice(e.target.value)} min="0" />
          </div>
        </div>

        <div className="input-group">
          <label>CATÉGORIE</label>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {newType === 'Service' ? (
            <div className="input-group col-span-2">
              <label>DURÉE (MIN)</label>
              <input type="number" placeholder="60" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} min="5" step="5" />
            </div>
          ) : (
            <>
              <div className="input-group">
                <label>STOCK INITIAL</label>
                <input type="number" placeholder="Ex: 10" value={newStock} onChange={(e) => setNewStock(e.target.value)} min="0" />
              </div>
              <div className="input-group">
                <label>STOCK MIN (ALERTE)</label>
                <input type="number" placeholder="Ex: 3" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} min="0" />
              </div>
            </>
          )}
        </div>

        <div className="input-group">
          <label>ICÔNE (EMOJI)</label>
          <input type="text" placeholder="💅" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength="2" className="text-center text-xl" />
        </div>

        <button 
          onClick={handleSaveProduct} 
          disabled={isSaving || !newName.trim() || !newPrice}
          className="btn btn-primary w-full flex items-center justify-center gap-2 mt-4"
        >
          {isSaving ? <Loader size={18} className="animate-spin" /> : (editingProductId ? <Edit2 size={18} /> : <Plus size={18} />)}
          {isSaving ? 'Sauvegarde...' : (editingProductId ? 'Mettre à jour' : 'Ajouter service')}
        </button>
      </div>
    </div>
  );
};

export default Catalog;
