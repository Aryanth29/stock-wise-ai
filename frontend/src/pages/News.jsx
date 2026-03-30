import React from 'react';
import { Newspaper, ExternalLink, Globe, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const NewsCard = ({ tag, title, site, time, summary, link }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{ 
      padding: '40px 0', 
      borderBottom: '0.1px solid var(--glass-border)',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px' 
    }}
  >
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--emerald)', letterSpacing: '0.2em' }}>{tag}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: '9px', letterSpacing: '0.1em' }}>/ {time}</span>
    </div>
    <h3 className="outfit" style={{ fontSize: '18px', fontWeight: '200', letterSpacing: '0.05em' }}>{title}</h3>
    <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6', maxWidth: '600px' }}>{summary}</p>
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '10px' }}>
        <Globe size={11} />
        <span style={{ letterSpacing: '0.1em' }}>{site}</span>
      </div>
      <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--emerald)', opacity: 0.8 }}>
        <ExternalLink size={11} />
      </a>
    </div>
  </motion.div>
);

const News = () => {
  const newsItems = [
    {
      tag: 'EQUITY',
      title: 'Reliance Industries Hits 52-Week High Amid Expansion Plans',
      site: 'Mint',
      time: '15M AGO',
      summary: 'Reliance shares surged 3% today as the company announced new green energy initiatives in Gujarat.',
      link: '#'
    },
    {
      tag: 'MONETARY',
      title: 'RBI Signals Potential Rate Cut in Upcoming Meet',
      site: 'ET',
      time: '1H AGO',
      summary: 'Inflation data cooled more than expected, prompting markets to rally on rate cut hopes.',
      link: '#'
    }
  ];

  return (
    <div className="fade-in" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '160px 40px 100px'
    }}>
      <div style={{ marginBottom: '60px' }}>
        <div style={{ fontSize: '10px', color: 'var(--emerald)', letterSpacing: '0.4em', marginBottom: '12px' }}>RADAR</div>
        <h1 className="outfit" style={{ fontSize: '24px', fontWeight: '200' }}>Active Market Flow</h1>
      </div>

      <div>
        {newsItems.map((news, idx) => <NewsCard key={idx} {...news} />)}
      </div>
    </div>
  );
};

export default News;
