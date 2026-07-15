const express = require('express');
const router = express.Router();
const { addHarvest } = require('../controllers/harvest.controller');

router.post('/add', addHarvest);

module.exports = router;