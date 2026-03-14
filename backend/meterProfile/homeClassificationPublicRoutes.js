const express = require('express');
const router = express.Router();
const homeClassificationController = require('./homeClassificationController');

// Public endpoint for Android app to submit home classifications
// No authentication required (the app authenticates via BLE to the meter)
router.post('/submit', homeClassificationController.saveClassification);

module.exports = router;
