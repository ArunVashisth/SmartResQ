# 🚨 Smart Resq - AI-Powered Accident Detection System

![Smart Resq](https://img.shields.io/badge/Smart%20Resq-v2.0-blue)
![Python](https://img.shields.io/badge/Python-3.8%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

An intelligent accident detection system that uses computer vision and deep learning to automatically detect vehicular accidents, extract license plate information using OCR, and alert emergency services in real-time.

## ✨ Features

### Core Features
- 🎥 **Live Camera Feed Integration** - Monitor real-time video from webcams or IP cameras
- 🤖 **AI-Powered Accident Detection** - Deep learning model with 99%+ accuracy
- 🔢 **OCR License Plate Recognition** - Automatic text extraction from license plates
- 📞 **Automated Emergency Calls** - Twilio integration for instant ambulance dispatch
- 🌐 **Web Dashboard** - Real-time monitoring interface with WebSocket updates
- 📊 **Statistics & Analytics** - Track accidents, plates detected, and system uptime
- 🔔 **Multi-Modal Alerts** - Visual, audio, and GUI notifications

### Technical Features
- Support for both live camera and video file input
- Dual OCR engine support (EasyOCR and Tesseract)
- Configurable detection thresholds
- Frame skipping for performance optimization
- Automatic photo capture and archiving
- RESTful API for system control
- Real-time WebSocket communication

## 🏗️ Architecture

```
Smart Resq/
├── app.py                          # Flask web dashboard
├── camera.py                       # Main detection system
├── detection.py                    # AI model wrapper
├── license_plate_detection.py     # OCR module
├── config.py                       # Configuration management
├── main.py                         # Entry point
├── main_demo.py                    # Demo mode (no TensorFlow)
├── model.json                      # Model architecture
├── model_weights.keras             # Trained weights
├── requirements.txt                # Dependencies
├── .env                            # Environment variables
├── templates/
│   └── dashboard.html              # Dashboard UI
├── static/
│   ├── dashboard.css               # Dashboard styles
│   └── dashboard.js                # Dashboard logic
├── accident_photos/                # Saved accident images
├── vehicle_no_plates/              # Extracted license plates
└── data/                           # Training data
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 - 3.12 (Python 3.14 has TensorFlow compatibility issues)
- Webcam or video file for testing
- (Optional) Twilio account for emergency calls

### Installation

1. **Clone or navigate to the project directory**
```bash
cd "c:\Users\arunv\Desktop\Smart Resq"
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

> **Note for Python 3.14 users**: TensorFlow is not yet compatible with Python 3.14. Either:
> - Use Python 3.8-3.12, or
> - Run the demo version: `python main_demo.py`

3. **Configure environment variables**
Edit `.env` file with your settings:
```env
# Camera source: 0 for default webcam, or path to video file
VIDEO_SOURCE=0
USE_LIVE_CAMERA=true

# OCR engine: easyocr or tesseract
OCR_ENGINE=easyocr

# Twilio credentials (optional)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
DESTINATION_PHONE_NUMBER=emergency_number
```

### Running the System

#### Option 1: Web Dashboard (Recommended)
```bash
python app.py
```
Then open your browser to: `http://localhost:5000`

#### Option 2: Standalone Mode
```bash
python main.py
```

#### Option 3: Demo Mode (No TensorFlow Required)
```bash
python main_demo.py
```

## 📖 Usage Guide

### Web Dashboard

1. **Start the Dashboard**
   ```bash
   python app.py
   ```

2. **Access the Interface**
   - Open browser to `http://localhost:5000`
   - Click "Start System" to begin monitoring

3. **Monitor in Real-Time**
   - View live camera feed
   - See accident detections as they happen
   - Track license plates automatically
   - Review statistics and history

### Configuration

The system can be configured via:
- **Environment Variables** (`.env` file)
- **Web Dashboard** (Configuration panel)
- **config.py** (Advanced settings)

Key configuration options:

| Setting | Description | Default |
|---------|-------------|---------|
| `VIDEO_SOURCE` | Camera index or video file path | `0` |
| `USE_LIVE_CAMERA` | Enable live camera vs video file | `true` |
| `OCR_ENGINE` | OCR engine (easyocr/tesseract) | `easyocr` |
| `ACCIDENT_THRESHOLD` | Detection confidence threshold (%) | `99.0` |
| `FRAME_SKIP` | Process every Nth frame | `5` |
| `FLASK_PORT` | Web dashboard port | `5000` |

### API Endpoints

The web dashboard exposes a RESTful API:

- `GET /api/status` - Get system status
- `POST /api/start` - Start detection system
- `POST /api/stop` - Stop detection system
- `GET /api/accidents` - List all detected accidents
- `GET /api/accidents/<id>` - Get accident details
- `GET /api/config` - Get configuration
- `POST /api/config` - Update configuration

## 🔧 Advanced Features

### Live Camera Integration

To use a live camera feed:

1. Set in `.env`:
   ```env
   VIDEO_SOURCE=0  # 0 = default camera, 1 = second camera, etc.
   USE_LIVE_CAMERA=true
   ```

2. For IP cameras, use RTSP URL:
   ```env
   VIDEO_SOURCE=rtsp://username:password@ip:port/stream
   ```

### OCR Configuration

#### Using EasyOCR (Recommended)
```env
OCR_ENGINE=easyocr
```
- More accurate
- GPU acceleration support
- No external dependencies

#### Using Tesseract
```env
OCR_ENGINE=tesseract
```
- Faster on CPU
- Requires Tesseract installation:
  - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
  - Linux: `sudo apt-get install tesseract-ocr`
  - Mac: `brew install tesseract`

### Emergency Call Integration

Configure Twilio for automatic emergency calls:

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Update `.env`:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   DESTINATION_PHONE_NUMBER=+0987654321
   ```

## 📊 System Requirements

### Minimum Requirements
- **CPU**: Dual-core 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 2 GB free space
- **Camera**: 720p webcam or video file

### Recommended Requirements
- **CPU**: Quad-core 3.0 GHz
- **RAM**: 8 GB
- **GPU**: NVIDIA GPU with CUDA support (for TensorFlow acceleration)
- **Storage**: 5 GB free space
- **Camera**: 1080p webcam or IP camera

## 🐛 Troubleshooting

### TensorFlow Not Installing (Python 3.14)
**Problem**: `ModuleNotFoundError: No module named 'tensorflow'`

**Solutions**:
1. Use Python 3.8-3.12:
   ```bash
   py -3.11 -m pip install -r requirements.txt
   py -3.11 main.py
   ```

2. Or run demo mode:
   ```bash
   python main_demo.py
   ```

### Camera Not Detected
**Problem**: "Could not open video source"

**Solutions**:
1. Check camera index:
   ```env
   VIDEO_SOURCE=0  # Try 0, 1, 2, etc.
   ```

2. Test camera with:
   ```python
   import cv2
   cap = cv2.VideoCapture(0)
   print(cap.isOpened())
   ```

### OCR Not Working
**Problem**: License plates detected but no text

**Solutions**:
1. Install EasyOCR:
   ```bash
   pip install easyocr
   ```

2. Or install Tesseract and set:
   ```env
   OCR_ENGINE=tesseract
   ```

### Web Dashboard Not Loading
**Problem**: Cannot access `http://localhost:5000`

**Solutions**:
1. Check if port is in use:
   ```bash
   netstat -ano | findstr :5000
   ```

2. Change port in `.env`:
   ```env
   FLASK_PORT=8080
   ```

## 📁 Project Structure Details

### Core Modules

- **app.py**: Flask web application with Socket.IO for real-time updates
- **camera.py**: Main detection loop, handles video capture and processing
- **detection.py**: TensorFlow model wrapper for accident classification
- **license_plate_detection.py**: Computer vision + OCR for plate extraction
- **config.py**: Centralized configuration management

### Data Directories

- **accident_photos/**: Timestamped photos of detected accidents
- **vehicle_no_plates/**: Extracted and enhanced license plate images
- **plate_detection_frames/**: Temporary frames for plate detection
- **data/**: Training data for the AI model

## 🔮 Future Enhancements

- [ ] GPS integration for accident location tracking
- [ ] Multi-camera support with synchronized detection
- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] Mobile app for remote monitoring
- [ ] Advanced analytics and reporting
- [ ] Integration with traffic management systems
- [ ] Support for multiple vehicle types
- [ ] Severity classification (minor/major accidents)
- [ ] Historical data analysis and trends

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the configuration guide

## 🙏 Acknowledgments

- TensorFlow team for the deep learning framework
- OpenCV community for computer vision tools
- EasyOCR for OCR capabilities
- Twilio for communication APIs
- Flask and Socket.IO for web framework

---

**Made with ❤️ for safer roads**
