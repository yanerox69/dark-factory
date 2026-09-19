# Lanza Jam Desktop con la configuracion de inferencia de la fabrica.
#
# Por que existe: las variables ANTHROPIC_* a nivel de usuario secuestran
# cualquier Claude Code de la maquina, incluida tu propia sesion. Aqui se
# definen solo para el proceso que arranca Jam, asi que los agentes las heredan
# via el daemon y nada mas las ve.
#
#   .\iniciar-fabrica.ps1
#
# Requisito: DARKFACTORY_OPENROUTER_KEY definida a nivel de usuario. Para
# cambiarla sin que quede en el historial:
#   $k = Read-Host "Clave"; [Environment]::SetEnvironmentVariable("DARKFACTORY_OPENROUTER_KEY",$k,"User"); Remove-Variable k

$ErrorActionPreference = 'Stop'

$key = [Environment]::GetEnvironmentVariable('DARKFACTORY_OPENROUTER_KEY', 'User')
if (-not $key) {
    Write-Host "FALTA la clave. Define DARKFACTORY_OPENROUTER_KEY y vuelve a intentarlo." -ForegroundColor Red
    exit 1
}

# --- comprobacion previa: Jam tiene que estar completamente parado ---------
# El daemon sobrevive al cierre de la ventana, y si sigue vivo hereda el
# entorno viejo. Arrancar con jamd en pie no aplica nada de lo de abajo.
$jamd = Get-Process jamd -ErrorAction SilentlyContinue
$desk = Get-Process jam-desktop -ErrorAction SilentlyContinue
if ($jamd -or $desk) {
    Write-Host "Jam sigue corriendo. Cierralo del todo (bandeja incluida) y ejecuta:" -ForegroundColor Yellow
    Write-Host '  & "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe" daemon stop'
    Write-Host "Luego vuelve a lanzar este script."
    exit 1
}

# --- configuracion de inferencia, solo para este proceso y sus hijos -------
$env:ANTHROPIC_BASE_URL = 'https://openrouter.ai/api'
$env:ANTHROPIC_AUTH_TOKEN = $key
$env:ANTHROPIC_MODEL = 'nex-agi/nex-n2.5-pro:free'
$env:ANTHROPIC_SMALL_FAST_MODEL = 'nex-agi/nex-n2.5-mini:free'
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = '1'
Remove-Variable key

# ANTHROPIC_API_KEY tiene que quedar vacia, no definida con un valor viejo:
# si Claude Code encuentra una clave de Anthropic, la usa y se ignora OpenRouter.
$env:ANTHROPIC_API_KEY = ''

$desktop = Join-Path $env:LOCALAPPDATA 'jam\jam-desktop.exe'
if (-not (Test-Path $desktop)) {
    Write-Host "No encuentro Jam Desktop en $desktop" -ForegroundColor Red
    exit 1
}

Write-Host "Arrancando Jam con inferencia via OpenRouter..." -ForegroundColor Green
Write-Host "  modelo:  $env:ANTHROPIC_MODEL"
Write-Host "  rapido:  $env:ANTHROPIC_SMALL_FAST_MODEL"
Start-Process -FilePath $desktop

Write-Host ""
Write-Host "Cuando levante, comprueba con:" -ForegroundColor Cyan
Write-Host '  & "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe" preflight'
