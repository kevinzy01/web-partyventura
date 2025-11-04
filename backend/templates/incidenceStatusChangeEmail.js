// ===================================
// TEMPLATE EMAIL - CAMBIO DE ESTADO DE INCIDENCIA
// Partyventura
// ===================================

const incidenceStatusChangeEmail = (empleadoNombre, incidencia, nuevoEstado, respuestaAdmin) => {
  // Mapeo de estados a colores y etiquetas
  const estadoInfo = {
    'pendiente': { 
      color: '#f59e0b', 
      label: 'Pendiente',
      emoji: '⏳'
    },
    'en_revision': { 
      color: '#3b82f6', 
      label: 'En Revisión',
      emoji: '👀'
    },
    'aprobada': { 
      color: '#10b981', 
      label: 'Aprobada',
      emoji: '✅'
    },
    'rechazada': { 
      color: '#ef4444', 
      label: 'Rechazada',
      emoji: '❌'
    }
  };

  const tipoInfo = {
    'baja_medica': 'Baja Médica',
    'permiso': 'Permiso',
    'retraso': 'Retraso',
    'ausencia': 'Ausencia',
    'otro': 'Otro'
  };

  const estado = estadoInfo[nuevoEstado] || estadoInfo['pendiente'];
  const tipo = tipoInfo[incidencia.tipo] || incidencia.tipo;
  const fechaIncidencia = new Date(incidencia.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estado de Incidencia - Partyventura</title>
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
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
          color: #ffffff;
        }
        .incident-details {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }
        .detail-value {
          color: #111827;
          font-size: 14px;
          text-align: right;
        }
        .admin-response {
          background-color: #fff3e0;
          border-left: 4px solid #f97316;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .admin-response h3 {
          color: #f97316;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .admin-response p {
          color: #666666;
          font-size: 14px;
          line-height: 1.8;
        }
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 30px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          color: #666666;
          font-size: 14px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #6b7280;
          font-size: 14px;
          margin: 5px 0;
        }
        .footer a {
          color: #f97316;
          text-decoration: none;
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
          <p class="greeting">Hola ${empleadoNombre},</p>

          <p style="margin-bottom: 20px; color: #666666; font-size: 16px;">
            El estado de tu incidencia ha sido actualizado:
          </p>

          <div style="text-align: center;">
            <span class="status-badge" style="background-color: ${estado.color};">
              ${estado.emoji} ${estado.label}
            </span>
          </div>

          <!-- Detalles de la Incidencia -->
          <div class="incident-details">
            <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">
              📋 Detalles de la Incidencia
            </h3>
            
            <div class="detail-row">
              <span class="detail-label">Tipo:</span>
              <span class="detail-value">${tipo}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
              <span class="detail-value">${fechaIncidencia}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value" style="color: ${estado.color}; font-weight: 600;">
                ${estado.label}
              </span>
            </div>
            
            ${incidencia.descripcion ? `
            <div class="detail-row" style="display: block;">
              <span class="detail-label">Descripción:</span>
              <p style="margin-top: 8px; color: #111827; font-size: 14px; line-height: 1.6;">
                ${incidencia.descripcion}
              </p>
            </div>
            ` : ''}
          </div>

          <!-- Respuesta del Administrador -->
          ${respuestaAdmin ? `
          <div class="admin-response">
            <h3>💬 Respuesta del Administrador</h3>
            <p>${respuestaAdmin}</p>
          </div>
          ` : ''}

          <!-- Información Adicional -->
          <div class="info-box">
            <p>
              <strong>💡 Nota:</strong> Puedes ver el estado completo de tus incidencias 
              accediendo a tu portal de empleado.
            </p>
          </div>

          ${nuevoEstado === 'aprobada' ? `
          <p style="color: #10b981; font-size: 14px; margin-top: 20px;">
            ✅ <strong>Tu incidencia ha sido aprobada.</strong> Se han aplicado los cambios correspondientes.
          </p>
          ` : ''}

          ${nuevoEstado === 'rechazada' ? `
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            ❌ <strong>Tu incidencia ha sido rechazada.</strong> Si tienes dudas, contacta con tu supervisor.
          </p>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p style="font-weight: 600; color: #111827; margin-bottom: 10px;">Partyventura</p>
          <p>Parque de Atracciones y Diversión</p>
          <p style="margin-top: 15px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = incidenceStatusChangeEmail;
