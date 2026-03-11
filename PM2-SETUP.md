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

**Important:** PM2 does **not** start by itself on Windows. You must do one of the steps below **once** so that `pm2 resurrect` runs every time you boot or log in.

### Method 1: One-time installer (Easiest)

1. **Run the installer script once as Administrator:**
   - Go to: `C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\`
   - **Right-click** `install-pm2-startup.ps1` → **Run with PowerShell** (or open PowerShell as Administrator and run it from the project folder)
   - If you get an execution policy error, in PowerShell (as Administrator) run:
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```
     Then run the installer again.

2. **When prompted for password:**
   - **Enter your Windows password** → PM2 will run **when the PC boots** (about 60 seconds after startup) and when you log in.
   - **Just press Enter (skip)** → PM2 will run only **when you log in**. Use this if you prefer not to store your password, or if your account has **no password** (see below).

   **If this PC/server has no password:** run **`run-enable-autologon.bat`** by right-clicking it → **Run as administrator**. (Or in Administrator PowerShell run: `Set-Location "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app"` then `powershell -ExecutionPolicy Bypass -File ".\enable-autologon.ps1"`.) That enables automatic logon at boot so PM2 starts without you doing anything.

3. **Ensure your process list is saved:**
   ```powershell
   pm2 save
   ```

After this, the task will run `pm2 resurrect` at logon (and at startup too if you entered your password).

**Server has no Windows password?**  
1. Run `install-pm2-startup.ps1` and press Enter when asked for password (task will run at logon only).  
2. Right-click **`run-enable-autologon.bat`** → **Run as administrator** (this runs the auto-logon script so the PC logs in automatically at boot).  
3. Run `pm2 save`.  
After a reboot, the PC will auto-logon and the task will start PM2 — no need to run `pm2 resurrect` yourself.

### Method 2: Manual Task Scheduler

1. Press `Win + R` → type `taskschd.msc` → Enter.
2. Right-click "Task Scheduler Library" → "Create Basic Task".
3. **Name:** "Start PM2 Backend Server"
4. **Trigger:** "When I log on" (better than "At startup" so Node/PM2 are in your PATH).
5. **Action:** Start a program  
   - Program: `powershell.exe`  
   - Arguments: `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\start-pm2.ps1"`
6. Finish and run `pm2 save` so the list is saved.

### Method 3: Startup folder

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
   - To see PM2 output when testing: right-click **"Run PM2 Backend Server (show window)"** → Run (a window will open and stay open).
   - The task **"Start PM2 Backend Server"** runs in the background (no window); use the "(show window)" task to verify from Task Scheduler.

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
