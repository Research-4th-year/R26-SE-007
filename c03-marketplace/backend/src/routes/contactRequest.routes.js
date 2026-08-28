const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  createContactRequest,
  respondToContactRequest,
  getContactRequestForNegotiation,
} = require(
  "../controllers/contactRequest.controller"
);

const router = express.Router();

router.use(authenticate);

router.use(
  authorizeRoles(
    "farmer",
    "miller"
  )
);

router.post(
  "/",
  createContactRequest
);

router.get(
  "/negotiation/:negotiationId",
  getContactRequestForNegotiation
);

router.patch(
  "/:requestId/respond",
  respondToContactRequest
);

module.exports = router;