const { decryptSSOToken } = require('vaave-sso-sdk');

exports.handleWebinarSSO = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  let email;
  try {
    const decoded = decodeURIComponent(token);
    let { details }= await decryptSSOToken(decoded, process.env.SEED);
    email = details.email;
    console.log("Decrypted email:", email);
  } catch (err) {
    console.error("SSO Token decrypt error:", err);
    return res.status(400).json({ error: "Invalid Token" });
  }

  // Base64 encode email (your frontend expects this)
  const encryptedEmail = Buffer.from(email).toString("base64");

  // Redirect to React UI WITH encrypted email
  return res.redirect(
    302,
    `https://necalumni.nec.edu.in/alumnimain/webinar-dashboard?email=${encodeURIComponent(encryptedEmail)}`
  );
};