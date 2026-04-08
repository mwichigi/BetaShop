const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, ordersController.createOrder);
router.get('/', authMiddleware, ordersController.getOrders);

module.exports = router;