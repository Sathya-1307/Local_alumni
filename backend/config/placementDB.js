const mongoose = require("mongoose");

const placementDB = mongoose.createConnection(
  process.env.PLACEMENT_DB_URI
);

placementDB.on("connected", () => {
  console.log("✅ Placement DB connected");
});

placementDB.on("error", (err) => {
  console.error("❌ Placement DB error:", err);
});

module.exports = placementDB;
