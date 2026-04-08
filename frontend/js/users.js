// ============================================================
// βetaShop — Users Routes (admin)
// GET /api/users        list all users (admin)
// GET /api/users/:id    get user (admin)
// ============================================================

const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 100');
    res.json({ users: result.rows });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT id,name,email,role,created_at FROM users WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

module.exports = router;
