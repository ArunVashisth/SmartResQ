#!/usr/bin/env python3
"""
Complete Archive System Test
Demonstrates the full archive functionality
"""

import os
import time
import cv2
import numpy as np
from archive_system import ArchiveSystem

def create_test_video():
    """Create a simple test video for demonstration"""
    print("🎥 Creating test video...")
    
    # Create a simple test video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter('test_video.mp4', fourcc, 20.0, (640, 480))
    
    for i in range(100):
        # Create a simple frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Add some content
        cv2.rectangle(frame, (100, 100), (540, 380), (0, 255, 0), 2)
        cv2.putText(frame, f'Frame {i+1}', (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Simulate an accident in some frames
        if i in [30, 60, 80]:
            cv2.putText(frame, 'ACCIDENT!', (150, 300), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 3)
        
        out.write(frame)
    
    out.release()
    print("✅ Test video created: test_video.mp4")
    return 'test_video.mp4'

def test_archive_system():
    """Test the complete archive system"""
    print("🚗 Smart Resq Archive System - Complete Test")
    print("="*60)
    
    # Initialize archive system
    archive = ArchiveSystem()
    
    # Create test video
    video_file = create_test_video()
    
    # Start analysis
    print(f"\n📹 Starting analysis of {video_file}...")
    analysis_id, output_dir = archive.start_video_analysis(video_file, 100, 20.0, 5.0)
    print(f"✅ Analysis started: ID #{analysis_id}")
    print(f"📁 Output directory: {output_dir}")
    
    # Simulate processing with accidents
    print(f"\n🔄 Processing video frames...")
    accident_frames = [30, 60, 80]
    
    for frame_num in range(1, 101):
        # Create a mock frame
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Save frame
        frame_path = f"{output_dir}/frames/frame_{frame_num:06d}.jpg"
        cv2.imwrite(frame_path, frame)
        
        # Check for accidents
        if frame_num in accident_frames:
            confidence = 85.0 + (frame_num % 10)
            accident_id, photo_path = archive.record_accident(
                analysis_id, frame_num, confidence, frame
            )
            print(f"🚨 Accident detected at frame {frame_num} (confidence: {confidence:.1f}%)")
            
            # Simulate license plate detection
            if frame_num == 60:
                plate_frame = frame[200:250, 300:450]
                plate_path = f"{output_dir}/license_plates/plate_frame_{frame_num}.jpg"
                cv2.imwrite(plate_path, plate_frame)
                
                # Update accident record
                import sqlite3
                conn = sqlite3.connect(archive.archive_db)
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE accidents 
                    SET license_plate_detected = 1, license_plate_path = ?
                    WHERE id = ?
                ''', (plate_path, accident_id))
                conn.commit()
                conn.close()
                
                print(f"📸 License plate detected: {plate_path}")
        
        # Progress update
        if frame_num % 20 == 0:
            print(f"📊 Processed {frame_num}/100 frames...")
    
    # Complete analysis
    archive.complete_analysis(analysis_id, 100, len(accident_frames))
    print(f"\n✅ Analysis completed!")
    
    # Get analysis details
    details = archive.get_analysis_details(analysis_id)
    print(f"\n📋 Analysis Details:")
    print(f"   Video: {details['video_file']}")
    print(f"   Total frames: {details['total_frames']}")
    print(f"   Accidents: {details['accidents_detected']}")
    print(f"   Status: {details['status']}")
    print(f"   Start time: {details['start_time']}")
    print(f"   End time: {details['end_time']}")
    
    # Show accident details
    print(f"\n🚨 Accident Details:")
    for accident in details['accidents']:
        print(f"   Frame {accident['frame_number']}: {accident['confidence']:.1f}% confidence")
        if accident['license_plate_detected']:
            print(f"      📸 License plate: {accident['license_plate_path']}")
    
    # Test archive statistics
    stats = archive.get_archive_stats()
    print(f"\n📊 Archive Statistics:")
    print(f"   Total analyses: {stats['total_analyses']}")
    print(f"   Total accidents: {stats['total_accidents']}")
    print(f"   Recent analyses: {stats['recent_analyses']}")
    print(f"   Recent accidents: {stats['recent_accidents']}")
    
    # Test history retrieval
    print(f"\n📚 Analysis History:")
    history = archive.get_analysis_history(limit=5)
    for analysis in history:
        print(f"   #{analysis['id']}: {analysis['video_file']} - {analysis['accidents_detected']} accidents")
    
    print(f"\n🚨 Accident History:")
    accidents = archive.get_accident_history(limit=10)
    for accident in accidents:
        print(f"   #{accident['id']}: Frame {accident['frame_number']} - {accident['confidence']:.1f}% confidence")
    
    # Clean up test video
    if os.path.exists(video_file):
        os.remove(video_file)
        print(f"\n🧹 Cleaned up test video: {video_file}")
    
    print(f"\n🎉 Archive system test completed successfully!")
    print(f"📁 Check the '{output_dir}' directory for archived files")
    print(f"🌐 Start the web app to view results: python start_web_app.py")
    
    return analysis_id

def main():
    """Main test function"""
    try:
        analysis_id = test_archive_system()
        print(f"\n✅ Test completed successfully!")
        print(f"🔗 Analysis ID: #{analysis_id}")
        print(f"🌐 Web app: python start_web_app.py")
        print(f"🌍 URL: http://localhost:5000")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
