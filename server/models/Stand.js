const mongoose = require('mongoose');

const EstandSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  responsable: { type: String, required: true },
  ubicacion: { type: String },
  descripcion: { type: String },
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Estand', EstandSchema);