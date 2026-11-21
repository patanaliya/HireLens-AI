@echo off
title HireLens AI - Full Platform Launcher
echo ========================================================
echo         Launching HireLens AI Platform...
echo   An Explainable, Fair & Interactive Resume Screening System
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend FastAPI Server on https://hirelens-backend-ea18.onrender.com...
start "HireLens AI Backend" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend React Application on http://localhost:5173...
start "HireLens AI Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo Opening HireLens AI in your default web browser...
start http://localhost:5173/
start http://localhost:5173/screen
echo.
echo HireLens AI is now active! Press any key to close this launcher window.
pause
