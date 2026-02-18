const mentorshipDB = require("../config/mentorshipDB");
const mongoose = require("mongoose");

const meetingStatusSchema = new mongoose.Schema({
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MeetingSchedule",
    required: true,
  },
  mentor_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mentee_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Postponed", "Cancelled", "In Progress"],
    required: true,
    default: "Scheduled",
  },
  meeting_minutes: {
    type: String,
    default: "",
  },
  postponed_reason: {
    type: String,
    default: "",
  },
  statusApproval: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  // ✅ NEW FIELD - phaseId
  phaseId: {
    type: Number,
    required: true,
    min: 1
  },
}, { 
  timestamps: true 
});

// ✅ Add indexes for better query performance
meetingStatusSchema.index({ meeting_id: 1, phaseId: 1 });
meetingStatusSchema.index({ phaseId: 1, status: 1 });
meetingStatusSchema.index({ mentor_user_id: 1, phaseId: 1 });
meetingStatusSchema.index({ mentee_user_id: 1, phaseId: 1 });
meetingStatusSchema.index({ phaseId: 1, statusApproval: 1 });

module.exports = mentorshipDB.model("MeetingStatus", meetingStatusSchema);