const express = require('express');
const router = express.Router();
const { registerFarmer } = require('../controllers/farmer.controller');

router.post('/register', registerFarmer);

module.exports = router;