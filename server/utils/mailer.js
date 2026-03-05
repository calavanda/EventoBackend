const nodemailer = require('nodemailer');

// Configuración del transportador SMTP (Gmail u otro)
const transporter = nodemailer.createTransport({
  service: 'gmail', // O usa host: 'smtp.gmail.com', port: 465, secure: true
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASS, // Tu Contraseña de Aplicación de Google (no la contraseña normal)
  },
});

const sendQREmail = async (to, participantName, qrUrl, subject, customMessage) => {
  // Si no hay correo configurado, simulamos el envío para no romper el sistema
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Mock Email] Simulando envío a ${to}. (Configura EMAIL_USER y EMAIL_PASS en .env para enviar de verdad)`);
    console.log(`QR URL: ${qrUrl}`);
    return { messageId: 'mocked_id' };
  }

  const defaultSubject = `Tu Identificación Oficial QR - Sabores de la Francofonía`;
  const defaultMessage = `
    Hola ${participantName},

    Aquí tienes tu código QR oficial para el acceso y registro en los estands de "Sabores de la Francofonía".
    Por favor, muéstralo en la entrada y en cada estand que visites.
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Eventos UTGZ" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || defaultSubject,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #4318FF;">Sabores de la Francofonía</h2>
          <p>${customMessage || defaultMessage}</p>
          <div style="margin: 30px 0;">
            <img src="${qrUrl}" alt="Código QR" style="width: 250px; height: 250px; border: 4px solid #f4f7fe; border-radius: 10px;" />
          </div>
          <p style="font-size: 12px; color: #888;">Este es un correo automático. Por favor, no respondas a este mensaje.</p>
        </div>
      `,
    });
    
    console.log(`Correo enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error enviando email vía Nodemailer a ${to}:`, error);
    throw error;
  }
};

module.exports = sendQREmail;
