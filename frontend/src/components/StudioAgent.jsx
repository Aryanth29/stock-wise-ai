import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Sparkles, X } from "lucide-react";
import { db, auth } from "../lib/firebase";
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
  doc 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const SYSTEM_PROMPT = "You are StockWise AI, a professional quant trading assistant for Indian stock markets (BSE, NSE). Be concise, insightful, and conversational like a senior quant mentor.";

export default function StudioAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);

  // Auth & Sync Logic
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync Messages
        const q = query(
          collection(db, "users", currentUser.uid, "messages"),
          orderBy("timestamp", "asc")
        );
        
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // If no messages exists yet, show welcome message (don't save to DB yet)
          if (msgs.length === 0) {
            setMessages([{ role: "ai", text: "Hello! I'm StockWise AI — your quant assistant. Ask me anything about stocks, indicators, or market strategy." }]);
          } else {
            setMessages(msgs);
          }
        });

        // Cleanup: Remove messages older than 30 days
        const cleanupOldMessages = async () => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const oldQuery = query(
            collection(db, "users", currentUser.uid, "messages"),
            where("timestamp", "<", thirtyDaysAgo)
          );
          
          const oldDocs = await getDocs(oldQuery);
          oldDocs.forEach(async (oldDoc) => {
            await deleteDoc(doc(db, "users", currentUser.uid, "messages", oldDoc.id));
          });
        };
        cleanupOldMessages();

        return () => unsubscribeMessages();
      } else {
        setMessages([{ role: "ai", text: "Please log in to access your quant assistant history." }]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !user) return;
    const userText = input.trim();
    
    // 1. Save User Message to Firestore
    const messagesRef = collection(db, "users", user.uid, "messages");
    await addDoc(messagesRef, {
      role: "user",
      text: userText,
      timestamp: serverTimestamp()
    });

    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userText }] }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      
      // 2. Save AI Response to Firestore
      await addDoc(messagesRef, {
        role: "ai",
        text: reply,
        timestamp: serverTimestamp()
      });

    } catch (err) {
      console.error("Gemini Error:", err);
      // We don't save errors to long-term history, just show it
      setMessages((prev) => [...prev, { role: "ai", text: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass"
            style={{
              width: "380px",
              height: "520px",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid var(--accent-border)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              borderRadius: "20px",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px", background: "rgba(20, 184, 166, 0.08)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--emerald-glow)" }}>
                  <Bot size={17} color="white" />
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "14px" }}>Studio Agent</div>
                  <div style={{ fontSize: "10px", color: "var(--emerald)", letterSpacing: "0.1em", opacity: 0.8 }}>● LIVE · QUANT PROTOCOL</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", color: "var(--text-dim)", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="custom-scrollbar" style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: m.role === "user" ? "var(--accent-surface)" : "rgba(20, 184, 166, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--glass-border)" }}>
                    {m.role === "user" ? <User size={13} color="var(--emerald)" /> : <Bot size={13} color="var(--emerald)" />}
                  </div>
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", fontSize: "13px", lineHeight: "1.6", background: m.role === "user" ? "var(--emerald)" : "rgba(255,255,255,0.04)", color: "white", border: m.role === "user" ? "none" : "1px solid var(--glass-border)", whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(20, 184, 166, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--glass-border)" }}>
                    <Bot size={13} color="var(--emerald)" />
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "4px 14px 14px 14px", border: "1px solid var(--glass-border)" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--emerald)" }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.3)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: "12px", border: "1px solid var(--glass-border)", alignItems: "center" }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="ASK QUANT QUESTIONS..." style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "12px", letterSpacing: "0.05em", flex: 1 }} />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={isTyping} style={{ background: isTyping ? "rgba(20, 184, 166, 0.3)" : "var(--emerald)", color: "white", width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: isTyping ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}>
                  <Send size={13} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle FAB — position:fixed is now anchored to viewport thanks to CSS fix */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((v) => !v)}
        style={{ width: "56px", height: "56px", borderRadius: "18px", background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))", boxShadow: "0 8px 30px var(--emerald-glow)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", border: "none", cursor: "pointer" }}
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={24} /></motion.div>
            : <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles size={24} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
