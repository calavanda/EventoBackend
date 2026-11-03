const express = require('express');
const router = express.Router();
const Participante = require('../models/Participant');
const Stand = require('../models/Stand');
const Visita = require('../models/Visit');
const Encuesta = require('../models/Survey');
const Admin = require('../models/Admin');
const SecurityAlert = require('../models/SecurityAlert');
const EventSurvey = require('../models/EventSurvey');
const { requireAuth } = require('../middleware/auth');

// --- RUTAS PROTEGIDAS CON AUTENTICACIÓN CENTRALIZADA (MASVS-AUTH / VULN-03) ---
router.use('/admins', requireAuth);
router.use('/security', requireAuth);

// --- ADMINISTRADORES (RBAC) ---
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/admins', async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.put('/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(admin);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.delete('/admins/:id', async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Admin eliminado' });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/admins/check-auth', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    
    const admin = await Admin.findOne({ email: email.toLowerCase(), activo: true });
    if (!admin) {
      return res.status(403).json({ authorized: false, message: 'Usuario no autorizado para acceder al panel' });
    }
    
    res.json({ authorized: true, role: admin.rol, name: admin.nombre });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- PARTICIPANTES ---
router.get('/participants', async (req, res) => {
  try {
    const participantes = await Participante.find().sort({ fechaRegistro: -1 });
    res.json(participantes);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/participants', async (req, res) => {
  try {
    const participante = new Participante(req.body);
    await participante.save();
    if (!participante.codigoQR || participante.codigoQR.includes('undefined')) {
      participante.codigoQR = `EVT-${participante._id}`;
      await participante.save();
    }
    res.status(201).json(participante);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.put('/participants/:id', async (req, res) => {
  try {
    const participante = await Participante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!participante) return res.status(404).json({ error: 'Participante no encontrado' });
    res.json(participante);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.delete('/participants/:id', async (req, res) => {
  try {
    await Participante.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Participante eliminado correctamente' });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/participants/bulk', async (req, res) => {
  try {
    const participantes = req.body;
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de participantes válido.' });
    }

    // Asignar códigos QR a los que no tienen
    const participantesConQR = participantes.map(p => {
      const pDoc = new Participante(p);
      if (!pDoc.codigoQR || pDoc.codigoQR.includes('undefined')) {
         pDoc.codigoQR = `EVT-${pDoc._id}`;
      }
      return pDoc;
    });

    const result = await Participante.insertMany(participantesConQR);
    res.status(201).json({ mensaje: `${result.length} participantes importados correctamente.`, count: result.length });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- CORREOS ELECTRÓNICOS (Nodemailer/Gmail) ---
const sendQREmail = require('../utils/mailer');

router.post('/email/send-qr', async (req, res) => {
  try {
    const { recipients, subject, customMessage } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de destinatarios válida.' });
    }

    // Usar nodemailer para cada destinatario
    const results = [];
    for (const recipient of recipients) {
      const { email, nombre, codigoQR } = recipient;
      
      if (!email || !codigoQR) continue;
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(codigoQR)}&size=300x300&color=4318FF`;
      
      try {
        const response = await sendQREmail(email, nombre, qrUrl, subject, customMessage);
        results.push({ email, success: true, response });
      } catch (err) {
        console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
        results.push({ email, success: false, error: 'Error al enviar correo' });
      }
    }

    const successes = results.filter(r => r.success).length;
    res.status(200).json({ 
      mensaje: `Se enviaron ${successes} correos de ${recipients.length} solicitados.`,
      resultados: results 
    });

  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- STANDS ---
router.get('/stands', async (req, res) => {
  try {
    const stands = await Stand.find().sort({ creadoEn: -1 });
    res.json(stands);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/stands', async (req, res) => {
  try {
    const stand = new Stand(req.body);
    await stand.save();
    res.status(201).json(stand);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.put('/stands/:id', async (req, res) => {
  try {
    const stand = await Stand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stand) return res.status(404).json({ error: 'Stand no encontrado' });
    res.json(stand);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.delete('/stands/:id', async (req, res) => {
  try {
    await Stand.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Stand eliminado correctamente' });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- VISITAS (Escáner QR) ---
router.post('/visits/scan', async (req, res) => {
  try {
    const { codigoQR, standId } = req.body;

    if (!codigoQR || !standId) {
      return res.status(400).json({ error: 'Falta el código QR o el ID del stand' });
    }

    const participante = await Participante.findOne({ codigoQR });
    if (!participante) {
      return res.status(404).json({ message: 'Participante no encontrado con este código QR' });
    }

    const conteoVisitas = await Visita.countDocuments({ participante: participante._id });

    const visita = new Visita({
      participante: participante._id,
      stand: standId
    });
    await visita.save();

    res.status(201).json({
      message: `Visita registrada para ${participante.nombre} ${participante.apellidoPaterno}`,
      participant: {
        nombre: participante.nombre,
        apellidoPaterno: participante.apellidoPaterno,
        conteoVisitas: conteoVisitas + 1
      },
      visita
    });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- ENCUESTAS ---
router.get('/surveys', async (req, res) => {
  try {
    const encuestas = await Encuesta.find()
      .populate('stand')
      .sort({ creadoEn: -1 });
    res.json(encuestas);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/surveys', async (req, res) => {
  try {
    const encuesta = new Encuesta(req.body);
    await encuesta.save();
    res.status(201).json(encuesta);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- ENCUESTAS DEL EVENTO ---
router.get('/event-surveys', async (req, res) => {
  try {
    const encuestas = await EventSurvey.find().sort({ creadoEn: -1 });
    res.json(encuestas);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.post('/event-surveys', async (req, res) => {
  try {
    const encuesta = new EventSurvey(req.body);
    await encuesta.save();
    res.status(201).json(encuesta);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- REPORTES / ESTADÍSTICAS ---
router.get('/reports/stats', async (req, res) => {
  try {
    const totalParticipants = await Participante.countDocuments();
    const totalVisits = await Visita.countDocuments();
    const totalStands = await Stand.countDocuments();
    const surveysCount = await Encuesta.countDocuments();

    const resultado = await Encuesta.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: { $avg: ['$p1', '$p2', '$p3', '$p4', '$p5'] } }
        }
      }
    ]);
    const avgSatisfaction = resultado.length > 0 ? resultado[0].avgRating.toFixed(1) : '0.0';

    res.json({
      totalParticipants,
      totalVisits,
      totalStands,
      surveysCount,
      avgSatisfaction
    });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.get('/reports/event-stats', async (req, res) => {
  try {
    const totalEncuestas = await EventSurvey.countDocuments();
    const resultado = await EventSurvey.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    const avgRating = resultado.length > 0 ? resultado[0].avgRating.toFixed(1) : '0.0';

    res.json({
      totalEncuestas,
      avgRating
    });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.get('/reports/stand-visits', async (req, res) => {
  try {
    const visitasPorStand = await Visita.aggregate([
      { $group: { _id: '$stand', count: { $sum: 1 } } },
      { $lookup: { from: 'stands', localField: '_id', foreignField: '_id', as: 'detalles' } },
      { $unwind: { path: '$detalles', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$detalles.nombre', 'Desconocido'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]);
    res.json(visitasPorStand);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- ANALÍTICAS (Gráficas de los stands) ---
router.get('/reports/stand-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.escaneadoEn = {};
      if (startDate) {
        matchStage.escaneadoEn.$gte = new Date(`${startDate}T00:00:00-06:00`);
      }
      if (endDate) {
        matchStage.escaneadoEn.$lte = new Date(`${endDate}T23:59:59.999-06:00`);
      }
    }

    const visitStats = await Visita.aggregate([
      { $match: matchStage },
      { $group: { _id: '$stand', count: { $sum: 1 } } },
      { $lookup: { from: 'stands', localField: '_id', foreignField: '_id', as: 'stand' } },
      { $unwind: { path: '$stand', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$stand.nombre', 'Desconocido'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]);

    const surveyStats = await Encuesta.aggregate([
      { $group: { _id: '$stand', avgRating: { $avg: { $avg: ['$p1', '$p2', '$p3', '$p4', '$p5'] } } } },
      { $lookup: { from: 'stands', localField: '_id', foreignField: '_id', as: 'stand' } },
      { $unwind: { path: '$stand', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$stand.nombre', 'Desconocido'] }, avgRating: { $round: ['$avgRating', 1] } } },
      { $sort: { avgRating: -1 } }
    ]);

    // Gráfica de picos de visitas con granularidad de 15 minutos para permitir zoom detallado
    const peakVisits = await Visita.aggregate([
      { $match: { ...matchStage, escaneadoEn: { ...(matchStage.escaneadoEn || {}), $exists: true, $ne: null } } },
      {
        $project: {
          timestamp: {
            $dateFromParts: {
              year: { $year: { date: "$escaneadoEn", timezone: "-06:00" } },
              month: { $month: { date: "$escaneadoEn", timezone: "-06:00" } },
              day: { $dayOfMonth: { date: "$escaneadoEn", timezone: "-06:00" } },
              hour: { $hour: { date: "$escaneadoEn", timezone: "-06:00" } },
              minute: { 
                $subtract: [
                  { $minute: { date: "$escaneadoEn", timezone: "-06:00" } },
                  { $mod: [{ $minute: { date: "$escaneadoEn", timezone: "-06:00" } }, 15] }
                ] 
              },
              timezone: "-06:00"
            }
          },
          stand: 1
        }
      },
      {
        $group: {
          _id: { timestamp: "$timestamp", stand: "$stand" },
          count: { $sum: 1 }
        }
      },
      { $lookup: { from: 'stands', localField: '_id.stand', foreignField: '_id', as: 'standInfo' } },
      { $unwind: { path: '$standInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          timestamp: "$_id.timestamp",
          standName: { $ifNull: ["$standInfo.nombre", "Desconocido"] },
          count: 1
        }
      },
      { $sort: { timestamp: 1 } }
    ]);

    res.json({ visitStats, surveyStats, peakVisits });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- ANALÍTICAS AVANZADAS ---

// Cuántos visitantes únicos visitaron un stand (gráfica de visitantes vs visitas totales)
router.get('/reports/visitor-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.escaneadoEn = {};
      if (startDate) {
        matchStage.escaneadoEn.$gte = new Date(`${startDate}T00:00:00-06:00`);
      }
      if (endDate) {
        matchStage.escaneadoEn.$lte = new Date(`${endDate}T23:59:59.999-06:00`);
      }
    }

    const stats = await Visita.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$stand',
          totalVisits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$participante' }
        }
      },
      {
        $project: {
          stand: '$_id',
          totalVisits: 1,
          uniqueVisitorsCount: { $size: '$uniqueVisitors' }
        }
      },
      { $lookup: { from: 'stands', localField: 'stand', foreignField: '_id', as: 'detalles' } },
      { $unwind: { path: '$detalles', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$detalles.nombre', 'Desconocido'] }, totalVisits: 1, uniqueVisitorsCount: 1 } },
      { $sort: { totalVisits: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// Historial de visitas de un participante específico
router.get('/reports/participant-history/:id', async (req, res) => {
  try {
    const history = await Visita.find({ participante: req.params.id })
      .populate('stand', 'nombre')
      .sort({ escaneadoEn: 1 });
    res.json(history);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

// --- ALERTAS DE SEGURIDAD ---
router.get('/security/alerts', async (req, res) => {
  try {
    const alerts = await SecurityAlert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

router.delete('/security/alerts/clear', async (req, res) => {
  try {
    await SecurityAlert.deleteMany({});
    res.json({ message: 'Historial de seguridad limpiado correctamente' });
  } catch (err) {
    console.error('[OPERATIONAL ERROR]:', { timestamp: new Date().toISOString(), message: err.message });
    res.status(500).json({ error: 'Ocurrio un error interno al procesar la solicitud. Por favor intente mas tarde.' });
  }
});

module.exports = router;
