# ─────────────────────────────────────────────────────────────
#  Smart Resq — Optimized Production Dockerfile
#  Target: Docker image < 2GB | Railway CPU deployment
#
#  Layer strategy:
#    1. OS deps (rarely change → cached longest)
#    2. Python deps (change on requirement updates)
#    3. App code (changes every deploy)
#    4. Model is NOT here — downloaded at runtime
# ─────────────────────────────────────────────────────────────

# Pin to bookworm (Debian 12 stable) to avoid apt package renames
# between Debian releases (e.g. libgl1-mesa-glx → libgl1 in Trixie)
FROM python:3.11-slim-bookworm

# ── Environment ───────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    DEBIAN_FRONTEND=noninteractive \
    # Disable TensorFlow GPU probing (we have no GPU on Railway)
    CUDA_VISIBLE_DEVICES="" \
    TF_CPP_MIN_LOG_LEVEL=3 \
    # Tell OpenCV not to look for display — headless server
    DISPLAY=""

# ── System dependencies ───────────────────────────────────────
# Installed in a single RUN to keep layer count minimal.
# libgl1 + libglib2 → required by opencv-python-headless
# ffmpeg            → RTSP stream decoding via CAP_FFMPEG
# tesseract-ocr     → license plate OCR (replaces EasyOCR/PyTorch)
# curl              → health-check probe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-eng \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────
WORKDIR /app

# ── Python dependencies (separate layer for caching) ─────────
# Copy ONLY requirements first so this layer is cached unless
# requirements.txt changes (not on every code change).
COPY requirements.txt .
RUN pip install --upgrade pip --quiet && \
    pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────
COPY . .

# ── Runtime directories ───────────────────────────────────────
# Created here so the app doesn't need write permission on /
# (also ensures they exist even on a fresh container)
RUN mkdir -p \
    accident_photos \
    plate_detection_frames \
    vehicle_no_plates \
    uploaded_videos \
    archives \
    models \
    static

# ── Port ─────────────────────────────────────────────────────
# Railway injects $PORT — do NOT hardcode 5000 here
EXPOSE 5000

# ── Health check ─────────────────────────────────────────────
# Railway will mark the deploy as healthy once this passes.
# start-period=300s gives TF model download time to complete.
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/api/status || exit 1

# ── Start command ─────────────────────────────────────────────
# gthread worker: 1 process, 8 threads — correct for SocketIO with
# threading async_mode. We must NOT use multiple workers because
# dashboard_state and CameraManager live in process memory.
# --timeout 300: accommodates model download on first boot.
CMD gunicorn \
    --worker-class gthread \
    --workers 1 \
    --threads 8 \
    --bind 0.0.0.0:${PORT:-5000} \
    --timeout 300 \
    --keep-alive 75 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    app:app
