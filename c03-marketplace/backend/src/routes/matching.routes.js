const express = require('express');
const router = express.Router();
const { matchHarvest } = require('../controllers/matching.controller');

router.get('/:harvestId', matchHarvest);

module.exports = router;