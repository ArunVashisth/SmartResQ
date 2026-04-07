# 🚀 Quick Start Guide - Smart Resq

## Get Started in 3 Steps!

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Configure Settings
Edit `.env` file:
```env
VIDEO_SOURCE=0              # 0 for webcam, or path to video file
USE_LIVE_CAMERA=true       # true for live camera, false for video file
OCR_ENGINE=easyocr         # easyocr or tesseract
```

### Step 3: Run the System

#### Option A: Web Dashboard (Recommended) 🌐
```bash
python app.py
```
Then open: **http://localhost:5000**

#### Option B: Interactive Launcher 🎮
```bash
python launcher.py
```
Choose from the menu!

#### Option C: Standalone Mode 💻
```bash
python main.py
```

#### Option D: Demo Mode (No TensorFlow) 🎪
```bash
python main_demo.py
```

## 🎯 What to Expect

### Web Dashboard Features
- ✅ Live video feed
- ✅ Real-time accident detection
- ✅ License plate recognition with OCR
- ✅ Statistics tracking
- ✅ Accident history
- ✅ System controls

### When an Accident is Detected
1. 🚨 Alert popup appears
2. 📸 Photo is automatically saved
3. 🔢 License plate is extracted
4. 📞 Emergency call option (if Twilio configured)
5. 📊 Dashboard updates in real-time

## 🔧 Troubleshooting

### Camera Not Working?
```env
# Try different camera indices
VIDEO_SOURCE=0  # or 1, 2, etc.
```

### TensorFlow Error?
```bash
# Use demo mode instead
python main_demo.py
```

### Port 5000 Already in Use?
```env
# Change port in .env
FLASK_PORT=8080
```

## 📚 Need More Help?

- Read **README.md** for detailed documentation
- Check **PROJECT_SUMMARY.md** for technical details
- Review **SETUP_COMPLETE.md** for installation notes

## 🎉 You're Ready!

Start monitoring for accidents with AI-powered detection!

---

**Quick Links:**
- Web Dashboard: http://localhost:5000
- Documentation: README.md
- Configuration: .env
