const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participante', required: true },
  stand: { type: mongoose.Schema.Types.ObjectId, ref: 'Estand' },
  rating: { type: Number, required: true },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Encuesta', SurveySchema);
