const User = require("../models/User");
const MenteeRequest = require("../models/MenteeRequest");

exports.createMenteeRequest = async (req, res) => {
  try {
    // Normalize email
    const email = String(req.body.email).trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!req.body.phaseId) {
      return res.status(400).json({ message: "phaseId is required" });
    }

    const phaseId = Number(req.body.phaseId);

    if (isNaN(phaseId) || phaseId <= 0) {
      return res.status(400).json({ message: "Invalid phaseId" });
    }

    console.log("Searching members collection for:", email);

    // Find user by email
    const user = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user) {
      console.log("User NOT found:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("FOUND USER:", user.basic?.name);

    // Create mentee request
    const request = new MenteeRequest({
      mentee_user_id: user._id,       
      email: email,
      area_of_interest: req.body.area_of_interest,
      description: req.body.description,
      phaseId: phaseId,                     // ✅ ADDED
      status: "pending",
      createdAt: new Date()
    });

    await request.save();

    return res.status(201).json({
      success: true,
      message: "Mentee request submitted successfully"
    });

  } catch (err) {
    console.error("MENTEE REQUEST ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
