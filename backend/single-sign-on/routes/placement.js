const express = require("express");
const router = express.Router();
const { handlePlacementSSO  } = require("../controller/placement.controller");

router.get("/sso", handlePlacementSSO);

module.exports = router;