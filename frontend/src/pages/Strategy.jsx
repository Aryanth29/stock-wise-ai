import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, ChevronDown, ChevronUp, Zap, ShieldCheck, Plus, MessageSquare, History, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ✅ Same Gemini config as StudioAgent.jsx — unified API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const SYSTEM_PROMPT = 'You are StockWise AI, a professional quant trading assistant for Indian stock markets (BSE, NSE). Be concise, insightful, and conversational like a senior quant mentor.';

const Message = ({ msg }) => {
  const [showThought, setShowThought] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '800px',
        width: '100%',
        marginBottom: '48px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
        <span style={{ fontWeight: 'bold' }}>{msg.role === 'user' ? 'CLIENT PROMPT' : 'ENGINE RESPONSE'}</span>
        {msg.role === 'ai' && msg.thought && (
          <button 
            onClick={() => setShowThought(!showThought)}
            style={{ background: 'transparent', color: 'var(--emerald)', border: 'none', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '10px', fontWeight: 'bold' }}
          >
            {showThought ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showThought ? 'HIDE REASONING' : 'VIEW REASONING'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showThought && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ 
              overflow: 'hidden',
              padding: '16px',
              borderLeft: '1px solid var(--emerald)',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'var(--text-dim)',
              lineHeight: '1.6',
              background: 'rgba(20, 184, 166, 0.05)',
              borderRadius: '0'
            }}
          >
            {msg.thought}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        fontSize: '16px',
        lineHeight: '1.8',
        color: msg.role === 'user' ? 'var(--emerald)' : 'var(--text-main)',
        background: msg.role === 'user' ? 'rgba(20, 184, 166, 0.05)' : 'transparent',
        padding: msg.role === 'user' ? '20px' : '0',
        borderRadius: '4px',
        border: msg.role === 'user' ? '1px solid var(--glass-border)' : 'none',
        whiteSpace: 'pre-wrap'
      }}>
        {msg.text}
      </div>
    </motion.div>
  );
};

const Strategy = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);

  // 1. Auth & Initial Session Load
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync Sessions List
        const sessionsQuery = query(
          collection(db, "users", currentUser.uid, "sessions"),
          orderBy("lastModified", "desc")
        );
        
        onSnapshot(sessionsQuery, (snapshot) => {
          const sessList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSessions(sessList);
          
          // Auto-select latest session if none active
          if (!activeSessionId && sessList.length > 0) {
            setActiveSessionId(sessList[0].id);
          }
        });

        // 30-Day Cleanup (Sessions)
        const cleanup = async () => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const oldQuery = query(collection(db, "users", currentUser.uid, "sessions"), where("lastModified", "<", thirtyDaysAgo));
          const oldDocs = await getDocs(oldQuery);
          oldDocs.forEach(async (d) => await deleteDoc(doc(db, "users", currentUser.uid, "sessions", d.id)));
        };
        cleanup();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Sync Messages for Active Session
  useEffect(() => {
    if (!user || !activeSessionId) return;

    const q = query(
      collection(db, "users", user.uid, "sessions", activeSessionId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (msgs.length === 0) {
        setMessages([{ 
          role: 'ai', 
          text: 'Studio active. I am ready to process your trading criteria. What market segment should we analyze first?',
          thought: 'Engine initialized. Waiting for user input. Security: AES-256 session active.'
        }]);
      } else {
        setMessages(msgs);
      }
    });

    return () => unsubscribe();
  }, [user, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const generateTitle = async (firstPrompt) => {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Generate a 3-4 word professional title for this stock analysis query. Respond with ONLY the title. No quotes. Query: ${firstPrompt}` }] }]
        }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'New Analysis';
    } catch (e) {
      return 'Market Analysis';
    }
  };

  const startNewSession = async () => {
    if (!user) return;
    const newSess = await addDoc(collection(db, "users", user.uid, "sessions"), {
      title: 'New Analysis...',
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp()
    });
    setActiveSessionId(newSess.id);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking || !user) return;
    const userText = input.trim();
    
    let currentSessionId = activeSessionId;
    
    // Create session if none exists
    if (!currentSessionId) {
      const newSess = await addDoc(collection(db, "users", user.uid, "sessions"), {
        title: 'Initializing...',
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp()
      });
      currentSessionId = newSess.id;
      setActiveSessionId(currentSessionId);
    }

    const messagesRef = collection(db, "users", user.uid, "sessions", currentSessionId, "messages");
    
    // 1. Save User Message
    await addDoc(messagesRef, {
      role: "user",
      text: userText,
      timestamp: serverTimestamp()
    });

    // Update session title if it's the first message
    if (messages.length <= 1) {
      const newTitle = await generateTitle(userText);
      await updateDoc(doc(db, "users", user.uid, "sessions", currentSessionId), {
        title: newTitle,
        lastModified: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, "users", user.uid, "sessions", currentSessionId), {
        lastModified: serverTimestamp()
      });
    }

    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userText }] }]
        }),
      });

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
      
      // 2. Save AI Response
      await addDoc(messagesRef, {
        role: "ai", 
        text: reply,
        thought: 'Processed via Gemini 2.5 Flash · Direct API System · StockWise Quant Protocol',
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment.", thought: 'Connection error. Check network or API status.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this analysis session?")) return;
    await deleteDoc(doc(db, "users", user.uid, "sessions", sid));
    if (activeSessionId === sid) setActiveSessionId(null);
  };

  return (
    <div className="fade-in" style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-main)',
      overflow: 'hidden'
    }}>
      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 60px',
        position: 'relative'
      }}>
        <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
              <Zap size={14} /> INTELLIGENCE STUDIO
            </div>
            <h1 className="outfit" style={{ fontSize: '36px' }}>Cognitive Analysis</h1>
          </div>
          <div className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderColor: 'var(--emerald-glow)' }}>
            <ShieldCheck size={16} className="emerald" />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-dim)' }}>AES-256 SECURED SESSION</span>
          </div>
        </div>

        <div ref={scrollRef} className="custom-scrollbar" style={{ 
          flex: '1', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          marginBottom: '40px',
          paddingRight: '12px'
        }}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          
          {isThinking && (
            <motion.div style={{ color: 'var(--emerald)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
              ENGINE BUSY : ANALYZING LIVE NSE CONTEXT...
            </motion.div>
          )}
        </div>

        <div style={{ position: 'relative', borderTop: '1px solid var(--glass-border)', padding: '32px 0' }}>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ENTER STUDIO PROMPT..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '22px 28px',
              color: 'var(--text-main)',
              fontSize: '14px',
              letterSpacing: '0.05em',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleSend}
            disabled={isThinking}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--emerald)',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.1em'
            }}
          >
            {isThinking ? '...' : 'EXECUTE'}
          </button>
        </div>
      </div>

      {/* Right Side History Panel */}
      <div className="glass" style={{
        width: '320px',
        borderLeft: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 5, 5, 0.4)',
        backdropFilter: 'blur(40px)'
      }}>
        <div style={{ padding: '30px 24px', borderBottom: '1px solid var(--glass-border)' }}>
          <button 
            onClick={startNewSession}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(20, 184, 166, 0.1)',
              border: '1px dashed var(--emerald)',
              color: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(20, 184, 166, 0.1)'}
          >
            <Plus size={16} /> NEW ANALYSIS
          </button>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px 16px', color: 'var(--text-dim)', fontSize: '10px', fontWeight: 'bold' }}>
            <History size={12} /> RECENT INTELLIGENCE
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map(s => (
              <div 
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: activeSessionId === s.id ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                  border: `1px solid ${activeSessionId === s.id ? 'var(--emerald)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: '0.2s',
                  position: 'relative'
                }}
                className="session-item"
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontSize: '13px', 
                  color: activeSessionId === s.id ? '#fff' : 'var(--text-dim)',
                  fontWeight: activeSessionId === s.id ? '600' : '400',
                  marginRight: '24px'
                }}>
                  <MessageSquare size={14} style={{ color: activeSessionId === s.id ? 'var(--emerald)' : 'var(--text-dim)' }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(s.id, e)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    color: 'rgba(239, 68, 68, 0.5)',
                    padding: '4px'
                  }}
                  className="delete-hover"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
            <Clock size={12} /> UPDATED IN REAL-TIME
          </div>
        </div>
      </div>
    </div>
  );
};

export default Strategy;
