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
import Profile from './views/Profile';
import Auth from './views/Auth';
import AdminPanel from './views/AdminPanel';
import PendingApproval from './views/PendingApproval';
import { useSocket } from './hooks/useSocket';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [accountStatus, setAccountStatus] = useState('approved');
  const [isVerifying, setIsVerifying] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  const { socket, dashboardState, videoAnalysisState, resetVideoAnalysis, emitAction, isConnected } = useSocket();

  React.useEffect(() => {
    if (!isConnected) {
      setShowOfflineToast(true);
      const timer = setTimeout(() => setShowOfflineToast(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineToast(false);
    }
  }, [isConnected]);

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsVerifying(false);
      return;
    }
    fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setIsAuthenticated(true);
        setUserRole(data.role || 'user');
        setAccountStatus(data.account_status || 'approved');
        localStorage.setItem('user_role', data.role || 'user');
        localStorage.setItem('account_status', data.account_status || 'approved');
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('account_status');
      }
      setIsVerifying(false);
    })
    .catch(() => setIsVerifying(false));
  }, []);

  const handleStart = async () => {
    if (isActionPending) return;
    setIsActionPending(true);
    setActionError(null);
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to start system');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch (e) {
      setActionError('Network error — backend offline?');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleStop = async () => {
    if (isActionPending) return;
    setIsActionPending(true);
    setActionError(null);
    try {
      const res = await fetch('/api/stop', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to stop system');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch (e) {
      setActionError('Network error — backend offline?');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsActionPending(false);
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
      case 'profile':
        return <Profile />;
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
      case 'admin':
        return userRole === 'admin' ? <AdminPanel /> : <Overview dashboardState={dashboardState} />;
      default:               
        return <Overview dashboardState={dashboardState} onStart={handleStart} onSwitchAnalysis={() => setActiveView('video-analysis')} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('account_status');
    setIsAuthenticated(false);
    setUserRole('user');
    setAccountStatus('approved');
  };

  if (isVerifying) return <div style={{ height: '100vh', background: '#0f172a' }}></div>;

  if (!isAuthenticated) {
    return <Auth onLogin={(token, role, status) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_role', role || 'user');
      localStorage.setItem('account_status', status || 'approved');
      setUserRole(role || 'user');
      setAccountStatus(status || 'approved');
      setIsAuthenticated(true);
    }} />;
  }

  // Block non-approved users — show the waiting/rejected page instead
  if (accountStatus !== 'approved' && userRole !== 'admin') {
    return (
      <PendingApproval
        accountStatus={accountStatus}
        rejectionReason={localStorage.getItem('rejection_reason') || ''}
        onStatusChange={(s) => setAccountStatus(s)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} userRole={userRole} accountStatus={accountStatus} />
      
      <main className="main-view">
        <TopNav 
          systemStatus={dashboardState.system_status}
          onStart={handleStart}
          onStop={handleStop}
          isRunning={dashboardState.is_running}
          isActionPending={isActionPending}
          onLogout={handleLogout}
        />
        
        <div className="content-area">
          <div className={`dashboard-view active`}>
            {renderView()}
          </div>
        </div>
      </main>

      {/* Toasts */}
      <div className="notification-area" style={{ 
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
        pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {/* Offline toast */}
        <div style={{ 
          background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: '8px', 
          boxShadow: 'var(--shadow-lg)', fontWeight: 700,
          transform: showOfflineToast ? 'translateY(0)' : 'translateY(150%)',
          opacity: showOfflineToast ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          ⚠ OFFLINE: DISCONNECTED FROM INTELLIGENCE HUB
        </div>
        {/* Action error toast */}
        <div style={{ 
          background: '#92400e', color: 'white', padding: '1rem', borderRadius: '8px', 
          boxShadow: 'var(--shadow-lg)', fontWeight: 700,
          transform: actionError ? 'translateY(0)' : 'translateY(150%)',
          opacity: actionError ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          ⚠ {actionError}
        </div>
      </div>
    </div>
  );
}

export default App;
