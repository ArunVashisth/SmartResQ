import React, { useState } from 'react';

const Sidebar = ({ activeView, setActiveView, userRole }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuItems = [
    // --- MAIN ---
    { id: 'overview', label: 'Overview', section: 'MAIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    )},
    { id: 'monitoring', label: 'Monitoring', section: 'MAIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    )},
    { id: 'video-analysis', label: 'Video Analysis', section: 'MAIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    )},
    { id: 'archive', label: 'Archive', section: 'MAIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    )},
    { id: 'alerts', label: 'Emergency Alerts', section: 'MAIN', icon: (
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#DC2626', border: '1.5px solid var(--bg-sidebar, #0f172a)' }} />
      </span>
    )},

    // --- USER ---
    { id: 'profile', label: 'My Profile', section: 'USER', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},

    // --- ADMIN ZONE ---
    { id: 'settings', label: 'Settings', section: 'ADMIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )},
    { id: 'tech-stack', label: 'Tech Stack', section: 'ADMIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    )},
    { id: 'developer', label: 'Developer', section: 'ADMIN', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
    { id: 'admin', label: 'Admin Panel', section: 'ADMIN', adminOnly: true, icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )},
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return userRole === 'admin';
    return true;
  });

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ 
        padding: isCollapsed ? '1rem 0' : '1rem 0.5rem 0.5rem',
        display: 'flex', 
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        position: 'relative',
        marginBottom: '1rem',
        minHeight: '40px'
      }}>
        {!isCollapsed && (
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            color: '#0F172A', 
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{ width: '8px', height: '24px', background: '#2563EB', borderRadius: '4px' }} />
            SmartResQ
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#2563EB',
            zIndex: 35,
            padding: 0,
            outline: 'none',
            position: isCollapsed ? 'static' : 'absolute',
            right: '-16px',
            top: '50%',
            transform: isCollapsed ? 'none' : 'translateY(-50%)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = isCollapsed ? 'scale(1.1)' : 'translateY(-50%) scale(1.1)'; e.currentTarget.style.borderColor = '#2563EB'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = isCollapsed ? 'none' : 'translateY(-50%)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="nav-menu" style={{ overflowY: 'auto', flex: 1, paddingBottom: '0.5rem' }}>
        {visibleMenuItems.map((item, index) => {
          const showSection = index === 0 || visibleMenuItems[index - 1].section !== item.section;
          const sectionLabel = item.section === 'ADMIN' ? 'ADMIN ZONE' : item.section;
          
          return (
            <React.Fragment key={item.id}>
              {showSection && !isCollapsed && (
                <div style={{
                  padding: '1rem 1.25rem 0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: item.section === 'ADMIN' ? '#F59E0B' : '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  opacity: 0.8
                }}>
                  {sectionLabel}
                </div>
              )}
              {showSection && isCollapsed && (
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '0.5rem 0' }} />
              )}
              <div
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                style={item.section === 'ADMIN' ? {
                  background: activeView === item.id 
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))' 
                    : 'transparent',
                  color: activeView === item.id ? '#F59E0B' : '#D97706',
                } : {}}
              >
                <span className="nav-icon" style={item.section === 'ADMIN' ? { color: '#F59E0B' } : {}}>{item.icon}</span>
                <span>{item.label}</span>
                {item.section === 'ADMIN' && item.adminOnly && !isCollapsed && (
                  <span style={{ 
                    marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 800, background: '#F59E0B', 
                    color: '#FFF', padding: '1px 6px', borderRadius: '4px'
                  }}>PRO</span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div 
          className={`nav-item ${activeView === 'support' ? 'active' : ''}`}
          onClick={() => setActiveView('support')}
        >
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <span>Support</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
