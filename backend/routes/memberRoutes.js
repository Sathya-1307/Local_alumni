const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Route: GET /api/members/email/:email
router.get("/email/:email", async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();

    // Access 'members' collection in 'test' database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");

    const member = await memberCollection.findOne({
      "basic.email_id": { $regex: `^${email}$`, $options: "i" }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return required fields including MongoDB _id
    res.json({
      success: true,
      member: {
        _id: member._id.toString(), // Convert ObjectId to string
        name: member.basic?.name || "",
        batch: member.basic?.label || "",
        mobile: member.contact_details?.mobile || "",
        email: member.basic?.email_id || "",
      },
    });

  } catch (err) {
    console.error("Error fetching member:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;