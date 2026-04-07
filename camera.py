# pyre-ignore-all-errors
"""
Enhanced Camera Module with Live Feed Support
Supports both live camera and video file input
"""
from __future__ import annotations

import cv2
import numpy as np
import os
import platform
import threading
import time
import base64
from datetime import datetime
from typing import Optional, Dict, Any, Callable, List, Tuple, Union
from config import Config
from license_plate_detection import LicensePlateDetector
from archive_system import ArchiveSystem

# winsound is Windows-only — safe to ignore on Linux/Railway
try:
    import winsound
    WINSOUND_AVAILABLE = True
except ImportError:
    WINSOUND_AVAILABLE = False

# Try to import detection model
try:
    from detection import AccidentDetectionModel
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    print("Warning: TensorFlow model not available. Using demo mode.")

# Try to import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("Warning: Twilio not available.")


class AccidentDetectionSystem:
    """Main accident detection system with live camera support"""

    # Class-level type declarations so Pyre2/Pyright can infer them correctly
    use_web_dashboard: bool
    model: Optional[Any]
    plate_detector: Any
    alarm_triggered: bool
    scanning_for_plate: bool
    plate_found: bool
    current_accident_data: Optional[Dict[str, Any]]
    current_accident_id: Optional[int]
    running: bool
    dashboard_callback: Optional[Callable[..., None]]
    archive: ArchiveSystem
    current_analysis_id: Optional[int]
    _global_stop_event: Optional[threading.Event]
    font: int
    
    def __init__(self, use_web_dashboard: bool = False) -> None:
        """
        Initialize the accident detection system
        
        Args:
            use_web_dashboard: Whether to enable web dashboard integration
        """
        Config.ensure_directories()
        
        self.use_web_dashboard = use_web_dashboard
        self.model = None
        self.plate_detector = LicensePlateDetector(ocr_engine=Config.OCR_ENGINE)  # type: ignore[assignment]
        
        # State variables
        self.alarm_triggered = False
        self.scanning_for_plate = False
        self.plate_found = False
        self.current_accident_data = None
        self.current_accident_id = None
        self.running = False  # Flag to control main loop
        
        self.dashboard_callback = None
        
        # Archive system
        self.archive = ArchiveSystem()
        self.current_analysis_id = None
        
        # Optional global stop event injected by app.py to kill all camera threads at once
        self._global_stop_event = None
        
        # Initialize model if available
        if MODEL_AVAILABLE:
            try:
                self.model = AccidentDetectionModel(  # type: ignore[assignment]
                    Config.MODEL_JSON_PATH, 
                    Config.MODEL_WEIGHTS_PATH
                )
                print("✓ Accident detection model loaded successfully")
            except Exception as e:
                print(f"✗ Error loading model: {e}")
                print("  Running in demo mode")
                self.model = None
        
        self.font = cv2.FONT_HERSHEY_SIMPLEX  # type: ignore[assignment]
    
    def set_dashboard_callback(self, callback: Callable[..., None]) -> None:
        """Set callback function for web dashboard updates"""
        self.dashboard_callback = callback
    
    def emit_dashboard_update(self, event_type: str, data: Dict[str, Any]) -> None:
        """Send update to web dashboard"""
        cb = self.dashboard_callback
        if cb is not None:
            try:
                cb(event_type, data)
            except Exception as e:
                print(f"Error emitting dashboard update: {e}")
    
    def stop(self) -> None:
        """Stop the detection system gracefully"""
        self.running = False
        evt: Optional[threading.Event] = self._global_stop_event
        if evt is not None:
            evt.set()
        print("\n⚠ Stopping detection system...")
    
    def save_accident_photo(self, frame):
        """Save accident photo with timestamp"""
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
            filename = os.path.join(Config.ACCIDENT_PHOTOS_DIR, f"{timestamp}.jpg")
            cv2.imwrite(filename, frame)
            print(f"✓ Accident photo saved: {filename}")
            return filename
        except Exception as e:
            print(f"✗ Error saving accident photo: {e}")
            return None
    
    def call_ambulance(self):
        """Call ambulance using Twilio"""
        if not TWILIO_AVAILABLE:
            print("⚠ Twilio not available - cannot make call")
            return False
        
        if not Config.TWILIO_ACCOUNT_SID or not Config.TWILIO_AUTH_TOKEN:
            print("⚠ Twilio credentials not configured")
            return False
        
        try:
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            
            call = client.calls.create(
                url=Config.TWILIO_TWIML_URL,
                to=Config.DESTINATION_PHONE_NUMBER,
                from_=Config.TWILIO_PHONE_NUMBER
            )
            
            print(f"✓ Emergency call initiated: {call.sid}")
            return True
        except Exception as e:
            print(f"✗ Error calling ambulance: {e}")
            return False

    def show_alert_message(self, accident_data):
        """
        Show local alert.  On headless servers (Railway/Linux) this just
        prints to the console — the real alert goes through the web
        dashboard via start_alert_thread → _web_alert path.
        """
        prob = accident_data.get('probability', 0)
        ts   = accident_data.get('timestamp', 'N/A')
        plate = accident_data.get('plate_text', 'N/A')
        print(f"\n{'='*50}")
        print(f"🚨 ACCIDENT ALERT")
        print(f"   Confidence : {prob:.1f}%")
        print(f"   Time       : {ts}")
        print(f"   Plate      : {plate}")
        print(f"{'='*50}\n")
        # Audio alert on Windows only
        if WINSOUND_AVAILABLE:
            try:
                import winsound as _ws
                _ws.Beep(Config.ALERT_SOUND_FREQUENCY, Config.ALERT_SOUND_DURATION)
            except Exception:
                pass
    
    def start_alert_thread(self, accident_data):
        """Start alert in separate thread"""
        if self.use_web_dashboard:
            # In web mode: trigger real Twilio call + SMS via app module
            print(f"📡 Web Alert Dispatched for Accident: {accident_data.get('probability', 0):.1f}%")
            def _web_alert():
                try:
                    # Lazy import to avoid circular dependency at module load time
                    import app as _app  # type: ignore[import]
                    _app._log_alert('accident', f"Accident detected ({accident_data.get('probability', 0):.1f}%)", True)
                    # Trigger auto-call if configured in _app
                    if _app._alert_config.get('auto_call'):
                        _app._do_call(accident_data)
                except Exception as e:
                    print(f"⚠ Web alert dispatch error: {e}")
            alert_thread = threading.Thread(target=_web_alert, daemon=True)
            alert_thread.start()
            return
        
        # Local GUI mode only
        try:
            alert_thread = threading.Thread(target=self.show_alert_message, args=(accident_data,))
            alert_thread.daemon = True
            alert_thread.start()
        except:
            pass
    
    def save_frame_for_plate_detection(self, frame, index):
        """Save frame temporarily for plate detection"""
        try:
            filename = os.path.join(Config.PLATE_DETECTION_FRAMES_DIR, f"frame_{index}.jpg")
            cv2.imwrite(filename, frame)
            return filename
        except Exception as e:
            print(f"Error saving frame: {e}")
            return None
    
    def predict_accident(self, frame):
        """
        Predict accident from frame
        
        Returns:
            tuple: (prediction, probability)
        """
        if self.model:
            try:
                gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                roi = cv2.resize(gray_frame, Config.MODEL_INPUT_SIZE)
                pred, prob = self.model.predict_accident(roi[np.newaxis, :, :])
                return pred, prob
            except Exception as e:
                print(f"Error in prediction: {e}")
                return "Error", [[0, 0]]
        else:
            # Demo mode - random detection
            import random
            if random.random() < 0.001:  # 0.1% chance
                return "Accident", [[99.5, 0.5]]
            return "No Accident", [[5.0, 95.0]]
    
    def get_video_source(self):
        """Get video source (camera or file)"""
        is_windows = platform.system() == "Windows"
        
        if Config.USE_LIVE_CAMERA:
            # Try to parse as integer (camera index)
            try:
                source_idx = int(Config.VIDEO_SOURCE)
                print(f"📹 Using camera index: {source_idx}")
                
                # On Windows, CAP_DSHOW is often more reliable and faster for webcams
                if is_windows and source_idx < 10:  # Usual webcam range
                    return source_idx + cv2.CAP_DSHOW
                return source_idx
            except ValueError:
                # It's a URL or file path
                if isinstance(Config.VIDEO_SOURCE, str) and (Config.VIDEO_SOURCE.startswith('rtsp') or Config.VIDEO_SOURCE.startswith('http')):
                    # FORCE FFMPEG FOR STREAMS
                    return Config.VIDEO_SOURCE
                
                if os.path.exists(Config.VIDEO_SOURCE):
                    print(f"📹 Using video file: {Config.VIDEO_SOURCE}")
                    return Config.VIDEO_SOURCE
                else:
                    print(f"⚠ Video source not found: {Config.VIDEO_SOURCE}")
                    print("  Falling back to camera 0")
                    if is_windows:
                        return 0 + cv2.CAP_DSHOW
                    return 0
        else:
            # Use default video file
            if os.path.exists("new.mp4"):
                print("📹 Using video file: new.mp4")
                return "new.mp4"
            else:
                print("⚠ new.mp4 not found, using camera 0")
                if is_windows:
                    return 0 + cv2.CAP_DSHOW
                return 0
    
    def run(self):
        """Main application loop"""
        print("\n" + "="*60)
        print("🚨 SMART RESQ - Accident Detection System")
        print("="*60)
        print(f"Model: {'AI Enabled' if self.model else 'Demo Mode'}")
        print(f"OCR: {Config.OCR_ENGINE.upper()}")
        print(f"Dashboard: {'Enabled' if self.use_web_dashboard else 'Disabled'}")
        print("="*60 + "\n")
        
        video_source = self.get_video_source()
        
        # Explicitly use FFMPEG for network streams to avoid pattern errors
        if isinstance(video_source, str) and (video_source.startswith('rtsp') or video_source.startswith('http')):
            video = cv2.VideoCapture(video_source, cv2.CAP_FFMPEG)
        else:
            video = cv2.VideoCapture(video_source)
        
        if not video.isOpened():
            print(f"✗ Error: Could not open video source: {video_source}")
            return
        
        # Get video properties
        fps = video.get(cv2.CAP_PROP_FPS) or 30
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"✓ Video opened: {width}x{height} @ {fps:.1f} FPS\n")
        
        frame_count = 0
        accidents_detected = 0
        self.running = True  # Set running flag
        last_prob = 0.0
        
        # Start archive session
        source_name = str(video_source)
        self.current_analysis_id, _ = self.archive.start_video_analysis(
            source_name, 0, fps, 0
        )
        print(f"📁 Archive session started: Analysis #{self.current_analysis_id}")

        try:
            while self.running and not (self._global_stop_event and self._global_stop_event.is_set()):
                ret, frame = video.read()
                if not ret:
                    print("\n⚠ End of video or error reading frame")
                    if isinstance(video_source, int):
                        # Camera disconnected — try to reconnect, but stop if told to
                        print("  Attempting to reconnect...")
                        for _ in range(30):   # retry for up to 3 seconds then bail
                            if not self.running or (self._global_stop_event and self._global_stop_event.is_set()):
                                break
                            time.sleep(0.1)
                        if not self.running or (self._global_stop_event and self._global_stop_event.is_set()):
                            break
                        if isinstance(video_source, str) and (video_source.startswith('rtsp') or video_source.startswith('http')):
                            video = cv2.VideoCapture(video_source, cv2.CAP_FFMPEG)
                        else:
                            video = cv2.VideoCapture(video_source)
                        continue
                    else:
                        # Video file ended
                        break

                frame_count += 1

                # Optimization: Predict only every N frames
                if frame_count % Config.FRAME_SKIP == 0 or frame_count == 1:
                    pred, prob = self.predict_accident(frame)
                    # Safely extract scalar probability - prob may be [[p0, p1]] or similar
                    prob_arr = np.asarray(prob, dtype=float).ravel()
                    if pred == "Accident":
                        last_prob = float(prob_arr[0]) * 100
                    else:
                        # Use complement of no-accident probability if available
                        last_prob = float(1.0 - prob_arr[1]) * 100 if len(prob_arr) > 1 else float(prob_arr[0]) * 100
                else:
                    pred = "Processing..."
                
                # Emit frame to dashboard (Smoother: every 2 frames instead of 10)
                if frame_count % 2 == 0:
                    try:
                        # Resize for dashboard performance
                        small_frame = cv2.resize(frame, (640, 360))
                        _, buffer = cv2.imencode('.jpg', small_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        frame_base64 = base64.b64encode(buffer).decode('utf-8')
                        
                        self.emit_dashboard_update('frame', {
                            'frame_count': frame_count,
                            'frame': frame_base64,
                            'probability': last_prob,
                            'timestamp': datetime.now().isoformat(),
                            'width': width,
                            'height': height
                        })
                    except Exception as e:
                        print(f"Error encoding frame: {e}")
                else:
                    # Just update count and probability
                    self.emit_dashboard_update('frame', {
                        'frame_count': frame_count,
                        'probability': last_prob,
                        'timestamp': datetime.now().isoformat(),
                        'width': width,
                        'height': height
                    })

                # Check for REAL accident detection
                if pred == "Accident" and last_prob > Config.ACCIDENT_THRESHOLD and not self.alarm_triggered:
                    print(f"\n🚨 ACCIDENT DETECTED! Confidence: {last_prob:.1f}%")
                    
                    # Save accident photo
                    accident_photo_path = self.save_accident_photo(frame)
                    
                    # Prepare accident data
                    self.current_accident_data = {
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'probability': last_prob,
                        'photo_path': accident_photo_path,
                        'location': 'Unknown',
                        'plate_text': None
                    }
                    
                    self.alarm_triggered = True
                    self.scanning_for_plate = True
                    accidents_detected += 1
                    
                    self.emit_dashboard_update('accident', self.current_accident_data)
                    
                    # Record in archive
                    try:
                        self.current_accident_id, _ = self.archive.record_accident(
                            self.current_analysis_id,
                            frame_count,
                            last_prob,
                            frame
                        )
                    except Exception as archive_err:
                        print(f"⚠ Archive error: {archive_err}")
                    
                    # Show alert
                    self.start_alert_thread(self.current_accident_data)
                
                # License plate detection after accident
                if self.scanning_for_plate and not self.plate_found and frame_count % Config.FRAME_SKIP == 0:
                    frame_path = self.save_frame_for_plate_detection(frame, frame_count)
                    if frame_path:
                        plate_result = self.plate_detector.detect_and_extract(frame_path)
                        if plate_result['success']:
                            self.plate_found = True
                            self.current_accident_data['plate_text'] = plate_result['text']
                            print(f"✓ License plate detected: {plate_result['text']}")
                            
                            # Update archive with plate info
                            if self.current_accident_id:
                                try:
                                    self.archive.update_accident_license_plate(
                                        self.current_accident_id, 
                                        plate_result['plate_path']
                                    )
                                except Exception as e:
                                    print(f"⚠ Error updating archive with plate: {e}")

                            # Emit plate detection to dashboard
                            self.emit_dashboard_update('plate_detected', {
                                'text': plate_result['text'],
                                'path': plate_result['plate_path']
                            })
                        
                        # Clean up temporary frame
                        try:
                            os.remove(frame_path)
                        except:
                            pass
                
                # Draw UI on frame
                self.draw_ui(frame, pred, last_prob, frame_count)
                
                # Show frame (only if not running in headless mode / web dashboard)
                if not self.use_web_dashboard:
                    try:
                        cv2.imshow('Smart Resq - Press Q to quit', frame)
                        
                        # Check for quit
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            print("\n⚠ User requested quit")
                            break
                    except Exception as gui_error:
                        print(f"⚠ GUI not available: {gui_error}")
                        # If GUI fails, continue without it
                else:
                    # In web dashboard mode, we still need a small wait for stability
                    time.sleep(0.01)
                
        except KeyboardInterrupt:
            print("\n⚠ Interrupted by user")
        except Exception as e:
            print(f"\n✗ Error in main loop: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Complete archive
            if self.current_analysis_id:
                try:
                    self.archive.complete_analysis(self.current_analysis_id, frame_count, 0) # Count will be updated in db
                except:
                    pass
                    
            video.release()
            
            # Finalize archive
            try:
                if self.current_analysis_id:
                    self.archive.complete_analysis(self.current_analysis_id, frame_count, accidents_detected)
                    print(f"📁 Archive session #{self.current_analysis_id} completed: {accidents_detected} accidents detected.")
            except Exception as e:
                print(f"⚠ Error completing archive: {e}")

            try:
                cv2.destroyAllWindows()
            except:
                pass
            print("\n✓ Smart Resq stopped\n")
    
    def draw_ui(self, frame, pred, probability, frame_count):
        """Draw UI elements on frame"""
        # Status bar background
        cv2.rectangle(frame, (0, 0), (400, 100), (0, 0, 0), -1)
        
        # Prediction text
        color = (0, 255, 0) if pred == "No Accident" else (0, 0, 255)
        cv2.putText(frame, f"{pred}: {probability:.1f}%", (10, 30), 
                   self.font, 0.8, color, 2)
        
        # Frame counter
        cv2.putText(frame, f"Frame: {frame_count}", (10, 60), 
                   self.font, 0.6, (255, 255, 255), 1)
        
        # Status indicators
        status_y = 90
        if self.alarm_triggered:
            cv2.putText(frame, "ALERT ACTIVE", (10, status_y), 
                       self.font, 0.5, (0, 0, 255), 1)
        
        if self.scanning_for_plate:
            status_text = "Plate: Found" if self.plate_found else "Scanning..."
            status_color = (0, 255, 0) if self.plate_found else (255, 255, 0)
            cv2.putText(frame, status_text, (200, status_y), 
                       self.font, 0.5, status_color, 1)


# Legacy function for backward compatibility
def startapplication():
    """Legacy function to start the application"""
    system = AccidentDetectionSystem()
    system.run()


if __name__ == '__main__':
    startapplication()