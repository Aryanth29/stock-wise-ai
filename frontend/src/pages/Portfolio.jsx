import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, Layers, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const EarningCard = ({ title, value, change, isPositive, timeframe }) => (
  <div className="glass" style={{ padding: '32px', flex: '1', minWidth: '300px', background: 'rgba(255,255,255,0.01)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div className="card-title">{title}</div>
      <div style={{ 
        padding: '4px 8px', 
        background: isPositive ? 'rgba(20, 184, 166, 0.1)' : 'rgba(239, 68, 68, 0.05)', 
        color: isPositive ? 'var(--emerald)' : '#EF4444',
        borderRadius: '2px',
        fontSize: '10px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
      }}>
        {isPositive ? '+' : ''}{change}%
      </div>
    </div>
    <div className="outfit" style={{ fontSize: '34px', marginBottom: '8px', color: '#fff' }}>{value}</div>
    <div className="subtle-label" style={{ opacity: 0.6 }}>{timeframe} PERFORMANCE</div>
  </div>
);

const Portfolio = () => {
  const holdings = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 45, avg: 2450.00, current: 2940.50, pnl: 22120.50, isPos: true },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', qty: 120, avg: 135.20, current: 154.80, pnl: 2352.00, isPos: true },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', qty: 80, avg: 1680.00, current: 1420.30, pnl: -20776.00, isPos: false },
    { symbol: 'INFY', name: 'Infosys Limited', qty: 60, avg: 1420.00, current: 1510.40, pnl: 5424.00, isPos: true }
  ];

  return (
    <div className="fade-in" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 60px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '11px', fontWeight: 'bold', marginBottom: '12px' }}>
            <Wallet size={16} /> PORTFOLIO STUDIO
          </div>
          <h1 className="outfit" style={{ fontSize: '42px', fontWeight: 'bold' }}>Current Assets</h1>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="btn-outline" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Target size={16} /> Risk Analysis
          </button>
          <button className="btn-primary" style={{ boxShadow: '0 0 30px var(--emerald-glow)' }}>Connect Exchange</button>
        </div>
      </div>

      {/* Earning Metrics */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '60px', flexWrap: 'wrap' }}>
        <EarningCard title="Lifetime Earnings" value="₹2,450,200" change="14.2" isPositive={true} timeframe="LIFETIME" />
        <EarningCard title="Monthly Gain" value="₹42,800" change="4.1" isPositive={true} timeframe="MARCH 2026" />
        <EarningCard title="Projected Yearly" value="₹510,000" change="8.8" isPositive={true} timeframe="FY2026" />
      </div>

      {/* Holdings Table */}
      <div className="glass" style={{ padding: '40px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
           <h3 className="outfit" style={{ fontSize: '24px' }}>Holdings</h3>
           <span className="subtle-label" style={{ opacity: 0.6 }}>TOTAL 4 ASSETS REGISTERED</span>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
              <th className="subtle-label" style={{ padding: '20px 0' }}>ASSET</th>
              <th className="subtle-label" style={{ padding: '20px 0' }}>QUANTITY</th>
              <th className="subtle-label" style={{ padding: '20px 0' }}>AVG. PRICE</th>
              <th className="subtle-label" style={{ padding: '20px 0' }}>LAST PRICE</th>
              <th className="subtle-label" style={{ padding: '20px 0', textAlign: 'right' }}>NET P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '28px 0' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{h.symbol}</div>
                  <div className="subtle-label" style={{ fontSize: '11px', marginTop: '4px' }}>{h.name}</div>
                </td>
                <td style={{ padding: '28px 0', fontSize: '14px', fontWeight: 'bold' }}>{h.qty} <span style={{ opacity: 0.5, fontWeight: 'normal' }}>UNITS</span></td>
                <td style={{ padding: '28px 0', fontSize: '14px', color: 'var(--text-dim)' }}>₹{h.avg.toFixed(2)}</td>
                <td style={{ padding: '28px 0', fontSize: '15px', color: h.isPos ? '#00F5FF' : '#EF4444', fontWeight: 'bold' }}>
                  ₹{h.current.toFixed(2)}
                </td>
                <td style={{ padding: '28px 0', textAlign: 'right' }}>
                  <div style={{ color: h.isPos ? '#00F5FF' : '#EF4444', fontWeight: 'bold', fontSize: '16px' }}>
                    {h.isPos ? '+' : ''}₹{h.pnl.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {h.isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {((h.pnl / (h.avg * h.qty)) * 100).toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'right', color: 'var(--text-dim)', fontSize: '11px', letterSpacing: '0.1em' }}>
        * DATA ANALYZED 2 SECONDS AGO · NSE LIVE FEED ACTIVE
      </div>
    </div>
  );
};

export default Portfolio;
