const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participante', required: true },
  stand: { type: mongoose.Schema.Types.ObjectId, ref: 'Estand', required: true },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visita', VisitSchema);
