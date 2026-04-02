# 🎬 Smart Resq — Video Analysis Testing Guide

A complete reference for testing the **Video Analysis** feature with different
video files, both through the **Web Dashboard** and from the **Terminal / Python CLI**.

---

## Table of Contents

1. [Overview](#overview)  
2. [Prerequisites](#prerequisites)  
3. [Testing via the Web Dashboard](#testing-via-the-web-dashboard)  
   - 3.1 [Starting the server](#31-starting-the-server)  
   - 3.2 [Uploading a video](#32-uploading-a-video)  
   - 3.3 [Running the analysis](#33-running-the-analysis)  
   - 3.4 [Reading the results](#34-reading-the-results)  
   - 3.5 [Stopping / Resetting](#35-stopping--resetting)  
4. [Testing via the REST API (curl / Postman)](#testing-via-the-rest-api)  
5. [Testing Directly from the Terminal (Python)](#testing-directly-from-the-terminal-python)  
   - 5.1 [Quick single-file test](#51-quick-single-file-test)  
   - 5.2 [Batch test multiple videos](#52-batch-test-multiple-videos)  
   - 5.3 [Adjusting detection threshold](#53-adjusting-detection-threshold)  
6. [Video File Recommendations](#video-file-recommendations)  
7. [API Reference](#api-reference)  
8. [Troubleshooting](#troubleshooting)  

---

## Overview

The Video Analysis feature lets you **upload any video file** to the Smart Resq
system and run the same AI accident-detection model that is used on the live camera
feed — frame by frame.

Results are streamed back to the browser in real time via **SocketIO** *and*
available as a JSON response when using the API or Python CLI.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python (3.9 – 3.11 recommended) | `python --version` |
| Smart Resq dependencies installed | `pip install -r requirements.txt` |
| Model files present | `model.json` + `model_weights.keras` in project root |
| Flask server running | see §3.1 |

---

## Testing via the Web Dashboard

### 3.1 Starting the server

```powershell
# From the Smart Resq project directory
python app.py
```

The server starts on **http://localhost:5000** (or whatever FLASK_PORT is set to
in `.env`).  Open that URL in any modern browser.

---

### 3.2 Uploading a video

1. Click **🎬 Video Analysis** in the left sidebar.
2. You will see the **Video Analysis Engine** panel.
3. **Drag-and-drop** a video file onto the dashed blue area, **or** click the
   area to open a file picker.
4. Supported formats: `.mp4 · .avi · .mov · .mkv · .webm · .wmv · .flv · .m4v`
5. An upload progress bar will appear. When complete, the **video info cards**
   will populate:

   | Card | What it shows |
   |---|---|
   | FILE | Original filename |
   | DURATION | Total seconds |
   | FRAMES | Total frame count |
   | FPS | Detected frame-rate |
   | RESOLUTION | Width × Height |

6. Status badge (top right of panel) changes to **READY** (blue).

---

### 3.3 Running the analysis

1. Optionally adjust the **DETECTION THRESHOLD** slider (default 99 %).  
   Lower values (e.g. 70 %) will flag more potential accidents.
2. Click **▶ Analyse Video**.
3. The **Analysis Progress** panel appears, showing:
   - Progress bar with % complete
   - Frames processed / total
   - Accidents found so far
   - Current frame prediction badge (green = safe, red = accident)
4. The **Live Frame Preview** canvas updates every 15 frames with the current
   frame being analysed — identical to the live camera feed experience.

---

### 3.4 Reading the results

When the analysis completes, the status badge turns **COMPLETE** (green) and a
toast notification shows the summary.

| Section | Description |
|---|---|
| Progress bar | Shows 100% |
| Accidents found counter | Total number of detected accidents |
| 🚨 Detected Accidents Timeline | Scrollable list of all accident events |

Each **Timeline Item** shows:
- **Timestamp** – position in the video (HH:MM:SS)
- **Frame number** – the exact frame where the accident was detected
- **Confidence %** – model probability score

---

### 3.5 Stopping / Resetting

| Button | Action |
|---|---|
| ⏹ **Stop** | Immediately halts background analysis; partial results are kept |
| 🔄 **Reset** | Clears uploaded file and all results; ready for a new upload |

---

## Testing via the REST API

You can test every endpoint without opening the browser.

### Upload a video

```powershell
# PowerShell (Windows)
$file = "C:\Users\arunv\Desktop\Smart Resq\new.mp4"
curl -X POST http://localhost:5000/api/upload-video `
     -F "video=@$file"
```

```bash
# bash / Git Bash
curl -X POST http://localhost:5000/api/upload-video \
     -F "video=@new.mp4"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "video_info": {
    "name": "new.mp4",
    "total_frames": 4320,
    "fps": 30.0,
    "duration_seconds": 144.0,
    "resolution": "1920x1080"
  }
}
```

---

### Start analysis

```powershell
curl -X POST http://localhost:5000/api/analyze-video `
     -H "Content-Type: application/json" `
     -d '{"threshold": 99, "frame_skip": 5}'
```

`threshold` – minimum confidence (%) to flag an accident (default: 99)  
`frame_skip` – only run the model every Nth frame (default: 5)

---

### Poll status

```powershell
curl http://localhost:5000/api/video-analysis/status
```

```json
{
  "status": "analyzing",
  "video_name": "new.mp4",
  "total_frames": 4320,
  "processed_frames": 1800,
  "progress_percent": 41.7,
  "fps": 30.0,
  "duration_seconds": 144.0,
  "accidents_found": [],
  "error": null,
  "start_time": "2026-02-19T21:55:36",
  "end_time": null
}
```

Status values: `idle | ready | analyzing | complete | error | stopped`

---

### Stop analysis

```powershell
curl -X POST http://localhost:5000/api/video-analysis/stop
```

### Reset / clear uploaded file

```powershell
curl -X POST http://localhost:5000/api/video-analysis/reset
```

---

## Testing Directly from the Terminal (Python)

These scripts run **without launching the Flask server** — they read frames and
call the model directly, useful for quick CI/CD or batch checks.

### 5.1 Quick single-file test

Save as `test_video.py` in the project root (already created — see below) or run
inline:

```python
# test_video.py
import cv2
import numpy as np
from detection import AccidentDetectionModel
from config import Config

VIDEO_PATH   = "new.mp4"          # ← change to your video path
THRESHOLD    = 99.0               # confidence % to flag accident
FRAME_SKIP   = 5                  # process every Nth frame

# Load model
model = AccidentDetectionModel(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print(f"❌ Cannot open video: {VIDEO_PATH}")
    exit(1)

fps          = cap.get(cv2.CAP_PROP_FPS) or 30
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"📹 Video: {VIDEO_PATH}")
print(f"   {total_frames} frames  |  {fps:.1f} FPS  |  {total_frames/fps:.1f}s")
print(f"   Threshold: {THRESHOLD}%  |  Frame-skip: {FRAME_SKIP}\n")

accidents = []
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame_count += 1

    if frame_count % FRAME_SKIP != 0:
        continue

    # Preprocess
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    roi = cv2.resize(rgb, Config.MODEL_INPUT_SIZE)

    # Predict
    pred, prob = model.predict_accident(roi[np.newaxis, :, :])
    if pred == "Accident":
        confidence = float(prob[0][0]) * 100
    else:
        confidence = float(prob[0][1]) * 100

    if pred == "Accident" and confidence > THRESHOLD:
        ts = frame_count / fps
        hms = f"{int(ts//3600):02d}:{int((ts%3600)//60):02d}:{int(ts%60):02d}"
        print(f"🚨 ACCIDENT  frame={frame_count:>6}  time={hms}  conf={confidence:.1f}%")
        accidents.append({
            "frame": frame_count,
            "timestamp": hms,
            "confidence": confidence
        })

    # Progress
    if frame_count % 100 == 0:
        pct = frame_count / total_frames * 100
        print(f"   [{pct:5.1f}%] frame {frame_count}/{total_frames}", end="\r")

cap.release()

print(f"\n\n✅ Done.  {frame_count} frames scanned.")
print(f"   🚨 Accidents found: {len(accidents)}")
for acc in accidents:
    print(f"      • {acc['timestamp']}  frame {acc['frame']}  ({acc['confidence']:.1f}%)")
```

**Run it:**

```powershell
cd "C:\Users\arunv\Desktop\Smart Resq"
python test_video.py
```

---

### 5.2 Batch test multiple videos

```python
# batch_test_videos.py  – test several files at once
import cv2, numpy as np, os, json
from detection import AccidentDetectionModel
from config import Config

VIDEO_FILES = [
    "new.mp4",
    r"C:\Users\arunv\Videos\road_cam_01.mp4",
    r"C:\Users\arunv\Videos\highway_footage.avi",
]
THRESHOLD  = 99.0
FRAME_SKIP = 5

model = AccidentDetectionModel(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)
results = {}

for path in VIDEO_FILES:
    if not os.path.exists(path):
        print(f"⚠  Skipping (not found): {path}")
        continue

    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    accidents = []
    fc = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        fc += 1
        if fc % FRAME_SKIP != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        roi = cv2.resize(rgb, Config.MODEL_INPUT_SIZE)
        pred, prob = model.predict_accident(roi[np.newaxis, :, :])
        conf = float(prob[0][0]) * 100 if pred == "Accident" else float(prob[0][1]) * 100

        if pred == "Accident" and conf > THRESHOLD:
            ts = fc / fps
            accidents.append({
                "frame": fc,
                "timestamp": f"{int(ts//3600):02d}:{int((ts%3600)//60):02d}:{int(ts%60):02d}",
                "confidence": round(conf, 2)
            })

    cap.release()
    results[path] = {"frames": fc, "accidents": len(accidents), "details": accidents}
    status = "🚨" if accidents else "✅"
    print(f"{status}  {os.path.basename(path)}: {len(accidents)} accidents / {fc} frames")

print("\n--- Batch Results ---")
print(json.dumps(results, indent=2))
```

```powershell
python batch_test_videos.py
```

---

### 5.3 Adjusting detection threshold

The threshold controls sensitivity:

| Threshold | Behaviour |
|---|---|
| 99 % (default) | Only flags very high-confidence accidents; few false positives |
| 80 % | More sensitive; may flag near-miss events |
| 60 % | High sensitivity; useful for finding any suspicious frames |
| 50 % | Maximum sensitivity (50/50 coin-flip level) |

Change via:
- **Web:** use the "DETECTION THRESHOLD" slider before clicking Analyse.
- **API:** pass `"threshold": 80` in the POST body to `/api/analyze-video`.
- **Python CLI:** change `THRESHOLD = 80.0` at the top of the script.

---

## Video File Recommendations

| Scenario | What to use |
|---|---|
| Quick smoke-test | `new.mp4` (already in the project folder) |
| Accuracy test | Download dashcam footage from public datasets (e.g. DETRAC, DOTA) |
| Edge cases | Low-light, night-time, or rainy videos |
| No-accident baseline | Normal traffic videos — verify 0 detections |
| High-confidence positive | Known crash videos — verify ≥1 detection |
| Long video | Videos >10 min stress-test memory and streaming |

**Free test video sources:**
- https://www.videvo.net (search "car crash")  
- https://www.youtube.com (download via yt-dlp; for research/testing only)  
- CADP Dataset — https://github.com/MWaseemAbbasi/CADP

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-video` | Upload a video file (multipart/form-data, field: `video`) |
| `POST` | `/api/analyze-video` | Start analysis; body: `{"threshold": 99, "frame_skip": 5}` |
| `GET`  | `/api/video-analysis/status` | Poll current progress and results |
| `POST` | `/api/video-analysis/stop` | Stop ongoing analysis |
| `POST` | `/api/video-analysis/reset` | Clear uploaded file and reset state |

**SocketIO events emitted by the server:**

| Event | Payload | When |
|---|---|---|
| `video_analysis_progress` | `{frame_count, total_frames, progress, frame?, current_pred?, current_prob?, accidents_so_far}` | Every frame; frame image every 15th |
| `video_analysis_accident` | `{frame, timestamp_sec, timestamp_str, probability}` | When an accident is detected |
| `video_analysis_complete` | `{total_frames, accidents, duration_seconds}` | Analysis finished |
| `video_analysis_error` | `{error}` | Exception occurred |
| `video_analysis_stopped` | `{}` | Stop requested via API |

---

## Troubleshooting

### Model not loaded (`Warning: TensorFlow not available`)

The system falls back to **demo mode** — random detections at low probability.
To use the real model, install TensorFlow:

```powershell
pip install "tensorflow>=2.15.0"
# or for Python 3.12+
pip install "tf-keras>=2.15.0"
```

### Upload fails with "Cannot open video file"

- Ensure the file is not corrupt; try opening it in VLC.
- Make sure the `uploaded_videos/` directory exists (auto-created on server start).
- Try re-encoding the video: `ffmpeg -i input.mkv -c:v libx264 output.mp4`

### Analysis stops immediately

- Check the terminal running `app.py` for Python tracebacks.
- Common cause: GPU/CPU memory exhausted — reduce frame resolution or increase `frame_skip`.

### Progress bar stuck at 0%

- Ensure the browser SocketIO connection is established (check the "NEURAL LINK
  ESTABLISHED" toast on page load).
- Reload the page and try again.

### Video plays fine in the browser but wrong resolution shown

- OpenCV sometimes misreads container headers. The resolution shown is from
  OpenCV's `CAP_PROP_FRAME_WIDTH / HEIGHT` — it may differ from the container
  metadata. This does not affect analysis accuracy.

---

*Generated by Smart Resq — v2.1.0 — 2026-02-19*
