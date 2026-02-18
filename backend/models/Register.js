const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  webinarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webinar',
    required: true
  },
  phaseId: {
    type: Number,
    required: true
  },
  attendedStatus: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  }
}, { timestamps: true });

module.exports = registerSchema;
