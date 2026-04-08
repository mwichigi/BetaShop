const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProduct);
router.post('/', authMiddleware, adminOnly, productsController.createProduct);
router.put('/:id', authMiddleware, adminOnly, productsController.updateProduct);
router.delete('/:id', authMiddleware, adminOnly, productsController.deleteProduct);
router.post('/sync', authMiddleware, adminOnly, productsController.syncProducts);

module.exports = router;