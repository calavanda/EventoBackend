const mongoose = require("mongoose");

const securityAlertSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
    required: true,
  },
  metodo: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  tipoAtaque: {
    type: String,
    required: true,
  },
  detalles: {
    type: Object, // Guardamos el payload sospechoso
  },
});

module.exports = mongoose.model("SecurityAlert", securityAlertSchema);
