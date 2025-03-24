const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Routes de base
app.get('/api', (req, res) => {
  res.json({ message: 'API de la Coupe Universitaire UCL 2025' });
});

// Importer les routes API
const tournoiRoutes = require('./routes/api');
app.use('/api', tournoiRoutes);

// Configurer Socket.IO pour la communication en temps réel
io.on('connection', (socket) => {
    console.log('Un client s\'est connecté:', socket.id);
    
    // Ajouter une variable pour suivre le tournoi du client
    let clientTournament = null;
    
    // Écouter l'événement pour rejoindre un tournoi spécifique
    socket.on('join_tournament', (data) => {
        if (data.tournamentId) {
            clientTournament = data.tournamentId;
            socket.join(data.tournamentId); // Rejoindre une salle spécifique au tournoi
            console.log(`Client ${socket.id} a rejoint le tournoi: ${clientTournament}`);
        }
    });
    
    // Envoyer immédiatement les données des matchs au nouveau client
    db.all(`
        SELECT 
            m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
            m.status, m.winner, m.loser, m.match_type, m.id_terrain,
            e1.nom_equipe as team1, e2.nom_equipe as team2
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        WHERE m.id_tournois = 4
        ORDER BY m.id_match
    `, [], (err, matches) => {
        if (err) {
            console.error('Erreur lors de la récupération des matchs pour le client WebSocket:', err);
            socket.emit('matches_error', { error: err.message });
        } else {
            // Normaliser les données avant de les envoyer
            const normalizedMatches = matches.map(match => ({
                ...match,
                score_equipe1: match.score_equipe1 || 0,
                score_equipe2: match.score_equipe2 || 0,
                status: match.status || 'à_venir',
                match_type: match.match_type || 'qualification',
            }));
            
            socket.emit('matches_data', { 
                success: true,
                matches: normalizedMatches,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Écouter les mises à jour de match du client
    socket.on('update_match', (data) => {
        console.log('Mise à jour de match reçue:', data);
        
        // Mettre à jour la base de données
        const { matchId, status, score1, score2, winner, loser, tournamentId } = data;
        
        // Ajouter le tournoi à la diffusion
        db.run(`
            UPDATE Match_ 
            SET status = ?,
                score_equipe1 = ?,
                score_equipe2 = ?,
                winner = ?,
                loser = ?
            WHERE id_match = ?
        `, [status, score1, score2, winner, loser, matchId], function(err) {
            if (err) {
                console.error('Erreur lors de la mise à jour du match via WebSocket:', err);
                socket.emit('update_match_error', { error: err.message });
            } else {
                // Diffuser la mise à jour uniquement aux clients du même tournoi
                if (tournamentId) {
                    io.to(tournamentId).emit('match_updated', data);
                } else {
                    io.emit('match_updated', data); // Fallback pour la rétrocompatibilité
                }
                socket.emit('update_match_success', { matchId });
            }
        });
    });

    // Écouter les mises à jour de statut de match
    socket.on('update_match_status', (data) => {
        console.log('Mise à jour du statut de match reçue:', data);
        
        // Mettre à jour la base de données
        const { matchId, status, score1, score2, tournamentId } = data;
        
        db.run(`
            UPDATE Match_ 
            SET status = ?,
                score_equipe1 = ?,
                score_equipe2 = ?
            WHERE id_match = ?
        `, [status, score1 || 0, score2 || 0, matchId], function(err) {
            if (err) {
                console.error('Erreur lors de la mise à jour du statut via WebSocket:', err);
                socket.emit('update_status_error', { error: err.message });
            } else {
                // Diffuser la mise à jour uniquement aux clients du même tournoi
                if (tournamentId) {
                    io.to(tournamentId).emit('match_status_updated', data);
                } else {
                    io.emit('match_status_updated', data); // Fallback pour la rétrocompatibilité
                }
                socket.emit('update_status_success', { matchId });
                console.log(`Statut du match ${matchId} mis à jour avec succès: ${status}`);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
    });

    // Ajouter cette configuration WebSocket pour la réinitialisation du tournoi sauf qualifs
    socket.on('reset_tournament_except_qualif', async (data) => {
        console.log('Demande de réinitialisation du tournoi (sauf qualifications) reçue:', data);
        
        const { id_tournois } = data;
        
        try {
            await new Promise((resolve, reject) => {
                // Réinitialiser seulement les matchs après les qualifications (id_match > 3)
                db.run(`
                    UPDATE Match_ 
                    SET score_equipe1 = NULL,
                        score_equipe2 = NULL,
                        status = 'à_venir',
                        winner = NULL,
                        loser = NULL
                    WHERE id_tournois = ? AND id_match > 3
                `, [id_tournois], function(err) {
                    if (err) {
                        console.error('Erreur SQL lors de la réinitialisation du tournoi:', err);
                        reject(err);
                    } else {
                        console.log(`Tournoi ${id_tournois} réinitialisé avec succès (sauf qualifications), ${this.changes} match(s) affecté(s)`);
                        resolve();
                    }
                });
            });
            
            // Réinitialiser également les équipes des demi-finales, petite finale et finale
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE Match_ 
                    SET id_equipe1 = NULL,
                        id_equipe2 = NULL
                    WHERE id_tournois = ? AND id_match > 7
                `, [id_tournois], function(err) {
                    if (err) {
                        console.error('Erreur SQL lors de la réinitialisation des équipes:', err);
                        reject(err);
                    } else {
                        console.log(`Équipes des matchs avancés réinitialisées avec succès, ${this.changes} match(s) affecté(s)`);
                        resolve();
                    }
                });
            });
            
            // Envoyer une notification à tous les clients connectés
            io.emit('tournament_reset', { id_tournois });
            
            // Envoyer confirmation au client qui a fait la demande
            socket.emit('reset_success', { message: 'Tournoi réinitialisé avec succès (sauf qualifications)' });
            
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du tournoi:', error);
            socket.emit('reset_error', { message: error.message });
        }
    });
});

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
    const { matchId, team1, team2, score1, score2, status, matchType, winner, loser } = req.body;
    const id_tournois = req.body.id_tournois || 4; // 4 pour le tournoi de volleyball hommes (valeur par défaut)

    console.log('Données reçues pour match-result:', { 
        matchId, team1, team2, score1, score2, status, matchType, winner, loser, id_tournois 
    });

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
                ?, ?, ?, ?, ?, ?, 9
            )
        `, [matchId, id_tournois, team1, team2, score1, score2, status, winner, loser, matchType], 
        function(err) {
            if (err) {
                console.error('Erreur SQL dans match-result:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            console.log('Match sauvegardé avec succès');
            
            // Notifier tous les clients connectés de la mise à jour
            io.emit('match_updated', {
                matchId,
                team1,
                team2,
                score1,
                score2,
                status,
                winner,
                loser,
                matchType
            });
            
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
                    ) VALUES (?, 2, ?, ?, ?, ?, ?, ?, ?, ?, 8)
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
    const { status, score1, score2, id_terrain } = req.body;

    console.log('Données reçues:', { matchId, status, score1, score2, id_terrain });

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
                    score_equipe2 = ?,
                    id_terrain = ?
                WHERE id_match = ?
            `;
            
            const params = [
                status || 'à_venir',
                score1 || 0,
                score2 || 0,
                id_terrain || 9,  // 9 pour le grand gymnase (volley) par défaut
                matchId
            ];

            console.log('Exécution SQL:', sql, params);

            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Erreur SQL:', err);
                    reject(err);
                } else {
                    console.log(`Mise à jour réussie pour le match ${matchId}, ${this.changes} ligne(s) modifiée(s)`);
                    resolve(this.changes);
                }
            });
        });

        // Notifier tous les clients connectés
        io.emit('match_status_updated', {
            matchId,
            status,
            score1: score1 || 0,
            score2: score2 || 0,
            id_terrain: id_terrain || 9
        });

        res.json({
            success: true,
            matchId,
            status,
            score1: score1 || 0,
            score2: score2 || 0,
            id_terrain: id_terrain || 9
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ajout d'une route pour récupérer l'état actuel d'un match
app.get('/api/match-status/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    
    if (isNaN(matchId)) {
        return res.status(400).json({ 
            success: false, 
            error: 'ID de match invalide' 
        });
    }
    
    try {
        const result = await new Promise((resolve, reject) => {
            db.get(`
                SELECT status, score_equipe1 as score1, score_equipe2 as score2, id_terrain
                FROM Match_
                WHERE id_match = ?
            `, [matchId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Match non trouvé'
            });
        }
        
        res.json({
            success: true,
            matchId,
            ...result
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

// Route pour gérer les points du volleyball féminin
app.post('/api/points/volley-f', (req, res) => {
    const { points } = req.body;

    if (!points || typeof points !== 'object') {
        return res.status(400).json({ error: 'Invalid data format. Expected an object with team points.' });
    }

    console.log('Points reçus pour le volleyball féminin:', points);

    // Simuler une sauvegarde des points (par exemple, dans une base de données)
    // Vous pouvez remplacer cette partie par une logique réelle de sauvegarde
    try {
        // Exemple : sauvegarder dans un fichier JSON ou une base de données
        // fs.writeFileSync('volley-f-points.json', JSON.stringify(points, null, 2));
        res.status(200).json({ message: 'Points mis à jour avec succès.', data: points });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des points:', error);
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Routes pour le basket
app.post('/api/rankings/basket/update', (req, res) => {
    const { points } = req.body;
    
    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO Points_Sport (id_equipe, id_sport, points)
            VALUES ((SELECT id_equipe FROM Equipe WHERE nom_equipe = ?), 3, ?)
        `);
        
        for (const [teamName, teamPoints] of Object.entries(points)) {
            stmt.run(teamName, teamPoints);
        }
        
        stmt.finalize();
        res.json({ success: true });
    });
});

app.post('/api/matches/basket/update', (req, res) => {
    const { matchId, team1, team2, score1, score2, status, matchType } = req.body;
    
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
            3,
            (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
            (SELECT id_equipe FROM Equipe WHERE nom_equipe = ?),
            ?, ?, ?,
            CASE WHEN ? > ? THEN ? WHEN ? > ? THEN ? ELSE NULL END,
            CASE WHEN ? > ? THEN ? WHEN ? > ? THEN ? ELSE NULL END,
            ?, 9
        )
    `, [matchId, team1, team2, score1, score2, status, 
        score1, score2, team1, score2, score1, team2,
        score1, score2, team2, score2, score1, team1,
        matchType], 
    (err) => {
        if (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Route pour récupérer les données d'un match spécifique
app.get('/api/matches/basket/:matchId', (req, res) => {
    const matchId = parseInt(req.params.matchId);

    db.get(`
        SELECT id_match, score_equipe1 as score1, score_equipe2 as score2, status, winner, loser
        FROM Match_
        WHERE id_match = ?
    `, [matchId], (err, row) => {
        if (err) {
            console.error('Erreur SQL:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, error: 'Match non trouvé' });
        }
        res.json(row);
    });
});

// Nouvelle route pour obtenir tous les matchs d'un tournoi spécifique (volleyball)
app.get('/api/matches/volleyball', (req, res) => {
    db.all(`
        SELECT 
            m.id_match, 
            m.id_tournois, 
            m.score_equipe1, 
            m.score_equipe2, 
            m.status, 
            m.winner, 
            m.loser,
            m.match_type, 
            m.id_terrain,
            e1.nom_equipe as team1, 
            e2.nom_equipe as team2
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        WHERE m.id_tournois = 4
        ORDER BY m.id_match
    `, [], (err, matches) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ matches });
    });
});

// Ajouter cette route API pour la réinitialisation HTTP (fallback)
app.post('/api/tournois/reset-except-qualif', async (req, res) => {
    const { id_tournois } = req.body;
    
    if (!id_tournois) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de tournoi manquant'
        });
    }

    try {
        // Réinitialiser seulement les matchs après les qualifications (id_match > 3)
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE Match_ 
                SET score_equipe1 = NULL,
                    score_equipe2 = NULL,
                    status = 'à_venir',
                    winner = NULL,
                    loser = NULL
                WHERE id_tournois = ? AND id_match > 3
            `, [id_tournois], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        // Réinitialiser également les équipes des demi-finales, petite finale et finale
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE Match_ 
                SET id_equipe1 = NULL,
                    id_equipe2 = NULL
                WHERE id_tournois = ? AND id_match > 7
            `, [id_tournois], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        // Envoyer une notification à tous les clients connectés via WebSocket
        io.emit('tournament_reset', { id_tournois });

        res.json({ 
            success: true, 
            message: 'Tournoi réinitialisé avec succès (sauf qualifications)'
        });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du tournoi:', error);
        res.status(500).json({ 
            success: false, 
            message: `Erreur lors de la réinitialisation: ${error.message}`
        });
    }
});

// Nouvelle route pour obtenir tous les matchs d'un tournoi spécifique (volleyball feminin)
app.get('/api/matches/volleyballF', (req, res) => {
    // Vérification de l'existence préalable des matchs
    db.get(`SELECT COUNT(*) as count FROM Match_ WHERE id_tournois = 5`, [], (err, countResult) => {
        if (err) {
            console.error('Erreur lors du comptage des matchs de volleyball feminin:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message,
                errorCode: 'DB_COUNT_ERROR',
                matches: [] // Toujours inclure un tableau matches vide
            });
        }
        
        console.log(`Comptage des matchs de volleyball feminin: ${countResult ? countResult.count : 0}`);
        
        // Récupérer les matchs existants
        db.all(`
            SELECT 
                m.id_match, 
                m.id_tournois, 
                m.score_equipe1, 
                m.score_equipe2, 
                m.status, 
                m.winner, 
                m.loser,
                m.match_type, 
                m.id_terrain,
                e1.nom_equipe as team1, 
                e2.nom_equipe as team2
            FROM Match_ m
            LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
            LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
            WHERE m.id_tournois = 5
            ORDER BY m.id_match
        `, [], (err, matches) => {
            if (err) {
                console.error('Erreur lors de la récupération des matchs de volleyball feminin:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: err.message,
                    errorCode: 'DB_FETCH_ERROR',
                    matches: []
                });
            }
            
            // Normaliser les valeurs nulles pour éviter les problèmes de désérialisation
            if (matches) {
                matches.forEach(match => {
                    if (match.score_equipe1 === null) match.score_equipe1 = 0;
                    if (match.score_equipe2 === null) match.score_equipe2 = 0;
                    if (!match.status) match.status = 'à_venir';
                    if (!match.match_type) match.match_type = 'qualification';
                });
            }
            
            res.json({ 
                success: true,
                count: matches ? matches.length : 0,
                matches: matches || [],
                timestamp: new Date().toISOString()
            });
        });
    });
});

// Route pour mettre à jour les matchs de volleyball feminin
app.post('/api/matches/volleyballF', (req, res) => {
    console.log('Mise à jour des matchs de volleyball feminin:', req.body);
    
    const { tournamentState } = req.body;
    
    if (!tournamentState || !tournamentState.matches) {
        return res.status(400).json({
            success: false,
            error: 'Format de données incorrect'
        });
    }
    
    try {
        db.serialize(() => {
            // S'assurer que le tournoi existe
            db.run(`
                INSERT OR IGNORE INTO Tournois (id_tournois, id_sport, nom_tournois)
                VALUES (5, 4, 'volleyball_femmes')
            `);
            
            // Préparer la requête pour les matchs
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO Match_ (
                    id_match, id_tournois, score_equipe1, score_equipe2, status, winner, loser, match_type, id_terrain
                ) VALUES (?, 5, ?, ?, ?, ?, ?, ?, 9)
            `);
            
            // Insérer/mettre à jour chaque match
            Object.entries(tournamentState.matches).forEach(([matchId, match]) => {
                stmt.run(
                    matchId,
                    match.score1 || 0,
                    match.score2 || 0,
                    match.status || 'à_venir',
                    match.winner || null,
                    match.loser || null,
                    match.matchType || 'qualification'
                    // id_terrain = 9 est ajouté dans la requête SQL
                );
            });
            
            stmt.finalize();
            
            res.json({
                success: true,
                message: 'Matches de volleyball feminin mis à jour'
            });
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des matchs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route générique pour les données de tournoi (fallback)
app.post('/api/tournament', (req, res) => {
    console.log('Données de tournoi reçues:', req.body);
    const { sport, data } = req.body;
    
    if (!sport || !data) {
        return res.status(400).json({
            success: false,
            error: 'Format de données incorrect'
        });
    }
    
    // Simple réponse de confirmation sans persistance réelle
    // Cette route peut être améliorée plus tard pour une persistance complète
    res.json({
        success: true,
        message: `Données du tournoi ${sport} reçues avec succès`
    });
});

app.head('/api/matches/volleyballF', (req, res) => {
    // Réponse vide avec code 200 pour accepter les requêtes HEAD
    return res.sendStatus(200);
});

app.head('/api/matches/volleyball', (req, res) => {
    // Réponse vide avec code 200 pour accepter les requêtes HEAD
    return res.sendStatus(200);
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

server.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});

// Initialisation de Socket.io pour le handball
const handballSocket = require('./handball-socket')(io);

// Ajout de la route pour les points du handball
app.post('/api/points/handball', (req, res) => {
  try {
    const { points } = req.body;
    
    console.log('Points handball reçus:', points);
    
    // Stocker les points dans un fichier ou une base de données si nécessaire
    // Exemple avec un fichier:
    fs.writeFileSync('handball-points.json', JSON.stringify(points));
    
    res.json({ success: true, message: 'Points du handball enregistrés avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des points handball:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});