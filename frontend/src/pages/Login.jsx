import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult 
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, LogIn, TrendingUp, UserPlus, AlertCircle } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Auth Error:", err.code);
      switch (err.code) {
        case 'auth/invalid-credential':
          setError('Industrial access denied. Key mismatch or identity not found. Try "Register Studio" if new.');
          break;
        case 'auth/user-not-found':
          setError('Industrial access denied. UID not found.');
          break;
        case 'auth/wrong-password':
          setError('Credential mismatch. Decryption failed.');
          break;
        case 'auth/email-already-in-use':
          setError('Studio identity already exists. Please log in.');
          break;
        case 'auth/weak-password':
          setError('Encryption strength insufficient. 6+ chars required.');
          break;
        default:
          setError(err.message.replace('Firebase:', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.05) 0%, transparent 40%)'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass" 
        style={{ padding: '56px', width: '100%', maxWidth: '440px', textAlign: 'center' }}
      >
        <div style={{ padding: '14px', background: 'var(--emerald-glow)', display: 'inline-flex', borderRadius: '14px', marginBottom: '32px' }}>
          <TrendingUp style={{ color: 'var(--emerald)' }} size={32} />
        </div>
        
        <h1 className="outfit" style={{ fontSize: '28px', marginBottom: '10px', letterSpacing: '-0.02em' }}>STOCKWISE AI</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '40px', letterSpacing: '0.1em' }}>
          {isSignUp ? 'REGISTER NEW STUDIO IDENTITY' : 'PRO QUANT STUDIO ACCESS'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', opacity: 0.6 }} />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Terminal Email"
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '0.5px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '16px 16px 16px 52px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'var(--transition)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--emerald)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', opacity: 0.6 }} />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access Key"
              required
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '0.5px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '16px 16px 16px 52px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'var(--transition)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--emerald)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ 
                  color: '#EF4444', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="btn-outline" 
            style={{ 
              padding: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              fontSize: '14px',
              background: 'transparent',
              borderColor: 'var(--emerald)',
              color: 'var(--emerald)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? 'Establish Identity' : 'Secure Entry'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-outline" 
            style={{ 
              padding: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              fontSize: '13px',
              background: 'transparent',
              borderColor: 'var(--glass-border)',
              color: 'var(--text-main)',
              borderRadius: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'transparent', 
              color: isSignUp ? 'var(--text-dim)' : 'var(--emerald)', 
              fontSize: '13px', 
              fontWeight: '500',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              transition: 'var(--transition)',
              opacity: 0.9
            }}
          >
            {isSignUp ? 'Already have an account? Log In' : 'New to StockWise? Register Studio Access'}
          </button>
        </div>

        <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '10px', opacity: 0.5 }}>
          <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
          <span style={{ letterSpacing: '0.2em' }}>AES-256 CLOUD ENCRYPTED</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
