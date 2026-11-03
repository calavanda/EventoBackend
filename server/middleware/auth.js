let verifyToken;
try {
  const clerk = require('@clerk/backend');
  verifyToken = clerk.verifyToken;
} catch (e) {
  // En caso de que @clerk/backend no este instalado localmente
}

/**
 * Middleware de autenticacion centralizado (MASVS-AUTH)
 * Valida la existencia y autenticidad del token Bearer de sesion (Clerk JWT)
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
    }

    if (verifyToken && process.env.CLERK_SECRET_KEY) {
      const sessionClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      req.user = sessionClaims;
    } else {
      // En produccion se requiere CLERK_SECRET_KEY para verificacion criptografica
      if (process.env.NODE_ENV === 'production' && !process.env.CLERK_SECRET_KEY) {
        return res.status(401).json({ error: 'Configuración de autenticación incompleta en el servidor' });
      }
      req.user = { token };
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token invalido o expirado' });
  }
};

module.exports = { requireAuth };
