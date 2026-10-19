@echo off
title FrontFix AI - Team B
echo ========================================================
echo   ⚡ FrontFix AI — Frontend Support Chatbot (Team B)
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend Server on http://127.0.0.1:8000 ...
start "FrontFix Backend API" cmd /k "cd backend && python run.py"

echo [2/2] Opening Minimal Frontend UI in your browser...
timeout /t 2 /nobreak >nul
start "" "frontend\index.html"

echo.
echo ✅ FrontFix AI is running!
echo - Frontend UI: Opened in your browser
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo.
pause
