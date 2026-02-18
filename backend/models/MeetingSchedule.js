const mongoose = require("mongoose");
const mentorshipDB = require("../config/mentorshipDB");

const MeetingScheduleSchema = new mongoose.Schema({
  mentor_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  mentee_user_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  meeting_dates: [{
    date: { type: Date, required: true },
    meeting_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      default: () => new mongoose.Types.ObjectId() 
    }
  }],
  meeting_time: { type: String, required: true },
  duration_minutes: { type: Number, required: true },
  platform: { type: String, required: true },
  meeting_link: { type: String },
  agenda: { type: String },
  preferred_day: { 
    type: String, 
    enum: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] 
  },
  number_of_meetings: { type: Number },
  
  // ✅ NEW FIELD - Add phaseId exactly like MenteeRequest model
  phaseId: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Optional: Add status field like MenteeRequest
  status: {
    type: String,
    default: "scheduled",
    enum: ["scheduled", "completed", "cancelled", "rescheduled"]
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Optional: Create index for better query performance
MeetingScheduleSchema.index({ phaseId: 1, mentor_user_id: 1 });
MeetingScheduleSchema.index({ phaseId: 1, status: 1 });
MeetingScheduleSchema.index({ phaseId: 1, createdAt: -1 });

module.exports = mentorshipDB.model("MeetingSchedule", MeetingScheduleSchema);