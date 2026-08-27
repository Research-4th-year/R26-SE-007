const mongoose = require("mongoose");

const USER_ROLES = [
  "farmer",
  "miller",
];

const userSchema =
  new mongoose.Schema(
    {
      username: {
        type: String,
        required: [
          true,
          "Username is required",
        ],
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
        minlength: [
          4,
          "Username must contain at least 4 characters",
        ],
        maxlength: [
          60,
          "Username cannot exceed 60 characters",
        ],
        match: [
          /^[a-z0-9._-]+$/,
          "Username can contain only letters, numbers, dots, underscores and hyphens",
        ],
      },

      fullName: {
        type: String,
        required: [
          true,
          "Full name is required",
        ],
        trim: true,
        minlength: [
          2,
          "Full name must contain at least 2 characters",
        ],
        maxlength: [
          100,
          "Full name cannot exceed 100 characters",
        ],
      },

      /*
       * Email is optional because PMB-imported millers
       * may not have an email address.
       *
       * sparse + unique allows multiple documents with
       * no email while still preventing duplicate real
       * email addresses.
       */
      email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true,
        index: true,
        maxlength: [
          150,
          "Email cannot exceed 150 characters",
        ],
        default: undefined,
      },

      password: {
        type: String,
        required: [
          true,
          "Password is required",
        ],
        select: false,
      },

      role: {
        type: String,
        required: [
          true,
          "Role is required",
        ],
        enum: {
          values:
            USER_ROLES,
          message:
            "Role must be either farmer or miller",
        },
        index: true,
      },

      phone: {
        type: String,
        required: [
          true,
          "Phone number is required",
        ],
        trim: true,
        maxlength: [
          20,
          "Phone number cannot exceed 20 characters",
        ],
      },

      district: {
        type: String,
        required: [
          true,
          "District is required",
        ],
        trim: true,
        maxlength: [
          100,
          "District cannot exceed 100 characters",
        ],
      },

      /*
       * Imported PMB accounts start with this set to true.
       * Normal self-registered accounts start false.
       */
      mustChangePassword: {
        type: Boolean,
        default: false,
        index: true,
      },

      lastPasswordChangeAt: {
        type: Date,
        default: null,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      isVerified: {
        type: Boolean,
        default: false,
      },

      /*
       * Useful for distinguishing imported PMB records
       * from self-registered research/test accounts.
       */
      verificationSource: {
        type: String,
        enum: [
          "PMB",
          "SELF_REGISTERED",
          "RESEARCH_SYNTHETIC",
          "NONE",
        ],
        default: "NONE",
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

userSchema.methods.toSafeObject =
  function toSafeObject() {
    const user =
      this.toObject();

    delete user.password;

    return user;
  };

module.exports =
  mongoose.model(
    "User",
    userSchema
  );

module.exports.USER_ROLES =
  USER_ROLES;
