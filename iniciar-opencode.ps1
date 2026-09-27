# Levanta el servidor de OpenCode que da servicio a los asientos de Featherless.
#
#   .\iniciar-opencode.ps1
#
# Dejalo corriendo en su ventana. Luego, en otra por cada asiento:
#   python opencode-seat.py <nombre-del-asiento>
#
# Requisito: FEATHERLESS_API_KEY a nivel de usuario. Se deriva de
# DARKFACTORY_FEATHERLESS_KEY si hace falta.

$ErrorActionPreference = 'Stop'

# El shim que instala npm es un stub de 479 bytes que no arranca en Windows.
# El binario real vive en el paquete de plataforma.
$exe = Join-Path $env:APPDATA 'npm\node_modules\opencode-ai\node_modules\opencode-windows-x64\bin\opencode.exe'
if (-not (Test-Path $exe)) {
    Write-Host "No encuentro el binario de opencode en:" -ForegroundColor Red
    Write-Host "  $exe"
    Write-Host "Reinstala con: npm install -g opencode-ai"
    exit 1
}

$key = [Environment]::GetEnvironmentVariable('FEATHERLESS_API_KEY', 'User')
if (-not $key) {
    $key = [Environment]::GetEnvironmentVariable('DARKFACTORY_FEATHERLESS_KEY', 'User')
    if ($key) { [Environment]::SetEnvironmentVariable('FEATHERLESS_API_KEY', $key, 'User') }
}
if (-not $key) {
    Write-Host "FALTA la clave de Featherless." -ForegroundColor Red
    Write-Host "  Codigo promocional WEAREDEVS26 en featherless.ai"
    exit 1
}
$env:FEATHERLESS_API_KEY = $key
Remove-Variable key

$cfg = Join-Path $env:USERPROFILE '.config\opencode\opencode.json'
if (-not (Test-Path $cfg)) {
    Write-Host "Falta la configuracion del proveedor en $cfg" -ForegroundColor Red
    exit 1
}

Write-Host "Arrancando OpenCode en http://127.0.0.1:4096 ..." -ForegroundColor Green
Write-Host "  proveedor: featherless"
Write-Host "  config:    $cfg"
Write-Host ""
# Solo loopback, a proposito: sin OPENCODE_SERVER_PASSWORD el servidor no tiene
# autenticacion, y cualquiera que lo alcance puede escribir ficheros y ejecutar
# comandos. La guia lo dice tal cual.
Write-Host "Sin autenticacion. Escucha solo en 127.0.0.1 — no lo expongas." -ForegroundColor Yellow
Write-Host "Ctrl+C para pararlo." -ForegroundColor Cyan
Write-Host ""

& $exe serve --hostname=127.0.0.1 --port=4096
