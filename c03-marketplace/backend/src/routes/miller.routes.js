const express = require('express');
const { registerMiller } = require('../controllers/miller.controller');

const router = express.Router();

//Miller registration route
router.post("/register", registerMiller);

module.exports = router;
