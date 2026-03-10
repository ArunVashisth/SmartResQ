#!/usr/bin/env python3
"""
Smart Resq Web Application
Flask web interface for viewing archive history and accident details
"""

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
import os
import json
from datetime import datetime
from archive_system import ArchiveSystem
import sqlite3

app = Flask(__name__)
app.secret_key = 'smart_resq_secret_key'

# Initialize archive system
archive = ArchiveSystem()

@app.route('/')
def index():
    """Home page with dashboard"""
    stats = archive.get_archive_stats()
    recent_analyses = archive.get_analysis_history(limit=5)
    recent_accidents = archive.get_accident_history(limit=5)
    
    return render_template('index.html', 
                         stats=stats,
                         recent_analyses=recent_analyses,
                         recent_accidents=recent_accidents)

@app.route('/archive')
def archive_page():
    """Archive history page"""
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    # Get total count for pagination
    conn = sqlite3.connect(archive.archive_db)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM video_analysis')
    total = cursor.fetchone()[0]
    conn.close()
    
    # Get analyses for current page
    analyses = archive.get_analysis_history(limit=per_page)
    
    return render_template('archive.html', 
                         analyses=analyses,
                         page=page,
                         total=total,
                         per_page=per_page)

@app.route('/analysis/<int:analysis_id>')
def analysis_detail(analysis_id):
    """Detailed view of a specific analysis"""
    details = archive.get_analysis_details(analysis_id)
    
    if not details:
        return "Analysis not found", 404
    
    return render_template('analysis_detail.html', analysis=details)

@app.route('/accidents')
def accidents_page():
    """Accident history page"""
    page = request.args.get('page', 1, type=int)
    per_page = 25
    
    accidents = archive.get_accident_history(limit=per_page)
    
    return render_template('accidents.html', 
                         accidents=accidents,
                         page=page,
                         per_page=per_page,
                         os=os)  # Add os module to template context

@app.route('/accident/<int:accident_id>')
def accident_detail(accident_id):
    """Detailed view of a specific accident"""
    conn = sqlite3.connect(archive.archive_db)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT a.id, a.analysis_id, a.frame_number, a.confidence, 
               a.timestamp, a.photo_path, a.license_plate_detected, 
               a.license_plate_path, a.notes, v.video_file, v.start_time
        FROM accidents a
        JOIN video_analysis v ON a.analysis_id = v.id
        WHERE a.id = ?
    ''', (accident_id,))
    
    accident = cursor.fetchone()
    conn.close()
    
    if not accident:
        return "Accident not found", 404
    
    accident_data = {
        'id': accident[0],
        'analysis_id': accident[1],
        'frame_number': accident[2],
        'confidence': accident[3],
        'timestamp': accident[4],
        'photo_path': accident[5],
        'license_plate_detected': accident[6],
        'license_plate_path': accident[7],
        'notes': accident[8],
        'video_file': accident[9],
        'video_start_time': accident[10]
    }
    
    return render_template('accident_detail.html', accident=accident_data)

@app.route('/stats')
def stats_page():
    """Statistics page"""
    stats = archive.get_archive_stats()
    
    # Get additional detailed stats
    conn = sqlite3.connect(archive.archive_db)
    cursor = conn.cursor()
    
    # Accident confidence distribution
    cursor.execute('''
        SELECT 
            CASE 
                WHEN confidence >= 90 THEN 'High (90%+)'
                WHEN confidence >= 70 THEN 'Medium (70-89%)'
                ELSE 'Low (<70%)'
            END as confidence_range,
            COUNT(*) as count
        FROM accidents 
        GROUP BY confidence_range
    ''')
    confidence_dist = cursor.fetchall()
    
    # Analyses by date (last 30 days)
    cursor.execute('''
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM video_analysis 
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    ''')
    daily_analyses = cursor.fetchall()
    
    # Accidents by hour of day
    cursor.execute('''
        SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
        FROM accidents 
        GROUP BY hour
        ORDER BY hour
    ''')
    hourly_accidents = cursor.fetchall()
    
    conn.close()
    
    return render_template('stats.html', 
                         stats=stats,
                         confidence_dist=confidence_dist,
                         daily_analyses=daily_analyses,
                         hourly_accidents=hourly_accidents)

@app.route('/view_file/<path:filename>')
def view_file(filename):
    """View archived files (images)"""
    if os.path.exists(filename):
        return send_file(filename)
    else:
        return "File not found", 404

@app.route('/api/analysis/<int:analysis_id>')
def api_analysis_detail(analysis_id):
    """API endpoint for analysis details"""
    details = archive.get_analysis_details(analysis_id)
    
    if not details:
        return jsonify({'error': 'Analysis not found'}), 404
    
    return jsonify(details)

@app.route('/api/accidents')
def api_accidents():
    """API endpoint for accidents"""
    limit = request.args.get('limit', 50, type=int)
    analysis_id = request.args.get('analysis_id', type=int)
    
    accidents = archive.get_accident_history(analysis_id=analysis_id, limit=limit)
    return jsonify(accidents)

@app.route('/api/stats')
def api_stats():
    """API endpoint for statistics"""
    stats = archive.get_archive_stats()
    return jsonify(stats)

@app.route('/cleanup')
def cleanup_archives():
    """Clean up old archives"""
    if request.args.get('confirm') == 'yes':
        deleted_count = archive.cleanup_old_archives()
        return f"Cleaned up {deleted_count} old archives"
    else:
        return render_template('cleanup_confirm.html')

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
        
    # Create static directory if it doesn't exist
    if not os.path.exists('static'):
        os.makedirs('static')
        os.makedirs('static/css')
        os.makedirs('static/js')
        os.makedirs('static/images')
    
    print("🌐 Starting Smart Resq Web Application")
    print("📁 Created directories: templates/, static/")
    print("🌍 Open http://localhost:5000 in your browser")
    print("="*50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
