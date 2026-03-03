const mongoose = require('mongoose');

const roleMappingSchema = new mongoose.Schema({
  roleId: { type: Number, required: true },
  screenId: { type: Number, required: true },
  canView: { type: Boolean, default: false },
  canCreate: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  assignedAt: { type: Date, default: Date.now }
});

roleMappingSchema.index({ roleId: 1, screenId: 1 }, { unique: true });

const db = mongoose.connection.useDb("local_Administration");
module.exports = db.model('RoleMapping', roleMappingSchema, 'role_mapping');