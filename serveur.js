const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const port = 3000;
const http = require('http').createServer(app);
const cors = require('cors');

// Configuration de Socket.IO avec une meilleure gestion d'erreur
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Autoriser toutes les origines, à restreindre en production
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000, // Augmenter le timeout à 60s
    pingInterval: 25000, // Vérifier la connexion toutes les 25s
    allowEIO3: true, // Compatibilité avec les anciens clients
    transports: ['polling', 'websocket'], // Accepter les deux modes
    maxHttpBufferSize: 1e6 // 1 MB max
});

app.use(cors({
    origin: "*", // Permettre toutes les origines, à restreindre en production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Initialisation de Socket.io pour le handball - DÉPLACÉ ICI
// Important: Initialiser vant que les clients ne se connectent
const handballSocket = require('./handball-socket')(io);
console.log('Namespace handball initialisé avec succès');

// Ajouter un stockage en mémoire pour les états des tournois
const tournamentStates = new Map();

// Variables pour stocker les données des matchs de fléchettes
const darts_matches = {};

// ========= WEBSOCKET =========
io.on('connection', (socket) => {
  console.log('Nouvelle connexion WebSocket établie', socket.id);
  
  // Envoyer immédiatement un ping pour vérifier la connexion
  socket.emit('ping_from_server');
  
  // Stocker les états de match (en mémoire)
  if (!io.matchStates) {
    io.matchStates = {};
  }
  
  // Nouveau gestionnaire pour obtenir tous les matchs
  socket.on('request_all_matches', () => {
    console.log('Demande de tous les matchs reçue de', socket.id);
    
    // Récupérer tous les matchs avec leurs terrains
    db.all(`
        SELECT 
            m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
            m.status, m.winner, m.loser, m.match_type, m.id_terrain,
            e1.nom_equipe as team1, e2.nom_equipe as team2,
            t.nom_terrain as venue
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        LEFT JOIN Terrain t ON m.id_terrain = t.id_terrain
        ORDER BY m.id_terrain, m.id_match
    `, [], (err, matches) => {
        if (err) {
            console.error('Erreur lors de la récupération des matchs:', err);
            socket.emit('error', { error: err.message });
        } else {
            try {
                // Normaliser les données avant de les envoyer
                const normalizedMatches = matches.map(match => ({
                    matchId: match.id_match,
                    tournamentId: match.id_tournois,
                    score1: match.score_equipe1 || 0,
                    score2: match.score_equipe2 || 0,
                    status: match.status || 'à_venir',
                    team1: match.team1 || 'Équipe 1',
                    team2: match.team2 || 'Équipe 2',
                    winner: match.winner,
                    loser: match.loser,
                    venue: match.venue || 'Terrain non spécifié',
                    terrain: match.id_terrain,
                    sport: getSportFromTournament(match.id_tournois),
                    matchType: match.match_type
                }));
                
                console.log(`Envoi de ${normalizedMatches.length} matchs au client`);
                socket.emit('all_matches', normalizedMatches);
            } catch (error) {
                console.error('Erreur lors de la normalisation des matchs:', error);
                socket.emit('error', { error: 'Erreur de traitement des données' });
            }
        }
    });
  });

  // Fonction d'aide pour déterminer le sport basé sur l'id du tournoi
  function getSportFromTournament(tournamentId) {
    switch(tournamentId) {
        case 1: return 'football';
        case 2: return 'handball'; 
        case 3: return 'basket';
        case 4: return 'volley-h';
        case 5: return 'volley-f';
        case 6: return 'petanque';
        default: return 'default';
    }
  }
  
  // Rejoindre une room spécifique par sport si nécessaire
  socket.on('join_sport', (sport) => {
    socket.join(sport);
    console.log(`Socket ${socket.id} a rejoint ${sport}`);
    
    // Envoyer immédiatement les états connus des matchs au nouveau client
    if (io.matchStates && Object.keys(io.matchStates).length > 0) {
      // Filtrer pour n'envoyer que les matchs du sport spécifié
      const sportMatches = {};
      Object.entries(io.matchStates).forEach(([matchId, matchData]) => {
        if (matchData.sport === sport) {
          sportMatches[matchId] = matchData;
        }
      });
      
      socket.emit('matches_state_sync', { sport, matches: sportMatches });
      console.log(`Envoi de ${Object.keys(sportMatches).length} match(s) à ${socket.id}`);
    }

    // Envoyer l'état complet du tournoi immédiatement
    const state = tournamentStates.get(sport);
    if (state) {
        socket.emit('tournament_state', {
            sport,
            state: state.state,
            timestamp: state.timestamp,
            matchStates: io.matchStates
        });
        console.log(`État du tournoi ${sport} envoyé à ${socket.id}`);
    }
  });
  
  // Événements communs à tous les sports
  socket.on('update_match', (data) => {
    console.log('[WebSocket] update_match reçu:', data);
    // Broadcast à tous les clients
    io.emit('match_updated', data);
    socket.emit('update_match_success', { matchId: data.matchId });
  });
  
  // Amélioration de la gestion de update_match_status
  socket.on('update_match_status', (data) => {
    console.log('[WebSocket] update_match_status reçu:', data);
    
    if (!data.matchId) {
      socket.emit('error', { message: 'Requête invalide: matchId requis' });
      return;
    }
    
    // Enregistrer l'état dans la mémoire du serveur
    if (!io.matchStates) io.matchStates = {};
    io.matchStates[data.matchId] = {
      ...io.matchStates[data.matchId],
      ...data,
      lastUpdate: Date.now()
    };
    
    // Forcer une mise à jour immédiate pour tous les clients
    io.emit('force_sync', { 
      timestamp: Date.now(),
      matches: io.matchStates
    });
    
    // Diffuser la mise à jour spécifique
    io.emit('match_status_updated', io.matchStates[data.matchId]);
    
    // Confirmation au client émetteur
    socket.emit('update_received', {
        status: 'success',
        matchId: data.matchId,
        timestamp: Date.now()
    });
  });

  // Ajouter un nouvel événement pour la synchronisation explicite
  socket.on('request_full_sync', () => {
    if (io.matchStates) {
      socket.emit('force_sync', {
        timestamp: Date.now(),
        matches: io.matchStates
      });
    }
  });
  
  // Événement match_completed amélioré
  socket.on('match_completed', (data) => {
    console.log('[WebSocket] match_completed reçu:', data);
    
    if (data.matchId) {
        // Mettre à jour l'état du match dans la mémoire
        io.matchStates[data.matchId] = {
            ...data,
            status: 'terminé',
            timestamp: Date.now()
        };
        
        // Sauvegarder l'état complet du tournoi
        const currentState = tournamentStates.get('football');
        if (currentState && currentState.state) {
            currentState.state.matches[data.matchId] = {
                ...currentState.state.matches[data.matchId],
                ...data,
                status: 'terminé'
            };
            
            // Mettre à jour l'état stocké
            tournamentStates.set('football', {
                state: currentState.state,
                timestamp: Date.now()
            });
        }
        
        // Diffuser à tous les clients
        io.emit('match_completed', data);
        io.emit('tournament_state', {
            sport: 'football',
            state: currentState?.state || currentState || {},
            timestamp: Date.now(),
            needsUpdate: true
        });
    }
  });

  // Nouvel événement pour demander l'état global des matchs
  socket.on('request_matches_state', ({ sport }) => {
    console.log(`[WebSocket] État des matchs demandé pour ${sport}`);
    socket.emit('matches_state_sync', { 
      sport,
      matches: io.matchStates || {} 
    });
  });
  
  // Événements spécifiques aux fléchettes
  socket.on('live_score_update', (data) => {
    console.log('[WebSocket] live_score_update reçu (fléchettes):', data);
    // Important: Broadcast à TOUS les clients, pas seulement à l'émetteur
    io.emit('live_score_update', data);
  });
  
  // Événements spécifiques au volley
  socket.on('volley_score_update', (data) => {
    console.log('[WebSocket] volley_score_update reçu:', data);
    io.emit('volley_score_update', data);
  });
  
  // Gestion de la réinitialisation du tournoi
  socket.on('reset_tournament', (data) => {
    console.log(`[WebSocket] Réinitialisation du tournoi ${data.sport} demandée par ${socket.id}`);
    
    // Mettre à jour l'état en mémoire avec le nouvel état
    if (data.sport && data.state) {
        if (!io.matchStates) io.matchStates = {};
        io.matchStates = {
            ...io.matchStates,
            ...data.state.matches
        };
        
        // Sauvegarder dans les états des tournois
        tournamentStates.set(data.sport, {
            state: data.state,
            timestamp: data.timestamp
        });
    }
    
    // Diffuser la réinitialisation à tous les clients
    io.emit('reset_tournament', {
        sport: data.sport,
        timestamp: Date.now(),
        confirmedBy: 'server',
        state: data.state
    });
    
    // Forcer une synchronisation complète
    io.emit('force_sync', {
        timestamp: Date.now(),
        matches: io.matchStates
    });
    
    // Confirmation au client initiateur
    socket.emit('reset_tournament_confirmed', { 
        success: true,
        timestamp: Date.now()
    });
  });

  // Gestion de la sauvegarde d'état
  socket.on('save_tournament_state', (data) => {
    if (data.sport && data.state) {
      tournamentStates.set(data.sport, {
        state: data.state,
        timestamp: data.timestamp
      });
      // Informer les autres clients
      socket.broadcast.emit('tournament_updated', {
        sport: data.sport,
        timestamp: data.timestamp
      });
    }
  });

  // Gestion de la demande d'état
  socket.on('request_tournament_state', (data) => {
    const state = tournamentStates.get(data.sport);
    if (state) {
      socket.emit('tournament_state', state);
    } else {
      socket.emit('tournament_state', { state: null });
    }
  });
  
  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Connexion WebSocket fermée', socket.id);
  });

  socket.on('live_update', (data) => {
    // Assurez-vous que l'événement contient toutes les informations nécessaires
    if (data && data.matchId) {
      // Stocker l'état le plus récent
      if (!io.matchStates) io.matchStates = {};
      io.matchStates[data.matchId] = {
        ...io.matchStates[data.matchId],
        ...data,
        lastUpdate: Date.now()
      };
      
      // Diffuser à tous les clients
      io.emit('live_update', io.matchStates[data.matchId]);
      console.log(`Diffusion live_update pour match ${data.matchId}`);
    }
  });

  // Ajouter un événement pour demander explicitement les données d'un match
  socket.on('request_match_data', (request) => {
    const { matchId } = request;
    if (matchId) {
        // Vérifier d'abord dans l'état du tournoi
        let matchData = null;
        for (const [sport, state] of tournamentStates) {
            if (state.state?.matches?.[matchId]) {
                matchData = state.state.matches[matchId];
                break;
            }
        }
        // Fusionner avec l'état en direct si disponible
        if (io.matchStates?.[matchId]) {
            matchData = { ...matchData, ...io.matchStates[matchId] };
        }
        
        if (matchData) {
            socket.emit('match_data', matchData);
        }
    } else {
        socket.emit('error', { 
            message: `Données non disponibles pour le match ${matchId}` 
        });
    }
  });

  // Ajouter ce nouvel événement pour la propagation des équipes
  socket.on('request_propagate_teams', (data) => {
    console.log('[WebSocket] request_propagate_teams reçu:', data);
    
    // Vérifier que nous avons toutes les données nécessaires
    if (!data.matchId || !data.winner || !data.loser) {
        socket.emit('error', { message: 'Données de propagation incomplètes' });
        return;
    }
    
    // Récupérer l'état actuel du tournoi
    const state = tournamentStates.get('football');
    if (!state || !state.state || !state.state.matches) {
        socket.emit('error', { message: 'État du tournoi non disponible' });
        return;
    }
    
    const matchData = state.state.matches[data.matchId];
    if (!matchData) {
        socket.emit('error', { message: 'Match non trouvé dans l\'état du tournoi' });
        return;
    }
    
    // Marquer le match comme terminé avec les bonnes informations
    state.state.matches[data.matchId] = {
        ...matchData,
        winner: data.winner,
        loser: data.loser,
        status: 'terminé',
        score1: data.score1 || matchData.score1,
        score2: data.score2 || matchData.score2
    };
    
    // Propager le vainqueur et le perdant
    if (matchData.nextMatchWin && data.winner) {
        const nextMatch = state.state.matches[matchData.nextMatchWin];
        if (nextMatch) {
            if (!nextMatch.team1) {
                nextMatch.team1 = data.winner;
            } else if (!nextMatch.team2) {
                nextMatch.team2 = data.winner;
            }
        }
    }
    
    if (matchData.nextMatchLose && data.loser) {
        const nextMatch = state.state.matches[matchData.nextMatchLose];
        if (nextMatch) {
            if (!nextMatch.team1) {
                nextMatch.team1 = data.loser;
            } else if (!nextMatch.team2) {
                nextMatch.team2 = data.loser;
            }
        }
    }
    
    // Mettre à jour l'état du tournoi
    tournamentStates.set('football', {
        state: state.state,
        timestamp: Date.now()
    });
    
    // Informer tous les clients de la propagation
    io.emit('propagated_teams', {
        matchId: data.matchId,
        nextWinMatchId: matchData.nextMatchWin,
        nextLoseMatchId: matchData.nextMatchLose,
        winner: data.winner,
        loser: data.loser,
        timestamp: Date.now()
    });
    
    // Envoyer aussi une mise à jour complète de l'état du tournoi
    io.emit('tournament_state', {
        sport: 'football',
        state: state.state,
        timestamp: Date.now(),
        needsUpdate: true
    });
    
    // Confirmer l'action
    socket.emit('propagation_confirmed', { success: true });
});

// Ajouter cet événement pour obtenir les détails d'un match
socket.on('request_match_details', (request, callback) => {
    const { matchId } = request;
    
    // Récupérer l'état actuel du tournoi
    const state = tournamentStates.get('football');
    if (state && state.state && state.state.matches && state.state.matches[matchId]) {
        const matchDetails = state.state.matches[matchId];
        // Si callback existe, l'utiliser, sinon émettre une réponse classique
        if (typeof callback === 'function') {
            callback(matchDetails);
        } else {
            socket.emit('match_details', matchDetails);
        }
    } else {
        if (typeof callback === 'function') {
            callback(null);
        } else {
            socket.emit('error', { message: 'Match non trouvé' });
        }
    }
});

// Améliorer l'événement match_completed
socket.on('match_completed', (data) => {
    console.log('[WebSocket] match_completed reçu:', data);
    
    if (!data.matchId) {
        socket.emit('error', { message: 'matchId manquant' });
        return;
    }
    
    // Mettre à jour l'état du match dans la mémoire
    io.matchStates[data.matchId] = {
        ...io.matchStates[data.matchId],
        ...data,
        status: 'terminé',
        timestamp: Date.now()
    };
    
    // Sauvegarder l'état complet du tournoi
    const currentState = tournamentStates.get('football');
    if (currentState && currentState.state && currentState.state.matches) {
        // Mise à jour du match terminé
        currentState.state.matches[data.matchId] = {
            ...currentState.state.matches[data.matchId],
            ...data,
            status: 'terminé'
        };
        
        // Propager aux matchs suivants
        const match = currentState.state.matches[data.matchId];
        
        // Propager le vainqueur
        if (match.nextMatchWin && match.winner) {
            const nextMatch = currentState.state.matches[match.nextMatchWin];
            if (nextMatch) {
                if (!nextMatch.team1) {
                    nextMatch.team1 = match.winner;
                } else if (!nextMatch.team2) {
                    nextMatch.team2 = match.winner;
                }
            }
        }
        
        // Propager le perdant
        if (match.nextMatchLose && match.loser) {
            const nextMatch = currentState.state.matches[match.nextMatchLose];
            if (nextMatch) {
                if (!nextMatch.team1) {
                    nextMatch.team1 = match.loser;
                } else if (!nextMatch.team2) {
                    nextMatch.team2 = match.loser;
                }
            }
        }
        
        // Mettre à jour l'état du tournoi avec les propagations
        tournamentStates.set('football', {
            state: currentState.state,
            timestamp: Date.now()
        });
    }
    
    // Diffuser à tous les clients
    io.emit('match_completed', data);
    
    // Envoyer aussi l'état mis à jour du tournoi
    io.emit('tournament_state', {
        sport: 'football',
        state: currentState ? currentState.state : null,
        timestamp: Date.now(),
        needsUpdate: true
    });
    
    // Confirmer au client émetteur
    socket.emit('match_update_confirmed', { success: true });
});

// Améliorer la gestion des erreurs de sockets
socket.on('error', (error) => {
    console.error('Erreur socket:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Client déconnecté:', socket.id, 'Raison:', reason);
});

// Écouter les pings clients pour garder la connexion active
socket.on('pong_from_client', (data) => {
    const latency = Date.now() - data.timestamp;
    console.log(`Pong reçu du client ${socket.id}, latence: ${latency}ms`);
});

    // Ajouter ce nouvel événement pour récupérer les matchs en direct via WebSocket
    socket.on('request_live_matches', () => {
        console.log(`Client ${socket.id} demande les matchs en direct`);
        
        // Utiliser la même requête SQL assouplie que dans la route HTTP
        db.all(`
            SELECT 
                m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
                m.status, m.winner, m.loser, m.match_type, m.id_terrain,
                e1.nom_equipe as team1, e2.nom_equipe as team2,
                t.nom_terrain as venue
            FROM Match_ m
            LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
            LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
            LEFT JOIN Terrain t ON m.id_terrain = t.id_terrain
            WHERE (m.status IS NULL OR 
                   m.status NOT LIKE '%termin%' AND 
                   m.status NOT LIKE '%termine%')
            ORDER BY m.id_terrain, m.status
        `, [], (err, matches) => {
            if (err) {
                console.error('Erreur SQL pour request_live_matches:', err);
                socket.emit('error', { error: err.message });
            } else {
                console.log(`[WebSocket] ${matches.length} matchs trouvés pour envoi via socket`);
                
                // Transformer les résultats en format standard
                const formattedMatches = matches.map(match => ({
                    matchId: match.id_match,
                    tournamentId: match.id_tournois,
                    score1: match.score_equipe1 || 0,
                    score2: match.score_equipe2 || 0,
                    status: match.status || 'en_cours', // Valeur par défaut pour affichage
                    team1: match.team1 || 'Équipe 1',
                    team2: match.team2 || 'Équipe 2',
                    winner: match.winner,
                    loser: match.loser,
                    venue: match.venue || 'Terrain non spécifié',
                    terrain: match.id_terrain || 1, // Terrain de football par défaut
                    sport: getSportFromTournament(match.id_tournois),
                    matchType: match.match_type || 'match'
                }));
                
                // Envoyer les données au client
                socket.emit('all_matches', formattedMatches);
            }
        });
    });
});

// Configurer un ping périodique vers les clients pour garder les connexions actives
setInterval(() => {
  if (io.engine && io.engine.clientsCount > 0) {
    console.log(`Envoi de ping à ${io.engine.clientsCount} client(s)`);
    io.emit('ping_from_server');
  }
}, 25000);

// ========= ROUTES API =========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint pour les updates de statut de match
app.post('/api/match-status/:matchId', (req, res) => {
  const matchId = req.params.matchId;
  const { status, score1, score2, id_terrain } = req.body;
  
  console.log(`[HTTP] Update match ${matchId}: Status=${status}, Score=${score1}-${score2}`);
  
  // Sauvegarder l'état du match dans la mémoire du serveur
  if (!io.matchStates) io.matchStates = {};
  io.matchStates[matchId] = {
    ...io.matchStates[matchId],
    matchId,
    status,
    score1,
    score2,
    id_terrain,
    lastUpdate: Date.now()
  };
  
  // Broadcast via WebSocket à tous les clients
  io.emit('match_status_updated', io.matchStates[matchId]);
  
  res.json({ success: true, data: io.matchStates[matchId] });
});

// Endpoint pour les résultats finaux
app.post('/api/match-result', (req, res) => {
  const data = req.body;
  
  console.log(`[HTTP] Match result: ${data.team1} ${data.score1} - ${data.score2} ${data.team2}`);
  
  // Broadcast via WebSocket
  io.emit('match_completed', data);
  
  res.json({ success: true });
});

// Route pour obtenir tous les terrains
app.get('/api/terrains', (req, res) => {
    db.all(`
        SELECT id_terrain, nom_terrain, localisation 
        FROM Terrain
        ORDER BY id_terrain
    `, [], (err, terrains) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ terrains });
    });
});

// Route pour obtenir tous les matchs par terrain
app.get('/api/matches/par-terrain', (req, res) => {
    db.all(`
        SELECT 
            m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
            m.status, m.winner, m.loser, m.match_type, m.id_terrain,
            e1.nom_equipe as team1, e2.nom_equipe as team2,
            t.nom_terrain as venue
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        LEFT JOIN Terrain t ON m.id_terrain = t.id_terrain
        ORDER BY m.id_terrain, m.id_match
    `, [], (err, matches) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Organiser les matchs par terrain
        const matchesByVenue = {};
        matches.forEach(match => {
            const venue = match.venue || 'Terrain non spécifié';
            if (!matchesByVenue[venue]) {
                matchesByVenue[venue] = [];
            }
            matchesByVenue[venue].push({
                matchId: match.id_match,
                tournamentId: match.id_tournois,
                score1: match.score_equipe1 || 0,
                score2: match.score_equipe2 || 0,
                status: match.status || 'à_venir',
                team1: match.team1 || 'Équipe 1',
                team2: match.team2 || 'Équipe 2',
                winner: match.winner,
                loser: match.loser,
                venue: venue,
                terrain: match.id_terrain
            });
        });
        
        res.json({ matchesByVenue });
    });
});

// Ajouter cette nouvelle route pour réinitialiser tous les matchs
app.post('/api/matches/reset', async (req, res) => {
    console.log('[API] Demande de réinitialisation de tous les matchs reçue');
    
    try {
        // Exécuter dans une transaction pour assurer l'intégrité des données
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Réinitialiser la table Match_
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM Match_', function(err) {
                if (err) {
                    console.error('Erreur lors de la suppression des matchs:', err);
                    reject(err);
                } else {
                    console.log(`Tous les matchs ont été supprimés. Lignes affectées: ${this.changes}`);
                    resolve(this.changes);
                }
            });
        });
        
        await new Promise((resolve, reject) => {
            db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Notifier tous les clients connectés via WebSocket
        io.emit('matches_reset', { 
            timestamp: Date.now(),
            message: 'Tous les matchs ont été réinitialisés'
        });
        
        // Vider également l'état des matchs en mémoire
        io.matchStates = {};
        
        res.json({ 
            success: true, 
            message: 'Tous les matchs ont été réinitialisés avec succès'
        });
        
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des matchs:', error);
        
        // Rollback en cas d'erreur
        try {
            await new Promise((resolve) => {
                db.run('ROLLBACK', resolve);
            });
        } catch (rollbackError) {
            console.error('Erreur lors du rollback:', rollbackError);
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Une erreur est survenue lors de la réinitialisation'
        });
    }
});

// Ajouter cette nouvelle route API pour obtenir les matchs en direct
app.get('/api/matches/live', (req, res) => {
    console.log('[API] Requête pour récupérer les matchs en direct');
    
    // Requête modifiée pour accepter plus de statuts et afficher tous les matchs non terminés
    db.all(`
        SELECT 
            m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
            m.status, m.winner, m.loser, m.match_type, m.id_terrain,
            e1.nom_equipe as team1, e2.nom_equipe as team2,
            t.nom_terrain as venue
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        LEFT JOIN Terrain t ON m.id_terrain = t.id_terrain
        WHERE (m.status IS NULL OR 
               m.status NOT LIKE '%termin%' AND 
               m.status NOT LIKE '%termine%')
        ORDER BY m.id_terrain, m.status
    `, [], (err, matches) => {
        if (err) {
            console.error('Erreur SQL pour /api/matches/live:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        console.log(`[API] ${matches.length} matchs trouvés dans la base`);
        
        // Pour le debugging, afficher les détails des matchs trouvés
        matches.forEach(match => {
            console.log(`Match #${match.id_match}: ${match.team1 || 'Équipe 1'} vs ${match.team2 || 'Équipe 2'}, Terrain: ${match.id_terrain}, Statut: ${match.status}`);
        });
        
        // Transformer les résultats en format standard
        const formattedMatches = matches.map(match => ({
            matchId: match.id_match,
            tournamentId: match.id_tournois,
            score1: match.score_equipe1 || 0,
            score2: match.score_equipe2 || 0,
            status: match.status || 'en_cours', // Forcer à "en_cours" si null pour garantir l'affichage
            team1: match.team1 || 'Équipe 1',
            team2: match.team2 || 'Équipe 2',
            winner: match.winner,
            loser: match.loser,
            venue: match.venue || 'Terrain non spécifié',
            terrain: match.id_terrain || 1, // Terrain de football par défaut si non spécifié
            sport: getSportFromTournament(match.id_tournois),
            matchType: match.match_type || 'match'
        }));
        
        res.json({ 
            success: true, 
            matches: formattedMatches,
            count: formattedMatches.length,
            timestamp: Date.now()
        });
    });
});

// Ajouter une nouvelle route de diagnostic pour voir tous les matchs sans filtre
app.get('/api/matches/all', (req, res) => {
    console.log('[API] Requête pour récupérer tous les matchs');
    
    db.all(`
        SELECT 
            m.id_match, m.id_tournois, m.score_equipe1, m.score_equipe2, 
            m.status, m.winner, m.loser, m.match_type, m.id_terrain,
            e1.nom_equipe as team1, e2.nom_equipe as team2,
            t.nom_terrain as venue
        FROM Match_ m
        LEFT JOIN Equipe e1 ON m.id_equipe1 = e1.id_equipe
        LEFT JOIN Equipe e2 ON m.id_equipe2 = e2.id_equipe
        LEFT JOIN Terrain t ON m.id_terrain = t.id_terrain
        ORDER BY m.id_tournois, m.id_match
    `, [], (err, matches) => {
        if (err) {
            console.error('Erreur SQL pour /api/matches/all:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.json({
            success: true,
            count: matches.length,
            matches: matches
        });
    });
});

// Ajouter cette nouvelle route spécifique pour le football
app.post('/api/football/match', (req, res) => {
    console.log('[API/football] Données de match reçues:', req.body);
    const { id_match, team1, team2, score1, score2, status, terrain } = req.body;
    
    // Validation des données
    if (!id_match) {
        return res.status(400).json({ success: false, error: 'ID de match manquant' });
    }
    
    const matchData = {
        id_match: id_match,
        id_tournois: 1, // 1 pour le tournoi de football
        team1: team1 || 'Équipe inconnue',
        team2: team2 || 'Équipe inconnue',
        score1: score1 || 0,
        score2: score2 || 0,
        status: status || 'en_cours',
        id_terrain: terrain || 1, // 1 est le terrain de football par défaut
        winner: score1 > score2 ? team1 : (score2 > score1 ? team2 : null),
        loser: score1 > score2 ? team2 : (score2 > score1 ? team1 : null)
    };
    
    // Récupérer d'abord les IDs des équipes
    db.get(`
        SELECT id_equipe FROM Equipe WHERE nom_equipe = ?
    `, [matchData.team1], (err, equipe1) => {
        if (err || !equipe1) {
            console.error(`Équipe "${matchData.team1}" non trouvée:`, err || 'Équipe inexistante');
            // Créer l'équipe si elle n'existe pas
            db.run(`INSERT INTO Equipe (nom_equipe) VALUES (?)`, [matchData.team1], function(err) {
                if (err) {
                    console.error(`Erreur lors de la création de l'équipe ${matchData.team1}:`, err);
                    return res.status(500).json({ success: false, error: err.message });
                }
                matchData.id_equipe1 = this.lastID;
                getTeam2();
            });
        } else {
            matchData.id_equipe1 = equipe1.id_equipe;
            getTeam2();
        }
    });
    
    function getTeam2() {
        db.get(`
            SELECT id_equipe FROM Equipe WHERE nom_equipe = ?
        `, [matchData.team2], (err, equipe2) => {
            if (err || !equipe2) {
                console.error(`Équipe "${matchData.team2}" non trouvée:`, err || 'Équipe inexistante');
                // Créer l'équipe si elle n'existe pas
                db.run(`INSERT INTO Equipe (nom_equipe) VALUES (?)`, [matchData.team2], function(err) {
                    if (err) {
                        console.error(`Erreur lors de la création de l'équipe ${matchData.team2}:`, err);
                        return res.status(500).json({ success: false, error: err.message });
                    }
                    matchData.id_equipe2 = this.lastID;
                    insertMatch();
                });
            } else {
                matchData.id_equipe2 = equipe2.id_equipe;
                insertMatch();
            }
        });
    }
    
    function insertMatch() {
        // Maintenant que nous avons les IDs des deux équipes, insérer le match
        db.run(`
            INSERT OR REPLACE INTO Match_ (
                id_match, id_tournois, id_equipe1, id_equipe2, score_equipe1, score_equipe2, 
                status, winner, loser, id_terrain, match_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'match')
        `, [
            matchData.id_match,
            matchData.id_tournois,
            matchData.id_equipe1,
            matchData.id_equipe2,
            matchData.score1,
            matchData.score2,
            matchData.status,
            matchData.winner,
            matchData.loser,
            matchData.id_terrain
        ], function(err) {
            if (err) {
                console.error('Erreur lors de l\'insertion du match de football:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            console.log(`Match de football #${matchData.id_match} inséré/mis à jour avec succès`);
            
            // Notifier tous les clients connectés
            io.emit('match_updated', {
                matchId: matchData.id_match,
                tournamentId: matchData.id_tournois,
                team1: matchData.team1,
                team2: matchData.team2,
                score1: matchData.score1,
                score2: matchData.score2,
                status: matchData.status,
                terrain: matchData.id_terrain,
                sport: 'football'
            });
            
            res.json({ 
                success: true, 
                message: 'Match enregistré avec succès',
                matchData: {
                    ...matchData,
                    changes: this.changes
                }
            });
        });
    }
});

// Ajouter un endpoint de test API pour vérifier la configuration de la base de données
app.get('/api/football/check-db', (req, res) => {
    db.all(`PRAGMA table_info(Match_)`, [], (err, matchFields) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message,
                message: 'Erreur lors de la vérification de la structure de la table Match_'
            });
        }
        
        db.all(`PRAGMA table_info(Equipe)`, [], (err, teamFields) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    error: err.message,
                    message: 'Erreur lors de la vérification de la structure de la table Equipe'
                });
            }
            
            db.get(`SELECT COUNT(*) as count FROM Equipe`, [], (err, teamCount) => {
                res.json({
                    success: true,
                    database: {
                        matchFields,
                        teamFields,
                        teamCount: teamCount ? teamCount.count : 0
                    },
                    message: 'Informations de la base de données récupérées avec succès'
                });
            });
        });
    });
});

// Endpoint pour les mises à jour de score de fléchettes
app.post('/api/flechettes/update', (req, res) => {
  const data = req.body;
  
  if (!data || !data.matchId) {
    return res.status(400).json({ 
      success: false, 
      error: "Données invalides: matchId requis" 
    });
  }
  
  // Ajouter le timestamp s'il n'existe pas déjà
  if (!data.timestamp) {
    data.timestamp = Date.now();
  }
  
  // Stocker les données
  darts_matches[data.matchId] = {
    ...darts_matches[data.matchId],
    ...data
  };
  
  console.log(`[Fléchettes] Mise à jour du match ${data.matchId} reçue:`, 
              `${data.team1 || '?'} ${data.score1 || '?'} - ${data.score2 || '?'} ${data.team2 || '?'}`);
  
  return res.json({
    success: true,
    timestamp: data.timestamp
  });
});

// Endpoint pour récupérer les données d'un match de fléchettes
app.get('/api/flechettes/match/:matchId', (req, res) => {
  const matchId = req.params.matchId;
  const since = parseInt(req.query.since) || 0;
  
  const matchData = darts_matches[matchId];
  
  if (!matchData) {
    return res.status(404).json({
      success: false,
      error: `Match ${matchId} non trouvé`
    });
  }
  
  // Ne renvoyer que si les données sont plus récentes
  if (matchData.timestamp && matchData.timestamp > since) {
    return res.json(matchData);
  } else {
    return res.json({
      success: true,
      noChange: true,
      timestamp: matchData.timestamp || Date.now()
    });
  }
});

// Endpoint pour enregistrer la fin d'un match de fléchettes
app.post('/api/flechettes/match-completed', (req, res) => {
  const data = req.body;
  
  if (!data || !data.matchId) {
    return res.status(400).json({ 
      success: false, 
      error: "Données invalides: matchId requis" 
    });
  }
  
  // Mettre à jour les données avec le statut terminé
  darts_matches[data.matchId] = {
    ...darts_matches[data.matchId],
    ...data,
    status: 'terminé',
    timestamp: Date.now()
  };
  
  console.log(`[Fléchettes] Match ${data.matchId} terminé:`, 
              `${data.team1 || '?'} ${data.score1 || '?'} - ${data.score2 || '?'} ${data.team2 || '?'}`);
  
  // Sauvegarder le résultat dans la base de données si nécessaire
  // ...code pour sauvegarder dans la BD...
  
  return res.json({
    success: true,
    message: "Match enregistré comme terminé",
    timestamp: Date.now()
  });
});

// Endpoint pour lister tous les matchs de fléchettes actifs
app.get('/api/flechettes/matches', (req, res) => {
  // Filtrer pour ne renvoyer que les matchs non terminés par défaut
  const showAll = req.query.all === 'true';
  
  const matchList = Object.entries(darts_matches)
    .filter(([id, match]) => showAll || match.status !== 'terminé')
    .map(([id, match]) => ({
      matchId: id,
      team1: match.team1,
      team2: match.team2,
      score1: match.score1,
      score2: match.score2,
      status: match.status,
      matchType: match.matchType,
      timestamp: match.timestamp
    }));
  
  return res.json({
    success: true,
    count: matchList.length,
    matches: matchList
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});