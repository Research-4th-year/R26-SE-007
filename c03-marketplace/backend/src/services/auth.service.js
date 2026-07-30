const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("../config/env.config");
const Farmer = require("../models/farmer.model");
const Miller = require("../models/miller.model");
const User = require("../models/user.model");

const PASSWORD_SALT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createAccessToken(user) {
  if (!config.jwt?.secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn || "1d",
      issuer: "digital-goviya-marketplace",
      audience: "digital-goviya-client",
    }
  );
}

async function getRoleProfile(user) {
  if (user.role === "farmer") {
    return Farmer.findOne({ user: user._id }).lean();
  }

  if (user.role === "miller") {
    return Miller.findOne({ user: user._id }).lean();
  }

  return null;
}

async function registerUser(payload) {
  const normalizedEmail = normalizeEmail(payload.email);

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).lean();

  if (existingUser) {
    const error = new Error(
      "An account with this email address already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    PASSWORD_SALT_ROUNDS
  );

  let createdUser = null;

  try {
    createdUser = await User.create({
      fullName: payload.fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: payload.role,
      phone: payload.phone,
      district: payload.district,
    });

    let profile;

    if (payload.role === "farmer") {
      profile = await Farmer.create({
        user: createdUser._id,
        farmerName: payload.fullName,
        district: payload.district,
        location: payload.location,
        farmName: payload.farmName || "",
        farmSizeAcres: payload.farmSizeAcres || 0,
        mainPaddyVariety: payload.mainPaddyVariety || "",
      });
    } else {
      profile = await Miller.create({
        user: createdUser._id,
        name: payload.fullName,
        millName: payload.millName,
        district: payload.district,
        location: payload.location,
        businessRegistrationNumber:
          payload.businessRegistrationNumber || "",
        purchasingCapacityKg:
          payload.purchasingCapacityKg || 0,
      });
    }

    const token = createAccessToken(createdUser);

    return {
      token,
      user: createdUser.toSafeObject(),
      profile: profile.toObject(),
    };
  } catch (error) {
    // Prevent an orphan User document if profile creation fails.
    if (createdUser?._id) {
      await User.findByIdAndDelete(createdUser._id);
    }

    if (error?.code === 11000) {
      const duplicateError = new Error(
        "An account with this email address already exists"
      );

      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
}

async function loginUser(payload) {
  const normalizedEmail = normalizeEmail(payload.email);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("This account has been disabled");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (payload.role && payload.role !== user.role) {
    const error = new Error(
      `This account is registered as a ${user.role}`
    );

    error.statusCode = 403;
    throw error;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const profile = await getRoleProfile(user);
  const token = createAccessToken(user);

  return {
    token,
    user: user.toSafeObject(),
    profile,
  };
}

async function getAuthenticatedUser(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    const error = new Error("Authenticated user was not found");
    error.statusCode = 401;
    throw error;
  }

  const profile = await getRoleProfile(user);

  return {
    user: user.toSafeObject(),
    profile,
  };
}

module.exports = {
  registerUser,
  loginUser,
  getAuthenticatedUser,
};