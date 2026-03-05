const mongoose = require('mongoose');

const EncuestaSchema = new mongoose.Schema({
  stand: { type: mongoose.Schema.Types.ObjectId, ref: 'Stand' },
  p1: { type: Number },
  p2: { type: Number },
  p3: { type: Number },
  p4: { type: Number },
  p5: { type: Number },
  comentarios: { type: String },
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Encuesta', EncuestaSchema);