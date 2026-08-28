const express = require("express");

const validate = require(
  "../middlewares/validate.middleware"
);

const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const ragController = require(
  "../controllers/rag.controller"
);

const router = express.Router();

router.use(authenticate);

router.use(
  authorizeRoles("farmer", "miller")
);

router.post(
  "/ask",
  validate(ragController.askSchema),
  ragController.askQuestion
);

module.exports = router;