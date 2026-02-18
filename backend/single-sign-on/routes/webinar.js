const express = require("express");
const router = express.Router();
const { handleWebinarSSO  } = require("../controller/webinar.controller");

router.get("/sso", handleWebinarSSO);

module.exports = router;