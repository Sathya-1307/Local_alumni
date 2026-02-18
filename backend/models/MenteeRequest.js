const mentorshipDB = require("../config/mentorshipDB");
const mongoose = require("mongoose");

const MenteeRequestSchema = new mongoose.Schema({
  mentee_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: { 
    type: String, 
    required: true 
  },
  area_of_interest: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },

  // ✅ NEW FIELD — store phaseId
  phaseId: {
    type: Number,
    required: true
  },

  status: { 
    type: String, 
    default: "pending" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Important: use mentorshipDB connection
module.exports = mentorshipDB.model("MenteeRequest", MenteeRequestSchema);
