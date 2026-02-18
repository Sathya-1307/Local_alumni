// models/Phase.js
const mongoose = require("mongoose");
const mentorshipDB = require("../config/mentorshipDB");

const PhaseSchema = new mongoose.Schema({
  phaseId: { type: Number, required: true, unique: true }, // auto-increment
  name: { type: String, required: true },                  // Phase 1, Phase 2
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mentorshipDB.model("Phase", PhaseSchema);
