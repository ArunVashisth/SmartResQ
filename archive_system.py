#!/usr/bin/env python3
"""
Smart Resq Archive System (v2/Refactored)
Handles storage and retrieval of video analysis history and accident records.
Redesigned for better reliability and organized file storage.
"""

import json
import sqlite3
import os
import time
from datetime import datetime
import cv2
import shutil
import numpy as np

class ArchiveSystem:
    def __init__(self, archive_db="archive.db", base_dir="archives"):
        self.archive_db = archive_db
        self.base_dir = base_dir
        self.ensure_dirs()
        self.init_database()
        
    def ensure_dirs(self):
        """Ensure base archive directories exist"""
        os.makedirs(self.base_dir, exist_ok=True)
        # We'll create subdirs per analysis session
        
    def init_database(self):
        """Initialize the archive database with improved schema"""
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        # Video Analysis Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS video_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_file TEXT NOT NULL,
                total_frames INTEGER DEFAULT 0,
                fps REAL DEFAULT 0,
                duration REAL DEFAULT 0,
                processed_frames INTEGER DEFAULT 0,
                accidents_detected INTEGER DEFAULT 0,
                start_time TEXT,
                end_time TEXT,
                status TEXT DEFAULT 'processing',
                output_dir TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Accidents Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER,
                frame_number INTEGER,
                confidence REAL,
                timestamp TEXT,
                photo_path TEXT,
                license_plate_detected BOOLEAN DEFAULT 0,
                license_plate_text TEXT,
                license_plate_path TEXT,
                location TEXT DEFAULT 'Point A-7',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (analysis_id) REFERENCES video_analysis (id)
            )
        ''')
        
        # Settings Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS archive_settings (
                id INTEGER PRIMARY KEY,
                max_archive_days INTEGER DEFAULT 30,
                max_storage_mb INTEGER DEFAULT 2000,
                auto_cleanup BOOLEAN DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Default Settings
        cursor.execute('SELECT COUNT(*) FROM archive_settings')
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO archive_settings (id, max_archive_days, max_storage_mb, auto_cleanup)
                VALUES (1, 30, 2000, 1)
            ''')
        
        conn.commit()
        conn.close()
        
    def start_video_analysis(self, video_file, total_frames=0, fps=0, duration=0):
        """Start a new video analysis session and create storage structure"""
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        timestamp_slug = datetime.now().strftime("%Y%m%d_%H%M%S")
        analysis_dir_name = f"analysis_{timestamp_slug}"
        # Prepare output directory path with forward slashes for web compatibility
        output_dir = f"{self.base_dir}/{analysis_dir_name}"
        
        # Create directories
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f"{output_dir}/accidents", exist_ok=True)
        os.makedirs(f"{output_dir}/plates", exist_ok=True)
        
        start_time = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO video_analysis 
            (video_file, total_frames, fps, duration, start_time, output_dir, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (video_file, total_frames, fps, duration, start_time, output_dir, 'processing'))
        
        analysis_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"📁 Archive started: ID {analysis_id} at {output_dir}")
        return analysis_id, output_dir
        
    def record_accident(self, analysis_id, frame_number, confidence, frame, location="Point A-7"):
        """Record an accident detection with image preservation"""
        if not analysis_id:
            return None, None
            
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        # Get output dir for this analysis
        cursor.execute('SELECT output_dir FROM video_analysis WHERE id = ?', (analysis_id,))
        res = cursor.fetchone()
        if not res:
            conn.close()
            return None, None
        
        output_dir = res[0]
        timestamp = datetime.now().isoformat()
        
        # Save accident photo
        photo_filename = f"accident_f{frame_number}_{int(time.time())}.jpg"
        photo_path = f"{output_dir}/accidents/{photo_filename}"
        
        # Convert confidence to float if it's numpy
        if hasattr(confidence, 'item'):
            confidence = confidence.item()
            
        cv2.imwrite(photo_path, frame)
        
        cursor.execute('''
            INSERT INTO accidents 
            (analysis_id, frame_number, confidence, timestamp, photo_path, location)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (analysis_id, frame_number, float(confidence), timestamp, photo_path, location))
        
        accident_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return accident_id, photo_path
        
    def update_accident_license_plate(self, accident_id, plate_text, plate_img_path):
        """Update accident record with license plate details"""
        if not accident_id:
            return
            
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE accidents 
            SET license_plate_detected = 1, 
                license_plate_text = ?, 
                license_plate_path = ?
            WHERE id = ?
        ''', (plate_text, plate_img_path, accident_id))
        
        conn.commit()
        conn.close()
        
    def complete_analysis(self, analysis_id, processed_frames, accidents_detected):
        """Finalize the analysis session with statistics"""
        if not analysis_id:
            return
            
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        end_time = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE video_analysis 
            SET processed_frames = ?, 
                accidents_detected = ?, 
                end_time = ?, 
                status = 'completed'
            WHERE id = ?
        ''', (processed_frames, accidents_detected, end_time, analysis_id))
        
        conn.commit()
        conn.close()
        print(f"✅ Archive finalized: ID {analysis_id}")
        
    def get_analysis_history(self, limit=20):
        """Retrieve recent analysis sessions"""
        conn = sqlite3.connect(self.archive_db)
        # Use row_factory for dict-like access
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM video_analysis 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        history = [dict(row) for row in rows]
        conn.close()
        return history
        
    def get_analysis_details(self, analysis_id):
        """Get full details of a session including all detected accidents"""
        conn = sqlite3.connect(self.archive_db)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM video_analysis WHERE id = ?', (analysis_id,))
        analysis = cursor.fetchone()
        
        if not analysis:
            conn.close()
            return None
            
        cursor.execute('SELECT * FROM accidents WHERE analysis_id = ? ORDER BY frame_number', (analysis_id,))
        accidents = cursor.fetchall()
        
        result = dict(analysis)
        result['accidents'] = [dict(acc) for acc in accidents]
        
        conn.close()
        return result

    def get_total_stats(self):
        """Overall system stats for dashboard"""
        conn = sqlite3.connect(self.archive_db)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM video_analysis')
        total_sessions = cursor.fetchone()[0]
        
        cursor.execute('SELECT SUM(accidents_detected) FROM video_analysis WHERE status="completed"')
        total_accidents = cursor.fetchone()[0] or 0
        
        cursor.execute('SELECT COUNT(*) FROM accidents WHERE license_plate_detected = 1')
        total_plates = cursor.fetchone()[0]
        
        conn.close()
        return {
            'total_sessions': total_sessions,
            'total_accidents': total_accidents,
            'total_plates': total_plates
        }

if __name__ == "__main__":
    # Self-test
    arch = ArchiveSystem()
    print("Archive System Initialized")
    print(f"Total Stats: {arch.get_total_stats()}")
