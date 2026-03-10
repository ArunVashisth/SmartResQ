#!/usr/bin/env python3
"""
Smart Resq with Archive System
Enhanced version with complete history tracking and archiving
"""

import cv2
import numpy as np
import os
import time
import threading
from datetime import datetime
from archive_system import ArchiveSystem

class SmartResqWithArchive:
    def __init__(self):
        self.archive = ArchiveSystem()
        self.current_analysis_id = None
        self.current_output_dir = None
        
    def mock_accident_detection(self, frame):
        """Mock accident detection with realistic patterns"""
        import random
        
        # Simulate more realistic accident detection
        # Higher probability in certain frame ranges (simulating accident scenes)
        frame_prob = random.random()
        
        if frame_prob < 0.03:  # 3% base chance
            confidence = random.uniform(85.0, 99.0)
            return "Accident", confidence
        return "No Accident", random.uniform(5.0, 20.0)
        
    def save_frame_with_info(self, frame, pred, prob, frame_count, output_dir):
        """Save frame with detection information overlay"""
        # Add text overlay to frame
        frame_copy = frame.copy()
        
        # Background rectangle for text
        cv2.rectangle(frame_copy, (0, 0), (400, 100), (0, 0, 0), -1)
        
        # Detection info
        color = (0, 255, 0) if pred == "No Accident" else (0, 0, 255)
        cv2.putText(frame_copy, f"Detection: {pred}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame_copy, f"Confidence: {prob:.1f}%", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame_copy, f"Frame: {frame_count}", (10, 90), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Save frame
        filename = f"{output_dir}/frames/frame_{frame_count:06d}_{pred.replace(' ', '_')}.jpg"
        cv2.imwrite(filename, frame_copy)
        
        return filename
        
    def simulate_license_plate_detection(self, frame, frame_number, output_dir):
        """Simulate license plate detection"""
        import random
        
        # Random chance of detecting a license plate
        if random.random() < 0.1:  # 10% chance
            # Create a mock license plate image (just crop and enhance a region)
            h, w = frame.shape[:2]
            plate_region = frame[h//2:h//2+50, w//4:w//4+150]
            
            # Enhance the region
            plate_enhanced = cv2.resize(plate_region, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            
            # Save license plate
            plate_path = f"{output_dir}/license_plates/plate_frame_{frame_number}.jpg"
            cv2.imwrite(plate_path, plate_enhanced)
            
            return True, plate_path
            
        return False, None
        
    def process_video_with_archive(self, video_file):
        """Process video with complete archive tracking"""
        print(f"🚗 Smart Resq - Processing: {video_file}")
        print("="*60)
        
        # Check if video exists
        if not os.path.exists(video_file):
            print(f"❌ Error: Video file '{video_file}' not found!")
            return None
            
        # Open video
        video = cv2.VideoCapture(video_file)
        if not video.isOpened():
            print(f"❌ Error: Could not open video file '{video_file}'")
            return None
            
        # Get video info
        total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = video.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"📹 Video Info:")
        print(f"   File: {video_file}")
        print(f"   Total frames: {total_frames}")
        print(f"   FPS: {fps:.2f}")
        print(f"   Duration: {duration:.1f} seconds")
        print()
        
        # Start archive session
        self.current_analysis_id, self.current_output_dir = self.archive.start_video_analysis(
            video_file, total_frames, fps, duration
        )
        
        print(f"📁 Archive session started: Analysis #{self.current_analysis_id}")
        print(f"📂 Output directory: {self.current_output_dir}")
        print()
        
        # Process video
        frame_count = 0
        accidents_detected = 0
        frames_processed = 0
        frame_skip = 10  # Process every 10th frame for speed
        
        start_time = time.time()
        
        while True:
            ret, frame = video.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Skip frames for faster processing
            if frame_count % frame_skip != 0:
                continue
                
            frames_processed += 1
            
            # Accident detection
            pred, prob = self.mock_accident_detection(frame)
            
            # Save frame with detection info
            frame_path = self.save_frame_with_info(
                frame, pred, prob, frame_count, self.current_output_dir
            )
            
            # Handle accident detection
            if pred == "Accident":
                accidents_detected += 1
                
                # Record accident in archive
                accident_id, photo_path = self.archive.record_accident(
                    self.current_analysis_id, frame_count, prob, frame
                )
                
                # Try license plate detection
                plate_detected, plate_path = self.simulate_license_plate_detection(
                    frame, frame_count, self.current_output_dir
                )
                
                if plate_detected:
                    # Update accident record with license plate info
                    self.archive.update_accident_license_plate(accident_id, plate_path)
                
                print(f"🚨 ACCIDENT DETECTED at frame {frame_number}!")
                print(f"   Confidence: {prob:.1f}%")
                print(f"   Photo saved: {photo_path}")
                if plate_detected:
                    print(f"   License plate detected: {plate_path}")
                print()
            
            # Progress update
            if frames_processed % 20 == 0:
                progress = (frame_count / total_frames) * 100
                elapsed = time.time() - start_time
                print(f"📊 Progress: {progress:.1f}% - Frame {frame_count}/{total_frames} "
                      f"(Accidents: {accidents_detected})")
        
        # Complete analysis
        self.archive.complete_analysis(self.current_analysis_id, frames_processed, accidents_detected)
        
        # Cleanup
        video.release()
        
        # Final summary
        end_time = time.time()
        processing_time = end_time - start_time
        
        print("\n" + "="*60)
        print("🎉 VIDEO PROCESSING COMPLETE!")
        print("="*60)
        print(f"📹 Video: {video_file}")
        print(f"📊 Analysis ID: #{self.current_analysis_id}")
        print(f"⏱️  Processing time: {processing_time:.1f} seconds")
        print(f"📁 Frames processed: {frames_processed}/{total_frames}")
        print(f"🚨 Accidents detected: {accidents_detected}")
        print(f"📂 Archive directory: {self.current_output_dir}")
        print()
        
        # Get analysis details
        details = self.archive.get_analysis_details(self.current_analysis_id)
        if details:
            print("📋 Analysis Details:")
            print(f"   Start time: {details['start_time']}")
            print(f"   End time: {details['end_time']}")
            print(f"   Status: {details['status']}")
            print(f"   Accident photos: {len(details['accidents'])}")
        
        return self.current_analysis_id
        
    def update_accident_license_plate(self, accident_id, plate_path):
        """Update accident record with license plate information"""
        import sqlite3
        conn = sqlite3.connect(self.archive.archive_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE accidents 
            SET license_plate_detected = 1, license_plate_path = ?
            WHERE id = ?
        ''', (plate_path, accident_id))
        
        conn.commit()
        conn.close()
        
    def view_archive_history(self):
        """View archive history"""
        print("\n📚 ARCHIVE HISTORY")
        print("="*60)
        
        history = self.archive.get_analysis_history(limit=20)
        
        if not history:
            print("No analyses found in archive.")
            return
            
        for i, analysis in enumerate(history, 1):
            print(f"{i}. Analysis #{analysis['id']}")
            print(f"   Video: {analysis['video_file']}")
            print(f"   Date: {analysis['created_at']}")
            print(f"   Frames: {analysis['total_frames']}")
            print(f"   Accidents: {analysis['accidents_detected']}")
            print(f"   Status: {analysis['status']}")
            print(f"   Directory: {analysis['output_dir']}")
            print()
            
    def view_accident_history(self):
        """View accident history"""
        print("\n🚨 ACCIDENT HISTORY")
        print("="*60)
        
        accidents = self.archive.get_accident_history(limit=30)
        
        if not accidents:
            print("No accidents found in archive.")
            return
            
        for i, accident in enumerate(accidents, 1):
            print(f"{i}. Accident #{accident['id']} (Analysis #{accident['analysis_id']})")
            print(f"   Video: {accident['video_file']}")
            print(f"   Frame: {accident['frame_number']}")
            print(f"   Confidence: {accident['confidence']:.1f}%")
            print(f"   Time: {accident['timestamp']}")
            print(f"   License Plate: {'Yes' if accident['license_plate_detected'] else 'No'}")
            print(f"   Photo: {accident['photo_path']}")
            print()
            
    def get_archive_statistics(self):
        """Get and display archive statistics"""
        print("\n📊 ARCHIVE STATISTICS")
        print("="*60)
        
        stats = self.archive.get_archive_stats()
        
        print(f"📈 Total Analyses: {stats['total_analyses']}")
        print(f"🚨 Total Accidents: {stats['total_accidents']}")
        print(f"📅 Recent Analyses (7 days): {stats['recent_analyses']}")
        print(f"🚨 Recent Accidents (7 days): {stats['recent_accidents']}")
        print()

def main():
    """Main function"""
    app = SmartResqWithArchive()
    
    print("🚗 Smart Resq with Archive System")
    print("="*60)
    print("1. Process video with archiving")
    print("2. View archive history")
    print("3. View accident history")
    print("4. View archive statistics")
    print("5. Exit")
    print()
    
    while True:
        try:
            choice = input("Enter your choice (1-5): ").strip()
            
            if choice == '1':
                video_file = input("Enter video file path (or press Enter for 'new.mp4'): ").strip()
                if not video_file:
                    video_file = "new.mp4"
                
                analysis_id = app.process_video_with_archive(video_file)
                if analysis_id:
                    print(f"✅ Analysis completed! ID: #{analysis_id}")
                    
            elif choice == '2':
                app.view_archive_history()
                
            elif choice == '3':
                app.view_accident_history()
                
            elif choice == '4':
                app.get_archive_statistics()
                
            elif choice == '5':
                print("👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
