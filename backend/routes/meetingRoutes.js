const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meetingController");

// GET mentor details + assigned mentees
router.get("/mentor-details", meetingController.getMentorDetails);

// POST to schedule a meeting
router.post("/schedule", meetingController.scheduleMeeting);

// GET all (Admin)
router.get("/scheduled", meetingController.getScheduledMeetings);

// GET only this mentor's scheduled meetings
router.get("/scheduled/:email", meetingController.getScheduledByUser);

// GET meeting by ID for editing
router.get("/meeting/:meetingId", meetingController.getMeetingById);

// UPDATE meeting details (Mentor-only)
router.put("/meeting/:meetingId", meetingController.updateMeeting);

// DELETE meeting
router.delete("/meeting/:meetingId", meetingController.deleteMeeting);

// GET all meetings for a mentor (for edit dropdown)
router.get("/mentor/:mentorId/meetings", meetingController.getAllMeetingsForMentor);

// GET mentor by email
router.get("/mentor-by-email/:email", meetingController.getMentorByEmail);
router.get('/mentor-by-mentee', meetingController.getMentorByMenteeEmail); 

module.exports = router;