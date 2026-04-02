import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Overview from './views/Overview';
import Monitoring from './views/Monitoring';
import VideoAnalysis from './views/VideoAnalysis';
import Archive from './views/Archive';
import Alerts from './views/Alerts';
import TechStack from './views/TechStack/index.jsx';
import Settings from './views/Settings';
import Support from './views/Support';
import Developer from './views/Developer';
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
      case 'developer':
        return <Developer />;
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

export default App;
