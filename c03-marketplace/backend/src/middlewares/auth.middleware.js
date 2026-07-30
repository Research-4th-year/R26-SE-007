const jwt = require("jsonwebtoken");

const config = require("../config/env.config");
const User = require("../models/user.model");

async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const decodedToken = jwt.verify(
      token,
      config.jwt.secret,
      {
        issuer: "digital-goviya-marketplace",
        audience: "digital-goviya-client",
      }
    );

    const user = await User.findById(decodedToken.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "The authentication session is no longer valid",
      });
    }

    req.user = user;
    req.auth = {
      userId: user._id.toString(),
      role: user.role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Authentication token has expired"
            : "Authentication token is invalid",
      });
    }

    return next(error);
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource",
      });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};