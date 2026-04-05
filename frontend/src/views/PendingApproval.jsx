import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const PendingApproval = ({ accountStatus, rejectionReason, onStatusChange, onLogout }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState('');

  const isPending  = accountStatus === 'pending';
  const isRejected = accountStatus === 'rejected';

  const handleRequestAgain = async () => {
    setIsRequesting(true);
    setMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/auth/request-access`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('success');
        onStatusChange('pending');
      } else {
        setMessage(data.error || 'Failed to submit request.');
      }
    } catch {
      setMessage('Network error. Please try again.');
    }
    setIsRequesting(false);
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Always-visible Sign Out button top-right */}
      <button
        onClick={onLogout}
        style={{
          position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
          background: '#ffffff', border: '1px solid #E2E8F0',
          color: '#64748B', fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(to right, rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Glowing blob */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px', borderRadius: '50%',
        background: isPending
          ? 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(220,38,38,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: '520px', width: '100%',
        background: '#ffffff', borderRadius: '20px',
        border: `1px solid ${isPending ? '#E2E8F0' : '#FECACA'}`,
        boxShadow: isPending
          ? '0 20px 60px rgba(37,99,235,0.08), 0 4px 16px rgba(0,0,0,0.04)'
          : '0 20px 60px rgba(220,38,38,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        padding: '3rem 2.5rem', textAlign: 'center'
      }}>

        {/* Logo Icon */}
        <div style={{
          width: 360, height: 180, margin: '0 auto 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="/smartlogo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="SmartResQ" />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.6rem',
          color: isPending ? '#1E3A8A' : '#991B1B'
        }}>
          {isPending ? 'Awaiting Approval' : 'Access Denied'}
        </h2>

        <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.7, margin: '0 0 2rem' }}>
          {isPending
            ? 'Your account is under review. An administrator needs to approve your access before you can use the Smart Resq platform features.'
            : (rejectionReason || 'Your access request was not approved by the administrator.')}
        </p>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.25rem', borderRadius: '100px', marginBottom: '2rem',
          background: isPending ? '#EFF6FF' : '#FEF2F2',
          border: `1px solid ${isPending ? '#BFDBFE' : '#FECACA'}`,
          color: isPending ? '#2563EB' : '#DC2626', fontWeight: 700, fontSize: '0.85rem'
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isPending ? '#2563EB' : '#DC2626',
            animation: isPending ? 'pulse 1.5s infinite' : 'none'
          }} />
          {isPending ? 'PENDING REVIEW' : 'REQUEST REJECTED'}
        </div>

        {/* Locked features list */}
        <div style={{
          background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0',
          padding: '1.25rem', marginBottom: '2rem', textAlign: 'left'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Locked Features
          </div>
          {['Monitoring', 'Video Analysis', 'Archive', 'Emergency Alerts', 'Settings'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', borderBottom: '1px solid #F1F5F9' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Success re-request message */}
        {message === 'success' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #bbf7d0', color: '#16A34A', fontWeight: 600, fontSize: '0.9rem' }}>
            ✓ Access re-requested! An admin will review your submission shortly.
          </div>
        )}
        {message && message !== 'success' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
            ⚠ {message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isRejected && (
            <button
              onClick={handleRequestAgain}
              disabled={isRequesting}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: '10px', fontWeight: 700,
                background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', color: 'white',
                border: 'none', cursor: isRequesting ? 'wait' : 'pointer',
                fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
              }}
            >
              {isRequesting ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  Submitting Request…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                  Request Access Again
                </>
              )}
            </button>
          )}

          {isPending && (
            <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              You'll be notified once an admin reviews your account. Refresh to check status.
            </div>
          )}

          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '10px', fontWeight: 600,
              background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0',
              cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default PendingApproval;
