import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Boxes 
} from 'lucide-react';
import { OperationalAlert, Product, Store } from '../shared/storeData';

interface AttentionPanelProps {
  alerts: OperationalAlert[];
  products: Product[];
  stores: Store[];
  onResolveAlert: (alertId: string, updatedRecommendation: string) => void;
}

export default function AttentionPanel({ 
  alerts, 
  products, 
  stores, 
  onResolveAlert 
}: AttentionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock_out_risk':
        return <AlertTriangle className="text-rose-500 dark:text-rose-400 w-5 h-5" />;
      case 'slow_moving':
        return <TrendingDown className="text-amber-500 dark:text-amber-400 w-5 h-5" />;
      case 'overstock':
        return <Boxes className="text-purple-500 dark:text-purple-400 w-5 h-5" />;
      case 'sales_spike':
        return <TrendingUp className="text-emerald-500 dark:text-emerald-400 w-5 h-5" />;
      case 'sales_drop':
        return <TrendingDown className="text-rose-500 dark:text-rose-400 w-5 h-5" />;
      default:
        return <AlertTriangle className="text-gray-500 w-5 h-5" />;
    }
  };

  const getAlertTheme = (type: string) => {
    switch (type) {
      case 'stock_out_risk':
        return {
          bg: 'bg-rose-50/70 dark:bg-rose-950/10 hover:bg-rose-100/50 dark:hover:bg-rose-950/20',
          border: 'border-rose-200 dark:border-rose-900/40',
          text: 'text-rose-800 dark:text-rose-300',
          badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
        };
      case 'slow_moving':
        return {
          bg: 'bg-amber-50/70 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-900/40',
          text: 'text-amber-800 dark:text-amber-300',
          badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50'
        };
      case 'overstock':
        return {
          bg: 'bg-purple-50/70 dark:bg-purple-950/10 hover:bg-purple-100/50 dark:hover:bg-purple-950/20',
          border: 'border-purple-200 dark:border-purple-900/40',
          text: 'text-purple-800 dark:text-purple-300',
          badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50'
        };
      case 'sales_spike':
        return {
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-900/40',
          text: 'text-emerald-800 dark:text-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50'
        };
      case 'sales_drop':
        return {
          bg: 'bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/40 dark:hover:bg-rose-950/20',
          border: 'border-rose-150 dark:border-rose-900/30',
          text: 'text-rose-900 dark:text-rose-300',
          badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-slate-800',
          border: 'border-gray-200 dark:border-slate-700',
          text: 'text-gray-800 dark:text-gray-200',
          badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
        };
    }
  };

  const handleApplyAction = (alert: OperationalAlert) => {
    setProcessingId(alert.id);
    // Simulate API / action resolution delay
    setTimeout(() => {
      onResolveAlert(alert.id, alert.recommendation);
      setProcessingId(null);
      if (expandedId === alert.id) {
        setExpandedId(null);
      }
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6" id="attention-panel">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">What Needs Attention Today</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time critical stock anomalies and operational reorder alerts.
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-xs font-semibold">
          {alerts.length} Tasks Pending
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-gray-200 dark:border-slate-800">
          <CheckCircle className="text-emerald-500 w-10 h-10 mb-2" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">All operations running smoothly!</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 text-center">No alerts or inventory stockouts flagged for today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {alerts.map((alert) => {
              const theme = getAlertTheme(alert.type);
              const p = products.find(prod => prod.id === alert.productId);
              const s = stores.find(st => st.id === alert.storeId);
              const isExpanded = expandedId === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${theme.border} ${isExpanded ? 'shadow-md ring-1 ring-black/5 dark:ring-white/5' : 'hover:shadow-sm'}`}
                >
                  {/* Alert Header Row */}
                  <div 
                    onClick={() => toggleExpand(alert.id)}
                    className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${theme.bg}`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-gray-100 dark:border-slate-750 flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {s?.name || 'All Locations'}
                          </span>
                          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
                            {alert.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-4">
                          {alert.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">Metric</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{alert.metric}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-gray-400 dark:text-gray-500 w-5 h-5" />
                      ) : (
                        <ChevronDown className="text-gray-400 dark:text-gray-500 w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <div className="p-5 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {alert.description}
                        </p>

                        {/* Calculation & Formula Box */}
                        <div className="bg-gray-50 dark:bg-slate-950 rounded-lg p-4 border border-gray-150 dark:border-slate-800 text-xs">
                          <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                            Diagnostic Mathematical Calculation
                          </h4>
                          <code className="block bg-gray-100 dark:bg-slate-900 p-2.5 rounded text-gray-800 dark:text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-slate-800">
                            {alert.calculation}
                          </code>
                          {alert.carryingCost !== undefined && (
                            <div className="mt-2.5 flex items-center text-rose-700 dark:text-rose-400 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              <span>Monthly Capital Carrying Loss (5% rate): ${alert.carryingCost.toFixed(2)}/mo</span>
                            </div>
                          )}
                        </div>

                        {/* Recommendation and Actions */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                          <h4 className="font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2" />
                            Prescribed AI Recommendation
                          </h4>
                          <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                            {alert.recommendation}
                          </p>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyAction(alert);
                            }}
                            disabled={processingId === alert.id}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
                          >
                            {processingId === alert.id ? (
                              <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Executing Action...</span>
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                {alert.actionLabel}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
