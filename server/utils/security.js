const SecurityAlert = require('../models/SecurityAlert');

/**
 * Filtra caracteres peligrosos pero permite acentos franceses.
 * Reemplaza < > " ' & con sus entidades HTML o simplemente los remueve/escapa
 * para prevenir XSS básico sin romper el texto legítimo.
 */
const xssSanitize = (str) => {
  if (typeof str !== 'string') return str;
  // Reemplaza los caracteres problemáticos por versiones "seguras" o simplemente los limpia
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/script/gi, '[bloqueado]'); // Prevenir palabras clave reactivamente
};

/**
 * Middleware para sanitizar contra inyección NoSQL (Mongoose/MongoDB)
 * y prevenir XSS de forma recursiva.
 */
const deepSanitize = (data) => {
  if (data instanceof Object) {
    for (const key in data) {
      if (key.startsWith('$') || key.includes('.')) {
        delete data[key];
      } else if (typeof data[key] === 'string') {
        data[key] = xssSanitize(data[key]);
      } else if (typeof data[key] === 'object') {
        deepSanitize(data[key]);
      }
    }
  }
  return data;
};

/**
 * Middleware de detección de inyección SQL, NoSQL y patrones maliciosos mejorado
 */
const securityMiddleware = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const method = req.method;
  const url = req.originalUrl;
  
  // Patrones de inyección SQL
  const sqlInjectionPatterns = [
    /(\-\-)|(\%23)|(?<!&)#(?!\d+;)/i,
    /UNION(\s|\+)+SELECT/i,
    /EXEC(\s|\+)+(S|X)P\W+/i,
    /DROP(\s|\+)TABLE/i,
    /UPDATE.*SET.*/i,
    /INSERT.*INTO.*/i,
    /DELETE.*FROM.*/i,
    /TRUNCATE(\s|\+)TABLE/i,
    /SLEEP\(\d+\)/i,
    /OR\s+1\s*=\s*1/i
  ];

  // Regex para detectar etiquetas HTML maliciosas (XSS)
  const xssPatterns = [
    /<script.*?>.*?<\/script>/gi,
    /<iframe.*?>.*?<\/iframe>/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /javascript:/gi
  ];

  // Patrones de inyección NoSQL (claves que empiezan con $)
  const noSqlPatterns = [
    /\"\$[a-z]+\"\s*:/i, // Detecta "$gt":, "$ne":, etc. en el JSON
    /\$[a-z]+\s*:/i      // Detecta $where, etc.
  ];

  const checkPayload = (payload) => {
    if (!payload || Object.keys(payload).length === 0) return null;
    const strPayload = JSON.stringify(payload);
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(strPayload)) return `SQL: ${pattern.toString()}`;
    }
    
    for (const pattern of xssPatterns) {
      if (pattern.test(strPayload)) return `XSS: ${pattern.toString()}`;
    }

    for (const pattern of noSqlPatterns) {
      if (pattern.test(strPayload)) return `NoSQL: ${pattern.toString()}`;
    }
    
    return null;
  };

  // 1. Detección de patrones maliciosos (Bloqueo activo)
  // Checamos ANTES de sanitizar para atrapar el intento original
  const suspiciousPatternBody = checkPayload(req.body);
  const suspiciousPatternQuery = checkPayload(req.query);
  const suspiciousPatternParams = checkPayload(req.params);
  
  const patternFound = suspiciousPatternBody || suspiciousPatternQuery || suspiciousPatternParams;

  if (patternFound) {
    console.warn(`⚠️ [ALERTA DE SEGURIDAD] Intento malicioso detectado desde IP: ${ip}`);
    console.warn(`Patrón: ${patternFound}`);
    
    try {
      const alert = new SecurityAlert({
        ip,
        metodo: method,
        url,
        tipoAtaque: 'Malicious Pattern Detected',
        detalles: {
          pattern: patternFound,
          body: req.body,
          query: req.query
        }
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

  // 2. Sanitización Profunda (XSS Escaping + NoSQL Cleanup)
  // Limpia cualquier cosa que haya pasado los patrones pero que aún deba ser saneada
  deepSanitize(req.body);
  deepSanitize(req.query);
  deepSanitize(req.params);

  next();
};

module.exports = { securityMiddleware };
