"""
test_video.py
─────────────────────────────────────────────
Quick terminal test: analyse a single video file with the
Smart Resq accident detection model.

Usage:
    python test_video.py
    python test_video.py --video my_footage.mp4 --threshold 90 --frame-skip 3
"""
import argparse
import cv2
import numpy as np
import os
import json
import time

def sec_to_hms(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def analyse_video(video_path, threshold, frame_skip, use_demo=False):
    """Analyse a video file and return a list of detected accidents."""
    from config import Config

    model = None
    if not use_demo:
        try:
            from detection import AccidentDetectionModel
            model = AccidentDetectionModel(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)
            print("✓ Accident detection model loaded")
        except Exception as e:
            print(f"!  Model load error: {e}")
            model = None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps          = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration     = total_frames / fps

    print(f"\n📹  Video : {os.path.basename(video_path)}")
    print(f"    Size  : {width}×{height}  |  {fps:.2f} FPS  |  {duration:.1f}s  |  {total_frames} frames")
    print(f"    Config: threshold={threshold}%  frame-skip={frame_skip}")
    print("─" * 60)

    accidents    = []
    frame_count  = 0
    start_time   = time.time()
    import random

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            if frame_count % frame_skip != 0:
                continue

            # ── Prediction ──
            pred       = "No Accident"
            confidence = 0.0

            try:
                if model:
                    rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    roi  = cv2.resize(rgb, Config.MODEL_INPUT_SIZE)
                    pred_label, prob = model.predict_accident(roi[np.newaxis, :, :])
                    pred = pred_label
                    # prob is always shape (1, 2): [p_accident, p_no_accident]
                    # Use accident probability (index 0) for confidence
                    confidence = float(prob[0][0]) * 100
            except Exception as pe:
                print(f"  ! Prediction error at frame {frame_count}: {pe}")
                continue

            if pred == "Accident" and confidence > threshold:
                ts = sec_to_hms(frame_count / fps)
                accidents.append({
                    "frame":      frame_count,
                    "timestamp":  ts,
                    "confidence": round(confidence, 2)
                })
                print(f"  🚨  ACCIDENT  frame={frame_count:>6}  time={ts}  conf={confidence:.1f}%")

            # Progress indicator (every 500 frames)
            if frame_count % 500 == 0:
                elapsed = time.time() - start_time
                pct     = frame_count / total_frames * 100
                fps_proc = frame_count / elapsed if elapsed > 0 else 0
                print(f"     [{pct:5.1f}%]  frame {frame_count}/{total_frames}"
                      f"  ({fps_proc:.1f} frames/s)     ", end="\r")

    finally:
        cap.release()

    return {
        "video":        video_path,
        "total_frames": frame_count,
        "fps":          round(fps, 2),
        "duration":     round(duration, 2),
        "resolution":   f"{width}x{height}",
        "threshold":    threshold,
        "frame_skip":   frame_skip,
        "accidents":    accidents,
        "elapsed_sec":  round(time.time() - start_time, 2)
    }


def main():
    # Read defaults from Config / .env so changes in .env are respected automatically
    from config import Config

    parser = argparse.ArgumentParser(
        description="Smart Resq – Video Analysis CLI Test")
    parser.add_argument("--video",      default="new.mp4",
                        help="Path to the video file (default: new.mp4)")
    parser.add_argument("--threshold",  type=float, default=Config.ACCIDENT_THRESHOLD,
                        help=f"Detection threshold %% (default from .env: {Config.ACCIDENT_THRESHOLD})")
    parser.add_argument("--frame-skip", type=int,   default=Config.FRAME_SKIP,
                        help=f"Process every Nth frame (default from .env: {Config.FRAME_SKIP})")
    parser.add_argument("--demo",       action="store_true",
                        help="Force demo mode (random detections, no model needed)")
    parser.add_argument("--output",     default=None,
                        help="Save results to a JSON file")
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print(f"❌  File not found: {args.video}")
        return

    try:
        result = analyse_video(
            video_path  = args.video,
            threshold   = args.threshold,
            frame_skip  = args.frame_skip,
            use_demo    = args.demo
        )
    except Exception as e:
        print(f"\n❌  Error: {e}")
        return

    # Summary
    print("\n" + "═" * 60)
    print("📊  ANALYSIS COMPLETE")
    print("═" * 60)
    print(f"  Video       : {os.path.basename(result['video'])}")
    print(f"  Frames      : {result['total_frames']}")
    print(f"  Duration    : {result['duration']}s")
    print(f"  Elapsed     : {result['elapsed_sec']}s")
    print(f"  🚨 Accidents: {len(result['accidents'])}")

    if result["accidents"]:
        print("\n  Detected accident timestamps:")
        for acc in result["accidents"]:
            print(f"    • {acc['timestamp']}  (frame {acc['frame']}, {acc['confidence']}%)")
    else:
        print("\n  ✅  No accidents detected above threshold.")

    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n  Results saved to: {args.output}")


if __name__ == "__main__":
    main()
