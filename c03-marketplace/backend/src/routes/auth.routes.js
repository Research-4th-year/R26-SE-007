const express = require("express");

const {
  register,
  login,
  updatePassword,
  getMe,
} = require(
  "../controllers/auth.controller"
);

const {
  authenticate,
} = require(
  "../middlewares/auth.middleware"
);

const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  validateBody,
} = require(
  "../validations/auth.validation"
);

const router =
  express.Router();

router.post(
  "/register",
  validateBody(
    registerSchema
  ),
  register
);

router.post(
  "/login",
  validateBody(
    loginSchema
  ),
  login
);

router.patch(
  "/change-password",
  authenticate,
  validateBody(
    changePasswordSchema
  ),
  updatePassword
);

router.get(
  "/me",
  authenticate,
  getMe
);

module.exports =
  router;
