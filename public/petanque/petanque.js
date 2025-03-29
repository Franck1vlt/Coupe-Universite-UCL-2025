// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

// Ajouter les variables WebSocket
let socket;
let socketConnected = false;

// Initialisation WebSocket
function initWebSocket() {
    try {
        // Vérifier si Socket.IO est disponible
        if (typeof io === 'undefined') {
            console.warn('Socket.IO non disponible - mode hors ligne activé');
            socketConnected = false;
            if (document.getElementById('connectionStatus')) {
                document.getElementById('connectionStatus').textContent = 'Mode hors ligne';
            }
            return;
        }
        
        socket = io();

        socket.on('connect', () => {
            console.log('WebSocket connecté');
            socketConnected = true;
            if (document.getElementById('connectionStatus')) {
                document.getElementById('connectionStatus').textContent = 'WebSocket: ✅ Connecté';
            }
            
            // Rejoindre une salle spécifique au match
            const matchId = new URLSearchParams(window.location.search).get('matchId');
            if (matchId) {
                const room = `match_${matchId}`;
                socket.emit('join_room', { room });
                console.log(`Tentative de rejoindre la salle: ${room}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
            socketConnected = false;
            if (document.getElementById('connectionStatus')) {
                document.getElementById('connectionStatus').textContent = 'WebSocket: ❌ Déconnecté';
            }
        });

        socket.on('joined_room', (data) => {
            console.log(`Rejoint la salle: ${data.room}`);
        });

        socket.on('match_updated', (data) => {
            if (data.matchId === matchData.matchId) {
                console.log('Mise à jour reçue pour le match actuel:', data);
                if (!data.fromSelf) {
                    matchData.teamA.score = data.score1;
                    matchData.teamB.score = data.score2;
                    updateDisplay();
                }
            }
        });

        socket.on('match_data_update', (data) => {
            console.log('Réception de mise à jour de match distribué:', data);
            if (data.matchId === matchData.matchId) {
                // Mettre à jour l'interface avec les nouvelles données
                matchData.teamA.score = data.score1 || matchData.teamA.score;
                matchData.teamB.score = data.score2 || matchData.teamB.score;
                
                // Mettre à jour le chrono si disponible
                if (data.chrono) {
                    document.getElementById('gameChrono').textContent = data.chrono;
                }
                
                // Mettre à jour l'interface
                updateDisplay();
            }
        });

        socket.on('match_status_updated', (data) => {
            if (data.matchId === matchData.matchId) {
                console.log('Statut du match mis à jour:', data);
                updateStatusIndicator(data.status);
            }
        });

        socket.on('update_match_success', (response) => {
            console.log('Match mis à jour avec succès:', response);
        });

        socket.on('update_match_error', (error) => {
            console.error('Erreur lors de la mise à jour du match:', error);
        });

    } catch (error) {
        console.warn('Erreur WebSocket:', error);
        socketConnected = false;
        if (document.getElementById('connectionStatus')) {
            document.getElementById('connectionStatus').textContent = 'Mode hors ligne';
        }
    }
}

// Structure de données du match (exemple)
let petanqueMatchData = {
    matchId: new URLSearchParams(window.location.search).get('matchId'),
    teamA: { score: 0 },
    teamB: { score: 0 },
    chrono: '00:00',
    status: 'en cours'
};

// Déplacer la fonction updateTeams dans le scope global
function updateTeams() {
    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');
    const teamAName = document.getElementById('teamAName');
    const teamBName = document.getElementById('teamBName');
    
    if (teamA && teamB && teamAName && teamBName) {
        teamAName.textContent = teamA.value || 'Team A';
        teamBName.textContent = teamB.value || 'Team B';
    }
}

// Fonctions pour le chronomètre
function startChrono() {
    if (!matchData.chrono.running) {
        matchData.chrono.running = true;
        matchData.chrono.interval = setInterval(updateChrono, 1000);
    }
}

function stopChrono() {
    matchData.chrono.running = false;
    clearInterval(matchData.chrono.interval);
}

function updateChrono() {
    matchData.chrono.time++;
    const minutes = Math.floor(matchData.chrono.time / 60);
    const seconds = matchData.chrono.time % 60;
    document.getElementById('gameChrono').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonctions pour les points
function addPoint(team) {
    matchData[`team${team}`].score++;
    updateDisplay();
}

function subPoint(team) {
    if (matchData[`team${team}`].score > 0) {
        matchData[`team${team}`].score--;
        updateDisplay();
    }
}

// Fonction pour mettre à jour le statut du match via WebSocket
function updateMatchStatus(status = 'en_cours') {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) return;

    console.log(`Tentative d'envoi du statut "${status}" pour le match ${matchId}`);

    // Mettre à jour localement
    const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    liveData.status = status;
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));

    // Mettre à jour l'indicateur de statut visuel dans l'interface
    if (typeof updateStatusIndicator === 'function') {
        updateStatusIndicator(status);
    }

    // Si WebSocket est disponible et connecté, utiliser WebSocket
    if (socket && socketConnected) {
        console.log(`Envoi du statut "${status}" pour le match ${matchId} via WebSocket`);
        
        socket.emit('update_match_status', {
            matchId: matchId,
            status: status,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score
        });
    } else {
        // Fallback HTTP si WebSocket n'est pas disponible
        fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                score1: matchData.teamA.score,
                score2: matchData.teamB.score,
                id_terrain: 8
            })
        }).then(response => {
            if (!response.ok) {
                console.error(`Erreur lors de la mise à jour du statut: ${response.status}`);
            } else {
                console.log(`Statut du match mis à jour avec succès: ${status}`);
            }
        }).catch(error => {
            console.error('Erreur lors de la mise à jour du statut:', error);
        });
    }
}

// Fonction de fin de match avec WebSocket
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const team1 = document.getElementById('teamA').value;
    const team2 = document.getElementById('teamB').value;
    const score1 = matchData.teamA.score;
    const score2 = matchData.teamB.score;
    const matchType = new URLSearchParams(window.location.search).get('matchType');
    
    // S'assurer qu'il y a toujours un gagnant en vérifiant s'il y a au moins 2 points d'écart
    let finalScore1 = score1;
    let finalScore2 = score2;
    
    if (finalScore1 === finalScore2) {
        // En cas d'égalité, ajouter un point au hasard
        if (Math.random() > 0.5) {
            finalScore1 += 1;
        } else {
            finalScore2 += 1;
        }
    }
    
    // S'assurer qu'il y a au moins 2 points d'écart
    if (Math.abs(finalScore1 - finalScore2) < 2) {
        if (finalScore1 > finalScore2) {
            finalScore1 = finalScore2 + 2;
        } else {
            finalScore2 = finalScore1 + 2;
        }
    }
    
    // Déterminer le gagnant et le perdant
    const winner = finalScore1 > finalScore2 ? team1 : team2;
    const loser = finalScore1 > finalScore2 ? team2 : team1;

    try {
        // Sauvegarder immédiatement tous les matchs déjà terminés pour pouvoir les restaurer plus tard
        const finishedMatches = {};
        const savedTournamentState = JSON.parse(localStorage.getItem('petanqueTournamentState') || '{}');
        
        if (savedTournamentState.matches) {
            // Identifier tous les matchs qui sont déjà terminés
            Object.entries(savedTournamentState.matches).forEach(([id, matchData]) => {
                if (matchData.status === 'terminé') {
                    finishedMatches[id] = matchData;
                    console.log(`Match terminé préservé: ${id}`);
                }
            });
        }
        
        // Stocker cet état dans localStorage pour pouvoir restaurer ces matchs après redirection
        localStorage.setItem('petanque_finishedMatches', JSON.stringify(finishedMatches));
        
        // Mettre à jour le statut en "terminé"
        updateMatchStatus('terminé');
        
        // Récupérer l'état actuel du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('petanqueTournamentState') || '{}');
        
        // Mettre à jour le match actuel
        if (tournamentState.matches) {
            // Conserver une copie des états actuels avant modification
            const previousStates = {};
            for (const matchKey in tournamentState.matches) {
                if (tournamentState.matches[matchKey]) {
                    previousStates[matchKey] = tournamentState.matches[matchKey].status;
                }
            }
            
            // Mettre à jour le match actuel
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                team1: team1,
                team2: team2,
                score1: finalScore1,
                score2: finalScore2,
                status: 'terminé',  // Assurez-vous que c'est bien 'terminé' ici
                winner: winner,
                loser: loser,
                matchType: matchType
            };

            // S'assurer que les statuts des autres matchs terminés ne sont pas modifiés
            for (const matchKey in tournamentState.matches) {
                // Ne pas toucher au match courant car on vient de le mettre à jour
                if (matchKey !== matchId && previousStates[matchKey] === 'terminé') {
                    tournamentState.matches[matchKey].status = 'terminé';
                }
            }

            // Restaurer les statuts de tous les matchs terminés
            Object.keys(finishedMatches).forEach(id => {
                if (id !== matchId && tournamentState.matches[id]) { // Ne pas écraser notre match actuel
                    tournamentState.matches[id].status = 'terminé';
                    console.log(`Restauration du statut 'terminé' pour le match ${id}`);
                }
            });

            // Sauvegarder l'état mis à jour
            localStorage.setItem('petanqueTournamentState', JSON.stringify(tournamentState));
            
            // IMPORTANT : nettoyer toutes les entrées localStorage qui pourraient être en conflit
            localStorage.removeItem(`liveMatchData_match${matchId}`);
            
            // Si c'est le match actuellement en direct, nettoyer aussi cette entrée
            const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
            if (liveData.matchId === matchId) {
                localStorage.removeItem('liveMatchData');
            }
            
            // Stocker des informations sur le dernier match terminé pour que petanque.html puisse le détecter
            localStorage.setItem('lastFinishedMatch', JSON.stringify({
                matchId: matchId,
                timestamp: new Date().getTime(),
                status: 'terminé',
                score1: finalScore1,
                score2: finalScore2,
                winner: winner,
                loser: loser
            }));
            
            // AJOUT: Recalculer les liens entre les matchs
            if (typeof window.parent.linkWinnersAndLosers === 'function') {
                window.parent.linkWinnersAndLosers();
            }
        }

        // Envoyer les données via WebSocket si disponible
        if (socket && socketConnected) {
            console.log('Envoi de la fin de match via WebSocket');
            
            socket.emit('update_match', {
                matchId,
                team1,
                team2,
                score1: finalScore1,
                score2: finalScore2,
                status: 'terminé',
                winner,
                loser,
                matchType,
                id_tournois: 5
            });
            
            // Attendre confirmation WebSocket
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    socket.off('update_match_success');
                    socket.off('update_match_error');
                    reject(new Error('Délai d\'attente WebSocket dépassé'));
                }, 3000);
                
                socket.once('update_match_success', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                socket.once('update_match_error', (error) => {
                    clearTimeout(timeout);
                    reject(new Error(error.message || 'Erreur WebSocket'));
                });
            });
            
            console.log('Fin de match confirmée via WebSocket');
        } else {
            // Fallback HTTP si WebSocket n'est pas disponible
            // Envoyer les résultats au serveur via HTTP
            const matchResponse = await fetch('/api/match-status/' + matchId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'terminé',
                    score1: finalScore1,
                    score2: finalScore2,
                    id_terrain: 8
                })
            });

            if (!matchResponse.ok) {
                throw new Error(`Erreur lors de la mise à jour du statut du match: ${matchResponse.status}`);
            }

            // Attendre que les données du statut soient bien enregistrées
            await new Promise(resolve => setTimeout(resolve, 500));

            // Envoyer ensuite les résultats finaux
            const resultResponse = await fetch('/api/match-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matchId,
                    team1,
                    team2,
                    score1: finalScore1,
                    score2: finalScore2,
                    matchType,
                    status: 'terminé',
                    winner,
                    loser,
                    id_tournois: 5 
                })
            });

            if (!resultResponse.ok) {
                throw new Error(`Erreur lors de l'enregistrement des résultats: ${resultResponse.status}`);
            }

            // Attendre un peu plus longtemps pour assurer la sauvegarde complète
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Notifier l'utilisateur avant la redirection
        alert('Match terminé avec succès! Redirection vers le tableau des matchs...');

        // Redirection vers la page principale avec les paramètres forceClear et refresh
        // Ajouter un paramètre pour forcer la préservation des états des matchs terminés
        window.location.href = 'petanque.html?refresh=' + Date.now() + 
                               '&forceClear=' + matchId + 
                               '&matchStatus=termine' + 
                               '&preserveFinished=true#final-phase';

    } catch (error) {
        console.error('Erreur lors de la fin du match:', error);
        alert('Erreur lors de la sauvegarde du match: ' + error.message + 
              '\nVeuillez essayer à nouveau ou contacter l\'administrateur.');
    }
}

// Fonction de mise à jour de l'affichage - plus spécifique à chaque match
async function updateDisplay() {
    document.getElementById('teamAScore').textContent = matchData.teamA.score;
    document.getElementById('teamBScore').textContent = matchData.teamB.score;

    // Récupérer l'ID du match actuel - CRUCIAL pour la spécificité
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) {
        console.warn("Pas d'ID de match trouvé dans l'URL");
        return;
    }

    const liveData = {
        matchId: matchId,
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en_cours',
        server: document.getElementById('ballIconA').style.visibility === 'visible' ? 'A' : 'B',
        sport: 'petanque',
        timestamp: Date.now()
    };

    // Toujours sauvegarder dans les clés spécifiques au match
    localStorage.setItem(`liveMatchData_petanque_match${matchId}`, JSON.stringify(liveData));
    localStorage.setItem(`petanque_liveMatchData_match${matchId}`, JSON.stringify(liveData));
    localStorage.setItem(`liveMatchData_match${matchId}`, JSON.stringify(liveData));
    
    // Mise à jour de la clé générique seulement si elle correspond à ce match
    const currentLiveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    if (!currentLiveData.matchId || currentLiveData.matchId === matchId) {
        localStorage.setItem('liveMatchData', JSON.stringify(liveData));
    }

    // Notifier la fenêtre parent si nous sommes dans une iframe
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'matchDataUpdated',
            source: window.name,
            data: liveData
        }, '*');
    }

    // Stocker les données à synchroniser
    window.dataToSync = {
        matchId: liveData.matchId,
        status: liveData.status,
        score1: liveData.score1,
        score2: liveData.score2
    };

    // Envoyer les données au serveur via WebSocket si disponible
    if (socket && socketConnected) {
        socket.emit('update_match', {
            matchId: matchData.matchId,
            status: 'en_cours',
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            id_terrain: 8,
            id_tournois: 5, 
            fromSelf: true
        });
        
        // Diffuser les données aux autres clients dans la même salle
        const room = `match_${matchData.matchId}`;
        socket.emit('broadcast_match_update', {
            room: room,
            matchId: matchData.matchId,
            data: liveData
        });
    } else {
        // Sinon on utilise le code HTTP existant
        try {
            const response = await fetch('/api/match-status/' + liveData.matchId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: liveData.status,
                    score1: liveData.score1,
                    score2: liveData.score2,
                    id_terrain: 8
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('Données synchronisées avec le serveur avec succès');
            window.lastSyncSuccess = true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi des données au serveur:', error);
            window.lastSyncSuccess = false;
        }
    }
}

// Fonction pour synchroniser périodiquement avec le serveur
function setupPeriodicSync() {
    // Tenter de synchroniser toutes les 3 secondes
    window.syncInterval = setInterval(async () => {
        if (window.dataToSync && window.dataToSync.matchId) {
            // Si la dernière synchronisation a échoué, on réessaie
            if (window.lastSyncSuccess !== true) {
                try {
                    console.log('Tentative de resynchronisation...');
                    const response = await fetch('/api/match-status/' + window.dataToSync.matchId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: window.dataToSync.status,
                            score1: window.dataToSync.score1,
                            score2: window.dataToSync.score2,
                            id_terrain: 8
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    console.log('Resynchronisation réussie');
                    window.lastSyncSuccess = true;
                } catch (error) {
                    console.error('Échec de la resynchronisation:', error);
                }
            }
        }
    }, 3000); // Toutes les 3 secondes
}

// Variable globale pour le serveur
let server = 'A';

function changeServer() {
    // Alterner le serveur entre A et B
    server = server === 'A' ? 'B' : 'A';

    // Mettre à jour l'affichage dans marquage.html
    document.getElementById('serverA').style.visibility = server === 'A' ? 'visible' : 'hidden';
    document.getElementById('serverB').style.visibility = server === 'B' ? 'visible' : 'hidden';

    // Mettre à jour les données en direct pour synchroniser avec affichage_score.html
    const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    liveData.server = server;
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));
}

// Fonction pour changer le serveur (appelée par le bouton "Service")
function ChangeServer() {
    // Alterner le serveur entre A et B
    server = server === 'A' ? 'B' : 'A';

    // Mettre à jour les icônes 
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }

    // Récupérer l'ID du match actuel
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) return;
    
    // Clés spécifiques à utiliser pour ce match
    const matchSpecificKeys = [
        `liveMatchData_petanque_match${matchId}`,
        `petanque_liveMatchData_match${matchId}`,
        `liveMatchData_match${matchId}`
    ];
    
    // Mettre à jour toutes les clés spécifiques au match
    matchSpecificKeys.forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            data.server = server;
            data.matchId = matchId; // S'assurer que matchId est bien défini
            data.sport = 'petanque'; // Expliciter le sport
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`Mise à jour du service pour ${key}: ${server}`);
        } catch (e) {
            console.warn(`Erreur lors de la mise à jour de ${key}:`, e);
        }
    });
    
    // NE PAS mettre à jour liveMatchData globale sans vérification stricte du matchId
    // Cette clé est souvent partagée entre les matchs et cause les interférences
    const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    if (liveData.matchId === matchId) {
        liveData.server = server;
        localStorage.setItem('liveMatchData', JSON.stringify(liveData));
        console.log('Mise à jour de liveMatchData global');
    } else {
        console.log('liveMatchData ignoré car il concerne un autre match');
    }

    // Diffuser le changement via WebSocket avec ID explicite
    if (socket && socketConnected) {
        socket.emit('broadcast_match_update', {
            room: `match_${matchId}`,
            matchId: matchId,
            data: {
                server: server,
                sport: 'petanque',
                matchId: matchId,
                timestamp: Date.now() // Ajouter un timestamp pour différencier les mises à jour
            }
        });
    }

    // Mise à jour de l'affichage complet
    updateDisplay();
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser WebSocket
    initWebSocket();
    
    // Mettre le match en status "en cours" au chargement avec un léger délai
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (matchId) {
        setTimeout(() => {
            console.log("Initialisation du statut 'en_cours'");
            updateMatchStatus('en_cours');
        }, 1500); // Augmenter le délai pour s'assurer que le socket est initialisé
    }

    // Rendre les icônes invisibles par défaut
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = 'hidden';
        ballIconB.style.visibility = 'hidden';
    }

    updateTeams();
    updateDisplay();
    
    // Configurer la synchronisation périodique
    setupPeriodicSync();
    
    // Nettoyer l'intervalle de synchronisation lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', () => {
        if (window.syncInterval) {
            clearInterval(window.syncInterval);
        }
    });
});