const db = require('../db');

exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Items required' });

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const result = await db.query(
      'INSERT INTO orders(user_id, items, total) VALUES($1, $2, $3) RETURNING *',
      [req.user.id, JSON.stringify(items), total]
    );
    res.status(201).json({ order: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ orders: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};