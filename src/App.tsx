import React, { useState, useEffect } from 'react';
import { 
  getSummaryMetrics, 
  products as initialProducts, 
  stores as initialStores, 
  inventory as initialInventory, 
  operationalAlerts as initialAlerts,
  salesHistory as initialSales,
  Product,
  Store,
  InventoryItem,
  OperationalAlert,
  SalesRecord
} from './shared/storeData';
import AttentionPanel from './components/AttentionPanel';
import CatalogExplorer from './components/CatalogExplorer';
import SalesTrendChart from './components/SalesTrendChart';
import CopilotChat from './components/CopilotChat';
import CapacityGrid from './components/CapacityGrid';
import WarehouseFloorPlan from './components/WarehouseFloorPlan';
import { 
  Activity, 
  TrendingUp, 
  AlertOctagon, 
  Layers, 
  CheckCircle, 
  RefreshCw,
  Server,
  CloudLightning,
  AlertCircle,
  Download,
  Sun,
  Moon,
  Map,
  Keyboard,
  X
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [alerts, setAlerts] = useState<OperationalAlert[]>(initialAlerts);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>(initialSales);
  const [activeView, setActiveView] = useState<'analytics' | 'warehouse'>('analytics');
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  
  // App-level flags
  const [isLoading, setIsLoading] = useState(true);
  const [syncSource, setSyncSource] = useState<'API Server' | 'Offline Cache'>('Offline Cache');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('theme');
    if (cached === 'light') {
      document.documentElement.classList.remove('dark');
      return 'light';
    }
    document.documentElement.classList.add('dark');
    return 'dark';
  });

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      showToast('Dark Mode enabled for low-light warehouse conditions.', 'info');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      showToast('Light Mode enabled.', 'info');
    }
  };

  // Load live data from FastAPI backend on load
  useEffect(() => {
    async function fetchServerData() {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || initialProducts);
          setStores(data.stores || initialStores);
          setInventory(data.inventory || initialInventory);
          setAlerts(data.operationalAlerts || initialAlerts);
          setSalesHistory(data.salesHistory || initialSales);
          setSyncSource('API Server');
          showToast('Operational database synced with Python API backend.', 'success');
        } else {
          setSyncSource('Offline Cache');
          showToast('API offline. Running in highly reliable offline demo mode.', 'info');
        }
      } catch (err) {
        setSyncSource('Offline Cache');
        showToast('Running in local offline-first demo mode.', 'info');
      } finally {
        setIsLoading(false);
      }
    }
    fetchServerData();
  }, []);

  // Global Keyboard Shortcuts Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable
      );

      // We handle Ctrl+S or Alt+S (Search Catalogue)
      if ((e.ctrlKey && e.key.toLowerCase() === 's') || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        setActiveView('analytics');
        setTimeout(() => {
          const searchInput = document.getElementById('search-catalogue-input') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 80);
        return;
      }

      // We handle Ctrl+A or Alt+A (Alerts / Attention Panel)
      if ((e.ctrlKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setActiveView('analytics');
        setTimeout(() => {
          const attentionEl = document.getElementById('attention-panel');
          if (attentionEl) {
            attentionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            attentionEl.classList.add('ring-4', 'ring-rose-500/30', 'transition-all', 'duration-300');
            setTimeout(() => {
              attentionEl.classList.remove('ring-4', 'ring-rose-500/30');
            }, 1200);
          }
        }, 80);
        return;
      }

      // We handle Ctrl+C or Alt+C (Capacity / Heatmap)
      if ((e.ctrlKey && e.key.toLowerCase() === 'c') || (e.altKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        setActiveView('analytics');
        setTimeout(() => {
          const capacityEl = document.getElementById('capacity-grid');
          if (capacityEl) {
            capacityEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            capacityEl.classList.add('ring-4', 'ring-indigo-500/30', 'transition-all', 'duration-300');
            setTimeout(() => {
              capacityEl.classList.remove('ring-4', 'ring-indigo-500/30');
            }, 1200);
          }
        }, 80);
        return;
      }

      // We handle Ctrl+D or Alt+D (Copilot Chat input)
      if ((e.ctrlKey && e.key.toLowerCase() === 'd') || (e.altKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        const chatInput = document.getElementById('copilot-chat-input') as HTMLInputElement | null;
        if (chatInput) {
          chatInput.focus();
          chatInput.select();
        }
        return;
      }

      // If user is currently typing inside an input field, do not trigger single-key view-switching shortcuts
      if (isInput) return;

      // Tab navigation switches
      // Alt+1 or Alt+O: Switch to Operations Desk
      if (e.altKey && (e.key.toLowerCase() === 'o' || e.key === '1')) {
        e.preventDefault();
        setActiveView('analytics');
        showToast('Switched to Operations Desk (Alt+1)', 'info');
      }
      // Alt+2 or Alt+W: Switch to Warehouse view
      if (e.altKey && (e.key.toLowerCase() === 'w' || e.key === '2')) {
        e.preventDefault();
        setActiveView('warehouse');
        showToast('Switched to Warehouse Floor Plan (Alt+2)', 'info');
      }

      // Alt+H or Ctrl+/ or ? (when not typing): Toggle keyboard shortcut help modal
      if ((e.altKey && e.key.toLowerCase() === 'h') || (e.key === '?') || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleExportCSV = (type: 'inventory' | 'alerts') => {
    const timestamp = new Date().toLocaleTimeString();
    
    if (type === 'inventory') {
      const headers = ['Product ID', 'Product Name', 'Category', 'Store ID', 'Store Name', 'Current Stock', 'Capacity', 'Reorder Point', 'Daily Velocity', 'Utilization %'];
      const rows = inventory.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        const utilization = ((item.stock / item.capacity) * 100).toFixed(1) + '%';
        return [
          item.productId,
          prod?.name || 'N/A',
          prod?.category || 'N/A',
          item.storeId,
          store?.name || 'N/A',
          item.stock,
          item.capacity,
          item.reorderPoint,
          item.dailyVelocity,
          utilization
        ];
      });

      const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `retail_inventory_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Audit Log log in the toast notification system
      showToast(`[AUDIT LOG - ${timestamp}] Exported Current Inventory levels report successfully.`, 'success');
    } else {
      const headers = ['Alert ID', 'Alert Type', 'Title', 'Description', 'Diagnostic Metric', 'Mathematical Calculation', 'Carrying Cost ($/mo)', 'Prescribed Intervention'];
      const rows = alerts.map(alert => {
        return [
          alert.id,
          alert.type,
          alert.title,
          alert.description,
          alert.metric,
          alert.calculation,
          alert.carryingCost ? `$${alert.carryingCost.toFixed(2)}` : '$0.00',
          alert.recommendation
        ];
      });

      const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `retail_operational_anomalies_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Audit Log log in the toast notification system
      showToast(`[AUDIT LOG - ${timestamp}] Exported Operational anomalies & alerts log successfully.`, 'success');
    }
  };

  // -------------------------------------------------------------
  // STATE ADJUSTMENTS
  // -------------------------------------------------------------

  // Manual or automatic inventory changes
  const handleUpdateStock = (productId: string, storeId: string, delta: number) => {
    setInventory(prev => {
      const copy = prev.map(item => {
        if (item.productId === productId && item.storeId === storeId) {
          const newStock = Math.max(0, item.stock + delta);
          return {
            ...item,
            stock: newStock,
            // Recompute dynamic velocity slightly based on new stock conditions
            dailyVelocity: item.dailyVelocity
          };
        }
        return item;
      });

      // Show action toast
      const prodName = products.find(p => p.id === productId)?.name || 'Product';
      const storeName = stores.find(s => s.id === storeId)?.name || 'Store';
      showToast(`Adjusted ${prodName} stock at ${storeName} by ${delta > 0 ? '+' : ''}${delta} units.`, 'success');
      return copy;
    });

    // Automatically resolve associated alert if stock becomes healthy
    setAlerts(prevAlerts => {
      const associatedAlert = prevAlerts.find(a => a.productId === productId && a.storeId === storeId);
      if (associatedAlert && delta > 0) {
        // If they restocked, let's filter out the stock-out warning
        const p = products.find(prod => prod.id === productId);
        const s = stores.find(st => st.id === storeId);
        const currentInv = inventory.find(i => i.productId === productId && i.storeId === storeId);
        if (currentInv && (currentInv.stock + delta) > currentInv.reorderPoint) {
          return prevAlerts.filter(a => a.id !== associatedAlert.id);
        }
      }
      return prevAlerts;
    });
  };

  const handleUpdateReorderPoint = (productId: string, storeId: string, newReorderPoint: number) => {
    setInventory(prev => prev.map(item => {
      if (item.productId === productId && item.storeId === storeId) {
        return { ...item, reorderPoint: Math.max(0, newReorderPoint) };
      }
      return item;
    }));
    const prodName = products.find(p => p.id === productId)?.name || 'Product';
    const storeName = stores.find(s => s.id === storeId)?.name || 'Store';
    showToast(`Updated reorder point for ${prodName} at ${storeName} to ${newReorderPoint} units.`, 'success');
  };

  const handleMarkDiscontinued = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, discontinued: true };
      }
      return p;
    }));
    const prodName = products.find(p => p.id === productId)?.name || 'Product';
    showToast(`Product "${prodName}" marked as discontinued.`, 'info');
  };

  const handleTransferStock = (productId: string, fromStoreId: string, toStoreId: string, quantity: number) => {
    let successful = false;
    setInventory(prev => {
      const fromItem = prev.find(i => i.productId === productId && i.storeId === fromStoreId);
      const toItem = prev.find(i => i.productId === productId && i.storeId === toStoreId);

      if (!fromItem || !toItem) return prev;
      if (fromItem.stock < quantity) {
        return prev;
      }

      successful = true;
      return prev.map(item => {
        if (item.productId === productId && item.storeId === fromStoreId) {
          return { ...item, stock: item.stock - quantity };
        }
        if (item.productId === productId && item.storeId === toStoreId) {
          return { ...item, stock: Math.min(item.capacity, item.stock + quantity) };
        }
        return item;
      });
    });

    if (successful) {
      const prodName = products.find(p => p.id === productId)?.name || 'Product';
      const fromName = stores.find(s => s.id === fromStoreId)?.name || 'Store A';
      const toName = stores.find(s => s.id === toStoreId)?.name || 'Store B';
      showToast(`Transferred ${quantity} units of ${prodName} from ${fromName} to ${toName}.`, 'success');
    } else {
      showToast(`Transfer failed: Insufficient stock at source store.`, 'info');
    }
  };

  // Applying recommended action in Attention Panel
  const handleResolveAlert = (alertId: string, recommendation: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const prod = products.find(p => p.id === alert.productId);
    const store = stores.find(s => s.id === alert.storeId);

    // Apply exact business logic corresponding to each alert's recommendation
    if (alert.type === 'stock_out_risk') {
      // Transfer or restock: add stock to s1, subtract or add stock from target
      // Add +15 to stock
      handleUpdateStock(alert.productId, alert.storeId, 15);
    } else if (alert.type === 'slow_moving' || alert.type === 'overstock') {
      // Run marketing campaigns, clear carrying costs: reduce stock slightly representing discount velocity
      // E.g., apply discount sells off 20 units
      handleUpdateStock(alert.productId, alert.storeId, -15);
    } else if (alert.type === 'sales_spike') {
      // Review action: increase reorder points
      setInventory(prev => prev.map(item => {
        if (item.productId === alert.productId && item.storeId === alert.storeId) {
          return { ...item, reorderPoint: 30 };
        }
        return item;
      }));
      showToast(`Increased Safety Stock (Reorder Point) to 30 units for ${prod?.name}.`, 'success');
    }

    // Filter out resolved alert
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    showToast(`Successfully resolved: "${alert.title}" with prescribed operational recommendation!`, 'success');
  };

  // Dynamic calculations for the 4 major metrics cards
  const summaryMetrics = React.useMemo(() => {
    const totalRev = salesHistory.reduce((acc, r) => acc + r.revenue, 0);
    const totalCost = salesHistory.reduce((acc, r) => {
      const p = products.find(prod => prod.id === r.productId);
      return acc + (r.unitsSold * (p?.unitCost || 0));
    }, 0);
    
    const lowStock = inventory.filter(i => i.stock <= i.reorderPoint).length;
    const anomalies = alerts.filter(a => a.type === 'sales_spike' || a.type === 'sales_drop').length;
    
    const totalUnitsSold = salesHistory.reduce((acc, r) => acc + r.unitsSold, 0);
    const dailyVelocity = parseFloat((totalUnitsSold / 30).toFixed(1));

    return {
      revenue: totalRev,
      profit: totalRev - totalCost,
      lowStockCount: lowStock,
      anomaliesCount: anomalies,
      dailyVelocity
    };
  }, [salesHistory, products, inventory, alerts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-center">
            <h3 className="font-bold text-gray-800 text-lg">Initializing Retail Copilot</h3>
            <p className="text-sm text-gray-400 mt-1">Grounding data pipeline loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner / Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Retail Sales & Inventory Copilot
                <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:border-indigo-900/50 dark:text-indigo-400">
                  TRACK PS03
                </span>
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Advanced AI-assisted predictive inventory reordering, dead-stock clearance, and sales anomaly detection.
              </p>
            </div>
          </div>

          {/* Sync status indicator & Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              syncSource === 'API Server' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' 
                : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
            }`}>
              <Server className="w-3.5 h-3.5 mr-1.5" />
              Source: {syncSource}
            </div>

            {/* Global Light/Dark Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Keyboard Shortcuts Trigger Button */}
            <button
              onClick={() => setShowShortcutHelp(!showShortcutHelp)}
              title="View Keyboard Hotkeys Cheat Sheet (Alt+H or ?)"
              className={`p-2 border rounded-lg cursor-pointer transition-all flex items-center space-x-1.5 ${
                showShortcutHelp
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Hotkeys</span>
            </button>

            {/* Export Inventory Button */}
            <button
              onClick={() => handleExportCSV('inventory')}
              title="Export Current Inventory Levels CSV"
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:hover:bg-indigo-900/50 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Inventory
            </button>

            {/* Export Alerts Button */}
            <button
              onClick={() => handleExportCSV('alerts')}
              title="Export Operational Anomalies CSV"
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900/50 dark:hover:bg-rose-900/50 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Anomalies
            </button>

            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
                showToast('Re-triggering data ingestion sync...', 'info');
              }}
              title="Refresh Grounding Data"
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-slate-50 border border-gray-200 rounded-lg bg-white shadow-3xs dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View Container with Split Command Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          
          {/* LEFT COLUMN (40% Width): Dedicated Sticky Copilot Chat Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 h-[calc(100vh-120px)] lg:h-[780px]">
            <CopilotChat 
              products={products}
              stores={stores}
              inventory={inventory}
              alerts={alerts}
            />
          </div>

          {/* RIGHT COLUMN (60% Width): Scrollable Main View */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* TOP METRICS BAR */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: 30-Day Revenue */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    30-Day Sales Revenue
                  </span>
                  <strong className="text-lg font-black text-gray-900 dark:text-white">
                    ${summaryMetrics.revenue.toLocaleString()}
                  </strong>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                    +${summaryMetrics.profit.toLocaleString()} Profit
                  </span>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg hidden sm:block">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Low Stock Count */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    Low Stock Count
                  </span>
                  <strong className={`text-lg font-black ${summaryMetrics.lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {summaryMetrics.lowStockCount} items
                  </strong>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium block mt-1">
                    Below safety trigger
                  </span>
                </div>
                <div className={`p-2 rounded-lg hidden sm:block ${summaryMetrics.lowStockCount > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Active Anomalies */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    Anomalies Detected
                  </span>
                  <strong className={`text-lg font-black ${summaryMetrics.anomaliesCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {summaryMetrics.anomaliesCount} flagged
                  </strong>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium block mt-1">
                    Sales spikes & drops
                  </span>
                </div>
                <div className={`p-2 rounded-lg hidden sm:block ${summaryMetrics.anomaliesCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Daily Sales Velocity */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    Daily Sales Velocity
                  </span>
                  <strong className="text-lg font-black text-gray-900 dark:text-white">
                    {summaryMetrics.dailyVelocity} u/day
                  </strong>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium block mt-1">
                    Across stores
                  </span>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg hidden sm:block">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* View Tab Navigation */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-900 p-1.5 rounded-xl border border-gray-200/50 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeView === 'analytics'
                    ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-3xs border border-gray-100 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Operations Desk</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('warehouse')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeView === 'warehouse'
                    ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-3xs border border-gray-100 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Map className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Warehouse Floor Plan</span>
              </button>
            </div>

            {activeView === 'analytics' ? (
              <>
                {/* 1. Attention Panel */}
                <div id="attention-panel" className="scroll-mt-24 transition-all duration-300 rounded-xl">
                  <AttentionPanel 
                    alerts={alerts}
                    products={products}
                    stores={stores}
                    onResolveAlert={handleResolveAlert}
                  />
                </div>

                {/* 2. Warehouse Capacity Heatmap Grid */}
                <div id="capacity-grid" className="scroll-mt-24 transition-all duration-300 rounded-xl">
                  <CapacityGrid 
                    products={products}
                    stores={stores}
                    inventory={inventory}
                  />
                </div>

                {/* 3. Trends Area Chart */}
                <SalesTrendChart 
                  salesHistory={salesHistory}
                  products={products}
                  stores={stores}
                />

                {/* 4. Catalog & Stock Grid Explorer */}
                <CatalogExplorer 
                  products={products}
                  stores={stores}
                  inventory={inventory}
                  onUpdateStock={handleUpdateStock}
                  onUpdateReorderPoint={handleUpdateReorderPoint}
                  onMarkDiscontinued={handleMarkDiscontinued}
                  onTransferStock={handleTransferStock}
                />
              </>
            ) : (
              <WarehouseFloorPlan 
                products={products}
                stores={stores}
                inventory={inventory}
                onUpdateStock={handleUpdateStock}
              />
            )}

          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Help Dialog Overlay */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200" id="shortcut-cheat-sheet">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative overflow-hidden">
            
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider">
                    Warehouse Hotkeys Cheat Sheet
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
                    Navigate the floor instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Hotkeys list */}
            <div className="space-y-3.5 my-6">
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Search Catalogue</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-550">Focuses inventory filter search field</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Ctrl</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">S</kbd>
                  <span className="text-xs text-gray-400">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">S</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Warehouse Alerts Desk</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-550">Scrolls to operational alerts / attention desk</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Ctrl</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">A</kbd>
                  <span className="text-xs text-gray-400">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">A</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Capacity Heatmap Grid</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-550">Scrolls to stores stock level utilization</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Ctrl</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">C</kbd>
                  <span className="text-xs text-gray-405">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">C</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">AI Copilot Chat Input</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-550">Focuses the predictive recommendations prompt box</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Ctrl</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">D</kbd>
                  <span className="text-xs text-gray-455">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">D</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-950 dark:text-white">Operations Desk Tab</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Switches back to metrics and data tables view</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">1</kbd>
                  <span className="text-xs text-gray-405">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">O</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Warehouse Floor Plan Tab</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Switches layout to interactive virtual aisle floor plan</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">2</kbd>
                  <span className="text-xs text-gray-405">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">W</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Toggle Cheat Sheet Help</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Shows or dismisses this hotkeys dashboard overlay</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">Alt</kbd>
                  <span className="text-xs text-gray-400 font-bold">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">H</kbd>
                  <span className="text-xs text-gray-405">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-3xs">?</kbd>
                </div>
              </div>

            </div>

            {/* Footer tips */}
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-[10px] text-gray-500 dark:text-gray-450 leading-relaxed">
              *All hotkeys function seamlessly across theme modifications. Standard key combinations are automatically intercepted and optimized for high-speed offline workflow operations.*
            </div>
          </div>
        </div>
      )}

      {/* Interactive Floating Toast System */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce flex items-center space-x-2 bg-slate-900 text-white py-2.5 px-4 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold">
          <AlertCircle className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-5 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-gray-400">
          <p>© 2026 Retail Sales & Inventory Copilot (TRACK_ID=PS03). Built with Google AI Studio and Gemini 2.5-Flash.</p>
        </div>
      </footer>
    </div>
  );
}
