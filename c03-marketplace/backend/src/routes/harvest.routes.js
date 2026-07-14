const express = require("express");

const validate = require("../middlewares/validate.middleware");
const {
  addHarvest
} = require("../controllers/harvest.controller");

const harvestValidation = require(
  "../validations/harvest.validation"
);

const router = express.Router();

router.post(
  "/add",
  validate(harvestValidation.addHarvest),
  addHarvest
);

module.exports = router;