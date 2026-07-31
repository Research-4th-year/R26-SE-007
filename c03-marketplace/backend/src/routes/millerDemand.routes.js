const express = require("express");

const validate = require(
  "../middlewares/validate.middleware"
);

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const {
  createDemand,
  getMyDemands,
} = require("../controllers/millerDemand.controller");

const demandValidation = require(
  "../validations/millerDemand.validation"
);

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("miller"));

router.post(
  "/create",
  validate(demandValidation.createDemand),
  createDemand
);

router.get("/my-demands", getMyDemands);

module.exports = router;