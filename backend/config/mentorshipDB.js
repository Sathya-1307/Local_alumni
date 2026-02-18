const mongoose = require("mongoose");

const mentorshipConnection = mongoose.createConnection(
  process.env.MENTORSHIP_DB_URI
);

module.exports = mentorshipConnection;
