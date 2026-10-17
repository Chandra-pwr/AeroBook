const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'admin-service', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to admin-service on devchandra.shop', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`admin-service running on port ${PORT}`);
});
