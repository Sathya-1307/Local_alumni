const { decryptSSOToken } = require('vaave-sso-sdk');

exports.handlePlacementSSO = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  let email;
  try {
    // Decode the token from URL
    const decoded = decodeURIComponent(token);
    
    // Decrypt the SSO token
    const { details } = await decryptSSOToken(decoded, process.env.SEED);
    email = details.email;
    console.log("Decrypted email:", email);
  } catch (err) {
    console.error("SSO Token decryption error:", err);
    return res.status(400).json({ error: "Invalid Token" });
  }

  try {
    // Encode email in Base64 so frontend can read it safely from URL
    const encodedEmail = Buffer.from(email).toString("base64");

    // Redirect to your React frontend Placement Dashboard
    return res.redirect(
      302,
      `https://necalumni.nec.edu.in/alumnimain/placement-dashboard?email=${encodeURIComponent(encodedEmail)}`
    );
  } catch (err) {
    console.error("Error redirecting with email:", err);
    return res.status(500).json({ error: "Server error" });
  }
};