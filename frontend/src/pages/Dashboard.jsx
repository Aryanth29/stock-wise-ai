import React, { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Search, Send, Loader2, PlayCircle, ShoppingCart, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const GEMINI_API_KEY = 'AIzaSyDAyFIVqvmkq9weR5BhqcyITbGH87JAi0M';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const SYSTEM_PROMPT = 'You are StockWise AI, a professional quant trading assistant for Indian stock markets (BSE, NSE). Be concise, insightful, and conversational like a senior quant mentor.';

const data = [
  { name: '10:00', price: 4200 }, { name: '11:00', price: 4500 },
  { name: '12:00', price: 4100 }, { name: '13:00', price: 4800 },
  { name: '14:00', price: 4400 }, { name: '15:00', price: 5100 },
  { name: '16:00', price: 4300 },
];

const miniData = [
  { p: 10 }, { p: 25 }, { p: 15 }, { p: 40 }, { p: 20 }, { p: 35 }, { p: 30 }
];

const StatCard = ({ title, value, change, isPositive, label, isSim }) => (
  <div className="glass" style={{ 
    padding: '32px', 
    flex: '1', 
    minWidth: '280px', 
    background: 'var(--accent-surface)',
    borderColor: 'var(--accent-border)',
    transition: 'var(--transition)'
  }}>
    <div className="card-title">{title}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
      <div className="outfit" style={{ fontSize: '28px', color: 'var(--text-main)' }}>{value}</div>
      <div style={{ color: isPositive ? 'var(--emerald)' : '#EF4444', fontSize: '13px', fontWeight: 'bold' }}>
        {isPositive ? <ArrowUpRight size={14} style={{ display: 'inline' }} /> : <ArrowDownRight size={14} style={{ display: 'inline' }} />} {Math.abs(change)}%
      </div>
    </div>
    <div className="subtle-label">{label}</div>
  </div>
);

const Dashboard = ({ isSimulationMode, setIsSimulationMode }) => {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!prompt.trim() || isThinking) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT + '\n\n' + userMessage }]
          }]
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Error: ${error.message}`,
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const [searchResult, setSearchResult] = useState(null);
  
  // Execution Logic (Firestore Sync)
  const [simBalance, setSimBalance] = useState(100000);
  const [simHoldings, setSimHoldings] = useState(0);
  const [orderQty, setOrderQty] = useState(1);

  // Sync with Firestore
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        
        // Listen for real-time updates
        const unsubDoc = onSnapshot(userDoc, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.balance !== undefined) setSimBalance(data.balance);
            if (data.holdings !== undefined) setSimHoldings(data.holdings);
          } else {
            // Seed initial profile
            setDoc(userDoc, { balance: 100000, holdings: 0 }, { merge: true });
          }
        });
        return () => unsubDoc();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      setIsSearching(true);
      try {
        const response = await fetch(`http://localhost:5000/api/stocks/${search.toUpperCase()}`);
        const data = await response.json();
        setSearchResult(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const executeTrade = async (type) => {
     const price = searchResult?.regularMarketPrice || 1000;
     const totalCost = price * orderQty;
     const user = auth.currentUser;

     if (!user) return;
     const userDoc = doc(db, 'users', user.uid);

     if (type === 'BUY') {
        if (simBalance >= totalCost) {
          const newBalance = simBalance - totalCost;
          const newHoldings = simHoldings + orderQty;
          await updateDoc(userDoc, { balance: newBalance, holdings: newHoldings });
        }
     } else {
        if (simHoldings >= orderQty) {
          const newBalance = simBalance + totalCost;
          const newHoldings = simHoldings - orderQty;
          await updateDoc(userDoc, { balance: newBalance, holdings: newHoldings });
        }
     }
  };

  return (
    <div className="dashboard-container fade-in">
      {/* Main Analysis Column */}
      <div className="main-content-stream">
        
        {/* Header Module */}
        <div className="header-module">
          <div>
            <h1 className="outfit header-title">
              {isSimulationMode ? 'Simulation Studio' : 'Analysis Studio'}
            </h1>
            <p className="header-subtitle">
              {isSimulationMode ? 'Practice Mode Active · No Real Capital at Risk' : 'Live Quant Analysis · Real-time Institutional Data'}
            </p>
          </div>
          <button 
            onClick={() => setIsSimulationMode(!isSimulationMode)}
            className="glass sim-toggle-btn"
          >
            <PlayCircle size={14} /> {isSimulationMode ? 'EXIT SIMULATION' : 'ENTER SIMULATION'}
          </button>
        </div>

        {/* Live Detection Bar */}
        <div className="glass search-bar-wrapper" style={{
           background: 'var(--accent-surface)',
           borderColor: 'var(--accent-border)'
        }}>
          {isSearching ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--emerald)' }} /> : <Search size={18} style={{ color: 'var(--emerald)' }} />}
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={isSimulationMode ? "PRACTICE SCAN..." : "SCAN LIVE STOCK..."}
            className="search-input-field"
          />
          <div className="subtle-label" style={{ opacity: 0.4 }}>{isSimulationMode ? 'PRACTICE' : 'READY'}</div>
        </div>

        <AnimatePresence>
          {searchResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass"
              style={{ 
                padding: '24px', 
                background: 'var(--accent-surface)', 
                borderColor: 'var(--emerald)', 
                boxShadow: '0 0 40px var(--emerald-glow)'
              }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                 <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                   <div className="outfit" style={{ fontSize: '24px', fontWeight: 'bold' }}>{searchResult.symbol}</div>
                   <div style={{ height: '20px', width: '1px', background: 'var(--glass-border)' }}></div>
                   <div className="outfit" style={{ fontSize: '24px', color: 'var(--emerald)' }}>₹{searchResult.regularMarketPrice?.toFixed(2) || '---'}</div>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', gap: '10px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>QTY</span>
                        <input 
                          type="number" 
                          value={orderQty} 
                          onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: '40px', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', textAlign: 'center' }}
                        />
                    </div>
                    <button onClick={() => executeTrade('BUY')} className="btn-primary" style={{ padding: '10px 24px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                       <ShoppingCart size={14} /> BUY
                    </button>
                    <button onClick={() => executeTrade('SELL')} className="btn-outline" style={{ padding: '10px 24px', fontSize: '11px' }}>
                       SELL
                    </button>
                    <button onClick={() => setSearchResult(null)} style={{ color: 'var(--text-dim)', fontSize: '10px', paddingLeft: '12px' }}>DISMISS</button>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio Overview */}
        <div className="stats-grid">
          <StatCard 
            title={isSimulationMode ? "Virtual Balance" : "Total Earnings"} 
            value={isSimulationMode ? `₹${simBalance.toLocaleString()}` : "₹12.45M"} 
            change={isSimulationMode ? "0.0" : "2.4"} 
            isPositive={true} 
            label={isSimulationMode ? "PRACTICE CAPITAL" : "LIFETIME AGGREGATE"} 
            isSim={isSimulationMode}
          />
          <StatCard 
            title={isSimulationMode ? "Portfolio Shares" : "Day Unrealized"} 
            value={isSimulationMode ? `${simHoldings}` : "₹42,800"} 
            change="0.0" 
            isPositive={true} 
            label={isSimulationMode ? "QUANTITY HELD" : "REAL-TIME P&L"} 
            isSim={isSimulationMode}
          />
          <StatCard 
            title="AI Precision" 
            value="94.2%" 
            change="0.5" 
            isPositive={true} 
            label="SIGNAL ACCURACY" 
            isSim={isSimulationMode}
          />
        </div>

        {/* Studio Favorites Radar */}
        <div className="favorites-radar-stream" style={{ 
          display: 'flex', 
          gap: '20px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          width: '100%'
        }}>
          {[
            { symbol: 'RELIANCE', price: '2,942', change: '+1.2', isPositive: true },
            { symbol: 'TCS', price: '3,845', change: '-0.4', isPositive: false },
            { symbol: 'HDFCBANK', price: '1,452', change: '+0.8', isPositive: true }
          ].map((fav, i) => (
            <div key={fav.symbol} className="glass" style={{ 
              padding: '20px', 
              minWidth: '220px', 
              flex: '1',
              background: 'var(--accent-surface)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className="outfit" style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em' }}>{fav.symbol}</span>
                <span style={{ 
                  fontSize: '11px', 
                  color: fav.isPositive ? 'var(--emerald)' : '#EF4444', 
                  fontWeight: '900' 
                }}>{fav.change}%</span>
              </div>
              <div className="outfit" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>₹{fav.price}</div>
              <div style={{ height: '40px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniData}>
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                    <Area 
                      type="monotone" 
                      dataKey="p" 
                      stroke={fav.isPositive ? 'var(--emerald)' : '#EF4444'} 
                      fillOpacity={0.1} 
                      fill={fav.isPositive ? 'var(--emerald)' : '#EF4444'} 
                      strokeWidth={2} 
                      isAnimationActive={false} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="glass chart-card" style={{ minHeight: '440px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <TrendingUp size={22} style={{ color: 'var(--emerald)' }} />
              <h2 className="outfit" style={{ fontSize: '22px' }}>Studio Benchmarks</h2>
          </div>
          
          <div style={{ width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} axisLine={false} tickLine={false} tick={{ dy: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: '#fff' }}
                  itemStyle={{ color: 'var(--emerald)' }}
                />
                <Area type="monotone" dataKey="price" stroke="var(--emerald)" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column: AI Agent & Stats */}
      <div className="sidebar-content-stream">
        
        {/* Practice Mode Info */}
        <AnimatePresence>
          {isSimulationMode && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glass" 
              style={{ padding: '24px', background: 'rgba(59, 47, 92, 0.4)', borderColor: '#9D75FF' }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <Info size={16} />
                <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em' }}>TUTORIAL MODE ACTIVE</div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                Use your ₹1,00,000 virtual balance to simulate orders. Search for a stock above to enable the Execution Studio.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio Agent Overlay */}
        <div className="glass agent-panel" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
            <Zap size={20} style={{ color: 'var(--emerald)' }} strokeWidth={3} />
            <h3 className="outfit" style={{ fontSize: '18px' }}>Studio Agent</h3>
          </div>

          {/* Chat History */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            paddingRight: '8px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }} className="custom-scrollbar">
            {messages.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7', opacity: 0.7 }}>
                {isSimulationMode ? "Tutorial Engine ready. I will guide you through your first simulated trade. Search for a stock to execute." : "Awaiting specific instruction. I am monitoring resistance levels at 22,500."}
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%'
                }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    background: msg.role === 'user' ? 'var(--emerald)' : 'rgba(255,255,255,0.05)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  }}>
                    {msg.content}
                  </div>
                  
                  {msg.thought && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ 
                        fontSize: '9px', 
                        color: 'var(--emerald)', 
                        cursor: 'pointer', 
                        fontWeight: '800', 
                        letterSpacing: '0.1em',
                        listStyle: 'none'
                      }}>
                        VIEW ANALYSIS PROCESS
                      </summary>
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '10px', 
                        fontSize: '11px', 
                        color: 'var(--text-dim)', 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '6px',
                        borderLeft: '2px solid var(--emerald)',
                        lineHeight: '1.6'
                      }}>
                        {msg.thought}
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}
            {isThinking && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
                <span className="dot-typing"></span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="ASK QUANT QUESTIONS..."
              className="agent-input"
              disabled={isThinking}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isThinking}
              style={{ 
                position: 'absolute', 
                right: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'transparent', 
                color: isThinking ? 'var(--text-dim)' : 'var(--emerald)',
                transition: '0.2s'
              }}
            >
              {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Signals Panel */}
        <div className="glass signals-panel">
          <h4 className="card-title">Institutional Intelligence</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
             {[
               { s: 'RELIANCE', t: 'BUY', c: '94%' },
               { s: 'HDFCBANK', t: 'SELL', c: '81%' },
               { s: 'INFY', t: 'HOLD', c: '60%' }
             ].map((sig, i) => (
               <div key={sig.s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                 <span style={{ fontWeight: '700', letterSpacing: '0.05em' }}>{sig.s}</span>
                 <span style={{ color: sig.t === 'BUY' ? 'var(--emerald)' : sig.t === 'SELL' ? '#EF4444' : 'var(--text-dim)', fontWeight: 'bold' }}>
                   {sig.t} · {sig.c}
                 </span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 40px;
          display: flex;
          flex-direction: row;
          gap: 32px;
          transition: var(--transition);
        }

        .main-content-stream { 
          flex: 1;
          display: flex; 
          flex-direction: column; 
          gap: 32px; 
          min-width: 0; /* Prevents flex overflow */
        }

        .sidebar-content-stream { 
          width: 320px;
          display: flex; 
          flex-direction: column; 
          gap: 32px;
          min-width: 320px;
        }

        .header-module {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .header-title { font-size: 28px; margin-bottom: 8px; letter-spacing: -0.03em; }
        .header-subtitle { color: var(--text-dim); font-size: 13px; }

        .sim-toggle-btn {
          padding: 10px 20px; 
          font-size: 10px; 
          font-weight: 800; 
          letter-spacing: 0.15em;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-main);
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 30px;
          transition: var(--transition);
        }

        .sim-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .simulation-mode .sim-toggle-btn {
          border-color: #A855F7;
          color: #A855F7;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
        }

        .search-bar-wrapper {
          width: 100%;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-radius: 16px;
        }

        .search-input-field {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 14px;
          outline: none;
          letter-spacing: 0.05em;
        }

        .stats-grid {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          width: 100%;
        }

        .chart-card {
          padding: 32px;
          width: 100%;
          min-height: 400px;
        }

        .agent-panel {
          padding: 24px;
          background: rgba(10, 15, 18, 0.4);
        }

        .agent-input {
          width: 100%;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 12px 42px 12px 16px;
          color: var(--text-main);
          font-size: 12px;
          outline: none;
        }

        .signals-panel {
          padding: 24px;
        }

        @media (max-width: 1200px) {
          .dashboard-container {
            flex-direction: column;
            padding: 32px 24px;
          }
          .sidebar-content-stream {
            width: 100%;
            min-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .header-title { font-size: 22px; }
          .dashboard-container {
            padding: 24px 16px;
          }
          .stats-grid { gap: 12px; }
          .header-module { flex-direction: column; align-items: flex-start; gap: 16px; }
          .sim-toggle-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
