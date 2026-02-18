const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
  webinarDate: {
    type: Date,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  speaker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Speaker',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  meetingLink: {
    type: String,
    required: true
  },
  alumniCity: {
    type: String,
    required: true
  },
  phaseId: {
    type: Number,
    required: true
  },
  attendedCount: {
    type: Number,
    default: 0
  },
  prizeWinnerEmail: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Webinar = mongoose.models.Webinar || mongoose.model('Webinar', webinarSchema);
module.exports = Webinar;
