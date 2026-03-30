import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, ChevronDown, ChevronUp, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        border: msg.role === 'user' ? '1px solid var(--glass-border)' : 'none'
      }}>
        {msg.text}
      </div>
    </motion.div>
  );
};

const Strategy = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      text: 'Studio active. I am ready to process your trading criteria. What market segment should we analyze first?',
      thought: 'Engine initialized. Waiting for user input to perform technical analysis on NSE/BSE segments. Security: Session-only login active.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, context: { page: 'intelligence' } })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.reply || data.error,
        thought: data.thought || "Processing technical resistance and market sentiment."
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Critical Error: Engine failed to respond.", thought: error.message }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fade-in" style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 60px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
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

      <div ref={scrollRef} style={{ 
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
            padding: '18px 24px',
            color: 'var(--text-main)',
            fontSize: '13px',
            letterSpacing: '0.1em',
            outline: 'none',
            textTransform: 'uppercase'
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
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          {isThinking ? '...' : 'PROMPT'}
        </button>
      </div>
    </div>
  );
};

export default Strategy;
