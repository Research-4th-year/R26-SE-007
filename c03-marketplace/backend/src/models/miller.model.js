const mongoose = require('mongoose');

const millerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mill_name: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Miller", millerSchema);