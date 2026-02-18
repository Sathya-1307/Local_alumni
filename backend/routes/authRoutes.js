const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST — login using email
router.post("/login", authController.loginWithEmail);

module.exports = router;
