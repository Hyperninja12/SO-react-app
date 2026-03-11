# Enable Windows to log in automatically at boot (no password).
# Run as Administrator. After this, when the PC boots it will auto-logon as you
# and the "Start PM2 Backend Server" task will run, so PM2 starts without you doing anything.

# Must run as Administrator to write to HKLM
$key = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
$user = $env:USERNAME

try {
    Set-ItemProperty -Path $key -Name "AutoAdminLogon" -Value "1" -Type String -ErrorAction Stop
    Set-ItemProperty -Path $key -Name "DefaultUserName" -Value $user -Type String -ErrorAction Stop
    Set-ItemProperty -Path $key -Name "DefaultPassword" -Value "" -Type String -ErrorAction Stop
    Write-Host ""
    Write-Host "Auto-logon is enabled for user: $user (no password)." -ForegroundColor Green
    Write-Host "When this PC boots, it will log in automatically and PM2 will start." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host "Run this script as Administrator (right-click PowerShell -> Run as administrator)." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close this window"
