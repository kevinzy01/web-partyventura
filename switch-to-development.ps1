# ═══════════════════════════════════════════════════════════════
# 🔄 VOLVER A MODO DEVELOPMENT (LOCALHOST)
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔄 CAMBIAR A MODO DEVELOPMENT                             ║" -ForegroundColor Cyan
Write-Host "║      Partyventura - Localhost                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$configPath = Join-Path $PSScriptRoot "frontend\src\js\modules\config.js"

if (Test-Path $configPath) {
    Write-Host "⏳ Cambiando a modo development..." -ForegroundColor Yellow
    
    # Leer archivo
    $content = Get-Content $configPath -Raw
    
    # Cambiar MODE a development
    $content = $content -replace "const MODE = 'production'", "const MODE = 'development'"
    
    # Guardar archivo
    $content | Set-Content $configPath -NoNewline
    
    Write-Host ""
    Write-Host "✅ Configuración actualizada:" -ForegroundColor Green
    Write-Host "   - Modo: DEVELOPMENT" -ForegroundColor White
    Write-Host "   - URL: http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Ahora puedes acceder localmente en tu PC:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   http://localhost:5000/admin.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ERROR: No se encontró el archivo config.js" -ForegroundColor Red
    Write-Host "   Ruta esperada: $configPath" -ForegroundColor Yellow
    Write-Host ""
}

pause
