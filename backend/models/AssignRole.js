const mongoose = require('mongoose');

const assignRoleSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
  roleId: { type: Number, required: true },
  assignedAt: { type: Date, default: Date.now }
});

const db = mongoose.connection.useDb("local_Administration");
module.exports = db.model('AssignRole', assignRoleSchema, 'assign_roles');