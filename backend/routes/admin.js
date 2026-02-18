const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();


// ==========================================
// CHECK MEMBER BY EMAIL
// ==========================================
router.get("/check-member", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const member = await mongoose.connection.db
      .collection("members")
      .findOne({
        "basic.email_id": { $regex: new RegExp(`^${email}$`, "i") }
      });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const adminDb = mongoose.connection.useDb("local_Administration");

    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: member._id })
      .toArray();

    const existingRoleIds = assignedRoles.map(r => r.roleId);

    res.json({
      memberId: member._id,
      name: member.basic.name,
      email: member.basic.email_id,
      existingRoles: existingRoleIds
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// GET ALL ROLES
// ==========================================
router.get("/roles", async (req, res) => {
  try {
    const roles = await mongoose.connection.db
      .collection("roles")
      .find({})
      .toArray();

    res.json(roles);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ==========================================
// ASSIGN ROLES
// ==========================================
router.post("/assign-roles", async (req, res) => {
  try {
    const { memberId, roleIds } = req.body;

    console.log("Incoming Data:", req.body);

    if (!memberId || !Array.isArray(roleIds)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const adminDb = mongoose.connection.useDb("local_Administration");

    const objectMemberId = new mongoose.Types.ObjectId(memberId);

    // 🔹 Explicitly create collection if not exists
    const collections = await adminDb.db.listCollections().toArray();
    const exists = collections.some(c => c.name === "assign_roles");

    if (!exists) {
      await adminDb.createCollection("assign_roles");
      console.log("assign_roles collection created");
    }

    // 🔹 Delete previous roles
    await adminDb.collection("assign_roles").deleteMany({
      memberId: objectMemberId
    });

    // 🔹 Insert new roles
    if (roleIds.length > 0) {
      const docs = roleIds.map(roleId => ({
        memberId: objectMemberId,
        roleId: Number(roleId),
        assignedAt: new Date()
      }));

      const result = await adminDb.collection("assign_roles").insertMany(docs);

      console.log("Inserted:", result.insertedCount);
    }

    res.json({ message: "Roles assigned successfully" });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;