/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Variables globales
let correctionModeActive = false;
let socket;
let socketConnected = false;
let lastSyncTime = 0;

// Mode hors ligne - utiliser en cas d'indisponibilité du serveur
let offlineMode = false;

// Fonction pour initialiser WebSocket avec gestion d'erreur robuste
function initWebSocket() {
    try {
        // Vérifier si Socket.IO est disponible
        if (typeof io === 'undefined') {
            console.error('Socket.IO n\'est pas chargé - vérifiez que le script est inclus dans votre HTML');
            setOfflineMode(true, 'Socket.IO non chargé');
            return;
        }
        
        // Essayer de se connecter avec un timeout
        const connectionTimeout = setTimeout(() => {
            console.error('Délai de connexion WebSocket dépassé');
            setOfflineMode(true, 'Serveur non disponible');
        }, 5000);
        
        socket = io({
            reconnectionAttempts: 3,
            timeout: 5000,
            reconnectionDelay: 1000
        });
        
        socket.on('connect', () => {
            console.log('Connecté au serveur WebSocket');
            clearTimeout(connectionTimeout);
            socketConnected = true;
            setOfflineMode(false);
            // Indiquer au serveur qu'il s'agit d'un client volley féminin
            socket.emit('join_tournament', { tournamentId: 'volleyF' });
            updateConnectionUI('connected');
        });
        
        socket.on('disconnect', () => {
            console.log('Déconnecté du serveur WebSocket');
            socketConnected = false;
            setOfflineMode(true, 'Déconnecté du serveur');
            updateConnectionUI('disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('Erreur de connexion WebSocket:', error);
            socketConnected = false;
            setOfflineMode(true, 'Erreur de connexion');
            updateConnectionUI('error', error.message);
            
            // Ne pas continuer à essayer de se reconnecter après plusieurs échecs
            if (socket.io._reconnectionAttempts >= 3) {
                console.log('Arrêt des tentatives de reconnexion après 3 échecs');
                socket.io.reconnection(false);
            }
        });
        
        // Écouter les mises à jour de tournoi
        socket.on('tournament_updated', (data) => {
            console.log('Mise à jour du tournoi reçue:', data);
            if (data.tournamentType === 'volleyF') {
                updateTournamentFromServer(data);
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation WebSocket:', error);
        setOfflineMode(true, `Erreur: ${error.message}`);
    }
}

// Fonction pour activer/désactiver le mode hors ligne
function setOfflineMode(enabled, reason = '') {
    offlineMode = enabled;
    if (enabled) {
        console.log(`Mode hors ligne activé: ${reason}`);
        // Afficher une notification dans l'interface
        updateConnectionUI('offline', reason);
    } else {
        console.log('Mode hors ligne désactivé');
        updateConnectionUI('connected');
    }
}

// Mettre à jour l'interface utilisateur pour refléter l'état de la connexion
function updateConnectionUI(state, message = '') {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    
    connectionStatus.classList.remove('connected', 'disconnected', 'connecting', 'offline');
    
    switch (state) {
        case 'connected':
            connectionStatus.textContent = 'Connexion: ✅';
            connectionStatus.classList.add('connected');
            connectionStatus.style.backgroundColor = '#d4edda';
            connectionStatus.style.color = '#155724';
            break;
        case 'disconnected':
            connectionStatus.textContent = 'Connexion: ❌';
            connectionStatus.classList.add('disconnected');
            connectionStatus.style.backgroundColor = '#f8d7da';
            connectionStatus.style.color = '#721c24';
            break;
        case 'error':
            connectionStatus.textContent = `Erreur: ${message.substring(0, 20)}`;
            connectionStatus.classList.add('disconnected');
            connectionStatus.style.backgroundColor = '#f8d7da';
            connectionStatus.style.color = '#721c24';
            break;
        case 'offline':
            connectionStatus.textContent = `Mode hors ligne ${message ? '(' + message.substring(0, 20) + ')' : ''}`;
            connectionStatus.classList.add('offline');
            connectionStatus.style.backgroundColor = '#fff3cd';
            connectionStatus.style.color = '#856404';
            break;
        default:
            connectionStatus.textContent = 'Connexion: ⌛';
            connectionStatus.classList.add('connecting');
            connectionStatus.style.backgroundColor = '#e2e3e5';
            connectionStatus.style.color = '#383d41';
    }
}

// Fonction pour mettre à jour le tournoi depuis les données du serveur
function updateTournamentFromServer(data) {
    if (!data || !data.matches) return;
    
    // Vérifier si les données sont plus récentes que notre état local
    const serverLastUpdate = new Date(data.lastUpdate || 0).getTime();
    if (serverLastUpdate <= lastSyncTime) {
        console.log('Données ignorées car pas plus récentes que notre état local');
        return;
    }
    
    console.log('Mise à jour du tournoi avec les données du serveur');
    tournamentState = data;
    lastSyncTime = serverLastUpdate;
    
    // Mettre à jour l'interface utilisateur
    linkWinnersAndLosers();
    updateUI();
}

function toggleCorrectionMode() {
    correctionModeActive = !correctionModeActive;
    const button = document.getElementById('correctionMode');
    
    if (correctionModeActive) {
        button.style.backgroundColor = '#4CAF50';
        button.title = 'Mode correction actif';
    } else {
        button.style.backgroundColor = '#f44336';
        button.title = 'Mode correction inactif';
    }
}

// ----- LISTE DES ÉQUIPES -----
// On affiche toutes les équipes pour le classement final.
// La liste est triée alphabétiquement par défaut et les logos sont chargés depuis /img/{NomEquipe}.png.
const allTeams = [
  "ESPAS-ESTICE",
  "ESPOL",
  "ICAM",
  "FMMS",
  "USCHOOL",
  "FLSH",
  "FLD",
  "FGES",
  "JUNIA",
  "IESEG",
  "IKPO",
  "ESSLIL",
  "ISTC",
  "PIKTURA",
  "LiDD"
];

const teams = {};
allTeams.sort().forEach((name, index) => {
  teams[name] = {
    id: index + 1,
    name: name,
    logo: `/img/${name}.png`
  };
});

// ----- STRUCTURE DU TOURNOI -----
// La structure est définie par matchId avec les informations de chaque rencontre.
// Certains matchs possèdent des références (nextMatchWin, nextMatchLose) vers le match suivant.
let tournamentState = {
  matches: {
    // Qualifications (matchIds 1 à 3) : les perdants reçoivent 5 points (9ème)
    1: {
      matchType: 'qualification',
      team1: 'ESPAS-ESTICE',
      team2: 'USCHOOL',
      score1: 25,
      score2: 15,
      status: 'terminé',
      winner: 'ESPAS-ESTICE',
      loser: 'USCHOOL',
      time: '04/02'
    },
    // Quarts de finale (matchIds 4 à 7)
    4: {  // QF1
      matchType: 'quarterfinal',
      team1: 'ESPOL',
      team2: 'FMMS',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8,  // Le gagnant va en SF1
      time: '9:30'
    },
    5: {  // QF2
      matchType: 'quarterfinal', 
      team1: 'FLSH',
      team2: 'IKPO',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8,  // Le gagnant va en SF1
      time: '9:30'
    },
    6: {  // QF3
      matchType: 'quarterfinal',
      team1: 'JUNIA',
      team2: 'FLD',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9,  // Le gagnant va en SF2
      time: '10:30'
    },
    7: {  // QF4
      matchType: 'quarterfinal',
      team1: 'ESPAS-ESTICE',
      team2: 'FGES',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9,  // Le gagnant va en SF2
      time: '10:30'
    },
    // Demi-finales (matchIds 8 et 9)
    8: {
      matchType: 'semifinal',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 11,  // Gagnant va en finale
      nextMatchLose: 10,  // Perdant va en petite finale
      time: '11:30'
    },
    9: {
      matchType: 'semifinal',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 11,  // Gagnant va en finale
      nextMatchLose: 10,  // Perdant va en petite finale
      time: '11:30'
    },
    // Petite finale (matchId 10) pour la 3ème / 4ème place
    10: {
      matchType: 'smallfinal',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      time: '12:30'
    },
    // Finale (matchId 11) pour la 1ère / 2ème place
    11: {
      matchType: 'final',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      time: '12:30'
    }
  }
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
    localStorage.setItem('volleyFTournamentState', JSON.stringify(tournamentState));
    const updateTime = new Date().toISOString();
    localStorage.setItem('lastUpdate', updateTime);
    lastSyncTime = new Date(updateTime).getTime();
    
    // Synchroniser avec le serveur uniquement si le mode hors ligne est désactivé
    if (!offlineMode && socket && socketConnected) {
        console.log('Envoi de l\'état du tournoi au serveur via WebSocket');
        socket.emit('update_tournament', {
            tournamentType: 'volleyF',
            tournamentId: 'volleyF',
            ...tournamentState,
            lastUpdate: updateTime
        });
    } else if (!offlineMode) {
        console.log('WebSocket non disponible, sauvegarde locale uniquement');
        // Planifier une synchronisation différée uniquement si pas en mode hors ligne
        setTimeout(syncTournamentWithServer, 5000);
    } else {
        console.log('Mode hors ligne actif - sauvegarde locale uniquement');
    }
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
    const savedState = localStorage.getItem('volleyFTournamentState');
    if (savedState) {
        tournamentState = JSON.parse(savedState);
        return true;
    }
    return false;
}

// Nouvelle fonction pour synchroniser avec le serveur via HTTP avec meilleure gestion d'erreur
async function syncTournamentWithServer() {
    // Utiliser seulement WebSocket si disponible
    if (socket && socketConnected) {
        console.log('Synchronisation via WebSocket');
        socket.emit('get_tournament_state', { tournamentId: 'volleyF' });
        return true;
    }
    
    console.log('Synchronisation désactivée - API non disponible');
    return false;
    
    /* Code à réactiver quand l'API sera disponible
    try {
        const response = await fetch('/api/matches/volleyballF');
        if (response.ok) {
            const data = await response.json();
            // traitement des données...
        }
        return true;
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        return false;
    }
    */
}

// ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
const positionPoints = {
  // Points pour le tournoi masculin
  1: 50,  // Champion
  2: 40,  // Finaliste
  3: 30,  // 3ème place
  4: 20,  // 4ème place
  5: 15,  // Perdants des quarts de finale
  9: 5    // Perdants des qualifications
};

// ----- INITIALISATION -----
document.addEventListener('DOMContentLoaded', function() {
    // Tenter d'initialiser WebSocket
    initWebSocket();
    
    // Vérifier la connexion au serveur même si WebSocket échoue
    checkServerConnection();
    
    // Tente de charger l'état sauvegardé
    if (loadTournamentState()) {
        console.log('État précédent du tournoi chargé');
    } else {
        console.log('Nouveau tournoi initialisé');
    }
    
    // Recalculer les liens entre matchs pour s'assurer de la cohérence
    linkWinnersAndLosers();
    updateUI();
    addMatchClickHandlers();
    initializePageState();
    
    // Ajouter un élément pour afficher le statut de la connexion
    const header = document.querySelector('header');
    if (header) {
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connectionStatus';
        connectionStatus.className = 'connection-status';
        connectionStatus.textContent = 'Connexion en cours...';
        header.appendChild(connectionStatus);
    }
});

// Fonction pour vérifier la connexion au serveur (alternative à WebSocket)
function checkServerConnection() {
    // Utiliser Socket.IO pour tester la connexion au lieu de l'API
    if (typeof io !== 'undefined') {
        try {
            const testSocket = io({
                reconnection: false,
                timeout: 3000
            });
            
            testSocket.on('connect', () => {
                console.log('Serveur disponible via Socket.IO');
                setOfflineMode(false);
                setTimeout(() => testSocket.disconnect(), 500);
            });
            
            testSocket.on('connect_error', (error) => {
                console.warn('Erreur de connexion Socket.IO:', error.message);
                setOfflineMode(true, 'Serveur non disponible');
            });
            
            // Timeout de sécurité
            setTimeout(() => {
                if (testSocket.connected === false) {
                    console.warn('Délai de connexion dépassé');
                    setOfflineMode(true, 'Délai dépassé');
                    testSocket.disconnect();
                }
            }, 3000);
        } catch (error) {
            console.error('Erreur lors du test Socket.IO:', error);
            setOfflineMode(true, error.message);
        }
    } else {
        console.warn('Socket.IO non disponible, mode hors ligne activé');
        setOfflineMode(true, 'Socket.IO non disponible');
    }
}

// ----- LIEN ENTRE LES MATCHES (Vainqueur/Perdant vers le match suivant) -----
function linkWinnersAndLosers() {
    // Réinitialiser les équipes des demi-finales
    const sf1 = tournamentState.matches[8];
    const sf2 = tournamentState.matches[9];
    
    if (sf1.status !== 'terminé') {
        sf1.team1 = null;
        sf1.team2 = null;
    }
    if (sf2.status !== 'terminé') {
        sf2.team1 = null;
        sf2.team2 = null;
    }

    // Gérer les gagnants des quarts de finale
    for (let i = 4; i <= 7; i++) {
        const match = tournamentState.matches[i];
        if (match.status === 'terminé' && match.winner) {
            const semifinalId = i <= 5 ? 8 : 9;
            const semifinal = tournamentState.matches[semifinalId];
            
            if (!semifinal.team1) {
                semifinal.team1 = match.winner;
            } else if (!semifinal.team2 && semifinal.team1 !== match.winner) {
                semifinal.team2 = match.winner;
            }
        }
    }

    // Traiter les demi-finales vers la finale et petite finale
    const finalTeams = new Set();
    const smallFinalTeams = new Set();
    
    // Réinitialiser les équipes de la finale et petite finale
    const finalMatch = tournamentState.matches[11];
    const smallFinalMatch = tournamentState.matches[10];
    
    // On réinitialise ces matchs uniquement s'ils ne sont pas terminés
    if (finalMatch.status !== 'terminé') {
        finalMatch.team1 = null;
        finalMatch.team2 = null;
    }
    
    if (smallFinalMatch.status !== 'terminé') {
        smallFinalMatch.team1 = null;
        smallFinalMatch.team2 = null;
    }
    
    for (let matchId = 8; matchId <= 9; matchId++) {
        const match = tournamentState.matches[matchId];
        if (match.status === 'terminé' && match.winner && match.loser) {
            // Ajouter le gagnant à la finale
            if (!finalTeams.has(match.winner)) {
                if (!finalMatch.team1) {
                    finalMatch.team1 = match.winner;
                } else if (!finalMatch.team2 && finalMatch.team1 !== match.winner) {
                    finalMatch.team2 = match.winner;
                }
                finalTeams.add(match.winner);
            }
            
            // Ajouter le perdant à la petite finale
            if (!smallFinalTeams.has(match.loser)) {
                if (!smallFinalMatch.team1) {
                    smallFinalMatch.team1 = match.loser;
                } else if (!smallFinalMatch.team2 && smallFinalMatch.team1 !== match.loser) {
                    smallFinalMatch.team2 = match.loser;
                }
                smallFinalTeams.add(match.loser);
            }
        }
    }
}

// ----- MISE À JOUR DE L'INTERFACE (affichage des scores, logos et couleurs) -----
function updateUI() {
    Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
        const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
        if (!matchElement) return;
        
        // Ajouter ou mettre à jour le conteneur d'informations
        let infoContainer = matchElement.querySelector('.match-info-container');
        if (!infoContainer) {
            infoContainer = document.createElement('div');
            infoContainer.className = 'match-info-container';
            infoContainer.innerHTML = `
                <div class="match-time"></div>
                <div class="match-status"></div>
            `;
            matchElement.appendChild(infoContainer);
        }

        // Mettre à jour l'heure et le statut
        infoContainer.querySelector('.match-time').textContent = matchData.time || '';
        infoContainer.querySelector('.match-status').textContent = matchData.status.replace('_', ' ');
        
        // Reste de la fonction updateUI inchangé...
        const teamDivs = matchElement.querySelectorAll('.team');
        if (teamDivs.length < 2) return;
        
        fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
        fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
        
        matchElement.classList.remove('a_venir', 'en_cours', 'termine');
        matchElement.classList.add(matchData.status === 'terminé' ? 'termine' : 
                                 matchData.status === 'en_cours' ? 'en_cours' : 'a_venir');
    });
    
    // Mise à jour du classement
    updateRankingDisplay();
    
    // Mise à jour du champion
    const finalMatch = tournamentState.matches[11];
    const championDiv = document.getElementById('champion');
    if (championDiv) {
        if (finalMatch && finalMatch.status === 'terminé' && finalMatch.winner) {
            championDiv.textContent = finalMatch.winner;
            championDiv.style.display = 'block';
            championDiv.classList.add('champion-crowned');
        } else {
            championDiv.textContent = '-';
            championDiv.style.display = 'block';
            championDiv.classList.remove('champion-crowned');
        }
    }
    
    // Sauvegarde automatique
    saveTournamentState();
}

function fillTeamDiv(teamDiv, teamName, score, winnerName) {
    const nameDiv = teamDiv.querySelector('.team-name');
    const scoreDiv = teamDiv.querySelector('.score');
    
    if (!nameDiv || !scoreDiv) return;
    
    if (!teamName) {
        nameDiv.innerHTML = `<div class='team-logo'></div>-`;
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser');
        return;
    }
    
    const teamObj = teams[teamName];
    const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
    nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;
    
    if (score === null || score === undefined) {
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser');
    } else {
        scoreDiv.textContent = score;
        
        if (winnerName) {
            if (teamName === winnerName) {
                teamDiv.classList.add('winner');
                teamDiv.classList.remove('loser');
            } else {
                teamDiv.classList.add('loser');
                teamDiv.classList.remove('winner');
            }
        } else {
            teamDiv.classList.remove('winner', 'loser');
        }
    }
}

// ----- SIMULATION D'UN MATCH -----
async function simulateMatch(matchId) {
    const match = tournamentState.matches[matchId];
    if (!match || match.status === 'terminé' || !match.team1 || !match.team2) return;
    
    // Générer des scores aléatoires
    match.score1 = Math.floor(Math.random() * 6);
    match.score2 = Math.floor(Math.random() * 6);
    
    // S'assurer qu'il y a toujours un gagnant (pas d'égalité)
    if (match.score1 === match.score2) {
        match.score1++;
    }
    
    // Déterminer le gagnant et le perdant
    if (match.score1 > match.score2) {
        match.winner = match.team1;
        match.loser = match.team2;
    } else {
        match.winner = match.team2;
        match.loser = match.team1;
    }
    
    match.status = 'terminé';
    
    // Mettre à jour la progression du tournoi
    await linkWinnersAndLosers();
    await updateUI();
    
    // Ajouter l'envoi au serveur via WebSocket
    if (socket && socketConnected) {
        socket.emit('match_simulated', {
            tournamentType: 'volleyF',
            tournamentId: 'volleyF',  // Identifier clairement le tournoi
            matchId: matchId,
            result: {
                winner: match.winner,
                loser: match.loser,
                score1: match.score1,
                score2: match.score2,
                status: 'terminé'
            }
        });
    }
    
    saveTournamentState();
}

// ----- SIMULATION DE LA COMPÉTITION -----
async function simulateTournament() {
    // Trier les IDs de match pour les simuler dans l'ordre
    const ids = Object.keys(tournamentState.matches)
                     .map(x => parseInt(x))
                     .sort((a, b) => a - b);
    
    for (const id of ids) {
        const match = tournamentState.matches[id];
        if ((match.status === 'à_venir' || match.status === 'en_cours') && match.team1 && match.team2) {
            await simulateMatch(id);
            // Ajouter un délai pour que l'utilisateur puisse voir la progression
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    await linkWinnersAndLosers();
    saveTournamentState();
    updateRankingDisplay();
    
    alert('Simulation terminée !');
}

// ----- CALCUL DU CLASSEMENT FINAL -----
function calculateRankings() {
    let ranking = allTeams.map(name => ({ 
        name,
        pointsH: 0,    
        pointsF: 0,    
        totalPoints: 0, 
        position: null,
        finalPhase: null
    }));
    
    // Vérification sécurisée des matchs
    Object.entries(tournamentState.matches).forEach(([matchId, match]) => {
        if (!match) return; // Ignorer les matchs non définis
        
        // Qualifications (9ème place)
        if (match.matchType === 'qualification' && match.status === 'terminé' && match.loser) {
            const loserTeam = ranking.find(r => r.name === match.loser);
            if (loserTeam) loserTeam.pointsF = positionPoints[9];
        }
        
        // Quarts de finale (5ème place)
        if (match.matchType === 'quarterfinal' && match.status === 'terminé' && match.loser) {
            const loserTeam = ranking.find(r => r.name === match.loser);
            if (loserTeam) loserTeam.pointsF = positionPoints[5];
        }
        
        // Petite finale (3ème et 4ème places)
        if (match.matchType === 'smallfinal' && match.status === 'terminé') {
            if (match.winner) {
                const winnerTeam = ranking.find(r => r.name === match.winner);
                if (winnerTeam) winnerTeam.pointsF = positionPoints[3];
            }
            if (match.loser) {
                const loserTeam = ranking.find(r => r.name === match.loser);
                if (loserTeam) loserTeam.pointsF = positionPoints[4];
            }
        }
        
        // Finale (1ère et 2ème places)
        if (match.matchType === 'final' && match.status === 'terminé') {
            if (match.winner) {
                const winnerTeam = ranking.find(r => r.name === match.winner);
                if (winnerTeam) winnerTeam.pointsF = positionPoints[1];
            }
            if (match.loser) {
                const loserTeam = ranking.find(r => r.name === match.loser);
                if (loserTeam) loserTeam.pointsF = positionPoints[2];
            }
        }
    });
    
    // Calculer les points totaux
    ranking.forEach(team => {
        team.totalPoints = team.pointsH + team.pointsF;
    });
    
    // Trier par points totaux (décroissant)
    ranking.sort((a, b) => b.totalPoints - a.totalPoints);
    
    return ranking;
}

// ----- MISE À JOUR DU TABLEAU DE CLASSEMENT -----
async function updateRankingDisplay() {
    try {
        const ranking = calculateRankings();
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;
        
        rankingList.innerHTML = '';
        const teamPoints = {};
        
        ranking.forEach((team, idx) => {
            const position = idx + 1;
            const highlightClass = position <= 3 ? `highlight-${position}` : '';
            teamPoints[team.name] = team.totalPoints;
            
            rankingList.innerHTML += `
                <div class="ranking-row ${highlightClass}">
                    <div class="rank">${position}</div>
                    <div class="teamname">
                        <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                        ${team.name}
                    </div>
                    <div class="points">${team.totalPoints}</div>
                </div>
            `;
        });
        
        // Envoyer les points via WebSocket si disponible
        if (socket && socketConnected) {
            console.log('Envoi des points via WebSocket');
            socket.emit('update_points', {
                sport: 'volley-f',
                points: teamPoints
            });
        } else {
            // Fallback HTTP
            await sendPointsToServer(teamPoints);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du classement:', error);
    }
}

// Fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
    try {
        // Sauvegarde locale uniquement - pas d'appel API
        console.log('Points sauvegardés localement:', teamPoints);
        localStorage.setItem('volleyFPoints', JSON.stringify(teamPoints));
        return true;
        
        /* Code à réactiver quand l'API sera disponible
        const response = await fetch('/api/points/volley-f', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: teamPoints })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        */
    } catch (error) {
        console.log('Debug - Sauvegarde locale uniquement:', error);
        // Sauvegarde locale en cas d'erreur
        localStorage.setItem('volleyFPoints', JSON.stringify(teamPoints));
        return false;
    }
}

// ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) {
        return;
    }
    
    // Effacer les données sauvegardées
    localStorage.removeItem('volleyFTournamentState');
    localStorage.removeItem('lastUpdate');
    
    // Recharger la page
    window.location.reload();
}

// ----- GESTION DES CLICS SUR LES MATCHS -----
function addMatchClickHandlers() {
    document.querySelectorAll('.match[data-match-id]').forEach(match => {
        match.addEventListener('click', function() {
            const matchId = parseInt(this.dataset.matchId);
            const matchData = tournamentState?.matches?.[matchId];
            
            if (!matchData) {
                console.error(`Match ${matchId} non trouvé dans tournamentState`);
                return;
            }

            // Vérifier si le match peut être joué
            if (!canPlayMatch(matchId, matchData)) {
                return;
            }

            // Mode correction ou nouveau match
            if (correctionModeActive && matchData.status === 'terminé') {
                handleCorrectionMode(matchId, matchData);
            } else if (matchData.status === 'à_venir') {
                handleNewMatch(matchId, matchData);
            }
        });
    });
}

// Vérifier si tous les matchs d'un groupe sont terminés
function areMatchesCompleted(matchIds) {
    return matchIds.every(id => {
        const match = tournamentState.matches[id];
        return match && match.status === 'terminé';
    });
}

// Vérifier si un match peut être joué (contraintes logiques)
function canPlayMatch(matchId, matchData) {
    // Qualifications - toujours jouables (mais déjà terminées)
    if (matchData.matchType === 'qualification') {
        return true;
    }

    // Quarts de finale - plus besoin de vérifier les qualifications car déjà terminées
    if (matchData.matchType === 'quarterfinal') {
        // Vérifier uniquement que les équipes sont définies
        if (!matchData.team1 || !matchData.team2) {
            alert('Les équipes ne sont pas encore déterminées pour ce match.');
            return false;
        }
        return true;
    }

    // Demi-finales - vérifier que les quarts sont terminés
    if (matchData.matchType === 'semifinal') {
        const quarterFinals = [4, 5, 6, 7];
        if (!areMatchesCompleted(quarterFinals)) {
            alert('Les quarts de finale doivent être terminées avant de jouer les demi-finales.');
            return false;
        }
        
        if (!matchData.team1 || !matchData.team2) {
            alert('Les équipes ne sont pas encore déterminées pour ce match.');
            return false;
        }
    }

    // Finales - vérifier que les demi-finales sont terminées
    if (matchData.matchType === 'smallfinal' || matchData.matchType === 'final') {
        const semiFinals = [8, 9];
        if (!areMatchesCompleted(semiFinals)) {
            alert('Les demi-finales doivent être terminées avant de jouer les finales.');
            return false;
        }
        
        if (!matchData.team1 || !matchData.team2) {
            alert('Les équipes ne sont pas encore déterminées pour ce match.');
            return false;
        }
    }

    return true;
}

// Gérer le mode correction
function handleCorrectionMode(matchId, matchData) {
    if (confirm('Voulez-vous corriger ce match ?')) {
        const params = new URLSearchParams({
            matchId: matchId,
            team1: matchData.team1 || '',
            team2: matchData.team2 || '',
            matchType: matchData.matchType || '',
            score1: matchData.score1 || '0',
            score2: matchData.score2 || '0',
            correction: 'true'
        });
        window.location.href = `marquage.html?${params.toString()}`;
    }
}

// Gérer un nouveau match
function handleNewMatch(matchId, matchData) {
    // Vérifier que les équipes sont définies
    if (!matchData.team1 || !matchData.team2) {
        alert('Les équipes ne sont pas encore déterminées pour ce match.');
        return;
    }

    // Mettre à jour le statut en "en_cours" avant la redirection
    matchData.status = 'en_cours';
    saveTournamentState();

    // Rediriger vers la page de marquage
    const params = new URLSearchParams({
        matchId: matchId,
        team1: matchData.team1,
        team2: matchData.team2,
        matchType: matchData.matchType,
        status: 'en_cours'  // Ajout du statut dans les paramètres
    });

    console.log('Redirection vers marquage.html avec params:', Object.fromEntries(params));
    window.location.href = `marquage.html?${params.toString()}`;
}

// Initialiser l'état de la page
function initializePageState() {
    const hash = window.location.hash;
    if (hash === '#final-phase') {
        const phaseSelect = document.getElementById('phaseSelect');
        if (phaseSelect) {
            phaseSelect.value = 'final-phase';
            phaseSelect.dispatchEvent(new Event('change'));
        }
    }
}

// Fonction pour terminer un match et mettre à jour le tournoi
function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const matchId = parseInt(urlParams.get('matchId'));
    const team1 = document.getElementById('teamA').value;
    const team2 = document.getElementById('teamB').value;
    const score1 = parseInt(document.getElementById('teamAScore').textContent);
    const score2 = parseInt(document.getElementById('teamBScore').textContent);
    
    const winner = score1 > score2 ? team1 : team2;
    const loser = score1 > score2 ? team2 : team1;

    try {
        // Mettre à jour le match actuel
        tournamentState.matches[matchId] = {
            ...tournamentState.matches[matchId],
            team1,
            team2,
            score1,
            score2,
            status: 'terminé',
            winner,
            loser
        };

        // Gérer la progression vers les demi-finales
        if (matchId >= 4 && matchId <= 7) { // Quarts de finale
            const semifinalId = matchId <= 5 ? 8 : 9; // QF1&2 -> SF1, QF3&4 -> SF2
            const semifinal = tournamentState.matches[semifinalId];
            
            // Si c'est le premier gagnant pour cette demi-finale
            if (!semifinal.team1) {
                semifinal.team1 = winner;
            } 
            // Si c'est le deuxième gagnant pour cette demi-finale
            else if (!semifinal.team2 && semifinal.team1 !== winner) {
                semifinal.team2 = winner;
            }
        }

        // Gérer la progression vers la finale et petite finale
        if (matchId === 8 || matchId === 9) { // Demi-finales
            const final = tournamentState.matches[11];
            const smallFinal = tournamentState.matches[10];

            if (matchId === 8) {
                final.team1 = winner;
                smallFinal.team1 = loser;
            } else {
                final.team2 = winner;
                smallFinal.team2 = loser;
            }
        }

        saveTournamentState();
        window.location.href = 'volleyball.html#final-phase';
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// ----- EXPOSITION DES FONCTIONS GLOBALES -----
window.simulateMatch = simulateMatch;
window.simulateTournament = simulateTournament;
window.resetTournament = resetTournament;
window.toggleCorrectionMode = toggleCorrectionMode;
window.resetGame = resetGame;
window.initWebSocket = initWebSocket;