@echo off
REM Start PM2 Backend Server
REM This batch file starts PM2 and restores the saved processes

cd /d "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app"

REM use pm2.cmd wrapper when possible
if exist "%APPDATA%\npm\pm2.cmd" (
    set PM2CMD=%APPDATA%\npm\pm2.cmd
) else (
    set PM2CMD=pm2
)

%PM2CMD% resurrect >> "%~dp0pm2-batch.log" 2>&1
%PM2CMD% list >> "%~dp0pm2-batch.log" 2>&1

