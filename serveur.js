const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs'); // Ajout du module fs
const cors = require('cors');

// Initialisation des applications
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialisation de Socket.io pour le handball - DÉPLACÉ ICI
// Important: Initialiser avant que les clients ne se connectent
const handballSocket = require('./handball-socket')(io);
console.log('Namespace handball initialisé avec succès');

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ajouter un stockage en mémoire pour les états des tournois
const tournamentStates = new Map();

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

// ========= WEBSOCKET =========
io.on('connection', (socket) => {
  console.log('Nouvelle connexion WebSocket établie', socket.id);
  
  // Stocker les états de match (en mémoire)
  if (!io.matchStates) {
    io.matchStates = {};
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
            state: currentState.state,
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

});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
