const mongoose = require("mongoose");

const contactRequestSchema =
  new mongoose.Schema(
    {
      negotiationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Negotiation",
        required: true,
        unique: true,
        index: true,
      },

      farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farmer",
        required: true,
        index: true,
      },

      millerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Miller",
        required: true,
        index: true,
      },

      requestedBy: {
        type: String,
        enum: ["farmer", "miller"],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },

      requestedAt: {
        type: Date,
        default: Date.now,
      },

      respondedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

module.exports = mongoose.model(
  "ContactRequest",
  contactRequestSchema
);