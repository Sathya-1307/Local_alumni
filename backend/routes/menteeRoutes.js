const express = require("express");
const router = express.Router();
const menteeController = require("../controllers/menteeController");

router.post("/requests/mentee", menteeController.createMenteeRequest);

module.exports = router;
