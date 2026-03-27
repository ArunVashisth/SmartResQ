import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Overview from './views/Overview';
import Monitoring from './views/Monitoring';
import VideoAnalysis from './views/VideoAnalysis';
import Archive from './views/Archive';
import Alerts from './views/Alerts';
import { useSocket } from './hooks/useSocket';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const { socket, dashboardState, videoAnalysisState, resetVideoAnalysis, emitAction, isConnected } = useSocket();

  const handleStart = async () => {
    try {
      await fetch('/api/start', { method: 'POST' });
    } catch (e) {
      console.error('Failed to start system:', e);
    }
  };

  const handleStop = async () => {
    try {
      await fetch('/api/stop', { method: 'POST' });
    } catch (e) {
      console.error('Failed to stop system:', e);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview':       
        return <Overview 
          dashboardState={dashboardState} 
          onStart={handleStart} 
          onSwitchAnalysis={() => setActiveView('video-analysis')} 
        />;
      case 'monitoring':     
        return <Monitoring dashboardState={dashboardState} />;
      case 'video-analysis': 
        return <VideoAnalysis 
          videoAnalysisState={videoAnalysisState}
          resetVideoAnalysis={resetVideoAnalysis}
          emitAction={emitAction} 
        />;
      case 'archive':        
        return <Archive />;
      case 'alerts':
        return <Alerts socket={socket} />;
      case 'tech-stack':     
        return <TechStack />;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      default:               
        return <Overview dashboardState={dashboardState} onStart={handleStart} onSwitchAnalysis={() => setActiveView('video-analysis')} />;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="main-view">
        <TopNav 
          systemStatus={dashboardState.system_status}
          onStart={handleStart}
          onStop={handleStop}
          isRunning={dashboardState.is_running}
        />
        
        <div className="content-area">
          <div className={`dashboard-view active`}>
            {renderView()}
          </div>
        </div>
      </main>

      {/* Connection Toast */}
      {!isConnected && (
        <div className="notification-area" style={{ display: 'block' }}>
           <div className="toast danger" style={{ background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: '8px', margin: '1rem', boxShadow: 'var(--shadow-lg)', fontWeight: 700 }}>
             OFFLINE: DISCONNECTED FROM INTELLIGENCE HUB
           </div>
        </div>
      )}
    </div>
  );
}

const TechStack = () => (
    <div className="tech-page">
      <div className="panel-head"><h3>Infrastructure Log</h3></div>
      <div className="ideology-grid" style={{ marginTop: '20px' }}>
         <div className="ideology-card build" style={{ background: 'var(--bg-card)' }}>
            <h3>Neural Engine</h3><p>TensorFlow / Keras CNN model trained on 100k+ accident scenarios.</p>
         </div>
         <div className="ideology-card build" style={{ background: 'var(--bg-card)' }}>
            <h3>Vision Core</h3><p>OpenCV for real-time stream processing and frame interpolation.</p>
         </div>
         <div className="ideology-card build" style={{ background: 'var(--bg-card)' }}>
            <h3>Sync Gateway</h3><p>Flask-SocketIO establishing low-latency telemetry pipelines.</p>
         </div>
      </div>
    </div>
);

const Settings = () => (
    <div className="settings-page">
      <div className="panel-head"><h3>Core Calibration</h3></div>
      <div className="settings-tabs" style={{ marginTop: '20px' }}>
         <div className="settings-group">
            <h4>Vision Parameters</h4>
            <div className="settings-grid-3">
               <div className="input-group"><label>INPUT SOURCE</label><select className="premium-input"><option>Camera 01</option></select></div>
            </div>
         </div>
      </div>
    </div>
);

const Support = () => (
    <div className="support-layout">
      <div className="support-header"><h1>How can we help?</h1><p>Premium support for SmartResQ Enterprise deployments</p></div>
      <div className="support-grid">
         <div className="support-card highlighted"><h3>Live Debug</h3><p>Connect to a system engineer in real-time.</p></div>
      </div>
    </div>
);

export default App;
