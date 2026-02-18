const User = require("../models/User");
const ProgramFeedback = require("../models/ProgramFeedback");

// GET user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const email = String(req.query.email).trim().toLowerCase();

    const user = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user_id: user._id,
      name: user.basic?.name || "",
      branch: user.basic?.branch || "",
      batch: user.basic?.batch || "",
      mobile: user.basic?.mobile || "",
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      email,
      role,
      programOrganization,
      matchingProcess,
      supportProvided,
      overallSatisfaction,
      generalFeedback,
      suggestions,
      participateAgain,
    } = req.body;

    const emailLower = String(email).trim().toLowerCase();

    const user = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${emailLower}$`, "i") },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const feedback = new ProgramFeedback({
      user_id: user._id,
      role,
      programOrganization,
      matchingProcess,
      supportProvided,
      overallSatisfaction,
      generalFeedback,
      suggestions,
      participateAgain,
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback saved successfully!",
    });
  } catch (err) {
    console.error("FEEDBACK SAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getFeedback = async (req, res) => {
  try {
    const { email } = req.query;

    let filter = {};
    if (email) {
      const user = await User.findOne({
        "basic.email_id": { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, "i") },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      filter.user_id = user._id;
    }

    const feedbacks = await ProgramFeedback.find(filter).populate("user_id", "basic.name basic.email_id");
    res.json(feedbacks);

  } catch (err) {
    console.error("GET FEEDBACK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};