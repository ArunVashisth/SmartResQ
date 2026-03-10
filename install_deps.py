#!/usr/bin/env python3
"""
Install dependencies for Smart Resq project
This script handles the Windows Long Path issue
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def install_package(package):
    """Install a single package"""
    print(f"Installing {package}...")
    
    # Try different installation methods
    commands = [
        f"pip install --no-cache-dir {package}",
        f"pip install --user {package}",
        f"python -m pip install {package}",
        f"py -3 -m pip install {package}"
    ]
    
    for cmd in commands:
        success, stdout, stderr = run_command(cmd)
        if success:
            print(f"✓ {package} installed successfully")
            return True
        else:
            print(f"Failed with: {cmd}")
            print(f"Error: {stderr}")
    
    print(f"✗ Failed to install {package}")
    return False

def main():
    """Main installation function"""
    print("Smart Resq Dependency Installer")
    print("="*40)
    
    # List of packages to install
    packages = [
        "numpy",
        "pandas", 
        "opencv-python",
        "pillow",
        "tensorflow",
        "twilio"
    ]
    
    # Install packages one by one
    failed_packages = []
    
    for package in packages:
        if not install_package(package):
            failed_packages.append(package)
        print("-" * 40)
    
    # Summary
    print("\nInstallation Summary:")
    print("="*40)
    
    if failed_packages:
        print(f"Failed to install: {', '.join(failed_packages)}")
        print("\nAlternative solutions:")
        print("1. Run as Administrator")
        print("2. Use virtual environment")
        print("3. Install from different source")
    else:
        print("All packages installed successfully!")
        print("\nYou can now run the project with:")
        print("python main.py")
    
    return len(failed_packages) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
