# ─────────────────────────────────────────────────────────────
#  Smart Resq – Production Dockerfile
#  Optimized for Railway.app deployment
#  Base: Python 3.11-slim (TF2.21 requires <3.12)
# ─────────────────────────────────────────────────────────────

FROM python:3.11-slim-bookworm

# --- Environment ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    DEBIAN_FRONTEND=noninteractive

# --- System dependencies ---
# libgl1 + libglib2 → OpenCV headless (still needs these libs)
# ffmpeg            → RTSP/H.264 camera stream decoding
# tesseract-ocr     → OCR fallback engine
# gcc/build-essential → needed to compile some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-eng \
    gcc \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- Working directory ---
WORKDIR /app

# --- Install Python dependencies (cached as a layer) ---
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Copy all project files ---
COPY . .

# --- Create required runtime directories ---
# These are ephemeral on cloud (re-created each deploy), but needed at startup
RUN mkdir -p accident_photos \
             plate_detection_frames \
             vehicle_no_plates \
             uploaded_videos \
             archives \
             static

# --- Expose Flask port ---
EXPOSE 5000

# --- Health check so Railway knows when it's ready ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/status || exit 1

# --- Start with Gunicorn + threading worker ---
# We use threading (not eventlet) since it proved most stable on Python 3.11+ / Windows-built environments
# -w 1 is intentional: multiple workers break shared in-memory state (camera manager, dashboard_state, etc.)
CMD ["gunicorn", \
     "--worker-class", "gthread", \
     "--workers", "1", \
     "--threads", "8", \
     "--bind", "0.0.0.0:5000", \
     "--timeout", "300", \
     "--keep-alive", "75", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "app:app"]
