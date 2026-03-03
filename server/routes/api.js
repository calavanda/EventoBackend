const express = require('express');
const router = express.Router();
const Participante = require('../models/Participant');
const Estand = require('../models/Stand');
const Visita = require('../models/Visit');
const Encuesta = require('../models/Survey');
const Admin = require('../models/Admin');

// --- ADMINISTRADORES (RBAC) ---
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener admins: ' + err.message });
  }
});

router.post('/admins', async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar admin: ' + err.message });
  }
});

router.put('/admins/:id', async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar admin: ' + err.message });
  }
});

router.delete('/admins/:id', async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Admin eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar admin: ' + err.message });
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
    res.status(500).json({ error: 'Error en validación: ' + err.message });
  }
});

// --- PARTICIPANTES ---
router.get('/participants', async (req, res) => {
  try {
    const participantes = await Participante.find().sort({ fechaRegistro: -1 });
    res.json(participantes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener participantes: ' + err.message });
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
    console.error('Error al crear participante:', err.message);
    res.status(500).json({ error: 'Error al registrar participante: ' + err.message });
  }
});

router.put('/participants/:id', async (req, res) => {
  try {
    const participante = await Participante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!participante) return res.status(404).json({ error: 'Participante no encontrado' });
    res.json(participante);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar participante: ' + err.message });
  }
});

router.delete('/participants/:id', async (req, res) => {
  try {
    await Participante.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Participante eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar participante: ' + err.message });
  }
});

// --- ESTANDS ---
router.get('/stands', async (req, res) => {
  try {
    const estands = await Estand.find().sort({ creadoEn: -1 });
    res.json(estands);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estands: ' + err.message });
  }
});

router.post('/stands', async (req, res) => {
  try {
    const estand = new Estand(req.body);
    await estand.save();
    res.status(201).json(estand);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar estand: ' + err.message });
  }
});

router.put('/stands/:id', async (req, res) => {
  try {
    const estand = await Estand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!estand) return res.status(404).json({ error: 'Estand no encontrado' });
    res.json(estand);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estand: ' + err.message });
  }
});

router.delete('/stands/:id', async (req, res) => {
  try {
    await Estand.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Estand eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar estand: ' + err.message });
  }
});

// --- VISITAS (Escáner QR) ---
router.post('/visits/scan', async (req, res) => {
  try {
    const { codigoQR, estandId } = req.body;

    if (!codigoQR || !estandId) {
      return res.status(400).json({ error: 'Falta el código QR o el ID del estand' });
    }

    const participante = await Participante.findOne({ codigoQR });
    if (!participante) {
      return res.status(404).json({ message: 'Participante no encontrado con este código QR' });
    }

    const conteoVisitas = await Visita.countDocuments({ participante: participante._id });

    const visita = new Visita({
      participante: participante._id,
      estand: estandId
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
    console.error('Error en escaneo:', err.message);
    res.status(500).json({ error: 'Error al registrar visita: ' + err.message });
  }
});

// --- ENCUESTAS ---
router.get('/surveys', async (req, res) => {
  try {
    const encuestas = await Encuesta.find()
      .populate('estand')
      .sort({ creadoEn: -1 });
    res.json(encuestas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener encuestas: ' + err.message });
  }
});

router.post('/surveys', async (req, res) => {
  try {
    const encuesta = new Encuesta(req.body);
    await encuesta.save();
    res.status(201).json(encuesta);
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar encuesta: ' + err.message });
  }
});

// --- REPORTES / ESTADÍSTICAS ---
router.get('/reports/stats', async (req, res) => {
  try {
    const totalParticipants = await Participante.countDocuments();
    const totalVisits = await Visita.countDocuments();
    const totalStands = await Estand.countDocuments();
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
    res.status(500).json({ error: 'Error al obtener estadísticas: ' + err.message });
  }
});

router.get('/reports/stand-visits', async (req, res) => {
  try {
    const visitasPorEstand = await Visita.aggregate([
      { $group: { _id: '$estand', count: { $sum: 1 } } },
      { $lookup: { from: 'estands', localField: '_id', foreignField: '_id', as: 'detalles' } },
      { $unwind: { path: '$detalles', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$detalles.nombre', 'Desconocido'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]);
    res.json(visitasPorEstand);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener visitas por estand: ' + err.message });
  }
});

// --- ANALÍTICAS (Gráficas) ---
router.get('/reports/stand-analytics', async (req, res) => {
  try {
    const visitStats = await Visita.aggregate([
      { $group: { _id: '$estand', count: { $sum: 1 } } },
      { $lookup: { from: 'estands', localField: '_id', foreignField: '_id', as: 'estand' } },
      { $unwind: { path: '$estand', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$estand.nombre', 'Desconocido'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]);

    const surveyStats = await Encuesta.aggregate([
      { $group: { _id: '$estand', avgRating: { $avg: { $avg: ['$p1', '$p2', '$p3', '$p4', '$p5'] } } } },
      { $lookup: { from: 'estands', localField: '_id', foreignField: '_id', as: 'estand' } },
      { $unwind: { path: '$estand', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$estand.nombre', 'Desconocido'] }, avgRating: { $round: ['$avgRating', 1] } } },
      { $sort: { avgRating: -1 } }
    ]);

    res.json({ visitStats, surveyStats });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener analíticas: ' + err.message });
  }
});

module.exports = router;