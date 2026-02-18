const mongoose = require("mongoose");

// Important: force to use existing "members" collection
delete mongoose.connection.models["User"];

const User = mongoose.model(
  "User",
  new mongoose.Schema({}, { strict: false }),
  "members" // Force mapping to your existing 'members' collection
);

module.exports = User;
