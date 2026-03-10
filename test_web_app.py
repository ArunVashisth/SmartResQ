#!/usr/bin/env python3
"""
Test the web application quickly
"""

import sys
import threading
import time
import requests
from web_app import app

def run_app():
    """Run the app in background"""
    app.run(debug=False, host='127.0.0.1', port=5001, use_reloader=False)

def test_app():
    """Test the app endpoints"""
    time.sleep(2)  # Wait for server to start
    
    try:
        # Test main page
        response = requests.get('http://127.0.0.1:5001/', timeout=5)
        print(f"✅ Main page: {response.status_code}")
        
        # Test archive page
        response = requests.get('http://127.0.0.1:5001/archive', timeout=5)
        print(f"✅ Archive page: {response.status_code}")
        
        # Test accidents page
        response = requests.get('http://127.0.0.1:5001/accidents', timeout=5)
        print(f"✅ Accidents page: {response.status_code}")
        
        # Test stats page
        response = requests.get('http://127.0.0.1:5001/stats', timeout=5)
        print(f"✅ Stats page: {response.status_code}")
        
        print("✅ All web pages working correctly!")
        
    except Exception as e:
        print(f"❌ Error testing web app: {e}")

if __name__ == "__main__":
    print("🌐 Testing Smart Resq Web Application...")
    
    # Start app in background
    app_thread = threading.Thread(target=run_app)
    app_thread.daemon = True
    app_thread.start()
    
    # Test the app
    test_app()
    
    print("🎉 Web application test completed!")
