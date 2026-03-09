# Run this script ONCE to make PM2 resurrect automatically at every Windows logon.
# Right-click → Run with PowerShell (window will stay open so you can read the result)

try {
    $TaskName = "Start PM2 Backend Server"
    $ScriptPath = "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\start-pm2.ps1"
    $TaskDescription = "Runs pm2 resurrect so your first-react-app backend starts when you log in."

    if (-not (Test-Path $ScriptPath)) {
        Write-Host "ERROR: start-pm2.ps1 not found at: $ScriptPath" -ForegroundColor Red
        throw "Script path not found"
    }

    # Remove existing task if present (so re-running this script updates it)
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Removed existing task '$TaskName'."
    }

    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""
    $Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description $TaskDescription | Out-Null

    Write-Host ""
    Write-Host "Done. Task '$TaskName' is installed." -ForegroundColor Green
    Write-Host "PM2 will run 'pm2 resurrect' every time you log in to this PC."
    Write-Host ""
    Write-Host "Make sure you have saved your PM2 list: pm2 save"
    Write-Host "To test now: Win+R -> taskschd.msc -> find '$TaskName' -> Right-click -> Run"
} catch {
    Write-Host ""
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "If it says 'Access is denied', right-click PowerShell -> Run as administrator, then run:"
    Write-Host "  Set-Location 'C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app'"
    Write-Host "  .\install-pm2-startup.ps1"
}

Write-Host ""
Read-Host "Press Enter to close this window"
