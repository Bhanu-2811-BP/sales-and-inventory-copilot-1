import React from 'react';
import { Product, Store, InventoryItem } from '../shared/storeData';

interface CapacityGridProps {
  products: Product[];
  stores: Store[];
  inventory: InventoryItem[];
}

export default function CapacityGrid({ products, stores, inventory }: CapacityGridProps) {
  // Group capacity and calculation by store
  const storeMetrics = stores.map(store => {
    const storeInventory = inventory.filter(i => i.storeId === store.id);
    const totalStock = storeInventory.reduce((acc, curr) => acc + curr.stock, 0);
    const totalCapacity = storeInventory.reduce((acc, curr) => acc + curr.capacity, 0);
    const utilization = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;

    return {
      ...store,
      totalStock,
      totalCapacity,
      utilization,
      items: storeInventory.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const util = item.capacity > 0 ? (item.stock / item.capacity) * 100 : 0;
        return {
          ...item,
          productName: prod?.name || 'Unknown',
          category: prod?.category || 'General',
          utilization: util
        };
      })
    };
  });

  const getUtilColor = (util: number) => {
    if (util === 0) return { bg: 'bg-rose-50/90 border-rose-600 dark:bg-rose-950/40 dark:border-rose-400', text: 'text-rose-900 dark:text-rose-200', fill: 'bg-rose-600', barBg: 'bg-rose-100', status: 'Stock-out' };
    if (util > 100) return { bg: 'bg-purple-50/90 border-purple-600 dark:bg-purple-950/40 dark:border-purple-400', text: 'text-purple-900 dark:text-purple-200', fill: 'bg-purple-600', barBg: 'bg-purple-100', status: 'Severe Overstock' };
    if (util > 80) return { bg: 'bg-amber-50/90 border-amber-600 dark:bg-amber-950/40 dark:border-amber-400', text: 'text-amber-900 dark:text-amber-200', fill: 'bg-amber-550', barBg: 'bg-amber-100', status: 'High Utilization' };
    if (util < 25) return { bg: 'bg-rose-50/70 border-rose-500 dark:bg-rose-950/30 dark:border-rose-400', text: 'text-rose-900 dark:text-rose-200', fill: 'bg-rose-500', barBg: 'bg-rose-50', status: 'Critical Low' };
    return { bg: 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/30 dark:border-emerald-400', text: 'text-emerald-900 dark:text-emerald-200', fill: 'bg-emerald-600', barBg: 'bg-emerald-100', status: 'Optimal' };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6" id="capacity-grid-visualizer">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Store Warehouse Capacity Heatmap</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time physical warehouse utilization thresholds and capacity levels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1" /> Optimal (25-80%)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-amber-500 mr-1" /> High (&gt;80%)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-purple-600 mr-1" /> Over capacity (&gt;100%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {storeMetrics.map(store => {
          const storeStyle = getUtilColor(store.utilization);

          return (
            <div key={store.id} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                {/* Store Overall Utilization Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{store.name}</h3>
                  <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold uppercase tracking-wider ${storeStyle.bg} ${storeStyle.text}`}>
                    {store.utilization.toFixed(0)}% Utilized
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{store.location}</p>

                {/* Main Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>{store.totalStock} / {store.totalCapacity} units</span>
                    <span>{storeStyle.status}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${storeStyle.fill}`}
                      style={{ width: `${Math.min(store.utilization, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sub-item grid cells */}
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-2">
                    Department Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {store.items.slice(0, 4).map(item => {
                      const itemStyle = getUtilColor(item.utilization);
                      const unitsLeft = item.capacity - item.stock;
                      const tooltipText = unitsLeft > 0 
                        ? `${unitsLeft} units of capacity remaining before full.`
                        : `Capacity reached or exceeded by ${Math.abs(unitsLeft)} units.`;

                      return (
                        <div 
                          key={item.productId} 
                          className={`group relative p-2.5 border-2 rounded-lg flex flex-col justify-between text-left transition-all hover:shadow-sm cursor-pointer ${itemStyle.bg}`}
                        >
                          {/* CSS Hover Tooltip inside a relative group */}
                          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950 text-white text-[10px] p-2 rounded-md shadow-lg z-50 text-center leading-normal border border-slate-800">
                            <span className="font-extrabold block mb-0.5">{item.productName}</span>
                            <span>{tooltipText}</span>
                            <div className="w-2 h-2 bg-slate-950 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b border-slate-800" />
                          </div>

                          <span className="text-[11px] font-black text-slate-950 dark:text-white truncate block uppercase tracking-wide">
                            {item.productName}
                          </span>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-xs font-black text-slate-950 dark:text-white">
                              {item.stock} u
                            </span>
                            <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded shadow-3xs border border-black/5 dark:border-white/5">
                              {item.utilization.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
