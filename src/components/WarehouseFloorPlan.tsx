import React, { useState, useEffect, useMemo } from 'react';
import { Product, Store, InventoryItem } from '../shared/storeData';
import { 
  Box, 
  Map, 
  Layers, 
  Info, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  ArrowLeftRight, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';

interface WarehouseFloorPlanProps {
  products: Product[];
  stores: Store[];
  inventory: InventoryItem[];
  onUpdateStock?: (productId: string, storeId: string, delta: number) => void;
}

interface Aisle {
  id: string;
  name: string;
  categories: string[];
  capacity: number; // Max total units this aisle can hold
}

// 4 distinct virtual aisles with physical layout details
const AISLES: Aisle[] = [
  { id: 'aisle-1', name: 'Aisle 01: Soft Goods & Apparel', categories: ['Apparel', 'Accessories'], capacity: 150 },
  { id: 'aisle-2', name: 'Aisle 02: Footwear & Heavy Cargo', categories: ['Footwear'], capacity: 100 },
  { id: 'aisle-3', name: 'Aisle 03: Precision Electronics', categories: ['Electronics'], capacity: 120 },
  { id: 'aisle-4', name: 'Aisle 04: Bulk Home Goods & Linens', categories: ['Home Goods'], capacity: 140 },
];

export default function WarehouseFloorPlan({ products, stores, inventory, onUpdateStock }: WarehouseFloorPlanProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || 's1');
  
  // Track visual organization map: productId -> aisleId (or 'unassigned')
  const [organizationMap, setOrganizationMap] = useState<{ [storeAndProduct: string]: string }>({});
  
  // State for dragging item ID
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [draggedSourceAisle, setDraggedSourceAisle] = useState<string | null>(null);
  const [dragOverAisleId, setDragOverAisleId] = useState<string | null>(null);
  
  // Touch-friendly quick menu selector state
  const [activeQuickMoveProduct, setActiveQuickMoveProduct] = useState<string | null>(null);

  // Initialize mapping on first render or when inventory changes
  useEffect(() => {
    const initialMap: { [storeAndProduct: string]: string } = {};
    
    stores.forEach(store => {
      products.forEach(product => {
        const key = `${store.id}:${product.id}`;
        // Automatically default aisle based on category match
        const matchedAisle = AISLES.find(aisle => aisle.categories.includes(product.category));
        initialMap[key] = matchedAisle ? matchedAisle.id : 'unassigned';
      });
    });

    setOrganizationMap(prev => {
      // Keep existing mappings but fill in new ones
      return { ...initialMap, ...prev };
    });
  }, [products, stores]);

  const currentStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || stores[0];
  }, [stores, selectedStoreId]);

  // Filter inventory items for the selected store
  const storeInventory = useMemo(() => {
    return inventory.filter(item => item.storeId === selectedStoreId);
  }, [inventory, selectedStoreId]);

  // Aggregate items inside each aisle
  const aisleContents = useMemo(() => {
    const contents: { [aisleId: string]: Array<InventoryItem & { product: Product }> } = {
      'unassigned': []
    };
    
    AISLES.forEach(a => { contents[a.id] = []; });

    storeInventory.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return;

      const key = `${selectedStoreId}:${item.productId}`;
      const assignedAisleId = organizationMap[key] || 'unassigned';

      const itemWithProd = { ...item, product: prod };
      if (contents[assignedAisleId]) {
        contents[assignedAisleId].push(itemWithProd);
      } else {
        contents['unassigned'].push(itemWithProd);
      }
    });

    return contents;
  }, [storeInventory, products, organizationMap, selectedStoreId]);

  // Compute metrics for each aisle
  const aisleMetrics = useMemo(() => {
    return AISLES.map(aisle => {
      const items = aisleContents[aisle.id] || [];
      const totalUnits = items.reduce((sum, item) => sum + item.stock, 0);
      const utilization = aisle.capacity > 0 ? (totalUnits / aisle.capacity) * 100 : 0;
      
      return {
        ...aisle,
        totalUnits,
        utilization,
        itemCount: items.length
      };
    });
  }, [aisleContents]);

  // Handle Drag & Drop logic
  const handleDragStart = (e: React.DragEvent, productId: string, sourceAisleId: string) => {
    setDraggedProductId(productId);
    setDraggedSourceAisle(sourceAisleId);
    e.dataTransfer.setData('text/plain', productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, aisleId: string) => {
    e.preventDefault();
    if (dragOverAisleId !== aisleId) {
      setDragOverAisleId(aisleId);
    }
  };

  const handleDragLeave = () => {
    setDragOverAisleId(null);
  };

  const relocateItem = (productId: string, targetAisleId: string) => {
    const key = `${selectedStoreId}:${productId}`;
    setOrganizationMap(prev => ({
      ...prev,
      [key]: targetAisleId
    }));
    setActiveQuickMoveProduct(null);
    setDragOverAisleId(null);
  };

  const handleDrop = (e: React.DragEvent, targetAisleId: string) => {
    e.preventDefault();
    const productId = e.dataTransfer.getData('text/plain') || draggedProductId;
    if (productId) {
      relocateItem(productId, targetAisleId);
    }
    setDraggedProductId(null);
    setDraggedSourceAisle(null);
    setDragOverAisleId(null);
  };

  const handleResetLayout = () => {
    const resetMap = { ...organizationMap };
    products.forEach(product => {
      const key = `${selectedStoreId}:${product.id}`;
      const matchedAisle = AISLES.find(aisle => aisle.categories.includes(product.category));
      resetMap[key] = matchedAisle ? matchedAisle.id : 'unassigned';
    });
    setOrganizationMap(resetMap);
  };

  const handleScatterLayout = () => {
    // Randomize organization layout for visual fun
    const scatteredMap = { ...organizationMap };
    products.forEach(product => {
      const key = `${selectedStoreId}:${product.id}`;
      const randomIndex = Math.floor(Math.random() * (AISLES.length + 1));
      const targetAisle = randomIndex === AISLES.length ? 'unassigned' : AISLES[randomIndex].id;
      scatteredMap[key] = targetAisle;
    });
    setOrganizationMap(scatteredMap);
  };

  const getAisleAlertColor = (utilization: number) => {
    if (utilization > 100) return {
      border: 'border-purple-600 dark:border-purple-400',
      bg: 'bg-purple-50/80 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-300',
      progress: 'bg-purple-600',
      status: 'Overloaded'
    };
    if (utilization > 85) return {
      border: 'border-amber-600 dark:border-amber-400',
      bg: 'bg-amber-50/80 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      progress: 'bg-amber-500',
      status: 'Near Limit'
    };
    if (utilization === 0) return {
      border: 'border-slate-300 dark:border-slate-700',
      bg: 'bg-slate-50/50 dark:bg-slate-900/30',
      text: 'text-slate-400 dark:text-slate-500',
      progress: 'bg-slate-300 dark:bg-slate-700',
      status: 'Empty'
    };
    return {
      border: 'border-emerald-500 dark:border-emerald-500',
      bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
      text: 'text-emerald-700 dark:text-emerald-300',
      progress: 'bg-emerald-600',
      status: 'Balanced'
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6" id="warehouse-view">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Interactive Floor Plan Layout
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag and drop cargo packages between aisles to reorganize stock bays and optimize floor space.
          </p>
        </div>

        {/* Store Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStoreId}
            onChange={e => {
              setSelectedStoreId(e.target.value);
              setActiveQuickMoveProduct(null);
            }}
            className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetLayout}
            title="Reset Cargo Items to Categorized Default Aisles"
            className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-100/50 rounded-lg cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleScatterLayout}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Randomize Layout
          </button>
        </div>
      </div>

      {/* Main Floor Plan Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: The Virtual Aisles Grid (Bays 1-4) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aisleMetrics.map(aisle => {
              const themeStyle = getAisleAlertColor(aisle.utilization);
              const isOver = dragOverAisleId === aisle.id;
              
              return (
                <div
                  key={aisle.id}
                  onDragOver={e => handleDragOver(e, aisle.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, aisle.id)}
                  className={`border-2 rounded-xl p-4 transition-all duration-250 min-h-[290px] flex flex-col justify-between ${
                    isOver 
                      ? 'border-dashed border-indigo-600 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 scale-[1.01] shadow-md' 
                      : `${themeStyle.border} ${themeStyle.bg}`
                  }`}
                >
                  {/* Aisle Title & Status Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-wide">
                        {aisle.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${themeStyle.border} ${themeStyle.text}`}>
                        {themeStyle.status}
                      </span>
                    </div>

                    {/* Aisle Capacity Progress Indicator */}
                    <div className="mb-4 bg-white/70 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-300 mb-1.5">
                        <span>Utilization Limit</span>
                        <span>{aisle.totalUnits} / {aisle.capacity} units ({aisle.utilization.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${themeStyle.progress}`}
                          style={{ width: `${Math.min(aisle.utilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Dropped Content Box */}
                    <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      {aisleContents[aisle.id].length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white/40 dark:bg-slate-900/10">
                          <Box className="w-5 h-5 text-slate-300 dark:text-slate-700 mb-1" />
                          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Empty Stock Bay
                          </p>
                          <span className="text-[9px] text-slate-400/80 dark:text-slate-600">
                            Drop cargo items here
                          </span>
                        </div>
                      ) : (
                        aisleContents[aisle.id].map(item => (
                          <div
                            key={item.productId}
                            draggable
                            onDragStart={e => handleDragStart(e, item.productId, aisle.id)}
                            className={`group relative p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg shadow-3xs hover:border-indigo-500 dark:hover:border-indigo-400 transition-all flex items-center justify-between cursor-grab active:cursor-grabbing ${
                              draggedProductId === item.productId ? 'opacity-30' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <Box className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-black text-slate-950 dark:text-white truncate block uppercase leading-tight">
                                  {item.product.name}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block uppercase">
                                  {item.product.category}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-250/30">
                                {item.stock} u
                              </span>
                              
                              {/* Trigger button for Quick Touch Menu */}
                              <button
                                onClick={() => setActiveQuickMoveProduct(
                                  activeQuickMoveProduct === item.productId ? null : item.productId
                                )}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-850 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                                title="Quick move cargo layout"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Touch-friendly Quick Bay Relocator Menu */}
                            {activeQuickMoveProduct === item.productId && (
                              <div className="absolute top-full right-0 mt-1 z-40 bg-slate-950 text-white rounded-lg border border-slate-800 shadow-xl p-2.5 w-48 text-left leading-normal animate-in fade-in slide-in-from-top-1">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wide block mb-1.5">
                                  Quick relocate cargo:
                                </span>
                                <div className="space-y-1">
                                  {AISLES.filter(a => a.id !== aisle.id).map(a => (
                                    <button
                                      key={a.id}
                                      onClick={() => relocateItem(item.productId, a.id)}
                                      className="w-full text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/65 py-1 px-2 rounded font-extrabold text-left truncate flex items-center justify-between"
                                    >
                                      <span>{a.name.split(':')[0]}</span>
                                      <ChevronRight className="w-3 h-3 text-indigo-400" />
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => relocateItem(item.productId, 'unassigned')}
                                    className="w-full text-[10px] text-slate-400 hover:text-white hover:bg-rose-600/65 py-1 px-2 rounded font-extrabold text-left border-t border-slate-800"
                                  >
                                    Move to Unassigned
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Dock of Unassigned / Floating Cargo Bays (4/12 Width) */}
        <div className="xl:col-span-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 min-h-[300px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-300">
                Unassigned Bay Dock
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 rounded-full text-[10px] font-black">
              {aisleContents['unassigned'].length} items
            </span>
          </div>

          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-4 leading-normal">
            Cargo products placed here represent newly arrived inventory packages waiting for aisle assignments. Drag them onto active floor bays to assign storage bins.
          </p>

          <div
            onDragOver={e => handleDragOver(e, 'unassigned')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'unassigned')}
            className={`space-y-2 max-h-[460px] overflow-y-auto pr-1 p-2 border-2 rounded-lg transition-all ${
              dragOverAisleId === 'unassigned' 
                ? 'border-dashed border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/10' 
                : 'border-transparent'
            }`}
          >
            {aisleContents['unassigned'].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-850 bg-white/30 dark:bg-slate-900/5 rounded-lg">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  Floor Fully Assigned
                </p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                  All active cargo is organized in aisles.
                </span>
              </div>
            ) : (
              aisleContents['unassigned'].map(item => (
                <div
                  key={item.productId}
                  draggable
                  onDragStart={e => handleDragStart(e, item.productId, 'unassigned')}
                  className={`group relative p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-3xs hover:border-indigo-400 transition-all flex items-center justify-between cursor-grab active:cursor-grabbing ${
                    draggedProductId === item.productId ? 'opacity-30' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-1.5 bg-slate-150 dark:bg-slate-850 text-slate-600 dark:text-slate-400 rounded">
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white truncate block uppercase leading-tight">
                        {item.product.name}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block uppercase">
                        {item.product.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-250/20">
                      {item.stock} u
                    </span>
                    <button
                      onClick={() => setActiveQuickMoveProduct(
                        activeQuickMoveProduct === item.productId ? null : item.productId
                      )}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-850 rounded hover:bg-slate-250/40"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Touch-friendly Quick Bay Relocator Menu */}
                  {activeQuickMoveProduct === item.productId && (
                    <div className="absolute top-full right-0 mt-1 z-40 bg-slate-950 text-white rounded-lg border border-slate-800 shadow-xl p-2.5 w-48 text-left leading-normal">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wide block mb-1.5">
                        Quick assign cargo aisle:
                      </span>
                      <div className="space-y-1">
                        {AISLES.map(a => (
                          <button
                            key={a.id}
                            onClick={() => relocateItem(item.productId, a.id)}
                            className="w-full text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/65 py-1 px-2 rounded font-extrabold text-left truncate flex items-center justify-between"
                          >
                            <span>{a.name.split(':')[0]}</span>
                            <ChevronRight className="w-3 h-3 text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Instructional Footer Tip */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong className="font-extrabold text-slate-700 dark:text-slate-300 uppercase block mb-0.5">Physical Capacity Warning Threshold</strong>
          When an aisle's collective stock weight surpasses <span className="font-bold text-amber-600 dark:text-amber-400">85% utilization</span>, the floor bay turns amber as a warning limit. Going above <span className="font-bold text-purple-600 dark:text-purple-400">100% (capacity overload)</span> requires urgent stock relocation back to the Dock or transferring to secondary store warehouses via the Catalogue Explorer below.
        </div>
      </div>
    </div>
  );
}
