const express = require("express");
const router = express.Router();
const meetingStatusController = require("../controllers/meetingStatusController");

// 1. Fetch assigned mentees
router.get("/mentees-by-mentor", meetingStatusController.getMenteesByMentor);
router.get("/mentee/by-email", meetingStatusController.getMenteeByEmail);

// 2. Get all statuses
router.get("/all", meetingStatusController.getAllMeetingStatuses);

// 3. Update / create status
router.post("/update", meetingStatusController.updateMeetingStatus);
router.post("/update-minutes", meetingStatusController.updateMeetingMinutes);
// 4. Get status by meeting_id
router.get("/by-meeting-id", meetingStatusController.getMeetingStatusByMeetingId);

// 5. Approve/reject status
router.post("/approve-reject", meetingStatusController.updateStatusApproval);

module.exports = router;
