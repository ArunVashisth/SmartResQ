import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: '#ffffff', borderRadius: '12px', padding: '1.25rem 1.5rem',
    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '160px'
  }}>
    <div style={{ width: 44, height: 44, borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [activityLog, setActivityLog] = useState([]);

  const token = localStorage.getItem('auth_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const logActivity = (msg) => setActivityLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 19)]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers }),
        fetch(`${API_BASE}/api/stats`, { headers })
      ]);
      const usersData = await usersRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;
      if (usersData.success) setUsers(usersData.users);
      if (statsData) setStats(statsData);
    } catch (e) {
      showMsg('Failed to fetch data', 'error');
    }
    setIsLoading(false);
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4500);
  };

  const changeRole = async (userId, newRole, username) => {
    setActingOn(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'POST', headers, body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.map(x => x._id === userId ? { ...x, role: newRole } : x));
        showMsg(`${username} promoted to ${newRole.toUpperCase()}`);
        logActivity(`Role changed: ${username} → ${newRole.toUpperCase()}`);
      } else showMsg(data.error, 'error');
    } catch { showMsg('Network error', 'error'); }
    setActingOn(null);
  };

  const approveUser = async (userId, username) => {
    setActingOn(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.map(x => x._id === userId ? { ...x, account_status: 'approved' } : x));
        showMsg(`${username} approved — access granted`);
        logActivity(`Approved: ${username}`);
      } else showMsg(data.error, 'error');
    } catch { showMsg('Network error', 'error'); }
    setActingOn(null);
  };

  const rejectUser = async (userId, username) => {
    setActingOn(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/reject`, {
        method: 'POST', headers, body: JSON.stringify({ reason: 'Access request rejected by administrator.' })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.map(x => x._id === userId ? { ...x, account_status: 'rejected' } : x));
        showMsg(`${username}'s access has been rejected`);
        logActivity(`Rejected: ${username}`);
      } else showMsg(data.error, 'error');
    } catch { showMsg('Network error', 'error'); }
    setActingOn(null);
  };

  const deleteUser = useCallback(async (userId, username) => {
    setConfirmDialog(null);
    setActingOn(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.filter(x => x._id !== userId));
        showMsg(`User "${username}" permanently removed`);
        logActivity(`User deleted: ${username}`);
      } else showMsg(data.error, 'error');
    } catch { showMsg('Network error', 'error'); }
    setActingOn(null);
  }, []);

  const clearArchive = async () => {
    setConfirmDialog(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/clear-archive`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) {
        showMsg('Archive flushed successfully');
        logActivity('SYSTEM — Archive database cleared');
        setStats(prev => prev ? { ...prev, total_sessions: 0, total_accidents: 0, total_plates: 0 } : prev);
      } else showMsg(data.error, 'error');
    } catch { showMsg('Network error', 'error'); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username?.toLowerCase().includes(q) || (u.first_name + ' ' + u.last_name).toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const adminCount   = users.filter(u => u.role === 'admin').length;
  const userCount    = users.filter(u => u.role === 'user').length;
  const pendingCount = users.filter(u => u.account_status === 'pending').length;

  const inputStyle = {
    padding: '0.55rem 1rem', borderRadius: '8px', background: '#ffffff',
    border: '1px solid #E2E8F0', color: '#0F172A', outline: 'none', fontSize: '0.9rem'
  };

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: '1200px' }}>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', maxWidth: '440px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0F172A' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#64748B', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                Cancel
              </button>
              <button onClick={confirmDialog.onConfirm} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="view-title">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', width: 36, height: 36, borderRadius: '8px', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          Admin Power Center
        </h2>
        <div className="view-subtitle">Root-level access to all system controls and user management</div>
      </div>

      {/* Toast */}
      {message.text && (
        <div style={{
          margin: '1rem 0', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 600,
          background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          color: message.type === 'success' ? '#16A34A' : '#DC2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{message.type === 'success' ? '✓ ' : '⚠ '}{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <StatCard label="Total Users" value={users.length} color="#2563EB" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard label="Admins" value={adminCount} color="#F59E0B" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
        <StatCard label="Regular Users" value={userCount} color="#10B981" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
        <StatCard label="Pending Approval" value={pendingCount} color="#F59E0B" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        {stats && <StatCard label="Analysis Sessions" value={stats.total_sessions ?? 0} color="#8B5CF6" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>} />}
        {stats && <StatCard label="Accidents Logged" value={stats.total_accidents ?? 0} color="#DC2626" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* Left: User Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>User Directory</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text" placeholder="Search users…" value={search}
                onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 180 }}
              />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
              <button onClick={fetchAll} style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#475569' }} title="Refresh">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              </button>
            </div>
          </div>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading directory…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['User', 'Age', 'Role', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Actions' ? 'right' : 'left', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #F8FAFC', background: i % 2 === 0 ? 'white' : '#FAFBFC', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                            background: u.profile_pic_url ? 'transparent' : `hsl(${u.username?.charCodeAt(0) * 30},60%,85%)`,
                            backgroundImage: u.profile_pic_url ? `url(${u.profile_pic_url})` : 'none',
                            backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: `hsl(${u.username?.charCodeAt(0) * 30},60%,35%)`, fontWeight: 800, fontSize: '0.9rem'
                          }}>
                            {!u.profile_pic_url && (u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>
                              {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : 'Unnamed User'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: '#475569', fontSize: '0.9rem' }}>{u.age || '—'}</td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <span style={{
                            padding: '0.2rem 0.7rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700,
                            background: u.role === 'admin' ? '#FFFBEB' : '#F0F9FF',
                            color: u.role === 'admin' ? '#D97706' : '#0369A1',
                            border: `1px solid ${u.role === 'admin' ? '#FDE68A' : '#BAE6FD'}`,
                            display: 'inline-block'
                          }}>
                            {u.role === 'admin' ? '🛡 ADMIN' : '👤 USER'}
                          </span>
                          {u.role !== 'admin' && (
                            <span style={{
                              padding: '0.15rem 0.6rem', borderRadius: '100px', fontSize: '0.68rem', fontWeight: 700,
                              display: 'inline-block',
                              background: u.account_status === 'approved' ? '#F0FDF4' : u.account_status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                              color: u.account_status === 'approved' ? '#16A34A' : u.account_status === 'rejected' ? '#DC2626' : '#D97706',
                              border: `1px solid ${u.account_status === 'approved' ? '#bbf7d0' : u.account_status === 'rejected' ? '#FECACA' : '#FDE68A'}`
                            }}>
                              {u.account_status === 'approved' ? '✓ APPROVED' : u.account_status === 'rejected' ? '✕ REJECTED' : '⏳ PENDING'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Approve / Reject for pending users */}
                          {u.role !== 'admin' && u.account_status === 'pending' && (
                            <>
                              <button disabled={actingOn === u._id} onClick={() => approveUser(u._id, u.username)}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#F0FDF4', color: '#16A34A', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                                ✓ Approve
                              </button>
                              <button disabled={actingOn === u._id} onClick={() => setConfirmDialog({ title: 'Reject Access?', message: `Deny ${u.username}'s access to the platform.`, onConfirm: () => rejectUser(u._id, u.username), confirmLabel: 'Reject' })}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}>
                                ✕ Reject
                              </button>
                            </>
                          )}
                          {/* Re-approve rejected */}
                          {u.role !== 'admin' && u.account_status === 'rejected' && (
                            <button disabled={actingOn === u._id} onClick={() => approveUser(u._id, u.username)}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: '#F0FDF4', color: '#16A34A', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                              ✓ Approve
                            </button>
                          )}
                          {/* Role toggle */}
                          {u.role === 'user' ? (
                            <button disabled={actingOn === u._id} onClick={() => setConfirmDialog({ title: 'Promote to Admin?', message: `Grant ${u.username} full admin access.`, onConfirm: () => changeRole(u._id, 'admin', u.username), confirmLabel: 'Promote' })}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: 'pointer' }}>
                              ↑ Promote
                            </button>
                          ) : (
                            <button disabled={actingOn === u._id} onClick={() => setConfirmDialog({ title: 'Demote to User?', message: `Revoke ${u.username}'s admin privileges.`, onConfirm: () => changeRole(u._id, 'user', u.username), confirmLabel: 'Demote' })}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                              ↓ Demote
                            </button>
                          )}
                          <button disabled={actingOn === u._id} onClick={() => setConfirmDialog({ title: 'Delete User?', message: `Permanently remove "${u.username}" from the platform.`, onConfirm: () => deleteUser(u._id, u.username), confirmLabel: 'Delete User' })}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}>
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>No users match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: System Controls + Activity Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* System Tools */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>System Operations</h3>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDialog({ title: 'Flush Archive?', message: `This will permanently delete ALL accident logs and analysis sessions from MongoDB. This cannot be undone.`, onConfirm: clearArchive, confirmLabel: '⚠ Flush Everything' })}
                style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🗑</span>
                <div>
                  <div style={{ fontSize: '0.85rem' }}>Flush Archive DB</div>
                  <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 500 }}>Delete all accident history</div>
                </div>
              </button>

              <button onClick={fetchAll}
                style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'pointer', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔄</span>
                <div>
                  <div style={{ fontSize: '0.85rem' }}>Sync All Data</div>
                  <div style={{ fontSize: '0.7rem', color: '#86EFAC', fontWeight: 500 }}>Refresh from MongoDB cluster</div>
                </div>
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div style={{ background: '#0F172A', borderRadius: '16px', border: '1px solid #1E293B', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Activity Log</h3>
            </div>
            <div style={{ padding: '0.75rem', fontFamily: 'monospace', overflowY: 'auto', maxHeight: '280px' }}>
              {activityLog.length === 0 ? (
                <div style={{ color: '#334155', fontSize: '0.8rem', padding: '0.5rem' }}>_session started — awaiting events</div>
              ) : (
                activityLog.map((entry, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', color: i === 0 ? '#A3E635' : '#64748B', padding: '0.25rem 0.5rem', borderBottom: i < activityLog.length - 1 ? '1px solid #1E293B' : 'none' }}>
                    {entry}
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

export default AdminPanel;
