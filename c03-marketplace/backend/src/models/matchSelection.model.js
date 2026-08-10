const mongoose = require("mongoose");

const matchSelectionSchema =
  new mongoose.Schema(
    {
      harvestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Harvest",
        required: true,
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

      demandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MillerDemand",
        required: true,
        index: true,
      },

      matchingScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },

      /**
       * Who originally sent the matching request?
       *
       * farmer:
       * Farmer selected a Miller demand.
       * Miller must respond.
       *
       * miller:
       * Miller selected a Farmer harvest.
       * Farmer must respond.
       */
      initiatedBy: {
        type: String,
        enum: ["farmer", "miller"],
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "negotiation_ready",
          "rejected",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },

      initiatedAt: {
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

// The same Harvest + Demand pair cannot create
// multiple matching requests.
matchSelectionSchema.index(
  {
    harvestId: 1,
    demandId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "MatchSelection",
  matchSelectionSchema
);