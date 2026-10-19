const fs = require('fs');
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20kb' }));

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters');
  process.exit(1);
}

function createAuthToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    {
      expiresIn: '2h',
      issuer: 'aerobook-user-service',
      audience: 'aerobook-api'
    }
  );
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.delete('sslmode');
dbUrl.searchParams.delete('uselibpqcompat');

const rdsCaPath = path.join(__dirname, '../certs/global-bundle.pem');
const rdsCa = fs.readFileSync(rdsCaPath, 'utf8');

const pool = new Pool({
  connectionString: dbUrl.toString(),
  ssl: {
    ca: rdsCa,
    rejectUnauthorized: true
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'user-service',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to user-service on devchandra.shop',
    timestamp: new Date()
  });
});

app.post('/api/users/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM user_data.users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      token: createAuthToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('User login failed:', err.message);
    return res.status(500).json({ error: 'Unable to log in at this time' });
  }
});

app.post('/api/users/register', async (req, res) => {
  const name = typeof req.body.name === 'string'
    ? req.body.name.trim()
    : '';
  const email = typeof req.body.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  const password = typeof req.body.password === 'string'
    ? req.body.password
    : '';

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: 'Name must be between 2 and 100 characters'
    });
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      error: 'Password must be between 8 and 72 characters'
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO user_data.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token: createAuthToken(result.rows[0]),
      user: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }

    console.error('User registration failed:', err.message);
    return res.status(500).json({
      error: 'Unable to register user at this time'
    });
  }
});

async function start() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_data.users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(254) NOT NULL UNIQUE,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    app.listen(PORT, () => {
      console.log(`user-service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('User service startup failed:', err.message);
    process.exit(1);
  }
}

start();
