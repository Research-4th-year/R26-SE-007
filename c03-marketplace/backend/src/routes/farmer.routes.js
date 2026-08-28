const express = require("express");

const {
  getFarmerProfile,
  updateFarmerProfile,
} = require("../controllers/farmer.controller");

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("farmer"));

router.get("/me", getFarmerProfile);
router.patch("/me", updateFarmerProfile);

module.exports = router;