const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  matchHarvest,
  matchDemand,
} = require(
  "../controllers/matching.controller"
);

const router = express.Router();

/**
 * Farmer:
 * Find Miller demands for one Farmer harvest.
 */
router.get(
  "/harvest/:harvestId",
  authenticate,
  authorizeRoles("farmer"),
  matchHarvest
);

/**
 * Miller:
 * Find Farmer harvests for one Miller demand.
 */
router.get(
  "/demand/:demandId",
  authenticate,
  authorizeRoles("miller"),
  matchDemand
);

module.exports = router;