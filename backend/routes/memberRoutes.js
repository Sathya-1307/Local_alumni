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

    let graduationYear = null;
    const label = member.basic?.label || "";
    

    const yearMatch = label.match(/\b(19|20)\d{2}\b/); // Matches 1900-2099
    if (yearMatch) {
      graduationYear = parseInt(yearMatch[0]);
    }

    let endYears = [];
    if (member.education_details && Array.isArray(member.education_details)) {
      endYears = member.education_details.map(edu => edu.end_year).filter(year => year);
    }

    res.json({
      success: true,
      member: {
        _id: member._id.toString(),
        name: member.basic?.name || "",
        batch: member.basic?.label || "",
        label: member.basic?.label || "",
        graduationYear: graduationYear, // Extracted from label
        mobile: member.contact_details?.mobile || "",
        email: member.basic?.email_id || "",
        education_details: member.education_details || [],
        end_years: endYears,
        basic: member.basic || {},
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