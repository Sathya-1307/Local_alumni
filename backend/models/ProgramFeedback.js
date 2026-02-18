const mentorshipDB = require("../config/mentorshipDB");

const mongoose = require("mongoose");


const ProgramFeedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: { type: String, required: true },
    programOrganization: { type: String, required: true },
    matchingProcess: { type: String, required: true },
    supportProvided: { type: String, required: true },
    overallSatisfaction: { type: String, required: true },
    generalFeedback: { type: String },
    suggestions: { type: String },
    participateAgain: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mentorshipDB.model("ProgramFeedback", ProgramFeedbackSchema);
