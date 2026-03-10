// Smart Resq - Premium Intelligence Dashboard JS
const socket = io();

// State & Config
let systemRunning = false;
let startTime = null;
let uptimeInterval = null;
let accidents = [];
let frequencyChart = null;
let waveformChart = null;

// DOM Elements (Cached lazily or during init)
let videoCanvas = null;
let monitoringCanvas = null;

function findCanvases() {
    videoCanvas = document.getElementById('videoCanvas');
    monitoringCanvas = document.getElementById('monitoringCanvas');
}

const stats = {
    totalAccidents: document.getElementById('totalAccidents'),
    totalPlates: document.getElementById('totalPlates'),
    framesProcessed: document.getElementById('framesProcessed'),
    uptime: document.getElementById('uptime')
};

// Initialize Charts – guarded with null checks and destruction to prevent reuse errors
// Initialize Charts – using global Chart.getChart() for robust destruction
function initCharts() {
    // Frequency Chart (Overview)
    const freqCanvas = document.getElementById('frequencyChart');
    if (freqCanvas && typeof Chart !== 'undefined') {
        const existing = Chart.getChart(freqCanvas);
        if (existing) existing.destroy();

        frequencyChart = new Chart(freqCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Intensity',
                    data: [],
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { display: false } },
                animation: { duration: 0 }
            }
        });
    }

    // Waveform Chart (Monitoring)
    const waveCanvas = document.getElementById('monitoringWaveform');
    if (waveCanvas && typeof Chart !== 'undefined') {
        const existing = Chart.getChart(waveCanvas);
        if (existing) existing.destroy();

        waveformChart = new Chart(waveCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(50).fill(''),
                datasets: [{
                    data: Array(50).fill(0),
                    borderColor: '#2563EB',
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 0, max: 100, display: false },
                    x: { display: false }
                },
                animation: { duration: 0 }
            }
        });
    }
}

// Global View Switching
function switchView(viewId) {
    // Show Nav Info Badge
    const infoBadge = document.getElementById('navInfoBadge');
    if (infoBadge) {
        const viewDisplay = viewId.replace(/-/g, ' ').toUpperCase();
        infoBadge.querySelector('.info-text').textContent = `NAVIGATING TO ${viewDisplay}`;
        infoBadge.style.transition = 'opacity 0.3s ease';
        infoBadge.style.display = 'flex';
        infoBadge.style.opacity = '1';
        clearTimeout(window._navInfoTimeout);
        window._navInfoTimeout = setTimeout(() => {
            infoBadge.style.opacity = '0';
            setTimeout(() => { infoBadge.style.display = 'none'; }, 300);
        }, 2000);
    }

    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(viewId)) {
            item.classList.add('active');
        }
    });

    // Update Content
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.remove('active');
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.add('active');

        // Re-find canvases in case of DOM changes or visibility shifts
        if (typeof findCanvases === 'function') findCanvases();

        // Load data if needed
        if (viewId === 'archive') loadArchives();

        // Re-init charts when switching home if they got cleared
        if (viewId === 'overview' || viewId === 'monitoring') {
            initCharts();
        }

        // Trigger a fake Resize event to let canvases sync
        window.dispatchEvent(new Event('resize'));
    }
}

// Socket Events
socket.on('connect', () => showToast('NEURAL LINK ESTABLISHED', 'success'));

socket.on('system_status', (data) => {
    updateSystemUI(data.status === 'running');
});

socket.on('accident_detected', (data) => {
    addAccident(data);
    showToast(`CRITICAL ACCIDENT: ${data.probability.toFixed(1)}%`, 'error');
    addLogLine(`[ACCIDENT] High probability collision detected: ${data.probability.toFixed(1)}%`);
});

socket.on('plate_detected', (data) => {
    // updateLatestPlate(data.text); // This function is removed, so commenting out or removing this line
    showToast(`PLATE IDENTIFIED: ${data.text}`, 'success');
});

socket.on('frame_update', (data) => {
    if (stats.framesProcessed) stats.framesProcessed.textContent = data.frame_count;

    // Update charts if data exists
    if (waveformChart && data.probability !== undefined) {
        const isMonitorActive = document.getElementById('view-monitoring').classList.contains('active');
        if (isMonitorActive) {
            waveformChart.data.datasets[0].data.push(data.probability * 100);
            waveformChart.data.datasets[0].data.shift();
            waveformChart.update();
        }
    }

    if (data.frame) {
        const img = new Image();
        img.onload = () => {
            const canvases = [videoCanvas, monitoringCanvas];
            canvases.forEach(canv => {
                if (!canv) return;

                const view = canv.closest('.dashboard-view');
                const isActive = view && view.classList.contains('active');
                if (!isActive) return;

                if (canv.style.display !== 'block') {
                    canv.style.display = 'block';
                    canv.style.opacity = '1';
                    canv.style.zIndex = '10'; // Above placeholder
                    const phId = canv.id === 'videoCanvas' ? 'videoPlaceholder' : 'monitoringPlaceholder';
                    const ph = document.getElementById(phId);
                    if (ph) {
                        ph.style.display = 'none';
                        ph.style.visibility = 'hidden';
                    }
                }

                if (canv.width !== img.width || canv.height !== img.height) {
                    canv.width = img.width;
                    canv.height = img.height;
                }

                const ctx = canv.getContext('2d');
                ctx.drawImage(img, 0, 0);

                if (canv.id === 'monitoringCanvas') {
                    const fpsEl = document.getElementById('mon-fps');
                    const resEl = document.getElementById('mon-res');
                    if (fpsEl) fpsEl.textContent = `${Math.round(1000 / (Date.now() - (window._lastFrameTime || Date.now() - 33)))} FPS`;
                    if (resEl) resEl.textContent = `${img.width}x${img.height}`;
                    window._lastFrameTime = Date.now();
                }
            });
        };
        img.src = `data:image/jpeg;base64,${data.frame}`;
    }
});

// System Controls
async function startSystem() {
    try {
        const res = await fetch('/api/start', { method: 'POST' });
        if (res.ok) {
            showToast('SYSTEM LAUNCHED', 'success');
            updateSystemUI(true);
            addLogLine('[SYSTEM] Mission launched. All sensors active.');
        }
    } catch (e) {
        showToast('LAUNCH FAILED', 'error');
    }
}

async function stopSystem() {
    try {
        const res = await fetch('/api/stop', { method: 'POST' });
        if (res.ok) {
            showToast('MISSION ABORTED', 'warning');
            updateSystemUI(false);
            addLogLine('[SYSTEM] Mission aborted. Cleanup in progress.');
        }
    } catch (e) {
        showToast('ABORT FAILED', 'error');
    }
}

function updateSystemUI(running) {
    systemRunning = running;
    statusIndicator?.classList.toggle('active', running);
    if (statusText) statusText.textContent = running ? 'MONITORING ACTIVE' : 'SYSTEM READY';
    if (startBtn) startBtn.style.display = running ? 'none' : 'flex';
    if (stopBtn) stopBtn.style.display = running ? 'flex' : 'none';
    liveBadge?.classList.toggle('live', running);

    // detectionStatus is an optional element — access lazily
    const detEl = document.getElementById('detectionStatus');
    if (detEl) detEl.textContent = running ? 'ACTIVE SCAN' : 'STANDBY';

    if (videoCanvas && !running) videoCanvas.style.display = 'none';
    if (monitoringCanvas && !running) monitoringCanvas.style.display = 'none';

    if (!running) {
        ['videoPlaceholder', 'monitoringPlaceholder'].forEach(id => {
            const ph = document.getElementById(id);
            if (ph) {
                ph.style.display = 'flex';
                ph.style.visibility = 'visible';
                ph.style.opacity = '1';
            }
        });
    }

    if (running) {
        startTime = Date.now();
        if (uptimeInterval) clearInterval(uptimeInterval);
        uptimeInterval = setInterval(updateUptime, 1000);
    } else {
        if (uptimeInterval) clearInterval(uptimeInterval);
    }
}


// Data Handling
function addAccident(acc) {
    accidents.unshift(acc);
    stats.totalAccidents.textContent = accidents.length;
    renderAccidents();
}

// function updateLatestPlate(plateText) { // This function is removed
//     if (accidents.length > 0) {
//         accidents[0].plate_text = plateText;
//         stats.totalPlates.textContent = parseInt(stats.totalPlates.textContent) + 1;
//         renderAccidents();
//     }
// }

function renderAccidents() {
    const html = accidents.slice(0, 5).map(acc => `
        <div class="history-card">
            <div class="incident-header">
                <span>🚨 ACCIDENT</span>
                <span>${new Date(acc.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="incident-meta">CONFIDENCE: ${acc.probability.toFixed(1)}%</div>
        </div>
    `).join('');

    if (accidentsListOverview) accidentsListOverview.innerHTML = html || '<div class="empty-state">NO RECENT INCIDENTS</div>';

    const archiveHtml = accidents.map(acc => `
        <tr>
            <td>#${acc.id || 'N/A'}</td>
            <td>${new Date(acc.timestamp).toLocaleString()}</td>
            <td><span class="stat-badge" style="background: rgba(239,68,68,0.1); color: var(--danger)">COLLISION</span></td>
            <td>${acc.probability.toFixed(1)}%</td>
            <td><button class="btn-icon">👁️</button></td>
        </tr>
    `).join('');
    if (archiveList) archiveList.innerHTML = archiveHtml;
}

function addLogLine(msg) {
    const logViewer = document.getElementById('liveLogs');
    if (logViewer) {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logViewer.prepend(line);
    }
}

// function updateChart(isAccident) { // This function is removed
//     if (!frequencyChart) return;

//     const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
//     frequencyChart.data.labels.push(time);
//     frequencyChart.data.datasets[0].data.push(Math.random() * 50 + 20); // Sim scan intensity
//     frequencyChart.data.datasets[1].data.push(isAccident ? 80 : null);

//     if (frequencyChart.data.labels.length > 20) {
//         frequencyChart.data.labels.shift();
//         frequencyChart.data.datasets[0].data.shift();
//         frequencyChart.data.datasets[1].data.shift();
//     }
//     frequencyChart.update();
// }

// Tooling
function showToast(msg, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const toast = document.createElement('div');
    toast.className = 'fancy-toast';
    // const icon = type === 'success' ? '✅' : type === 'error' ? '🚨' : 'ℹ️'; // Original icon logic removed

    toast.innerHTML = `<div><strong>${type.toUpperCase()}</strong><br><small>${msg}</small></div>`; // Simplified toast content

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function updateUptime() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
    const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
    const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    stats.uptime.textContent = `${hh}:${mm}:${ss}`;
}

async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const config = await res.json();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        set('videoSource', config.video_source);
        set('ocrEngine', config.ocr_engine);
        set('threshold', config.accident_threshold);
        set('frameSkip', config.frame_skip);
        // Also seed the VA threshold slider if it exists
        set('vaThreshold', config.accident_threshold);
        const tvEl = document.getElementById('vaThresholdVal');
        if (tvEl) tvEl.textContent = config.accident_threshold + '%';
    } catch (_) { }
}

async function saveConfig() {
    const get = (id, fallback) => { const el = document.getElementById(id); return el ? el.value : fallback; };
    const config = {
        video_source: get('videoSource', '0'),
        ocr_engine: get('ocrEngine', 'easyocr'),
        accident_threshold: parseFloat(get('threshold', '99')),
        frame_skip: parseInt(get('frameSkip', '5'))
    };
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (res.ok) showToast('NEURAL TUNING SAVED', 'success');
    } catch (_) {
        showToast('SAVE FAILED', 'error');
    }
}


function toggleSettings() {
    showToast('SETTINGS PANEL ACCESSIBLE ON RIGHT', 'info');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Redundant init removed. Unified at bottom of file.

// ─────────────────────────────────────────────────────────
//  VIDEO ANALYSIS MODULE
// ─────────────────────────────────────────────────────────

// DOM refs (lazy, grabbed on first use)
function vaEl(id) { return document.getElementById(id); }

const VA_STATUS_COLORS = {
    idle: { bg: 'rgba(100,116,139,0.2)', color: '#64748b' },
    ready: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    analyzing: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    complete: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    error: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    stopped: { bg: 'rgba(100,116,139,0.15)', color: '#64748b' }
};

function vaSetStatus(status, label) {
    const badge = vaEl('va-status-badge');
    if (!badge) return;
    const c = VA_STATUS_COLORS[status] || VA_STATUS_COLORS.idle;
    badge.style.background = c.bg;
    badge.style.color = c.color;
    badge.textContent = label || status.toUpperCase();
}

/* ── Drag & Drop ── */
function vaDragOver(e) {
    e.preventDefault();
    vaEl('vaDropZone').classList.add('drag-over');
}
function vaDragLeave(e) {
    vaEl('vaDropZone').classList.remove('drag-over');
}
function vaDrop(e) {
    e.preventDefault();
    vaEl('vaDropZone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) vaUploadFile(file);
}
function vaFileSelected(e) {
    const file = e.target.files[0];
    if (file) vaUploadFile(file);
}

/* ── Upload ── */
function vaUploadFile(file) {
    vaSetStatus('uploading', 'UPLOADING');

    // Show upload progress bar
    const upProg = vaEl('vaUploadProgress');
    const upBar = vaEl('vaUploadBar');
    upProg.style.display = 'block';
    upBar.style.width = '0%';

    // Hide existing controls & info
    vaEl('vaInfoGrid').style.display = 'none';
    vaEl('vaControls').style.display = 'none';
    vaEl('vaThresholdRow').style.display = 'none';
    vaEl('vaProgressPanel').style.display = 'none';

    const fd = new FormData();
    fd.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-video');

    xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
            upBar.style.width = Math.round((ev.loaded / ev.total) * 100) + '%';
        }
    };

    xhr.onload = () => {
        upProg.style.display = 'none';
        try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && res.success) {
                vaShowVideoInfo(res.video_info);
                vaSetStatus('ready', 'READY');
                showToast('VIDEO UPLOADED', 'success');
                addLogLine(`[VA] Video loaded: ${res.video_info.name} (${res.video_info.duration_seconds}s)`);
            } else {
                vaSetStatus('error', 'ERROR');
                showToast('UPLOAD FAILED: ' + (res.error || 'Unknown error'), 'error');
            }
        } catch (_) {
            vaSetStatus('error', 'ERROR');
            showToast('UPLOAD FAILED', 'error');
        }
    };

    xhr.onerror = () => {
        upProg.style.display = 'none';
        vaSetStatus('error', 'ERROR');
        showToast('UPLOAD FAILED – Network error', 'error');
    };

    xhr.send(fd);
}

function vaShowVideoInfo(info) {
    vaEl('vaInfoName').textContent = info.name;
    vaEl('vaInfoDuration').textContent = info.duration_seconds + 's';
    vaEl('vaInfoFrames').textContent = info.total_frames.toLocaleString();
    vaEl('vaInfoFps').textContent = info.fps;
    vaEl('vaInfoRes').textContent = info.resolution || '—';

    vaEl('vaInfoGrid').style.display = 'grid';
    vaEl('vaControls').style.display = 'flex';
    vaEl('vaThresholdRow').style.display = 'flex';

    // Reset timeline display
    vaEl('vaTimeline').innerHTML = '<div class="empty-state" id="vaTimelineEmpty">NO ACCIDENTS DETECTED YET</div>';
    vaEl('vaTimelineCount').textContent = '0';

    // Reset progress display
    vaEl('vaProgressPanel').style.display = 'none';
    vaEl('vaProgressBar').style.width = '0%';
    vaEl('vaProgressPct').textContent = '0%';
    vaEl('vaProgFrames').textContent = '0';
    vaEl('vaProgTotal').textContent = info.total_frames.toLocaleString();
    vaEl('vaProgAccidents').textContent = '0';
}

/* ── Polling fallback (1 s interval while analysis is active) ──
   SocketIO events are missed when the WebSocket transport drops and
   re-negotiates mid-analysis. This HTTP poll guarantees the UI always
   reflects the real server state regardless of socket health.      */
let _vaPoller = null;
let _vaLastSeenFrame = -1;

function vaStartPoller() {
    if (_vaPoller) return;
    _vaLastSeenFrame = -1;
    _vaPoller = setInterval(async () => {
        try {
            const res = await fetch('/api/video-analysis/status');
            if (!res.ok) return;
            const s = await res.json();

            if (s.processed_frames === _vaLastSeenFrame) return;
            _vaLastSeenFrame = s.processed_frames;

            // Progress bar
            const pct = s.progress_percent || 0;
            const pBar = vaEl('vaProgressBar');
            if (pBar) pBar.style.width = pct + '%';
            const pTxt = vaEl('vaProgressPct');
            if (pTxt) pTxt.textContent = pct.toFixed(1) + '%';
            const frEl = vaEl('vaProgFrames');
            if (frEl) frEl.textContent = (s.processed_frames || 0).toLocaleString();
            const totEl = vaEl('vaProgTotal');
            if (totEl && s.total_frames) totEl.textContent = s.total_frames.toLocaleString();

            // Accidents (add only new ones)
            const serverAcc = s.accidents_found || [];
            const knownCount = parseInt(vaEl('vaTimelineCount')?.textContent || '0');
            for (let i = knownCount; i < serverAcc.length; i++) vaAddTimelineItem(serverAcc[i]);
            const accEl = vaEl('vaProgAccidents');
            if (accEl) accEl.textContent = serverAcc.length;

            // Frame from poller (fallback for SocketIO)
            if (s.last_frame) vaDrawFrame(s.last_frame);

            // Terminal states
            if (s.status === 'complete') {
                vaStopPoller();
                vaSetStatus('complete', 'COMPLETE');
                if (vaEl('vaStartBtn')) vaEl('vaStartBtn').style.display = 'flex';
                if (vaEl('vaStopBtn')) vaEl('vaStopBtn').style.display = 'none';
                if (vaEl('vaFeedStatus')) vaEl('vaFeedStatus').style.opacity = '0';
                if (pBar) pBar.style.width = '100%';
                if (pTxt) pTxt.textContent = '100%';
                const n = serverAcc.length;
                showToast(`ANALYSIS COMPLETE \u2014 ${n} accidents in ${s.total_frames} frames`, 'success');
                addLogLine(`[VA] Complete \u2014 ${n} accidents detected.`);
            } else if (s.status === 'error') {
                vaStopPoller();
                vaSetStatus('error', 'ERROR');
                if (vaEl('vaStartBtn')) vaEl('vaStartBtn').style.display = 'flex';
                if (vaEl('vaStopBtn')) vaEl('vaStopBtn').style.display = 'none';
                showToast('ANALYSIS ERROR: ' + (s.error || 'Unknown'), 'error');
            } else if (s.status === 'stopped') {
                vaStopPoller();
            }
        } catch (_) { }
    }, 1000);
}

function vaStopPoller() {
    if (_vaPoller) { clearInterval(_vaPoller); _vaPoller = null; }
}

/* ── Start Analysis ── */
async function vaStartAnalysis() {
    const threshold = parseFloat(vaEl('vaThreshold').value) || 99;

    try {
        const res = await fetch('/api/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threshold, frame_skip: 5 })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            vaSetStatus('analyzing', 'ANALYZING');
            vaEl('vaStartBtn').style.display = 'none';
            vaEl('vaStopBtn').style.display = 'flex';
            vaEl('vaProgressPanel').style.display = 'block';

            // Show frame canvas
            vaEl('vaPlaceholder').style.display = 'none';
            vaEl('vaCanvas').style.display = 'block';

            // Show scanning badge
            const badge = vaEl('vaFeedStatus');
            if (badge) badge.style.opacity = '1';

            addLogLine(`[VA] Analysis started. Threshold: ${threshold}%`);
            showToast('ANALYSIS STARTED', 'info');

            vaStartPoller();   // ← polling fallback starts immediately
        } else {
            showToast('START FAILED: ' + (data.error || 'Unknown'), 'error');
        }
    } catch (e) {
        showToast('START FAILED', 'error');
    }
}


/* ── Stop Analysis ── */
async function vaStopAnalysis() {
    vaStopPoller();
    try {
        await fetch('/api/video-analysis/stop', { method: 'POST' });
        vaSetStatus('stopped', 'STOPPED');
        vaEl('vaStartBtn').style.display = 'flex';
        vaEl('vaStopBtn').style.display = 'none';
        if (vaEl('vaFeedStatus')) vaEl('vaFeedStatus').style.opacity = '0';
        addLogLine('[VA] Analysis stopped by user.');
        showToast('ANALYSIS STOPPED', 'warning');
    } catch (e) {
        showToast('STOP FAILED', 'error');
    }
}

/* ── Reset ── */
async function vaReset() {
    vaStopPoller();
    try {
        await fetch('/api/video-analysis/reset', { method: 'POST' });
    } catch (_) { }

    vaSetStatus('idle', 'IDLE');
    vaEl('vaInfoGrid').style.display = 'none';
    vaEl('vaControls').style.display = 'none';
    vaEl('vaThresholdRow').style.display = 'none';
    vaEl('vaProgressPanel').style.display = 'none';
    vaEl('vaStartBtn').style.display = 'flex';
    vaEl('vaStopBtn').style.display = 'none';
    vaEl('vaCanvas').style.display = 'none';
    vaEl('vaPlaceholder').style.display = 'flex';
    vaEl('vaFeedStatus').style.opacity = '0';
    vaEl('vaTimeline').innerHTML = '<div class="empty-state" id="vaTimelineEmpty">NO ACCIDENTS DETECTED YET</div>';
    vaEl('vaTimelineCount').textContent = '0';

    // Reset file input so same file can be re-selected
    const fi = vaEl('vaFileInput');
    if (fi) fi.value = '';

    addLogLine('[VA] Reset. Ready for new video.');
    showToast('ANALYSIS RESET', 'info');
}

/* ── SocketIO listeners ── */
socket.on('video_analysis_progress', (data) => {
    // Progress bar
    const pct = data.progress || 0;
    vaEl('vaProgressBar').style.width = pct + '%';
    vaEl('vaProgressPct').textContent = pct.toFixed(1) + '%';
    vaEl('vaProgFrames').textContent = (data.frame_count || 0).toLocaleString();
    if (data.total_frames) vaEl('vaProgTotal').textContent = data.total_frames.toLocaleString();
    vaEl('vaProgAccidents').textContent = data.accidents_so_far || 0;

    // Prediction badge
    if (data.current_pred) {
        const isAcc = data.current_pred === 'Accident';
        const predEl = vaEl('vaCurrentPred');
        predEl.textContent = isAcc
            ? `🚨 ACCIDENT ${data.current_prob ? data.current_prob.toFixed(1) + '%' : ''}`
            : 'NO ACCIDENT';
        predEl.style.background = isAcc ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)';
        predEl.style.color = isAcc ? 'var(--danger)' : 'var(--success)';
    }

    // Frame preview
    if (data.frame) vaDrawFrame(data.frame);
});

/* ── Render frame to VA Canvas ── */
function vaDrawFrame(base64) {
    const canvas = vaEl('vaCanvas');
    if (!canvas) return;

    // Ensure canvas is visible if we are receiving frames
    if (canvas.style.display === 'none') {
        canvas.style.display = 'block';
        const placeholder = vaEl('vaPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
    }

    const img = new Image();
    img.onload = () => {
        // Match buffer to image to avoid stretching
        if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
}

socket.on('video_analysis_accident', (acc) => {
    vaAddTimelineItem(acc);
    showToast(`⚡ ACCIDENT @ ${acc.timestamp_str} — ${acc.probability.toFixed(1)}%`, 'error');
    addLogLine(`[VA] Accident detected at ${acc.timestamp_str} (frame ${acc.frame}, ${acc.probability.toFixed(1)}%)`);
});

socket.on('video_analysis_complete', (data) => {
    vaSetStatus('complete', 'COMPLETE');
    vaEl('vaStartBtn').style.display = 'flex';
    vaEl('vaStopBtn').style.display = 'none';
    vaEl('vaFeedStatus').style.opacity = '0';
    vaEl('vaProgressBar').style.width = '100%';
    vaEl('vaProgressPct').textContent = '100%';

    const msg = `ANALYSIS COMPLETE — ${data.accidents ? data.accidents.length : 0} accidents in ${data.total_frames} frames`;
    showToast(msg, 'success');
    addLogLine(`[VA] ${msg}`);
});

socket.on('video_analysis_error', (data) => {
    vaSetStatus('error', 'ERROR');
    vaEl('vaStartBtn').style.display = 'flex';
    vaEl('vaStopBtn').style.display = 'none';
    vaEl('vaFeedStatus').style.opacity = '0';
    showToast('ANALYSIS ERROR: ' + data.error, 'error');
    addLogLine(`[VA] Error: ${data.error}`);
});

socket.on('video_analysis_stopped', () => {
    vaEl('vaFeedStatus').style.opacity = '0';
});

/* ── Timeline ── */
function vaAddTimelineItem(acc) {
    const timeline = vaEl('vaTimeline');

    // Remove empty state
    const empty = vaEl('vaTimelineEmpty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'va-timeline-item';
    item.innerHTML = `
        <div class="va-timeline-body">
            <div class="va-timeline-time">${acc.timestamp_str || '—'}</div>
            <div class="va-timeline-meta">Frame #${acc.frame.toLocaleString()}</div>
        </div>
        <div class="va-timeline-conf">Confidence ${acc.probability.toFixed(1)}%</div>
    `;
    timeline.prepend(item);

    // Update count badge
    const countEl = vaEl('vaTimelineCount');
    countEl.textContent = parseInt(countEl.textContent || '0') + 1;
    vaEl('vaProgAccidents').textContent = countEl.textContent;
}

/* ── Restore state after page reload ── */
async function vaRestoreState() {
    try {
        const res = await fetch('/api/video-analysis/status');
        if (!res.ok) return;
        const state = await res.json();

        if (state.status === 'analyzing' || state.status === 'ready' || state.status === 'complete') {
            // Re-populate info grid
            if (state.video_name) {
                vaShowVideoInfo({
                    name: state.video_name,
                    duration_seconds: state.duration_seconds,
                    total_frames: state.total_frames,
                    fps: state.fps,
                    resolution: '—'
                });
            }

            vaSetStatus(state.status, state.status.toUpperCase());

            if (state.status === 'analyzing') {
                vaEl('vaStartBtn').style.display = 'none';
                vaEl('vaStopBtn').style.display = 'flex';
                vaEl('vaProgressPanel').style.display = 'block';
                vaEl('vaCanvas').style.display = 'block';
                vaEl('vaPlaceholder').style.display = 'none';
                if (vaEl('vaFeedStatus')) vaEl('vaFeedStatus').style.opacity = '1';
                vaStartPoller();   // ← resume polling after page reload
            }

            // Restore accidents found
            if (state.accidents_found && state.accidents_found.length) {
                state.accidents_found.forEach(acc => vaAddTimelineItem(acc));
            }
        }
    } catch (_) { }
}

/* ────────────────────────────────────────────────────────────────
   ARCHIVE MANAGEMENT
   ──────────────────────────────────────────────────────────────── */
async function loadArchives() {
    const list = document.getElementById('archiveList');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">Loading history...</td></tr>';

    try {
        const res = await fetch('/api/archives');
        const data = await res.json();

        if (!data.history || data.history.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#64748b;">No archives found</td></tr>';
            return;
        }

        list.innerHTML = '';
        data.history.forEach(item => {
            const date = new Date(item.created_at || item.start_time);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td>
                    <div style="font-weight:600;color:var(--text-primary)">${dateStr}</div>
                    <div style="font-size:0.7rem;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">${item.video_file}</div>
                </td>
                <td><span class="stat-badge" style="background:rgba(37,99,235,0.1);color:#2563eb;">${item.status.toUpperCase()}</span></td>
                <td>${item.accidents_detected} Detected</td>
                <td>
                    <button class="btn-premium btn-start" style="padding:4px 12px;font-size:0.7rem;" onclick="viewArchiveDetails(${item.id})">
                        VIEW REPORT
                    </button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (e) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger);">Failed to load archives</td></tr>';
    }
}

async function viewArchiveDetails(id) {
    const modal = document.getElementById('archiveModal');
    const body = document.getElementById('modalBody');
    const title = document.getElementById('modalTitle');

    if (!modal || !body) return;

    // Show modal with loading state
    modal.style.display = 'flex';
    body.innerHTML = `
        <div class="report-loading">
            <div class="pulse-ring"></div>
            <span>RETRIVIEING NEURAL DATA...</span>
        </div>
    `;
    title.textContent = `Analysis Report #${id}`;

    try {
        const res = await fetch(`/api/archives/${id}`);
        const data = await res.json();

        if (res.status === 404) {
            body.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--danger)">Analysis record not found.</div>`;
            return;
        }

        const date = new Date(data.created_at || data.start_time);
        const dateStr = date.toLocaleString();

        let accidentsHtml = '';
        if (data.accidents && data.accidents.length > 0) {
            accidentsHtml = `
                <div class="report-accidents-list">
                    <h3 style="margin-bottom:1.5rem;display:flex;align-items:center;gap:10px;">
                        <span style="width:8px;height:8px;background:var(--danger);border-radius:50%"></span>
                        Detected Incidents (${data.accidents.length})
                    </h3>
                    ${data.accidents.map(acc => `
                        <div class="report-accident-item">
                            <img src="/${acc.photo_path}" class="report-accident-img" onerror="this.src='https://via.placeholder.com/240x140?text=Image+Not+Found'">
                            <div class="report-accident-details">
                                <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                                    <span style="font-weight:700;color:var(--danger)">ACCIDENT DETECTED</span>
                                    <span style="color:var(--text-muted);font-size:0.8rem">${acc.timestamp}</span>
                                </div>
                                <div class="report-grid" style="grid-template-columns: 1fr 1fr; gap:1rem;">
                                    <div>
                                        <div class="report-label">Confidence</div>
                                        <div class="report-value">${acc.confidence.toFixed(1)}%</div>
                                    </div>
                                    <div>
                                        <div class="report-label">Location</div>
                                        <div class="report-value">${acc.location || 'Point A-7'}</div>
                                    </div>
                                    <div>
                                        <div class="report-label">License Plate</div>
                                        <div class="report-value">
                                            ${acc.license_plate_detected ?
                    `<span style="color:#16a34a">${acc.license_plate_text || 'Detected'}</span>` :
                    '<span style="color:#94a3b8">Not Found</span>'
                }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            accidentsHtml = `
                <div style="text-align:center;padding:3rem;background:rgba(255,255,255,0.02);border-radius:12px;margin-top:2rem;border:1px dashed var(--border-color)">
                    <p style="color:var(--text-muted)">No accidents detected during this session.</p>
                </div>
            `;
        }

        body.innerHTML = `
            <div class="report-grid">
                <div class="report-summary-card">
                    <div class="report-label">Session Start</div>
                    <div class="report-value">${dateStr}</div>
                </div>
                <div class="report-summary-card">
                    <div class="report-label">Video Source</div>
                    <div class="report-value" style="word-break:break-all">${data.video_file}</div>
                </div>
                <div class="report-summary-card">
                    <div class="report-label">Processing Status</div>
                    <div class="report-value">
                        <span class="stat-badge" style="background:rgba(22,163,74,0.1);color:#16a34a;padding:4px 12px;font-size:0.8rem;">
                            ${data.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="report-summary-card">
                    <div class="report-label">Total Frames</div>
                    <div class="report-value">${data.processed_frames.toLocaleString()}</div>
                </div>
            </div>
            
            ${accidentsHtml}
        `;

    } catch (e) {
        console.error("Error loading archive report:", e);
        body.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--danger)">Failed to synchronize with neural database. Please try again.</div>`;
    }
}

function closeArchiveModal() {
    const modal = document.getElementById('archiveModal');
    if (modal) modal.style.display = 'none';
}

// Close modal on click outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('archiveModal');
    if (e.target === modal) closeArchiveModal();
});

// Initial Kick-off
document.addEventListener('DOMContentLoaded', () => {
    findCanvases();
    initCharts();
    loadConfig();
    vaRestoreState();
    initScrollAnimations();
    addLogLine('[INIT] Smart Resq Intelligence Core Ready.');
});

// Scroll Animations
function initScrollAnimations() {
    const sections = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(sec => observer.observe(sec));
}



