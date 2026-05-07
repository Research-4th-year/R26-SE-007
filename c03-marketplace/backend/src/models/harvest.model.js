const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farmer",
        required: true
    },
    paddyType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    expectedPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "available"
    }
}, { timestamps: true });

module.exports = mongoose.model("Harvest", harvestSchema);