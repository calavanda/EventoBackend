const mongoose = require('mongoose');

const VisitaSchema = new mongoose.Schema({
  participante: { type: mongoose.Schema.Types.ObjectId, ref: 'Participante', required: true },
  estand: { type: mongoose.Schema.Types.ObjectId, ref: 'Estand', required: true },
  escaneadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visita', VisitaSchema);