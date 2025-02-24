const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/sports', (req, res) => {
  db.all('SELECT * FROM sports', [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ sports: rows });
  });
});

app.post('/sports', (req, res) => {
  const { nom } = req.body;
  db.run('INSERT INTO sports (nom) VALUES (?)', [nom], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/terrains', (req, res) => {
  db.all('SELECT * FROM terrains', [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ terrains: rows });
  });
});

app.post('/terrains', (req, res) => {
  const { nom } = req.body;
  db.run('INSERT INTO terrains (nom) VALUES (?)', [nom], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/equipes/:sport_id', (req, res) => {
  db.all('SELECT * FROM equipes WHERE sport_id = ?', [req.params.sport_id], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ equipes: rows });
  });
});

app.post('/equipes', (req, res) => {
  const { sport_id, nom } = req.body;
  db.run('INSERT INTO equipes (sport_id, nom) VALUES (?, ?)', [sport_id, nom], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.listen(3000, () => console.log('Serveur démarré sur le port 3000'));
