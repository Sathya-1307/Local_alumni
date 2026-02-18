const mongoose = require('mongoose');

const webinarPhaseSchema = new mongoose.Schema({
  phaseId: {
    type: Number,
    required: true,
    unique: true
  },
  startingDate: {
    type: Date,
    required: true
  },
  endingDate: {
    type: Date,
    required: true
  },
  domains: [{
    department: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

const WebinarPhase = mongoose.model('WebinarPhase', webinarPhaseSchema);
module.exports = WebinarPhase;
