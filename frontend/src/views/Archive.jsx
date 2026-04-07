import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/* ── helpers ─────────────────────────────────── */
const fmtDate  = (s) => s ? new Date(s).toLocaleString() : '—';
const fmtPct   = (v) => v != null ? (v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1)) + '%' : '—';
const fmtSec   = (frame, fps) => (fps && frame != null) ? (frame / fps).toFixed(2) + 's' : '—';
const statusColor = (s) => s === 'complete' ? { bg: 'rgba(22,163,74,0.12)', fg: '#16A34A' }
                        : s === 'processing' ? { bg: 'rgba(37,99,235,0.12)', fg: '#2563EB' }
                        : s === 'error'      ? { bg: 'rgba(220,38,38,0.12)', fg: '#DC2626' }
                        : { bg: 'rgba(100,116,139,0.12)', fg: '#64748b' };

/* ── meta-stat mini card ─────────────────────── */
const MetaCard = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 8, padding: '0.5rem 0.85rem',
    border: '1px solid var(--border)', minWidth: 100
  }}>
    <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: 800, fontSize: '1rem', color: color || 'var(--text-primary)' }}>{value ?? '—'}</div>
  </div>
);

/* ── accident log row ────────────────────────── */
const AccidentRow = ({ acc, fps, idx, setFullScreenImage }) => {
  const pct   = fmtPct(acc.confidence);
  const sec   = fmtSec(acc.frame_number, fps);
  const plate = acc.license_plate;
  const loc   = acc.location || 'Point A-7';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 64px 1fr 1fr 1.5fr 90px',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.55rem 0.75rem',
      borderBottom: '1px solid var(--border)',
      fontSize: '0.78rem',
      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.04)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</span>
      <div>
        {acc.photo_path ? (
          <div style={{ width: '48px', height: '36px', borderRadius: '4px', overflow: 'hidden', background: '#000', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => setFullScreenImage(`${API_BASE}${acc.photo_path}`)} title="Click to enlarge">
            <img src={`${API_BASE}${acc.photo_path}`} alt="Accident Frame" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>—</span>
        )}
      </div>
      <span>Frame&nbsp;<strong>{acc.frame_number ?? '—'}</strong></span>
      <span style={{ color: 'var(--text-muted)' }}>{sec}</span>
      <span style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {plate ? `🚘 ${plate}` : '—'}&nbsp;·&nbsp;{loc}
      </span>
      <span style={{ color: '#DC2626', fontWeight: 700, textAlign: 'right' }}>
        {pct}
      </span>
    </div>
  );
};

/* ── expandable detail panel ─────────────────── */
const SessionDetail = ({ sessionId, fps, setFullScreenImage }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/archives/${sessionId}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      LOADING REPORT…
    </div>
  );
  if (!detail) return (
    <div style={{ padding: '1rem', textAlign: 'center', color: '#DC2626', fontSize: '0.8rem' }}>
      Failed to load session detail.
    </div>
  );

  const accidents = detail.accidents || [];
  const efFps = detail.fps || fps || 30;

  return (
    <div style={{ padding: '1rem 1.4rem 1.2rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
        <MetaCard label="Status"     value={(detail.status || 'unknown').toUpperCase()} />
        <MetaCard label="FPS"        value={efFps.toFixed ? efFps.toFixed(1) : efFps} />
        <MetaCard label="Duration"   value={detail.duration_seconds ? detail.duration_seconds.toFixed(1) + 's' : '—'} />
        <MetaCard label="Frames"     value={`${detail.processed_frames ?? 0} / ${detail.total_frames ?? 0}`} />
        <MetaCard label="Accidents"  value={detail.accident_count ?? accidents.length} color="#DC2626" />
        <MetaCard label="Started"    value={detail.start_time ? new Date(detail.start_time).toLocaleTimeString() : '—'} />
        <MetaCard label="Finished"   value={detail.end_time   ? new Date(detail.end_time).toLocaleTimeString() : '—'} />
      </div>

      {/* Accident log */}
      {accidents.length > 0 ? (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 64px 1fr 1fr 1.5fr 90px',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderBottom: '2px solid var(--border)',
            marginBottom: 2,
          }}>
            <span>#</span><span>Photo</span><span>Frame</span><span>Time</span><span>Plate / Location</span><span style={{ textAlign: 'right' }}>Confidence</span>
          </div>
          {accidents.map((acc, i) => (
            <AccidentRow key={acc.id ?? i} acc={acc} fps={efFps} idx={i} setFullScreenImage={setFullScreenImage} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          No accidents recorded in this session.
        </div>
      )}
    </div>
  );
};

/* ── Main Archive component ──────────────────── */
const Archive = () => {
  const [history, setHistory]               = useState([]);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => { fetchHistory(); fetchStats(); }, []);

  const fetchHistory = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/archives`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      setError('Failed to load archive: ' + err.message);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  };

  const deleteReport = async (id) => {
    if (!window.confirm('🚨 Are you sure you want to permanently delete this analysis? This will also remove all associated accident photos from the database.')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/archives/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await res.json();
        if (data.success) {
            setHistory(prev => prev.filter(s => s.id !== id));
            if (selectedSession === id) setSelectedSession(null);
            fetchStats();
        } else {
            alert('Failed to delete report: ' + data.message);
        }
    } catch (err) {
        alert('Error deleting report: ' + err.message);
    }
  };

  const toggleSession = (id) =>
    setSelectedSession(prev => prev === id ? null : id);

  const filtered = history.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(s.id).includes(q) ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.timestamp || '').toLowerCase().includes(q) ||
      (s.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div id="view-archive" className="dashboard-view active">
      <div className="archive-container">

        {/* ── Header ── */}
        <div className="panel-head">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Analysis Repository
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by ID, title, status or date…"
                className="premium-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-icon" onClick={() => { fetchHistory(); fetchStats(); }} title="Refresh" style={{ flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        {stats && (
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Sessions',  value: stats.total_sessions  ?? history.length },
              { label: 'Total Accidents', value: stats.total_accidents ?? 0, color: '#DC2626' },
              { label: 'Plates Detected', value: stats.total_plates    ?? 0, color: '#2563EB' },
            ].map(s => (
              <MetaCard key={s.label} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>
        )}

        {/* ── Table ── */}
        <div className="archive-table-wrapper">
          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
              LOADING REPOSITORY…
            </div>
          ) : error ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#DC2626' }}>⚠ {error}</div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TITLE / VIDEO</th>
                  <th>TIMESTAMP</th>
                  <th>FRAMES</th>
                  <th>ACCIDENTS</th>
                  <th>STATUS</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody id="archiveList">
                {filtered.length > 0 ? filtered.map((session) => {
                  const sc = statusColor(session.status);
                  const isOpen = selectedSession === session.id;
                  return (
                    <React.Fragment key={session.id}>
                      <tr
                        onClick={() => toggleSession(session.id)}
                        style={{ cursor: 'pointer', background: isOpen ? 'rgba(37,99,235,0.06)' : '' }}
                      >
                        <td style={{ fontWeight: 700 }}>#{session.id}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.title || 'Untitled'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {fmtDate(session.timestamp)}
                        </td>
                        <td>{session.total_frames ?? '—'}</td>
                        <td>
                          <span style={{ color: session.accident_count > 0 ? '#DC2626' : 'var(--text-muted)', fontWeight: 700 }}>
                            {session.accident_count ?? 0}
                          </span>
                        </td>
                        <td>
                          <span className="stat-badge" style={{ background: sc.bg, color: sc.fg }}>
                            {(session.status || 'unknown').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-icon"
                            style={{ padding: '6px', color: '#DC2626' }}
                            onClick={e => { e.stopPropagation(); deleteReport(session.id); }}
                            title="Delete report permanently"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                          <button
                            className="btn-icon"
                            style={{ padding: '4px' }}
                            onClick={e => { e.stopPropagation(); toggleSession(session.id); }}
                            title={isOpen ? 'Collapse' : 'Expand report'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* ── Expandable accident report ── */}
                      {isOpen && (
                        <tr>
                          <td colSpan="7" style={{ padding: 0, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                            <SessionDetail sessionId={session.id} fps={session.fps} setFullScreenImage={setFullScreenImage} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {searchQuery ? 'NO MATCHING SESSIONS FOUND' : 'NO ANALYSIS SESSIONS RECORDED YET'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Fullscreen Image Modal ── */}
      {fullScreenImage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }} onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} alt="Fullscreen Accident" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
          <button style={{
            position: 'absolute', top: '2rem', right: '3rem', background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
          }} onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}>
            ✕ Close
          </button>
        </div>
      )}

    </div>
  );
};

export default Archive;
