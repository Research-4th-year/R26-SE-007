const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientType: {
            type: String,
            enum: ["farmer", "miller"],
            required: true
        },

        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        type: {
            type: String,
            enum: [
                "MATCH_SELECTED",
                "MATCH_ACCEPTED",
                "MATCH_REJECTED",
                "NEGOTIATION_READY"
            ],
            required: true
        },

        title: {
            english: {
                type: String,
                required: true
            },

            sinhala: {
                type: String,
                required: true
            }
        },

        message: {
            english: {
                type: String,
                required: true
            },

            sinhala: {
                type: String,
                required: true
            }
        },

        relatedHarvestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Harvest",
            default: null
        },

        relatedSelectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MatchSelection",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);