const mentorshipDB = require("../config/mentorshipDB");
const mongoose = require("mongoose");

const MentorMenteeAssignmentSchema = new mongoose.Schema({
  mentor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentee_user_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mentorshipDB.model("MentorMenteeAssignment", MentorMenteeAssignmentSchema);
