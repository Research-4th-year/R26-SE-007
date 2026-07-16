const mongoose = require("mongoose");

const matchSelectionSchema = new mongoose.Schema(
    {
        harvestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Harvest",
            required: true
        },

        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmer",
            required: true
        },

        millerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Miller",
            required: true
        },

        demandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MillerDemand",
            required: true
        },

        matchingScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "negotiation_ready",
                "rejected",
                "cancelled"
            ],
            default: "pending"
        },

        farmerSelectedAt: {
            type: Date,
            default: Date.now
        },

        millerRespondedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same harvest-demand pair from being selected twice
matchSelectionSchema.index(
    {
        harvestId: 1,
        demandId: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "MatchSelection",
    matchSelectionSchema
);