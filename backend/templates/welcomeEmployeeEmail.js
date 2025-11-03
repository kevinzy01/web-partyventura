/**
 * Plantilla de Email de Bienvenida para Empleados
 * Incluye credenciales iniciales y link para cambiar contraseña
 */

// Función para escapar HTML y prevenir XSS
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const welcomeEmployeeEmail = (nombre, username, tempPassword, resetToken) => {
  // Escapar todos los inputs del usuario
  const nombreEscapado = escapeHtml(nombre);
  const usernameEscapado = escapeHtml(username);
  const tempPasswordEscapado = escapeHtml(tempPassword);
  
  // Determinar URL del frontend
  // En desarrollo: http://localhost:5000
  // En producción: URL de Ngrok o dominio
  const baseUrl = process.env.FRONTEND_URL || process.env.NGROK_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a Partyventura</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            
            <!-- Contenedor principal -->
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden;">
              
              <!-- Header con gradiente -->
              <tr>
                <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 30px; text-align: center;">
                  <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <span style="font-size: 40px;">🎉</span>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido a Partyventura!</h1>
                  <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0; font-size: 16px;">Tu cuenta de empleado ha sido creada</p>
                </td>
              </tr>
              
              <!-- Contenido -->
              <tr>
                <td style="padding: 40px 30px;">
                  
                  <!-- Saludo personalizado -->
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Hola <strong>${nombreEscapado}</strong>,
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    Tu cuenta de empleado en <strong>Partyventura</strong> ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso al portal de empleados:
                  </p>
                  
                  <!-- Credenciales -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 25px;">
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: 600; width: 140px;">👤 Usuario:</td>
                            <td style="color: #111827; font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace;">${usernameEscapado}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: 600; padding-top: 10px;">🔑 Contraseña:</td>
                            <td style="color: #f97316; font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace; padding-top: 10px;">${tempPasswordEscapado}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Aviso importante -->
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0;">
                      ⚠️ <strong>Importante:</strong> Esta es una contraseña temporal generada automáticamente. Por razones de seguridad, te recomendamos cambiarla lo antes posible.
                    </p>
                  </div>
                  
                  <!-- Botón principal -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); transition: all 0.3s;">
                          🔐 Cambiar mi Contraseña
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Link alternativo -->
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0 0;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </p>
                  <p style="color: #3b82f6; font-size: 13px; text-align: center; word-break: break-all; margin: 10px 0 30px; font-family: 'Courier New', monospace;">
                    ${resetUrl}
                  </p>
                  
                  <!-- Información adicional -->
                  <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #0c4a6e; margin: 0 0 15px; font-size: 16px;">📱 Portal de Empleados</h3>
                    <ul style="color: #0c4a6e; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Fichar entrada y salida</li>
                      <li>Ver tus horarios asignados</li>
                      <li>Consultar tus horas trabajadas</li>
                      <li>Revisar tu historial de registros</li>
                    </ul>
                  </div>
                  
                  <!-- Recordatorio de seguridad -->
                  <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong>🔒 Seguridad:</strong> Este enlace es de un solo uso y expirará en <strong>24 horas</strong>. Después de cambiar tu contraseña, podrás acceder al portal con tus nuevas credenciales.
                    </p>
                  </div>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">
                    <strong>Partyventura</strong> - Tu lugar de diversión
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Este es un email automático, por favor no respondas a este mensaje.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                    Si necesitas ayuda, contacta con tu supervisor.
                  </p>
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

module.exports = welcomeEmployeeEmail;
