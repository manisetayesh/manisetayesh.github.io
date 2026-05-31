require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'entries.json');

app.use(express.json());
app.use(express.static('public'));

app.get('/api/entries', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
});

app.post('/api/entries', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Running on http://localhost:3000'));