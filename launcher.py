#!/usr/bin/env python3
"""
Smart Resq Launcher
Interactive launcher for the Smart Resq system
"""
import sys
import os
import subprocess

def print_banner():
    print("\n" + "="*60)
    print("🚨 SMART RESQ - Accident Detection System")
    print("="*60)
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    print("Checking dependencies...")
    
    missing = []
    
    # Check core dependencies
    try:
        import cv2
        print("✓ OpenCV installed")
    except ImportError:
        missing.append("opencv-python")
        print("✗ OpenCV not found")
    
    try:
        import flask
        print("✓ Flask installed")
    except ImportError:
        missing.append("flask")
        print("✗ Flask not found")
    
    try:
        import tensorflow
        print("✓ TensorFlow installed")
    except ImportError:
        print("⚠ TensorFlow not found (Demo mode available)")
    
    try:
        import easyocr
        print("✓ EasyOCR installed")
    except ImportError:
        print("⚠ EasyOCR not found (OCR features limited)")
    
    if missing:
        print(f"\n⚠ Missing dependencies: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("\n✓ All core dependencies installed!\n")
    return True

def show_menu():
    """Display main menu"""
    print("Choose how to run Smart Resq:\n")
    print("1. 🌐 Web Dashboard (Recommended)")
    print("   - Real-time monitoring interface")
    print("   - Access at http://localhost:5000")
    print()
    print("2. 💻 Standalone Mode")
    print("   - Direct camera/video processing")
    print("   - OpenCV window display")
    print()
    print("3. 🎮 Demo Mode")
    print("   - No TensorFlow required")
    print("   - Simulated accident detection")
    print()
    print("4. 📦 Install Dependencies")
    print()
    print("5. ❌ Exit")
    print()

def run_web_dashboard():
    """Run the web dashboard"""
    print("\n🌐 Starting Web Dashboard...")
    print("="*60)
    print("Access the dashboard at: http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n\n✓ Dashboard stopped")

def run_standalone():
    """Run standalone mode"""
    print("\n💻 Starting Standalone Mode...")
    print("="*60)
    print("Press 'Q' in the video window to quit")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n\n✓ System stopped")

def run_demo():
    """Run demo mode"""
    print("\n🎮 Starting Demo Mode...")
    print("="*60)
    print("This is a simulation without TensorFlow")
    print("Press 'Q' in the video window to quit")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, "main_demo.py"])
    except KeyboardInterrupt:
        print("\n\n✓ Demo stopped")

def install_dependencies():
    """Install dependencies"""
    print("\n📦 Installing Dependencies...")
    print("="*60 + "\n")
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("\n✓ Installation complete!")
    except Exception as e:
        print(f"\n✗ Installation failed: {e}")

def main():
    """Main launcher function"""
    print_banner()
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    while True:
        show_menu()
        
        try:
            choice = input("Enter your choice (1-5): ").strip()
            
            if choice == "1":
                if not deps_ok:
                    print("\n⚠ Please install dependencies first (option 4)")
                    input("\nPress Enter to continue...")
                    continue
                run_web_dashboard()
            
            elif choice == "2":
                if not deps_ok:
                    print("\n⚠ Please install dependencies first (option 4)")
                    input("\nPress Enter to continue...")
                    continue
                run_standalone()
            
            elif choice == "3":
                run_demo()
            
            elif choice == "4":
                install_dependencies()
                deps_ok = check_dependencies()
                input("\nPress Enter to continue...")
            
            elif choice == "5":
                print("\n👋 Goodbye!\n")
                break
            
            else:
                print("\n❌ Invalid choice. Please enter 1-5.")
                input("\nPress Enter to continue...")
        
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()
