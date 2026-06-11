@echo off
title RAG Document Intelligence System - Unified Launcher
:menu
cls
echo =====================================================================
echo RAG-Based Document Intelligence System Launcher
echo =====================================================================
echo Please select an option to run:
echo.
echo  [1] Start Backend Server (FastAPI on Port 8000)
echo  [2] Start Frontend Dev Server (Vite React on Port 5173/5174)
echo  [3] Compile and Build Production UI (npm run build)
echo  [4] Start CLI Interactive Q&A Tool (python main.py)
echo  [5] Run Verification Tests (test_script.py / test_query.py)
echo  [6] Exit
echo =====================================================================
echo.
set /p choice="Enter option (1-6): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto build
if "%choice%"=="4" goto cli
if "%choice%"=="5" goto tests
if "%choice%"=="6" goto exit
echo Invalid option, please try again.
pause
goto menu

:backend
echo.
echo Starting FastAPI Backend...
call rag_env\Scripts\activate.bat
python -m uvicorn dashboard:app --host 127.0.0.1 --port 8000 --reload
pause
goto menu

:frontend
echo.
echo Starting Vite Frontend Dev Server...
cd ui
npm run dev
pause
goto menu

:build
echo.
echo Building Production UI Bundle...
cd ui
call npm run build
cd ..
pause
goto menu

:cli
echo.
echo Starting CLI Q&A Assistant...
call rag_env\Scripts\activate.bat
python main.py
pause
goto menu

:tests
echo.
echo Running Verification Test Suite...
call rag_env\Scripts\activate.bat
echo Running session isolation test...
python test_script.py
echo.
echo Running query test...
python test_query.py
pause
goto menu

:exit
echo Goodbye!
exit
