# PowerShell script to start PM2 processes (startup or manual run)
# Right-click -> Run with PowerShell: window stays open so you can see the result

$projectPath = "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app"

Set-Location $projectPath

$pm2Cmd = Join-Path $env:APPDATA 'npm\pm2.cmd'
if (-not (Test-Path $pm2Cmd)) {
	Write-Host "pm2 not found at $pm2Cmd — using 'pm2' from PATH" -ForegroundColor Yellow
	$pm2Cmd = 'pm2'
}

try {
	Write-Host "Running pm2 resurrect..." -ForegroundColor Cyan
	$resurrectOut = & $pm2Cmd resurrect 2>&1
	$resurrectOut | Write-Host
	$resurrectOut | Out-File -FilePath "$projectPath\pm2-resurrect.log" -Append

	Write-Host ""
	Write-Host "PM2 process list:" -ForegroundColor Cyan
	$listOut = & $pm2Cmd list 2>&1
	$listOut | Write-Host
	$listOut | Out-File -FilePath "$projectPath\pm2-list.log" -Append

	Write-Host ""
	Write-Host "Done. PM2 processes have been resurrected." -ForegroundColor Green
} catch {
	Write-Host "ERROR: $_" -ForegroundColor Red
	$_ | Out-File -FilePath "$projectPath\pm2-error.log" -Append
}

Write-Host ""
Read-Host "Press Enter to close this window"
