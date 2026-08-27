const express = require("express");

const validate = require(
  "../middlewares/validate.middleware"
);

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const {
  addHarvest,
  getMyHarvests,
} = require("../controllers/harvest.controller");

const harvestValidation = require(
  "../validations/harvest.validation"
);

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("farmer"));

router.post(
  "/add",
  validate(harvestValidation.addHarvest),
  addHarvest
);

router.get(
  "/my-harvests",
  getMyHarvests
);

module.exports = router;