import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Database, 
  User, 
  X, 
  ChevronRight, 
  ChevronDown,
  AlertCircle, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { Product, Store, InventoryItem, OperationalAlert } from '../shared/storeData';

interface CopilotChatProps {
  products: Product[];
  stores: Store[];
  inventory: InventoryItem[];
  alerts: OperationalAlert[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CopilotChat({
  products,
  stores,
  inventory,
  alerts,
}: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **Retail Sales and Inventory Copilot**. I have parsed your live inventory sheets across all 3 stores. Ask me about:\n\n* **Stock Runway / Run-out times**: \"What is running out at Downtown Plaza?\"\n* **Slow-Moving inventory & carrying costs**: \"How much is dead stock costing us?\"\n* **Price discounts & store transfer solutions**: \"Should I discount All-Weather Boots?\"\n\n*Every recommendation I provide is fully grounded in exact numbers and show mathematical calculations.* How can I help you today?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGroundingJson, setShowGroundingJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts
  const suggestions = [
    "What is running out at Downtown Plaza?",
    "Calculate carrying cost for overstocked blankets.",
    "Which products have slow-moving stock?",
    "Explain the math behind AeroSound runout risk."
  ];

  // Grounding database preview (what is sent to the LLM)
  const groundingDb = {
    summary: {
      total_products: products.length,
      total_stores: stores.length,
      total_active_alerts: alerts.length,
    },
    products: products.map(p => ({ id: p.id, name: p.name, cost: p.unitCost, price: p.unitPrice, discontinued: p.discontinued || false })),
    stores: stores.map(s => ({ id: s.id, name: s.name, location: s.location })),
    inventory_levels: inventory.map(i => ({
      product: products.find(p => p.id === i.productId)?.name,
      store: stores.find(s => s.id === i.storeId)?.name,
      stock: i.stock,
      capacity: i.capacity,
      reorderPoint: i.reorderPoint,
      dailyVelocity: i.dailyVelocity
    })),
    alerts: alerts.map(a => ({
      title: a.title,
      metric: a.metric,
      calculation: a.calculation,
      carryingCost: a.carryingCost
    }))
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      // Direct call to FastAPI backend /api/copilot
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      if (response.ok && data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ **Error triggering Copilot**: ${data.error || 'Server returned an invalid state.'}\n\n*Please ensure you have configured your **GEMINI_API_KEY** in the Secrets panel in AI Studio.*` 
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ **Failed to connect to backend server**. Make sure the Node.js backend server is fully running.\n\nDetails: ${(e as Error).message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyGroundingJson = () => {
    navigator.clipboard.writeText(JSON.stringify(groundingDb, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm" id="copilot-panel">
      {/* Panel Header */}
      <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Sales & Stock AI Copilot</h3>
            <p className="text-[10px] text-indigo-200 font-medium">Grounding Engine: Active</p>
          </div>
        </div>

        {/* Database grounded toggle switch */}
        <button
          onClick={() => setShowGroundingJson(!showGroundingJson)}
          title="Toggle Grounding Data Inspector"
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
            showGroundingJson 
              ? 'bg-white text-indigo-600 border-white shadow-xs' 
              : 'hover:bg-white/10 text-indigo-100 border-white/20'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Grounding Data</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${showGroundingJson ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Container - either Grounding DB or Chat panel */}
      <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
        
        {/* COLLAPSIBLE GROUNDING RAW DATA PREVIEW PANEL */}
        {showGroundingJson && (
          <div className="absolute inset-0 z-20 bg-slate-900/95 dark:bg-black/95 text-slate-300 flex flex-col font-mono text-xs p-4 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" /> LLM Grounding Context (Exact Data Slice)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyGroundingJson}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowGroundingJson(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed select-text text-slate-200">
              {JSON.stringify(groundingDb, null, 2)}
            </pre>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              *Collapsible JSON slice showing real-time inventory and sales levels analyzed by Gemini.
            </p>
          </div>
        )}

        {/* CHAT MESSAGES PANEL */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex space-x-3 max-w-[88%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'}`}
              >
                {/* Avatar icon */}
                <div className={`p-1.5 rounded-lg flex-shrink-0 self-start ${
                  isBot 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`rounded-xl p-3.5 text-xs shadow-xs leading-relaxed border ${
                  isBot 
                    ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border-gray-150 dark:border-slate-800' 
                    : 'bg-indigo-600 text-white border-indigo-700'
                }`}>
                  {/* Basic markdown parsing support for lists, tables, bold, and codes */}
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, lIdx) => {
                      // Check for bullet points
                      if (line.startsWith('* ') || line.startsWith('- ')) {
                        return (
                          <li key={lIdx} className="ml-4 list-disc pl-1 dark:text-slate-300">
                            {formatText(line.substring(2))}
                          </li>
                        );
                      }
                      // Check for table rows (rough layout support)
                      if (line.startsWith('|')) {
                        return (
                          <div key={lIdx} className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950 p-1 rounded overflow-x-auto select-all text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            {line}
                          </div>
                        );
                      }
                      return <p key={lIdx} className="dark:text-slate-300">{formatText(line)}</p>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex space-x-3 mr-auto max-w-[85%]">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0 self-start">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-xs border border-gray-150 dark:border-slate-800 flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-550 font-medium">
                <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing grounding databases...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Prompt Suggestions */}
        {messages.length === 1 && (
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/5 border-t border-indigo-100/60 dark:border-indigo-900/20">
            <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider mb-2 block flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" /> Recommended Copilot Queries
            </span>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="text-left bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 p-2.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 border border-indigo-100/60 dark:border-slate-800 shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <span>{s}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800 flex items-center space-x-2">
          <input
            id="copilot-chat-input"
            type="text"
            placeholder="Ask Copilot about run-out risk math... (Ctrl+D / Alt+D)"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputVal)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-250 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850 dark:text-white transition-all disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(inputVal)}
            disabled={isLoading || !inputVal.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Basic formatter to handle **bold** and `code` tags inline
function formatText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-gray-950 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-gray-100 dark:bg-slate-850 px-1 py-0.5 rounded text-gray-900 dark:text-gray-100 font-mono text-[10px] border border-gray-200 dark:border-slate-750">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
