const express = require('express');
const router = express.Router();
const { predictPrice } = require('../controllers/fl.controller');

router.post('/predict', predictPrice);

module.exports = router;