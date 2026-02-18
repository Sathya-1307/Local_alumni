// controllers/phaseController.js
const Phase = require("../models/Phase");
const Mentee = require("../models/MenteeRequest");   // Assuming your mentee model
const Mentor = require("../models/MentorRegistration");   // Assuming your mentor model

// Get all phases
exports.getPhases = async (req, res) => {
  try {
    const phases = await Phase.find().sort({ phaseId: 1 });
    res.json({ success: true, phases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ✅ Get mentor count by phaseId
exports.getMentorCount = async (req, res) => {
  try {
    const phaseId = Number(req.query.phaseId);
    const count = await Mentor.countDocuments({ phaseId });
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get mentee count by phaseId
exports.getMenteeCount = async (req, res) => {
  try {
    const phaseId = Number(req.query.phaseId);
    const count = await Mentee.countDocuments({ phaseId });
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Create a new phase
exports.createPhase = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check overlapping dates
    const overlapping = await Phase.findOne({
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ success: false, message: "Phase dates overlap with existing phase" });
    }

    // Generate next phaseId
    const lastPhase = await Phase.findOne().sort({ phaseId: -1 });
    const nextPhaseId = lastPhase ? lastPhase.phaseId + 1 : 1;

    const phase = new Phase({
      phaseId: nextPhaseId,
      name,
      startDate,
      endDate
    });

    await phase.save();
    res.status(201).json({ success: true, phase });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




