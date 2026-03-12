const mongoose = require('mongoose');

const EventSurveySchema = new mongoose.Schema({
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  email: { 
    type: String, 
    default: 'Anónimo'
  },
  comentarios: { 
    type: String,
    required: false
  },
  creadoEn: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('EventSurvey', EventSurveySchema);
