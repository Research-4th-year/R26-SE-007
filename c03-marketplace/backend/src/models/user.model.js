const mongoose = require("mongoose");

const USER_ROLES = ["farmer", "miller"];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must contain at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: USER_ROLES,
        message: "Role must be either farmer or miller",
      },
      index: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },

    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxlength: [100, "District cannot exceed 100 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject();

  delete user.password;

  return user;
};

module.exports = mongoose.model("User", userSchema);
module.exports.USER_ROLES = USER_ROLES;