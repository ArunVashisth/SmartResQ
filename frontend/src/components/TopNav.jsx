import React from 'react';

const TopNav = ({ systemStatus, onStart, onStop, isRunning }) => {
  return (
    <header className="top-nav">
      <div className="view-title">
        <h2>Mission Control</h2>
        <div className="view-subtitle">Real-time surveillance and monitoring dashboard</div>
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
      </div>
    </header>
  );
};

export default TopNav;
