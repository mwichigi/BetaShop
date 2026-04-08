// ============================================================
// βetaShop — PostgreSQL Database Connection + Schema
// ============================================================

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'nexastore',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('Unexpected DB error', err));

// ── DB Helper ──────────────────────────────────────────────
const db = {
  query: (text, params) => pool.query(text, params),

  async getClient() { return pool.connect(); },

  // Transaction helper
  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  }
};

// ── Schema Migration ───────────────────────────────────────
async function initSchema() {
  const sql = `
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      role        VARCHAR(20)  DEFAULT 'customer',
      created_at  TIMESTAMP    DEFAULT NOW(),
      updated_at  TIMESTAMP    DEFAULT NOW()
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      price       DECIMAL(10,2) NOT NULL,
      category    VARCHAR(100),
      icon        VARCHAR(10),
      image_url   TEXT,
      badge       VARCHAR(50),
      rating      DECIMAL(3,2) DEFAULT 0,
      review_count INT DEFAULT 0,
      active      BOOLEAN DEFAULT true,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id          SERIAL PRIMARY KEY,
      user_id     INT REFERENCES users(id) ON DELETE SET NULL,
      total       DECIMAL(10,2) NOT NULL,
      status      VARCHAR(50) DEFAULT 'pending',
      payment_id  VARCHAR(255),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id         SERIAL PRIMARY KEY,
      order_id   INT REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE SET NULL,
      price      DECIMAL(10,2) NOT NULL,
      qty        INT DEFAULT 1
    );

    -- Refresh tokens (for auth rotation)
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INT REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_active   ON products(active);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);

    -- Seed demo products if empty
    INSERT INTO products (name, description, price, category, icon, badge, rating)
    SELECT * FROM (VALUES
      ('Pro UI Kit',        'Complete component library with 200+ elements', 49.00, 'templates', '🎨', 'Bestseller', 4.9),
      ('Next.js Starter',   'Full-stack boilerplate with auth, DB, payments',  79.00, 'software',  '⚡', 'New',        4.8),
      ('Design System',     'Figma design system with dark/light themes',       39.00, 'graphics',  '🖌️', NULL,        4.7),
      ('SEO Course Bundle', 'Comprehensive SEO mastery — 40+ hours',            99.00, 'courses',   '📚', 'Popular',   4.9),
      ('Analytics Dashboard','React dashboard with charts and widgets',         59.00, 'templates', '📊', NULL,        4.6),
      ('Icon Pack Pro',     '2000+ premium icons SVG and PNG',                  19.00, 'graphics',  '✨', 'Sale',      4.8),
      ('VSCode Themes',     '15 premium dark themes for VS Code',               12.00, 'plugins',   '🎭', NULL,        4.5),
      ('Audio FX Pack',     '500+ royalty-free sound effects',                  29.00, 'audio',     '🎵', 'New',       4.7)
    ) AS v(name,description,price,category,icon,badge,rating)
    WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
  `;
  try {
    await pool.query(sql);
    console.log('✅ Database schema initialized');
  } catch (e) {
    console.warn('⚠️  DB schema init skipped (DB may not be connected):', e.message);
  }
}

initSchema();

module.exports = db;
