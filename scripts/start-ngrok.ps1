# 🚀 Script de Inicio - Partyventura con Ngrok
# Este script te ayuda a iniciar todo rápidamente

Write-Host "🎉 PARTYVENTURA - Configuración de Ngrok" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si existe ngrok
$ngrokPath = "ngrok"
if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Write-Host "✅ Ngrok encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Ngrok no encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Descarga ngrok desde: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "2. Extrae ngrok.exe en C:\ngrok\" -ForegroundColor Yellow
    Write-Host "3. Añade C:\ngrok\ al PATH del sistema" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O usa chocolatey (como administrador):" -ForegroundColor Yellow
    Write-Host "   choco install ngrok -y" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Primero, obtén tu token de Ngrok:" -ForegroundColor White
Write-Host "   🔗 https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  Configura el token (solo una vez):" -ForegroundColor White
Write-Host "   ngrok config add-authtoken TU_TOKEN_AQUI" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Inicia el backend en una terminal:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Inicia ngrok en OTRA terminal:" -ForegroundColor White
Write-Host "   ngrok http 5000" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Copia la URL de Ngrok (ej: https://xxxx.ngrok-free.app)" -ForegroundColor White
Write-Host ""
Write-Host "6️⃣  Actualiza el archivo:" -ForegroundColor White
Write-Host "   frontend/src/js/modules/config.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Cambia:" -ForegroundColor White
Write-Host "   const MODE = 'development'; // a 'production'" -ForegroundColor Gray
Write-Host ""
Write-Host "   Y actualiza:" -ForegroundColor White
Write-Host "   api: 'TU_URL_DE_NGROK/api'," -ForegroundColor Gray
Write-Host "   server: 'TU_URL_DE_NGROK'" -ForegroundColor Gray
Write-Host ""
Write-Host "7️⃣  Abre index.html en tu navegador" -ForegroundColor White
Write-Host ""
Write-Host "8️⃣  Comparte la URL con otras personas! 🎉" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere iniciar el backend
$response = Read-Host "¿Quieres iniciar el servidor backend ahora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando backend..." -ForegroundColor Green
    cd "c:\Users\kevin\Documents\WEB PARTYVENTURA\backend"
    npm run dev
}
