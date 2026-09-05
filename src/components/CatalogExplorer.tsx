import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  AlertCircle, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Map,
  Settings,
  XCircle,
  ArrowLeftRight,
  ChevronRight,
  RotateCcw,
  X
} from 'lucide-react';
import { Product, Store, InventoryItem } from '../shared/storeData';

interface CatalogExplorerProps {
  products: Product[];
  stores: Store[];
  inventory: InventoryItem[];
  onUpdateStock: (productId: string, storeId: string, delta: number) => void;
  onUpdateReorderPoint?: (productId: string, storeId: string, newReorderPoint: number) => void;
  onMarkDiscontinued?: (productId: string) => void;
  onTransferStock?: (productId: string, fromStoreId: string, toStoreId: string, quantity: number) => void;
}

export default function CatalogExplorer({
  products,
  stores,
  inventory,
  onUpdateStock,
  onUpdateReorderPoint,
  onMarkDiscontinued,
  onTransferStock,
}: CatalogExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingStock, setEditingStock] = useState<{ productId: string; storeId: string } | null>(null);
  const [tempStockVal, setTempStockVal] = useState<string>('');
  const [regionalHealthMode, setRegionalHealthMode] = useState(false);
  const [selectedHeatmapProduct, setSelectedHeatmapProduct] = useState<string>(products[0]?.id || '');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    productId: string;
    storeId: string;
    productName: string;
    storeName: string;
    currentReorderPoint: number;
    currentStock: number;
  } | null>(null);

  // Modals state
  const [reorderModal, setReorderModal] = useState<{
    visible: boolean;
    productId: string;
    storeId: string;
    productName: string;
    storeName: string;
    value: string;
  } | null>(null);

  const [transferModal, setTransferModal] = useState<{
    visible: boolean;
    productId: string;
    productName: string;
    sourceStoreId: string;
    targetStoreId: string;
    quantity: string;
  } | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Close context menu on window click
  useEffect(() => {
    const handleWindowClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  // Filter products & stock levels based on query and store filters
  const filteredGridItems = inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    const store = stores.find(s => s.id === item.storeId);
    return {
      ...item,
      product,
      store,
    };
  }).filter(item => {
    if (!item.product || !item.store) return false;

    const matchesSearch = item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'all' || item.storeId === selectedStore;
    const matchesCategory = selectedCategory === 'all' || item.product.category === selectedCategory;

    return matchesSearch && matchesStore && matchesCategory;
  });

  const getStockStatus = (stock: number, capacity: number, reorderPoint: number) => {
    const ratio = capacity > 0 ? stock / capacity : 0;
    if (stock === 0) return { label: 'Stock-out', color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' };
    if (stock <= reorderPoint) return { label: 'Critical Low', color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    if (stock > capacity) return { label: 'Overstocked', color: 'bg-purple-600', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' };
    if (ratio > 0.8) return { label: 'High Stock', color: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' };
    return { label: 'Healthy', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
  };

  const startEditing = (productId: string, storeId: string, currentStock: number) => {
    setEditingStock({ productId, storeId });
    setTempStockVal(currentStock.toString());
  };

  const saveStockEdit = (productId: string, storeId: string) => {
    const parsed = parseInt(tempStockVal);
    if (!isNaN(parsed) && parsed >= 0) {
      const original = inventory.find(i => i.productId === productId && i.storeId === storeId);
      if (original) {
        const diff = parsed - original.stock;
        onUpdateStock(productId, storeId, diff);
      }
    }
    setEditingStock(null);
  };

  const handleRowContextMenu = (
    e: React.MouseEvent,
    productId: string,
    storeId: string,
    productName: string,
    storeName: string,
    currentReorderPoint: number,
    currentStock: number
  ) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      productId,
      storeId,
      productName,
      storeName,
      currentReorderPoint,
      currentStock
    });
  };

  // Find stock levels across all stores for the selected heatmap product
  const heatmapProduct = products.find(p => p.id === selectedHeatmapProduct) || products[0];
  const heatmapItems = stores.map(store => {
    const item = inventory.find(i => i.productId === heatmapProduct?.id && i.storeId === store.id);
    return {
      store,
      item
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 relative" id="catalog-explorer">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Catalogue & Inventory Explorer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor real-time product stock counts, capacities, and reorder triggers. <span className="font-semibold text-indigo-600 dark:text-indigo-400">Right-click any row</span> for quick actions.
          </p>
        </div>

        {/* Regional Health Toggle */}
        <button
          onClick={() => setRegionalHealthMode(!regionalHealthMode)}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
            regionalHealthMode
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Map className="w-4 h-4 mr-2" />
          {regionalHealthMode ? 'Standard Grid View' : 'Regional Health Mode'}
        </button>
      </div>

      {regionalHealthMode ? (
        /* REGIONAL HEALTH HEATMAP VIEW */
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 p-5 rounded-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Regional Stock Level Heatmap</h3>
              <p className="text-xs text-gray-400 dark:text-gray-550 mt-0.5">Select a product to map carrying levels and safety margins across physical locations.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Product:</span>
              <select
                value={selectedHeatmapProduct}
                onChange={e => setSelectedHeatmapProduct(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-250 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.discontinued ? '(Discontinued)' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {heatmapItems.map(({ store, item }) => {
              if (!item) return null;
              const productObj = products.find(p => p.id === item.productId);
              const status = getStockStatus(item.stock, item.capacity, item.reorderPoint);
              const utilization = item.capacity > 0 ? ((item.stock / item.capacity) * 100).toFixed(0) : '0';

              return (
                <div 
                  key={store.id} 
                  onContextMenu={(e) => handleRowContextMenu(e, item.productId, store.id, productObj?.name || 'Unknown', store.name, item.reorderPoint, item.stock)}
                  className={`bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-2xs relative ${
                    productObj?.discontinued ? 'opacity-65' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-sm font-bold text-gray-800 dark:text-white">{store.name}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${status.bg} ${status.text}`}>
                        {productObj?.discontinued ? 'Discontinued' : status.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 block mb-3">{store.location}</span>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500 font-medium">Stock count</span>
                        <span className="text-base font-black text-gray-900 dark:text-white">{item.stock} / {item.capacity} units</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>Capacity utilization</span>
                        <span>{utilization}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Stock Adjust in Heatmap card */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold">Trigger: &lt;={item.reorderPoint}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onUpdateStock(item.productId, item.storeId, -5)}
                        disabled={item.stock <= 0}
                        className="px-2 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded cursor-pointer"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => onUpdateStock(item.productId, item.storeId, 5)}
                        className="px-2 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STANDARD TABLE GRID VIEW */
        <>
          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <input
                id="search-catalogue-input"
                type="text"
                placeholder="Search catalogue... (Ctrl+S / Alt+S)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
              />
            </div>

            {/* Store Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all cursor-pointer"
              >
                <option value="all">All Store Locations</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all cursor-pointer"
              >
                <option value="all">All Product Categories</option>
                {categories.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Horizontal Filter Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer border transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-750 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-850 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Store Location</th>
                  <th className="py-3.5 px-4">Stock Level / Capacity</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {filteredGridItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">
                      No inventory records matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredGridItems.map(item => {
                    const status = getStockStatus(item.stock, item.capacity, item.reorderPoint);
                    const capacityRatio = item.capacity > 0 ? Math.min((item.stock / item.capacity) * 100, 100) : 0;
                    const isEditing = editingStock?.productId === item.productId && editingStock?.storeId === item.storeId;
                    const isDiscontinued = item.product?.discontinued;

                    return (
                      <tr 
                        key={`${item.productId}-${item.storeId}`} 
                        onContextMenu={(e) => handleRowContextMenu(e, item.productId, item.storeId, item.product?.name || 'Unknown', item.store?.name || 'Unknown', item.reorderPoint, item.stock)}
                        className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-context-menu ${
                          isDiscontinued ? 'opacity-60 bg-rose-50/10' : ''
                        }`}
                      >
                        {/* Product Details */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-md">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                {item.product?.name}
                                {isDiscontinued && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded">
                                    Discontinued
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {item.product?.category} • Cost: ${item.product?.unitCost} • Retail: ${item.product?.unitPrice}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Store Name */}
                        <td className="py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                          {item.store?.name}
                        </td>

                        {/* Capacity and Progress Bar */}
                        <td className="py-4 px-4 min-w-[200px]">
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-450 mb-1.5">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={tempStockVal}
                                  onChange={e => setTempStockVal(e.target.value)}
                                  className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:outline-indigo-500"
                                  autoFocus
                                />
                                <span className="text-gray-405">/ {item.capacity} max</span>
                              </div>
                            ) : (
                              <span>
                                <strong className="text-gray-900 dark:text-white text-sm">{item.stock}</strong> / {item.capacity} units
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">Trigger: &lt;={item.reorderPoint}</span>
                          </div>
                          
                          {/* Visual Progress Bar */}
                          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${status.color}`}
                              style={{ width: `${capacityRatio}%` }}
                            />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} border-transparent`}>
                            {isDiscontinued ? 'Discontinued' : status.label}
                          </span>
                        </td>

                        {/* Quick Manual restock buttons */}
                        <td className="py-4 px-4 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => saveStockEdit(item.productId, item.storeId)}
                              className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow-sm hover:shadow transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Decrease Stock */}
                              <button
                                onClick={() => onUpdateStock(item.productId, item.storeId, -5)}
                                disabled={item.stock <= 0}
                                title="Quick Adjust -5"
                                className="p-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 text-gray-500 rounded border border-gray-200 dark:border-slate-700 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* Main editing trigger */}
                              <button
                                onClick={() => startEditing(item.productId, item.storeId, item.stock)}
                                className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded transition-colors cursor-pointer"
                              >
                                Set Stock
                              </button>

                              {/* Increase Stock */}
                              <button
                                onClick={() => onUpdateStock(item.productId, item.storeId, 5)}
                                title="Quick Adjust +5"
                                className="p-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 rounded border border-gray-200 dark:border-slate-700 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="fixed bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1.5 w-56 text-left z-50 transition-all select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: contextMenu.y, 
            left: Math.min(contextMenu.x, window.innerWidth - 240) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-750">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Quick Actions
            </span>
            <strong className="text-xs text-gray-900 dark:text-white truncate block max-w-[200px] mt-0.5">
              {contextMenu.productName}
            </strong>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-0.5 truncate">
              Location: {contextMenu.storeName}
            </span>
          </div>

          <button
            onClick={() => {
              setReorderModal({
                visible: true,
                productId: contextMenu.productId,
                storeId: contextMenu.storeId,
                productName: contextMenu.productName,
                storeName: contextMenu.storeName,
                value: contextMenu.currentReorderPoint.toString()
              });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>Set Reorder Point</span>
          </button>

          <button
            onClick={() => {
              if (onMarkDiscontinued) {
                onMarkDiscontinued(contextMenu.productId);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left cursor-pointer transition-colors"
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Mark as Discontinued</span>
          </button>

          <button
            onClick={() => {
              // Prefill target store to current store, and set a default source store
              const potentialSources = inventory.filter(i => i.productId === contextMenu.productId && i.storeId !== contextMenu.storeId && i.stock > 10);
              const bestSource = potentialSources.sort((a,b) => b.stock - a.stock)[0]?.storeId || '';
              
              setTransferModal({
                visible: true,
                productId: contextMenu.productId,
                productName: contextMenu.productName,
                sourceStoreId: bestSource,
                targetStoreId: contextMenu.storeId,
                quantity: '5'
              });
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-left cursor-pointer transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" />
            <span>View Store Transfers</span>
          </button>
        </div>
      )}

      {/* SET REORDER POINT MODAL */}
      {reorderModal && reorderModal.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setReorderModal(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Adjust Safety Alert Limit</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Specify the reorder trigger threshold for <strong className="text-indigo-600 dark:text-indigo-400">{reorderModal.productName}</strong> at {reorderModal.storeName}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Reorder Alert Point (units)
                </label>
                <input
                  type="number"
                  value={reorderModal.value}
                  onChange={(e) => setReorderModal(prev => prev ? { ...prev, value: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 15"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setReorderModal(null)}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const val = parseInt(reorderModal.value);
                    if (!isNaN(val) && val >= 0) {
                      if (onUpdateReorderPoint) {
                        onUpdateReorderPoint(reorderModal.productId, reorderModal.storeId, val);
                      }
                    }
                    setReorderModal(null);
                  }}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STORE TRANSFERS MODAL */}
      {transferModal && transferModal.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setTransferModal(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2 mb-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Internal Store Transfer Manager</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Optimize stock levels of <strong className="text-indigo-600 dark:text-indigo-400">{transferModal.productName}</strong> by reallocating units between operational locations.
            </p>

            {/* Current Stock Levels across Stores */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 mb-4 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                Active Store Carrying Balances
              </span>
              {stores.map(st => {
                const item = inventory.find(i => i.productId === transferModal.productId && i.storeId === st.id);
                return (
                  <div key={st.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{st.name}</span>
                    <span className="font-bold text-gray-800 dark:text-white">{item?.stock || 0} / {item?.capacity || 0} units</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Source Store (From)
                  </label>
                  <select
                    value={transferModal.sourceStoreId}
                    onChange={(e) => setTransferModal(prev => prev ? { ...prev, sourceStoreId: e.target.value } : null)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select source</option>
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Target Store (To)
                  </label>
                  <select
                    value={transferModal.targetStoreId}
                    onChange={(e) => setTransferModal(prev => prev ? { ...prev, targetStoreId: e.target.value } : null)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select target</option>
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  value={transferModal.quantity}
                  onChange={(e) => setTransferModal(prev => prev ? { ...prev, quantity: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 5"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setTransferModal(null)}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const val = parseInt(transferModal.quantity);
                    if (transferModal.sourceStoreId === transferModal.targetStoreId) {
                      alert("Source and target stores cannot be the same.");
                      return;
                    }
                    if (!isNaN(val) && val > 0 && transferModal.sourceStoreId && transferModal.targetStoreId) {
                      if (onTransferStock) {
                        onTransferStock(transferModal.productId, transferModal.sourceStoreId, transferModal.targetStoreId, val);
                      }
                    }
                    setTransferModal(null);
                  }}
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-all"
                >
                  Execute Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
