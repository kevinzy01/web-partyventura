const Newsletter = require('../models/Newsletter');
const transporter = require('../config/email');

// @desc    Suscribirse al newsletter
// @route   POST /api/newsletter
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
    }

    // Verificar si ya está suscrito
    const existingSub = await Newsletter.findOne({ email });
    
    if (existingSub) {
      if (existingSub.activo) {
        return res.status(400).json({
          success: false,
          message: 'Este email ya está suscrito a nuestro newsletter'
        });
      } else {
        // Reactivar suscripción
        existingSub.activo = true;
        existingSub.fechaBaja = null;
        await existingSub.save();

        return res.status(200).json({
          success: true,
          message: '¡Bienvenido de nuevo! Tu suscripción ha sido reactivada.'
        });
      }
    }

    // Crear nueva suscripción
    const subscription = await Newsletter.create({ email });

    // Enviar email de confirmación
    const mailOptions = {
      from: `"Partyventura" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 ¡Bienvenido al Newsletter de Partyventura!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0; font-size: 36px;">🎉 Partyventura</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 28px;">¡Bienvenido!</h2>
            <p style="margin: 0; font-size: 16px;">Gracias por suscribirte a nuestro newsletter</p>
          </div>

          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">📬 ¿Qué recibirás?</h3>
            <ul style="color: #555; line-height: 2;">
              <li>🎊 Promociones exclusivas</li>
              <li>🎂 Ofertas especiales de cumpleaños</li>
              <li>📅 Eventos y actividades nuevas</li>
              <li>🎁 Descuentos para suscriptores</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5500/web/index.html" style="display: inline-block; background-color: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🏀 Visitar Partyventura
            </a>
          </div>

          <div style="background-color: #fff8f0; padding: 15px; border-left: 4px solid #f97316; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              💡 <strong>Tip:</strong> ¡Síguenos en redes sociales para no perderte ninguna novedad!
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
            <p>📍 Carrer dels Dauradors, 12, Vinaròs</p>
            <p>Si no deseas recibir más emails, puedes <a href="#" style="color: #f97316;">darte de baja aquí</a></p>
            <p>© 2025 Partyventura. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: '¡Gracias por suscribirte! Revisa tu email para confirmar.',
      data: {
        email: subscription.email,
        fechaSuscripcion: subscription.fechaSuscripcion
      }
    });

  } catch (error) {
    console.error('Error al suscribirse:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la suscripción. Por favor inténtalo de nuevo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener todos los suscriptores (Admin)
// @route   GET /api/newsletter
// @access  Private
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ fechaSuscripcion: -1 });
    
    res.status(200).json({
      success: true,
      count: subscribers.length,
      activos: subscribers.filter(s => s.activo).length,
      data: subscribers
    });
  } catch (error) {
    console.error('Error al obtener suscriptores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los suscriptores'
    });
  }
};

// @desc    Dar de baja suscripción
// @route   DELETE /api/newsletter/:email
// @access  Public
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.params;

    const subscription = await Newsletter.findOne({ email });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email no encontrado en nuestra base de datos'
      });
    }

    subscription.activo = false;
    subscription.fechaBaja = new Date();
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Te has dado de baja correctamente. ¡Te echaremos de menos!'
    });
  } catch (error) {
    console.error('Error al dar de baja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la baja'
    });
  }
};

// @desc    Enviar email masivo a todos los suscriptores activos
// @route   POST /api/newsletter/send-bulk
// @access  Private (Admin)
exports.sendBulkEmail = async (req, res) => {
  try {
    const { asunto, mensaje } = req.body;

    // Obtener todos los suscriptores activos
    const subscribers = await Newsletter.find({ activo: true });

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay suscriptores activos en la base de datos'
      });
    }

    // Preparar lista de emails
    const emailList = subscribers.map(sub => sub.email);

    // Crear HTML del email con estilo corporativo
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f97316; margin: 0; font-size: 36px;">🎉 Partyventura</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0; font-size: 28px;">${asunto}</h2>
        </div>

        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
          <div style="color: #333; line-height: 1.8; white-space: pre-wrap;">${mensaje}</div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || process.env.NGROK_URL || 'http://localhost:5000'}" style="display: inline-block; background-color: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🏀 Visitar Partyventura
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
          <p>📍 Carrer dels Dauradors, 12, Vinaròs</p>
          <p>Si no deseas recibir más emails, puedes <a href="${process.env.FRONTEND_URL || process.env.NGROK_URL || 'http://localhost:5000'}/unsubscribe" style="color: #f97316;">darte de baja aquí</a></p>
          <p>© 2025 Partyventura. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    // Configurar opciones del email
    const mailOptions = {
      from: `"Partyventura Newsletter" <${process.env.EMAIL_USER}>`,
      bcc: emailList, // BCC para privacidad
      subject: asunto,
      html: emailHtml
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    // Log de auditoría
    console.log(`📧 Newsletter enviado a ${emailList.length} suscriptores`);
    console.log(`   Asunto: ${asunto}`);
    console.log(`   Enviado por: ${req.user.nombre} (${req.user.email})`);

    res.status(200).json({
      success: true,
      message: `Email enviado exitosamente a ${emailList.length} suscriptor${emailList.length !== 1 ? 'es' : ''}`,
      data: {
        recipients: emailList.length,
        asunto,
        enviadoPor: req.user.nombre
      }
    });

  } catch (error) {
    console.error('❌ Error al enviar newsletter masivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el newsletter. Por favor inténtalo de nuevo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cambiar estado de suscriptor (Admin)
// @route   PATCH /api/newsletter/:id/toggle
// @access  Private
exports.toggleSubscriberStatus = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Suscriptor no encontrado'
      });
    }

    // Toggle estado
    subscriber.activo = !subscriber.activo;
    
    if (!subscriber.activo) {
      subscriber.fechaBaja = new Date();
    } else {
      subscriber.fechaBaja = null;
    }

    await subscriber.save();

    console.log(`📧 Suscriptor ${subscriber.email} ${subscriber.activo ? 'activado' : 'desactivado'} por ${req.user.nombre}`);

    res.status(200).json({
      success: true,
      message: `Suscriptor ${subscriber.activo ? 'activado' : 'desactivado'} correctamente`,
      data: subscriber
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado de suscriptor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del suscriptor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Eliminar suscriptor permanentemente (Admin)
// @route   DELETE /api/newsletter/:id
// @access  Private
exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Suscriptor no encontrado'
      });
    }

    const email = subscriber.email;
    await subscriber.deleteOne();

    console.log(`🗑️ Suscriptor ${email} eliminado por ${req.user.nombre}`);

    res.status(200).json({
      success: true,
      message: 'Suscriptor eliminado correctamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar suscriptor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar suscriptor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
