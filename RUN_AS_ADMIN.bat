@echo off
echo ========================================
echo SMART RESQ - ADMIN INSTALLATION
echo ========================================
echo.
echo This script must be run as Administrator
echo Right-click -> "Run as administrator"
echo.
pause

REM Enable long paths system-wide
echo Enabling Windows Long Path support...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f

REM Install dependencies
echo Installing dependencies...
py -3.13 -m pip install --upgrade pip
py -3.13 -m pip install numpy pandas opencv-python pillow tensorflow twilio

echo.
echo Installation complete!
echo You can now run: python main.py
pause
