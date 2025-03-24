/**
 * Gestion des sockets pour le handball
 */

module.exports = function(io) {
    if (!io) {
        console.error('IO non défini dans le module handball-socket');
        return null;
    }

    console.log('Initialisation du namespace /handball');
    
    // Création d'un namespace pour le handball
    const handballNamespace = io.of('/handball');
    
    // Stockage centralisé des états de match
    const matchStates = new Map();
    // Stockage de l'état du tournoi
    let tournamentState = null;
    
    // Garder une trace de tous les clients connectés
    const connectedClients = new Set();
    
    handballNamespace.on('connection', (socket) => {
        console.log('Nouvelle connexion Socket.io handball:', socket.id);
        connectedClients.add(socket.id);
        
        // Enregistrement comme contrôleur
        socket.on('registerController', (data) => {
            if (!data || !data.matchId) return;
            
            console.log(`Contrôleur enregistré pour le match ${data.matchId}`);
            socket.join(`match_${data.matchId}`);
            socket.join('controllers'); // Groupe de tous les contrôleurs
            socket.matchId = data.matchId;
            socket.role = 'controller';
            
            // Envoyer l'état actuel du match si disponible
            const currentState = matchStates.get(data.matchId);
            if (currentState) {
                // IMPORTANT: Diffuser à tous pour synchroniser
                handballNamespace.emit('scoreUpdate', currentState);
            }
        });
        
        // S'abonner à toutes les mises à jour du tournoi
        socket.on('subscribeTournament', (data) => {
            console.log(`Client ${socket.id} s'abonne aux mises à jour du tournoi`);
            socket.join('tournament_subscribers');
            
            // Envoyer immédiatement l'état actuel du tournoi
            if (tournamentState) {
                socket.emit('tournamentState', {
                    state: tournamentState,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Mise à jour du score
        socket.on('scoreUpdate', (data) => {
            if (!data || !data.matchId) return;
            
            console.log('Mise à jour de score reçue pour le match', data.matchId);
            
            // Sauvegarder l'état
            matchStates.set(data.matchId, {
                ...data,
                timestamp: Date.now()
            });

            // Si le match est terminé, mettre à jour l'état du tournoi
            if (data.status === 'terminé' && tournamentState && tournamentState.matches) {
                tournamentState.matches[data.matchId] = {
                    ...tournamentState.matches[data.matchId],
                    status: 'terminé',
                    score1: data.score1,
                    score2: data.score2,
                    winner: data.winner,
                    loser: data.loser
                };
            }
            
            // IMPORTANT: Diffuser à TOUS les clients
            handballNamespace.emit('scoreUpdate', data);
            console.log(`Diffusion de la mise à jour à tous les ${connectedClients.size} clients`);
        });
        
        // Mise à jour de l'état complet du tournoi
        socket.on('tournamentUpdate', (data) => {
            console.log('Mise à jour de l\'état du tournoi reçue');
            tournamentState = data.state;
            
            // Diffuser à tous les abonnés
            handballNamespace.to('tournament_subscribers').emit('tournamentState', {
                state: data.state,
                timestamp: new Date().toISOString()
            });
        });
        
        // Demande de données pour un match spécifique ou tous les matchs
        socket.on('requestData', (data) => {
            if (data.global) {
                console.log(`Client ${socket.id} demande tous les matchs`);
                // Envoyer tous les états de match disponibles
                matchStates.forEach((state, matchId) => {
                    socket.emit('scoreUpdate', state);
                });
                return;
            }
            
            if (!data.matchId) return;
            
            console.log(`Client ${socket.id} demande les données du match ${data.matchId}`);
            const currentState = matchStates.get(data.matchId);
            if (currentState) {
                socket.emit('scoreUpdate', currentState);
            }
        });
        
        // Demande de l'état du tournoi
        socket.on('request_tournament_state', (data) => {
            console.log(`Client ${socket.id} demande l'état du tournoi`);
            if (tournamentState) {
                socket.emit('tournamentState', {
                    state: tournamentState,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Déconnexion
        socket.on('disconnect', () => {
            console.log('Client déconnecté:', socket.id);
            connectedClients.delete(socket.id);
            // Pas besoin de nettoyer les rooms car Socket.io le fait automatiquement
        });
    });
    
    // IMPORTANT: Diffusion périodique de tous les états
    setInterval(() => {
        console.log(`Diffusion périodique, ${connectedClients.size} clients connectés`);
        
        // Diffuser chaque état de match
        matchStates.forEach((state, matchId) => {
            handballNamespace.emit('scoreUpdate', state);
        });
        
        // Diffuser l'état du tournoi
        if (tournamentState) {
            handballNamespace.emit('tournamentState', {
                state: tournamentState,
                timestamp: new Date().toISOString()
            });
        }
    }, 15000); // Toutes les 15 secondes
    
    return handballNamespace;
};
