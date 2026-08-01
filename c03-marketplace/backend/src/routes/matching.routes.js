const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const {
  matchHarvest,
} = require("../controllers/matching.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("farmer"));

router.get("/:harvestId", matchHarvest);

module.exports = router;