import React from 'react';

const TopNav = ({ systemStatus, onStart, onStop, isRunning, onLogout }) => {
  return (
    <header className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ width: '160px', height: 'auto', display: 'flex', alignItems: 'center' }}>
          <img src="/smartlogo.png" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} alt="SmartResQ" />
        </div>
        <div style={{ width: '1px', height: '32px', background: '#E2E8F0' }} />
        <div className="view-title">
          <h2 style={{ margin: 0 }}>Mission Control</h2>
          <div className="view-subtitle">Real-time surveillance and monitoring dashboard</div>
        </div>
      </div>
      <div className="system-controls">
        <div className={`live-indicator ${isRunning ? 'active' : ''}`}>
          <div className="indicator-dot"></div>
          <span>{isRunning ? 'SYSTEM ACTIVE' : 'SYSTEM READY'}</span>
        </div>
        
        {!isRunning ? (
          <button className="btn-premium btn-start" onClick={onStart}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Launch System
          </button>
        ) : (
          <button className="btn-premium btn-stop" onClick={onStop}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            Abort Mission
          </button>
        )}
        <button onClick={onLogout} className="btn-logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopNav;
