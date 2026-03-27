#!/usr/bin/env python3
"""
Smart Resq Error Detection and Testing Script
Performs comprehensive error checking on all project files
"""
import os
import sys
import subprocess
import importlib.util

class Colors:
    """Terminal colors"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    """Print formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(text):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def check_python_version():
    """Check Python version compatibility"""
    print_header("Checking Python Version")
    version = sys.version_info
    print(f"Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3:
        print_error("Python 3.x required")
        return False
    elif version.minor >= 14:
        print_warning("Python 3.14+ detected - TensorFlow not supported")
        print_warning("Demo mode will be used instead")
    else:
        print_success("Python version compatible")
    
    return True

def check_syntax_errors():
    """Check all Python files for syntax errors"""
    print_header("Checking Python Syntax")
    
    python_files = [
        'app.py',
        'camera.py',
        'config.py',
        'detection.py',
        'license_plate_detection.py',
        'main.py',
        'main_demo.py',
        'launcher.py',
        'install_deps.py'
    ]
    
    errors = []
    for file in python_files:
        if not os.path.exists(file):
            print_warning(f"{file} not found")
            continue
        
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'py_compile', file],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print_success(f"{file} - OK")
            else:
                print_error(f"{file} - Syntax error")
                errors.append((file, result.stderr))
        except Exception as e:
            print_error(f"{file} - Error: {str(e)}")
            errors.append((file, str(e)))
    
    return errors

def check_dependencies():
    """Check if required dependencies are installed"""
    print_header("Checking Dependencies")
    
    required = {
        'cv2': 'opencv-python',
        'numpy': 'numpy',
        'pandas': 'pandas',
        'PIL': 'pillow',
        'flask': 'flask',
        'flask_socketio': 'flask-socketio',
        'flask_cors': 'flask-cors',
        'dotenv': 'python-dotenv',
        'eventlet': 'eventlet',
        'requests': 'requests',
        'twilio': 'twilio'
    }
    
    optional = {
        'tensorflow': 'tensorflow',
        'easyocr': 'easyocr',
        'pytesseract': 'pytesseract'
    }
    
    missing = []
    missing_optional = []
    
    # Check required
    for module, package in required.items():
        try:
            importlib.import_module(module)
            print_success(f"{package} installed")
        except ImportError:
            print_error(f"{package} NOT installed")
            missing.append(package)
    
    # Check optional
    for module, package in optional.items():
        try:
            importlib.import_module(module)
            print_success(f"{package} installed (optional)")
        except ImportError:
            print_warning(f"{package} NOT installed (optional)")
            missing_optional.append(package)
    
    return missing, missing_optional

def check_config_file():
    """Check .env configuration file"""
    print_header("Checking Configuration")
    
    if not os.path.exists('.env'):
        print_error(".env file not found")
        return False
    
    required_keys = [
        'VIDEO_SOURCE',
        'USE_LIVE_CAMERA',
        'OCR_ENGINE',
        'FLASK_PORT',
        'FLASK_HOST'
    ]
    
    optional_keys = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        'DESTINATION_PHONE_NUMBER'
    ]
    
    with open('.env', 'r') as f:
        content = f.read()
    
    missing = []
    for key in required_keys:
        if key not in content:
            missing.append(key)
            print_error(f"{key} not found in .env")
        else:
            print_success(f"{key} configured")
    
    for key in optional_keys:
        if key not in content:
            print_warning(f"{key} not configured (optional)")
        else:
            print_success(f"{key} configured")
    
    return len(missing) == 0

def check_model_files():
    """Check if model files exist"""
    print_header("Checking Model Files")
    
    files = {
        'model.json': 'Model architecture',
        'model_weights.keras': 'Model weights',
        'new.mp4': 'Demo video (optional)'
    }
    
    missing = []
    for file, desc in files.items():
        if os.path.exists(file):
            size = os.path.getsize(file)
            if size > 0:
                print_success(f"{desc}: {file} ({size:,} bytes)")
            else:
                print_error(f"{desc}: {file} is empty!")
                missing.append(file)
        else:
            if file == 'new.mp4':
                print_warning(f"{desc}: {file} not found (will use camera)")
            else:
                print_error(f"{desc}: {file} not found")
                missing.append(file)
    
    return missing

def check_directories():
    """Check if required directories exist"""
    print_header("Checking Directories")
    
    dirs = [
        'templates',
        'static',
        'accident_photos',
        'vehicle_no_plates',
        'plate_detection_frames'
    ]
    
    for directory in dirs:
        if os.path.exists(directory):
            print_success(f"{directory}/ exists")
        else:
            print_warning(f"{directory}/ does not exist (will be created)")
    
    return True

def check_imports():
    """Test importing main modules"""
    print_header("Testing Module Imports")
    
    modules_to_test = [
        ('config', 'Configuration module'),
        ('detection', 'Detection module (may fail without TensorFlow)'),
        ('license_plate_detection', 'License plate detection module')
    ]
    
    errors = []
    for module_name, desc in modules_to_test:
        try:
            importlib.import_module(module_name)
            print_success(f"{desc}: OK")
        except Exception as e:
            if 'tensorflow' in str(e).lower() and module_name == 'detection':
                print_warning(f"{desc}: TensorFlow not available (demo mode will be used)")
            else:
                print_error(f"{desc}: {str(e)}")
                errors.append((module_name, str(e)))
    
    return errors

def run_all_checks():
    """Run all error checks"""
    print(f"\n{Colors.BOLD}{'='*60}")
    print("Smart Resq Error Detection and Testing")
    print(f"{'='*60}{Colors.END}\n")
    
    errors = []
    warnings = []
    
    # Python version
    if not check_python_version():
        errors.append("Python version incompatible")
    
    # Syntax errors
    syntax_errors = check_syntax_errors()
    if syntax_errors:
        errors.extend([f"Syntax error in {file}" for file, _ in syntax_errors])
    
    # Dependencies
    missing_deps, missing_optional = check_dependencies()
    if missing_deps:
        errors.extend([f"Missing dependency: {dep}" for dep in missing_deps])
    if missing_optional:
        warnings.extend([f"Missing optional: {dep}" for dep in missing_optional])
    
    # Configuration
    if not check_config_file():
        errors.append("Configuration file issues")
    
    # Model files
    missing_models = check_model_files()
    if missing_models:
        if 'model.json' in missing_models or 'model_weights.keras' in missing_models:
            warnings.append("AI model files missing (demo mode available)")
    
    # Directories
    check_directories()
    
    # Import tests
    import_errors = check_imports()
    if import_errors:
        for module, error in import_errors:
            if 'tensorflow' not in error.lower():
                errors.append(f"Import error in {module}")
    
    # Summary
    print_header("Summary")
    
    if errors:
        print(f"\n{Colors.RED}{Colors.BOLD}ERRORS FOUND: {len(errors)}{Colors.END}")
        for error in errors:
            print_error(error)
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ NO CRITICAL ERRORS FOUND{Colors.END}")
    
    if warnings:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}WARNINGS: {len(warnings)}{Colors.END}")
        for warning in warnings:
            print_warning(warning)
    
    if not errors and not warnings:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL CHECKS PASSED!{Colors.END}")
        print("\nYour Smart Resq installation is ready to run!")
        print("\nQuick start:")
        print("  python app.py         # Web dashboard")
        print("  python main.py        # Standalone mode")
        print("  python main_demo.py   # Demo mode")
    elif not errors:
        print(f"\n{Colors.GREEN}✓ System is functional with warnings{Colors.END}")
        print("\nYou can run the system, but some features may be limited.")
    else:
        print(f"\n{Colors.RED}✗ Please fix the errors above before running{Colors.END}")
        print("\nInstall missing dependencies:")
        print("  pip install -r requirements.txt")
    
    print()

if __name__ == '__main__':
    try:
        run_all_checks()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠ Check interrupted by user{Colors.END}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}✗ Unexpected error: {e}{Colors.END}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
