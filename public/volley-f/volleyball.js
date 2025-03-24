// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

// Variables WebSocket
let socket;
let socketConnected = false;
let isUpdating = false;

// Mode hors ligne pour fonctionner sans serveur
let offlineMode = false;

// Configuration des timeouts
const CONNECTION_TIMEOUT = 10000; // 10 secondes
const RETRY_DELAY = 2000; // 2 secondes
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

// Configuration des timeouts et de l'inactivité
const INACTIVITY_TIMEOUT = 20000; // 20 secondes
const RECONNECT_INTERVAL = 5000;  // 5 secondes
let lastActivityTime = Date.now();
let inactivityTimer;
let reconnectAttempts = 0;

// Nouvelle fonction pour gérer l'activité
function updateActivityTimestamp() {
    lastActivityTime = Date.now();
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    startInactivityTimer();
}

function startInactivityTimer() {
    inactivityTimer = setTimeout(() => {
        const inactiveDuration = Math.floor((Date.now() - lastActivityTime) / 1000);
        console.log(`Inactivité détectée depuis ${inactiveDuration}s`);
        
        // Si la connexion est active, vérifier l'état
        if (socket && socketConnected) {
            socket.emit('ping', response => {
                if (!response) {
                    handleConnectionLoss('Timeout de réponse serveur');
                }
            });
        }
    }, INACTIVITY_TIMEOUT);
}

function handleConnectionLoss(reason) {
    console.warn(`Perte de connexion: ${reason}`);
    socketConnected = false;
    updateConnectionIndicator('disconnected', reason);
    
    // Planifier une reconnexion si pas déjà en cours
    if (!reconnectInterval) {
        reconnectInterval = setInterval(() => attemptReconnection(), RECONNECT_INTERVAL);
    }
}

function attemptReconnection() {
    if (reconnectAttempts >= 3) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
        setOfflineMode(true, 'Échec des tentatives de reconnexion');
        return;
    }
    
    reconnectAttempts++;
    console.log(`Tentative de reconnexion ${reconnectAttempts}/3...`);
    
    if (socket) {
        socket.disconnect();
        socket.connect();
    }
}

// Configuration des timeouts et de la connexion
const CONFIG = {
    INITIAL_TIMEOUT: 5000,      // 5 secondes pour la connexion initiale
    RECONNECT_DELAY: 2000,      // 2 secondes entre les tentatives
    MAX_RECONNECT: 3,           // Maximum 3 tentatives
    PING_INTERVAL: 10000,       // Ping toutes les 10 secondes
    PING_TIMEOUT: 3000          // 3 secondes pour recevoir une réponse au ping
};

// État de la connexion
let connectionState = {
    attempts: 0,
    lastPingTime: Date.now(),
    pingInterval: null,
    reconnectTimeout: null
};

function initWebSocket() {
    try {
        // Nettoyer les intervalles existants
        clearAllIntervals();
        
        socket = io({
            reconnection: true,
            reconnectionAttempts: CONFIG.MAX_RECONNECT,
            reconnectionDelay: CONFIG.RECONNECT_DELAY,
            timeout: CONFIG.INITIAL_TIMEOUT,
            transports: ['polling', 'websocket']
        });

        // Gestionnaire de connexion
        socket.on('connect', () => {
            console.log('Connecté au serveur WebSocket');
            socketConnected = true;
            connectionState.attempts = 0;
            updateConnectionIndicator('connected');
            socket.emit('join_sport', 'volley-f');
            startPingMonitoring();
        });

        // Gestionnaire de déconnexion
        socket.on('disconnect', (reason) => {
            handleDisconnection(reason);
        });

        // Gestion des erreurs de connexion
        socket.on('connect_error', (error) => {
            handleConnectionError(error);
        });

        // Surveillance des pings
        socket.on('pong', () => {
            connectionState.lastPingTime = Date.now();
        });

    } catch (error) {
        console.error('Erreur d\'initialisation WebSocket:', error);
        setOfflineMode(true, error.message);
    }
}

function handleDisconnection(reason) {
    console.log('Déconnexion WebSocket:', reason);
    socketConnected = false;
    updateConnectionIndicator('disconnected', reason);

    if (connectionState.attempts < CONFIG.MAX_RECONNECT) {
        connectionState.attempts++;
        console.log(`Tentative de reconnexion ${connectionState.attempts}/${CONFIG.MAX_RECONNECT}`);
        
        connectionState.reconnectTimeout = setTimeout(() => {
            if (!socketConnected) {
                socket.connect();
            }
        }, CONFIG.RECONNECT_DELAY);
    } else {
        setOfflineMode(true, 'Nombre maximum de tentatives atteint');
    }
}

function handleConnectionError(error) {
    console.error('Erreur de connexion:', error);
    updateConnectionIndicator('error', error.message);
    
    if (error.message.includes('timeout')) {
        setOfflineMode(true, 'Délai de connexion dépassé');
    }
}

function startPingMonitoring() {
    // Arrêter l'intervalle existant si présent
    if (connectionState.pingInterval) {
        clearInterval(connectionState.pingInterval);
    }

    connectionState.pingInterval = setInterval(() => {
        if (socketConnected) {
            const now = Date.now();
            const timeSinceLastPing = now - connectionState.lastPingTime;

            if (timeSinceLastPing > CONFIG.PING_TIMEOUT) {
                console.warn('Pas de réponse au ping, tentative de reconnexion');
                socket.disconnect();
                socket.connect();
            } else {
                socket.emit('ping');
            }
        }
    }, CONFIG.PING_INTERVAL);
}

function clearAllIntervals() {
    if (connectionState.pingInterval) {
        clearInterval(connectionState.pingInterval);
    }
    if (connectionState.reconnectTimeout) {
        clearTimeout(connectionState.reconnectTimeout);
    }
}

// Amélioration de la fonction updateConnectionIndicator
function updateConnectionIndicator(status, message = '') {
    const indicator = document.getElementById('connectionIndicator');
    if (!indicator) return;

    const statusConfig = {
        connected: { icon: '🟢', text: 'Connecté', bg: '#d4edda', color: '#155724' },
        disconnected: { icon: '🔴', text: 'Déconnecté', bg: '#f8d7da', color: '#721c24' },
        error: { icon: '⚠️', text: 'Erreur', bg: '#f8d7da', color: '#721c24' },
        reconnecting: { icon: '🔄', text: 'Reconnexion', bg: '#fff3cd', color: '#856404' }
    };

    const config = statusConfig[status] || statusConfig.disconnected;
    indicator.innerHTML = `${config.icon} ${config.text}${message ? `: ${message}` : ''}`;
    indicator.style.backgroundColor = config.bg;
    indicator.style.color = config.color;
}

// Mettre à jour la variable globale
function updateServer(newServer) {
    server = newServer;
    
    // Mettre à jour les icônes de volleyball
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }
}

// Mise à jour du score depuis une source distante
function updateScoreFromRemote(data) {
    isUpdating = true;
    try {
        // Mettre à jour les scores en fonction des données reçues
        if (data.teamAScore !== undefined) matchData.teamA.score = parseInt(data.teamAScore);
        if (data.teamBScore !== undefined) matchData.teamB.score = parseInt(data.teamBScore);
        if (data.server) updateServer(data.server);
        
        // Mettre à jour l'affichage
        document.getElementById('teamAScore').textContent = matchData.teamA.score;
        document.getElementById('teamBScore').textContent = matchData.teamB.score;
    } finally {
        isUpdating = false;
    }
}

// Afficher l'indicateur de connexion
function updateConnectionIndicator(isConnected) {
    const indicator = document.getElementById('connectionIndicator');
    if (!indicator) return;

    if (isConnected) {
        indicator.textContent = '🟢 En ligne';
        indicator.style.backgroundColor = '#d4edda';
        indicator.style.color = '#155724';
    } else {
        indicator.textContent = '🔴 Hors ligne';
        indicator.style.backgroundColor = '#f8d7da';
        indicator.style.color = '#721c24';
    }
}

// Nouvelle fonction: démarrer/arrêter les pings
let pingInterval = null;

function startPingInterval() {
    if (pingInterval) return;
    pingInterval = setInterval(() => {
        if (socket && socketConnected) {
            socket.emit('ping', (response) => {
                console.log('Ping réussi, réponse:', response);
            });
        }
    }, 30000); // Ping toutes les 30 secondes
}

function stopPingInterval() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

// Fonction pour activer/désactiver le mode hors ligne
function setOfflineMode(enabled, reason = '') {
    offlineMode = enabled;
    if (enabled) {
        console.log(`Mode hors ligne activé: ${reason}`);
        // Afficher un indicateur dans l'interface
        updateConnectionIndicator('offline', reason);
    } else {
        console.log('Mode hors ligne désactivé');
        updateConnectionIndicator('connected');
    }
}

// Mettre à jour l'indicateur de connexion dans l'interface
function updateConnectionIndicator(status, message = '') {
    // Créer l'indicateur s'il n'existe pas
    let indicator = document.getElementById('connectionIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '1000';
        document.body.appendChild(indicator);
    }
    
    // Mettre à jour l'apparence selon le statut
    switch (status) {
        case 'connected':
            indicator.textContent = '✅ Connecté';
            indicator.style.backgroundColor = '#d4edda';
            indicator.style.color = '#155724';
            break;
        case 'disconnected':
            indicator.textContent = '❌ Déconnecté';
            indicator.style.backgroundColor = '#f8d7da';
            indicator.style.color = '#721c24';
            break;
        case 'reconnecting':
            indicator.textContent = '🔄 Reconnexion en cours...';
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#856404';
            break;
        case 'error':
            indicator.textContent = `❌ Erreur: ${message}`;
            indicator.style.backgroundColor = '#f8d7da';
            indicator.style.color = '#721c24';
            break;
        case 'offline':
            indicator.textContent = `📵 Mode hors ligne ${message ? '(' + message + ')' : ''}`;
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#856404';
            break;
        default:
            indicator.textContent = '⏳ Connexion...';
            indicator.style.backgroundColor = '#e2e3e5';
            indicator.style.color = '#383d41';
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

// Fonction pour mettre à jour le statut du match
function updateMatchStatus(status) {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const liveData = JSON.parse(localStorage.getItem('liveMatchData_volleyF') || '{}');
    liveData.status = status;
    localStorage.setItem('liveMatchData_volleyF', JSON.stringify(liveData));

    // Mettre à jour l'indicateur de statut visuel dans l'interface
    if (typeof updateStatusIndicator === 'function') {
        updateStatusIndicator(status);
    }

    // Si en mode hors ligne, sauvegarder uniquement localement
    if (offlineMode) {
        console.log(`Mode hors ligne - statut "${status}" sauvegardé localement uniquement`);
        return;
    }

    // Si WebSocket est disponible et connecté, utiliser WebSocket
    if (socket && socketConnected) {
        console.log(`Envoi du statut "${status}" pour le match ${matchId} via WebSocket`);
        
        socket.emit('update_match_status', {
            matchId: matchId,
            status: status,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            tournamentId: 'volleyF' // Identifier le tournoi
        });
    } else {
        // Fallback HTTP si WebSocket n'est pas disponible
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                score1: matchData.teamA.score,
                score2: matchData.teamB.score,
                id_terrain: 9 // Par défaut pour volleyball
            }),
            signal: controller.signal
        }).then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.error(`Erreur lors de la mise à jour du statut: ${response.status}`);
                setOfflineMode(true, `Erreur serveur: ${response.status}`);
            } else {
                console.log(`Statut du match mis à jour avec succès: ${status}`);
            }
        }).catch(error => {
            clearTimeout(timeoutId);
            console.error('Erreur lors de la mise à jour du statut:', error);
            if (error.name === 'AbortError') {
                console.log('Délai d\'attente dépassé pour la mise à jour du statut');
                setOfflineMode(true, 'Délai dépassé');
            } else {
                setOfflineMode(true, error.message);
            }
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
        const tournamentState = JSON.parse(localStorage.getItem('volleyFTournamentState')) || { matches: {} };
        
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
            localStorage.setItem('volleyFTournamentState', JSON.stringify(tournamentState));
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
                matchType,
                tournamentId: 'volleyF' // Identifier le tournoi
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
        status: 'en_cours',
        server: server // Ajouter le serveur actuel
    };

    // Sauvegarder en localStorage avec une clé spécifique pour volley féminin
    localStorage.setItem('liveMatchData_volleyF', JSON.stringify(liveData));

    // Mettre à jour l'objet volleyHMatchData
    volleyHMatchData.teamA.score = matchData.teamA.score;
    volleyHMatchData.teamB.score = matchData.teamB.score;
    volleyHMatchData.chrono = document.getElementById('gameChrono').textContent;
    
    // Sauvegarder en localStorage avec une clé spécifique pour volley féminin
    localStorage.setItem(
        `liveMatchData_volleyF_${volleyHMatchData.matchId}`,
        JSON.stringify(volleyHMatchData)
    );

    // Stocker les données à synchroniser
    window.dataToSync = {
        matchId: liveData.matchId,
        status: liveData.status,
        score1: liveData.score1,
        score2: liveData.score2,
        server: liveData.server
    };

    // Ne pas essayer de synchroniser si en mode hors ligne
    if (offlineMode) {
        console.log('Mode hors ligne - pas de synchronisation avec le serveur');
        return;
    }

    // Envoyer les données au serveur via WebSocket si disponible
    if (socket && socketConnected) {
        socket.emit('update_match_status', {
            matchId: liveData.matchId,
            status: liveData.status,
            score1: liveData.score1,
            score2: liveData.score2,
            server: liveData.server,
            tournamentId: 'volleyF' // Identifier le tournoi
        });
    } else {
        // Sinon on utilise le code HTTP existant avec un timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('/api/match-status/' + liveData.matchId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: liveData.status,
                    score1: liveData.score1,
                    score2: liveData.score2,
                    server: liveData.server,
                    id_terrain: 9 // ID du terrain pour le volleyball
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('Données synchronisées avec le serveur avec succès');
            window.lastSyncSuccess = true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi des données au serveur:', error);
            window.lastSyncSuccess = false;
            
            if (error.name === 'AbortError') {
                setOfflineMode(true, 'Délai de requête dépassé');
            } else if (error.name === 'TypeError') {
                setOfflineMode(true, 'Serveur non disponible');
            } else {
                setOfflineMode(true, error.message);
            }
        }
    }
    // Envoyer les mises à jour via WebSocket
    sendLiveUpdate();
}

// Nouvelle fonction pour envoyer les mises à jour en direct
function sendLiveUpdate() {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) return;
    
    const liveData = {
        matchId,
        teamAName: document.getElementById('teamAName').textContent,
        teamBName: document.getElementById('teamBName').textContent,
        teamAScore: matchData.teamA.score,
        teamBScore: matchData.teamB.score,
        chrono: document.getElementById('gameChrono').textContent,
        server: server // Variable de l'équipe qui sert
    };
    
    // Mettre à jour le localStorage
    localStorage.setItem('liveMatchData', JSON.stringify(liveData));
    
    // Envoyer via WebSocket si connecté
    if (socket && socketConnected && !isUpdating) {
        socket.emit('volley_score_update', liveData);
    }
}

// Fonction pour synchroniser périodiquement avec le serveur
function setupPeriodicSync() {
    // Tenter de synchroniser toutes les 10 secondes
    window.syncInterval = setInterval(() => {
        // Ne pas tenter de synchroniser en mode hors ligne
        if (offlineMode) {
            return;
        }
        
        if (window.dataToSync && window.dataToSync.matchId && socketConnected) {
            // Utiliser WebSocket pour synchroniser quand disponible
            socket.emit('volley_score_update', window.dataToSync);
        }
    }, 10000);
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
    const liveData = JSON.parse(localStorage.getItem('liveMatchData_volleyF') || '{}');
    liveData.server = server;
    localStorage.setItem('liveMatchData_volleyF', JSON.stringify(liveData));

    // Mise à jour des icônes dans marquage.html
    const ballIconAInMarquage = document.getElementById('ballIconA');
    const ballIconBInMarquage = document.getElementById('ballIconB');
    if (ballIconAInMarquage && ballIconBInMarquage) {
        ballIconAInMarquage.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconBInMarquage.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }
}

// Ajouter une fonction de surveillance de la connexion
function startConnectionMonitoring() {
    let lastPingResponse = Date.now();
    let reconnecting = false;
    
    // Vérifier périodiquement si nous recevons des réponses du serveur
    setInterval(() => {
        if (!socket || !socketConnected || reconnecting) return;
        
        socket.emit('ping', (response) => {
            if (response) {
                lastPingResponse = Date.now();
            }
        });
        
        // Si pas de réponse depuis plus de 15 secondes, tenter une reconnexion
        const timeSinceLastResponse = Date.now() - lastPingResponse;
        if (timeSinceLastResponse > 15000) {
            console.warn(`Pas de réponse du serveur depuis ${Math.round(timeSinceLastResponse/1000)}s, tentative de reconnexion`);
            updateConnectionIndicator('reconnecting', 'Reconnexion en cours...');
            
            reconnecting = true;
            
            // Déconnexion puis reconnexion avec une pause
            socket.disconnect();
            
            // Tentative de reconnexion après un court délai
            setTimeout(() => {
                socket.connect();
                
                // Timeout pour vérifier si la reconnexion a réussi
                setTimeout(() => {
                    if (socket.connected) {
                        console.log('Reconnexion réussie');
                        updateConnectionIndicator('connected');
                    } else {
                        console.error('Échec de la reconnexion');
                        updateConnectionIndicator('offline', 'Serveur non disponible');
                        setOfflineMode(true, 'Reconnexion échouée');
                    }
                    reconnecting = false;
                }, 3000);
            }, 1000);
        }
    }, 5000);
}

// Ajouter un bouton de reconnexion dans l'interface
function addReconnectButton() {
    let reconnectBtn = document.getElementById('reconnectButton');
    if (!reconnectBtn) {
        reconnectBtn = document.createElement('button');
        reconnectBtn.id = 'reconnectButton';
        reconnectBtn.textContent = '🔄 Reconnecter';
        reconnectBtn.style.position = 'fixed';
        reconnectBtn.style.bottom = '20px';
        reconnectBtn.style.right = '20px';
        reconnectBtn.style.padding = '10px';
        reconnectBtn.style.backgroundColor = '#007bff';
        reconnectBtn.style.color = 'white';
        reconnectBtn.style.border = 'none';
        reconnectBtn.style.borderRadius = '5px';
        reconnectBtn.style.cursor = 'pointer';
        reconnectBtn.style.zIndex = '1000';
        reconnectBtn.onclick = () => {
            if (socket) {
                socket.disconnect();
                setTimeout(() => socket.connect(), 1000);
                updateConnectionIndicator('connecting', 'Reconnexion...');
            }
        };
        document.body.appendChild(reconnectBtn);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser directement WebSocket
    initWebSocket();
    
    // Ajouter un bouton de reconnexion manuelle pour l'utilisateur
    const reconnectBtn = document.createElement('button');
    reconnectBtn.textContent = '🔄 Reconnecter';
    reconnectBtn.style.position = 'fixed';
    reconnectBtn.style.bottom = '10px';
    reconnectBtn.style.right = '10px';
    reconnectBtn.style.zIndex = '1000';
    reconnectBtn.style.padding = '8px';
    reconnectBtn.style.backgroundColor = '#007bff';
    reconnectBtn.style.color = 'white';
    reconnectBtn.style.border = 'none';
    reconnectBtn.style.borderRadius = '4px';
    reconnectBtn.onclick = () => {
        if (socket) {
            socket.disconnect();
            setTimeout(() => {
                socket.connect();
            }, 1000);
        }
    };
    document.body.appendChild(reconnectBtn);
    
    // Mettre le match en status "en cours" au chargement avec un léger délai
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (matchId) {
        setTimeout(() => {
            console.log("Initialisation du statut 'en_cours'");
            updateMatchStatus('en_cours');
        }, 1500);
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