const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


// Route pour mettre à jour les résultats du tournoi
app.post('/api/tournois/update', async (req, res) => {
    console.log('Données reçues côté serveur:', req.body);
    const { id_tournois, id_sport, nom_tournois, matches } = req.body;

    try {
        db.serialize(() => {
            // Insérer d'abord le tournoi
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO Tournois (id_tournois, id_sport, nom_tournois)
                VALUES (?, ?, ?)
            `);
            stmt.run(id_tournois, id_sport, nom_tournois);
            stmt.finalize();

            // Ensuite insérer les matchs
            const matchStmt = db.prepare(`
                INSERT OR REPLACE INTO Match_ (
                    id_match, id_tournois, id_equipe1, id_equipe2,
                    score_equipe1, score_equipe2, status, winner, loser,
                    match_type, id_terrain
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const match of matches) {
                matchStmt.run(
                    match.id_match,
                    id_tournois, // Utiliser l'id_tournois du niveau supérieur
                    match.id_equipe1,
                    match.id_equipe2,
                    match.score1,
                    match.score2,
                    match.status,
                    match.winner,
                    match.loser,
                    match.match_type,
                    match.id_terrain,
                    (err) => {
                        if (err) console.error('Erreur pour le match', match.id_match, ':', err);
                    }
                );
            }

            matchStmt.finalize();
            res.json({ success: true, message: 'Tournoi mis à jour avec succès' });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour réinitialiser le tournoi
app.post('/api/tournois/reset', async (req, res) => {
    const { id_tournois, id_sport, nom_tournois } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run(`
                DELETE FROM Tournois 
                WHERE id_tournois = ? AND id_sport = ? AND nom_tournois = ?
            `, [id_tournois, id_sport, nom_tournois], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run(`
                DELETE FROM Match_
                WHERE id_match IN (
                    SELECT id_match FROM Tournois
                    WHERE id_tournois = ? AND id_sport = ? AND nom_tournois = ?
                )
            `, [id_tournois, id_sport, nom_tournois], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'Tournoi réinitialisé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du tournoi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la réinitialisation du tournoi'
        });
    }
});

// Route pour créer/mettre à jour le tournoi
app.post('/api/tournois', async (req, res) => {
    const { id_tournois, id_sport, nom_tournois } = req.body;
    
    try {
        await db.run(`
            INSERT OR REPLACE INTO Tournois (id_tournois, id_sport, nom_tournois)
            VALUES (?, ?, ?)`,
            [id_tournois, id_sport, nom_tournois]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la création du tournoi:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mettre à jour route match-result pour gérer correctement id_terrain
app.post('/api/match-result', (req, res) => {
    const { matchId, team1, team2, score1, score2, status, matchType, winner, loser, id_tournois } = req.body;

    db.serialize(() => {
        db.run(`
            INSERT OR REPLACE INTO Match_ (
                id_match, 
                id_tournois,
                id_equipe1,
                id_equipe2,
                score_equipe1,
                score_equipe2,
                status,
                winner,
                loser,
                match_type,
                id_terrain
            ) VALUES (
                ?,
                ?,
                (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
                (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
                ?, ?, ?, ?, ?, ?, 1
            )
        `, [matchId, id_tournois, team1, team2, score1, score2, status, winner, loser, matchType], 
        function(err) {
            if (err) {
                console.error('Erreur SQL:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            console.log('Match sauvegardé avec succès');
            res.json({ success: true });
        });
    });
});

// Mise à jour des points football
app.post('/api/points/football', async (req, res) => {
    const { sport_id, points } = req.body;

    try {
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO Points_Sport (id_equipe, id_sport, points)
                VALUES ((SELECT id_equipe FROM Equipe WHERE nom_equipe = ?), ?, ?)
            `);
            for (const [teamName, data] of Object.entries(points)) {
                stmt.run(teamName, sport_id, data.points);
            }
            stmt.finalize();
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route pour les points de handball
app.post('/api/points/handball', async (req, res) => {
    const { sport_id, points } = req.body;

    try {
        db.serialize(() => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO Points_Sport (id_equipe, id_sport, points)
                VALUES ((SELECT id_equipe FROM Equipe WHERE nom_equipe = ?), ?, ?)
            `);
            for (const [teamName, data] of Object.entries(points)) {
                stmt.run(teamName, sport_id, data.points);
            }
            stmt.finalize();
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route pour obtenir le classement général simplifiée
app.get('/api/rankings/general', (req, res) => {
    db.all(`
        SELECT 
            e.nom_equipe,
            SUM(ps.points) as total_points,
            GROUP_CONCAT(ps.points) as points_details
        FROM Equipe e
        LEFT JOIN Points_Sport ps ON e.id_equipe = ps.id_equipe
        GROUP BY e.id_equipe
        ORDER BY total_points DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ rankings: rows });
    });
});

// Route pour les points et matchs de handball
app.post('/api/points/handball', async (req, res) => {
    const { sport_id, points, matches } = req.body;

    try {
        db.serialize(() => {
            // 1. Créer/Mettre à jour le tournoi de handball
            db.run(`
                INSERT OR REPLACE INTO Tournois (id_tournois, id_sport, nom_tournois)
                VALUES (?, ?, ?)`,
                [2, 2, 'handball']  // id_tournois: 2 pour handball
            );

            // 2. Sauvegarder les points des équipes
            const pointsStmt = db.prepare(`
                INSERT OR REPLACE INTO Points_Sport (id_equipe, id_sport, points)
                VALUES ((SELECT id_equipe FROM Equipe WHERE nom_equipe = ?), ?, ?)
            `);
            for (const [teamName, data] of Object.entries(points)) {
                pointsStmt.run(teamName, sport_id, data.points);
            }
            pointsStmt.finalize();

            // 3. Sauvegarder les matchs
            if (matches) {
                const matchStmt = db.prepare(`
                    INSERT OR REPLACE INTO Match_ (
                        id_match, id_tournois, id_equipe1, id_equipe2,
                        score_equipe1, score_equipe2, status, winner, loser,
                        match_type, id_terrain
                    ) VALUES (?, 2, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const match of matches) {
                    matchStmt.run(
                        match.id_match,
                        match.id_equipe1,
                        match.id_equipe2,
                        match.score1,
                        match.score2,
                        match.status,
                        match.winner,
                        match.loser,
                        match.match_type,
                        8  // id_terrain: 8 pour petit gymnase (handball)
                    );
                }
                matchStmt.finalize();
            }
            res.json({ success: true });
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route pour obtenir le classement handball
app.get('/api/rankings/handball', (req, res) => {
    db.all(`
        SELECT e.nom_equipe, ps.points 
        FROM Equipe e
        LEFT JOIN Points_Sport ps ON e.id_equipe = ps.id_equipe
        WHERE ps.id_sport = 2
        ORDER BY ps.points DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ rankings: rows || [] });
    });
});

// Nouvelle route pour obtenir les matchs d'un sport spécifique
app.get('/api/matches/:sport', (req, res) => {
    const sportId = req.params.sport === 'football' ? 1 : 2; // 1 pour foot, 2 pour hand
    
    db.all(`
        SELECT * FROM Match_ m
        JOIN Tournois t ON m.id_tournois = t.id_tournois
        WHERE t.id_sport = ?
        ORDER BY m.id_match
    `, [sportId], (err, matches) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ matches });
    });
});

// Améliorer la route pour le statut des matchs
app.post('/api/match-status/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    const { status, score1, score2 } = req.body;

    console.log('Données reçues:', { matchId, status, score1, score2 });

    // Validation des données
    if (isNaN(matchId)) {
        return res.status(400).json({ 
            success: false, 
            error: 'ID de match invalide' 
        });
    }

    try {
        await new Promise((resolve, reject) => {
            const sql = `
                UPDATE Match_ 
                SET status = ?,
                    score_equipe1 = ?,
                    score_equipe2 = ?
                WHERE id_match = ?
            `;
            
            const params = [
                status || 'à_venir',
                score1 || 0,
                score2 || 0,
                matchId
            ];

            console.log('Exécution SQL:', sql, params);

            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Erreur SQL:', err);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });

        res.json({
            success: true,
            matchId,
            status,
            score1: score1 || 0,
            score2: score2 || 0
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Supprimer toutes les autres routes d'ambiance et garder uniquement celles-ci
app.get('/api/rankings/ambiance', async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.nom_equipe, COALESCE(pb.points, 0) as points 
                FROM Equipe e
                LEFT JOIN Points_Bonus pb ON e.id_equipe = pb.id_equipe AND pb.type_bonus = 'AMBIANCE'
                ORDER BY points DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({ rankings: result });
    } catch (error) {
        console.error('Erreur SQL:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rankings/ambiance/update', (req, res) => {
    const { teamName, points } = req.body;
    
    console.log('Requête de mise à jour reçue:', { teamName, points });

    if (!teamName) {
        return res.status(400).json({ success: false, error: 'Nom d\'équipe manquant' });
    }

    // Vérifier que points est un nombre valide
    if (isNaN(points) || points < 0) {
        return res.status(400).json({ success: false, error: 'Points invalides' });
    }

    db.serialize(() => {
        // Transaction pour assurer l'intégrité des données
        db.run('BEGIN TRANSACTION');

        db.get('SELECT id_equipe FROM Equipe WHERE nom_equipe = ?', [teamName], (err, row) => {
            if (err) {
                db.run('ROLLBACK');
                console.error('Erreur SQL:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            if (!row) {
                db.run('ROLLBACK');
                return res.status(404).json({ success: false, error: 'Équipe non trouvée' });
            }

            // Supprimer d'abord les points existants
            db.run('DELETE FROM Points_Bonus WHERE id_equipe = ? AND type_bonus = ?', 
                [row.id_equipe, 'AMBIANCE'], 
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ success: false, error: err.message });
                    }

                    // Puis insérer les nouveaux points
                    db.run(`
                        INSERT INTO Points_Bonus (id_equipe, type_bonus, points)
                        VALUES (?, 'AMBIANCE', ?)
                    `, [row.id_equipe, points], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            console.error('Erreur insertion:', err);
                            return res.status(500).json({ success: false, error: err.message });
                        }

                        db.run('COMMIT');
                        console.log('Points mis à jour:', {
                            teamName,
                            newPoints: points,
                            changes: this.changes
                        });

                        res.json({
                            success: true,
                            message: 'Points mis à jour avec succès',
                            data: { teamName, points }
                        });
                    });
                }
            );
        });
    });
});

// Modifier aussi la route GET pour être sûr d'avoir les bons points
app.get('/api/rankings/ambiance', (req, res) => {
    db.all(`
        SELECT 
            e.nom_equipe, 
            COALESCE(pb.points, 0) as points 
        FROM Equipe e
        LEFT JOIN Points_Bonus pb ON e.id_equipe = pb.id_equipe 
        AND pb.type_bonus = 'AMBIANCE'
        ORDER BY COALESCE(pb.points, 0) DESC, e.nom_equipe ASC
    `, [], (err, rows) => {
        if (err) {
            console.error('Erreur SQL:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ rankings: rows });
    });
});

// Route pour obtenir le classement Route150
app.get('/api/rankings/route150', async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.nom_equipe, COALESCE(pb.points, 0) as points 
                FROM Equipe e
                LEFT JOIN Points_Bonus pb ON e.id_equipe = pb.id_equipe AND pb.type_bonus = 'ROUTE150'
                ORDER BY points DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({ rankings: result });
    } catch (error) {
        console.error('Erreur SQL:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour mettre à jour les points Route150
app.post('/api/rankings/route150/update', (req, res) => {
    const { teamName, points } = req.body;
    
    console.log('Requête de mise à jour Route150 reçue:', { teamName, points });

    if (!teamName) {
        return res.status(400).json({ success: false, error: 'Nom d\'équipe manquant' });
    }

    if (isNaN(points) || points < 0) {
        return res.status(400).json({ success: false, error: 'Points invalides' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.get('SELECT id_equipe FROM Equipe WHERE nom_equipe = ?', [teamName], (err, row) => {
            if (err) {
                db.run('ROLLBACK');
                console.error('Erreur SQL:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            if (!row) {
                db.run('ROLLBACK');
                return res.status(404).json({ success: false, error: 'Équipe non trouvée' });
            }

            // Supprimer les points existants
            db.run('DELETE FROM Points_Bonus WHERE id_equipe = ? AND type_bonus = ?', 
                [row.id_equipe, 'ROUTE150'], 
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ success: false, error: err.message });
                    }

                    // Insérer les nouveaux points
                    db.run(`
                        INSERT INTO Points_Bonus (id_equipe, type_bonus, points)
                        VALUES (?, 'ROUTE150', ?)
                    `, [row.id_equipe, points], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            console.error('Erreur insertion:', err);
                            return res.status(500).json({ success: false, error: err.message });
                        }

                        db.run('COMMIT');
                        console.log('Points Route150 mis à jour:', {
                            teamName,
                            newPoints: points,
                            changes: this.changes
                        });

                        res.json({
                            success: true,
                            message: 'Points Route150 mis à jour avec succès',
                            data: { teamName, points }
                        });
                    });
                }
            );
        });
    });
});

// Route pour réinitialiser les points Route150
app.post('/api/rankings/route150/reset', (req, res) => {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM Points_Bonus WHERE type_bonus = ?', ['ROUTE150'], (err) => {
            if (err) {
                db.run('ROLLBACK');
                console.error('Erreur lors de la réinitialisation Route150:', err);
                return res.status(500).json({ success: false, error: err.message });
            }

            db.run('COMMIT');
            res.json({
                success: true,
                message: 'Points Route150 réinitialisés avec succès'
            });
        });
    });
});


// Route pour le classement général incluant les points d'ambiance
app.get('/api/rankings/general', (req, res) => {
    db.all(`
        SELECT 
            e.nom_equipe,
            COALESCE(SUM(CASE WHEN pb.type_bonus = 'AMBIANCE' THEN pb.points ELSE 0 END), 0) as ambiance_points,
            COALESCE(SUM(ps.points), 0) as sport_points,
            COALESCE(SUM(CASE WHEN pb.type_bonus = 'ROUTE150' THEN pb.points ELSE 0 END), 0) as route150_points,
            COALESCE(SUM(ps.points), 0) + 
            COALESCE(SUM(CASE WHEN pb.type_bonus = 'AMBIANCE' THEN pb.points ELSE 0 END), 0) +
            COALESCE(SUM(CASE WHEN pb.type_bonus = 'ROUTE150' THEN pb.points ELSE 0 END), 0) as total_points
        FROM Equipe e
        LEFT JOIN Points_Sport ps ON e.id_equipe = ps.id_equipe
        LEFT JOIN Points_Bonus pb ON e.id_equipe = pb.id_equipe
        GROUP BY e.id_equipe, e.nom_equipe
        ORDER BY total_points DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ rankings: rows });
    });
});

// Ajouter cette nouvelle route pour la réinitialisation
app.post('/api/rankings/ambiance/reset', (req, res) => {
    db.serialize(() => {
        // Transaction pour assurer l'intégrité des données
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM Points_Bonus WHERE type_bonus = ?', ['AMBIANCE'], (err) => {
            if (err) {
                db.run('ROLLBACK');
                console.error('Erreur lors de la réinitialisation:', err);
                return res.status(500).json({ success: false, error: err.message });
            }

            db.run('COMMIT');
            res.json({
                success: true,
                message: 'Points d\'ambiance réinitialisés avec succès'
            });
        });
    });
});

app.get('/api/rankings/handball', async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    e.nom_equipe as team_name,
                    COALESCE(SUM(
                        CASE 
                            WHEN m.winner = e.nom_equipe THEN 3
                            WHEN m.draw = 1 THEN 2
                            WHEN m.loser = e.nom_equipe THEN 1
                            ELSE 0
                        END
                    ), 0) as points
                FROM Equipe e
                LEFT JOIN Match_ m ON (e.nom_equipe = m.team1 OR e.nom_equipe = m.team2)
                    AND m.status = 'terminé'
                    AND m.id_terrain = 8  -- ID du terrain de handball
                GROUP BY e.nom_equipe
                ORDER BY points DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({ rankings: result });
    } catch (error) {
        console.error('Erreur SQL:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});