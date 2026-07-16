const express = require("express");

const {
    getFarmerDashboard,
    getMillerDashboard
} = require(
    "../controllers/dashboard.controller"
);

const router = express.Router();

router.get(
    "/farmer/:farmerId",
    getFarmerDashboard
);

router.get(
    "/miller/:millerId",
    getMillerDashboard
);

module.exports = router;