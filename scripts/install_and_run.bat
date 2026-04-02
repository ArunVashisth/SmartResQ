@echo off
echo ========================================
echo Smart Resq - Accident Detection System
echo ========================================
echo.

REM Check Python version
python --version
if %errorlevel% neq 0 (
    echo Error: Python not found!
    echo Please install Python 3.8-3.12 from python.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
echo.

REM Install dependencies
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo Warning: Some packages failed to install.
    echo You can still run the demo version.
    echo.
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Choose how to run Smart Resq:
echo.
echo 1. Web Dashboard (Recommended)
echo    python app.py
echo    Then open: http://localhost:5000
echo.
echo 2. Standalone Mode
echo    python main.py
echo.
echo 3. Demo Mode (No TensorFlow)
echo    python main_demo.py
echo.
pause
