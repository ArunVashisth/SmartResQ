#!/usr/bin/env python3
"""
Smart Resq Demo Version
This version works without TensorFlow for testing the computer vision components
"""

import cv2
import numpy as np
import os
import winsound
import threading
import time
import tkinter as tk
from PIL import Image, ImageTk

# Mock accident detection for demo
def mock_accident_detection(frame):
    """Mock function to simulate accident detection"""
    # Simple motion detection as placeholder
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Random "accident" detection for demo (10% chance)
    import random
    if random.random() < 0.01:  # 1% chance per frame
        return "Accident", 95.0
    return "No Accident", 5.0

def save_accident_photo(frame):
    """Save accident photo"""
    try:
        current_date_time = time.strftime("%Y-%m-%d-%H%M%S")
        directory = "accident_photos"
        if not os.path.exists(directory):
            os.makedirs(directory)
        filename = f"{directory}/{current_date_time}.jpg"
        cv2.imwrite(filename, frame)
        print(f"Accident photo saved as {filename}")
        return filename
    except Exception as e:
        print(f"Error saving accident photo: {e}")
        return None

def show_alert_message():
    """Show alert message (demo version)"""
    def on_close():
        alert_window.destroy()

    frequency = 3000
    duration = 1000
    winsound.Beep(frequency, duration)

    alert_window = tk.Tk()
    alert_window.title("Smart Resq Alert")
    alert_window.geometry("400x200")
    alert_label = tk.Label(alert_window, text="⚠️ Alert: Accident Detected!\n\nDemo Mode - No emergency call", 
                         fg="red", font=("Helvetica", 14, "bold"))
    alert_label.pack(pady=20)

    close_button = tk.Button(alert_window, text="Close", command=on_close, 
                         bg="#ff4444", fg="white", font=("Helvetica", 12))
    close_button.pack(pady=10)

    alert_window.mainloop()

def start_alert_thread():
    """Start alert in separate thread"""
    alert_thread = threading.Thread(target=show_alert_message)
    alert_thread.daemon = True
    alert_thread.start()

def detect_license_plate_demo(frame, frame_count):
    """Demo license plate detection"""
    # Simple contour detection as demo
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edged = cv2.Canny(gray, 30, 200)
    
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours and frame_count % 100 == 0:  # Save every 100th frame for demo
        directory = "vehicle_no_plates"
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        filename = f"{directory}/plate_demo_{frame_count}.jpg"
        cv2.imwrite(filename, frame)
        print(f"Demo: Saved frame for plate detection: {filename}")

def start_demo():
    """Start the demo application"""
    print("Smart Resq Demo Mode")
    print("="*40)
    print("This is a demo version without TensorFlow")
    print("It simulates accident detection for testing")
    print("="*40)
    
    # Check if video file exists
    video_file = "new.mp4"
    if not os.path.exists(video_file):
        print(f"Error: Video file '{video_file}' not found!")
        print("Please place a video file named 'new.mp4' in the project directory")
        return
    
    video = cv2.VideoCapture(video_file)
    if not video.isOpened():
        print(f"Error: Could not open video file '{video_file}'")
        return
    
    frame_count = 0
    accident_detected = False
    
    while True:
        ret, frame = video.read()
        if not ret:
            print("End of video or error reading frame")
            break
        
        frame_count += 1
        
        # Mock accident detection
        pred, prob = mock_accident_detection(frame)
        
        if pred == "Accident" and not accident_detected:
            print(f"🚨 ACCIDENT DETECTED! Confidence: {prob:.1f}%")
            accident_photo_path = save_accident_photo(frame)
            accident_detected = True
            start_alert_thread()
        
        # Demo license plate detection
        detect_license_plate_demo(frame, frame_count)
        
        # Display prediction on frame
        cv2.rectangle(frame, (0, 0), (350, 40), (0, 0, 0), -1)
        cv2.putText(frame, f"{pred}: {prob:.1f}%", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if pred == "No Accident" else (0, 0, 255), 2)
        
        # Add frame counter
        cv2.putText(frame, f"Frame: {frame_count}", (10, frame.shape[0] - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Show frame
        cv2.imshow('Smart Resq Demo - Press Q to quit', frame)
        
        if cv2.waitKey(33) & 0xFF == ord('q'):
            break
    
    video.release()
    cv2.destroyAllWindows()
    print("\nDemo completed!")

if __name__ == '__main__':
    start_demo()
