const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const NS = process.env.SERVICE_NAMESPACE || 'aerobook';

app.use(express.json());

// Internal only (not exposed through the ingress). Use:
//   kubectl port-forward -n aerobook deploy/admin-service 8080:3000
const SERVICES = ['user-service', 'flight-search-service', 'booking-service', 'payment-service', 'notification-service'];

async function checkService(name) {
  const started = Date.now();
  try {
    const response = await fetch(`http://${name}.${NS}.svc.cluster.local/health`, { signal: AbortSignal.timeout(3000) });
    return { service: name, status: response.ok ? 'UP' : 'DOWN', httpStatus: response.status, ms: Date.now() - started };
  } catch (err) {
    return { service: name, status: 'DOWN', error: err.message, ms: Date.now() - started };
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'admin-service', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to admin-service on devchandra.shop', timestamp: new Date() });
});

app.get('/api/admin/status', async (req, res) => {
  const services = await Promise.all(SERVICES.map(checkService));
  const allUp = services.every((s) => s.status === 'UP');
  res.status(allUp ? 200 : 503).json({ status: allUp ? 'ALL_UP' : 'DEGRADED', services, timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`admin-service running on port ${PORT}`);
});
