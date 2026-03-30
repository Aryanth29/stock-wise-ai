import React from 'react';
import { motion } from 'framer-motion';

const Landing = ({ onStart }) => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-obsidian)'
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{ textAlign: 'center', maxWidth: '600px' }}
      >
        <h1 className="outfit" style={{ 
          fontSize: '10px', 
          letterSpacing: '1em', 
          color: 'var(--text-dim)', 
          marginBottom: '60px',
          fontWeight: '300',
          textTransform: 'uppercase'
        }}>
          QUANT STUDIO
        </h1>
        
        <h2 style={{
          fontSize: '34px',
          fontWeight: '200',
          letterSpacing: '0.1em',
          marginBottom: '60px',
          color: 'var(--text-main)',
          lineHeight: '1.4'
        }}>
          Industrial Intelligence <br />
          <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>Redefined.</span>
        </h2>

        <button 
          onClick={onStart}
          className="btn-outline" 
          style={{ 
            marginTop: '40px',
            padding: '16px 52px', 
            fontSize: '12px', 
            letterSpacing: '0.4em',
            background: 'transparent',
            border: '1px solid var(--emerald)',
            color: 'var(--emerald)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          ENTER STUDIO
        </button>
      </motion.div>
      
      <div style={{
        position: 'absolute',
        bottom: '60px',
        fontSize: '9px',
        color: 'var(--text-dim)',
        letterSpacing: '0.2em',
        display: 'flex',
        gap: '40px'
      }}>
        <span>NSE : ACTIVE</span>
        <span>BSE : ACTIVE</span>
        <span>AI : ONLINE</span>
      </div>
    </div>
  );
};

export default Landing;
