$ErrorActionPreference = 'Stop'

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP not found on PATH." -ForegroundColor Red
    exit 1
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbDir = Join-Path $root 'data'
New-Item -ItemType Directory -Path $dbDir -Force | Out-Null

Write-Host "Starting Panchang backend on http://localhost:1212" -ForegroundColor Green
Write-Host "Admin dashboard at /admin - Press Ctrl+C to stop." -ForegroundColor Yellow

& php -S localhost:1212 "$root\router.php"