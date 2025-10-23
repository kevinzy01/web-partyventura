@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║   🚀 CONFIGURACIÓN PARA ACCESO MÓVIL CON NGROK              ║
echo ║      Partyventura - Panel de Administración                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📋 PASO 1: INICIAR EL BACKEND
echo ════════════════════════════════════════════════════════════════
echo.
echo Presiona ENTER para iniciar el servidor backend...
pause >nul

echo.
echo ⏳ Iniciando backend en el puerto 5000...
echo.
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 >nul

echo.
echo ✅ Backend iniciado en una nueva ventana
echo.
echo ════════════════════════════════════════════════════════════════
echo 📋 PASO 2: INICIAR NGROK
echo ════════════════════════════════════════════════════════════════
echo.
echo ⚠️  IMPORTANTE: Copia la URL de ngrok que aparecerá
echo     Ejemplo: https://a1b2-c3d4-e5f6.ngrok-free.app
echo.
echo Presiona ENTER para iniciar ngrok...
pause >nul

echo.
echo ⏳ Iniciando ngrok...
echo.
start "Ngrok Tunnel" cmd /k "ngrok http 5000"
timeout /t 5 >nul

echo.
echo ════════════════════════════════════════════════════════════════
echo 📋 PASO 3: CONFIGURAR LA URL DE NGROK
echo ════════════════════════════════════════════════════════════════
echo.
echo 👀 Mira la ventana de ngrok y COPIA la URL que aparece
echo    Busca la línea "Forwarding" que dice:
echo    https://xxxx-xxxx-xxxx.ngrok-free.app -^> http://localhost:5000
echo.
echo.
set /p NGROK_URL="📝 Pega aquí tu URL de ngrok (ejemplo: https://a1b2.ngrok-free.app): "

echo.
echo ⏳ Configurando URL de ngrok...

REM Actualizar config.js con la URL de ngrok
powershell -Command "(Get-Content '%~dp0frontend\src\js\modules\config.js') -replace \"const MODE = 'development'\", \"const MODE = 'production'\" | Set-Content '%~dp0frontend\src\js\modules\config.js'"
powershell -Command "(Get-Content '%~dp0frontend\src\js\modules\config.js') -replace 'TU_URL_DE_NGROK_AQUI', '%NGROK_URL%' | Set-Content '%~dp0frontend\src\js\modules\config.js'"

echo.
echo ✅ Configuración actualizada:
echo    - Modo cambiado a: PRODUCTION
echo    - URL de ngrok: %NGROK_URL%
echo.
echo ════════════════════════════════════════════════════════════════
echo 📋 PASO 4: ACCEDER DESDE TU MÓVIL
echo ════════════════════════════════════════════════════════════════
echo.
echo 📱 Abre el navegador en tu móvil y ve a:
echo.
echo    %NGROK_URL%/admin.html
echo.
echo ⚠️  Si ves un banner "Visit Site":
echo    1. Haz clic en "Visit Site"
echo    2. Haz clic en "Continue" en la advertencia
echo    3. ¡Listo! Ya puedes usar el panel
echo.
echo ════════════════════════════════════════════════════════════════
echo 🎉 ¡CONFIGURACIÓN COMPLETA!
echo ════════════════════════════════════════════════════════════════
echo.
echo 💡 URLs útiles:
echo    📊 Panel Admin:  %NGROK_URL%/admin.html
echo    🏠 Página Home:  %NGROK_URL%
echo    🔐 Login:        %NGROK_URL%/login.html
echo.
echo 📝 Para volver a localhost, ejecuta:
echo    switch-to-development.bat
echo.
echo ⚠️  Recuerda: Cada vez que reinicies ngrok, la URL cambiará
echo              y tendrás que ejecutar este script de nuevo.
echo.
pause
