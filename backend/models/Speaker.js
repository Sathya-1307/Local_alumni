const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: false
  },
  batch: {
    type: String,
    required: false
  },
  designation: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  speakerPhoto: {
    type: String, // Path to uploaded photo
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  webinarVenue: {
    type: String,
    required: true
  },
  alumniCity: {
    type: String,
    required: true
  },
  meetingLink: {
    type: String,
    required: true
  },
  phaseId: {
    type: Number,
    required: true
  },
  slots: [{
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
    }
  }]
}, { timestamps: true });

const Speaker = mongoose.models.Speaker || mongoose.model('Speaker', speakerSchema);
module.exports = Speaker;
