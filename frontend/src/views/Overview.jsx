import React, { useRef, useEffect } from 'react';

const Overview = ({ dashboardState, onStart, onSwitchAnalysis }) => {
  const liveFrameRef = useRef(null);

  useEffect(() => {
    const frame = dashboardState?.current_frame;
    if (frame && liveFrameRef.current) {
      liveFrameRef.current.src = `data:image/jpeg;base64,${frame}`;
    }
  }, [dashboardState?.current_frame]);
  return (
    <div id="view-overview" className="dashboard-view active">
      {/* HERO SECTION */}
      <div className="hero-section">
        <video className="hero-video" autoPlay muted loop playsInline preload="auto">
          <source src="/static/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            <span>AI-Powered Smart City Surveillance</span>
          </div>
          <h1 className="hero-title">SmartResQ <span className="hero-title-accent">Command Center</span></h1>
          <p className="hero-subtitle">Real-time accident detection &amp; emergency response.<br />Keeping cities safer, one frame at a time.</p>
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={onStart}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Launch System
            </button>
            <button className="hero-btn-secondary" onClick={() => onSwitchAnalysis()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Analyse Video
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-value">99.8%</div>
              <div className="hero-stat-label">Detection Accuracy</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">40%</div>
              <div className="hero-stat-label">Faster Response</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">Live Monitoring</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Zones Covered</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
        </div>
      </div>

      {/* OVERVIEW ESSENCE */}
      <div className="overview-essence">
        <div className="essence-header">
          <div className="essence-badge">THE MISSION</div>
          <h2 className="essence-title">Beating the Golden Hour.</h2>
          <p className="essence-subtitle">In severe accidents, the first 60 minutes are critical for survival. Traditional monitoring relies on chance and human vigilance, wasting precious minutes. <strong>SmartResQ was built to compress response times from minutes to milliseconds</strong>, giving victims the highest possible chance of survival.</p>
        </div>

        <div className="timeline-container">
          {/* Traditional Response */}
          <div className="timeline-track traditional">
            <div className="track-info">
              <h4>Traditional Infrastructure</h4>
              <span>Average Dispatch: 7-12 Minutes</span>
            </div>
            <div className="track-bar active-danger">
              <div className="track-fill slow-fill"></div>
              <div className="track-node node-1">
                <div className="node-dot"></div>
                <div className="node-label">0m<br /><span>Impact</span></div>
              </div>
              <div className="track-node node-2">
                <div className="node-dot"></div>
                <div className="node-label">5m<br /><span>Discovery</span></div>
              </div>
              <div className="track-node node-3">
                <div className="node-dot"></div>
                <div className="node-label">8m<br /><span>Verification</span></div>
              </div>
              <div className="track-node node-4 fail">
                <div className="node-dot"></div>
                <div className="node-label">12m+<br /><span>Dispatch</span></div>
              </div>
            </div>
          </div>

          {/* SmartResQ Response */}
          <div className="timeline-track smartresq">
            <div className="track-info">
              <h4 className="text-primary">SmartResQ Neural Pipeline</h4>
              <span className="text-primary-light">Instant Autonomous Dispatch</span>
            </div>
            <div className="track-bar active">
              <div className="track-fill"></div>
              <div className="track-node node-1 active">
                <div className="node-dot"></div>
                <div className="node-label">0s<br /><span>Impact</span></div>
              </div>
              <div className="track-node node-2 active">
                <div className="node-dot"></div>
                <div className="node-label">0.8s<br /><span>AI Detect</span></div>
              </div>
              <div className="track-node node-3 active">
                <div className="node-dot"></div>
                <div className="node-label">1.5s<br /><span>OCR Scan</span></div>
              </div>
              <div className="track-node node-4 success">
                <div className="node-dot"></div>
                <div className="node-label">2s<br /><span>Dispatch</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="ideology-grid">
          {/* Problem */}
          <div className="ideology-card problem">
            <div className="ideology-icon pulse-red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3>The Problem</h3>
            <p>Human-monitored CCTV networks are inherently delayed. In severe accidents, waiting minutes for an operator to notice and verify a crash often costs victims their lives during the critical "Golden Hour".</p>
          </div>

          {/* Solution */}
          <div className="ideology-card solution">
            <div className="ideology-icon pulse-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>The Solution</h3>
            <p>An autonomous, vigilant system that never sleeps. We automate the entire first response pipeline—instantly identifying crashes, extracting data, and alerting authorities without human intervention.</p>
          </div>

          {/* How We Built It */}
          <div className="ideology-card build">
            <div className="ideology-icon pulse-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>How We Built It</h3>
            <p>We process 60FPS video feeds using a custom-trained Convolutional Neural Network via OpenCV. Real-time EasyOCR captures vehicle plates, and a webhook instantly dispatches the data via the Twilio REST API.</p>
          </div>
        </div>
      </div>

      {/* LIVE STATS BENTO GRID */}
      <div className="bento-grid">
        <div className="stat-card-gold stat-card-accidents">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="stat-dot"></div>
          </div>
          <div className="stat-value-big">{dashboardState?.total_accidents || 0}</div>
          <div className="stat-trend">Live Incidents</div>
        </div>

        <div className="stat-card-gold stat-card-plates">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          </div>
          <div className="stat-value-big">{dashboardState?.total_plates || 0}</div>
          <div className="stat-trend">Plates Captured</div>
        </div>

        <div className="stat-card-gold stat-card-frames">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <div className="stat-value-big">{dashboardState?.frames_processed || 0}</div>
          <div className="stat-trend">Frames Scanned</div>
        </div>

        <div className="stat-card-gold stat-card-uptime">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-value-big">{dashboardState?.uptime || '00:00'}</div>
          <div className="stat-trend">Session Duration</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">
        <div className="display-panel">
          <div className="panel-head">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Neural Surveillance Feed
            </h3>
          </div>
          <div className="video-viewport" style={{ position: 'relative' }}>
            <div className="feed-overlay">
              <div className={`rec-pulse${dashboardState?.is_running ? '' : ' inactive'}`}>
                <div className="rec-dot" style={{ background: dashboardState?.is_running ? '#22C55E' : '#64748b' }}></div>
                <span>{dashboardState?.is_running ? 'LIVE\u00a0FEED' : 'OFFLINE'}</span>
              </div>
            </div>
            {dashboardState?.current_frame ? (
              <img
                ref={liveFrameRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                alt="Live camera feed"
              />
            ) : (
              <div className="placeholder-box">
                <div className="loading-state">
                  <span>{dashboardState?.is_running ? 'AWAITING FIRST FRAME...' : 'LAUNCH SYSTEM TO ACTIVATE FEED'}</span>
                </div>
              </div>
            )}
            <div className="hud-overlay">
              <div className="hud-corner top-left"></div>
              <div className="hud-corner top-right"></div>
              <div className="hud-corner bottom-left"></div>
              <div className="hud-corner bottom-right"></div>
            </div>
          </div>
        </div>

        <div className="display-panel">
          <div className="panel-head">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Recent Activity
            </h3>
          </div>
          <div className="history-feed">
            {(dashboardState?.accidents || []).length > 0 ? (
               (dashboardState.accidents).slice(0, 5).map((acc, idx) => (
                 <div key={idx} className="incident-row" style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span><span style={{ fontWeight: 700, color: 'var(--danger)' }}>ACCIDENT</span> &mdash; {acc.timestamp || acc.time}</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{typeof acc.probability === 'number' ? acc.probability.toFixed(1) : acc.probability}%</span>
                 </div>
               ))
            ) : (
               <div className="empty-state">NO RECENT INCIDENTS</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
