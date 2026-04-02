@echo off
echo Setting up Smart Resq Project...
echo.

REM Create virtual environment
echo Creating virtual environment...
py -3.13 -m venv smart_resq_env
if errorlevel 1 (
    echo Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call smart_resq_env\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install packages one by one to avoid conflicts
echo Installing basic packages...
pip install numpy
pip install pandas
pip install opencv-python
pip install pillow

echo Installing TensorFlow...
pip install tensorflow

echo Installing Twilio...
pip install twilio

echo.
echo Setup complete! To run the project:
echo 1. Run: smart_resq_env\Scripts\activate.bat
echo 2. Then: python main.py
echo.
pause
