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
        });

        socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
            socketConnected = false;
            if (document.getElementById('connectionStatus')) {
                document.getElementById('connectionStatus').textContent = 'WebSocket: ❌ Déconnecté';
            }
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
let volleyHMatchData = {
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
                id_terrain: 9 // Par défaut pour volleyball
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
    const winner = score1 > score2 ? team1 : team2;
    const loser = score1 > score2 ? team2 : team1;

    try {
        // Mettre à jour le statut en "terminé"
        updateMatchStatus('terminé');
        
        // Récupérer l'état actuel du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('volleyHTournamentState')) || { matches: {} };
        
        // Mettre à jour le match actuel
        if (tournamentState.matches) {
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                team1: team1,
                team2: team2,
                score1: score1,
                score2: score2,
                status: 'terminé',
                winner: winner,
                loser: loser,
                matchType: matchType
            };

            // Gérer spécifiquement les demi-finales
            if (matchId === '8' || matchId === '9') {
                // Mettre à jour la finale (match 11)
                tournamentState.matches[11] = {
                    ...tournamentState.matches[11],
                    [matchId === '8' ? 'team1' : 'team2']: winner,
                    status: 'à_venir',
                    score1: null,
                    score2: null,
                    winner: null,
                    loser: null
                };

                // Mettre à jour la petite finale (match 10)
                tournamentState.matches[10] = {
                    ...tournamentState.matches[10],
                    [matchId === '8' ? 'team1' : 'team2']: loser,
                    status: 'à_venir',
                    score1: null,
                    score2: null,
                    winner: null,
                    loser: null
                };
            }

            // Sauvegarder l'état mis à jour
            localStorage.setItem('volleyHTournamentState', JSON.stringify(tournamentState));
        }

        // Envoyer les données via WebSocket si disponible
        if (socket && socketConnected) {
            console.log('Envoi de la fin de match via WebSocket');
            
            socket.emit('update_match', {
                matchId,
                team1,
                team2,
                score1,
                score2,
                status: 'terminé',
                winner,
                loser,
                matchType
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
                    score1: score1,
                    score2: score2,
                    id_terrain: 9 // ID du terrain pour le volleyball
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
                    score1,
                    score2,
                    matchType,
                    status: 'terminé',
                    winner,
                    loser,
                    id_tournois: 4  // ID spécifique pour le tournoi de volleyball hommes
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

        // Redirection vers la page principale
        window.location.href = 'volleyball.html#final-phase';

    } catch (error) {
        console.error('Erreur lors de la fin du match:', error);
        alert('Erreur lors de la sauvegarde du match: ' + error.message + 
              '\nVeuillez essayer à nouveau ou contacter l\'administrateur.');
    }
}

// Fonction de mise à jour de l'affichage
async function updateDisplay() {
    document.getElementById('teamAScore').textContent = matchData.teamA.score;
    document.getElementById('teamBScore').textContent = matchData.teamB.score;

    const liveData = {
        matchId: new URLSearchParams(window.location.search).get('matchId'),
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en_cours'
    };

    // Sauvegarder en localStorage
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));

    // Mettre à jour l'objet volleyHMatchData
    volleyHMatchData.teamA.score = matchData.teamA.score;
    volleyHMatchData.teamB.score = matchData.teamB.score;
    volleyHMatchData.chrono = document.getElementById('gameChrono').textContent;
    
    // Sauvegarder en localStorage
    localStorage.setItem(
        `liveMatchData_volleyH_${volleyHMatchData.matchId}`,
        JSON.stringify(volleyHMatchData)
    );

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
            id_terrain: 9, // ID terrain volleyball hommes
            id_tournois: 4, // ID tournoi volleyball hommes
            fromSelf: true
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
                    id_terrain: 9 // ID du terrain pour le volleyball
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
                            id_terrain: 9 // ID du terrain pour le volleyball
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

    // Mettre à jour les icônes de volleyball
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }

    // Mettre à jour les données en direct pour synchroniser avec affichage_score.html
    const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    liveData.server = server;
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));

    // Mise à jour des icônes dans marquage.html
    const ballIconAInMarquage = document.getElementById('ballIconA');
    const ballIconBInMarquage = document.getElementById('ballIconB');
    if (ballIconAInMarquage && ballIconBInMarquage) {
        ballIconAInMarquage.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconBInMarquage.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }
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

    // Rendre les icônes de volleyball invisibles par défaut
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