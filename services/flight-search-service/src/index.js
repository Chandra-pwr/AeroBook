
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Handle SSL options explicitly so URL parameters don't override them.
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

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'flight-search-service',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to flight-search-service on devchandra.shop',
    timestamp: new Date()
  });
});

app.get('/api/flights/search', async (req, res) => {
  const origin = String(req.query.origin || '').trim().toUpperCase();
  const destination = String(req.query.destination || '').trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return res.status(400).json({
      error: 'origin and destination must be valid 3-letter airport codes, e.g. DEL and BOM'
    });
  }

  if (origin === destination) {
    return res.status(400).json({
      error: 'Origin and destination must be different'
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         id,
         airline,
         TRIM(origin) AS origin,
         TRIM(destination) AS destination,
         TO_CHAR(departure, 'HH24:MI') AS departure,
         TO_CHAR(arrival, 'HH24:MI') AS arrival,
         price,
         currency
       FROM search_data.flights
       WHERE origin = $1 AND destination = $2
       ORDER BY departure`,
      [origin, destination]
    );

    const flights = result.rows.map((flight) => ({
      ...flight,
      price: Number(flight.price)
    }));

    return res.json({
      origin,
      destination,
      count: flights.length,
      source: 'database',
      flights
    });
  } catch (err) {
    console.error('Flight search database query failed:', err.message);
    return res.status(500).json({
      error: 'Unable to search flights at this time'
    });
  }
});

app.listen(PORT, () => {
  console.log(`flight-search-service running on port ${PORT}`);
});

