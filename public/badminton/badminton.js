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
let badmintonMatchData = {
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
        const savedTournamentState = JSON.parse(localStorage.getItem('badmintonTournamentState') || '{}');
        
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
        localStorage.setItem('badminton_finishedMatches', JSON.stringify(finishedMatches));
        
        // Mettre à jour le statut en "terminé"
        updateMatchStatus('terminé');
        
        // Récupérer l'état actuel du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('badmintonTournamentState') || '{}');
        
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
            localStorage.setItem('badmintonTournamentState', JSON.stringify(tournamentState));
            
            // IMPORTANT : nettoyer toutes les entrées localStorage qui pourraient être en conflit
            localStorage.removeItem(`liveMatchData_match${matchId}`);
            
            // Si c'est le match actuellement en direct, nettoyer aussi cette entrée
            const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
            if (liveData.matchId === matchId) {
                localStorage.removeItem('liveMatchData');
            }
            
            // Stocker des informations sur le dernier match terminé pour que badminton.html puisse le détecter
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
        window.location.href = 'badminton.html?refresh=' + Date.now() + 
                               '&forceClear=' + matchId + 
                               '&matchStatus=termine' + 
                               '&preserveFinished=true#final-phase';

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

    // Vérifier l'état actuel des indicateurs de service
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    
    // S'assurer que server est bien défini
    if (!window.server) {
        window.server = 'A'; // Valeur par défaut
    }

    const liveData = {
        matchId: new URLSearchParams(window.location.search).get('matchId'),
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en_cours',
        server: window.server // Utiliser la variable globale server
    };

    // Log des données pour débogage
    console.log("Mise à jour des données en direct avec server=", window.server);
    
    // Sauvegarder en localStorage
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));

    // Mettre à jour l'objet badmintonMatchData
    badmintonMatchData.teamA.score = matchData.teamA.score;
    badmintonMatchData.teamB.score = matchData.teamB.score;
    badmintonMatchData.chrono = document.getElementById('gameChrono').textContent;
    
    // Sauvegarder en localStorage
    localStorage.setItem(
        `liveMatchData_badminton_${badmintonMatchData.matchId}`,
        JSON.stringify(badmintonMatchData)
    );

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
    console.log(`Nouveau serveur: ${server}`);

    // Mettre à jour les icônes 
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    
    if (ballIconA && ballIconB) {
        // Utiliser opacity au lieu de visibility pour une cohérence totale
        ballIconA.style.opacity = server === 'A' ? '1' : '0';
        ballIconB.style.opacity = server === 'B' ? '1' : '0';
        
        // Ajouter une classe active pour l'animation si définie
        ballIconA.classList.remove('active');
        ballIconB.classList.remove('active');
        
        if (server === 'A') {
            ballIconA.classList.add('active');
        } else {
            ballIconB.classList.add('active');
        }
        
        console.log(`Visibilité mise à jour: IconA=${ballIconA.style.opacity}, IconB=${ballIconB.style.opacity}`);
    } else {
        console.warn("Les icônes de service n'ont pas été trouvées dans le DOM");
    }

    // Mettre à jour les données en direct pour synchroniser avec affichage_score.html
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    
    // Créer un objet de données complètes pour le match
    const liveData = {
        matchId: matchId,
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en_cours',
        server: server
    };

    // Sauvegarder dans la clé générique
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));
    
    // Et aussi dans la clé spécifique au match pour plus de fiabilité
    if (matchId) {
        localStorage.setItem(`liveMatchData_match${matchId}`, JSON.stringify(liveData));
        console.log(`Données de service enregistrées pour le match ${matchId}`);
    }
    
    console.log(`Service changé à l'équipe ${server}`, liveData);
    
    // Force une mise à jour de l'affichage complet
    updateDisplay();
}

// Fonction pour définir le service explicitement (utilisée par setServer dans marquage.html)
function setService(team) {
    console.log(`Définition du service pour l'équipe ${team}`);
    window.server = team;
    
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    
    if (ballIconA && ballIconB) {
        // Réinitialiser les deux icônes
        ballIconA.style.opacity = '0';
        ballIconB.style.opacity = '0';
        
        // Activer la bonne icône
        if (team === 'A') {
            ballIconA.style.opacity = '1';
            ballIconA.classList.add('active');
            ballIconB.classList.remove('active');
        } else if (team === 'B') {
            ballIconB.style.opacity = '1';
            ballIconB.classList.add('active');
            ballIconA.classList.remove('active');
        }
    }
    
    // Mettre à jour les données en direct
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (matchId) {
        const liveData = {
            matchId: matchId,
            score1: document.getElementById('teamAScore').textContent,
            score2: document.getElementById('teamBScore').textContent,
            chrono: document.getElementById('gameChrono').textContent,
            status: 'en_cours',
            team1: document.getElementById('teamAName').textContent,
            team2: document.getElementById('teamBName').textContent,
            matchType: document.getElementById('matchType').textContent,
            server: team
        };
        
        localStorage.setItem('liveMatchData', JSON.stringify(liveData));
        localStorage.setItem(`liveMatchData_match${matchId}`, JSON.stringify(liveData));
        console.log("Données mises à jour avec serveur:", liveData);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser WebSocket
    initWebSocket();
    
    // Récupérer explicitement l'ID du match depuis l'URL ou depuis matchData
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    console.log("ID du match détecté:", matchId);
    
    // Mettre le match en status "en cours" au chargement avec un léger délai
    if (matchId) {
        setTimeout(() => {
            if (typeof updateMatchStatus === 'function') {
                updateMatchStatus('en_cours');
            }
        }, 500);
    }

    // Identifier les éléments d'icône de service
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');

    // Rendre les icônes invisibles par défaut avec opacity au lieu de visibility
    if (ballIconA && ballIconB) {
        ballIconA.style.opacity = '0';
        ballIconB.style.opacity = '0';
        
        // Définir le serveur initial
        setTimeout(() => {
            // Définir le service initial à A
            setService('A');
        }, 500);
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

    // S'assurer que le serveur est initialisé à une valeur par défaut
    if (!window.server) {
        window.server = 'A'; // Valeur par défaut
    }
    
    // Stocker la valeur initiale dans localStorage avec le matchId récupéré ci-dessus
    const liveData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    liveData.server = window.server;
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));
    
    // Créer ou mettre à jour la clé de match spécifique aussi
    if (matchId) {
        const matchSpecificData = JSON.parse(localStorage.getItem(`liveMatchData_match${matchId}`) || '{}');
        matchSpecificData.server = window.server;
        matchSpecificData.matchId = matchId;
        localStorage.setItem(`liveMatchData_match${matchId}`, JSON.stringify(matchSpecificData));
    }
    
    console.log("Serveur initialisé à:", window.server);
    
    // S'assurer que le serveur est initialisé et que les icônes sont correctement configurées
    if (!window.server) {
        window.server = 'A'; // Valeur par défaut
    }
    
    
    if (ballIconA && ballIconB) {
        // S'assurer que les chemins d'images sont corrects
        if (!ballIconA.src || ballIconA.src === '') {
            ballIconA.src = '../img/badminton.png';
            ballIconA.onerror = function() { this.src = 'badminton.png'; };
        }
        
        if (!ballIconB.src || ballIconB.src === '') {
            ballIconB.src = '../img/badminton.png';
            ballIconB.onerror = function() { this.src = 'badminton.png'; };
        }
        
        // Initialiser la visibilité en fonction du serveur
        ballIconA.style.opacity = window.server === 'A' ? '1' : '0';
        ballIconB.style.opacity = window.server === 'B' ? '1' : '0';
        
        console.log(`Icônes initialisées avec serveur=${window.server}`);
    }
});