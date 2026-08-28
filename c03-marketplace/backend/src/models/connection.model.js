const mongoose = require(
  "mongoose"
);

const connectionSchema =
  new mongoose.Schema(
    {
      farmerId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Farmer",

        required: true,

        index: true,
      },

      millerId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Miller",

        required: true,

        index: true,
      },

      /*
       * Who originally sent the
       * connection request?
       */
      requestedBy: {
        type: String,

        enum: [
          "farmer",
          "miller",
        ],

        required: true,
      },

      status: {
        type: String,

        enum: [
          "pending",
          "accepted",
          "rejected",
          "removed",
        ],

        default:
          "pending",

        index: true,
      },

      requestedAt: {
        type: Date,

        default:
          Date.now,
      },

      respondedAt: {
        type: Date,

        default:
          null,
      },

      removedAt: {
        type: Date,

        default:
          null,
      },
    },
    {
      timestamps: true,

      versionKey:
        false,
    }
  );

/*
 * There can be only one relationship
 * between the same Farmer and Miller.
 *
 * This prevents:
 *
 * Farmer → Miller
 * and
 * Miller → Farmer
 *
 * from creating duplicate records.
 */
connectionSchema.index(
  {
    farmerId: 1,
    millerId: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "Connection",
    connectionSchema
  );