import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth } from './lib/firebase';

import Navbar from './components/Navbar';
import StudioAgent from './components/StudioAgent';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Strategy from './pages/Strategy';
import Portfolio from './pages/Portfolio';
import Banking from './pages/Banking';
import Login from './pages/Login';

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setActivePage('landing');
      if (window.location.hash) window.location.hash = '';
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const syncHashWithPage = () => {
      if (loading) return;

      const hash = window.location.hash.replace('#', '');

      if (isAuthenticated) {
        if (!hash || hash === 'landing') {
          handleLogout();
        } else if (hash !== activePage) {
          setActivePage(hash);
        }
      } else {
        if (hash === 'login') {
          setActivePage('login');
        } else {
          setActivePage('landing');
        }
      }
    };

    window.addEventListener('hashchange', syncHashWithPage);
    window.addEventListener('popstate', syncHashWithPage);

    if (isAuthenticated) {
      syncHashWithPage();
    }

    setPersistence(auth, inMemoryPersistence);

    if (isSimulationMode) {
      document.body.classList.add('simulation-mode');
    } else {
      document.body.classList.remove('simulation-mode');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);

        if (!window.location.hash || window.location.hash === '#login') {
          window.location.hash = '#dashboard';
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener('hashchange', syncHashWithPage);
      window.removeEventListener('popstate', syncHashWithPage);
      unsubscribe();
    };
  }, [isAuthenticated, isSimulationMode]);

  useEffect(() => {
    if (isAuthenticated && activePage !== 'landing') {
      window.location.hash = `#${activePage}`;
    }
  }, [activePage, isAuthenticated]);

  const renderPage = (isSim, setIsSim) => {
    if (loading) return null;

    if (!isAuthenticated) {
      if (activePage === 'landing') return <Landing onStart={() => setActivePage('login')} />;
      return <Login />;
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard isSimulationMode={isSim} setIsSimulationMode={setIsSim} />;
      case 'portfolio':
        return <Portfolio isSimulationMode={isSim} />;
      case 'news':
        return <News isSimulationMode={isSim} />;
      case 'strategy':
        return <Strategy isSimulationMode={isSim} />;
      case 'banking':
        return <Banking isSimulationMode={isSim} />;
      default:
        return <Dashboard isSimulationMode={isSim} setIsSimulationMode={setIsSim} />;
    }
  };

  return (
    <div className={`App fade-in ${isSimulationMode ? 'simulation-mode' : ''}`}>

      {/* Sidebar */}
      {isAuthenticated && activePage !== 'landing' && (
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={handleLogout}
          isSimulationMode={isSimulationMode}
          setIsSimulationMode={setIsSimulationMode}
        />
      )}

      <main style={{ marginLeft: isAuthenticated && activePage !== 'landing' ? 'var(--nav-width)' : '0' }}>
        {renderPage(isSimulationMode, setIsSimulationMode)}
      </main>

      {/* StudioAgent (AI Quant Assistant) */}
      {isAuthenticated && activePage !== 'landing' && (
        <StudioAgent />
      )}

      {isAuthenticated && activePage !== 'landing' && (
        <footer style={{
          marginLeft: 'var(--nav-width)',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '10px',
          letterSpacing: '0.2em',
          opacity: 0.5
        }}>
          STOCKWISE AI STUDIO · INDUSTRIAL QUANT PROTOCOL
        </footer>
      )}
    </div>
  );
}

export default App;