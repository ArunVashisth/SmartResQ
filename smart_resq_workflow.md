1. Authentication & Security
Signup: Users register with an email. A 6-digit OTP is sent via Gmail SMTP for verification.
Login: Secure access via encrypted passwords and unique session tokens.
Admin Approval: Admins can approve or reject new user requests from the Admin Panel.
2. System Configuration
Camera Setup: Add cameras via the "Cameras" tab using local indices (0, 1) or IP camera RTSP URLs.
Detection Settings: Configure sensitivity thresholds and OCR engines (EasyOCR/Tesseract) in the Settings panel.
Emergency Contacts: Set up Twilio and Fast2SMS credentials to ensure ambulance services can be contacted.
3. Launching the Engine
Start System: Clicking "Start System" on the dashboard triggers the backend camera.py threads.
Neural Loading: The system loads the TensorFlow model weights (or defaults to the OpenCV motion fallback).
Initialization: OCR engines are initialized to ready state.
4. Real-Time Monitoring
Live Feed: The dashboard displays real-time video streams from all active cameras.
Frame Analysis: Every frame (or every Nth frame based on configuration) is analyzed for accident signatures.
Telemetry: Real-time stats (Uptime, Total Accidents, Frames Processed) are updated via WebSockets.
5. Incident Detection & Response
Trigger: When an accident is detected with high confidence:
📸 Snapshot: A high-resolution photo is captured immediately.
🔢 OCR: License plates are extracted from the image.
📞 Emergency Call: Twilio initiates an automated voice call to emergency services.
📱 SMS Alert: Fast2SMS/Twilio sends localized alerts with location and vehicle details.
6. Archiving & Analytics
Cloud Storage: Accident data and photos are stored in MongoDB GridFS.
History: Users can review past accidents, complete with images and extracted plate numbers, in the Archives section.