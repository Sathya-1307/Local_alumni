const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Use the same connection but specify database
const db = mongoose.connection.useDb("local_Administration");
module.exports = db.model('Role', roleSchema, 'roles');