const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tournament.db');

// Créer les tables
db.serialize(() => {
    // Table Terrain
    db.run(`CREATE TABLE IF NOT EXISTS Terrain (
        id_terrain INTEGER PRIMARY KEY,
        nom_terrain TEXT
    )`);

    // Table Equipe
    db.run(`CREATE TABLE IF NOT EXISTS Equipe (
        id_equipe INTEGER PRIMARY KEY,
        nom_equipe TEXT
    )`);

    // Table Sport
    db.run(`CREATE TABLE IF NOT EXISTS Sport (
        id_sport INTEGER PRIMARY KEY,
        nom_sport TEXT
    )`);

    // Table Tournois
    db.run(`CREATE TABLE IF NOT EXISTS Tournois (
        id_tournois INTEGER PRIMARY KEY,
        id_sport INTEGER,
        nom_tournois TEXT,
        FOREIGN KEY(id_sport) REFERENCES Sport(id_sport)
    )`);

    // Table Match_
    db.run(`CREATE TABLE IF NOT EXISTS Match_ (
        id_match INTEGER PRIMARY KEY,
        id_tournois INTEGER,
        id_equipe1 INTEGER,
        id_equipe2 INTEGER,
        status TEXT,
        score_equipe1 INTEGER,
        score_equipe2 INTEGER,
        winner TEXT,
        loser TEXT,
        match_type TEXT,
        id_terrain INTEGER,
        is_classement BOOLEAN DEFAULT 0,
        FOREIGN KEY(id_terrain) REFERENCES Terrain(id_terrain),
        FOREIGN KEY(id_tournois) REFERENCES Tournois(id_tournois)
    )`);

    // Table Classement_Tournois
    db.run(`CREATE TABLE IF NOT EXISTS Classement_Tournois (
        id_classement_tournois INTEGER PRIMARY KEY AUTOINCREMENT,
        classement INTEGER,
        points INTEGER,
        id_tournois INTEGER NOT NULL,
        id_equipe INTEGER NOT NULL,
        FOREIGN KEY(id_tournois) REFERENCES Tournois(id_tournois),
        FOREIGN KEY(id_equipe) REFERENCES Equipe(id_equipe)
    )`);

    // Table Participation
    db.run(`CREATE TABLE IF NOT EXISTS Participation (
        id_participation INTEGER PRIMARY KEY AUTOINCREMENT,
        id_equipe INTEGER NOT NULL,
        id_sport INTEGER NOT NULL,
        FOREIGN KEY(id_equipe) REFERENCES Equipe(id_equipe),
        FOREIGN KEY(id_sport) REFERENCES Sport(id_sport)
    )`);

    // Table Match_Equipe
    db.run(`CREATE TABLE IF NOT EXISTS Match_Equipe (
        id_equipe INTEGER,
        id_match INTEGER,
        PRIMARY KEY(id_equipe, id_match),
        FOREIGN KEY(id_equipe) REFERENCES Equipe(id_equipe),
        FOREIGN KEY(id_match) REFERENCES Match_(id_match)
    )`);

    // Ajouter une table pour les points bonus
    db.run(`CREATE TABLE IF NOT EXISTS Points_Bonus (
        id_points_bonus INTEGER PRIMARY KEY AUTOINCREMENT,
        id_equipe INTEGER,
        type_bonus TEXT CHECK(type_bonus IN ('AMBIANCE', 'ROUTE150')),
        points INTEGER,
        FOREIGN KEY(id_equipe) REFERENCES Equipe(id_equipe)
    )`);

    // Ajouter une table pour les points par sport
    db.run(`CREATE TABLE IF NOT EXISTS Points_Sport (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_equipe INTEGER,
        id_sport INTEGER,
        points INTEGER,
        UNIQUE(id_equipe, id_sport),
        FOREIGN KEY(id_equipe) REFERENCES Equipe(id_equipe),
        FOREIGN KEY(id_sport) REFERENCES Sport(id_sport)
    )`);
});

// Initialisation des données de base
db.serialize(() => {
    // Insertion des sports
    db.run(`INSERT OR IGNORE INTO Sport (id_sport, nom_sport) VALUES 
        (1, 'FOOT'),
        (2, 'HANDBALL'),
        (3, 'BASKET'),
        (4, 'BADMINTON'),
        (5, 'VOLLEY_H'),
        (6, 'VOLLEY_F'),
        (7, 'PETANQUE'),
        (8, 'FLECHETTES'),
        (9, 'AMBIANCE'),
        (10, 'ROUTE150')`);

    // Insertion des équipes
    db.run(`INSERT OR IGNORE INTO Equipe (id_equipe, nom_equipe) VALUES 
        (1, 'FGES'),
        (2, 'FMMS'),
        (3, 'FLD'),
        (4, 'ICAM'),
        (5, 'IKPO'),
        (6, 'JUNIA'),
        (7, 'ESPAS-ESTICE'),
        (8, 'ESPOL'),
        (9, 'USCHOOL'),
        (10, 'FLSH'),
        (11, 'IESEG'),
        (12, 'ESSLIL'),
        (13, 'ISTC'),
        (14, 'PIKTURA'),
        (15, 'LiDD')`);

    // Mise à jour des terrains avec les vrais terrains
    db.run(`INSERT OR IGNORE INTO Terrain (id_terrain, nom_terrain) VALUES 
        (1, 'Terrain de football'),
        (2, 'Cible 1'),
        (3, 'Cible 2'),
        (4, 'Cible 3'),
        (5, 'Cible 4'),
        (6, 'Pétanque 1'),
        (7, 'Pétanque 2'),
        (8, 'Petit gymnase'),
        (9, 'Grand gymnase')`);

    // Ajout d'une table d'association sport-terrain
    db.run(`CREATE TABLE IF NOT EXISTS Sport_Terrain (
        id_sport INTEGER,
        id_terrain INTEGER,
        PRIMARY KEY(id_sport, id_terrain),
        FOREIGN KEY(id_sport) REFERENCES Sport(id_sport),
        FOREIGN KEY(id_terrain) REFERENCES Terrain(id_terrain)
    )`);

    // Association des sports avec leurs terrains
    db.run(`INSERT OR IGNORE INTO Sport_Terrain (id_sport, id_terrain) VALUES
        (1, 1),  -- Football -> Terrain de football
        (2, 8),  -- Handball -> Petit gymnase
        (3, 9),  -- Basket -> Grand gymnase
        (4, 8),  -- Badminton -> Petit gymnase
        (5, 9),  -- Volley H -> Grand gymnase
        (6, 9),  -- Volley F -> Grand gymnase
        (7, 6),  -- Pétanque -> Pétanque 1
        (7, 7),  -- Pétanque -> Pétanque 2
        (8, 2),  -- Fléchettes -> Cible 1
        (8, 3),  -- Fléchettes -> Cible 2
        (8, 4),  -- Fléchettes -> Cible 3
        (8, 5)   -- Fléchettes -> Cible 4`);
});

module.exports = db;
