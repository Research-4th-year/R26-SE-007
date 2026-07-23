const express = require("express");

const {
  startNegotiation,
  getNegotiation,
  listNegotiations,
  negotiationHealth,
} = require(
  "../controllers/negotiation.controller"
);

const router = express.Router();

router.get(
  "/health",
  negotiationHealth
);

router.get(
  "/",
  listNegotiations
);

router.get(
  "/:negotiationId",
  getNegotiation
);

router.post(
  "/start",
  startNegotiation
);

module.exports = router;