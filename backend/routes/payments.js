const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments');
const { optionalAuth } = require('../middleware/auth');

router.post('/mpesa', optionalAuth, paymentsController.initiateMpesa);
router.post('/callback', paymentsController.mpesaCallback);

module.exports = router;
