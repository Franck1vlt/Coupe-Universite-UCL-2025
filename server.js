const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/live-matches', (req, res) => {
    try {
        // Récupérer tous les matchs avec le statut "en cours"
        db.all(`
            SELECT m.*, ms.status, ms.score1, ms.score2
            FROM rankings_matches m
            JOIN match_status ms ON m.match_id = ms.match_id
            WHERE ms.status = 'en cours'
        `, [], (err, rows) => {
            if (err) {
                console.error('Erreur DB:', err);
                res.status(500).json({ error: 'Erreur serveur' });
                return;
            }
            res.json({ matches: rows || [] });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
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

  // Vérifier si le statut est valide
  const validStatuses = ['à venir', 'en cours', 'terminé'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Statut invalide: ${status}` });
    return;
  }
  
  db.run(
    `INSERT OR REPLACE INTO match_status (match_id, status, score1, score2) 
     VALUES (?, ?, ?, ?)`,
    [matchId, status, score1, score2],
    (err) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du statut du match:', err);
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
            SUM(CASE WHEN r.category = 'BASKET' THEN r.points ELSE 0 END) AS basket_points,
            SUM(CASE WHEN r.category = 'FOOT' THEN r.points ELSE 0 END) AS foot_points,
            SUM(CASE WHEN r.category IN ('ambiance', 'route150') THEN r.points ELSE 0 END) AS bonus_points,
            SUM(r.points) AS total_points
        FROM rankings r
        GROUP BY r.team_name
        ORDER BY total_points DESC, r.team_name`,
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

// Ajouter un endpoint pour les points de football
app.post('/api/rankings/football/update', (req, res) => {
    const { team_name, points } = req.body;
    
    db.run(`
        INSERT INTO rankings (team_name, points, category) 
        VALUES (?, ?, 'FOOT')
        ON CONFLICT(team_name, category) 
        DO UPDATE SET points = ?`,
        [team_name, points, points],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/rankings/football', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'FOOT'
        ORDER BY points DESC`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

// Correction de la route pour recevoir les points du football
app.post('/api/points/football', (req, res) => {
  const { points } = req.body;
  
  try {
    // Utilisation d'une transaction pour s'assurer que toutes les mises à jour sont effectuées
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO rankings (team_name, points, category) 
        VALUES (?, ?, 'FOOT')
        ON CONFLICT(team_name, category) 
        DO UPDATE SET points = ?
      `);

      for (const [teamName, teamPoints] of Object.entries(points)) {
        stmt.run(teamName, teamPoints, teamPoints, (err) => {
          if (err) {
            console.error('Erreur pour équipe', teamName, ':', err);
          }
        });
      }

      stmt.finalize();

      res.json({ 
        success: true, 
        message: 'Points mis à jour avec succès'
      });
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des points:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour des points'
    });
  }
});

// Route spécifique pour le football
app.post('/api/rankings/football', (req, res) => {
    try {
        const points = req.body;
        
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT INTO rankings (team_name, points, category) 
                VALUES (?, ?, 'FOOT')
                ON CONFLICT(team_name, category) 
                DO UPDATE SET points = ?
            `);

            for (const [teamName, teamPoints] of Object.entries(points)) {
                stmt.run(teamName, teamPoints, teamPoints, (err) => {
                    if (err) {
                        console.error('Erreur pour équipe', teamName, ':', err);
                    }
                });
            }

            stmt.finalize();
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/rankings/football', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'FOOT'
        ORDER BY points DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ rankings: rows || [] });
    });
});

// Route pour mettre à jour le résultat d'un match
app.post('/api/match-result', async (req, res) => {
    const { matchId, team1, team2, score1, score2, status, matchType, winner, loser } = req.body;

    try {
        // Mise à jour dans la base de données
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO rankings_matches 
                (match_id, team1, team2, score1, score2, status, winner, loser, match_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [matchId, team1, team2, score1, score2, status, winner, loser, matchType],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Mise à jour du statut du match
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR REPLACE INTO match_status (match_id, status, score1, score2)
                VALUES (?, ?, ?, ?)`,
                [matchId, status, score1, score2],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Routes pour le basketball masculin
app.post('/api/rankings/basket_h/update', (req, res) => {
    const { team_name, points } = req.body;
    
    db.run(`
        INSERT INTO rankings (team_name, points, category) 
        VALUES (?, ?, 'BASKET_H')
        ON CONFLICT(team_name, category) 
        DO UPDATE SET points = ?`,
        [team_name, points, points],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/rankings/basket_h', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'BASKET_H'
        ORDER BY points DESC`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

// Routes pour le basketball féminin
app.post('/api/rankings/basket_f/update', (req, res) => {
    const { team_name, points } = req.body;
    
    db.run(`
        INSERT INTO rankings (team_name, points, category) 
        VALUES (?, ?, 'BASKET_F')
        ON CONFLICT(team_name, category) 
        DO UPDATE SET points = ?`,
        [team_name, points, points],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/rankings/basket_f', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'BASKET_F'
        ORDER BY points DESC`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

// Nouvelle route pour les points totaux de basket
app.post('/api/rankings/basket/update', (req, res) => {
    const points = req.body;
    
    try {
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT INTO rankings (team_name, points, category) 
                VALUES (?, ?, 'BASKET')
                ON CONFLICT(team_name, category) 
                DO UPDATE SET points = ?
            `);

            for (const [teamName, teamPoints] of Object.entries(points)) {
                stmt.run(teamName, teamPoints, teamPoints);
            }

            stmt.finalize();
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route pour récupérer les points totaux de basket
app.get('/api/rankings/basket', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'BASKET'
        ORDER BY points DESC`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ rankings: rows || [] });
        }
    );
});

// Routes pour le volleyball masculin
app.post('/api/rankings/volley_h/update', (req, res) => {
    const points = req.body;
    
    try {
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT INTO rankings (team_name, points, category) 
                VALUES (?, ?, 'VOLLEY_H')
                ON CONFLICT(team_name, category) 
                DO UPDATE SET points = ?
            `);

            for (const [teamName, teamPoints] of Object.entries(points)) {
                stmt.run(teamName, teamPoints, teamPoints);
            }

            stmt.finalize();
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/rankings/volley_h', (req, res) => {
    db.all(`
        SELECT team_name, points 
        FROM rankings 
        WHERE category = 'VOLLEY_H'
        ORDER BY points DESC`,
        [],
        (err, rows) => {
            if (err) {
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