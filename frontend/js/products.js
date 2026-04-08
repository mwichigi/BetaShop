// ============================================================
// βetaShop — Products Routes
// GET    /api/products
// GET    /api/products/:id
// POST   /api/products          (admin)
// PUT    /api/products/:id      (admin)
// DELETE /api/products/:id      (admin)
// POST   /api/products/sync     (admin — sync from DummyJSON)
// ============================================================

const router  = require('express').Router();
const axios   = require('axios');
const db      = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/products — list with filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, min_price, max_price, sort, limit = 20, page = 1, featured } = req.query;
    let where = ['p.active = true'];
    const params = [];
    let pi = 1;

    if (search) { where.push(`(p.name ILIKE $${pi} OR p.description ILIKE $${pi})`); params.push(`%${search}%`); pi++; }
    if (category) { where.push(`p.category = $${pi}`); params.push(category); pi++; }
    if (min_price) { where.push(`p.price >= $${pi}`); params.push(parseFloat(min_price)); pi++; }
    if (max_price) { where.push(`p.price <= $${pi}`); params.push(parseFloat(max_price)); pi++; }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const orderMap = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', rating: 'p.rating DESC', newest: 'p.created_at DESC' };
    const orderClause = `ORDER BY ${orderMap[sort] || 'p.created_at DESC'}`;
    const limitVal = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * limitVal;

    const countResult = await db.query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limitVal, offset);
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.category, p.icon, p.image_url AS image, p.badge, p.rating, p.review_count, p.created_at
       FROM products p ${whereClause} ${orderClause} LIMIT $${pi} OFFSET $${pi+1}`,
      params
    );

    res.json({ products: result.rows, total, page: parseInt(page), pages: Math.ceil(total / limitVal) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id=$1 AND active=true', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Failed to fetch product' }); }
});

// POST /api/products — create (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, price, category, icon, image, badge } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
    const result = await db.query(
      'INSERT INTO products(name,description,price,category,icon,image_url,badge) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, parseFloat(price), category, icon, image, badge]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Failed to create product' }); }
});

// PUT /api/products/:id — update (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, price, category, icon, image, badge, active } = req.body;
    const result = await db.query(
      `UPDATE products SET
        name=$1, description=$2, price=$3, category=$4, icon=$5, image_url=$6, badge=$7, active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, description, parseFloat(price), category, icon, image, badge, active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Failed to update product' }); }
});

// DELETE /api/products/:id — soft delete (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE products SET active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed to delete product' }); }
});

// POST /api/products/sync — import from FakeStoreAPI (admin only)
router.post('/sync', authMiddleware, adminOnly, async (req, res) => {
  try {
    const response = await axios.get('https://dummyjson.com/products');
    const items = response.data.products || [];
    let imported = 0;
    for (const item of items) {
      const existing = await db.query('SELECT id FROM products WHERE name=$1', [item.title]);
      if (!existing.rows.length) {
        await db.query(
          'INSERT INTO products(name,description,price,category,image_url,rating,review_count) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [item.title, item.description, item.price, item.category, item.thumbnail || (item.images && item.images[0]) || null, item.rating, item.stock || 0]
        );
        imported++;
      }
    }
    res.json({ message: `Synced ${imported} new products from DummyJSON`, total: items.length, imported });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sync failed', details: e.message });
  }
});

module.exports = router;
