const mongoose = require('mongoose');

const StandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  qrCode: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Estand', StandSchema);
