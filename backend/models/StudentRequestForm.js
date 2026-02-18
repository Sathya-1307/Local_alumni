const mongoose = require('mongoose');

const studentRequestFormSchema = new mongoose.Schema({
  email: {
    type: String,
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
  reason: {
    type: String,
    required: true
  },
  phaseId: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const StudentRequestForm = mongoose.models.StudentRequestForm || mongoose.model('StudentRequestForm', studentRequestFormSchema);
module.exports = StudentRequestForm;
