const fs = require('fs');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const dbUrl = new URL(process.env.NOTIFICATION_DB_URL);
dbUrl.searchParams.delete('sslmode');

const pool = new Pool({
  connectionString: dbUrl.toString(),
  ssl: {
    ca: fs.readFileSync('/etc/ssl/rds/global-bundle.pem', 'utf8'),
    rejectUnauthorized: true
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5
});

app.use(express.json({ limit: '20kb' }));

function formatNotification(row) {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    userId: String(row.user_id),
    flightId: row.flight_id || null,
    type: row.type,
    channel: row.channel,
    status: row.status,
    message: row.message,
    amount: row.amount === null ? null : Number(row.amount),
    currency: row.currency ? row.currency.trim() : null,
    createdAt: row.created_at,
    realEmailSent: row.real_email_sent,
    realSmsSent: row.real_sms_sent
  };
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'UP',
      service: 'notification-service',
      database: 'CONNECTED',
      mode: 'MOCK_ONLY'
    });
  } catch (err) {
    console.error('Health check database error:', err.message);
    res.status(503).json({
      status: 'DOWN',
      service: 'notification-service',
      database: 'DISCONNECTED'
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    service: 'notification-service',
    mode: 'MOCK_ONLY',
    storage: 'RDS_POSTGRESQL',
    realEmailEnabled: false,
    realSmsEnabled: false
  });
});

app.post('/api/notifications', async (req, res) => {
  const { bookingId, userId, flightId, amount, currency } = req.body;

  const booking = Number(bookingId);
  const user = Number(userId);

  if (
    !Number.isSafeInteger(booking) || booking <= 0 ||
    !Number.isSafeInteger(user) || user <= 0
  ) {
    return res.status(400).json({
      error: 'bookingId and userId must be positive integers'
    });
  }

  if (amount !== undefined &&
      (amount === null || !Number.isFinite(Number(amount)) ||
       Number(amount) < 0)) {
    return res.status(400).json({ error: 'amount must be a non-negative number' });
  }

  if (currency !== undefined &&
      (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency))) {
    return res.status(400).json({ error: 'currency must be a 3-letter code' });
  }

  try {
    const message = `Booking ${booking} confirmation notification generated`;

    const inserted = await pool.query(
      `INSERT INTO notification_data.notifications
        (booking_id, user_id, flight_id, type, channel, status,
         message, amount, currency)
       VALUES ($1, $2, $3, 'BOOKING_CONFIRMED', 'MOCK', 'CREATED',
               $4, $5, $6)
       ON CONFLICT (booking_id) DO NOTHING
       RETURNING *`,
      [
        booking,
        user,
        flightId || null,
        message,
        amount === undefined || amount === null ? null : Number(amount),
        currency ? currency.toUpperCase() : null
      ]
    );

    if (inserted.rows.length) {
      return res.status(201).json({
        message: 'Mock notification saved; no email or SMS was sent',
        notification: formatNotification(inserted.rows[0])
      });
    }

    const existing = await pool.query(
      `SELECT * FROM notification_data.notifications
       WHERE booking_id = $1`,
      [booking]
    );

    return res.status(200).json({
      message: 'Existing notification returned; no duplicate created',
      notification: formatNotification(existing.rows[0])
    });
  } catch (err) {
    console.error('Notification create error:', err.message);
    return res.status(500).json({ error: 'Unable to save notification' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notification_data.notifications ORDER BY id DESC`
    );

    res.json({
      count: result.rowCount,
      notifications: result.rows.map(formatNotification)
    });
  } catch (err) {
    console.error('Notification list error:', err.message);
    res.status(500).json({ error: 'Unable to retrieve notifications' });
  }
});

app.get('/api/notifications/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM notification_data.notifications WHERE id = $1`,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: formatNotification(result.rows[0]) });
  } catch (err) {
    console.error('Notification lookup error:', err.message);
    res.status(500).json({ error: 'Unable to retrieve notification' });
  }
});

app.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT} (RDS, MOCK ONLY)`);
});
