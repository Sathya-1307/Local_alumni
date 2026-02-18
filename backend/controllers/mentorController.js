const User = require("../models/User");
const MentorRegistration = require("../models/MentorRegistration");

exports.getMentorDetailsByEmail = async (req, res) => {
  try {
    const email = String(req.query.email).trim().toLowerCase();
    const user = await User.findOne({ "basic.email_id": { $regex: new RegExp(`^${email}$`, "i") } });

    if (!user) return res.status(404).json({ success: false, message: "No user found with this email" });

    const fullName = user.basic?.name || "";
    const branchRaw = user.education_details?.[0]?.stream || "";
    const branch = branchRaw.includes(";") ? branchRaw.split(";")[0].trim() : branchRaw;
    const batch = user.education_details?.[0]?.end_year || "";
    const contactNumber = user.contact_details?.mobile || "Not provided";

    const work = user.work_details?.[0] || {};
    const designation = work.position || "Not provided";
    const currentCompany = work.name || "Not provided";

    return res.status(200).json({
      success: true,
      user: { fullName, branch, batch, emailId: user.basic?.email_id || "", mobile: contactNumber, designation, currentCompany },
    });
  } catch (err) {
    console.error("AUTO FETCH ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createMentorRegistration = async (req, res) => {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const phaseId = req.body.phaseId;

    if (!phaseId) {
      return res.status(400).json({
        success: false,
        message: "phaseId is required"
      });
    }

    const user = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Ensure areas_of_interest is an array
    let interests = req.body.areaOfInterest;
    if (!Array.isArray(interests)) interests = [interests];

    const newMentor = new MentorRegistration({
      mentor_id: user._id,
      areas_of_interest: interests,
      description: req.body.supportDescription,
      phaseId: phaseId   // 🔥 Store phaseId here
    });

    await newMentor.save();

    return res.status(201).json({
      success: true,
      message: "Mentor registration submitted successfully"
    });

  } catch (err) {
    console.error("MENTOR REGISTRATION ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
