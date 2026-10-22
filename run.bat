@echo off
title FrontFix AI - Team B
echo ========================================================
echo   ⚡ FrontFix AI — Frontend Support Chatbot (Team B)
echo   Runtime: Python (FastAPI/Uvicorn) + React (Vite)
echo ========================================================
echo.

:: install Python backend dependencies if needed
echo [*] Checking Python dependencies...
python -m pip install -q -r backend\requirements.txt

if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

:: build static assets for single-process backend fallback
if not exist "frontend\dist" (
    echo [*] Building frontend production bundle...
    cd frontend && call npm run build && cd ..
)

echo [1/2] Starting Python FastAPI Backend Server on http://127.0.0.1:8000 ...
start "FrontFix Backend API" cmd /k "cd backend && python main.py"

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
