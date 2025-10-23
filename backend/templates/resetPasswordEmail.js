// ===================================
// TEMPLATE EMAIL - RESET PASSWORD
// Partyventura
// ===================================

const resetPasswordEmail = (resetUrl, nombre) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar Contraseña - Partyventura</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 28px;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .logo {
          width: 80px;
          height: 80px;
          background-color: #ffffff;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #666666;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .reset-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
          transition: all 0.3s ease;
        }
        .reset-button:hover {
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.5);
          transform: translateY(-2px);
        }
        .info-box {
          background-color: #fff3e0;
          border-left: 4px solid #f97316;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          color: #666666;
          font-size: 14px;
        }
        .warning-box {
          background-color: #fff5f5;
          border-left: 4px solid #dc2626;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .warning-box p {
          margin: 0;
          color: #666666;
          font-size: 14px;
        }
        .alternative-link {
          margin-top: 30px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          word-break: break-all;
        }
        .alternative-link p {
          font-size: 13px;
          color: #666666;
          margin-bottom: 10px;
        }
        .alternative-link a {
          color: #f97316;
          word-break: break-all;
          font-size: 13px;
        }
        .footer {
          background-color: #1f2937;
          color: #9ca3af;
          padding: 30px;
          text-align: center;
          font-size: 14px;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #f97316;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .reset-button {
            padding: 14px 30px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🎉</div>
          <h1>Partyventura</h1>
        </div>

        <!-- Content -->
        <div class="content">
          <p class="greeting">Hola <strong>${nombre}</strong>,</p>

          <p class="message">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en el panel de administración de Partyventura.
          </p>

          <div class="info-box">
            <p><strong>⏱️ Este enlace expira en 1 hora</strong></p>
            <p>Por motivos de seguridad, el enlace de recuperación solo estará activo durante 60 minutos desde que recibiste este correo.</p>
          </div>

          <p class="message">
            Para crear una nueva contraseña, haz clic en el siguiente botón:
          </p>

          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">
              🔒 Restablecer Contraseña
            </a>
          </div>

          <div class="alternative-link">
            <p><strong>¿El botón no funciona?</strong></p>
            <p>Copia y pega este enlace en tu navegador:</p>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>

          <div class="divider"></div>

          <div class="warning-box">
            <p><strong>⚠️ Importante:</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, ignora este correo. Tu contraseña no será modificada y tu cuenta permanecerá segura.</p>
          </div>

          <p class="message" style="font-size: 14px; color: #999999; margin-top: 30px;">
            Si tienes problemas o preguntas, contacta con el administrador del sistema.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Partyventura</strong></p>
          <p>Sistema de Administración</p>
          <p style="margin-top: 15px; font-size: 12px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} Partyventura. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = resetPasswordEmail;
