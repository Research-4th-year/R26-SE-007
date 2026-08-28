const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require(
  "../config/env.config"
);

const Farmer = require(
  "../models/farmer.model"
);

const Miller = require(
  "../models/miller.model"
);

const User = require(
  "../models/user.model"
);

const PASSWORD_SALT_ROUNDS = 12;

function normalizeUsername(
  username
) {
  return String(
    username || ""
  )
    .trim()
    .toLowerCase();
}

function normalizeEmail(
  email
) {
  const normalized =
    String(email || "")
      .trim()
      .toLowerCase();

  return normalized || undefined;
}

function createAccessToken(
  user
) {
  if (
    !config.jwt?.secret
  ) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      sub:
        user._id.toString(),

      role:
        user.role,

      mustChangePassword:
        Boolean(
          user.mustChangePassword
        ),
    },
    config.jwt.secret,
    {
      expiresIn:
        config.jwt.expiresIn ||
        "1d",

      issuer:
        "digital-goviya-marketplace",

      audience:
        "digital-goviya-client",
    }
  );
}

async function getRoleProfile(
  user
) {
  if (
    user.role ===
    "farmer"
  ) {
    return Farmer.findOne({
      user: user._id,
    }).lean();
  }

  if (
    user.role ===
    "miller"
  ) {
    return Miller.findOne({
      user: user._id,
    }).lean();
  }

  return null;
}

function buildDuplicateUserError(
  field
) {
  const error =
    new Error(
      field === "username"
        ? "This username is already in use"
        : "An account with this email address already exists"
    );

  error.statusCode = 409;

  return error;
}

async function registerUser(
  payload
) {
  const normalizedUsername =
    normalizeUsername(
      payload.username
    );

  const normalizedEmail =
    normalizeEmail(
      payload.email
    );

  const duplicateFilters =
    [
      {
        username:
          normalizedUsername,
      },
    ];

  if (normalizedEmail) {
    duplicateFilters.push({
      email:
        normalizedEmail,
    });
  }

  const existingUser =
    await User.findOne({
      $or:
        duplicateFilters,
    }).lean();

  if (existingUser) {
    if (
      existingUser.username ===
      normalizedUsername
    ) {
      throw buildDuplicateUserError(
        "username"
      );
    }

    throw buildDuplicateUserError(
      "email"
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      payload.password,
      PASSWORD_SALT_ROUNDS
    );

  let createdUser = null;

  try {
    createdUser =
      await User.create({
        username:
          normalizedUsername,

        fullName:
          payload.fullName,

        email:
          normalizedEmail,

        password:
          hashedPassword,

        role:
          payload.role,

        phone:
          payload.phone,

        district:
          payload.district,

        mustChangePassword:
          false,

        verificationSource:
          "SELF_REGISTERED",
      });

    let profile;

    if (
      payload.role ===
      "farmer"
    ) {
      profile =
        await Farmer.create({
          user:
            createdUser._id,

          farmerName:
            payload.fullName,

          district:
            payload.district,

          location:
            payload.location,

          farmName:
            payload.farmName ||
            "",

          farmSizeAcres:
            payload.farmSizeAcres ||
            0,

          mainPaddyVariety:
            payload.mainPaddyVariety ||
            "",
        });
    } else {
      profile =
        await Miller.create({
          user:
            createdUser._id,

          name:
            payload.fullName,

          millName:
            payload.millName,

          district:
            payload.district,

          location:
            payload.location,

          businessRegistrationNumber:
            payload.businessRegistrationNumber ||
            "",

          purchasingCapacityKg:
            payload.purchasingCapacityKg ||
            0,
        });
    }

    const token =
      createAccessToken(
        createdUser
      );

    return {
      token,

      user:
        createdUser.toSafeObject(),

      profile:
        profile.toObject(),
    };
  } catch (error) {
    if (
      createdUser?._id
    ) {
      await User.findByIdAndDelete(
        createdUser._id
      );
    }

    if (
      error?.code ===
      11000
    ) {
      const field =
        error.keyPattern
          ?.username
          ? "username"
          : "email";

      throw buildDuplicateUserError(
        field
      );
    }

    throw error;
  }
}

/*
 * Normal login uses username.
 *
 * During transition, `identifier` can also be an email
 * for legacy demo accounts. The frontend sends username.
 */
async function loginUser(
  payload
) {
  const rawIdentifier =
    String(
      payload.identifier ||
      payload.username ||
      ""
    ).trim();

  const normalizedIdentifier =
    rawIdentifier.toLowerCase();

  const user =
    await User.findOne({
      $or: [
        {
          username:
            normalizedIdentifier,
        },
        {
          email:
            normalizedIdentifier,
        },
      ],
    }).select(
      "+password"
    );

  if (!user) {
    const error =
      new Error(
        "Invalid username or password"
      );

    error.statusCode =
      401;

    throw error;
  }

  if (!user.isActive) {
    const error =
      new Error(
        "This account has been disabled"
      );

    error.statusCode =
      403;

    throw error;
  }

  const passwordMatches =
    await bcrypt.compare(
      payload.password,
      user.password
    );

  if (
    !passwordMatches
  ) {
    const error =
      new Error(
        "Invalid username or password"
      );

    error.statusCode =
      401;

    throw error;
  }

  if (
    payload.role &&
    payload.role !==
      user.role
  ) {
    const error =
      new Error(
        `This account is registered as a ${user.role}`
      );

    error.statusCode =
      403;

    throw error;
  }

  user.lastLoginAt =
    new Date();

  await user.save();

  const profile =
    await getRoleProfile(
      user
    );

  if (!profile) {
    const error =
      new Error(
        `${user.role} profile was not found`
      );

    error.statusCode =
      409;

    throw error;
  }

  const token =
    createAccessToken(
      user
    );

  return {
    token,

    user:
      user.toSafeObject(),

    profile,
  };
}

async function changePassword(
  userId,
  payload
) {
  const user =
    await User.findById(
      userId
    ).select(
      "+password"
    );

  if (
    !user ||
    !user.isActive
  ) {
    const error =
      new Error(
        "Authenticated user was not found"
      );

    error.statusCode =
      401;

    throw error;
  }

  const currentMatches =
    await bcrypt.compare(
      payload.currentPassword,
      user.password
    );

  if (
    !currentMatches
  ) {
    const error =
      new Error(
        "Current password is incorrect"
      );

    error.statusCode =
      400;

    throw error;
  }

  const sameAsCurrent =
    await bcrypt.compare(
      payload.newPassword,
      user.password
    );

  if (
    sameAsCurrent
  ) {
    const error =
      new Error(
        "New password must be different from the current password"
      );

    error.statusCode =
      400;

    throw error;
  }

  user.password =
    await bcrypt.hash(
      payload.newPassword,
      PASSWORD_SALT_ROUNDS
    );

  user.mustChangePassword =
    false;

  user.lastPasswordChangeAt =
    new Date();

  await user.save();

  const profile =
    await getRoleProfile(
      user
    );

  /*
   * Create a fresh token because the previous token
   * may contain mustChangePassword=true.
   */
  const token =
    createAccessToken(
      user
    );

  return {
    token,

    user:
      user.toSafeObject(),

    profile,
  };
}

async function getAuthenticatedUser(
  userId
) {
  const user =
    await User.findById(
      userId
    );

  if (
    !user ||
    !user.isActive
  ) {
    const error =
      new Error(
        "Authenticated user was not found"
      );

    error.statusCode =
      401;

    throw error;
  }

  const profile =
    await getRoleProfile(
      user
    );

  return {
    user:
      user.toSafeObject(),

    profile,
  };
}

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  getAuthenticatedUser,
};
