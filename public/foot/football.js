// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0, penalties: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0, penalties: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId'),
    hasPenalties: false
};

// Modifier les constantes des statuts
const MATCH_STATUS = {
    NOT_STARTED: 'à_venir',
    IN_PROGRESS: 'en_cours',
    FINISHED: 'terminé'
};

// Variables pour Socket.IO
let socket = null;
let isConnected = false;
let offlineMode = false;
const messageQueue = [];

// Fonction pour se connecter au serveur Socket.IO
function connectToServer() {
    try {
        console.log('Tentative de connexion Socket.IO...');
        
        // Initialiser la connexion Socket.IO (pas besoin de spécifier le protocole ws:// ou l'URL complète)
        socket = io({
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 5000
        });
        
        // Gestion des événements Socket.IO
        socket.on('connect', () => {
            console.log('✅ Socket.IO connecté!', socket.id);
            isConnected = true;
            
            // Rejoindre la room du sport football
            socket.emit('join_sport', 'football');
            
            // S'abonner au match spécifique
            if (matchData.matchId) {
                socket.emit('subscribe_match', {
                    matchId: matchData.matchId,
                    sport: 'football'
                });
            }
            
            // Vider la file d'attente
            processMessageQueue();
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket.IO déconnecté');
            isConnected = false;
            
            // Si la déconnexion est liée à un problème serveur et après plusieurs tentatives
            if (!socket.connected && socket.disconnected) {
                configureOfflineMode();
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Erreur de connexion Socket.IO:', error.message);
            
            // Après plusieurs échecs, passer en mode hors ligne
            if (socket.io.reconnectionAttempts === socket.io._reconnectionAttempts) {
                configureOfflineMode();
            }
        });
        
        // Autres événements spécifiques à l'application
        socket.on('update_received', (data) => {
            console.log('✅ Confirmation reçue:', data);
        });
        
        socket.on('match_updated', (data) => {
            console.log('📊 Mise à jour du match reçue:', data);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Socket.IO:', error);
        configureOfflineMode();
    }
}

// Traiter la file d'attente des messages
function processMessageQueue() {
    if (!isConnected || !socket) return;
    
    while (messageQueue.length > 0) {
        const { event, data } = messageQueue.shift();
        try {
            socket.emit(event, data);
            console.log(`📤 Message envoyé (${event}):`, data);
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi d'un message en file d'attente (${event}):`, error);
        }
    }
}

// Fonction pour envoyer un message via Socket.IO
function sendMessage(event, data) {
    // Toujours sauvegarder localement d'abord
    saveToLocalStorage(event, data);
    
    if (offlineMode || !socket) {
        console.log(`📴 Mode hors ligne, message (${event}) uniquement sauvegardé localement`);
        return;
    }
    
    if (!isConnected) {
        // Mettre en file d'attente pour envoi ultérieur
        messageQueue.push({ event, data });
        console.log(`⏳ Socket.IO non connecté, message mis en file d'attente (${event})`);
        return;
    }
    
    // Envoi immédiat si connecté
    try {
        socket.emit(event, data);
        console.log(`📤 Message envoyé (${event}):`, data);
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi du message (${event}):`, error);
        messageQueue.push({ event, data });
    }
}

// Configuration pour le mode hors-ligne
function configureOfflineMode() {
    console.log('📴 Activation du mode hors-ligne');
    offlineMode = true;
    
    // Afficher un message à l'utilisateur
    const offlineAlert = document.createElement('div');
    offlineAlert.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background-color: #f44336;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-size: 14px;
    `;
    offlineAlert.textContent = "Mode hors-ligne activé - Les données sont sauvegardées localement";
    document.body.appendChild(offlineAlert);
    
    // Le faire disparaître après 5 secondes
    setTimeout(() => {
        offlineAlert.style.opacity = '0';
        offlineAlert.style.transition = 'opacity 1s';
        setTimeout(() => offlineAlert.remove(), 1000);
    }, 5000);
}

// Fonction pour sauvegarder dans localStorage
function saveToLocalStorage(action, data) {
    try {
        // Sauvegarder l'état du match
        if (matchData.matchId) {
            localStorage.setItem(`match_state_${matchData.matchId}`, JSON.stringify({
                ...data,
                lastUpdate: new Date().toISOString(),
                action: action
            }));
            
            // Pour les mises à jour en direct
            if (action === 'update_match' || action === 'live_update') {
                localStorage.setItem('liveMatchData', JSON.stringify({
                    ...data,
                    matchId: matchData.matchId,
                    lastUpdate: new Date().toISOString()
                }));
            }
            
            // Mettre à jour l'état global du tournoi si nécessaire
            if (action === 'match_completed' || action === 'update_match_status') {
                const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState') || '{}');
                if (tournamentState.matches && tournamentState.matches[matchData.matchId]) {
                    tournamentState.matches[matchData.matchId] = {
                        ...tournamentState.matches[matchData.matchId],
                        ...data
                    };
                    localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
                }
            }
        }
    } catch (error) {
        console.error('Erreur de sauvegarde localStorage:', error);
    }
}

// Modifier la fonction updateMatchStatus pour utiliser Socket.IO
async function updateMatchStatus(status) {
    if (!matchData.matchId) {
        console.error('Pas de matchId disponible');
        return;
    }
    
    try {
        const data = {
            matchId: matchData.matchId,
            status: status,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            team1: document.getElementById('teamAName').textContent,
            team2: document.getElementById('teamBName').textContent,
            yellowCards1: matchData.teamA.yellowCards,
            yellowCards2: matchData.teamB.yellowCards,
            redCards1: matchData.teamA.redCards,
            redCards2: matchData.teamB.redCards
        };
        
        // Envoyer via Socket.IO et sauvegarder localement
        sendMessage('update_match_status', data);
        
        // Déclencher un événement pour les autres onglets
        window.dispatchEvent(new CustomEvent('matchUpdate', { 
            detail: { matchId: matchData.matchId, status: status } 
        }));
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
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

    // Créer les données en direct
    const liveData = {
        matchId: matchData.matchId,
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
        status: 'en_cours'
    };

    // Sauvegarder pour l'affichage local et envoyer via Socket.IO
    sendMessage('live_update', liveData);
}

// Version mise à jour pour resetGame avec Socket.IO
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    try {
        stopChrono();
        const matchId = matchData.matchId;
        const score1 = matchData.teamA.score;
        const score2 = matchData.teamB.score;
        const penalties1 = matchData.teamA.penalties || 0;
        const penalties2 = matchData.teamB.penalties || 0;
        const isInPenalties = document.getElementById('penaltiesSection')?.style.display === 'block';
        
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;

        // Déterminer le vainqueur
        let winner, loser;
        if (isInPenalties) {
            winner = penalties1 > penalties2 ? team1 : team2;
            loser = penalties1 > penalties2 ? team2 : team1;
        } else {
            winner = score1 > score2 ? team1 : team2;
            loser = score1 > score2 ? team2 : team1;
        }

        // Préparer les données finales
        const finalData = {
            matchId,
            score1,
            score2,
            penalties1,
            penalties2,
            team1,
            team2,
            winner,
            loser,
            hasPenalties: matchData.hasPenalties,
            status: 'terminé'
        };
        
        // Envoyer via Socket.IO et sauvegarder localement
        sendMessage('match_completed', finalData);

        // Attendre un peu pour s'assurer que tout est bien traité
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = 'football.html';

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Version mise à jour de updateTeams pour Socket.IO
function updateTeams() {
    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');
    const teamAName = document.getElementById('teamAName');
    const teamBName = document.getElementById('teamBName');
    
    if (teamA && teamB && teamAName && teamBName) {
        teamAName.textContent = teamA.value || 'Team A';
        teamBName.textContent = teamB.value || 'Team B';
    }
    
    // Mise à jour via Socket.IO
    sendMessage('update_teams', {
        matchId: matchData.matchId,
        team1: teamAName.textContent,
        team2: teamBName.textContent,
        status: 'en_cours',
        score1: matchData.teamA.score,
        score2: matchData.teamB.score
    });
}

// Modifier l'event listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    matchData.matchId = matchId;

    console.log('Initialisation de la page de marquage pour le match:', matchId);
    
    // Ajouter le script Socket.IO s'il n'est pas déjà présent
    if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = () => {
            console.log('✅ Socket.IO chargé avec succès');
            connectToServer();
        };
        script.onerror = (error) => {
            console.error('❌ Erreur lors du chargement de Socket.IO:', error);
            configureOfflineMode();
        };
        document.head.appendChild(script);
    } else {
        connectToServer();
    }

    // Charger l'état sauvegardé du match depuis localStorage
    try {
        const savedState = localStorage.getItem(`match_state_${matchId}`);
        if (savedState) {
            const state = JSON.parse(savedState);
            console.log('État chargé depuis localStorage:', state);
            
            // Restaurer les données
            if (state.teamA) matchData.teamA = state.teamA;
            if (state.teamB) matchData.teamB = state.teamB;
            if (state.chrono) matchData.chrono = state.chrono;
            
            // Mettre à jour l'affichage
            document.getElementById('teamAScore').textContent = matchData.teamA.score || '0';
            document.getElementById('teamBScore').textContent = matchData.teamB.score || '0';
            document.getElementById('teamAYellowCard').textContent = matchData.teamA.yellowCards || '0';
            document.getElementById('teamBYellowCard').textContent = matchData.teamB.yellowCards || '0';
            document.getElementById('teamARedCard').textContent = matchData.teamA.redCards || '0';
            document.getElementById('teamBRedCard').textContent = matchData.teamB.redCards || '0';
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
    }

    // Préparer l'interface
    updateTeams();
    updateDisplay();
    
    // Redémarrer le chronomètre si le match était en cours
    if (matchData.chrono.running) {
        startChrono();
    }
    
    // Mettre le match en cours
    await updateMatchStatus('en_cours');

    // S'assurer que le chrono est correctement initialisé
    if (!matchData.chrono) {
        matchData.chrono = { time: 0, running: false, interval: null };
    }
    
    // Initialisation de l'affichage du chrono
    document.getElementById('gameChrono').textContent = '00:00';
});

// Fonctions pour le chronomètre - version corrigée
function startChrono() {
    if (!matchData.chrono.running) {
        console.log('Démarrage du chrono...');
        
        // S'assurer que le temps est initialisé correctement
        if (matchData.chrono.time === undefined) {
            matchData.chrono.time = 0;
        }
        
        matchData.chrono.running = true;
        matchData.chrono.interval = setInterval(updateChrono, 1000);
        
        // Mettre à jour l'affichage immédiatement
        updateDisplay();
        
        // Sauvegarder l'état sans changer le statut du match
        saveToLocalStorage('chrono_update', {
            matchId: matchData.matchId,
            chrono: document.getElementById('gameChrono').textContent,
            running: true
        });
    }
}

function stopChrono() {
    if (matchData.chrono.running) {
        console.log('Arrêt du chrono');
        matchData.chrono.running = false;
        clearInterval(matchData.chrono.interval);
        
        // Sauvegarder l'état 
        saveToLocalStorage('chrono_update', {
            matchId: matchData.matchId,
            chrono: document.getElementById('gameChrono').textContent,
            running: false
        });
    }
}

function updateChrono() {
    if (!matchData.chrono) {
        matchData.chrono = { time: 0, running: true };
    }
    
    matchData.chrono.time++;
    const minutes = Math.floor(matchData.chrono.time / 60);
    const seconds = matchData.chrono.time % 60;
    
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('gameChrono').textContent = formattedTime;
    
    // Mettre à jour l'affichage pour les autres écrans
    updateDisplay();
}

// Mise à jour des fonctions de gestion des scores
function addPoint(team) {
    matchData[`team${team}`].score++;
    updateDisplay();
    // Sauvegarder immédiatement l'état après modification du score
    saveMatchState();
}

function subPoint(team) {
    if (matchData[`team${team}`].score > 0) {
        matchData[`team${team}`].score--;
        updateDisplay();
        // Sauvegarder immédiatement l'état après modification du score
        saveMatchState();
    }
}

function addYellowCard(team) {
    matchData[`team${team}`].yellowCards++;
    updateDisplay();
}

function subYellowCard(team) {
    if (matchData[`team${team}`].yellowCards > 0) {
        matchData[`team${team}`].yellowCards--;
        updateDisplay();
    }
}

function addRedCard(team) {
    matchData[`team${team}`].redCards++;
    updateDisplay();
}

function subRedCard(team) {
    if (matchData[`team${team}`].redCards > 0) {
        matchData[`team${team}`].redCards--;
        updateDisplay();
    }
}

// Ajouter cette nouvelle fonction pour sauvegarder l'état du match
function saveMatchState() {
    const state = {
        matchId: matchData.matchId,
        teamA: matchData.teamA,
        teamB: matchData.teamB,
        chrono: matchData.chrono,
        status: 'en_cours'
    };

    // Sauvegarder dans le localStorage
    localStorage.setItem(`match_state_${matchData.matchId}`, JSON.stringify(state));

    // Mettre à jour l'état du tournoi
    const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState') || '{}');
    if (tournamentState.matches) {
        tournamentState.matches[matchData.matchId] = {
            ...tournamentState.matches[matchData.matchId],
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            status: 'en_cours',
            team1: document.getElementById('teamAName').textContent,
            team2: document.getElementById('teamBName').textContent
        };
        localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
    }
}

// Nouvelle fonction pour vérifier s'il faut des tirs au but
function checkForPenalties() {
    if (matchData.teamA.score === matchData.teamB.score) {
        if (confirm('Match nul ! Passer aux tirs au but ?')) {
            document.getElementById('penaltiesSection').style.display = 'block';
            matchData.hasPenalties = true;
        }
    } else {
        resetGame();
    }
}

// Fonctions pour les tirs au but
function addPenalty(team) {
    matchData[`team${team}`].penalties = Number(matchData[`team${team}`].penalties || 0) + 1;
    updatePenaltiesDisplay();
    saveMatchState();
}

function subPenalty(team) {
    if (matchData[`team${team}`].penalties > 0) {
        matchData[`team${team}`].penalties = Number(matchData[`team${team}`].penalties) - 1;
        updatePenaltiesDisplay();
        saveMatchState();
    }
}

function updatePenaltiesDisplay() {
    const teamAPenalties = document.getElementById('teamAPenalties');
    const teamBPenalties = document.getElementById('teamBPenalties');
    
    if (teamAPenalties && teamBPenalties) {
        teamAPenalties.textContent = matchData.teamA.penalties || 0;
        teamBPenalties.textContent = matchData.teamB.penalties || 0;
    }
}

// Ajouter cette nouvelle fonction pour basculer entre mode normal et tirs au but
function toggleMatchMode() {
    const normalSection = document.getElementById('normalMatchSection');
    const penaltiesSection = document.getElementById('penaltiesSection');
    const switchButton = document.getElementById('switchModeButton');
    
    if (penaltiesSection.style.display === 'none') {
        // Passer aux tirs au but
        normalSection.style.display = 'none';
        penaltiesSection.style.display = 'block';
        switchButton.textContent = 'Mode Normal';
        stopChrono(); // Arrêter le chrono si actif
    } else {
        // Retour au mode normal
        normalSection.style.display = 'block';
        penaltiesSection.style.display = 'none';
        switchButton.textContent = 'Tirs au but';
    }
}
