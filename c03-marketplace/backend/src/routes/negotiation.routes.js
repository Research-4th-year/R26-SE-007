const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  startNegotiation,
  getNegotiation,
  listMyNegotiations,
  negotiationHealth,
} = require(
  "../controllers/negotiation.controller"
);

const router = express.Router();

router.get(
  "/health",
  authenticate,
  authorizeRoles("farmer", "miller"),
  negotiationHealth
);

router.post(
  "/start",
  authenticate,
  authorizeRoles("farmer", "miller"),
  startNegotiation
);

router.get(
  "/mine",
  authenticate,
  authorizeRoles("farmer", "miller"),
  listMyNegotiations
);

router.get(
  "/:negotiationId",
  authenticate,
  authorizeRoles("farmer", "miller"),
  getNegotiation
);

module.exports = router;