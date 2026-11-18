@echo off
title HUNTIQUE - Localhost Server
cd /d "%~dp0"

echo ==============================================
echo   HUNTIQUE - Starting Localhost Server...
echo ==============================================

if exist "%~dp0huntiqueLogo.png" (
    copy /y "%~dp0huntiqueLogo.png" "%~dp0public\huntiqueLogo.png" >nul 2>&1
)
if exist "%~dp0mainImg.jpg" (
    copy /y "%~dp0mainImg.jpg" "%~dp0public\mainImg.jpg" >nul 2>&1
)

netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] Server is already running on port 3000!
    echo Opening browser at http://localhost:3000 ...
    start http://localhost:3000
    exit /b
)

echo [1/2] Launching Next.js dev server on http://localhost:3000...
start "HUNTIQUE Dev Server" cmd /c "npm.cmd run dev"

echo [2/2] Waiting for server initialization...
ping 127.0.0.1 -n 3 >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo [SUCCESS] HUNTIQUE is running!
echo URL: http://localhost:3000
echo To stop, run stop.bat or use manage.bat
echo.
ping 127.0.0.1 -n 2 >nul
