const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const {
  createSelections,
  respondToSelection,
  getMillerSelections,
  getFarmerSelections,
} = require(
  "../controllers/matchSelection.controller"
);

const router = express.Router();

router.post(
  "/create",
  authenticate,
  authorizeRoles("farmer"),
  createSelections
);

router.patch(
  "/:selectionId/respond",
  authenticate,
  authorizeRoles("miller"),
  respondToSelection
);

router.get(
  "/miller",
  authenticate,
  authorizeRoles("miller"),
  getMillerSelections
);

router.get(
  "/farmer",
  authenticate,
  authorizeRoles("farmer"),
  getFarmerSelections
);

module.exports = router;