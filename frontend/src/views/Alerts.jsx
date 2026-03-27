import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/* ── tiny helpers ─────────────────────────────── */
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString() : '—';

const StatusPill = ({ ok, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: ok ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
    color: ok ? '#16A34A' : '#DC2626',
    borderRadius: 20, padding: '3px 10px',
    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em'
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
    {label}
  </span>
);

const LogIcon = ({ type }) => {
  if (type === 'call') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
  if (type === 'sms') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (type === 'config') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
  return <span>⚠</span>;
};

/* ── Input field ─────────────────────────────── */
const Field = ({ label, id, type = 'text', value, onChange, placeholder, hint, monospace }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label htmlFor={id} style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="premium-input"
      style={{ fontFamily: monospace ? 'monospace' : undefined, fontSize: monospace ? '0.8rem' : undefined }}
    />
    {hint && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>{hint}</span>}
  </div>
);

/* ── Toggle ──────────────────────────────────── */
const Toggle = ({ id, label, checked, onChange, description }) => (
  <label htmlFor={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
    <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <div onClick={() => onChange(!checked)} style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: checked ? '#2563EB' : 'var(--border, #334155)',
        transition: 'background 0.2s', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }} />
      </div>
    </div>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
      {description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
    </div>
  </label>
);

/* ── ActionButton ─────────────────────────────── */
const ActionBtn = ({ id, label, icon, onClick, loading, danger, disabled }) => (
  <button
    id={id}
    onClick={onClick}
    disabled={loading || disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '0.6rem 1.2rem', borderRadius: 10, fontWeight: 700,
      fontSize: '0.82rem', cursor: loading || disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${danger ? 'rgba(220,38,38,0.4)' : 'rgba(37,99,235,0.4)'}`,
      background: danger ? 'rgba(220,38,38,0.1)' : 'rgba(37,99,235,0.1)',
      color: danger ? '#F87171' : '#60A5FA',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s'
    }}
  >
    {loading ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ) : icon}
    {label}
  </button>
);

/* ── Main Alerts view ─────────────────────────── */
const Alerts = ({ socket }) => {
  const [cfg, setCfg]           = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState(null);
  const [calling, setCalling]   = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [actionMsg, setActionMsg]   = useState(null);
  const [log, setLog]           = useState([]);
  const logEndRef               = useRef(null);

  /* load config + log on mount */
  useEffect(() => {
    fetch(`${API_BASE}/api/alert/config`)
      .then(r => r.json()).then(setCfg).catch(() => {});
    fetch(`${API_BASE}/api/alert/log`)
      .then(r => r.json()).then(d => setLog(d.log || [])).catch(() => {});
  }, []);

  /* live alert_event from socket */
  useEffect(() => {
    if (!socket) return;
    const handler = (entry) => {
      setLog(prev => [entry, ...prev].slice(0, 100));
    };
    socket.on('alert_event', handler);
    return () => socket.off('alert_event', handler);
  }, [socket]);

  /* auto-scroll log */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const setField = (key) => (val) => setCfg(prev => ({ ...prev, [key]: val }));

  const saveConfig = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/alert/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const d = await r.json();
      setSaveMsg({ ok: true, text: d.message || 'Saved!' });
    } catch (e) {
      setSaveMsg({ ok: false, text: 'Save failed: ' + e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };

  const doCall = async () => {
    setCalling(true); setActionMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/alert/call`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await r.json();
      setActionMsg(d.success ? { ok: true,  text: `✓ Call initiated — SID: ${d.sid}` }
                              : { ok: false, text: `✗ Call failed: ${d.error}` });
    } catch (e) {
      setActionMsg({ ok: false, text: '✗ Network error: ' + e.message });
    } finally {
      setCalling(false);
      setTimeout(() => setActionMsg(null), 8000);
    }
  };

  const doSms = async () => {
    setSmsSending(true); setActionMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/alert/sms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await r.json();
      setActionMsg(d.success ? { ok: true,  text: `✓ SMS sent — SID: ${d.sid}` }
                              : { ok: false, text: `✗ SMS failed: ${d.error}` });
    } catch (e) {
      setActionMsg({ ok: false, text: '✗ Network error: ' + e.message });
    } finally {
      setSmsSending(false);
      setTimeout(() => setActionMsg(null), 8000);
    }
  };

  const credentialsSet = cfg && cfg.account_sid && cfg.from_number && cfg.to_number;

  return (
    <div id="view-alerts" className="dashboard-view active" style={{ overflowY: 'auto', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Header ── */}
        <div className="panel-head" style={{ marginBottom: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Emergency Alert System
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {cfg ? (
              credentialsSet
                ? <StatusPill ok={true} label="CONFIGURED" />
                : <StatusPill ok={false} label="CREDENTIALS MISSING" />
            ) : <StatusPill ok={false} label="LOADING…" />}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT: Config Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Twilio credentials */}
            <div className="display-panel">
              <div className="panel-head" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem' }}>Twilio Credentials</h3>
                <a href="https://console.twilio.com" target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.7rem', color: '#60A5FA', textDecoration: 'none' }}>
                  Open Twilio Console ↗
                </a>
              </div>

              {!cfg ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field id="account-sid" label="Account SID" value={cfg.account_sid || ''} onChange={setField('account_sid')}
                      placeholder="ACxxxxxxxxxxxxxxxx" monospace />
                    <Field id="auth-token" label="Auth Token" type="password" value={cfg.auth_token || ''} onChange={setField('auth_token')}
                      placeholder="••••••••••••••••••••••" monospace />
                    <Field id="from-number" label="Twilio Phone (From)" value={cfg.from_number || ''} onChange={setField('from_number')}
                      placeholder="+1234567890" hint="Must be a Twilio-verified number" />
                    <Field id="to-number" label="Emergency Contact (To)" value={cfg.to_number || ''} onChange={setField('to_number')}
                      placeholder="+0987654321" hint="Number that receives alert calls/SMS" />
                  </div>
                  <Field id="twiml-url" label="TwiML URL (voice message)" value={cfg.twiml_url || ''} onChange={setField('twiml_url')}
                    placeholder="https://handler.twilio.com/twiml/..." hint="Twilio Bin URL that speaks the emergency message" />
                </div>
              )}
            </div>

            {/* SMS Body Template */}
            <div className="display-panel">
              <div className="panel-head" style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.85rem' }}>SMS Message Template</h3>
              </div>
              {cfg && (
                <>
                  <textarea
                    id="sms-body"
                    value={cfg.sms_body || ''}
                    onChange={e => setField('sms_body')(e.target.value)}
                    rows={3}
                    className="premium-input"
                    style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', boxSizing: 'border-box' }}
                    placeholder="🚨 ACCIDENT DETECTED at {timestamp}…"
                  />
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Available variables: <code style={{ color: '#60A5FA' }}>{'{timestamp}'}</code>, <code style={{ color: '#60A5FA' }}>{'{probability}'}</code>, <code style={{ color: '#60A5FA' }}>{'{location}'}</code>, <code style={{ color: '#60A5FA' }}>{'{plate}'}</code>
                  </div>
                </>
              )}
            </div>

            {/* Automation toggles */}
            <div className="display-panel">
              <div className="panel-head" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem' }}>Auto-Alert Triggers</h3>
              </div>
              {cfg && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Toggle
                    id="toggle-auto-call"
                    label="Auto-Call on Accident Detection"
                    checked={!!cfg.auto_call}
                    onChange={setField('auto_call')}
                    description="Automatically calls the emergency contact number when an accident is confirmed"
                  />
                  <Toggle
                    id="toggle-auto-sms"
                    label="Auto-SMS on Accident Detection"
                    checked={!!cfg.auto_sms}
                    onChange={setField('auto_sms')}
                    description="Automatically sends an SMS with accident details when an accident is confirmed"
                  />
                </div>
              )}
            </div>

            {/* Save + .env hint */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  id="btn-save-alert-config"
                  onClick={saveConfig}
                  disabled={saving || !cfg}
                  className="btn-premium btn-start"
                  style={{ opacity: saving || !cfg ? 0.6 : 1 }}
                >
                  {saving ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {saving ? 'Saving…' : 'Save Configuration'}
                </button>
                {saveMsg && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: saveMsg.ok ? '#16A34A' : '#DC2626' }}>
                    {saveMsg.text}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0.5rem 0.75rem',
                background: 'rgba(37,99,235,0.06)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.15)'
              }}>
                💡 <strong>Persistence:</strong> Config is saved in memory for this session. For permanent settings add these to your <code>.env</code> file:<br />
                <code>TWILIO_ACCOUNT_SID=&nbsp;TWILIO_AUTH_TOKEN=&nbsp;TWILIO_PHONE_NUMBER=&nbsp;DESTINATION_PHONE_NUMBER=</code>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Test Panel + Log ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Manual test */}
            <div className="display-panel">
              <div className="panel-head" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem' }}>Manual Test</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ActionBtn
                  id="btn-test-call"
                  label={calling ? 'Calling…' : 'Test Emergency Call'}
                  loading={calling}
                  disabled={!credentialsSet}
                  danger
                  onClick={doCall}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  }
                />
                <ActionBtn
                  id="btn-test-sms"
                  label={smsSending ? 'Sending…' : 'Test SMS'}
                  loading={smsSending}
                  disabled={!credentialsSet}
                  onClick={doSms}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  }
                />
                {!credentialsSet && (
                  <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600, padding: '0.4rem 0' }}>
                    ⚠ Fill in all credentials to enable test buttons
                  </div>
                )}
                {actionMsg && (
                  <div style={{
                    padding: '0.6rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                    background: actionMsg.ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                    color: actionMsg.ok ? '#16A34A' : '#DC2626',
                    border: `1px solid ${actionMsg.ok ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
                    wordBreak: 'break-all'
                  }}>
                    {actionMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* Alert Log */}
            <div className="display-panel" style={{ flex: '1 1 auto' }}>
              <div className="panel-head" style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.85rem' }}>Alert Log</h3>
                <span className="stat-badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#60A5FA' }}>
                  {log.length}
                </span>
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {log.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    No alert events yet. Configure and test above.
                  </div>
                ) : (
                  log.map((entry, i) => (
                    <div key={entry.id ?? i} style={{
                      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                      padding: '0.5rem 0.65rem', borderRadius: 8,
                      background: entry.success ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
                      border: `1px solid ${entry.success ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)'}`,
                      animation: i === 0 ? 'fadeIn 0.3s ease' : undefined,
                    }}>
                      <span style={{ color: entry.success ? '#16A34A' : '#DC2626', marginTop: 1, flexShrink: 0 }}>
                        <LogIcon type={entry.type} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: entry.success ? '#16A34A' : '#DC2626' }}>
                          {entry.message}
                        </div>
                        {entry.detail && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                            {entry.detail}
                          </div>
                        )}
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {fmtTime(entry.timestamp)} · {entry.type?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Alerts;
