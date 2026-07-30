const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    farmerName: {
      type: String,
      required: [true, "Farmer name is required"],
      trim: true,
      maxlength: [100, "Farmer name cannot exceed 100 characters"],
    },

    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxlength: [100, "District cannot exceed 100 characters"],
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },

    farmName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [150, "Farm name cannot exceed 150 characters"],
    },

    farmSizeAcres: {
      type: Number,
      min: [0, "Farm size cannot be negative"],
      default: 0,
    },

    mainPaddyVariety: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Paddy variety cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Farmer", farmerSchema);