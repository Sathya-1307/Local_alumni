const express = require("express");
const router = express.Router();
const mentorMenteeController = require("../controllers/mentorMenteeController");

// Fetch mentors
router.get("/mentors", mentorMenteeController.getMentors);

// Fetch mentees
router.get("/mentees", mentorMenteeController.getMentees);

// Assign mentor
router.post("/assign", mentorMenteeController.assignMentor);

module.exports = router;
