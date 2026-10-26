const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '24h' }
  );
}

// POST /api/auth/register
function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return res.status(400).json({ success: false, error: 'Name must be between 2 and 100 characters.' });
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
  }

  // Check for duplicate email
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email address is already registered.' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    const info = insertStmt.run(trimmedName, trimmedEmail, passwordHash);

    const newUser = {
      id: info.lastInsertRowid,
      name: trimmedName,
      email: trimmedEmail
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: newUser,
        token
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create user account.' });
  }
}

// POST /api/auth/login
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(trimmedEmail);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const token = generateToken(user);

  return res.json({
    success: true,
    message: 'Signed in successfully.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    }
  });
}

// GET /api/auth/me
function getMe(req, res) {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}

// GET /api/auth/users?email=...
function searchUsers(req, res) {
  const query = req.query.email ? req.query.email.trim().toLowerCase() : '';
  if (!query || query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const users = db.prepare(`
    SELECT id, name, email FROM users
    WHERE email LIKE ? OR name LIKE ?
    LIMIT 10
  `).all(`%${query}%`, `%${query}%`);

  return res.json({ success: true, data: users });
}

module.exports = {
  register,
  login,
  getMe,
  searchUsers
};
