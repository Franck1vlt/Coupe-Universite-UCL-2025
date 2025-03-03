const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const port = 3000;

const liveMatches = [
    { sport: 'Football', teamA: 'Équipe A', teamB: 'Équipe B', scoreA: 1, scoreB: 2, chrono: '45:00' },
    { sport: 'Basketball', teamA: 'Équipe C', teamB: 'Équipe D', scoreA: 50, scoreB: 48, chrono: '30:00' },
    { sport: 'Volleyball', teamA: 'Équipe E', teamB: 'Équipe F', scoreA: 2, scoreB: 1, chrono: '20:00' }
];

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/live-matches', (req, res) => {
    res.json({ matches: liveMatches });
});

app.post('/api/update-match', (req, res) => {
    const { matchId, team1, team2, team1Score, team2Score, winner, loser, round } = req.body;
    // Mettre à jour la base de données avec les informations du match
    // Exemple : db.updateMatch(matchId, { team1, team2, team1Score, team2Score, winner, loser, round });
    console.log(`Match ${matchId} mis à jour : ${team1} ${team1Score} - ${team2Score} ${team2}`);
    res.status(200).send('Match mis à jour');
});

// Endpoint pour obtenir le statut d'un match
app.get('/api/match-status/:matchId', (req, res) => {
  const matchId = req.params.matchId;
  db.get(
    'SELECT status, score1, score2 FROM match_status WHERE match_id = ?',
    [matchId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row || { status: 'à venir', score1: 0, score2: 0 });
    }
  );
});

// Endpoint pour mettre à jour le statut d'un match
app.post('/api/match-status/:matchId', (req, res) => {
  const { matchId } = req.params;
  const { status, score1, score2 } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO match_status (match_id, status, score1, score2) 
     VALUES (?, ?, ?, ?)`,
    [matchId, status, score1, score2],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Routes pour l'ambiance
app.get('/api/rankings/ambiance', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'ambiance' 
        ORDER BY points DESC, team_name ASC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

app.post('/api/rankings/ambiance/update', (req, res) => {
    const { team, points } = req.body;
    // Vérifier si le retrait ne donne pas un score négatif
    db.get('SELECT points FROM rankings WHERE team_name = ? AND category = "ambiance"',
        [team],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const currentPoints = row ? row.points : 0;
            const newPoints = currentPoints + points;

            if (newPoints < 0) {
                res.status(400).json({ error: "Le score ne peut pas être négatif" });
                return;
            }

            db.run(`
                INSERT INTO rankings (team_name, points, category) 
                VALUES (?, ?, 'ambiance')
                ON CONFLICT(team_name, category) 
                DO UPDATE SET points = ?`,
                [team, newPoints, newPoints],
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ success: true, newPoints });
                }
            );
        }
    );
});

// Améliorer la route de réinitialisation
app.post('/api/rankings/ambiance/reset', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE rankings 
                SET points = 0 
                WHERE category = 'ambiance'`,
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Vérifier que la réinitialisation a bien été effectuée
        const verif = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM rankings WHERE category = 'ambiance' AND points > 0`, 
                function(err, row) {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (verif.count === 0) {
            res.json({ success: true, message: 'Tous les scores ont été réinitialisés' });
        } else {
            throw new Error('La réinitialisation n\'a pas été complète');
        }
    } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Erreur lors de la réinitialisation'
        });
    }
});

// Routes pour route150
app.get('/api/rankings/route150', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'route150' 
        ORDER BY points DESC, team_name ASC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

app.post('/api/rankings/route150/update', (req, res) => {
    const { team, points } = req.body;
    db.get('SELECT points FROM rankings WHERE team_name = ? AND category = "route150"',
        [team],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const currentPoints = row ? row.points : 0;
            const newPoints = currentPoints + points;

            if (newPoints < 0) {
                res.status(400).json({ error: "Le score ne peut pas être négatif" });
                return;
            }

            db.run(`
                INSERT INTO rankings (team_name, points, category) 
                VALUES (?, ?, 'route150')
                ON CONFLICT(team_name, category) 
                DO UPDATE SET points = ?`,
                [team, newPoints, newPoints],
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ success: true, newPoints });
                }
            );
        }
    );
});

app.post('/api/rankings/route150/reset', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE rankings 
                SET points = 0 
                WHERE category = 'route150'`,
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const verif = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM rankings WHERE category = 'route150' AND points > 0`, 
                function(err, row) {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (verif.count === 0) {
            res.json({ success: true, message: 'Tous les scores ont été réinitialisés' });
        } else {
            throw new Error('La réinitialisation n\'a pas été complète');
        }
    } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Erreur lors de la réinitialisation'
        });
    }
});

// Ajouter nouvelle route pour obtenir tous les points des sports
app.get('/api/rankings/sports', (req, res) => {
    db.all(`
        SELECT team_name, category, points 
        FROM rankings 
        WHERE category NOT IN ('ambiance', 'route150')
        ORDER BY team_name, category`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

// Ajouter une route pour obtenir le classement général
app.get('/api/rankings/general', (req, res) => {
    db.all(`
        SELECT 
            r.team_name,
            r.category,
            r.points,
            CASE 
                WHEN r.category IN ('ambiance', 'route150') THEN 'bonus'
                ELSE 'sport'
            END as point_type
        FROM rankings r
        ORDER BY r.team_name, r.category`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});