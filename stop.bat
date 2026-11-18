@echo off
title HUNTIQUE - Stop Server
cd /d "%~dp0"

echo ==============================================
echo   HUNTIQUE - Stopping Server on Port 3000...
echo ==============================================

set found=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminating process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
    set found=1
)

if %found% equ 1 (
    echo [SUCCESS] HUNTIQUE server stopped.
) else (
    echo [INFO] No server found running on port 3000.
)

ping 127.0.0.1 -n 2 >nul
