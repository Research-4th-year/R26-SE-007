const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
    farmerName: {
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

module.exports = mongoose.model("Farmer", farmerSchema);