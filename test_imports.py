#!/usr/bin/env python3
"""
Test script to check which packages are available
"""

def test_imports():
    """Test importing required packages"""
    packages = {
        'cv2': 'OpenCV',
        'numpy': 'NumPy', 
        'pandas': 'Pandas',
        'tensorflow': 'TensorFlow',
        'keras': 'Keras',
        'twilio': 'Twilio',
        'PIL': 'Pillow',
        'tkinter': 'Tkinter'
    }
    
    print("Testing package imports...")
    print("="*40)
    
    available = []
    missing = []
    
    for package, name in packages.items():
        try:
            __import__(package)
            print(f"✓ {name}")
            available.append(package)
        except ImportError as e:
            print(f"✗ {name} - {e}")
            missing.append(package)
    
    print("\nSummary:")
    print(f"Available: {len(available)} packages")
    print(f"Missing: {len(missing)} packages")
    
    if missing:
        print(f"\nMissing packages: {', '.join(missing)}")
    
    return len(missing) == 0

if __name__ == "__main__":
    test_imports()
