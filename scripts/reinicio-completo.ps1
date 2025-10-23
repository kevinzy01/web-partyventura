# 🔧 Reinicio Completo - Partyventura

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      🔧 REINICIO COMPLETO - PARTYVENTURA         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Función para matar procesos en un puerto
function Kill-ProcessOnPort {
    param($port)
    
    $connections = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
    
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            
            if ($pid -and $pid -match '^\d+$') {
                Write-Host "  🔪 Matando proceso en puerto $port (PID: $pid)" -ForegroundColor Yellow
                try {
                    Stop-Process -Id $pid -Force -ErrorAction Stop
                    Write-Host "  ✅ Proceso terminado" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠️  No se pudo terminar el proceso" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ℹ️  No hay procesos en puerto $port" -ForegroundColor Gray
    }
}

Write-Host "1️⃣  Limpiando procesos en puertos..." -ForegroundColor Yellow
Write-Host ""

# Matar procesos en puerto 5000 (backend)
Kill-ProcessOnPort 5000

Write-Host ""
Write-Host "2️⃣  ¿Deseas reiniciar el backend?" -ForegroundColor Yellow
$reiniciar = Read-Host "  (S/N)"

if ($reiniciar -eq "S" -or $reiniciar -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando backend con configuración actualizada..." -ForegroundColor Green
    Write-Host ""
    Write-Host "  ✅ CSP: Scripts inline permitidos" -ForegroundColor Green
    Write-Host "  ✅ CORS: Ngrok permitido" -ForegroundColor Green
    Write-Host "  ✅ Rate Limiting: Aumentado" -ForegroundColor Green
    Write-Host "  ✅ Trust Proxy: Habilitado" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Abriendo terminal del backend..." -ForegroundColor Cyan
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    cd "c:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
    npm run dev
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 NOTAS IMPORTANTES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ✅ El login ahora permite scripts inline" -ForegroundColor White
Write-Host "  ✅ Frontend/src/login.html redirige a public/login.html" -ForegroundColor White
Write-Host "  ✅ Detección automática de entorno (local/ngrok)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Yellow
Write-Host "  • Local:  http://localhost:5500/public/login.html" -ForegroundColor White
Write-Host "  • Ngrok:  https://tu-url.ngrok-free.app/login.html" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para verificar que funciona:" -ForegroundColor Yellow
Write-Host "  1. Abre el login en el navegador" -ForegroundColor White
Write-Host "  2. Abre la consola (F12)" -ForegroundColor White
Write-Host "  3. NO debe haber errores de CSP" -ForegroundColor White
Write-Host "  4. Debe mostrar: '🔧 Configuración de Login'" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
