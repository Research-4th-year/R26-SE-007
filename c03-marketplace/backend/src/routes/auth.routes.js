const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/auth.controller");

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const {
  registerSchema,
  loginSchema,
  validateBody,
} = require("../validations/auth.validation");

const router = express.Router();

router.post(
  "/register",
  validateBody(registerSchema),
  register
);

router.post(
  "/login",
  validateBody(loginSchema),
  login
);

router.get(
  "/me",
  authenticate,
  getMe
);

module.exports = router;