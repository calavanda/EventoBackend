const SecurityAlert = require('../models/SecurityAlert');

/**
 * Middleware para sanitizar contra inyección NoSQL (Mongoose/MongoDB)
 * Elimina claves que comienzan con '$' o contienen '.' en req.body, req.query y req.params
 */
const noSqlSanitize = (data) => {
  if (data instanceof Object) {
    for (const key in data) {
      if (key.startsWith('$') || key.includes('.')) {
        delete data[key];
      } else {
        noSqlSanitize(data[key]);
      }
    }
  }
  return data;
};

/**
 * Middleware de detección de inyección SQL y patrones maliciosos
 */
const securityMiddleware = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const method = req.method;
  const url = req.originalUrl;
  
  // Patrones comunes de inyección SQL
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Comillas simples y comentarios
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Igualdad seguido de comentario/punto y coma
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // ' or '
    /((\%27)|(\'))union/i, // ' union
    /exec(\s|\+)+(s|x)p\w+/i, // exec sp_ (procedimientos almacenados)
    /SELECT\s.*\sFROM\s/i, // SELECT ... FROM
    /INSERT\s.*\sINTO\s/i, // INSERT ... INTO
    /DELETE\s.*\sFROM\s/i, // DELETE ... FROM
    /DROP\s+TABLE/i, // DROP TABLE
    /UPDATE\s.*\sSET\s/i, // UPDATE ... SET
  ];

  const checkPayload = (payload) => {
    const strPayload = JSON.stringify(payload);
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(strPayload)) {
        return pattern.toString();
      }
    }
    return null;
  };

  // Sanitización NoSQL reactiva
  noSqlSanitize(req.body);
  noSqlSanitize(req.query);
  noSqlSanitize(req.params);

  // Detección de patrones maliciosos
  const suspiciousPatternBody = checkPayload(req.body);
  const suspiciousPatternQuery = checkPayload(req.query);
  
  if (suspiciousPatternBody || suspiciousPatternQuery) {
    console.warn(`⚠️ [ALERTA DE SEGURIDAD] Intento de inyección detectado desde IP: ${ip}`);
    console.warn(`Pattern: ${suspiciousPatternBody || suspiciousPatternQuery}`);
    
    try {
      // Registrar la alerta en la base de datos
      const alert = new SecurityAlert({
        ip,
        metodo: method,
        url,
        tipoAtaque: suspiciousPatternBody ? 'SQL Injection (Body)' : 'SQL Injection (Query)',
        detalles: suspiciousPatternBody ? req.body : req.query
      });
      await alert.save();
    } catch (err) {
      console.error('Error al guardar alerta de seguridad:', err.message);
    }

    return res.status(403).json({
      error: 'Seguridad: Actividad maliciosa detectada y bloqueada.',
      incidentReported: true
    });
  }

  next();
};

module.exports = { securityMiddleware };
