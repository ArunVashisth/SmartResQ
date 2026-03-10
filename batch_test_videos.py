"""
batch_test_videos.py
─────────────────────────────────────────────
Batch terminal test: analyse multiple video files in sequence
and produce a consolidated JSON report.

Usage:
    python batch_test_videos.py
    python batch_test_videos.py --videos new.mp4 road.avi highway.mov --threshold 90
"""
import argparse
import cv2
import numpy as np
import os
import json
import time
import random


def sec_to_hms(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def analyse_single(cap, fps, total_frames, model, threshold, frame_skip):
    """Inner loop — returns list of accident dicts."""
    accidents   = []
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % frame_skip != 0:
            continue

        pred       = "No Accident"
        confidence = 0.0

        try:
            from config import Config
            if model:
                rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                roi  = cv2.resize(rgb, Config.MODEL_INPUT_SIZE)
                pred_label, prob = model.predict_accident(roi[np.newaxis, :, :])
                pred = pred_label
                confidence = float(prob[0][0]) * 100 if pred == "Accident" else float(prob[0][1]) * 100
            else:
                if random.random() < 0.003:
                    pred, confidence = "Accident", random.uniform(85, 99)
                else:
                    pred, confidence = "No Accident", random.uniform(1, 15)
        except Exception:
            continue

        if pred == "Accident" and confidence > threshold:
            ts = sec_to_hms(frame_count / fps)
            accidents.append({
                "frame": frame_count,
                "timestamp": ts,
                "confidence": round(confidence, 2)
            })

        if frame_count % 300 == 0:
            pct = frame_count / total_frames * 100 if total_frames else 0
            print(f"       [{pct:5.1f}%] frame {frame_count}", end="\r")

    return frame_count, accidents


def main():
    parser = argparse.ArgumentParser(
        description="Smart Resq – Batch Video Analysis")
    parser.add_argument("--videos",     nargs="+",   default=["new.mp4"],
                        help="One or more video file paths")
    parser.add_argument("--threshold",  type=float,  default=99.0)
    parser.add_argument("--frame-skip", type=int,    default=5)
    parser.add_argument("--demo",       action="store_true")
    parser.add_argument("--output",     default="batch_results.json")
    args = parser.parse_args()

    # Load model once for all videos
    model = None
    if not args.demo:
        try:
            from config import Config
            from detection import AccidentDetectionModel
            model = AccidentDetectionModel(Config.MODEL_JSON_PATH, Config.MODEL_WEIGHTS_PATH)
            print("✓ Model loaded\n")
        except Exception as e:
            print(f"⚠  Demo mode: {e}\n")

    batch_results = []
    grand_start   = time.time()

    print("=" * 65)
    print(f"  Smart Resq Batch Analysis | threshold={args.threshold}% | skip={args.frame_skip}")
    print("=" * 65)

    for path in args.videos:
        if not os.path.exists(path):
            print(f"\n⚠  Skipping (not found): {path}")
            batch_results.append({"video": path, "error": "File not found"})
            continue

        cap   = cv2.VideoCapture(path)
        fps   = cap.get(cv2.CAP_PROP_FPS) or 30
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w     = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        print(f"\n  📹 {os.path.basename(path)}")
        print(f"     {w}×{h}  |  {fps:.1f}fps  |  {total/fps:.1f}s  |  {total} frames")

        t0 = time.time()
        frame_count, accidents = analyse_single(
            cap, fps, total, model, args.threshold, args.frame_skip)
        cap.release()
        elapsed = round(time.time() - t0, 2)

        status = "🚨" if accidents else "✅"
        print(f"     {status} {len(accidents)} accident(s) in {frame_count} frames  "
              f"({elapsed}s)")

        if accidents:
            for acc in accidents:
                print(f"        • {acc['timestamp']}  frame {acc['frame']}  "
                      f"conf={acc['confidence']}%")

        batch_results.append({
            "video":        path,
            "total_frames": frame_count,
            "fps":          round(fps, 2),
            "duration":     round(total / fps, 2),
            "resolution":   f"{w}x{h}",
            "accidents":    len(accidents),
            "accident_details": accidents,
            "elapsed_sec":  elapsed
        })

    # Summary
    print("\n" + "═" * 65)
    print("📊  BATCH SUMMARY")
    print("═" * 65)
    total_vids   = len(batch_results)
    total_acc    = sum(r.get("accidents", 0) for r in batch_results)
    total_time   = round(time.time() - grand_start, 2)
    print(f"  Videos analysed  : {total_vids}")
    print(f"  Total accidents  : {total_acc}")
    print(f"  Total time       : {total_time}s")

    with open(args.output, "w") as f:
        json.dump(batch_results, f, indent=2)
    print(f"  Results saved to : {args.output}")


if __name__ == "__main__":
    main()
