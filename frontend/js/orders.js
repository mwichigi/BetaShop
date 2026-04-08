// ============================================================
// βetaShop — Orders Routes
// POST /api/orders        create order
// GET  /api/orders        user's orders
// GET  /api/orders/all    all orders (admin)
// ============================================================

const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// POST /api/orders — create order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, price, qty }]
    if (!items?.length) return res.status(400).json({ error: 'No items provided' });

    const total = items.reduce((s, i) => s + parseFloat(i.price) * (i.qty || 1), 0);

    await db.transaction(async (client) => {
      const order = await client.query(
        'INSERT INTO orders(user_id, total, status) VALUES($1,$2,$3) RETURNING *',
        [req.user.id, total, 'completed']
      );
      const orderId = order.rows[0].id;
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items(order_id,product_id,price,qty) VALUES($1,$2,$3,$4)',
          [orderId, item.id?.toString().replace('ext-',''), item.price, item.qty || 1]
        );
      }
      res.status(201).json({ order: order.rows[0] });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders — user's orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, json_agg(json_build_object('product_id',oi.product_id,'price',oi.price,'qty',oi.qty)) AS items
       FROM orders o LEFT JOIN order_items oi ON o.id=oi.order_id
       WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders: result.rows });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

// GET /api/orders/all — admin view
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o LEFT JOIN users u ON o.user_id=u.id
       ORDER BY o.created_at DESC LIMIT 100`
    );
    res.json({ orders: result.rows });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

module.exports = router;
