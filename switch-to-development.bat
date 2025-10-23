@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║   🔄 VOLVER A MODO DESARROLLO (LOCALHOST)                   ║
echo ║      Partyventura - Panel de Administración                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ⏳ Cambiando a modo development...

REM Actualizar config.js de vuelta a development
powershell -Command "(Get-Content '%~dp0frontend\src\js\modules\config.js') -replace \"const MODE = 'production'\", \"const MODE = 'development'\" | Set-Content '%~dp0frontend\src\js\modules\config.js'"

echo.
echo ✅ Configuración actualizada:
echo    - Modo cambiado a: DEVELOPMENT
echo    - URL: http://localhost:5000
echo.
echo 📝 Ahora puedes acceder en tu PC:
echo    http://localhost:5000/admin.html
echo.
pause
