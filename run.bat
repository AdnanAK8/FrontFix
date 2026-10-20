@echo off
title FrontFix AI - Team B
echo ========================================================
echo   ⚡ FrontFix AI — Frontend Support Chatbot (Team B)
echo   Runtime: Node.js & Express + React (Vite)
echo ========================================================
echo.

:: ponytail: install dependencies if missing
if not exist "backend\node_modules" (
    echo [*] Installing backend dependencies...
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

:: ponytail: build static assets for single-process backend fallback
if not exist "frontend\dist" (
    echo [*] Building frontend production bundle...
    cd frontend && call npm run build && cd ..
)

echo [1/2] Starting Node.js Backend Server on http://127.0.0.1:8000 ...
start "FrontFix Backend API" cmd /k "cd backend && npm start"

echo [2/2] Starting Vite Frontend Server on http://localhost:5173 ...
start "FrontFix Frontend UI" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ✅ FrontFix AI is running!
echo - Frontend UI: http://localhost:5173
echo - Backend API: http://127.0.0.1:8000
echo - Embedded UI: http://127.0.0.1:8000/ui/
echo - Chrome/Edge Extension: Load unpacked from /extension
echo.
pause
