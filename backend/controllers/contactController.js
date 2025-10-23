const Contact = require('../models/Contact');
const transporter = require('../config/email');

// @desc    Enviar mensaje de contacto
// @route   POST /api/contact
// @access  Public
exports.sendContactMessage = async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    // Validar campos
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos'
      });
    }

    // Guardar en base de datos
    const contact = await Contact.create({
      nombre,
      email,
      mensaje
    });

    // Enviar email al administrador
    const mailOptionsAdmin = {
      from: `"Partyventura Web" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📧 Nuevo mensaje de contacto - ${nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            🎉 Nuevo Mensaje de Contacto
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>👤 Nombre:</strong> ${nombre}</p>
            <p style="margin: 10px 0;"><strong>📧 Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 10px 0;"><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <div style="background-color: #fff8f0; padding: 20px; border-left: 4px solid #f97316; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">💬 Mensaje:</h3>
            <p style="color: #555; line-height: 1.6;">${mensaje}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Este mensaje fue enviado desde el formulario de contacto de Partyventura
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptionsAdmin);

    // Enviar email de confirmación al usuario
    const mailOptionsUser = {
      from: `"Partyventura" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Hemos recibido tu mensaje - Partyventura',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #f97316; margin: 0;">🎉 Partyventura</h1>
          </div>
          <h2 style="color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            ¡Gracias por contactarnos, ${nombre}!
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #555; line-height: 1.6;">
              Hemos recibido tu mensaje y nuestro equipo lo revisará pronto. 
              Normalmente respondemos en menos de <strong>24 horas</strong>.
            </p>
          </div>
          <div style="background-color: #fff8f0; padding: 20px; border-left: 4px solid #f97316; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">📝 Tu mensaje:</h3>
            <p style="color: #666; line-height: 1.6; font-style: italic;">"${mensaje}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #555; margin-bottom: 15px;">Mientras tanto, ¡ven a visitarnos!</p>
            <a href="http://localhost:5500/web/index.html" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🏀 Visitar Partyventura
            </a>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
            <p>📍 Carrer dels Dauradors, 12, Vinaròs</p>
            <p>📞 +34 653 82 06 34 / +34 625 36 53 05</p>
            <p>© 2025 Partyventura. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptionsUser);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente. Te responderemos pronto.',
      data: {
        id: contact._id,
        nombre: contact.nombre,
        fechaEnvio: contact.fechaEnvio
      }
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje. Por favor inténtalo de nuevo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Obtener todos los mensajes de contacto (Admin)
// @route   GET /api/contact
// @access  Private
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ fechaEnvio: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los mensajes'
    });
  }
};

// @desc    Marcar mensaje como leído
// @route   PATCH /api/contact/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { leido: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el mensaje'
    });
  }
};

// @desc    Obtener un mensaje por ID
// @route   GET /api/contact/:id
// @access  Private
exports.getMessageById = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error al obtener mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el mensaje'
    });
  }
};

// @desc    Actualizar estado de mensaje (leído/respondido)
// @route   PUT /api/contact/:id
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const { leido, respondido } = req.body;
    
    const updateData = {};
    if (typeof leido !== 'undefined') updateData.leido = leido;
    if (typeof respondido !== 'undefined') updateData.respondido = respondido;
    
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensaje actualizado correctamente',
      data: message
    });
  } catch (error) {
    console.error('Error al actualizar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el mensaje'
    });
  }
};

// @desc    Eliminar mensaje
// @route   DELETE /api/contact/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensaje eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el mensaje'
    });
  }
};
