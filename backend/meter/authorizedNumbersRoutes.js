var express = require('express');
var router = express.Router();
var controller = require('./authorizedNumbersController');

// ESP32 meter sync endpoint (no JWT — meters authenticate by DRN)
router.post('/sync/:drn', controller.syncAuthorizedNumbers);

// Admin endpoint (require JWT)
var auth = require('../admin/authMiddllware');
router.get('/:drn', auth.authenticateToken, controller.getAuthorizedNumbers);

module.exports = router;
