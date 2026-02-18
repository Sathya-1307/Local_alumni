const express = require("express");
const router = express.Router();
const { handleMentorSSO  } = require("../controller/mentorship.controller");

router.get("/sso", handleMentorSSO);

module.exports = router;