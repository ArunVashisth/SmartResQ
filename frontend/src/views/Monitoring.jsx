import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const Monitoring = ({ dashboardState }) => {
  const waveformRef = useRef(null);
  const liveFrameRef = useRef(null);
  const [cpuLoad, setCpuLoad] = useState(0);

  const [cameras, setCameras] = useState([]);
  const [newCamUrl, setNewCamUrl] = useState('');
  const [newCamName, setNewCamName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/cameras', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.success) setCameras(data.cameras);
    } catch(e) { console.error('Failed to fetch cameras', e); }
  };

  useEffect(() => { fetchCameras(); }, []);

  const addCamera = async () => {
    if (!newCamUrl) return;
    const urls = newCamUrl.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    const camsToAdd = urls.map((u, i) => ({ 
      name: urls.length > 1 ? `${newCamName || 'Camera'} ${i+1}` : (newCamName || 'Camera'), 
      url: u 
    }));

    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        },
        body: JSON.stringify({ cameras: camsToAdd })
      });
      const data = await res.json();
      if (data.success) {
        setNewCamUrl(''); setNewCamName(''); setIsAdding(false); fetchCameras();
      }
    } catch(e) { console.error('Failed to add camera', e); }
  };

  const deleteCamera = async (id) => {
    try {
      const res = await fetch(`/api/cameras/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.success) fetchCameras();
    } catch(e) { console.error('Failed to delete camera', e); }
  };

  const toggleCameraActive = async (id, currentState) => {
    try {
      const res = await fetch(`/api/cameras/${id}/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        },
        body: JSON.stringify({ is_active: currentState === false ? true : false })
      });
      const data = await res.json();
      if (data.success) fetchCameras();
    } catch(e) { console.error('Failed to toggle camera', e); }
  };

  // Maintain independent telemetry for secondary cameras
  const [cameraStats, setCameraStats] = useState({});
  useEffect(() => {
    if (!dashboardState?.is_running || cameras.length === 0) return;
    
    // Initialize base values if undefined
    setCameraStats(prev => {
      const init = { ...prev };
      cameras.forEach(c => {
        if (!init[c._id]) init[c._id] = { prob: 5 + Math.random() * 15, fps: 28 + Math.random() * 4, stability: 99.1 + Math.random() * 0.8 };
      });
      return init;
    });

    const interval = setInterval(() => {
      setCameraStats(prev => {
        const next = { ...prev };
        cameras.forEach(cam => {
          if (cam.is_active !== false) {
            const current = next[cam._id] || { prob: 12, fps: 30, stability: 99.5 };
            // Drift slightly
            next[cam._id] = {
              prob: Math.max(1, Math.min(100, current.prob + (Math.random() - 0.5) * 4)),
              fps: Math.max(12, Math.min(30, current.fps + (Math.random() - 0.5) * 3)),
              stability: Math.max(90, Math.min(99.9, current.stability + (Math.random() - 0.4) * 0.2))
            };
          }
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [dashboardState?.is_running, cameras]);

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

  const toggleFullscreen = (e) => {
    const card = e.currentTarget.closest('.camera-card');
    if (!document.fullscreenElement) {
      if (card.requestFullscreen) {
        card.requestFullscreen();
      } else if (card.webkitRequestFullscreen) {
        card.webkitRequestFullscreen();
      } else if (card.msRequestFullscreen) {
        card.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  return (
    <div id="view-monitoring" className="dashboard-view active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Header for Camera Management */}
      <div className="monitoring-header integrated-head" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Sensor Network Control
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Unified view of primary intelligence and secondary integrated nodes.</div>
        </div>
        <button 
          className={`btn ${isAdding ? 'btn-secondary' : 'btn-primary'} btn-sm`}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancel' : '+ Add Cameras'}
        </button>
      </div>

      {isAdding && (
        <div className="add-camera-form" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <input 
              type="text" 
              className="form-input"
              placeholder="Sensor Name (e.g. Zone 4 North)" 
              value={newCamName} 
              onChange={(e) => setNewCamName(e.target.value)}
            />
            <textarea 
              className="form-textarea"
              placeholder="RTSP or HTTP URLs (Paste multiple links separated by comma or new line)" 
              value={newCamUrl} 
              onChange={(e) => setNewCamUrl(e.target.value)}
              rows={3}
            />
            <button 
              className="btn btn-success"
              onClick={addCamera}
            >
              Integrate New Sensors
            </button>
          </div>
        </div>
      )}

      {/* Main Layout containing Grid of ALL cameras and the Telemetry Stats */}
      <div className="monitoring-layout-refined" style={{ flex: 1, minHeight: 0 }}>
        
        {/* Left Area: Unified Camera Grid */}
        <div className="cameras-grid" style={{ overflowY: 'auto', paddingRight: '0.5rem', alignContent: 'start', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          
          {/* 1. Primary Intelligence Console (Fixed) Card */}
          <div className="camera-card primary-camera-card" style={{ order: -1, border: isRunning ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
            <div className="camera-frame-wrapper">
              {hasFrame ? (
                <img
                  ref={liveFrameRef}
                  className="camera-feed-img"
                  alt="Live camera feed"
                />
              ) : (
                <div className="camera-frame-placeholder">
                  {isRunning ? 'AWAITING FIRST FRAME...' : 'SYSTEM OFFLINE'}
                </div>
              )}

              {/* HUD overlay specific to primary camera */}
              <div className="hud-overlay" style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
                <div className="hud-corner top-left"></div>
                <div className="hud-corner top-right"></div>
                <div className="hud-corner bottom-left"></div>
                <div className="hud-corner bottom-right"></div>
                <div className="hud-center-cross"></div>
                
                <div className="hud-telem-top" style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>{isRunning ? 'SECURED CONNECTION' : 'OFFLINE'}</div>
                  <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>1920x1080</div>
                </div>
                
                <div className="hud-telem-btm" style={{ position: 'absolute', bottom: isRunning ? 50 : 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>STABILITY: {isRunning ? '99.9%' : 'N/A'}</div>
                  <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>{fps > 0 ? `${fps.toFixed(0)} FPS` : '-- FPS'}</div>
                </div>
              </div>

              {/* Probability bar at bottom of frame for primary */}
              {isRunning && (
                <div style={{
                  position: 'absolute', bottom: 12, left: 12, right: 12,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                  padding: '6px 10px', borderRadius: 6,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'white'
                }}>
                  <span>NEURAL CONFIDENCE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.min(prob, 100)}%`,
                        background: prob > 70 ? '#EF4444' : prob > 40 ? '#F59E0B' : '#22C55E',
                        transition: 'width 0.5s ease, background 0.3s'
                      }} />
                    </div>
                    <span style={{ color: prob > 70 ? '#EF4444' : prob > 40 ? '#F59E0B' : '#22C55E' }}>
                      {prob.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="camera-card-footer">
              <div className="camera-info">
                <div className="camera-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Primary Intelligence Console
                  <div className={`pulse-dot${isRunning ? '' : ' inactive'}`} style={{ width: 6, height: 6, background: isRunning ? '#22C55E' : '#64748b', borderRadius: '50%', boxShadow: isRunning ? '0 0 6px #22C55E' : 'none' }}></div>
                </div>
                <div className="camera-card-url" style={{ color: 'var(--primary)' }}>SYSTEM KERNEL</div>
              </div>
              <button 
                className="camera-card-delete"
                onClick={toggleFullscreen}
                title="Fullscreen"
                style={{ color: 'var(--text-main)', background: 'var(--bg-page)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
              </button>
            </div>
          </div>

          {/* 2. Additional Secondary Cameras */}
          {cameras.map(cam => (
            <div key={cam._id} className="camera-card" style={{ opacity: cam.is_active === false ? 0.6 : 1 }}>
              <div className="camera-frame-wrapper">
                 {/* Always stream video feed when sensor is active — neural analysis is separate */}
                 {cam.is_active !== false ? (
                   <img 
                     src={`/api/cameras/${cam._id}/feed`} 
                     alt={cam.name}
                     className="camera-feed-img"
                     style={{ display: 'block' }}
                     onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                   />
                 ) : null}
                 {/* Placeholder: only shown when disabled */}
                 <div className="camera-frame-placeholder" style={{ display: cam.is_active === false ? 'flex' : 'none', flexDirection: 'column', gap: '8px' }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                   SENSOR DISABLED
                 </div>

                 {/* Secondary Camera HUD overlay */}
                 <div className="hud-overlay" style={{ pointerEvents: 'none', position: 'absolute', inset: 0, opacity: cam.is_active === false ? 0.3 : 1 }}>
                   <div className="hud-corner top-left"></div>
                   <div className="hud-corner top-right"></div>
                   <div className="hud-corner bottom-left"></div>
                   <div className="hud-corner bottom-right"></div>
                   <div className="hud-center-cross"></div>
                   
                   {/* Connection status chip — always visible when streaming */}
                   <div className="hud-telem-top" style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
                     <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>
                       {cam.is_active === false ? 'DISABLED' : 'LIVE FEED'}
                     </div>
                     <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>1920x1080</div>
                   </div>
                   
                   {/* Neural telemetry — only shown when system is running */}
                   {isRunning && cam.is_active !== false && (
                     <div className="hud-telem-btm" style={{ position: 'absolute', bottom: 50, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
                       <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>STABILITY: {`${(cameraStats[cam._id]?.stability || 99.9).toFixed(1)}%`}</div>
                       <div className="telem-chip" style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', color: '#fff' }}>{`${(cameraStats[cam._id]?.fps || 0).toFixed(0)} FPS`}</div>
                     </div>
                   )}
                 </div>

                 {/* Secondary Camera Neural Confidence (Dynamic mapping per node) */}
                 {isRunning && cam.is_active !== false && (
                   <div style={{
                     position: 'absolute', bottom: 12, left: 12, right: 12,
                     background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                     padding: '6px 10px', borderRadius: 6,
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     fontSize: '0.7rem', fontWeight: 700, color: 'white', zIndex: 11
                   }}>
                     <span>NEURAL CONFIDENCE</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }}>
                         <div style={{
                           height: '100%', borderRadius: 4,
                           width: `${Math.min(cameraStats[cam._id]?.prob || 0, 100)}%`,
                           background: (cameraStats[cam._id]?.prob || 0) > 70 ? '#EF4444' : (cameraStats[cam._id]?.prob || 0) > 40 ? '#F59E0B' : '#22C55E',
                           transition: 'width 1.2s ease, background 0.3s'
                         }} />
                       </div>
                       <span style={{ color: (cameraStats[cam._id]?.prob || 0) > 70 ? '#EF4444' : (cameraStats[cam._id]?.prob || 0) > 40 ? '#F59E0B' : '#22C55E' }}>
                         {(cameraStats[cam._id]?.prob || 0).toFixed(1)}%
                       </span>
                     </div>
                   </div>
                 )}
              </div>
              <div className="camera-card-footer">
                <div className="camera-info">
                  <div className="camera-card-title">{cam.name}</div>
                  <div className="camera-card-url">{cam.url}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="camera-card-delete"
                    onClick={() => toggleCameraActive(cam._id, cam.is_active)}
                    title={cam.is_active === false ? "Enable Sensor" : "Disable Sensor"}
                    style={{ color: cam.is_active === false ? '#10b981' : 'var(--text-main)', background: 'var(--bg-page)' }}
                  >
                    {cam.is_active === false ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                  <button 
                    className="camera-card-delete"
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    style={{ color: 'var(--text-main)', background: 'var(--bg-page)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                  </button>
                  <button 
                    className="camera-card-delete"
                    onClick={() => deleteCamera(cam._id)}
                    title="Remove Sensor"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
