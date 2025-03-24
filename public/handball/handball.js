// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

// Ajouter une variable pour stocker le chrono
let currentChrono = '00:00';
// Variable pour la connexion Socket.io
let socket = null;
let socketConnected = false; // Indique si on utilise Socket.io ou le fallback

// Fonction pour établir la connexion Socket.io
function connectSocketIO() {
    try {
        console.log('Tentative de connexion Socket.io...');
        
        // Connexion au namespace /handball avec options
        socket = io('/handball', {
            forceNew: true, // Force une nouvelle connexion
            reconnectionAttempts: 5,
            timeout: 10000,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: { clientType: 'controller', matchId: matchData.matchId }
        });
        
        socket.on('connect', function() {
            console.log('Socket.io connecté');
            socketConnected = true;
            // S'enregistrer comme contrôleur pour ce match
            socket.emit('register', {
                matchId: matchData.matchId,
                role: 'controller'
            });
            
            // Demander les données actuelles en cas de reconnexion
            socket.emit('requestData', {
                matchId: matchData.matchId
            });
        });
        
        socket.on('connect_error', function(error) {
            console.error('Erreur Socket.io:', error);
            socketConnected = false;
            console.log('Utilisation du mode de secours avec localStorage');
        });
        
        socket.on('disconnect', function() {
            console.log('Socket.io déconnecté');
            socketConnected = false;
        });
        
        // Ajouter un gestionnaire pour les nouveaux affichages connectés
        socket.on('displayConnected', function(data) {
            if (data.matchId === matchData.matchId) {
                console.log('Nouvel affichage connecté, envoi des données à jour');
                sendUpdate('refresh');
            }
        });
        
        // Améliorer la gestion des reconnexions
        socket.io.on('reconnect', function() {
            console.log('Socket.io reconnecté - ré-enregistrement comme contrôleur');
            socket.emit('register', {
                matchId: matchData.matchId,
                role: 'controller'
            });
            
            // Forcer l'envoi des données actuelles
            sendUpdate('reconnect');
        });
        
        // Rendre le socket disponible globalement
        window.socket = socket;
        window.socketConnected = socketConnected;
        
        return socket;
        
    } catch (error) {
        console.error('Erreur lors de la connexion Socket.io:', error);
        socketConnected = false;
        return null;
    }
}

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
    
    // Envoyer l'état du chronomètre
    sendUpdate('chronoStart');
}

function stopChrono() {
    matchData.chrono.running = false;
    clearInterval(matchData.chrono.interval);
    
    // Envoyer l'état du chronomètre
    sendUpdate('chronoStop');
}

// Modifier la fonction de gestion du chrono
function updateChrono() {
    matchData.chrono.time++;
    const minutes = Math.floor(matchData.chrono.time / 60);
    const seconds = matchData.chrono.time % 60;
    document.getElementById('gameChrono').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    currentChrono = document.getElementById('gameChrono').textContent;
    
    // Envoyer la mise à jour du chrono
    sendUpdate('chronoUpdate');
}

// Fonction unifiée pour envoyer les mises à jour 
function sendUpdate(updateType) {
    // Préparer les données à envoyer
    const data = {
        matchId: matchData.matchId,
        updateType: updateType,
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        yellowCards1: matchData.teamA.yellowCards,
        yellowCards2: matchData.teamB.yellowCards,
        redCards1: matchData.teamA.redCards,
        redCards2: matchData.teamB.redCards,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en_cours',
        id_terrain: 8,
        timestamp: new Date().getTime(), // Ajouter un timestamp pour trier les mises à jour
        clientInfo: {
            socketId: socket ? socket.id : null,
            role: 'controller',
            browserInfo: window.navigator.userAgent.substring(0, 100) // informations limitées pour le débogage
        }
    };

    // TOUJOURS sauvegarder localement
    try {
        localStorage.setItem('liveMatchData', JSON.stringify(data));
        console.log('Données enregistrées dans localStorage');
        
        // Aussi sauvegarder avec le matchId comme clé spécifique
        localStorage.setItem(`liveMatchData_${data.matchId}`, JSON.stringify(data));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }

    // Essayer d'utiliser Socket.io même si localStorage a réussi
    if (window.io) {
        try {
            const socket = io('/handball');
            socket.emit('scoreUpdate', data);
            console.log('Données envoyées via Socket.io');
        } catch (error) {
            console.error('Erreur d\'envoi Socket.io:', error);
        }
    }

    // Pour garantir la synchronisation, on force une actualisation toutes les 3 secondes
    window.lastUpdateTime = Date.now();
}

// Fonctions pour les points et cartons
function addPoint(team) {
    matchData[`team${team}`].score++;
    updateDisplay();
    sendUpdate(`addPoint${team}`);
}

function subPoint(team) {
    if (matchData[`team${team}`].score > 0) {
        matchData[`team${team}`].score--;
        updateDisplay();
        sendUpdate(`subPoint${team}`);
    }
}

function addYellowCard(team) {
    matchData[`team${team}`].yellowCards++;
    updateDisplay();
    sendUpdate(`addYellow${team}`);
}

function subYellowCard(team) {
    if (matchData[`team${team}`].yellowCards > 0) {
        matchData[`team${team}`].yellowCards--;
        updateDisplay();
        sendUpdate(`subYellow${team}`);
    }
}

function addRedCard(team) {
    matchData[`team${team}`].redCards++;
    updateDisplay();
    sendUpdate(`addRed${team}`);
}

function subRedCard(team) {
    if (matchData[`team${team}`].redCards > 0) {
        matchData[`team${team}`].redCards--;
        updateDisplay();
        sendUpdate(`subRed${team}`);
    }
}

// Fonction de fin de match modifiée
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const team1 = document.getElementById('teamA').value;
    const team2 = document.getElementById('teamB').value;
    const score1 = matchData.teamA.score;
    const score2 = matchData.teamB.score;
    const matchType = new URLSearchParams(window.location.search).get('matchType');
    const winner = score1 > score2 ? team1 : (score1 < score2 ? team2 : null);
    const loser = score1 > score2 ? team2 : (score1 < score2 ? team1 : null);
    const isDraw = score1 === score2;

    try {
        // Récupérer l'état actuel du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('handballTournamentState'));
        
        if (tournamentState && tournamentState.matches) {
            // Mettre à jour le match avec le statut 'terminé'
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                team1: team1,
                team2: team2,
                score1: score1,
                score2: score2,
                status: 'terminé',
                winner: winner,
                loser: loser,
                draw: isDraw,
                matchType: matchType
            };

            // Sauvegarder l'état mis à jour
            localStorage.setItem('handballTournamentState', JSON.stringify(tournamentState));
        }

        // Envoyer le statut final
        sendUpdate('matchEnd');
        
        // Indiquer au serveur que le match est terminé via HTTP
        await updateMatchStatus('terminé');

        // Redirection vers la page principale
        window.location.href = 'handball.html' + (matchType === 'final' ? '#final-phase' : '#poule-phase');

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Fonction de mise à jour de l'affichage
function updateDisplay() {
    document.getElementById('teamAScore').textContent = matchData.teamA.score;
    document.getElementById('teamBScore').textContent = matchData.teamB.score;
    document.getElementById('teamAYellowCard').textContent = matchData.teamA.yellowCards;
    document.getElementById('teamBYellowCard').textContent = matchData.teamB.yellowCards;
    document.getElementById('teamARedCard').textContent = matchData.teamA.redCards;
    document.getElementById('teamBRedCard').textContent = matchData.teamB.redCards;
}

// Ajouter un écouteur pour le chrono
document.getElementById('gameChrono').addEventListener('change', updateChrono);

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Récupération des paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Récupérer les informations du match
    const team1 = urlParams.get('team1');
    const team2 = urlParams.get('team2');
    const matchType = urlParams.get('matchType');

    // Mettre à jour les noms d'équipes
    if (team1) {
        document.getElementById('teamAName').textContent = team1;
    }
    if (team2) {
        document.getElementById('teamBName').textContent = team2;
    }

    // Mettre à jour le type de match
    if (matchType) {
        document.getElementById('matchType').textContent = matchType;
    }

    const matchId = new URLSearchParams(window.location.search).get('matchId');
    matchData.matchId = matchId;
    
    // Charger l'état du tournoi
    const tournamentState = JSON.parse(localStorage.getItem('handballTournamentState'));
    if (tournamentState && tournamentState.matches[matchId]) {
        const match = tournamentState.matches[matchId];
        
        // Si le match est déjà terminé en mode correction, charger les scores existants
        if (match.status === 'terminé' && new URLSearchParams(window.location.search).get('correction') === 'true') {
            matchData.teamA.score = match.score1;
            matchData.teamB.score = match.score2;
        }
    }

    updateTeams();
    updateDisplay();
    
    // Mettre le match en status "en cours" au chargement
    updateMatchStatus('en_cours');
    
    // Essayer d'établir la connexion Socket.io, mais continuer même si ça échoue
    try {
        connectSocketIO();
    } catch (error) {
        console.error('Impossible de se connecter à Socket.io:', error);
        console.log('Utilisation du mode de secours avec localStorage');
        socketConnected = false;
    }
});

async function updateMatchStatus(status) {
    const matchId = matchData.matchId;
    if (!matchId) {
        console.error('Pas de matchId disponible');
        return;
    }

    try {
        console.log('Envoi de la mise à jour:', {
            matchId,
            status,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            id_terrain: 8  // Ajout de l'id_terrain=8 pour tous les matchs de handball
        });

        const response = await fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                score1: matchData.teamA.score || 0,
                score2: matchData.teamB.score || 0,
                id_terrain: 8  // Ajout de l'id_terrain=8 pour tous les matchs de handball
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur serveur');
        }

        const result = await response.json();
        console.log('Réponse du serveur:', result);
        return result;

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        // Si l'API échoue, stocker quand même dans localStorage pour ne pas perdre les données
        try {
            localStorage.setItem('match_status_' + matchId, JSON.stringify({
                status: status,
                score1: matchData.teamA.score || 0,
                score2: matchData.teamB.score || 0,
                id_terrain: 8
            }));
        } catch (e) {
            console.error('Impossible de sauvegarder dans localStorage:', e);
        }
        throw error;
    }
}