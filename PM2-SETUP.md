# PM2 Setup Guide - Auto Start on Boot

This guide explains how to set up PM2 to automatically run your backend server and start on every PC boot.

## Prerequisites

- Node.js and npm installed globally
- Your backend should be built: `npm run build --prefix backend`

## ✅ What's Been Completed

- ✅ PM2 installed globally
- ✅ Backend built (`npm run build --prefix backend`)
- ✅ Backend server started with PM2 (`first-react-backend` process)
- ✅ PM2 process list saved

## Installation Steps (Already Done!)

### 1. ✅ GM2 Globally

PM2 is already installed globally on your system.

### 2. ✅ Backend Built

The backend has been successfully built to `backend/dist/server.js`.

### 3. ✅ Started with PM2

Your backend server is now running as `first-react-backend`:

```powershell
# Verify it's running
pm2 list
```

### 4. ✅ Process List Saved

The PM2 process list has been saved and will persist across restarts.

## Setting Up Auto-Start on Windows Boot

Choose **ONE** of the following methods:

### Method 1: Using Windows Task Scheduler (Recommended)

1. **Right-click the PowerShell script and run as Administrator:**
   - Navigate to project folder: `C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\`
   - Right-click `start-pm2.ps1` → Run with PowerShell

2. **Create a scheduled task:**
   - Press `Win + R` → type `taskschd.msc` → press Enter
   - Right-click "Task Scheduler Library" → "Create Basic Task"
   - **Name:** "Start PM2 Backend Server"
   - **Trigger:** "At startup"
   - **Action:** 
     - Program: `powershell.exe`
     - Arguments: `-ExecutionPolicy Bypass -File "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\start-pm2.ps1"`
   - Check "Run with highest privileges"
   - Click OK

### Method 2: Using Batch File

1. **Create a shortcut:**
   - Right-click `start-pm2.bat` → Create shortcut
   - Move shortcut to Startup folder:
   ```
   C:\Users\TIBO GANI! SA DIAY!\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
   ```

## Useful PM2 Commands

View running processes:
```powershell
pm2 list
```

View real-time logs:
```powershell
pm2 logs
```

View logs for backend specifically:
```powershell
pm2 logs first-react-backend
```

Stop the backend:
```powershell
pm2 stop first-react-backend
```

Restart the backend:
```powershell
pm2 restart first-react-backend
```

Stop all PM2 processes:
```powershell
pm2 stop all
```

Delete a process:
```powershell
pm2 delete first-react-backend
```

Start a new server process:
```powershell
cd c:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app
npm run build --prefix backend
pm2 start "backend/dist/server.js" --name "first-react-backend"
pm2 save
```

## Monitoring in Real-Time

To see CPU and memory usage:

```powershell
pm2 monit
```

Press `q` to exit monitoring.

## Troubleshooting

### Process won't start
1. Verify backend is built:
   ```powershell
   npm run build --prefix backend
   ```
2. Check logs:
   ```powershell
   pm2 logs first-react-backend
   ```

### Auto-start not triggering
1. **Verify PM2 process is saved:**
   ```powershell
   pm2 list
   pm2 save
   ```
2. **Test the startup script manually:**
   - Run PowerShell as Administrator
   - Execute: `C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\start-pm2.ps1`

3. **Check Windows Task Scheduler:**
   - Open `taskschd.msc`
   - Find "Start PM2 Backend Server"
   - Right-click → "Run" to test

4. **Check PM2 logs:**
   ```powershell
   pm2 logs
   ```

## Current Status

```
Process Name: first-react-backend
Status: online ✅
Location: C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\backend\dist\server.js
```

**Your backend server is ready and will now run automatically on system startup!**
