const express = require('express');
const validate = require('../middlewares/validate.middleware');
const ragController = require('../controllers/rag.controller');

const router = express.Router();

router.post(
  '/ask',
  validate(ragController.askSchema),
  ragController.askQuestion
);

module.exports = router;
