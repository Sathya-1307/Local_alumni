const mongoose = require('mongoose');

const studentFeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  webinar: { type: String, required: true },
  speaker: { type: String, required: true },
  q1: { type: Number, required: true, min: 1, max: 5 },
  q2: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String, required: true },
  phaseId: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { strict: false });

const StudentFeedback = mongoose.models.StudentFeedback || mongoose.model('StudentFeedback', studentFeedbackSchema);
module.exports = StudentFeedback;
