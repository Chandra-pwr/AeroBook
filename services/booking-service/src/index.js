const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20kb' }));

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters');
  process.exit(1);
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Login required' });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      issuer: 'aerobook-user-service',
      audience: 'aerobook-api',
      algorithms: ['HS256']
    });

    if (typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub)) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.authUserId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired login token' });
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.delete('sslmode');
dbUrl.searchParams.delete('uselibpqcompat');

const pool = new Pool({
  connectionString: dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'booking-service',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'AeroBook booking-service', timestamp: new Date() });
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const userId = Number(req.authUserId);
  const flightId = typeof req.body.flightId === 'string'
    ? req.body.flightId.trim()
    : '';

  if (!flightId || flightId.length > 100) {
    return res.status(400).json({ error: 'A valid flightId is required' });
  }

  try {
    const flight = await pool.query(
      `SELECT id, airline, TRIM(origin) AS origin,
              TRIM(destination) AS destination, price, TRIM(currency) AS currency
       FROM search_data.flights WHERE id = $1`,
      [flightId]
    );

    if (flight.rowCount === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const f = flight.rows[0];

    const result = await pool.query(
      `INSERT INTO booking_data.bookings
         (user_id, flight_id, airline, origin, destination, price, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING id, user_id, flight_id, airline, origin, destination,
                 price, currency, status, created_at`,
      [userId, f.id, f.airline, f.origin, f.destination, f.price, f.currency]
    );

    return res.status(201).json({
      message: 'Booking created',
      booking: { ...result.rows[0], price: Number(result.rows[0].price) }
    });
  } catch (err) {
    console.error('Booking creation failed:', err.message);
    return res.status(500).json({ error: 'Unable to create booking' });
  }
});

app.get('/api/bookings/:id', requireAuth, async (req, res) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }

  try {
    const result = await pool.query(
      `SELECT id, user_id, flight_id, airline, origin, destination,
              price, currency, status, created_at
       FROM booking_data.bookings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.authUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({
      booking: { ...result.rows[0], price: Number(result.rows[0].price) }
    });
  } catch (err) {
    console.error('Booking lookup failed:', err.message);
    return res.status(500).json({ error: 'Unable to retrieve booking' });
  }
});

async function start() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_data.bookings (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        flight_id VARCHAR(100) NOT NULL,
        airline VARCHAR(150) NOT NULL,
        origin CHAR(3) NOT NULL,
        destination CHAR(3) NOT NULL,
        price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
        currency CHAR(3) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    app.listen(PORT, () => {
      console.log(`booking-service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Booking service startup failed:', err.message);
    process.exit(1);
  }
}

start();
