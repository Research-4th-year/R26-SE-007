const express = require("express");

const {
  authenticate,
  authorizeRoles,
} = require(
  "../middlewares/auth.middleware"
);

const {
  getMyPartners,
  getPartnerDetails,
  addFavoritePartner,
  removeFavoritePartner,
} = require(
  "../controllers/partner.controller"
);

const router = express.Router();

router.use(authenticate);

router.use(
  authorizeRoles(
    "farmer",
    "miller"
  )
);

router.get(
  "/",
  getMyPartners
);

router.get(
  "/:partnerType/:partnerId",
  getPartnerDetails
);

router.post(
  "/:partnerType/:partnerId/favorite",
  addFavoritePartner
);

router.delete(
  "/:partnerType/:partnerId/favorite",
  removeFavoritePartner
);

module.exports = router;