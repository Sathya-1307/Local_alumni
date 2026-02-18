const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Auth routes
router.use("/auth", require("./authRoutes"));

// User fetch route
router.get("/users/get-by-email", userController.getUserByEmail);

// Mentor routes
router.use("/mentor", require("./mentorRoutes"));

// Mentee routes
router.use("/mentee", require("./menteeRoutes"));

// Mentor-Mentee assignment routes
router.use("/mentor-mentee", require("./mentorMenteeRoutes"));

// Program feedback routes
router.use("/program-feedback", require("./programFeedbackRoutes"));

// Meeting routes
router.use("/meetings", require("./meetingRoutes"));

// Meeting status routes
router.use("/meeting-status", require("./meetingStatusRoutes"));

// Phase management routes
router.use("/phase", require("./phaseRoutes"));
router.use("/dashboard", require("./dashboardRoutes"));


module.exports = router;
