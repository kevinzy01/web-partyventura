# ===================================
# SCRIPT DE INICIO - PARTYVENTURA
# Inicia MongoDB y el servidor backend
# ===================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "                                                " -ForegroundColor Cyan
Write-Host "   INICIANDO PARTYVENTURA                       " -ForegroundColor Cyan
Write-Host "                                                " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si MongoDB está instalado
Write-Host "Verificando MongoDB..." -ForegroundColor Yellow

# Buscar MongoDB en las ubicaciones comunes
$mongodPath = $null
$possiblePaths = @(
    "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $mongodPath = $path
        break
    }
}

if (-not $mongodPath) {
    # Intentar con el PATH
    $mongoExists = Get-Command mongod -ErrorAction SilentlyContinue
    if ($mongoExists) {
        $mongodPath = "mongod"
    } else {
        Write-Host "ERROR: MongoDB no esta instalado o no se encuentra" -ForegroundColor Red
        Write-Host "Por favor instala MongoDB desde: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
        pause
        exit
    }
}

Write-Host "OK: MongoDB encontrado en: $mongodPath" -ForegroundColor Green
Write-Host ""

# 2. Iniciar MongoDB en segundo plano
Write-Host "Iniciando MongoDB..." -ForegroundColor Yellow
Start-Process -FilePath $mongodPath -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "OK: MongoDB iniciado" -ForegroundColor Green
Write-Host ""

# 3. Verificar si las dependencias están instaladas
Write-Host "Verificando dependencias del backend..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "OK: Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "OK: Dependencias ya instaladas" -ForegroundColor Green
}
Write-Host ""

# 4. Verificar archivo .env
Write-Host "Verificando configuracion..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "ADVERTENCIA: Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "Copiando .env.example a .env..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "OK: Archivo .env creado" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Configura las credenciales de email en backend\.env" -ForegroundColor Yellow
} else {
    Write-Host "OK: Configuracion encontrada" -ForegroundColor Green
}
Write-Host ""

# 5. Iniciar el servidor backend
Write-Host "Iniciando servidor backend..." -ForegroundColor Yellow
Set-Location backend
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "                                                " -ForegroundColor Green
Write-Host "   BACKEND INICIADO                            " -ForegroundColor Green
Write-Host "                                                " -ForegroundColor Green
Write-Host "   API: http://localhost:5000                  " -ForegroundColor Green
Write-Host "   Frontend: web/index.html                    " -ForegroundColor Green
Write-Host "   Admin: web/admin.html                       " -ForegroundColor Green
Write-Host "                                                " -ForegroundColor Green
Write-Host "   Presiona Ctrl+C para detener                " -ForegroundColor Green
Write-Host "                                                " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

npm run dev
