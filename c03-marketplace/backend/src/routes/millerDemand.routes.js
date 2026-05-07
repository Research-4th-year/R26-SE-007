const express = require('express');
const router = express.Router();

const {
    createDemand
} = require('../controllers/millerDemand.controller');

router.post('/create', createDemand);

module.exports = router;