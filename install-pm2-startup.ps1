# Run this script ONCE so PM2 resurrects when the PC boots and when you log in.
# Right-click -> Run with PowerShell (as Administrator).
# Window will stay open so you can read the result.

try {
    $TaskName = "Start PM2 Backend Server"
    $ScriptPath = "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app\start-pm2.ps1"
    $TaskDescription = "Runs pm2 resurrect when the PC boots and when you log in."

    if (-not (Test-Path $ScriptPath)) {
        Write-Host "ERROR: start-pm2.ps1 not found at: $ScriptPath" -ForegroundColor Red
        throw "Script path not found"
    }

    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Removed existing task '$TaskName'."
    }

    # Hidden window: for automatic run at boot/logon (no window popup)
    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""
    # Visible window: use this when you Run from Task Scheduler to see PM2 output (window stays open)
    $ActionVisible = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    Write-Host "To run PM2 when the PC boots (before anyone logs in), Windows needs your password." -ForegroundColor Cyan
    Write-Host "Enter your Windows password and press Enter, or just press Enter to only run at logon." -ForegroundColor Cyan
    $sec = Read-Host "Password (optional)" -AsSecureString
    $password = $null
    if ($sec -and $sec.Length -gt 0) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
        try { $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) }
    }

    $TriggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $TriggerStartup = New-ScheduledTaskTrigger -AtStartup
    $TriggerStartup.Delay = "PT60S"
    $Triggers = @($TriggerLogon, $TriggerStartup)

    if ($password) {
        # -User + -Password allows the task to run at startup (no logon required)
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Triggers -Settings $Settings -User $env:USERNAME -Password $password -Description $TaskDescription | Out-Null
        Write-Host ""
        Write-Host "Done. Task '$TaskName' is installed (at startup + at logon)." -ForegroundColor Green
        Write-Host "PM2 will run about 60 seconds after this PC boots and when you log in."
    } else {
        $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $TriggerLogon -Settings $Settings -Principal $Principal -Description $TaskDescription | Out-Null
        Write-Host ""
        Write-Host "Done. Task '$TaskName' is installed (at logon only)." -ForegroundColor Green
        Write-Host "PM2 will run when you log in."
        Write-Host "If this PC has NO password and you want PM2 to start at boot: right-click run-enable-autologon.bat -> Run as administrator." -ForegroundColor Cyan
    }

    # Second task: on demand only, with visible window (for running from taskschd.msc to see output)
    $TaskNameVisible = "Run PM2 Backend Server (show window)"
    $existingVisible = Get-ScheduledTask -TaskName $TaskNameVisible -ErrorAction SilentlyContinue
    if ($existingVisible) { Unregister-ScheduledTask -TaskName $TaskNameVisible -Confirm:$false }
    $TriggerManual = New-ScheduledTaskTrigger -Once -At (Get-Date).AddYears(10)
    $PrincipalManual = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    Register-ScheduledTask -TaskName $TaskNameVisible -Action $ActionVisible -Trigger $TriggerManual -Settings $Settings -Principal $PrincipalManual -Description "Run pm2 resurrect and show output (for testing from Task Scheduler). Window stays open." | Out-Null
    Write-Host ""
    Write-Host "To test from Task Scheduler with a visible window: run '$TaskNameVisible' (window will stay open)." -ForegroundColor Cyan

    Write-Host ""
    Write-Host "Make sure you have saved your PM2 list: pm2 save"
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
