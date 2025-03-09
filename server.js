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

app.post('/api/match-result', (req, res) => {
    const { matchId, team1, team2, score1, score2, status, matchType, winner, loser, id_tournois } = req.body;

    db.run(`
        INSERT OR IGNORE INTO Match_ (id_match, id_tournois)
        VALUES (?, ?)
    `, [matchId, id_tournois]);

    db.run(`
        UPDATE Match_
        SET id_equipe1 = (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
            id_equipe2 = (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
            score_equipe1 = ?,
            score_equipe2 = ?,
            status = ?,
            winner = ?,
            loser = ?,
            match_type = ?
        WHERE id_match = ?
    `, [team1, team2, score1, score2, status, winner, loser, matchType, matchId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
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

// Route pour obtenir le classement général
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

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});