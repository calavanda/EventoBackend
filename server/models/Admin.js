const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  rol: {
    type: String,
    enum: ["admin", "moderador", "escaneador"],
    default: "escaneador",
  },
  activo: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Admin", adminSchema);
