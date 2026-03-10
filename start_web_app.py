#!/usr/bin/env python3
"""
Smart Resq Web Application Setup and Launcher
"""

import subprocess
import sys
import os

def install_flask():
    """Install Flask and required packages"""
    print("🌐 Installing Flask and required packages...")
    
    packages = ['flask', 'sqlite3']
    
    for package in packages:
        try:
            if package == 'sqlite3':
                # sqlite3 is built into Python
                print(f"✓ {package} is built-in")
                continue
                
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', package
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✓ {package} installed successfully")
            else:
                print(f"✗ Failed to install {package}: {result.stderr}")
                return False
        except Exception as e:
            print(f"✗ Error installing {package}: {e}")
            return False
    
    return True

def check_dependencies():
    """Check if all required files exist"""
    required_files = [
        'web_app.py',
        'archive_system.py',
        'templates/base.html',
        'templates/index.html',
        'templates/archive.html',
        'templates/accidents.html',
        'templates/analysis_detail.html',
        'templates/stats.html'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
        else:
            print(f"✓ {file}")
    
    if missing_files:
        print(f"\n✗ Missing files: {', '.join(missing_files)}")
        return False
    
    return True

def create_directories():
    """Create required directories"""
    directories = ['templates', 'static', 'static/css', 'static/js', 'static/images']
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✓ Created directory: {directory}")
        else:
            print(f"✓ Directory exists: {directory}")

def start_web_app():
    """Start the web application"""
    print("\n🚀 Starting Smart Resq Web Application...")
    print("="*50)
    print("🌍 Web interface will be available at:")
    print("   http://localhost:5000")
    print("   http://127.0.0.1:5000")
    print("="*50)
    print("📝 Features:")
    print("   • Dashboard with statistics")
    print("   • Video analysis archive browser")
    print("   • Accident history viewer")
    print("   • Detailed analysis reports")
    print("   • Statistics and charts")
    print("="*50)
    print("⚠️  Press Ctrl+C to stop the server")
    print()
    
    try:
        # Import and run the web app
        from web_app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except ImportError as e:
        print(f"❌ Error importing web app: {e}")
        print("Make sure web_app.py exists and is properly formatted")
        return False
    except KeyboardInterrupt:
        print("\n👋 Web application stopped by user")
        return True
    except Exception as e:
        print(f"❌ Error starting web app: {e}")
        return False

def main():
    """Main setup function"""
    print("🚗 Smart Resq Web Application Setup")
    print("="*50)
    
    # Step 1: Install dependencies
    if not install_flask():
        print("❌ Failed to install required packages")
        return False
    
    print("\n✓ Dependencies installed successfully")
    
    # Step 2: Check files
    print("\n📁 Checking required files...")
    if not check_dependencies():
        print("❌ Some required files are missing")
        return False
    
    # Step 3: Create directories
    print("\n📂 Creating directories...")
    create_directories()
    
    # Step 4: Start web app
    print("\n🌐 Starting web application...")
    start_web_app()
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ Web application setup completed successfully!")
        else:
            print("\n❌ Web application setup failed!")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Setup cancelled by user")
        sys.exit(0)
