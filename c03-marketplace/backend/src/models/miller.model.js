const mongoose = require('mongoose');

const millerSchema = new mongoose.Schema({
  name: String,
  mill_name: String,
  district: String,
  location: String,
}, { timestamps: true });

module.exports = mongoose.model("Miller", millerSchema);