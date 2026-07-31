const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const {
  getFarmerDashboard,
  getMillerDashboard,
} = require("../controllers/dashboard.controller");

const router = express.Router();

router.get(
  "/farmer",
  authenticate,
  authorizeRoles("farmer"),
  getFarmerDashboard
);

router.get(
  "/miller",
  authenticate,
  authorizeRoles("miller"),
  getMillerDashboard
);

module.exports = router;