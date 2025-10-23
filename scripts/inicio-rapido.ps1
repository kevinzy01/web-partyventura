# 🚀 Inicio Rápido - Partyventura con Ngrok

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🎉 PARTYVENTURA - Inicio Rápido con Ngrok      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un comando existe
function Test-Command {
    param($command)
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# Verificar Node.js
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Yellow
Write-Host ""

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "     Descarga desde: https://nodejs.org" -ForegroundColor Yellow
    exit
}

# Verificar npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ npm no encontrado" -ForegroundColor Red
    exit
}

# Verificar ngrok
if (Test-Command "ngrok") {
    Write-Host "  ✅ Ngrok instalado" -ForegroundColor Green
    $ngrokInstalled = $true
} else {
    Write-Host "  ⚠️  Ngrok no encontrado en PATH" -ForegroundColor Yellow
    Write-Host "     Descarga desde: https://ngrok.com/download" -ForegroundColor Cyan
    $ngrokInstalled = $false
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Preguntar qué hacer
Write-Host "¿Qué deseas hacer?" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Iniciar Backend" -ForegroundColor White
Write-Host "2️⃣  Iniciar Backend + Ngrok" -ForegroundColor White
Write-Host "3️⃣  Solo Ngrok (backend ya corriendo)" -ForegroundColor White
Write-Host "4️⃣  Mostrar información de Ngrok" -ForegroundColor White
Write-Host "5️⃣  Salir" -ForegroundColor White
Write-Host ""

$opcion = Read-Host "Selecciona una opción (1-5)"

switch ($opcion) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
        Write-Host ""
        cd "c:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
        npm run dev
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Iniciando Backend..." -ForegroundColor Green
        Write-Host ""
        
        # Iniciar backend en segundo plano
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\kevin\Documents\WEB PARTYVENTURA\backend'; npm run dev"
        
        Write-Host "⏳ Esperando 5 segundos para que el backend inicie..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        if ($ngrokInstalled) {
            Write-Host ""
            Write-Host "🌐 Iniciando Ngrok..." -ForegroundColor Green
            Write-Host ""
            ngrok http 5000
        } else {
            Write-Host ""
            Write-Host "⚠️  Ngrok no está instalado" -ForegroundColor Red
            Write-Host "   Instálalo desde: https://ngrok.com/download" -ForegroundColor Yellow
        }
    }
    
    "3" {
        if ($ngrokInstalled) {
            Write-Host ""
            Write-Host "🌐 Iniciando Ngrok..." -ForegroundColor Green
            Write-Host ""
            ngrok http 5000
        } else {
            Write-Host ""
            Write-Host "⚠️  Ngrok no está instalado" -ForegroundColor Red
            Write-Host "   Instálalo desde: https://ngrok.com/download" -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "📚 INFORMACIÓN DE NGROK" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔑 Obtener Token:" -ForegroundColor Yellow
        Write-Host "   1. Ve a: https://dashboard.ngrok.com/signup" -ForegroundColor White
        Write-Host "   2. Crea una cuenta gratuita" -ForegroundColor White
        Write-Host "   3. Copia tu token desde: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        Write-Host ""
        Write-Host "⚙️  Configurar Token (solo 1 vez):" -ForegroundColor Yellow
        Write-Host "   ngrok config add-authtoken TU_TOKEN_AQUI" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🚀 Iniciar Ngrok:" -ForegroundColor Yellow
        Write-Host "   ngrok http 5000" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🌐 URLs de Acceso:" -ForegroundColor Yellow
        Write-Host "   • Login: https://tu-url.ngrok-free.app/login.html" -ForegroundColor White
        Write-Host "   • Home:  https://tu-url.ngrok-free.app/index.html" -ForegroundColor White
        Write-Host "   • API:   https://tu-url.ngrok-free.app/api" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Consejo:" -ForegroundColor Yellow
        Write-Host "   El login.html detecta automáticamente si estás en Ngrok" -ForegroundColor White
        Write-Host "   No necesitas cambiar ninguna configuración!" -ForegroundColor White
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        
        Read-Host "Presiona Enter para continuar"
    }
    
    "5" {
        Write-Host ""
        Write-Host "👋 ¡Hasta luego!" -ForegroundColor Cyan
        Write-Host ""
        exit
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Opción no válida" -ForegroundColor Red
        Write-Host ""
    }
}
