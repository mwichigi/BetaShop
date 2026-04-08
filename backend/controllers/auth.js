// controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'your-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── Generate JWT ──────────────────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── Safe user object (strip password) ────────────────────────────────────────
function safeUser(user) {
  return {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// Body: { firstName, lastName, name, email, password }
// ════════════════════════════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, name, email, password } = req.body;

    // Build full name — accept either name or firstName+lastName
    const fullName = (name || [firstName, lastName].filter(Boolean).join(' ')).trim();

    // ── Validation ────────────────────────────────────────────────────────────
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // ── Check existing user ───────────────────────────────────────────────────
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // ── Hash password ─────────────────────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, 12);

    // ── Insert user ───────────────────────────────────────────────────────────
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, role`,
      [fullName, email.toLowerCase(), password_hash, 'user']
    );

    const user  = result.rows[0];
    const token = generateToken(user);

    console.log(`✅ New user registered: ${user.email}`);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: safeUser(user),
    });

  } catch (err) {
    console.error('[Register Error]', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// Body: { email, password }
// ════════════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // ── Find user ─────────────────────────────────────────────────────────────
    const result = await db.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // ── Check if Google-only account ──────────────────────────────────────────
    if (!user.password_hash) {
      return res.status(401).json({
        error: 'This account uses Google sign-in. Please use Continue with Google.',
      });
    }

    // ── Compare password ──────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    console.log(`✅ User logged in: ${user.email}`);

    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: safeUser(user),
    });

  } catch (err) {
    console.error('[Login Error]', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/google
// Body: { email, firstName, lastName }
// ════════════════════════════════════════════════════════════════════════════
exports.google = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Google email is required.' });
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      || email.split('@')[0];

    // ── Check if user exists ──────────────────────────────────────────────────
    const existing = await db.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      const user  = existing.rows[0];
      const token = generateToken(user);
      console.log(`✅ Google login (existing): ${user.email}`);
      return res.status(200).json({ token, user: safeUser(user) });
    }

    // ── Create new Google user ────────────────────────────────────────────────
    const placeholderPassword = crypto.randomBytes(16).toString('hex');
    const password_hash       = await bcrypt.hash(placeholderPassword, 12);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, role`,
      [fullName, email.toLowerCase(), password_hash, 'user']
    );

    const user  = result.rows[0];
    const token = generateToken(user);

    console.log(`✅ Google login (new user): ${user.email}`);

    return res.status(201).json({
      message: 'Account created via Google.',
      token,
      user: safeUser(user),
    });

  } catch (err) {
    console.error('[Google Auth Error]', err.message);
    return res.status(500).json({ error: 'Google login failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me  — requires auth middleware
// ════════════════════════════════════════════════════════════════════════════
exports.me = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    console.error('[Me Error]', err.message);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
};
