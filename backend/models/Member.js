const mongoose = require('mongoose');

// Member schema
const memberSchema = new mongoose.Schema({
  basic: {
    name: String,
    email_id: String,
    alternate_email_id: String
  },
  contact_details: {
    mobile: String
  },
  education_details: Array    // <-- ensures array is stored
}, { strict: false });

module.exports = memberSchema;
