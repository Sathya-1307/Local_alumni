const mongoose = require('mongoose');

const alumniFeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  webinarTopic: {
    type: String,
    required: true,
    trim: true
  },
  arrangementsRating: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Average', 'Poor']
  },
  studentParticipationRating: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Average', 'Poor']
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AlumniFeedback', alumniFeedbackSchema);