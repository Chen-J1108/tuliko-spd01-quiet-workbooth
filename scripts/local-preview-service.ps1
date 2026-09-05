param(
    [Parameter(Mandatory = $true)][string]$NodePath,
    [int]$Port = 4174
)

$ErrorActionPreference = 'Stop'
$env:NO_COLOR = '1'
$projectPath = Split-Path -Parent $PSScriptRoot
$vitePath = Join-Path $projectPath 'node_modules\vite\bin\vite.js'
$logDirectory = Join-Path $env:LOCALAPPDATA 'Tuliko\local-preview'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$logFile = Join-Path $logDirectory 'service.log'
$previewMutex = New-Object System.Threading.Mutex($false, "Local\TulikoPreview$Port")
if (-not $previewMutex.WaitOne(0)) { $previewMutex.Dispose(); exit 0 }

try {
    Set-Location -LiteralPath $projectPath
    while ($true) {
        if ((Test-Path -LiteralPath $logFile) -and (Get-Item -LiteralPath $logFile).Length -gt 2MB) {
            Move-Item -LiteralPath $logFile -Destination (Join-Path $logDirectory 'service.previous.log') -Force
        }
        try {
            # Do not take over a port already used by a manual preview or another app.
            $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if ($listener) { Start-Sleep -Seconds 10; continue }
            if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'dist\client\index.html'))) {
                throw 'Build output missing. Run npm run build in the project.'
            }
            Add-Content -LiteralPath $logFile -Encoding UTF8 -Value "$(Get-Date -Format o) Starting local preview on 127.0.0.1:$Port"
            # The scheduled task owns this process, independently of Codex's terminal.
            & $NodePath $vitePath preview --host 127.0.0.1 --port $Port --strictPort *>&1 | Out-File -LiteralPath $logFile -Append -Encoding UTF8
            Add-Content -LiteralPath $logFile -Encoding UTF8 -Value "$(Get-Date -Format o) Preview exited ($LASTEXITCODE); retrying."
        } catch {
            Add-Content -LiteralPath $logFile -Encoding UTF8 -Value "$(Get-Date -Format o) $($_.Exception.Message)"
        }
        Start-Sleep -Seconds 5
    }
} finally {
    $previewMutex.ReleaseMutex()
    $previewMutex.Dispose()
}
