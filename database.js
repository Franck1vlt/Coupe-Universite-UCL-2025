const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./scores.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS sports (id INTEGER PRIMARY KEY, nom TEXT UNIQUE)");
  db.run("CREATE TABLE IF NOT EXISTS terrains (id INTEGER PRIMARY KEY, nom TEXT UNIQUE)");
  db.run("CREATE TABLE IF NOT EXISTS equipes (id INTEGER PRIMARY KEY, sport_id INTEGER, nom TEXT, FOREIGN KEY(sport_id) REFERENCES sports(id))");
  db.run("CREATE TABLE IF NOT EXISTS matchs (id INTEGER PRIMARY KEY, sport_id INTEGER, terrain_id INTEGER, equipe1_id INTEGER, equipe2_id INTEGER, score1 INTEGER, score2 INTEGER, phase TEXT, vainqueur_va_au_match_id INTEGER, en_cours BOOLEAN, FOREIGN KEY(sport_id) REFERENCES sports(id), FOREIGN KEY(terrain_id) REFERENCES terrains(id))");
  db.run("CREATE TABLE IF NOT EXISTS historique_modifications (id INTEGER PRIMARY KEY, match_id INTEGER, ancienne_equipe_id INTEGER, nouvelle_equipe_id INTEGER, utilisateur TEXT, date TEXT)");

  // Ajouter une table pour les statuts de match
  db.run(`CREATE TABLE IF NOT EXISTS match_status (
    match_id INTEGER PRIMARY KEY,
    status TEXT CHECK(status IN ('à venir', 'en cours', 'terminé')),
    score1 INTEGER DEFAULT 0,
    score2 INTEGER DEFAULT 0,
    FOREIGN KEY(match_id) REFERENCES matchs(id)
  )`);

  // Initialiser les statuts des matchs s'ils n'existent pas déjà
  for (let i = 1; i <= 15; i++) {
    db.run(`INSERT OR IGNORE INTO match_status (match_id, status, score1, score2) 
            VALUES (?, 'à venir', 0, 0)`, [i]);
  }

  // Marquer les matchs de qualification comme terminés
  const qualificationMatches = [
    { id: 1, score1: 5, score2: 0 },
    { id: 2, score1: 1, score2: 0 },
    { id: 3, score1: 1, score2: 5 },
    { id: 4, score1: 14, score2: 0 }
  ];

  qualificationMatches.forEach(match => {
    db.run(`UPDATE match_status 
            SET status = 'terminé', score1 = ?, score2 = ? 
            WHERE match_id = ?`,
            [match.score1, match.score2, match.id]);
  });

  // Ajouter la table rankings
  db.run(`CREATE TABLE IF NOT EXISTS rankings (
    id INTEGER PRIMARY KEY,
    team_name TEXT,
    points INTEGER DEFAULT 0,
    category TEXT,
    UNIQUE(team_name, category)
  )`);

  // Ajouter la table rankings_matches
  db.run(`CREATE TABLE IF NOT EXISTS rankings_matches (
    match_id TEXT PRIMARY KEY,
    team1 TEXT,
    team2 TEXT,
    score1 INTEGER,
    score2 INTEGER,
    status TEXT DEFAULT 'à_venir',
    winner TEXT,
    loser TEXT,
    match_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Initialiser les équipes avec 0 points pour l'ambiance
  const teams = [
    'ESPAS-ESTICE', 'ESPOL', 'ESSLIL', 'FGES', 'FLD', 'FLSH', 'FMMS', 
    'ICAM', 'IESEG', 'IKPO', 'ISTC', 'JUNIA', 'LiDD', 'USCHOOL'
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO rankings (team_name, points, category) VALUES (?, 0, ?)`);
  teams.forEach(team => {
    stmt.run(team, 'ambiance');
    stmt.run(team, 'route150');
  });
  stmt.finalize();

  // Insérer le terrain de football par défaut
  db.run(`INSERT OR IGNORE INTO terrains (nom) VALUES ('Terrain de football')`);
});

module.exports = db;
