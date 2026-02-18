const mentorshipDB = require("../config/mentorshipDB");
const mongoose = require("mongoose");

const MentorRegistrationSchema = new mongoose.Schema({
  mentor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  areas_of_interest: {
    type: [String],
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  phaseId: {
    type: Number,
    required: true   // 🔥 must store phase ID
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mentorshipDB.model(
  "MentorRegistration",
  MentorRegistrationSchema
);
