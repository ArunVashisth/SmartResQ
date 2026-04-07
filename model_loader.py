"""
model_loader.py — Runtime model download and caching for Railway deployment.

Why this exists:
  The TF model weights file is ~270MB. Baking it into the Docker image
  would make every redeploy re-upload 270MB unnecessarily.  Instead we
  download it once at container startup and cache it on the filesystem.

Flow:
  1. On first boot: download model.json + model_weights.keras from Google Drive
  2. Save to models/ directory
  3. On subsequent boots: skip download (files already present)

Usage in detection.py / camera.py:
  from model_loader import ensure_model_ready
  ensure_model_ready()   # call once before loading the model
"""

import os
import sys
import hashlib
import threading
import time

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_DIR = os.getenv("MODEL_DIR", "models")
MODEL_JSON_FILE = os.path.join(MODEL_DIR, "model.json")
MODEL_WEIGHTS_FILE = os.path.join(MODEL_DIR, "model_weights.keras")

# ── Google Drive file IDs — set these in your Railway environment variables ──
# How to get a file ID:
#   1. Upload each file to Google Drive
#   2. Right-click → Share → Anyone with link → Copy link
#   3. The ID is the long string between /d/ and /view in the URL
GDRIVE_MODEL_JSON_ID      = os.getenv("GDRIVE_MODEL_JSON_ID", "")
GDRIVE_MODEL_WEIGHTS_ID   = os.getenv("GDRIVE_MODEL_WEIGHTS_ID", "")

_download_lock = threading.Lock()
_model_ready   = False


def _gdrive_available() -> bool:
    """Check if gdown is installed and file IDs are configured."""
    if not GDRIVE_MODEL_JSON_ID or not GDRIVE_MODEL_WEIGHTS_ID:
        print("[ModelLoader] ⚠ Google Drive IDs not set — "
              "set GDRIVE_MODEL_JSON_ID and GDRIVE_MODEL_WEIGHTS_ID "
              "in Railway environment variables.")
        return False
    try:
        import gdown  # noqa: F401
        return True
    except ImportError:
        print("[ModelLoader] ⚠ gdown not installed. "
              "Add 'gdown==5.1.0' to requirements.txt")
        return False


def _download_file(file_id: str, dest: str) -> bool:
    """Download a single file from Google Drive via gdown."""
    import gdown  # local import so startup isn't slowed if model exists
    url = f"https://drive.google.com/uc?id={file_id}"
    print(f"[ModelLoader] ⬇ Downloading → {dest}")
    start = time.time()
    try:
        gdown.download(url, dest, quiet=False, fuzzy=True)
        elapsed = time.time() - start
        size_mb = os.path.getsize(dest) / (1024 * 1024)
        print(f"[ModelLoader] ✓ Downloaded {size_mb:.1f} MB in {elapsed:.1f}s")
        return True
    except Exception as e:
        print(f"[ModelLoader] ✗ Download failed: {e}")
        # Clean up partial file
        if os.path.exists(dest):
            os.remove(dest)
        return False


def ensure_model_ready(timeout: int = 300) -> bool:
    """
    Ensure model files are present locally.
    Downloads from Google Drive if missing.

    Args:
        timeout: Max seconds to wait for download (default 5 min).

    Returns:
        True if model files are ready, False otherwise.
    """
    global _model_ready

    # Fast path: already verified this session
    if _model_ready:
        return True

    with _download_lock:
        # Re-check inside lock in case another thread already finished
        if _model_ready:
            return True

        os.makedirs(MODEL_DIR, exist_ok=True)

        json_exists     = os.path.isfile(MODEL_JSON_FILE) and os.path.getsize(MODEL_JSON_FILE) > 100
        weights_exists  = os.path.isfile(MODEL_WEIGHTS_FILE) and os.path.getsize(MODEL_WEIGHTS_FILE) > 1024

        if json_exists and weights_exists:
            print(f"[ModelLoader] ✓ Model files found locally — skipping download.")
            _model_ready = True
            return True

        print("[ModelLoader] Model files not found. Attempting download…")

        if not _gdrive_available():
            print("[ModelLoader] ⚠ Cannot download — running in OpenCV fallback mode.")
            return False

        # Download missing files
        success = True

        if not json_exists:
            ok = _download_file(GDRIVE_MODEL_JSON_ID, MODEL_JSON_FILE)
            success = success and ok

        if not weights_exists:
            ok = _download_file(GDRIVE_MODEL_WEIGHTS_ID, MODEL_WEIGHTS_FILE)
            success = success and ok

        if success:
            print("[ModelLoader] ✓ All model files ready.")
            _model_ready = True
        else:
            print("[ModelLoader] ✗ Model download failed — system will use OpenCV fallback detector.")

        return success


def model_files_exist() -> bool:
    """Quick check — no download attempt."""
    return (
        os.path.isfile(MODEL_JSON_FILE) and os.path.getsize(MODEL_JSON_FILE) > 100
        and os.path.isfile(MODEL_WEIGHTS_FILE) and os.path.getsize(MODEL_WEIGHTS_FILE) > 1024
    )
