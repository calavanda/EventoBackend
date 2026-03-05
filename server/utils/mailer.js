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

    Aquí tienes tu código QR oficial para el acceso y registro en los stands de "Sabores de la Francofonía".
    Por favor, muéstralo en la entrada y en cada stand que visites.
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Eventos UTGZ" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || defaultSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: 'Inter', Helvetica, Arial, sans-serif; text-align: center; background-color: #f4f7fe; padding: 40px 0; margin: 0;">
          
          <div style="background-color: white; border: 1px solid #e0e5f2; display: inline-block; border-radius: 20px; width: 380px; max-width: 90%; box-shadow: 0px 18px 40px rgba(112, 144, 176, 0.12); position: relative; overflow: hidden; margin: 0 auto;">
            
            <!-- Encabezado Azul -->
            <div style="background-color: #4318FF; color: white; padding: 15px; font-weight: 800; letter-spacing: 1px; font-size: 14px; text-transform: uppercase;">
              IDENTIFICACIÓN OFICIAL
            </div>
            
            <!-- Contenedor Logos -->
            <div style="padding: 25px 20px 10px 20px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left">
                      <img src="https://ibb.co/rK0g5cHD" alt="Francophonie" style="height: 50px; width: auto; object-fit: contain;" />
                    </td>
                    <td align="right">
                      <img src="https://ibb.co/RkRnrQjh" alt="UTGZ" style="height: 50px; width: auto; object-fit: contain;" />
                    </td>
                  </tr>
                </table>
            </div>

            <!-- Datos Participante -->
            <div style="padding: 10px 20px;">
              <div style="font-size: 26px; font-weight: 900; color: #1B254B; margin: 0; text-transform: uppercase; line-height: 1.1;">
                ${participantName.replace(' ', '<br>')}
              </div>
              <div style="font-size: 16px; color: #707EAE; margin-top: 10px; font-weight: 500;">
                Gutiérrez Zamora
              </div>
            </div>

            <!-- Contenedor QR -->
            <div style="background-color: #F4F7FE; padding: 25px; border-radius: 20px; display: inline-block; margin: 25px 0;">
                <img src="${qrUrl}" alt="Código QR" style="width: 180px; height: 180px; display: block;" />
            </div>

            <!-- Footer con email -->
            <div style="margin-top: 5px; margin-bottom: 25px; font-size: 13px; color: #707EAE; border-top: 1px dashed #E0E5F2; padding-top: 15px; width: 80%; margin-left: auto; margin-right: auto; font-weight: 500;">
              ${to}
            </div>

          </div>
          
          <!-- Mensaje Personalizado Debajo del Gafete -->
          <div style="max-width: 400px; margin: 20px auto; color: #707EAE; font-size: 14px; line-height: 1.5; padding: 0 15px;">
             ${customMessage ? `<p>${customMessage.replace(/\n/g, '<br>')}</p>` : `<p>Presenta este código QR desde tu celular al ingresar al evento y al visitar los estands.</p>`}
          </div>

        </body>
        </html>
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
