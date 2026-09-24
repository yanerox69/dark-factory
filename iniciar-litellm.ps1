# Arranca el proxy LiteLLM que traduce Anthropic <-> Groq.
#
#   .\iniciar-litellm.ps1
#
# Dejalo corriendo en su propia ventana. Luego, en otra, .\iniciar-fabrica-groq.ps1
#
# Requisito: DARKFACTORY_GROQ_KEY definida a nivel de usuario. Para ponerla sin
# que quede en el historial:
#   $k = Read-Host "Clave"; [Environment]::SetEnvironmentVariable("DARKFACTORY_GROQ_KEY",$k,"User"); Remove-Variable k
#
# La clave se saca gratis y sin tarjeta en https://console.groq.com/keys

$ErrorActionPreference = 'Stop'

$key = [Environment]::GetEnvironmentVariable('DARKFACTORY_GROQ_KEY', 'User')
if (-not $key) {
    Write-Host "FALTA la clave de Groq. Define DARKFACTORY_GROQ_KEY y vuelve a intentarlo." -ForegroundColor Red
    Write-Host "  https://console.groq.com/keys"
    exit 1
}

# Clave local del proxy. No es un secreto que proteger frente a internet: el
# puerto solo escucha en 127.0.0.1. Sirve para que ningun otro proceso local
# use el proxy por accidente.
$master = 'sk-darkfactory-local'

$cfg = Join-Path $PSScriptRoot 'litellm\config.yaml'
if (-not (Test-Path $cfg)) {
    Write-Host "No encuentro $cfg" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker no esta disponible en el PATH." -ForegroundColor Red
    exit 1
}

# Docker Desktop tiene que estar levantado, no solo instalado.
try { docker info *> $null } catch { }
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker esta instalado pero el motor no responde. Abre Docker Desktop." -ForegroundColor Yellow
    exit 1
}

Write-Host "Arrancando LiteLLM en http://127.0.0.1:4000 ..." -ForegroundColor Green
Write-Host "  modelos: factory-main (gpt-oss-120b) | factory-fast (gpt-oss-20b) | factory-alt (llama-3.3-70b)"
Write-Host "  Ctrl+C para pararlo. Dejalo abierto mientras trabaje la fabrica."
Write-Host ""

# -p 127.0.0.1:4000:4000 publica el puerto SOLO en el loopback del host.
# Dentro del contenedor el proxy escucha en 0.0.0.0 (--host), porque un
# proceso que escucha en 127.0.0.1 dentro de un contenedor no es alcanzable
# desde fuera. Es la misma trampa del bind documentada en PLAN-BUILD.md.
docker run --rm `
    -p 127.0.0.1:4000:4000 `
    -e GROQ_API_KEY=$key `
    -e LITELLM_MASTER_KEY=$master `
    -v "${cfg}:/app/config.yaml:ro" `
    ghcr.io/berriai/litellm:main-latest `
    --config /app/config.yaml --host 0.0.0.0 --port 4000
