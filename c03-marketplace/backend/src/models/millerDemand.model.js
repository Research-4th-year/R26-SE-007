const mongoose = require("mongoose");

const millerDemandSchema = new mongoose.Schema(
  {
    millerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Miller",
      required: true,
      index: true,
    },

    paddyType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    quantityNeeded: {
      type: Number,
      required: true,
      min: 1,
    },

    offeredPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    maximumBuyingPrice: {
      type: Number,
      required: true,
      min: 0,
      select: false,
    },

    status: {
      type: String,
      enum: [
        "open",
        "negotiation_ready",
        "negotiating",
        "agreement_reached",
        "fulfilled",
        "negotiation_failed",
        "rejected",
        "cancelled",
      ],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("MillerDemand", millerDemandSchema);
