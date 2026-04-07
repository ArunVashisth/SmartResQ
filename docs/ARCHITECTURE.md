# Smart Resq System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  📹 Live Camera (USB/IP)  │  📼 Video File  │  🎥 RTSP Stream   │
└────────────┬────────────────────────┬───────────────────┬────────┘
             │                        │                   │
             └────────────────────────┴───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMERA MODULE (camera.py)                     │
├─────────────────────────────────────────────────────────────────┤
│  • Video capture & frame processing                             │
│  • Frame preprocessing (resize, color conversion)               │
│  • State management (alarm, scanning, plate detection)          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ACCIDENT DETECTION (detection.py)                   │
├─────────────────────────────────────────────────────────────────┤
│  🤖 TensorFlow/Keras Model                                      │
│  • Input: 250x250 RGB frame                                     │
│  • Output: [Accident, No Accident] + Probability                │
│  • Threshold: 99% confidence                                    │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─── No Accident ──► Continue monitoring
             │
             └─── Accident Detected (>99%) ──┐
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACCIDENT RESPONSE                             │
├─────────────────────────────────────────────────────────────────┤
│  1. 📸 Save accident photo (accident_photos/)                   │
│  2. 🔔 Trigger alert (GUI popup + sound)                        │
│  3. 🔍 Start license plate scanning                             │
│  4. 📊 Update dashboard (WebSocket)                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│         LICENSE PLATE DETECTION (license_plate_detection.py)    │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Computer Vision Pipeline:                                   │
│  1. Grayscale conversion                                        │
│  2. Bilateral filtering (noise reduction)                       │
│  3. Canny edge detection                                        │
│  4. Contour analysis (aspect ratio 2.0-5.5)                     │
│  5. Plate extraction & enhancement                              │
│                                                                  │
│  📝 OCR Processing:                                             │
│  • EasyOCR (GPU/CPU) OR Tesseract                              │
│  • Text cleaning & formatting                                   │
│  • Confidence scoring                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EMERGENCY RESPONSE                              │
├─────────────────────────────────────────────────────────────────┤
│  📞 Twilio Integration:                                         │
│  • Auto-call after 10 seconds                                   │
│  • Manual call option                                           │
│  • TwiML voice message                                          │
│                                                                  │
│  💾 Data Storage:                                               │
│  • Accident photos with timestamp                               │
│  • License plate images                                         │
│  • Extracted text                                               │
└─────────────────────────────────────────────────────────────────┘


## Web Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEB BROWSER (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  HTML (dashboard.html) + CSS + JavaScript                       │
│  • Real-time UI updates                                         │
│  • WebSocket connection                                         │
│  • REST API calls                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTP/WebSocket
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FLASK SERVER (app.py)                          │
├─────────────────────────────────────────────────────────────────┤
│  🌐 REST API Endpoints:                                         │
│  • GET  /api/status                                             │
│  • POST /api/start                                              │
│  • POST /api/stop                                               │
│  • GET  /api/accidents                                          │
│  • GET  /api/config                                             │
│                                                                  │
│  🔌 WebSocket Events:                                           │
│  • accident_detected                                            │
│  • plate_detected                                               │
│  • frame_update                                                 │
│  • stats_update                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Callback
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DETECTION SYSTEM (camera.py)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Runs in separate thread                                      │
│  • Emits events to dashboard                                    │
│  • Processes video frames                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Camera Feed ──► Frame Processing ──► AI Detection ──┬──► No Accident
                                                     │
                                                     └──► Accident
                                                          │
                                                          ├──► Save Photo
                                                          ├──► Alert User
                                                          ├──► Scan Plate
                                                          │    │
                                                          │    └──► OCR
                                                          │         │
                                                          │         └──► Extract Text
                                                          │
                                                          └──► Call Ambulance
```

## Configuration Flow

```
.env File ──► config.py ──► Application Modules
                │
                ├──► camera.py (video source, thresholds)
                ├──► license_plate_detection.py (OCR engine)
                ├──► app.py (Flask settings)
                └──► detection.py (model paths)
```

## File Storage Structure

```
Smart Resq/
├── accident_photos/
│   ├── 2026-02-12-145230.jpg
│   ├── 2026-02-12-150145.jpg
│   └── ...
│
├── vehicle_no_plates/
│   ├── 2026-02-12-145230_plate.jpg
│   ├── 2026-02-12-150145_plate.jpg
│   └── ...
│
└── plate_detection_frames/
    └── (temporary frames, auto-deleted)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  • HTML5                                                         │
│  • CSS3 (Modern dark theme with animations)                     │
│  • JavaScript (ES6+)                                            │
│  • Socket.IO Client                                             │
│  • Chart.js (for future analytics)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Python 3.8-3.12                                              │
│  • Flask (Web framework)                                        │
│  • Flask-SocketIO (WebSocket)                                   │
│  • Flask-CORS (Cross-origin)                                    │
│  • Eventlet (Async server)                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AI/ML & CV                                  │
├─────────────────────────────────────────────────────────────────┤
│  • TensorFlow 2.15+ (Deep learning)                             │
│  • Keras (Model API)                                            │
│  • OpenCV (Computer vision)                                     │
│  • NumPy (Numerical operations)                                 │
│  • EasyOCR (OCR engine)                                         │
│  • Tesseract (Alternative OCR)                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Twilio (Voice calls)                                         │
│  • Socket.IO (Real-time updates)                                │
│  • REST API (HTTP requests)                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Execution Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION MODES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Web Dashboard Mode (app.py)                                 │
│     ├─► Flask server on port 5000                               │
│     ├─► WebSocket communication                                 │
│     ├─► Browser-based UI                                        │
│     └─► REST API access                                         │
│                                                                  │
│  2. Standalone Mode (main.py)                                   │
│     ├─► Direct execution                                        │
│     ├─► OpenCV window display                                   │
│     ├─► Full AI detection                                       │
│     └─► No web interface                                        │
│                                                                  │
│  3. Demo Mode (main_demo.py)                                    │
│     ├─► No TensorFlow required                                  │
│     ├─► Simulated detection                                     │
│     ├─► All other features work                                 │
│     └─► Testing & development                                   │
│                                                                  │
│  4. Interactive Launcher (launcher.py)                          │
│     ├─► Menu-driven interface                                   │
│     ├─► Dependency checking                                     │
│     ├─► Multiple run options                                    │
│     └─► User-friendly                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE METRICS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frame Processing:                                              │
│  ├─► Input: 30 FPS (configurable)                               │
│  ├─► Processing: Every 5th frame (FRAME_SKIP)                   │
│  └─► Effective: 6 FPS for AI detection                          │
│                                                                  │
│  Detection Latency:                                             │
│  ├─► Frame capture: <10ms                                       │
│  ├─► AI inference: 50-100ms                                     │
│  ├─► Plate detection: 200-500ms                                 │
│  └─► OCR processing: 1-2 seconds                                │
│                                                                  │
│  Resource Usage:                                                │
│  ├─► CPU: 30-50% (single core)                                  │
│  ├─► RAM: 2-4 GB                                                │
│  ├─► GPU: Optional (TensorFlow)                                 │
│  └─► Disk: ~100MB per hour (photos)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Configuration Security:                                        │
│  ├─► .env file (not in git)                                     │
│  ├─► Environment variables                                      │
│  └─► Configurable secrets                                       │
│                                                                  │
│  Web Security:                                                  │
│  ├─► Flask secret key                                           │
│  ├─► CORS configuration                                         │
│  ├─► Input validation                                           │
│  └─► (TODO: Authentication)                                     │
│                                                                  │
│  Data Security:                                                 │
│  ├─► Local file storage                                         │
│  ├─► Timestamped filenames                                      │
│  └─► (TODO: Encryption)                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ Modular design
- ✅ Scalable components
- ✅ Real-time processing
- ✅ Multiple interfaces
- ✅ Flexible configuration
- ✅ Production-ready structure
.venv\Scripts\python.exe app.py