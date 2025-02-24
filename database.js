const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./scores.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS sports (id INTEGER PRIMARY KEY, nom TEXT UNIQUE)");
  db.run("CREATE TABLE IF NOT EXISTS terrains (id INTEGER PRIMARY KEY, nom TEXT UNIQUE)");
  db.run("CREATE TABLE IF NOT EXISTS equipes (id INTEGER PRIMARY KEY, sport_id INTEGER, nom TEXT, FOREIGN KEY(sport_id) REFERENCES sports(id))");
  db.run("CREATE TABLE IF NOT EXISTS matchs (id INTEGER PRIMARY KEY, sport_id INTEGER, terrain_id INTEGER, equipe1_id INTEGER, equipe2_id INTEGER, score1 INTEGER, score2 INTEGER, phase TEXT, vainqueur_va_au_match_id INTEGER, en_cours BOOLEAN, FOREIGN KEY(sport_id) REFERENCES sports(id), FOREIGN KEY(terrain_id) REFERENCES terrains(id))");
  db.run("CREATE TABLE IF NOT EXISTS historique_modifications (id INTEGER PRIMARY KEY, match_id INTEGER, ancienne_equipe_id INTEGER, nouvelle_equipe_id INTEGER, utilisateur TEXT, date TEXT)");
});

module.exports = db;
