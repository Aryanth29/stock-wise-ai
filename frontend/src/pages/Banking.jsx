import React, { useState, useEffect } from 'react';
import { Building, CreditCard, ArrowDownRight, History, Wallet, ShieldCheck, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

const Banking = ({ isSimulationMode }) => {
  const [balance, setBalance] = useState(0);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showStatus, setShowStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  // Sync Data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.balance || 0);
        if (data.bankDetails) setBankDetails(data.bankDetails);
      }
    });

    const transRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transRef, orderBy('timestamp', 'desc'), limit(10));
    const unsubTrans = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(records);
    });

    return () => {
      unsubUser();
      unsubTrans();
    };
  }, []);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), { bankDetails });
      setIsEditingBank(false);
      triggerStatus('success', 'Banking credentials vaulted successfully.');
    } catch (err) {
      triggerStatus('error', 'Encryption failure. Please try again.');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const user = auth.currentUser;

    if (!user || isNaN(amount) || amount <= 0 || amount > balance) {
      triggerStatus('error', 'Invalid liquidity request or insufficient funds.');
      return;
    }

    if (!bankDetails.accountNumber) {
      triggerStatus('error', 'No secondary node (bank) connected.');
      return;
    }

    setIsWithdrawing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const newBalance = balance - amount;

      // Log transaction
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'WITHDRAWAL',
        amount: amount,
        bank: bankDetails.bankName,
        status: 'COMPLETED',
        timestamp: serverTimestamp()
      });

      // Update balance
      await updateDoc(userRef, { balance: newBalance });

      setWithdrawAmount('');
      triggerStatus('success', `Transfer of ₹${amount.toLocaleString()} initiated.`);
    } catch (err) {
      triggerStatus('error', 'Transaction protocol breach. Try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const triggerStatus = (type, message) => {
    setShowStatus({ type, message });
    setTimeout(() => setShowStatus(null), 5000);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 60px' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '11px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Building size={16} /> BANKING PROTOCOL
        </div>
        <h1 className="outfit" style={{ fontSize: '42px', fontWeight: 'bold' }}>Studio Liquidity</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '8px' }}>Manage secure node connections and extract operational capital.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Bank Details & Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Bank Connection Card */}
          <div className="glass" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <ShieldCheck size={20} style={{ color: 'var(--emerald)' }} />
                 <h3 className="outfit" style={{ fontSize: '20px' }}>Bank Node Connection</h3>
               </div>
               {!isEditingBank && (
                 <button 
                  onClick={() => setIsEditingBank(true)}
                  style={{ background: 'var(--accent-surface)', color: 'var(--emerald)', padding: '6px 14px', fontSize: '11px', borderRadius: '4px' }}
                 >
                   {bankDetails.accountNumber ? 'RECONFIGURE' : 'CONNECT BANK'}
                 </button>
               )}
            </div>

            {isEditingBank ? (
              <form onSubmit={handleSaveBank} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="subtle-label">ACCOUNT HOLDER</label>
                  <input 
                    className="glass" 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', color: '#fff', fontSize: '13px' }}
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                    placeholder="FULL NAME"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="subtle-label">BANK NAME</label>
                  <input 
                    className="glass" 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', color: '#fff', fontSize: '13px' }}
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder="e.g. HDFC BANK"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="subtle-label">ACCOUNT NUMBER</label>
                  <input 
                    className="glass" 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', color: '#fff', fontSize: '13px' }}
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    placeholder="•••• •••• ••••"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="subtle-label">IFSC CODE</label>
                  <input 
                    className="glass" 
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', color: '#fff', fontSize: '13px' }}
                    value={bankDetails.ifsc}
                    onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                    placeholder="HDFC0000123"
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: '12px' }}>ENCRYPT & SAVE</button>
                  <button type="button" onClick={() => setIsEditingBank(false)} className="btn-outline" style={{ flex: 1, fontSize: '12px' }}>CANCEL</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                {bankDetails.accountNumber ? (
                  <>
                    <div>
                      <div className="subtle-label">NODE STATUS</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                        <CheckCircle2 size={16} /> ENCRYPTED CONNECTION
                      </div>
                    </div>
                    <div>
                      <div className="subtle-label">PRIMARY BANK</div>
                      <div className="outfit" style={{ fontSize: '14px', marginTop: '4px' }}>{bankDetails.bankName}</div>
                    </div>
                    <div>
                      <div className="subtle-label">ACCOUNT NODE</div>
                      <div className="outfit" style={{ fontSize: '14px', marginTop: '4px' }}>•••• {bankDetails.accountNumber.slice(-4) || 'NULL'}</div>
                    </div>
                    <div>
                      <div className="subtle-label">HOLDER</div>
                      <div className="outfit" style={{ fontSize: '14px', marginTop: '4px' }}>{bankDetails.accountName}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>
                    No bank node detected. Connect a secondary node to enable capital extraction.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History Card */}
          <div className="glass" style={{ padding: '32px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <History size={20} style={{ color: 'var(--emerald)' }} />
              <h3 className="outfit" style={{ fontSize: '20px' }}>Liquidity Logs</h3>
            </div>
            
            {transactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                     <div>
                       <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{tx.type}</div>
                       <div className="subtle-label" style={{ fontSize: '10px' }}>{tx.timestamp?.toDate().toLocaleString() || 'PROCESSING...'}</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <div className="outfit" style={{ fontSize: '16px', color: tx.type === 'WITHDRAWAL' ? '#EF4444' : 'var(--emerald)' }}>
                         {tx.type === 'WITHDRAWAL' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                       </div>
                       <div className="subtle-label" style={{ fontSize: '9px', fontWeight: 'bold' }}>{tx.status}</div>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '13px' }}>
                Zero operational flux detected in liquidity logs.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Wallet & Withdrawal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Wallet Balance */}
          <div className="glass" style={{ padding: '32px', background: 'var(--accent-surface)', borderColor: 'var(--emerald)' }}>
             <div className="subtle-label">WITHDRAWABLE LIQUIDITY</div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '16px 0' }}>
               <div className="outfit" style={{ fontSize: '48px', color: '#fff' }}>₹{balance.toLocaleString()}</div>
               <div style={{ color: 'var(--emerald)', fontSize: '14px', fontWeight: 'bold' }}>READY</div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '11px' }}>
               <Wallet size={14} /> Total Net Assets
             </div>
          </div>

          {/* Withdrawal Form */}
          <div className="glass" style={{ padding: '32px' }}>
             <h3 className="outfit" style={{ fontSize: '20px', marginBottom: '24px' }}>Extraction Studio</h3>
             <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="subtle-label">EXTRACTION AMOUNT (INR)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '18px' }}>₹</div>
                    <input 
                      type="number"
                      className="glass"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.3)', padding: '16px 16px 16px 36px', fontSize: '24px', fontWeight: 'bold', color: 'var(--emerald)' }}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <span>DAILY LIMIT: ₹5,00,000</span>
                    <button type="button" onClick={() => setWithdrawAmount(balance.toString())} style={{ background: 'transparent', color: 'var(--emerald)', fontSize: '10px', textDecoration: 'underline' }}>MAX</button>
                  </div>
                </div>

                <div className="glass" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <Info size={14} style={{ flexShrink: 0 }} />
                     <span>Industrial transfers may take up to 24 hours to clear the central gateway node after protocol verification.</span>
                   </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isWithdrawing || !bankDetails.accountNumber}
                  className="btn-primary" 
                  style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    letterSpacing: '0.1em', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '12px',
                    opacity: (!bankDetails.accountNumber) ? 0.3 : 1
                  }}
                >
                   {isWithdrawing ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                   INITIATE EXTRACTION
                </button>
             </form>
          </div>

          {/* Status Message Overlay */}
          <AnimatePresence>
            {showStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: showStatus.type === 'success' ? 'var(--accent-surface)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${showStatus.type === 'success' ? 'var(--emerald)' : '#EF4444'}`,
                  color: showStatus.type === 'success' ? 'var(--emerald-light)' : '#FCA5A5',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {showStatus.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                {showStatus.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Banking;
