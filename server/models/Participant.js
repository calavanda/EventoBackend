const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String },
  school: { type: String },
  registrationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Participante', ParticipantSchema);
