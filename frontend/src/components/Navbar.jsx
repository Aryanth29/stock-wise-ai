import React, { useState } from 'react';
import { LayoutDashboard, Wallet, Newspaper, BrainCircuit, User, TrendingUp, LogOut, Download, Trash2, Shield, ToggleLeft, ToggleRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ activePage, setActivePage, onLogout, isSimulationMode, setIsSimulationMode }) => {
  const [showAccount, setShowAccount] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Analysis', icon: <LayoutDashboard size={20} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={20} /> },
    { id: 'news', label: 'Signals', icon: <Newspaper size={20} /> },
    { id: 'strategy', label: 'Intelligence', icon: <BrainCircuit size={20} /> },
  ];

  const handleExport = () => {
    const data = { portfolio: [], settings: {}, exportDate: new Date() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stockwise_studio_export.json';
    a.click();
    setShowAccount(false);
  };

  return (
    <>
      {/* Desktop Sidebar Rail */}
      <nav className="glass desktop-nav" style={{
        position: 'fixed',
        left: '0',
        top: '0',
        width: 'var(--nav-width)',
        height: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        zIndex: 2000,
        borderRadius: '0',
        borderRight: '1px solid var(--glass-border)',
        background: 'rgba(10, 13, 14, 0.8)'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <button 
            onClick={() => setShowAccount(!showAccount)}
            className="glass" 
            style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              background: showAccount ? 'var(--emerald)' : 'var(--glass)',
              borderColor: showAccount ? 'var(--emerald)' : 'var(--glass-border)',
              boxShadow: showAccount ? '0 0 20px var(--emerald-glow)' : 'none'
            }}
          >
            <User size={24} style={{ color: showAccount ? '#fff' : 'var(--emerald-light)' }} />
          </button>
        </div>

        <div style={{ marginBottom: '60px', cursor: 'pointer' }} onClick={() => setActivePage('dashboard')}>
          <TrendingUp className="emerald-light" size={24} style={{ opacity: 0.8 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: '1' }}>
          {navItems.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                onClick={() => setActivePage(item.id)}
                style={{
                  background: 'transparent',
                  color: activePage === item.id ? 'var(--text-main)' : 'var(--text-dim)',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '4px',
                  transition: 'var(--transition)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activePage === item.id ? 'var(--emerald)' : 'transparent',
                  boxShadow: activePage === item.id ? '0 0 15px var(--emerald-glow)' : 'none'
                }}
              >
                {item.icon}
              </button>
              <div key={item.id + '_tooltip'} style={{
                position: 'absolute',
                left: '70px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-card)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                pointerEvents: 'none',
                opacity: 0,
                transition: '0.2s',
                whiteSpace: 'nowrap',
                border: '1px solid var(--glass-border)'
              }} className="nav-tooltip">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="simulation-hub" style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={() => setIsSimulationMode(!isSimulationMode)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: isSimulationMode ? '#A855F7' : 'var(--text-dim)', 
              transition: 'var(--transition)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isSimulationMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '0.1em' }}>
              {isSimulationMode ? 'PRACTICE' : 'LIVE'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="glass mobile-nav" style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '100vw',
        height: 'var(--nav-height)',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 16px',
        zIndex: 2000,
        borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--glass-border)',
        background: 'rgba(10, 13, 14, 0.95)',
        backdropFilter: 'blur(20px)'
      }}>
        {navItems.map(item => (
          <button
            key={item.id + '_mobile'}
            onClick={() => setActivePage(item.id)}
            style={{
              background: 'transparent',
              color: activePage === item.id ? 'var(--emerald)' : 'var(--text-dim)',
              border: 'none',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'var(--transition)'
            }}
          >
            {item.icon}
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.id}</span>
          </button>
        ))}
        <button 
          onClick={() => setShowAccount(!showAccount)}
          style={{
            background: 'transparent',
            color: showAccount ? 'var(--emerald)' : 'var(--text-dim)',
            border: 'none',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <User size={20} />
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</span>
        </button>
      </nav>

      <AnimatePresence>
        {showAccount && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass account-studio-card"
            style={{
              position: 'fixed',
              left: window.innerWidth > 1024 ? '85px' : '50%',
              bottom: window.innerWidth > 1024 ? 'auto' : '85px',
              top: window.innerWidth > 1024 ? '24px' : 'auto',
              transform: window.innerWidth > 1024 ? 'none' : 'translateX(-50%)',
              width: '280px',
              padding: '24px',
              zIndex: 2001,
              background: 'var(--bg-card)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              marginLeft: window.innerWidth > 1024 ? '0' : '-140px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div className="glass" style={{ padding: '10px', borderRadius: '50%', background: 'var(--emerald-glow)', borderColor: 'var(--emerald)' }}>
                <User size={20} className="emerald-light" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>ABHISHEK THAKKAR</div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>STUDIO MASTER ACCESS</div>
              </div>
            </div>

            <div className="card-title" style={{ marginBottom: '16px' }}>Studio Management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={handleExport}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}
              >
                <Download size={16} /> Export Strategy Data
              </button>
              <button 
                onClick={() => setIsSimulationMode(!isSimulationMode)}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', color: isSimulationMode ? '#A855F7' : 'var(--text-main)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}
              >
                {isSimulationMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} 
                {isSimulationMode ? 'Practice Mode: ON' : 'Practice Mode: OFF'}
              </button>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }}></div>
              <button style={{ width: '100%', textAlign: 'left', background: 'transparent', color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
                <Trash2 size={16} /> Pure Studio Wipe
              </button>
              <button 
                onClick={onLogout}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', color: 'var(--text-dim)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}
              >
                <LogOut size={16} /> Close Studio Feed
              </button>
            </div>
            {window.innerWidth <= 1024 && (
              <button 
                onClick={() => setShowAccount(false)}
                style={{ marginTop: '16px', width: '100%', background: 'var(--glass-border)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }}
              >
                CLOSE
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-nav { display: none; }

        @media (max-width: 1024px) {
          .desktop-nav { display: none; }
          .mobile-nav { display: flex; }
        }

        .desktop-nav button:hover + .nav-tooltip {
          opacity: 1;
          left: 80px;
        }

        .account-studio-card {
           left: 85px;
           top: 24px;
        }

        @media (max-width: 1024px) {
          .account-studio-card {
            left: 50% !important;
            bottom: 85px !important;
            top: auto !important;
            transform: translateX(-50%) !important;
            margin-left: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
