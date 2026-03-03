const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  screenId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  module: { type: String, required: true },
  route: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const db = mongoose.connection.useDb("local_Administration");
module.exports = db.model('Screen', screenSchema, 'screens');