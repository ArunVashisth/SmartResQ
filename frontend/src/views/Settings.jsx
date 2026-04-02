import React from 'react';

const Settings = () => {
    return (
        <div id="view-settings" className="dashboard-view active">
            <div className="settings-page">
                <div className="panel-head" style={{ marginBottom: '2rem' }}>
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        Core Calibration
                    </h3>
                </div>

                <div className="settings-tabs">
                    <button className="settings-tab active">Video Analytics</button>
                    <button className="settings-tab">System Thresholds</button>
                    <button className="settings-tab">API Webhooks</button>
                    <button className="settings-tab">Hardware</button>
                </div>

                <div className="settings-content">
                    <div className="settings-group">
                        <h4>Vision Parameters</h4>
                        <div className="settings-grid-3">
                            <div className="input-group">
                                <label>INPUT SOURCE</label>
                                <select id="setting-source" className="premium-input">
                                    <option value="0">Camera 01 (Integrated)</option>
                                    <option value="1">Camera 02 (Auxiliary)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>DETECTION THRESHOLD</label>
                                <input type="range" min="50" max="100" defaultValue="99" className="premium-range" />
                            </div>
                            <div className="input-group">
                                <label>OCR MODEL</label>
                                <select className="premium-input">
                                    <option>EASY_OCR_V2</option>
                                    <option>TESSERACT_LTS</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="settings-group">
                        <h4>Notification Matrix</h4>
                        <div className="toggle-list">
                            <div className="toggle-item">
                                <span>SYSTEM ALERTS (BROWSER)</span>
                                <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
                            </div>
                            <div className="toggle-item">
                                <span>SMS GATEWAY (TWILIO)</span>
                                <label className="switch"><input type="checkbox" /><span className="slider"></span></label>
                            </div>
                            <div className="toggle-item">
                                <span>EMAIL REPORTS</span>
                                <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="btn-premium btn-start" style={{ padding: '0.75rem 2.5rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Sync Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
