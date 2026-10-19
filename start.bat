@echo off
title FrontFix AI - Team B Launcher
echo =======================================================
echo    ⚡ FrontFix AI - Frontend Support Chatbot (Team B)
echo =======================================================
echo.
echo [1/2] Launching FastAPI Backend Server...
start "FrontFix Backend" cmd /k "cd backend && python run.py"

echo [2/2] Opening Interactive Diagnostics Web Studio...
timeout /t 2 /nobreak >nul
start "" "index.html"

echo.
echo ✅ FrontFix AI is running!
echo - Web Studio: Opened in your browser
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo.
pause
