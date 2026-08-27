const mongoose = require("mongoose");

const millerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Miller name is required"],
      trim: true,
      maxlength: [100, "Miller name cannot exceed 100 characters"],
    },

    millName: {
      type: String,
      required: [true, "Mill name is required"],
      trim: true,
      maxlength: [150, "Mill name cannot exceed 150 characters"],
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

    businessRegistrationNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        100,
        "Business registration number cannot exceed 100 characters",
      ],
    },

    purchasingCapacityKg: {
      type: Number,
      min: [0, "Purchasing capacity cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Miller", millerSchema);