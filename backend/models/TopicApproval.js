const mongoose = require('mongoose');

const topicApprovalSchema = new mongoose.Schema({
  phaseId: {
    type: Number,
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
  total_requested: {
    type: Number,
    required: true
  },
  approval: {
    type: String,
    enum: ['Approved', 'On Hold', 'Rejected'],
    default: 'On Hold'
  }
}, { timestamps: true });

// Create unique index to prevent duplicates
topicApprovalSchema.index({ phaseId: 1, domain: 1, topic: 1 }, { unique: true });

const TopicApproval = mongoose.models.TopicApproval || mongoose.model('TopicApproval', topicApprovalSchema);
module.exports = TopicApproval;
