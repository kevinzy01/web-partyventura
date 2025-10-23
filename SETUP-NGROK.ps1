# ═══════════════════════════════════════════════════════════════
# 🚀 COMANDOS RÁPIDOS PARA CONFIGURAR NGROK
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACION AUTOMATICA PARA NGROK" -ForegroundColor Cyan
Write-Host "   Partyventura - Acceso desde Movil" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# PASO 1: Iniciar Backend
# ================================================================
Write-Host "PASO 1: Iniciando Backend..." -ForegroundColor Yellow
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Iniciando Backend...' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3

Write-Host "Backend iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# ================================================================
# PASO 2: Iniciar Ngrok
# ================================================================
Write-Host "PASO 2: Iniciando Ngrok..." -ForegroundColor Yellow
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Iniciando Ngrok...' -ForegroundColor Green; ngrok http 5000"

Start-Sleep -Seconds 5

Write-Host "Ngrok iniciado en nueva ventana" -ForegroundColor Green
Write-Host ""

# ================================================================
# PASO 3: Solicitar URL de Ngrok
# ================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "PASO 3: Configurar URL de Ngrok" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mira la ventana de ngrok y busca la linea:" -ForegroundColor White
Write-Host ""
Write-Host "   Forwarding    https://xxxx-xxxx.ngrok-free.app -> http://localhost:5000" -ForegroundColor Gray
Write-Host "                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^" -ForegroundColor Yellow
Write-Host "                 COPIAR ESTA URL" -ForegroundColor Yellow
Write-Host ""

$ngrokUrl = Read-Host "Pega aqui tu URL de ngrok (ejemplo: https://a1b2.ngrok-free.app)"

# Limpiar URL (remover espacios y slash final)
$ngrokUrl = $ngrokUrl.Trim().TrimEnd('/')

if ($ngrokUrl -notmatch "^https://") {
    Write-Host ""
    Write-Host "ERROR: La URL debe comenzar con https://" -ForegroundColor Red
    Write-Host "   Ejemplo correcto: https://a1b2-1234.ngrok-free.app" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Actualizando configuracion..." -ForegroundColor Yellow

# ================================================================
# PASO 4: Actualizar config.js
# ================================================================

$configPath = Join-Path $PSScriptRoot "frontend\src\js\modules\config.js"

if (Test-Path $configPath) {
    # Leer archivo
    $content = Get-Content $configPath -Raw
    
    # Cambiar MODE a production
    $content = $content -replace "const MODE = 'development'", "const MODE = 'production'"
    
    # Actualizar URLs de production
    $content = $content -replace "api: 'TU_URL_DE_NGROK_AQUI/api'", "api: '$ngrokUrl/api'"
    $content = $content -replace "server: 'TU_URL_DE_NGROK_AQUI'", "server: '$ngrokUrl'"
    
    # También reemplazar URLs existentes si ya se configuraron antes
    $content = $content -replace "api: 'https://[^']+\.ngrok[^']+/api'", "api: '$ngrokUrl/api'"
    $content = $content -replace "server: 'https://[^']+\.ngrok[^']+'", "server: '$ngrokUrl'"
    
    # Guardar archivo
    $content | Set-Content $configPath -NoNewline
    
    Write-Host ""
    Write-Host "Configuracion actualizada correctamente:" -ForegroundColor Green
    Write-Host "   - Modo: PRODUCTION" -ForegroundColor White
    Write-Host "   - API: $ngrokUrl/api" -ForegroundColor White
    Write-Host "   - Server: $ngrokUrl" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: No se encontro el archivo config.js" -ForegroundColor Red
    Write-Host "   Ruta esperada: $configPath" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

# ================================================================
# PASO 5: Mostrar URLs de Acceso
# ================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "PASO 4: Acceder desde tu Movil" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuracion completa! Ahora puedes acceder desde tu movil:" -ForegroundColor Green
Write-Host ""
Write-Host "Panel de Admin:" -ForegroundColor White
Write-Host "   $ngrokUrl/admin.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pagina Home:" -ForegroundColor White
Write-Host "   $ngrokUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login:" -ForegroundColor White
Write-Host "   $ngrokUrl/login.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE - Si ves el banner 'Visit Site':" -ForegroundColor Yellow
Write-Host "   1. Hacer clic en 'Visit Site'" -ForegroundColor White
Write-Host "   2. Hacer clic en 'Continue' en la advertencia" -ForegroundColor White
Write-Host "   3. Listo! Ya puedes usar el panel" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIPS:" -ForegroundColor Yellow
Write-Host "   - Manten las ventanas de Backend y Ngrok abiertas" -ForegroundColor White
Write-Host "   - Cada vez que reinicies ngrok, ejecuta este script de nuevo" -ForegroundColor White
Write-Host "   - Para volver a localhost: .\switch-to-development.ps1" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Copiar URL al portapapeles
try {
    $ngrokUrl + "/admin.html" | Set-Clipboard
    Write-Host "URL copiada al portapapeles. Pegala en tu movil!" -ForegroundColor Green
} catch {
    Write-Host "No se pudo copiar al portapapeles (no disponible)" -ForegroundColor Yellow
}
Write-Host ""

pause
