import React from 'react';

const Support = () => {
    return (
        <div id="view-support" className="dashboard-view active">
            <div className="support-layout">
                <div className="support-header">
                    <h1>How can we help?</h1>
                    <p>Premium support for SmartResQ Enterprise deployments</p>
                </div>
                <div className="support-grid">
                    <div className="support-card">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                            Documentation
                        </h3>
                        <p>Learn how to calibrate AI models and integrate custom camera sensors in your deployment.</p>
                        <a href="#">Explore Wiki &rarr;</a>
                    </div>
                    <div className="support-card">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                            API Reference
                        </h3>
                        <p>Technical documentation for neural stream hooks and real-time detection endpoints.</p>
                        <a href="#">Read Docs &rarr;</a>
                    </div>
                    <div className="support-card highlighted">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            Live Debug
                        </h3>
                        <p>Connect to a system engineer in real-time for immediate technical assistance.</p>
                        <button className="btn-premium btn-start" style={{ marginTop: '0.5rem' }}>Init Session</button>
                    </div>
                </div>
                <div className="system-diagnostics">
                    <h4>System Pulse</h4>
                    <div className="log-viewer" id="liveLogs">
                        <div className="log-line">[16:45:01] Neural Engine Loaded Successfully</div>
                        <div className="log-line">[16:45:02] Socket Server Listening on Port 5000</div>
                        <div className="log-line">[16:45:05] Camera Handshake: SUCCESS (Type: 1080p_WEB)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
