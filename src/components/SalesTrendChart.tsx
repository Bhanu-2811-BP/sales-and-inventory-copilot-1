import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SalesRecord, Product, Store } from '../shared/storeData';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import SalesForecastChart from './SalesForecastChart';

interface SalesTrendChartProps {
  salesHistory: SalesRecord[];
  products: Product[];
  stores: Store[];
}

export default function SalesTrendChart({
  salesHistory,
  products,
  stores,
}: SalesTrendChartProps) {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareProductA, setCompareProductA] = useState<string>('');
  const [compareProductB, setCompareProductB] = useState<string>('');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Set default products for comparison when they are available
  useEffect(() => {
    if (products.length > 0) {
      if (!compareProductA) setCompareProductA(products[0].id);
      if (!compareProductB) setCompareProductB(products[1]?.id || products[0].id);
    }
  }, [products, compareProductA, compareProductB]);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  // Aggregate daily records based on active filters and mode
  const chartData = useMemo(() => {
    const uniqueDates = Array.from(new Set(salesHistory.map(r => r.date))).sort();

    if (compareMode) {
      const dailyMap: { [date: string]: { aUnits: number; bUnits: number } } = {};
      uniqueDates.forEach(date => {
        dailyMap[date] = { aUnits: 0, bUnits: 0 };
      });

      salesHistory.forEach(record => {
        const matchesStore = selectedStore === 'all' || record.storeId === selectedStore;
        if (!matchesStore) return;

        if (record.productId === compareProductA) {
          dailyMap[record.date].aUnits += record.unitsSold;
        } else if (record.productId === compareProductB) {
          dailyMap[record.date].bUnits += record.unitsSold;
        }
      });

      return Object.keys(dailyMap).sort().map(date => {
        const dateParts = date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = monthNames[parseInt(dateParts[1]) - 1];
        const dayLabel = dateParts[2];

        return {
          date,
          displayDate: `${monthLabel} ${dayLabel}`,
          ProductAUnits: dailyMap[date].aUnits,
          ProductBUnits: dailyMap[date].bUnits,
        };
      });
    } else {
      const dailyMap: { [date: string]: { units: number; revenue: number } } = {};
      uniqueDates.forEach(date => {
        dailyMap[date] = { units: 0, revenue: 0 };
      });

      salesHistory.forEach(record => {
        const product = products.find(p => p.id === record.productId);
        if (!product) return;

        const matchesStore = selectedStore === 'all' || record.storeId === selectedStore;
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

        if (matchesStore && matchesCategory) {
          if (!dailyMap[record.date]) {
            dailyMap[record.date] = { units: 0, revenue: 0 };
          }
          dailyMap[record.date].units += record.unitsSold;
          dailyMap[record.date].revenue += record.revenue;
        }
      });

      return Object.keys(dailyMap).sort().map(date => {
        const dateParts = date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = monthNames[parseInt(dateParts[1]) - 1];
        const dayLabel = dateParts[2];

        return {
          date,
          displayDate: `${monthLabel} ${dayLabel}`,
          Units: dailyMap[date].units,
          Revenue: dailyMap[date].revenue,
        };
      });
    }
  }, [salesHistory, products, selectedStore, selectedCategory, compareMode, compareProductA, compareProductB]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalUnits = 0;

    chartData.forEach(day => {
      totalRevenue += day.Revenue || 0;
      totalUnits += day.Units || 0;
    });

    return {
      revenue: totalRevenue,
      units: totalUnits,
      avgDailyRevenue: parseFloat((totalRevenue / (chartData.length || 30)).toFixed(2)),
    };
  }, [chartData]);

  const compareStats = useMemo(() => {
    if (!compareMode) return null;
    let totalA = 0;
    let totalB = 0;

    chartData.forEach(day => {
      totalA += day.ProductAUnits || 0;
      totalB += day.ProductBUnits || 0;
    });

    const diff = Math.abs(totalA - totalB);
    const leader = totalA > totalB ? 'A' : totalB > totalA ? 'B' : 'Tie';
    const percentDiff = Math.max(totalA, totalB) > 0 ? (diff / Math.max(totalA, totalB)) * 100 : 0;

    return {
      totalA,
      totalB,
      difference: diff,
      leader,
      pctDiff: percentDiff.toFixed(1),
    };
  }, [chartData, compareMode]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6" id="sales-trend-chart">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">30-Day Sales & Volume Trends</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze historical run rates, daily velocities, and sudden market spikes.
          </p>
        </div>

        {/* Dropdown Filters and Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Compare Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-lg border border-gray-255 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setCompareMode(false)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!compareMode ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-3xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setCompareMode(true)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${compareMode ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-3xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            >
              Compare
            </button>
          </div>

          {/* Store select */}
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Stores</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {!compareMode ? (
            /* Category select */
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/40 p-1 rounded-lg border border-gray-200/50 dark:border-slate-750/50">
              <select
                value={compareProductA}
                onChange={e => setCompareProductA(e.target.value)}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>A: {p.name} {p.discontinued ? '(Discontinued)' : ''}</option>
                ))}
              </select>
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">VS</span>
              <select
                value={compareProductB}
                onChange={e => setCompareProductB(e.target.value)}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>B: {p.name} {p.discontinued ? '(Discontinued)' : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mini Stats Grid on selected filter context */}
      {!compareMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">Filter Revenue</span>
              <strong className="text-base text-gray-900 dark:text-white">${stats.revenue.toLocaleString()}</strong>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">Units Distributed</span>
              <strong className="text-base text-gray-900 dark:text-white">{stats.units.toLocaleString()} units</strong>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">Avg. Daily Sales</span>
              <strong className="text-base text-gray-900 dark:text-white">${stats.avgDailyRevenue.toLocaleString()}/day</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-lg border border-indigo-100/60 dark:border-indigo-950/80 flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-400 dark:text-indigo-300 font-extrabold uppercase tracking-wider block truncate" title={products.find(p => p.id === compareProductA)?.name}>
                [A] {products.find(p => p.id === compareProductA)?.name || 'Product A'}
              </span>
              <strong className="text-lg font-extrabold text-gray-900 dark:text-indigo-200">
                {(compareStats?.totalA || 0).toLocaleString()} units
              </strong>
            </div>
          </div>

          <div className="bg-emerald-50/20 dark:bg-emerald-950/10 p-4 rounded-lg border border-emerald-100/60 dark:border-emerald-950/80 flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-400 dark:text-emerald-300 font-extrabold uppercase tracking-wider block truncate" title={products.find(p => p.id === compareProductB)?.name}>
                [B] {products.find(p => p.id === compareProductB)?.name || 'Product B'}
              </span>
              <strong className="text-lg font-extrabold text-gray-900 dark:text-emerald-200">
                {(compareStats?.totalB || 0).toLocaleString()} units
              </strong>
            </div>
          </div>

          <div className="bg-purple-50/20 dark:bg-purple-950/10 p-4 rounded-lg border border-purple-100/60 dark:border-purple-950/80 flex items-center space-x-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-400 dark:text-purple-300 font-extrabold uppercase tracking-wider block">
                30-Day Margin Leader
              </span>
              <strong className="text-base font-extrabold text-purple-900 dark:text-purple-200 block truncate">
                {compareStats?.leader === 'Tie' ? 'Equal Volume' : `Product ${compareStats?.leader} (+${compareStats?.pctDiff}%)`}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Area Graph */}
      <div className="h-[280px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium">
            No historical data found.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProductA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProductB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
              <XAxis 
                dataKey="displayDate" 
                stroke={isDark ? '#64748b' : '#94a3b8'} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              />
              
              {!compareMode ? (
                <>
                  <YAxis 
                    yAxisId="left" 
                    stroke="#4f46e5" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#f59e0b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val} u`}
                  />
                </>
              ) : (
                <YAxis 
                  stroke={isDark ? '#cbd5e1' : '#475569'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val} u`}
                />
              )}

              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  borderRadius: '8px', 
                  border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: isDark ? '#f8fafc' : '#1e293b'
                }}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: isDark ? '#cbd5e1' : '#1e293b', marginBottom: '4px' }}
                itemStyle={{ fontSize: '12px', padding: '2px 0' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              
              {!compareMode ? (
                <>
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Revenue" 
                    name="Revenue ($)" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Units" 
                    name="Units Sold" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUnits)" 
                  />
                </>
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="ProductAUnits" 
                    name={`[A] ${products.find(p => p.id === compareProductA)?.name || 'Product A'}`} 
                    stroke="#4f46e5" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorProductA)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ProductBUnits" 
                    name={`[B] ${products.find(p => p.id === compareProductB)?.name || 'Product B'}`} 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorProductB)" 
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Embedded SMA Sales Forecast section */}
      <SalesForecastChart 
        salesHistory={salesHistory}
        products={products}
      />
    </div>
  );
}
