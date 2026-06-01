require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'entries.json');

app.use(express.json());
app.use(express.static('.'));

app.get('/api/entries', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
  res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
});

app.post('/api/entries', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.post('/api/push', (req, res) => {
  try {
    execSync('git add data/entries.json');
    execSync(`git commit -m "entries: ${new Date().toLocaleDateString('en-CA')}"`);
    execSync('git push');
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, message: 'nothing to push' });
  }
});

app.listen(3000, () => console.log('Running on http://localhost:3000'));