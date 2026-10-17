const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'flight-search-service', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to flight-search-service on devchandra.shop', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`flight-search-service running on port ${PORT}`);
});
