const express = require("express");

const {
  getMillerProfile,
  updateMillerProfile,
} = require("../controllers/miller.controller");

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("miller"));

router.get("/me", getMillerProfile);
router.patch("/me", updateMillerProfile);

module.exports = router;