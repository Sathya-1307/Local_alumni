// routes/phaseRoutes.js
const express = require("express");
const router = express.Router();
const phaseController = require("../controllers/phaseController");

// GET all phases
router.get("/", phaseController.getPhases);
// ✅ GET mentee count by phaseId
router.get("/mentee-count", phaseController.getMenteeCount);

// ✅ GET mentor count by phaseId
router.get("/mentor-count", phaseController.getMentorCount);


// POST create new phase
router.post("/", phaseController.createPhase);


module.exports = router;
