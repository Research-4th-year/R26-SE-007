const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema(
  {
    round_number: {
      type: Number,
      required: true,
    },
    agent: {
      type: String,
      enum: ["farmer", "miller"],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const negotiationSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchSelection",
      default: null,
    },

    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      default: null,
    },

    millerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Miller",
      default: null,
    },

    requestData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    agreedPrice: {
      type: Number,
      default: null,
    },

    roundsCompleted: {
      type: Number,
      required: true,
    },

    finalReason: {
      type: String,
      required: true,
    },

    flReferencePrice: {
      type: Number,
      required: true,
    },

    fairnessScore: {
      type: Number,
      default: null,
    },

    priceDifferenceFromReference: {
      type: Number,
      default: null,
    },

    history: {
      type: [historyItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "Negotiation",
  negotiationSchema
);