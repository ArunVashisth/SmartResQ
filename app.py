# pyre-ignore-all-errors
import eventlet
eventlet.monkey_patch()

"""
Smart Resq Web Dashboard
Real-time monitoring interface for accident detection system
"""

from typing import Any, Dict, List, Optional, Protocol, Tuple


def fround(x: float, n: int) -> float:
    """Type-checker-friendly round that always returns float."""
    return float(round(x, n))  # type: ignore[call-overload]


class _DetectionModelProtocol(Protocol):
    """Protocol describing the AccidentDetectionModel interface.
    Lets Pyre2 resolve model.predict_accident() without needing the detection import."""
    def predict_accident(self, img: Any) -> Tuple[str, Any]: ...

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading
import base64
import cv2
import numpy as np
from datetime import datetime
import os
import json
import time
import uuid
from werkzeug.utils import secure_filename
from config import Config
from archive_system import ArchiveSystem

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Serve archive files
from flask import send_from_directory
@app.route('/archives/<path:filename>')
def serve_archive(filename):
    return send_from_directory('archives', filename)

# Global state
dashboard_state: Dict[str, Any] = {
    'system_status': 'stopped',
    'accidents': [],
    'current_frame': None,
    'stats': {
        'total_accidents': 0,
        'total_plates_detected': 0,
        'uptime': 0,
        'frames_processed': 0
    },
    'start_time': None
}

# Initialize archive system
archive = ArchiveSystem()

detection_system = None

# Lock to prevent multiple concurrent /api/start calls
_start_lock = threading.Lock()
# Global stop event shared across ALL camera threads so they all stop together
_camera_stop_event = threading.Event()

# Video Analysis State
UPLOAD_FOLDER = 'uploaded_videos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv', 'm4v'}

video_analysis_state: Dict[str, Any] = {
    'status': 'idle',          # idle | uploading | analyzing | complete | error | stopped
    'video_path': None,
    'video_name': None,
    'total_frames': 0,
    'processed_frames': 0,
    'accidents_found': [],
    'progress_percent': 0,
    'fps': 0,
    'duration_seconds': 0,
    'error': None,
    'start_time': None,
    'end_time': None,
    'last_frame': None
}
video_analysis_thread = None
video_analysis_stop_flag = threading.Event()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Main React-based Dashboard Entry Point"""
    return render_template('react_dashboard.html')


@app.route('/legacy-dashboard')
def legacy_dashboard():
    """Backup of the original HTML Dashboard"""
    return render_template('dashboard.html')


@app.route('/api/status')
def get_status():
    """Get current system status"""
    return jsonify(dashboard_state)


@app.route('/api/accidents')
def get_accidents():
    """Get list of detected accidents"""
    accidents: List[Any] = list(dashboard_state['accidents'])
    return jsonify({
        'accidents': accidents,
        'total': len(accidents)
    })


@app.route('/api/accidents/<int:accident_id>')
def get_accident_detail(accident_id):
    """Get details of a specific accident"""
    accidents: List[Any] = list(dashboard_state['accidents'])
    if accident_id < len(accidents):
        return jsonify(accidents[accident_id])
    return jsonify({'error': 'Accident not found'}), 404


# ─────────────────────────────────────────────
# ARCHIVE ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/api/archives')
def get_archives():
    """Get list of past analysis sessions"""
    history = archive.get_analysis_history(limit=50)
    return jsonify({'history': history})

@app.route('/api/archives/<int:analysis_id>')
def get_archive_detail(analysis_id):
    """Get details of a specific analysis session"""
    details = archive.get_analysis_details(analysis_id)
    if details:
        return jsonify(details)
    return jsonify({'error': 'Analysis not found'}), 404

@app.route('/api/stats')
def get_total_stats():
    """Get overall system statistics"""
    return jsonify(archive.get_total_stats())


# ─────────────────────────────────────────────
# ALERT / EMERGENCY NOTIFICATION ENDPOINTS
# ─────────────────────────────────────────────

# In-memory alert log (last 100 events)
_alert_log: List[Dict[str, Any]] = []

# Runtime-overridable credentials (start from Config / .env)
_alert_config: Dict[str, Any] = {
    # Twilio (voice calls + fallback SMS)
    'account_sid':       Config.TWILIO_ACCOUNT_SID        or '',
    'auth_token':        Config.TWILIO_AUTH_TOKEN          or '',
    'from_number':       Config.TWILIO_PHONE_NUMBER        or '',
    'to_number':         Config.DESTINATION_PHONE_NUMBER   or '',
    'twiml_url':         Config.TWILIO_TWIML_URL           or '',
    # Fast2SMS (primary SMS provider — ideal for Indian numbers)
    'fast2sms_api_key':  Config.FAST2SMS_API_KEY           or '',
    'fast2sms_numbers':  Config.DESTINATION_PHONE_NUMBER   or '',  # comma-separated Indian numbers
    # Behaviour flags
    'auto_call':         True,   # auto voice-call on accident
    'auto_sms':          True,   # auto SMS on accident
    'sms_provider':      'fast2sms',  # 'fast2sms' | 'twilio' | 'both'
    'sms_body':          '[URGENT] ACCIDENT DETECTED by Smart Resq at {timestamp}. Confidence: {probability:.1f}%. Loc: {location}. Plate: {plate}.',
}


def _log_alert(event_type: str, message: str, success: bool, detail: str = '') -> None:
    """Append to in-memory alert log and broadcast via socket."""
    entry: Dict[str, Any] = {
        'id':        len(_alert_log) + 1,
        'type':      event_type,   # 'call' | 'sms' | 'config' | 'error'
        'message':   message,
        'success':   success,
        'detail':    detail,
        'timestamp': datetime.now().isoformat(),
    }
    _alert_log.append(entry)
    if len(_alert_log) > 100:
        _alert_log.pop(0)
    socketio.emit('alert_event', entry)


def _do_call(accident_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Perform Twilio voice call. Returns {success, sid/error}."""
    try:
        from twilio.rest import Client as TwilioClient  # type: ignore
    except ImportError:
        return {'success': False, 'error': 'twilio package not installed'}

    cfg = _alert_config
    if not cfg['account_sid'] or not cfg['auth_token']:
        return {'success': False, 'error': 'Twilio credentials not configured'}
    if not cfg['to_number'] or not cfg['from_number']:
        return {'success': False, 'error': 'Phone numbers not configured'}
    if not cfg['twiml_url']:
        return {'success': False, 'error': 'TwiML URL not configured'}

    try:
        client = TwilioClient(cfg['account_sid'], cfg['auth_token'])
        call = client.calls.create(
            url=cfg['twiml_url'],
            to=cfg['to_number'],
            from_=cfg['from_number']
        )
        return {'success': True, 'sid': call.sid}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def _build_sms_body(accident_data: Optional[Dict[str, Any]] = None) -> str:
    """Build the SMS body string from the template and accident data."""
    cfg = _alert_config
    body_template = cfg.get('sms_body', '🚨 ACCIDENT DETECTED by Smart Resq.')
    data = accident_data or {}
    return body_template.format(
        timestamp=data.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        probability=float(data.get('probability', 0)),
        location=data.get('location', 'Unknown'),
        plate=data.get('plate_text') or 'N/A',
    )


def _do_fast2sms(accident_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Send SMS via Fast2SMS API using GET request format. Returns {success, request_id/error}.
    Matches Fast2SMS dashboard standard GET API structure.
    """
    import urllib.request
    import urllib.parse
    import json as _json

    cfg = _alert_config
    api_key = cfg.get('fast2sms_api_key', '')
    if not api_key or api_key == 'your_fast2sms_api_key_here':
        return {'success': False, 'error': 'Fast2SMS API key not configured'}

    numbers_raw = cfg.get('fast2sms_numbers', '') or cfg.get('to_number', '')
    if not numbers_raw:
        return {'success': False, 'error': 'No destination phone number configured'}

    # Fast2SMS expects 10-digit Indian numbers (strip country code if present). Enforce uniqueness.
    clean_numbers = []
    for num in numbers_raw.replace(' ', '').split(','):
        num = num.strip().lstrip('+')
        if num.startswith('91') and len(num) == 12:
            num = num[2:]
        if num and num not in clean_numbers:
            clean_numbers.append(num)
    numbers_str = ','.join(clean_numbers)

    body = _build_sms_body(accident_data)

    # Determine optimal encoding to prevent double-charging.
    # GSM English = 160 chars per SMS. Unicode = 70 chars per SMS.
    is_unicode = any(ord(c) > 127 for c in body)
    lang = 'unicode' if is_unicode else 'english'

    try:
        # Build query parameters exactly as shown in the Fast2SMS GET API docs
        query_params = urllib.parse.urlencode({
            'authorization': api_key,
            'route': 'q',
            'message': body,
            'language': lang,
            'flash': '0',  # 0 = normal SMS (saved to inbox), 1 = Flash SMS (temp popup)
            'numbers': numbers_str
        })
        
        url = f"https://www.fast2sms.com/dev/bulkV2?{query_params}"
        
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = _json.loads(resp.read().decode('utf-8'))

        if result.get('return') is True:
            request_id = result.get('request_id', 'N/A')
            return {'success': True, 'request_id': request_id, 'body': body, 'provider': 'fast2sms'}
        else:
            return {'success': False, 'error': result.get('message', 'Unknown Fast2SMS error')}
    except urllib.error.HTTPError as e:
        err_msg = str(e)
        try:
            # Fast2SMS returns the real error reason in the JSON body, e.g. {"message": "Invalid Number"}
            error_details = _json.loads(e.read().decode('utf-8'))
            if 'message' in error_details:
                err_msg = error_details['message']
        except Exception:
            pass
        return {'success': False, 'error': f'Fast2SMS API Error: {err_msg}'}
    except Exception as e:
        return {'success': False, 'error': f'Fast2SMS request failed: {str(e)}'}


def _do_sms(accident_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Send SMS via Twilio (used as fallback/standby when Fast2SMS is not the chosen provider)."""
    try:
        from twilio.rest import Client as TwilioClient  # type: ignore
    except ImportError:
        return {'success': False, 'error': 'twilio package not installed'}

    cfg = _alert_config
    if not cfg.get('account_sid') or not cfg.get('auth_token'):
        return {'success': False, 'error': 'Twilio credentials not configured'}
    if not cfg.get('to_number') or not cfg.get('from_number'):
        return {'success': False, 'error': 'Twilio phone numbers not configured'}

    try:
        body = _build_sms_body(accident_data)
        client = TwilioClient(cfg['account_sid'], cfg['auth_token'])
        msg = client.messages.create(
            body=body,
            to=cfg['to_number'],
            from_=cfg['from_number']
        )
        return {'success': True, 'sid': msg.sid, 'body': body, 'provider': 'twilio'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def emit_alert_for_accident(accident_data: Dict[str, Any]) -> None:
    """Called by the camera thread when an accident is confirmed in web-dashboard mode.
    
    SMS priority:
      • 'fast2sms'  → use Fast2SMS only
      • 'twilio'    → use Twilio only  (standby fallback)
      • 'both'      → send via both providers
    """
    # ── Voice Call (always uses Twilio) ──────────────────────────────────
    if _alert_config.get('auto_call'):
        result = _do_call(accident_data)
        if result['success']:
            _log_alert('call', f'Emergency call initiated (SID: {result["sid"]})', True)
            print(f'✓ Emergency call initiated: {result["sid"]}')
        else:
            _log_alert('call', f'Call failed: {result["error"]}', False, result['error'])
            print(f'✗ Emergency call failed: {result["error"]}')

    # ── SMS ───────────────────────────────────────────────────────────────
    if _alert_config.get('auto_sms'):
        provider = _alert_config.get('sms_provider', 'fast2sms')

        if provider in ('fast2sms', 'both'):
            result = _do_fast2sms(accident_data)
            if result['success']:
                rid = result.get('request_id', 'N/A')
                _log_alert('sms', f'Fast2SMS sent (ID: {rid})', True, result.get('body', ''))
                print(f'✓ Fast2SMS sent (ID: {rid})')
            else:
                _log_alert('sms', f'Fast2SMS failed: {result["error"]}', False, result['error'])
                print(f'✗ Fast2SMS failed: {result["error"]}')
                # Auto-fallback to Twilio if Fast2SMS fails and provider is fast2sms
                if provider == 'fast2sms':
                    print('↩ Falling back to Twilio SMS...')
                    twilio_result = _do_sms(accident_data)
                    if twilio_result['success']:
                        _log_alert('sms', f'Twilio fallback SMS sent (SID: {twilio_result["sid"]})', True, twilio_result.get('body', ''))
                        print(f'✓ Twilio fallback SMS sent: {twilio_result["sid"]}')
                    else:
                        _log_alert('sms', f'Twilio fallback also failed: {twilio_result["error"]}', False, twilio_result['error'])
                        print(f'✗ Twilio fallback also failed: {twilio_result["error"]}')

        if provider in ('twilio', 'both'):
            result = _do_sms(accident_data)
            if result['success']:
                _log_alert('sms', f'Twilio SMS sent (SID: {result["sid"]})', True, result.get('body', ''))
                print(f'✓ Twilio SMS sent: {result["sid"]}')
            else:
                _log_alert('sms', f'Twilio SMS failed: {result["error"]}', False, result['error'])
                print(f'✗ Twilio SMS failed: {result["error"]}')


@app.route('/api/alert/config', methods=['GET'])
def get_alert_config():
    """Return current alert config (auth_token masked)."""
    safe = dict(_alert_config)
    if safe.get('auth_token'):
        safe['auth_token'] = safe['auth_token'][:6] + '•••••••••••••••••'
    return jsonify(safe)


@app.route('/api/alert/config', methods=['POST'])
def save_alert_config():
    """Update runtime alert config (does NOT write to disk — use .env for persistence)."""
    data = request.get_json() or {}
    allowed = {
        'account_sid', 'auth_token', 'from_number', 'to_number', 'twiml_url',
        'auto_call', 'auto_sms', 'sms_body', 'sms_provider',
        'fast2sms_api_key', 'fast2sms_numbers',
    }
    for key in allowed:
        if key in data:
            _alert_config[key] = data[key]
    # Don't overwrite if masked token placeholder was submitted
    if data.get('auth_token', '').endswith('•••••••••••••••••'):
        pass
    if data.get('fast2sms_api_key', '').endswith('•••••••••••••••••'):
        pass
    _log_alert('config', 'Alert configuration updated', True)
    return jsonify({'success': True, 'message': 'Alert config updated (runtime only — add to .env for persistence)'})


@app.route('/api/alert/call', methods=['POST'])
def trigger_call():
    """Manually trigger an emergency voice call."""
    accident_data = request.get_json() or {}
    result = _do_call(accident_data)
    if result['success']:
        _log_alert('call', f'Manual call initiated (SID: {result["sid"]})', True)
        return jsonify({'success': True, 'sid': result['sid']})
    else:
        _log_alert('call', f'Call failed: {result["error"]}', False, result['error'])
        return jsonify({'success': False, 'error': result['error']}), 500


@app.route('/api/alert/sms', methods=['POST'])
def trigger_sms():
    """Manually trigger an SMS via Twilio (standby)."""
    accident_data = request.get_json() or {}
    result = _do_sms(accident_data)
    if result['success']:
        _log_alert('sms', f'Manual Twilio SMS sent (SID: {result["sid"]})', True, result.get('body',''))
        return jsonify({'success': True, 'sid': result['sid'], 'body': result.get('body','')})
    else:
        _log_alert('sms', f'Twilio SMS failed: {result["error"]}', False, result['error'])
        return jsonify({'success': False, 'error': result['error']}), 500


@app.route('/api/alert/fast2sms', methods=['POST'])
def trigger_fast2sms():
    """Manually trigger an emergency SMS via Fast2SMS."""
    accident_data = request.get_json() or {}
    result = _do_fast2sms(accident_data)
    if result['success']:
        rid = result.get('request_id', 'N/A')
        _log_alert('sms', f'Manual Fast2SMS sent (ID: {rid})', True, result.get('body',''))
        return jsonify({'success': True, 'request_id': rid, 'body': result.get('body','')})
    else:
        _log_alert('sms', f'Fast2SMS failed: {result["error"]}', False, result['error'])
        return jsonify({'success': False, 'error': result['error']}), 500


@app.route('/api/alert/log')
def get_alert_log():
    """Return recent alert events."""
    return jsonify({'log': list(reversed(_alert_log))})


@app.route('/api/start', methods=['POST'])
def start_system():
    """Start the accident detection system"""
    global detection_system, dashboard_state, _camera_stop_event

    # Acquire lock so concurrent button-clicks can't spawn multiple threads
    if not _start_lock.acquire(blocking=False):
        return jsonify({'error': 'System is already starting, please wait'}), 429

    try:
        if dashboard_state['system_status'] == 'running':
            return jsonify({'error': 'System already running'}), 400

        # Reset & recreate the stop event so the new thread runs until stopped
        _camera_stop_event.clear()

        try:
            from camera import AccidentDetectionSystem

            ds = AccidentDetectionSystem(use_web_dashboard=True)
            ds.set_dashboard_callback(emit_to_dashboard)

            # Capture a local reference to the stop event for this thread
            stop_evt = _camera_stop_event

            def _run_with_stop():
                """Wrapper so the camera loop also respects _camera_stop_event."""
                # Override run() to exit early when stop_evt is set
                ds.running = True
                original_running_check = None
                try:
                    # Monkey-patch: replace the internal running flag with
                    # a property-like approach by giving the instance a
                    # reference to the global stop event as well.
                    ds._global_stop_event = stop_evt
                    ds.run()
                finally:
                    ds.running = False

            detection_thread = threading.Thread(target=_run_with_stop, daemon=True)
            detection_thread.start()

            detection_system = ds

            dashboard_state['system_status'] = 'running'
            dashboard_state['start_time'] = datetime.now().isoformat()

            socketio.emit('system_status', {'status': 'running'})

            return jsonify({'success': True, 'message': 'System started'})
        except Exception as e:
            dashboard_state['system_status'] = 'stopped'
            return jsonify({'error': str(e)}), 500
    finally:
        _start_lock.release()


@app.route('/api/stop', methods=['POST'])
def stop_system():
    """Stop the accident detection system"""
    global dashboard_state, detection_system, _camera_stop_event
    
    try:
        # Signal ALL camera threads to stop (fixes the infinite-reconnect loop)
        _camera_stop_event.set()
        
        dashboard_state['system_status'] = 'stopped'
        
        if detection_system:
            try:
                ds = detection_system  # narrow Optional type for Pyre2/Pyright
                ds.running = False   # belt-and-braces
                ds.stop()
            except Exception as stop_error:
                print(f"Error calling stop: {stop_error}")
            detection_system = None
        
        socketio.emit('system_status', {'status': 'stopped'})
        
        return jsonify({'success': True, 'message': 'System stopped'})
    except Exception as e:
        print(f"Error stopping system: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/config', methods=['GET', 'POST'])
def config_endpoint():
    """Get or update configuration"""
    if request.method == 'GET':
        return jsonify({
            'use_live_camera': Config.USE_LIVE_CAMERA,
            'video_source': Config.VIDEO_SOURCE,
            'accident_threshold': Config.ACCIDENT_THRESHOLD,
            'ocr_engine': Config.OCR_ENGINE,
            'frame_skip': Config.FRAME_SKIP
        })
    else:
        # Update configuration
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        try:
            if 'video_source' in data:
                Config.VIDEO_SOURCE = data['video_source']
            if 'accident_threshold' in data:
                Config.ACCIDENT_THRESHOLD = float(data['accident_threshold'])
            if 'ocr_engine' in data:
                Config.OCR_ENGINE = data['ocr_engine']
            if 'frame_skip' in data:
                Config.FRAME_SKIP = int(data['frame_skip'])
                
            return jsonify({'success': True, 'message': 'Configuration updated'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# VIDEO UPLOAD & ANALYSIS ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    """Upload a video file for analysis"""
    if 'video' not in request.files:
        return jsonify({'error': 'No video file in request'}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Supported: {ALLOWED_EXTENSIONS}'}), 400

    # Save with unique name to avoid conflicts
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(save_path)

    # Probe the video quickly
    cap = cv2.VideoCapture(save_path)
    if not cap.isOpened():
        os.remove(save_path)
        return jsonify({'error': 'Cannot open video file. It may be corrupted.'}), 400

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    duration = total_frames / fps if fps > 0 else 0
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    # Reset analysis state
    global video_analysis_state
    video_analysis_state.update({
        'status': 'ready',
        'video_path': save_path,
        'video_name': secure_filename(file.filename),
        'total_frames': total_frames,
        'processed_frames': 0,
        'accidents_found': [],
        'progress_percent': 0,
        'fps': fps,
        'duration_seconds': fround(float(duration), 2),
        'error': None,
        'start_time': None,
        'end_time': None
    })

    return jsonify({
        'success': True,
        'message': 'Video uploaded successfully',
        'video_info': {
            'name': video_analysis_state['video_name'],
            'total_frames': total_frames,
            'fps': fround(float(fps), 2),
            'duration_seconds': fround(float(duration), 2),
            'resolution': f"{width}x{height}"
        }
    })


@app.route('/api/analyze-video', methods=['POST'])
def start_video_analysis():
    """Start analysing the previously uploaded video"""
    global video_analysis_state, video_analysis_thread, video_analysis_stop_flag

    if video_analysis_state['status'] == 'analyzing':
        return jsonify({'error': 'Analysis already running'}), 400

    if video_analysis_state.get('video_path') is None:
        return jsonify({'error': 'No video uploaded. Upload a video first via /api/upload-video'}), 400

    if not os.path.exists(str(video_analysis_state['video_path'])):
        return jsonify({'error': 'Uploaded video file not found. Please re-upload.'}), 400

    # Read optional settings from request body
    data = request.get_json(silent=True) or {}
    threshold = float(data.get('threshold') or Config.ACCIDENT_THRESHOLD)
    frame_skip = int(data.get('frame_skip') or Config.FRAME_SKIP)

    # Reset stop flag
    video_analysis_stop_flag.clear()
    video_analysis_state.update({
        'status': 'analyzing',
        'processed_frames': 0,
        'accidents_found': [],
        'progress_percent': 0,
        'error': None,
        'start_time': datetime.now().isoformat(),
        'end_time': None,
        'last_frame': None
    })

    video_analysis_thread = threading.Thread(
        target=_run_video_analysis,
        args=(video_analysis_state['video_path'], threshold, frame_skip),
        daemon=True
    )
    video_analysis_thread.start()

    return jsonify({'success': True, 'message': 'Video analysis started'})


@app.route('/api/video-analysis/status')
def video_analysis_status():
    """Poll current video analysis progress"""
    return jsonify(video_analysis_state)


@app.route('/api/video-analysis/stop', methods=['POST'])
def stop_video_analysis():
    """Stop an ongoing video analysis"""
    global video_analysis_state
    video_analysis_stop_flag.set()
    video_analysis_state['status'] = 'stopped'
    socketio.emit('video_analysis_stopped', {})
    return jsonify({'success': True, 'message': 'Analysis stopped'})


@app.route('/api/video-analysis/reset', methods=['POST'])
def reset_video_analysis():
    """Reset analysis state (clear uploaded file)"""
    global video_analysis_state
    video_analysis_stop_flag.set()

    # Clean up file
    path = video_analysis_state.get('video_path')
    if path and os.path.exists(str(path)):
        try:
            os.remove(str(path))
        except Exception:
            pass

    video_analysis_state = {
        'status': 'idle',
        'video_path': None,
        'video_name': None,
        'total_frames': 0,
        'processed_frames': 0,
        'accidents_found': [],
        'progress_percent': 0,
        'fps': 0,
        'duration_seconds': 0,
        'error': None,
        'start_time': None,
        'end_time': None
    }
    return jsonify({'success': True, 'message': 'Analysis reset'})


def _run_video_analysis(video_path, threshold, frame_skip):
    """Background thread: analyse every frame of the uploaded video"""
    global video_analysis_state

    # Load model lazily — typed against local Protocol so Pyre2 can resolve predict_accident()
    model: Optional[_DetectionModelProtocol] = None
    try:
        from detection import AccidentDetectionModel as _ADM  # noqa: F811
        model = _ADM(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)
        print("✓ [VideoAnalysis] Model loaded")
    except Exception as e:
        print(f"⚠ [VideoAnalysis] Model unavailable, using demo mode: {e}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        video_analysis_state['status'] = 'error'
        video_analysis_state['error'] = 'Cannot open video file'
        socketio.emit('video_analysis_error', {'error': 'Cannot open video file'})
        return

    total_frames = video_analysis_state['total_frames'] or int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps         = video_analysis_state['fps'] or (cap.get(cv2.CAP_PROP_FPS) or 30)
    frame_count = 0
    accidents   = []
    import random

    analysis_session_id = None
    try:
        while not video_analysis_stop_flag.is_set():
            ret, frame = cap.read()
            if not ret:
                break

            # Initialize archive if this is the first frame
            if frame_count == 0: # frame_count starts at 0, increments after this
                # Get video info for archive
                _raw_total = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                total_frames_val: int = int(_raw_total) if _raw_total else int(total_frames)
                _raw_fps = cap.get(cv2.CAP_PROP_FPS)
                fps_val: float = float(_raw_fps) if _raw_fps else float(fps if isinstance(fps, (int, float)) else 30)
                duration_val: float = total_frames_val / fps_val if fps_val > 0.0 else 0.0
                
                # Start archive session
                analysis_title = video_analysis_state['video_name'] or "Unnamed Video"
                analysis_session_id, archive_output_dir = archive.start_video_analysis(
                    analysis_title, total_frames_val, fps_val, duration_val
                )
                video_analysis_state['archive_id'] = analysis_session_id
                print(f"📁 Archive session started: Analysis #{analysis_session_id}")

            frame_count += 1
            progress = fround(float(frame_count) / float(max(int(total_frames), 1)) * 100.0, 1)

            video_analysis_state['processed_frames'] = frame_count
            video_analysis_state['progress_percent'] = progress

            # ------ Prediction ------
            pred        = "No Accident"
            probability = 0.0

            if frame_count % frame_skip == 0:
                try:
                    if model:
                        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        roi = cv2.resize(rgb, Config.MODEL_INPUT_SIZE)
                        pred_label, prob = model.predict_accident(roi[np.newaxis, :, :])
                        pred = pred_label
                        # prob is always shape (1, 2): [p_accident, p_no_accident]
                        probability = float(prob[0][0]) * 100
                    # (no else — model is always available via CV fallback)
                except Exception as pred_err:
                    print(f"[VideoAnalysis] Prediction error at frame {frame_count}: {pred_err}")

            # ------ Accident detected ------
            if pred == "Accident" and probability > threshold:

                timestamp_sec = fround(float(frame_count) / float(fps), 2)
                accident_entry = {
                    'frame': frame_count,
                    'timestamp_sec': timestamp_sec,
                    'timestamp_str': _sec_to_hms(timestamp_sec),
                    'probability': fround(float(probability), 2)
                }
                accidents.append(accident_entry)
                video_analysis_state['accidents_found'] = accidents

                # Record in archive
                try:
                    if analysis_session_id:
                        archive.record_accident(
                            analysis_session_id, 
                            frame_count, 
                            fround(float(probability), 2), 
                            frame
                        )
                except Exception as archive_err:
                    print(f"⚠ Archive error recording accident: {archive_err}")

                socketio.emit('video_analysis_accident', accident_entry)

            # ------ Emit frame thumbnail + progress every N frames ------
            # Use a small interval so even short videos show live preview.
            FRAME_EMIT_INTERVAL = max(5, frame_skip)

            if frame_count % FRAME_EMIT_INTERVAL == 0:
                try:
                    small = cv2.resize(frame, (640, 360))
                    _, buf = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    frame_b64 = base64.b64encode(buf).decode('utf-8')
                    video_analysis_state['last_frame'] = frame_b64
                    socketio.emit('video_analysis_progress', {
                        'frame_count': frame_count,
                        'total_frames': total_frames,
                        'progress': progress,
                        'frame': frame_b64,
                        'current_pred': pred,
                        'current_prob': fround(float(probability), 2),
                        'accidents_so_far': len(accidents)
                    })
                except Exception:
                    # Fallback: send progress without frame
                    socketio.emit('video_analysis_progress', {
                        'frame_count': frame_count,
                        'total_frames': total_frames,
                        'progress': progress,
                        'accidents_so_far': len(accidents)
                    })
            elif frame_count % 10 == 0:
                # Lightweight progress tick (no image) every 10 frames
                socketio.emit('video_analysis_progress', {
                    'frame_count': frame_count,
                    'total_frames': total_frames,
                    'progress': progress,
                    'accidents_so_far': len(accidents)
                })

            # Give the SocketIO event loop time to deliver queued messages
            time.sleep(0.01)


    except Exception as e:
        import traceback
        print(f"[VideoAnalysis] Error: {e}")
        traceback.print_exc()
        video_analysis_state['status'] = 'error'
        video_analysis_state['error'] = str(e)
        socketio.emit('video_analysis_error', {'error': str(e)})
        return
    finally:
        cap.release()

    if not video_analysis_stop_flag.is_set():
        video_analysis_state['status'] = 'complete'
        video_analysis_state['end_time'] = datetime.now().isoformat()
        video_analysis_state['accidents_found'] = accidents
        
        # Complete archive analysis
        try:
            if analysis_session_id:
                archive.complete_analysis(analysis_session_id, frame_count, len(accidents))
                print(f"✅ Archive Analysis #{analysis_session_id} marked as complete.")
        except Exception as archive_err:
            print(f"⚠ Archive error completing analysis: {archive_err}")

        socketio.emit('video_analysis_complete', {
            'total_frames': frame_count,
            'accidents': accidents,
            'duration_seconds': video_analysis_state['duration_seconds']
        })
        print(f"✓ [VideoAnalysis] Complete. {frame_count} frames analysed, {len(accidents)} accidents found.")


def _sec_to_hms(seconds):
    """Convert seconds to HH:MM:SS string"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


# ─────────────────────────────────────────────
def clean_for_json(obj):
    """Recursively convert NumPy types to standard Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {str(k): clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, np.ndarray)):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, (np.float32, np.float64, np.float16)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64, np.int16, np.int8)):
        return int(obj)
    elif hasattr(obj, 'item'):  # Other NumPy scalars
        try:
            return obj.item()
        except:
            return str(obj)
    elif hasattr(obj, 'tolist'): # Other NumPy arrays
        return obj.tolist()
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif obj is None or isinstance(obj, (int, float, str, bool)):
        return obj
    else:
        return str(obj)

def emit_to_dashboard(event_type, data):
    """Callback function to emit events to dashboard"""
    global dashboard_state
    
    # Ensure data is JSON serializable
    data = clean_for_json(data)
    
    if event_type == 'accident':
        # Add accident to history
        _accidents: List[Any] = list(dashboard_state['accidents'])
        accident_data: Dict[str, Any] = {
            'id': len(_accidents),
            'timestamp': data['timestamp'],
            'probability': data['probability'],
            'photo_path': data.get('photo_path'),
            'location': data.get('location', 'Unknown'),
            'plate_text': data.get('plate_text')
        }
        _accidents.append(accident_data)
        dashboard_state['accidents'] = _accidents
        _stats: Dict[str, Any] = dict(dashboard_state['stats'])
        _stats['total_accidents'] = int(_stats.get('total_accidents', 0)) + 1
        dashboard_state['stats'] = _stats
        
        # Emit to connected clients
        socketio.emit('accident_detected', accident_data)
    
    elif event_type == 'plate_detected':
        # Update latest accident with plate info
        _accidents2: List[Any] = list(dashboard_state['accidents'])
        if _accidents2:
            _accidents2[-1]['plate_text'] = data['text']
            dashboard_state['accidents'] = _accidents2
            _stats2: Dict[str, Any] = dict(dashboard_state['stats'])
            _stats2['total_plates_detected'] = int(_stats2.get('total_plates_detected', 0)) + 1
            dashboard_state['stats'] = _stats2
            socketio.emit('plate_detected', data)
    
    elif event_type == 'frame':
        # Update frame count
        _stats3: Dict[str, Any] = dict(dashboard_state['stats'])
        _stats3['frames_processed'] = data['frame_count']
        dashboard_state['stats'] = _stats3
        
        # Emit frame update (throttled/passed through from camera.py)
        if 'frame' in data:
            socketio.emit('frame_update', {
                'frame_count': data['frame_count'],
                'frame': data['frame'],
                'probability': data.get('probability', 0),
                'timestamp': data['timestamp'],
                'width': data.get('width'),
                'height': data.get('height')
            })
        else:
            socketio.emit('frame_update', {
                'frame_count': data['frame_count'],
                'probability': data.get('probability', 0),
                'timestamp': data['timestamp'],
                'width': data.get('width'),
                'height': data.get('height')
            })


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('system_status', {'status': dashboard_state['system_status']})
    emit('stats_update', dashboard_state['stats'])


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")


@socketio.on('request_stats')
def handle_stats_request():
    """Send current statistics to client"""
    emit('stats_update', dashboard_state['stats'])


def run_dashboard(host=None, port=None, debug=None):
    """Run the web dashboard"""
    host = host or Config.FLASK_HOST
    port = port or Config.FLASK_PORT
    debug = debug if debug is not None else Config.FLASK_DEBUG
    
    print("\n" + "="*60)
    print("🌐 Smart Resq Web Dashboard")
    print("="*60)
    print(f"URL: http://{host}:{port}")
    print(f"Debug: {debug}")
    print("="*60 + "\n")
    
    socketio.run(app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)


if __name__ == '__main__':
    run_dashboard()
