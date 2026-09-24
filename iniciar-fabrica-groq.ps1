# Lanza Jam Desktop apuntando al proxy LiteLLM (y por detras, a Groq).
#
# Variante de iniciar-fabrica.ps1 con la misma disciplina: las variables
# ANTHROPIC_* se definen SOLO para el proceso que arranca Jam, nunca a nivel de
# usuario, porque a nivel de usuario secuestran cualquier Claude Code de la
# maquina, tu propia sesion incluida.
#
#   1. En una ventana:  .\iniciar-litellm.ps1     (dejala abierta)
#   2. En otra:         .\iniciar-fabrica-groq.ps1

$ErrorActionPreference = 'Stop'

$proxy  = 'http://127.0.0.1:4000'
$master = 'sk-darkfactory-local'

# --- el proxy tiene que estar vivo antes que Jam ---------------------------
try {
    $null = Invoke-WebRequest -Uri "$proxy/health/liveliness" -TimeoutSec 5 -UseBasicParsing
} catch {
    Write-Host "El proxy LiteLLM no responde en $proxy" -ForegroundColor Red
    Write-Host "Arrancalo primero en otra ventana:  .\iniciar-litellm.ps1"
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
$env:ANTHROPIC_BASE_URL = $proxy
$env:ANTHROPIC_AUTH_TOKEN = $master
$env:ANTHROPIC_MODEL = 'factory-main'
$env:ANTHROPIC_SMALL_FAST_MODEL = 'factory-fast'
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = '1'

# ANTHROPIC_API_KEY tiene que quedar vacia, no definida con un valor viejo:
# si Claude Code encuentra una clave de Anthropic, la usa y se ignora el proxy.
$env:ANTHROPIC_API_KEY = ''

$desktop = Join-Path $env:LOCALAPPDATA 'jam\jam-desktop.exe'
if (-not (Test-Path $desktop)) {
    Write-Host "No encuentro Jam Desktop en $desktop" -ForegroundColor Red
    exit 1
}

Write-Host "Arrancando Jam con inferencia via LiteLLM -> Groq..." -ForegroundColor Green
Write-Host "  proxy:   $proxy"
Write-Host "  modelo:  $env:ANTHROPIC_MODEL"
Write-Host "  rapido:  $env:ANTHROPIC_SMALL_FAST_MODEL"
Start-Process -FilePath $desktop

Write-Host ""
Write-Host "Cuando levante, comprueba con:" -ForegroundColor Cyan
Write-Host '  & "$env:LOCALAPPDATA\Programs\jam\bin\jam.exe" preflight'
Write-Host "Y luego la prueba del PING (ver GROQ.md)."
