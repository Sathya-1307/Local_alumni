const User = require('../models/User');

exports.getUserByEmail = async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Searching members collection for:", email);

    // Correct: search inside basic.email_id
    const user = await User.findOne({
      "basic.email_id": email
    });

    if (!user) {
      console.log("User NOT found for:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("FOUND USER:", user.basic?.name);

    // Extract details
    const fullName = user.basic?.name || "Unknown";
    const label = user.basic?.label || "";
    const emailId = user.basic?.email_id || "";
    const mobile = user.contact_details?.mobile || "Not Provided";

    let batch = "Unknown";
    let branch = "Unknown";

    if (label) {
      const first = label.split(","); // e.g. "BE 2028, CIVIL"
      if (first.length >= 2) {
        batch = first[0].replace("BE", "").trim(); // 2028
        branch = first[1].trim(); // CIVIL
      }
    }

    return res.json({
      success: true,
      user: {
        fullName,
        branch,
        batch,
        emailId,
        mobile
      }
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
