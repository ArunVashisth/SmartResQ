import eventlet
eventlet.monkey_patch()

"""
Smart Resq Web Dashboard
Real-time monitoring interface for accident detection system
"""

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
dashboard_state = {
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

# Video Analysis State
UPLOAD_FOLDER = 'uploaded_videos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', 'flv', 'm4v'}

video_analysis_state = {
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
    """Main dashboard page"""
    return render_template('dashboard.html')


@app.route('/api/status')
def get_status():
    """Get current system status"""
    return jsonify(dashboard_state)


@app.route('/api/accidents')
def get_accidents():
    """Get list of detected accidents"""
    return jsonify({
        'accidents': dashboard_state['accidents'],
        'total': len(dashboard_state['accidents'])
    })


@app.route('/api/accidents/<int:accident_id>')
def get_accident_detail(accident_id):
    """Get details of a specific accident"""
    if accident_id < len(dashboard_state['accidents']):
        return jsonify(dashboard_state['accidents'][accident_id])
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


@app.route('/api/start', methods=['POST'])
def start_system():
    """Start the accident detection system"""
    global detection_system, dashboard_state
    
    if dashboard_state['system_status'] == 'running':
        return jsonify({'error': 'System already running'}), 400
    
    try:
        from camera import AccidentDetectionSystem
        
        detection_system = AccidentDetectionSystem(use_web_dashboard=True)
        detection_system.set_dashboard_callback(emit_to_dashboard)
        
        # Start in separate thread
        detection_thread = threading.Thread(target=detection_system.run)
        detection_thread.daemon = True
        detection_thread.start()
        
        dashboard_state['system_status'] = 'running'
        dashboard_state['start_time'] = datetime.now().isoformat()
        
        socketio.emit('system_status', {'status': 'running'})
        
        return jsonify({'success': True, 'message': 'System started'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stop', methods=['POST'])
def stop_system():
    """Stop the accident detection system"""
    global dashboard_state, detection_system
    
    try:
        # Update status first
        dashboard_state['system_status'] = 'stopped'
        
        # Try to stop detection system gracefully if it exists
        if detection_system:
            try:
                detection_system.stop()  # Call the stop method
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
        'duration_seconds': round(duration, 2),
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
            'fps': round(fps, 2),
            'duration_seconds': round(duration, 2),
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

    if not os.path.exists(video_analysis_state['video_path']):
        return jsonify({'error': 'Uploaded video file not found. Please re-upload.'}), 400

    # Read optional settings from request body
    data = request.get_json(silent=True) or {}
    threshold = float(data.get('threshold', Config.ACCIDENT_THRESHOLD))
    frame_skip = int(data.get('frame_skip', Config.FRAME_SKIP))

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
    if path and os.path.exists(path):
        try:
            os.remove(path)
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

    # Load model lazily
    model = None
    try:
        from detection import AccidentDetectionModel
        model = AccidentDetectionModel(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)
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
                total_frames_val = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or total_frames
                fps_val = cap.get(cv2.CAP_PROP_FPS) or fps or 30
                duration_val = total_frames_val / fps_val if fps_val > 0 else 0
                
                # Start archive session
                analysis_title = video_analysis_state['video_name'] or "Unnamed Video"
                analysis_session_id, archive_output_dir = archive.start_video_analysis(
                    analysis_title, total_frames_val, fps_val, duration_val
                )
                video_analysis_state['archive_id'] = analysis_session_id
                print(f"📁 Archive session started: Analysis #{analysis_session_id}")

            frame_count += 1
            progress = round((frame_count / max(total_frames, 1)) * 100, 1)

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

                timestamp_sec = round(frame_count / fps, 2)
                accident_entry = {
                    'frame': frame_count,
                    'timestamp_sec': timestamp_sec,
                    'timestamp_str': _sec_to_hms(timestamp_sec),
                    'probability': round(probability, 2)
                }
                accidents.append(accident_entry)
                video_analysis_state['accidents_found'] = accidents

                # Record in archive
                try:
                    if analysis_session_id:
                        archive.record_accident(
                            analysis_session_id, 
                            frame_count, 
                            round(probability, 2), 
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
                        'current_prob': round(probability, 2),
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
        accident_data = {
            'id': len(dashboard_state['accidents']),
            'timestamp': data['timestamp'],
            'probability': data['probability'],
            'photo_path': data.get('photo_path'),
            'location': data.get('location', 'Unknown'),
            'plate_text': data.get('plate_text')
        }
        dashboard_state['accidents'].append(accident_data)
        dashboard_state['stats']['total_accidents'] += 1
        
        # Emit to connected clients
        socketio.emit('accident_detected', accident_data)
    
    elif event_type == 'plate_detected':
        # Update latest accident with plate info
        if dashboard_state['accidents']:
            dashboard_state['accidents'][-1]['plate_text'] = data['text']
            dashboard_state['stats']['total_plates_detected'] += 1
            socketio.emit('plate_detected', data)
    
    elif event_type == 'frame':
        # Update frame count
        dashboard_state['stats']['frames_processed'] = data['frame_count']
        
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
