const mongoose = require("mongoose");

const favoritePartnerSchema =
  new mongoose.Schema(
    {
      ownerType: {
        type: String,
        enum: ["farmer", "miller"],
        required: true,
        index: true,
      },

      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      partnerType: {
        type: String,
        enum: ["farmer", "miller"],
        required: true,
        index: true,
      },

      partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      savedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

favoritePartnerSchema.index(
  {
    ownerType: 1,
    ownerId: 1,
    partnerType: 1,
    partnerId: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "FavoritePartner",
    favoritePartnerSchema
  );