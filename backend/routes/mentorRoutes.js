const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentorController");

// ✅ Correct: pass function reference, not call it
router.get("/fetch-user", mentorController.getMentorDetailsByEmail);
router.post("/register", mentorController.createMentorRegistration);

module.exports = router;
