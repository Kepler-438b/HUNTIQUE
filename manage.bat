@echo off
title HUNTIQUE - Server Control Center
cd /d "%~dp0"

:menu
cls
echo ======================================================
echo           HUNTIQUE - LOCALHOST CONTROL CENTER
echo ======================================================
echo.
echo   [1] Start Server and Open Browser
echo   [2] Stop Server
echo   [3] Restart Server
echo   [4] Check Server Status
echo   [5] Exit
echo.
echo ======================================================
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto stop_server
if "%choice%"=="3" goto restart_server
if "%choice%"=="4" goto status_server
if "%choice%"=="5" exit /b
goto menu

:start_server
echo.
echo Starting HUNTIQUE server...
call start.bat
goto menu

:stop_server
echo.
echo Stopping HUNTIQUE server...
call stop.bat
goto menu

:restart_server
echo.
echo Restarting HUNTIQUE server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
ping 127.0.0.1 -n 3 >nul
start "HUNTIQUE Dev Server" cmd /c "npm.cmd run dev"
ping 127.0.0.1 -n 3 >nul
start http://localhost:3000
echo Server restarted!
pause
goto menu

:status_server
echo.
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [STATUS] ONLINE - Server is currently running on http://localhost:3000
) else (
    echo [STATUS] OFFLINE - No server running on port 3000.
)
echo.
pause
goto menu
