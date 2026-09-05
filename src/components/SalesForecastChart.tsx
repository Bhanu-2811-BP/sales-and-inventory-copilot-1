import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { SalesRecord, Product } from '../shared/storeData';
import { Sparkles } from 'lucide-react';

interface SalesForecastChartProps {
  salesHistory: SalesRecord[];
  products: Product[];
}

export default function SalesForecastChart({ salesHistory, products }: SalesForecastChartProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const product = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const forecastData = useMemo(() => {
    if (!product) return [];

    // Filter historical sales for the chosen product
    const productSales = salesHistory.filter(r => r.productId === product.id);

    // Get all unique dates
    const uniqueDates = Array.from(new Set(salesHistory.map(r => r.date))).sort();
    
    // Sum units sold by date for this product
    const dailyData = uniqueDates.map(date => {
      const daySales = productSales.filter(r => r.date === date);
      const units = daySales.reduce((sum, r) => sum + r.unitsSold, 0);
      return {
        date,
        Units: units,
        isForecast: false,
      };
    });

    // Calculate 7-day Simple Moving Average (SMA) baseline
    const last7Days = dailyData.slice(-7);
    const last7Sum = last7Days.reduce((sum, d) => sum + d.Units, 0);
    const averageUnits = parseFloat((last7Sum / 7).toFixed(2)) || 0;

    // Generate forecast for the next 7 days
    const next7DaysData = [];
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1] || '2026-09-04');

    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      const dateStr = nextDate.toISOString().slice(0, 10);

      // Recreate day label
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = monthNames[nextDate.getMonth()];
      const dayLabel = String(nextDate.getDate()).padStart(2, '0');

      // Add 20% weekend lift (Saturday=6, Sunday=0) to mimic real-world patterns
      const dayOfWeek = nextDate.getDay();
      const multiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.25 : 0.95;
      const predictedUnits = Math.max(0, Math.round(averageUnits * multiplier * 10) / 10);

      next7DaysData.push({
        date: dateStr,
        displayDate: `Fct ${monthLabel} ${dayLabel}`,
        Units: predictedUnits,
        isForecast: true,
      });
    }

    // Format historical data display labels
    const formattedHistorical = dailyData.map(d => {
      const dateParts = d.date.split('-');
      const m = parseInt(dateParts[1]);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = monthNames[m - 1];
      const dayLabel = dateParts[2];
      return {
        ...d,
        displayDate: `${monthLabel} ${dayLabel}`,
        Historical: d.Units,
        Forecasted: null as number | null
      };
    });

    const formattedForecast = next7DaysData.map(d => ({
      ...d,
      Historical: null as number | null,
      Forecasted: d.Units
    }));

    // Connect the last historical point to the first forecast point
    if (formattedHistorical.length > 0 && formattedForecast.length > 0) {
      formattedHistorical[formattedHistorical.length - 1].Forecasted = formattedHistorical[formattedHistorical.length - 1].Historical;
    }

    return [...formattedHistorical, ...formattedForecast];
  }, [product, salesHistory]);

  const activeHistorical = useMemo(() => {
    return forecastData.filter(d => !d.isForecast);
  }, [forecastData]);

  const activeForecast = useMemo(() => {
    return forecastData.filter(d => d.isForecast);
  }, [forecastData]);

  const stats = useMemo(() => {
    const historicalTotal = activeHistorical.reduce((sum, d) => sum + d.Units, 0);
    const historicalAvg = historicalTotal / (activeHistorical.length || 1);
    const forecastTotal = activeForecast.reduce((sum, d) => sum + d.Units, 0);
    const forecastAvg = forecastTotal / (activeForecast.length || 1);

    return {
      historicalAvg: historicalAvg.toFixed(1),
      forecastTotal: Math.round(forecastTotal),
      forecastAvg: forecastAvg.toFixed(1),
      pctChange: historicalAvg > 0 ? (((forecastAvg - historicalAvg) / historicalAvg) * 100).toFixed(1) : '0.0'
    };
  }, [activeHistorical, activeForecast]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 mt-6" id="sales-forecast-chart">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">SMA Predictive Sales Forecast</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Simple moving average with weekend weights predicting 7-day volume patterns.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Target Product:</label>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-255 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.discontinued ? '(Discontinued)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800 shadow-3xs">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
            7-Day Historical Run Rate
          </span>
          <strong className="text-lg font-extrabold text-gray-800 dark:text-white">
            {stats.historicalAvg} units/day
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800 shadow-3xs">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
            7-Day Projected Pipeline
          </span>
          <strong className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {stats.forecastTotal} units
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800 shadow-3xs">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
            Predicted Volatility Delta
          </span>
          <strong className={`text-lg font-extrabold ${parseFloat(stats.pctChange) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {parseFloat(stats.pctChange) >= 0 ? '+' : ''}{stats.pctChange}%
          </strong>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis 
              dataKey="displayDate" 
              stroke={isDark ? '#64748b' : '#94a3b8'} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke={isDark ? '#64748b' : '#64748b'} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${val} u`}
            />
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
            <Legend verticalAlign="top" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px' }} />
            
            {/* Split line into historical line and forecast dashed line */}
            <Line 
              type="monotone" 
              dataKey="Historical" 
              stroke="#4f46e5" 
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Historical Sales"
              connectNulls
              activeDot={{ r: 4 }}
            />

            <Line 
              type="monotone" 
              dataKey="Forecasted" 
              stroke="#818cf8" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 2 }}
              name="Projected Forecast (SMA)"
              connectNulls
              activeDot={{ r: 4 }}
            />

            <ReferenceLine 
              x={activeForecast[0]?.displayDate} 
              stroke="#a855f7" 
              strokeDasharray="3 3" 
              label={{ value: 'Forecast Gate', fill: '#a855f7', fontSize: 10, position: 'top' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
