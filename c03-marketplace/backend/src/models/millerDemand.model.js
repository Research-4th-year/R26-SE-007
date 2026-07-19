const mongoose = require('mongoose');

const millerDemandSchema = new mongoose.Schema(
  {
    millerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Miller",
      required: true,
    },

    paddyType: {
      type: String,
      required: true,
    },

    quantityNeeded: {
      type: Number,
      required: true,
    },

    offeredPrice: {
      type: Number,
      required: true,
    },

    status: {
    type: String,
    enum: [
        "pending",
        "negotiation_ready",
        "negotiating",
        "agreement_reached",
        "negotiation_failed",
        "rejected",
        "cancelled"
    ],
    default: "pending"
},
  },
  { timestamps: true },
);

module.exports = mongoose.model('MillerDemand', millerDemandSchema);