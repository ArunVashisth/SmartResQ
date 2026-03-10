#!/usr/bin/env python3
"""
Smart Resq Simple Version
Works without GUI display - saves output to files
"""

import cv2
import numpy as np
import os
import time
import threading

def mock_accident_detection(frame):
    """Mock accident detection"""
    import random
    if random.random() < 0.02:  # 2% chance per frame
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
        print(f"🚨 ACCIDENT PHOTO SAVED: {filename}")
        return filename
    except Exception as e:
        print(f"Error saving accident photo: {e}")
        return None

def save_output_frame(frame, pred, prob, frame_count, output_dir="output_frames"):
    """Save frame with detection info"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Add text to frame
    frame_copy = frame.copy()
    cv2.rectangle(frame_copy, (0, 0), (350, 80), (0, 0, 0), -1)
    
    color = (0, 255, 0) if pred == "No Accident" else (0, 0, 255)
    cv2.putText(frame_copy, f"Detection: {pred}", (10, 30), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    cv2.putText(frame_copy, f"Confidence: {prob:.1f}%", (10, 60), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(frame_copy, f"Frame: {frame_count}", (10, frame_copy.shape[0] - 20), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    filename = f"{output_dir}/frame_{frame_count:06d}_{pred.replace(' ', '_')}.jpg"
    cv2.imwrite(filename, frame_copy)
    
    return filename

def start_simple():
    """Start simple version without GUI"""
    print("🚗 Smart Resq - Simple Version")
    print("="*50)
    print("Processing video and saving results to files...")
    print("Check 'output_frames' directory for results")
    print("="*50)
    
    # Check video file
    video_file = "new.mp4"
    if not os.path.exists(video_file):
        print(f"❌ Error: Video file '{video_file}' not found!")
        print("Please place a video file named 'new.mp4' in the project directory")
        return
    
    # Open video
    video = cv2.VideoCapture(video_file)
    if not video.isOpened():
        print(f"❌ Error: Could not open video file '{video_file}'")
        return
    
    # Get video info
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = video.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"📹 Video Info:")
    print(f"   Total frames: {total_frames}")
    print(f"   FPS: {fps:.2f}")
    print(f"   Duration: {duration:.1f} seconds")
    print()
    
    frame_count = 0
    accidents_detected = 0
    frames_processed = 0
    
    # Process every 10th frame for speed
    frame_skip = 10
    
    while True:
        ret, frame = video.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Skip frames for faster processing
        if frame_count % frame_skip != 0:
            continue
            
        frames_processed += 1
        
        # Mock accident detection
        pred, prob = mock_accident_detection(frame)
        
        # Save output frame
        output_file = save_output_frame(frame, pred, prob, frame_count)
        
        # Handle accident detection
        if pred == "Accident":
            accidents_detected += 1
            save_accident_photo(frame)
            print(f"🚨 ACCIDENT DETECTED at frame {frame_count}! Confidence: {prob:.1f}%")
        
        # Progress update
        if frames_processed % 50 == 0:
            progress = (frame_count / total_frames) * 100
            print(f"📊 Progress: {progress:.1f}% - Frame {frame_count}/{total_frames}")
    
    # Cleanup
    video.release()
    
    # Summary
    print("\n" + "="*50)
    print("🎉 PROCESSING COMPLETE!")
    print("="*50)
    print(f"📹 Total frames processed: {frames_processed}")
    print(f"🚨 Accidents detected: {accidents_detected}")
    print(f"📁 Output frames saved in: 'output_frames/'")
    print(f"📸 Accident photos saved in: 'accident_photos/'")
    print(f"⏱️  Processing time: {time.strftime('%H:%M:%S')}")
    print()
    print("📂 Check these directories:")
    print("   - output_frames/ - All processed frames with detection info")
    print("   - accident_photos/ - Accident snapshots")
    print("   - vehicle_no_plates/ - License plate detection frames")
    print()
    print("✅ Smart Resq demo completed successfully!")

if __name__ == '__main__':
    start_simple()
