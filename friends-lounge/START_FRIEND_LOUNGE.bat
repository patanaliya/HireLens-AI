@echo off
title FriendLounge Web App
echo ========================================================
echo        Starting FriendLounge Web Application...
echo ========================================================
echo.
cd /d "%~dp0"
echo Starting local web server on port 3000...
echo.
echo Opening website in your default browser...
start http://localhost:3000
npm run dev
pause
