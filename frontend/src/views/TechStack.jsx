import React from 'react';
import { 
  Zap, 
  Cpu, 
  Database, 
  Globe, 
  Activity, 
  ShieldCheck,
  Code
} from 'lucide-react';
import { motion } from 'framer-motion';

const TechStack = () => {
  const stack = [
    { title: 'Neural Engine', label: 'TensorFlow / Keras', icon: Cpu, color: '#FF6F00' },
    { title: 'Computer Vision', label: 'OpenCV / NumPy', icon: Activity, color: '#38BDF8' },
    { title: 'OCR Intelligence', label: 'EasyOCR / Tesseract', icon: Globe, color: '#10B981' },
    { title: 'Real-time Gateway', label: 'Flask-SocketIO', icon: Zap, color: '#F59E0B' },
    { title: 'Web Infrastructure', label: 'React / Vite SPA', icon: Code, color: '#6366F1' },
    { title: 'Communication API', label: 'Twilio REST API', icon: ShieldCheck, color: '#F22F46' },
  ];

  return (
    <div className="view-tech-stack">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '8px' }}>
          Infrastructure <span style={{ color: 'var(--primary)' }}>Log</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
          Deep dive into the neural architecture and communication protocols powering the Smart Resq platform.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
         {stack.map((item, idx) => {
           const Icon = item.icon;
           return (
             <motion.div 
               key={idx}
               whileHover={{ scale: 1.02 }}
               className="glass-card" 
               style={{ 
                 padding: '32px', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 alignItems: 'center', 
                 gap: '20px',
                 textAlign: 'center',
                 borderLeft: `3px solid ${item.color}`
               }}
             >
                <div style={{ padding: '16px', borderRadius: '50%', background: `${item.color}15`, color: item.color }}>
                  <Icon size={32} />
                </div>
                <div>
                   <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{item.title}</h3>
                   <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{item.label}</span>
                </div>
             </motion.div>
           );
         })}
      </div>
    </div>
  );
};

export default TechStack;
