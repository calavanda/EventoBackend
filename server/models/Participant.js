const mongoose = require('mongoose');
const crypto = require('crypto');

const ParticipanteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidoPaterno: { type: String, required: true },
  apellidoMaterno: { type: String },
  ciudad: { type: String },
  municipio: { type: String },
  genero: { type: String, enum: ['M', 'F', 'Otro'], default: 'M' },
  correo: { type: String, required: true },
  codigoQR: { type: String },
  fechaRegistro: { type: Date, default: Date.now }
});

// Auto-generar código QR antes de guardar
ParticipanteSchema.pre('save', function(next) {
  if (!this.codigoQR) {
    this.codigoQR = `EVT-${this._id || crypto.randomBytes(8).toString('hex')}`;
  }
  next();
});

module.exports = mongoose.model('Participante', ParticipanteSchema);