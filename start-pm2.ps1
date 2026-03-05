# PowerShell script to start PM2 processes on system startup
# Run as Administrator

$projectPath = "C:\Users\TIBO GANI! SA DIAY!\Desktop\first-react-app"

# Navigate to project directory
Set-Location $projectPath

# Prefer the global npm pm2 wrapper (pm2.cmd on Windows)
$pm2Cmd = Join-Path $env:APPDATA 'npm\\pm2.cmd'
if (-not (Test-Path $pm2Cmd)) {
	Write-Output "pm2 wrapper not found at $pm2Cmd — falling back to 'pm2' in PATH"
	$pm2Cmd = 'pm2'
}

# Try to resurrect saved PM2 processes and capture logs
try {
	& $pm2Cmd resurrect 2>&1 | Out-File -FilePath "$projectPath\\pm2-resurrect.log" -Append
	& $pm2Cmd list 2>&1 | Out-File -FilePath "$projectPath\\pm2-list.log" -Append
} catch {
	$_ | Out-File -FilePath "$projectPath\\pm2-error.log" -Append
}
