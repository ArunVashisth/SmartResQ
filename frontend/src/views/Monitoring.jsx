import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Monitoring = ({ dashboardState }) => {
  const waveformRef = useRef(null);
  const liveFrameRef = useRef(null);
  const [cpuLoad, setCpuLoad] = useState(0);

  // Animate waveform canvas
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      const time = Date.now() * 0.005;
      const amp = dashboardState?.is_running ? 20 : 5;
      for (let i = 0; i < canvas.width; i++) {
        const y = canvas.height / 2 + Math.sin(i * 0.04 + time) * amp + Math.sin(i * 0.08 + time * 1.3) * (amp * 0.4);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [dashboardState?.is_running]);

  // Render live camera frame when it arrives via socket
  useEffect(() => {
    const frame = dashboardState?.current_frame;
    if (frame && liveFrameRef.current) {
      liveFrameRef.current.src = `data:image/jpeg;base64,${frame}`;
    }
  }, [dashboardState?.current_frame]);

  // Simulate CPU load based on frames
  useEffect(() => {
    if (dashboardState?.is_running) {
      setCpuLoad(prev => {
        const target = 65 + Math.random() * 25;
        return Math.round(prev + (target - prev) * 0.1);
      });
    } else {
      setCpuLoad(5);
    }
  }, [dashboardState?.frames_processed, dashboardState?.is_running]);

  const isRunning = dashboardState?.is_running || false;
  const fps = dashboardState?.fps || 0;
  const prob = dashboardState?.current_prob ?? 0;
  const hasFrame = !!dashboardState?.current_frame;

  return (
    <div id="view-monitoring" className="dashboard-view active">
      <div className="monitoring-layout-refined">
        {/* Primary Camera Feed */}
        <div className="intelligence-module">
          <div className="panel-head">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Primary Intelligence Console
            </h3>
            <div className="stream-badge">
              <div className={`pulse-dot${isRunning ? '' : ' inactive'}`} style={{ background: isRunning ? '#22C55E' : '#64748b' }}></div>
              <span>{isRunning ? 'CAM-01: LIVE' : 'STANDBY'}</span>
            </div>
          </div>

          <div className="primary-sensor-container" style={{ position: 'relative' }}>
            {/* Live frame */}
            {hasFrame ? (
              <img
                ref={liveFrameRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 8 }}
                alt="Live camera feed"
              />
            ) : (
              <div className="placeholder-box">
                <div className="loading-state">
                  <span>{isRunning ? 'AWAITING FIRST FRAME...' : 'SYSTEM OFFLINE — LAUNCH TO ACTIVATE'}</span>
                </div>
              </div>
            )}

            {/* HUD overlay */}
            <div className="hud-overlay">
              <div className="hud-corner top-left"></div>
              <div className="hud-corner top-right"></div>
              <div className="hud-corner bottom-left"></div>
              <div className="hud-corner bottom-right"></div>
              <div className="hud-center-cross"></div>

              <div className="hud-telem-top">
                <div className="telem-chip">{isRunning ? 'SECURED CONNECTION' : 'OFFLINE'}</div>
                <div className="telem-chip">1920x1080</div>
              </div>

              <div className="hud-telem-btm">
                <div className="telem-chip">STABILITY: {isRunning ? '99.9%' : 'N/A'}</div>
                <div className="telem-chip">{fps > 0 ? `${fps.toFixed ? fps.toFixed(0) : fps} FPS` : '-- FPS'}</div>
              </div>
            </div>

            {/* Probability bar at bottom when running */}
            {isRunning && (
              <div style={{
                position: 'absolute', bottom: 16, left: 16, right: 16,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                padding: '8px 14px', borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: 'white'
              }}>
                <span>NEURAL CONFIDENCE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${Math.min(prob, 100)}%`,
                      background: prob > 70 ? '#EF4444' : prob > 40 ? '#F59E0B' : '#22C55E',
                      transition: 'width 0.5s ease, background 0.3s'
                    }} />
                  </div>
                  <span style={{ color: prob > 70 ? '#EF4444' : prob > 40 ? '#F59E0B' : '#22C55E' }}>
                    {prob.toFixed ? prob.toFixed(1) : prob}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right stats column */}
        <div className="monitoring-stats-col">
          {/* Neural Signal Waveform */}
          <div className="display-panel">
            <div className="panel-head">
              <h3>NEURAL SIGNAL</h3>
            </div>
            <div className="waveform-container" style={{ height: '140px' }}>
              <canvas ref={waveformRef} width="300" height="140"></canvas>
            </div>
          </div>

          {/* Hardware sync */}
          <div className="display-panel">
            <div className="panel-head">
              <h3>HARDWARE SYNC</h3>
            </div>
            <div className="hw-grid-compact">
              <HWPill label="AI ENGINE" value={`${cpuLoad}%`} progress={cpuLoad} color="#2563EB" />
              <HWPill label="FRAMES" value={`${dashboardState?.frames_processed || 0}`} progress={Math.min((dashboardState?.frames_processed || 0) / 100, 100)} color="#16A34A" />
              <HWPill label="ACCIDENTS" value={`${dashboardState?.total_accidents || 0}`} progress={Math.min((dashboardState?.total_accidents || 0) * 10, 100)} color="#EF4444" />
            </div>
          </div>

          {/* Recent accidents panel */}
          <div className="display-panel" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="panel-head">
              <h3>INCIDENT LOG</h3>
              <span className="stat-badge" style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}>
                {(dashboardState?.accidents || []).length}
              </span>
            </div>
            <div>
              {(dashboardState?.accidents || []).length === 0 ? (
                <div className="empty-state">NO INCIDENTS — SYSTEM {isRunning ? 'MONITORING' : 'OFFLINE'}</div>
              ) : (
                (dashboardState?.accidents || []).slice(0, 8).map((acc, idx) => (
                  <div key={idx} style={{
                    padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.78rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--danger)' }}>ACCIDENT</span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2 }}>
                        {acc.timestamp}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                      {typeof acc.probability === 'number' ? acc.probability.toFixed(1) : acc.probability}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HWPill = ({ label, value, progress, color }) => (
  <div className="hw-pill">
    <span className="hw-label">{label}</span>
    <span className="hw-value" style={{ color }}>{value}</span>
    <div className="hw-progress">
      <div style={{ width: `${Math.min(progress, 100)}%`, background: color, transition: 'width 0.5s ease' }}></div>
    </div>
  </div>
);

export default Monitoring;
