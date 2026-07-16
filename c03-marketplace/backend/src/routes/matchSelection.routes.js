const express = require("express");

const {
    createSelections,
    respondToSelection,
    getMillerSelections,
    getFarmerSelections
} = require(
    "../controllers/matchSelection.controller"
);

const router = express.Router();

// Farmer selects one or multiple miller demands
router.post(
    "/create",
    createSelections
);

// Miller accepts or rejects
router.patch(
    "/:selectionId/respond",
    respondToSelection
);

// Get selections received by miller
router.get(
    "/miller/:millerId",
    getMillerSelections
);

// Get selections sent by farmer
router.get(
    "/farmer/:farmerId",
    getFarmerSelections
);

module.exports = router;