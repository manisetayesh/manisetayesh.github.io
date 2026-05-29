require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'entries.json');
const ADMIN_KEY = process.env.ADMIN_KEY;

app.use(express.json());
app.use(express.static('public'));

app.get('/api/entries', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(data);
});

app.post('/api/entries', (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Running on http://localhost:3000'));