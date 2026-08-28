const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  createSelections,
  createSelectionsByMiller,
  respondToSelection,
  getMillerSelections,
  getFarmerSelections,
} = require(
  "../controllers/matchSelection.controller"
);

const router = express.Router();

/**
 * Farmer sends requests to Millers.
 */
router.post(
  "/create",
  authenticate,
  authorizeRoles("farmer"),
  createSelections
);

/**
 * Miller sends requests to Farmers.
 */
router.post(
  "/create-by-miller",
  authenticate,
  authorizeRoles("miller"),
  createSelectionsByMiller
);

/**
 * Either role can respond.
 *
 * Controller verifies that the responder is the
 * opposite participant and owns the request.
 */
router.patch(
  "/:selectionId/respond",
  authenticate,
  authorizeRoles(
    "farmer",
    "miller"
  ),
  respondToSelection
);

/**
 * Miller inbox/history.
 */
router.get(
  "/miller",
  authenticate,
  authorizeRoles("miller"),
  getMillerSelections
);

/**
 * Farmer inbox/history.
 */
router.get(
  "/farmer",
  authenticate,
  authorizeRoles("farmer"),
  getFarmerSelections
);

module.exports = router;