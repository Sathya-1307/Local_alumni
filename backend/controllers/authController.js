const User = require("../models/User");
const MentorRegistration = require("../models/MentorRegistration");
const MenteeRequest = require("../models/MenteeRequest");

exports.loginWithEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("LOGIN EMAIL:", email);

    // ================================
    // STEP 1 — FIND USER IN MEMBERS
    // ================================
    const user = await User.findOne({
      "basic.email_id": email
    });

    if (!user) {
      console.log("User NOT found in members:", email);
      return res.status(404).json({
        success: false,
        message: "User not found in members collection"
      });
    }

    console.log("Found Member:", user.basic?.name);

    const userId = user._id;

    // ================================
    // STEP 2 — CHECK IF MENTOR
    // MentorRegistration.mentor_id === user._id
    // ================================
    const mentor = await MentorRegistration.findOne({
      mentor_id: userId
    });

    if (mentor) {
      return res.json({
        success: true,
        role: "mentor",
        user: {
          id: userId,
          name: user.basic?.name,
          email: user.basic?.email_id
        }
      });
    }

    // ================================
    // STEP 3 — CHECK IF MENTEE
    // MenteeRequest.mentee_user_id === user._id
    // ================================
    const mentee = await MenteeRequest.findOne({
      mentee_user_id: userId
    });

    if (mentee) {
      return res.json({
        success: true,
        role: "mentee",
        user: {
          id: userId,
          name: user.basic?.name,
          email: user.basic?.email_id
        }
      });
    }

    // ================================
    // STEP 4 — NEW USER
    // (exists in members, but not mentor or mentee)
    // ================================
    return res.json({
      success: true,
      role: "new_user",
      user: {
        id: userId,
        name: user.basic?.name,
        email: user.basic?.email_id
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
