/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Définir les équipes
const teams = {
  "ESPAS-ESTICE": { id: 7, name: "ESPAS-ESTICE" },
  "ESPOL": { id: 8, name: "ESPOL" },
  "ICAM": { id: 4, name: "ICAM" },
  "FMMS": { id: 2, name: "FMMS" },
  "USCHOOL": { id: 9, name: "USCHOOL" },
  "FLSH": { id: 10, name: "FLSH" },
  "FLD": { id: 3, name: "FLD" },
  "FGES": { id: 1, name: "FGES" },
  "JUNIA": { id: 6, name: "JUNIA" },
  "IESEG": { id: 11, name: "IESEG" },
  "IKPO": { id: 5, name: "IKPO" },
  "ESSLIL": { id: 12, name: "ESSLIL" },
  "ISTC": { id: 13, name: "ISTC" },
  "PIKTURA": { id: 14, name: "PIKTURA" },
  "LiDD": { id: 15, name: "LiDD" }
};

// Définir les terrains
const terrains = {
  'qualification': 1,      // Terrain de football
  'quarterfinal': 1,      // Terrain de football
  'semifinal': 1,         // Terrain de football
  'final': 1,             // Terrain de football
  'smallfinal': 1,        // Terrain de football
  'classification_semifinal': 1,  // Terrain de football
  'classification_final': 1      // Terrain de football
};

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
  // Qualifications (matchIds 1 à 4) : les perdants reçoivent 5 points (9ème)
  1: {
    matchType: 'qualification',
    team1: 'JUNIA',
    team2: 'ICAM',
    score1: 1,
    score2: 5,
    status: 'terminé',
    winner: 'ICAM',
    loser: 'JUNIA',
    nextMatchWin: 5
  },
  2: {
    matchType: 'qualification',
    team1: 'FMMS',
    team2: 'USCHOOL',
    score1: 5,
    score2: 0,
    status: 'terminé',
    winner: 'FMMS',
    loser: 'USCHOOL',
    nextMatchWin: 5
  },
  3: {
    matchType: 'qualification',
    team1: 'ESPAS-ESTICE',
    team2: 'FLSH',
    score1: 1,
    score2: 0,
    status: 'terminé',
    winner: 'ESPAS-ESTICE',
    loser: 'FLSH',
    nextMatchWin: 7
  },
  4: {
    matchType: 'qualification',
    team1: 'ESPOL',
    team2: 'ESSLIL',
    score1: 14,
    score2: 0,
    status: 'terminé',
    winner: 'ESPOL',
    loser: 'ESSLIL',
    nextMatchWin: 8
  },
  // Quarts de finale (matchIds 5 à 8)
  5: {
    matchType: 'quarterfinal',
    team1: 'ICAM',   // issu de match 1
    team2: 'FMMS',   // issu de match 2
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '9:30',
    nextMatchWin: 12,
    nextMatchLose: 9
  },
  6: {
    matchType: 'quarterfinal',
    team1: 'IKPO',
    team2: 'FGES',
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '10:15',
    nextMatchWin: 12,
    nextMatchLose: 9
  },
  7: {
    matchType: 'quarterfinal',
    team1: 'ESPAS-ESTICE',
    team2: 'IESEG',
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '11:00',
    nextMatchWin: 13,
    nextMatchLose: 10
  },
  8: {
    matchType: 'quarterfinal',
    team1: 'ESPOL',
    team2: 'FLD',
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '11:45',
    nextMatchWin: 13,
    nextMatchLose: 10
  },
  // Repêchages (matches de classement, matchIds 9 et 10)
  9: {
    matchType: 'classification_semifinal',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '13:00',
    nextMatchWin: 11
  },
  10: {
    matchType: 'classification_semifinal',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '13:45',
    nextMatchWin: 11
  },
  // Match pour la 5ème place (classification finale, matchId 11)
  11: {
    matchType: 'classification_final',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '16:00'
  },
  // Demi-finales (matchIds 12 et 13)
  12: {
    matchType: 'semifinal',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '14:30',
    nextMatchWin: 15,
    nextMatchLose: 14
  },
  13: {
    matchType: 'semifinal',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '15:15',
    nextMatchWin: 15,
    nextMatchLose: 14
  },
  // Petite finale (matchId 14) pour la 3ème / 4ème place
  14: {
    matchType: 'smallfinal',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '16:45'
  },
  // Finale (matchId 15) pour la 1ère / 2ème place
  15: {
    matchType: 'final',
    team1: null,
    team2: null,
    score1: null,
    score2: null,
    status: 'à_venir',
    winner: null,
    loser: null,
    time: '17:30'
  }
}
};

// Ajouter les constantes pour les statuts de match
const MATCH_STATUS = {
  NOT_STARTED: 'à_venir',
  IN_PROGRESS: 'en_cours',
  FINISHED: 'terminé'
};

// Ajouter après les constantes
const MATCH_TYPE_TRANSLATIONS = {
  'qualification': 'Qualification',
  'quarterfinal': 'Quart de finale',
  'semifinal': 'Demi-finale',
  'final': 'Finale',
  'smallfinal': 'Petite finale',
  'classification_semifinal': 'Demi-finale de classement',
  'classification_final': 'Match de classement'
};

function getMatchTypeTranslation(matchType) {
  return MATCH_TYPE_TRANSLATIONS[matchType] || matchType;
}

// Remplacer la fonction saveTournamentState
function saveTournamentState() {
    if (!socket || !isSocketConnected) {
        console.warn('Socket non connecté, impossible de sauvegarder');
        return;
    }

    try {
        socket.emit('save_tournament_state', {
            sport: 'football',
            state: tournamentState,
            timestamp: new Date().toISOString()
        });
        console.log('État du tournoi envoyé au serveur');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

// Remplacer la fonction loadTournamentState
async function loadTournamentState() {
    if (!socket || !isSocketConnected) {
        console.warn('Socket non connecté, impossible de charger');
        return false;
    }

    return new Promise((resolve) => {
        socket.emit('request_tournament_state', { sport: 'football' });
        
        socket.once('tournament_state', (data) => {
            if (data && data.state) {
                tournamentState = data.state;
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
  try {
    localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
    localStorage.setItem('lastUpdate', new Date().toISOString());
    console.log('État du tournoi sauvegardé avec succès');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'état:', error);
  }
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
  const savedState = localStorage.getItem('footballTournamentState');
  if (savedState) {
      tournamentState = JSON.parse(savedState);
      return true;
  }
  return false;
}

// Initialisation de la connexion WebSocket
let socket = null;
let isSocketConnected = false; // Indicateur pour suivre l'état de la connexion WebSocket
const messageQueue = []; // Ajouter cette ligne pour définir la file d'attente des messages

// Ajouter ces variables en haut du fichier
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;

function initializeWebSocket() {
    try {
        if (socket && socket.connected) {
            console.log('Socket.IO déjà connecté');
            return socket;
        }

        console.log('Tentative de connexion Socket.IO...');
        socket = io({
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
            reconnectionDelay: RECONNECTION_DELAY,
            timeout: 5000
        });

        socket.on('connect', () => {
            console.log('Socket.IO connecté:', socket.id);
            isSocketConnected = true;
            reconnectionAttempts = 0;
            
            // S'abonner au canal football
            socket.emit('join_sport', 'football');
            
            // Demander explicitement les données
            socket.emit('request_matches_state', { sport: 'football' });
            
            // Vider la file d'attente des messages
            while (messageQueue.length > 0) {
                const { type, data } = messageQueue.shift();
                socket.emit(type, data);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO déconnecté');
            isSocketConnected = false;
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Tentative de reconnexion #${attemptNumber}...`);
            reconnectionAttempts = attemptNumber;
        });

        socket.on('reconnect_failed', () => {
            console.error('Échec de la reconnexion après', MAX_RECONNECTION_ATTEMPTS, 'tentatives');
            isSocketConnected = false;
        });

        // Écouter les mises à jour des matchs
        socket.on('match_updated', (data) => {
            console.log('Mise à jour du match reçue:', data);
            if (data.matchId && tournamentState.matches[data.matchId]) {
                // Mettre à jour l'état du match
                tournamentState.matches[data.matchId] = {
                    ...tournamentState.matches[data.matchId],
                    ...data
                };
                saveTournamentState();
                updateUI();
            }
        });
        
        // Écouter la mise à jour forcée (synchronisation)
        socket.on('force_sync', (data) => {
            console.log('Synchronisation forcée reçue:', data);
            if (data.matches) {
                // Mettre à jour tous les matchs de football
                Object.entries(data.matches).forEach(([matchId, matchData]) => {
                    if (tournamentState.matches[matchId]) {
                        tournamentState.matches[matchId] = {
                            ...tournamentState.matches[matchId],
                            ...matchData,
                            score1: matchData.score1 || tournamentState.matches[matchId].score1,
                            score2: matchData.score2 || tournamentState.matches[matchId].score2,
                            status: matchData.status || tournamentState.matches[matchId].status
                        };
                    }
                });
                saveTournamentState();
                updateUI();
            }
        });
        
        // Écouter l'événement spécifique pour les mises à jour de match
        socket.on('match_status_updated', (data) => {
            console.log('Mise à jour de statut reçue:', data);
            if (data && data.matchId && tournamentState.matches[data.matchId]) {
                // Mettre à jour l'état du match
                tournamentState.matches[data.matchId] = {
                    ...tournamentState.matches[data.matchId],
                    score1: data.score1 !== undefined ? data.score1 : tournamentState.matches[data.matchId].score1,
                    score2: data.score2 !== undefined ? data.score2 : tournamentState.matches[data.matchId].score2,
                    status: data.status || tournamentState.matches[data.matchId].status,
                    team1: data.team1 || tournamentState.matches[data.matchId].team1,
                    team2: data.team2 || tournamentState.matches[data.matchId].team2
                };
                
                // Si le match est terminé, déterminer le vainqueur et le perdant
                if (data.status === 'terminé') {
                    const score1 = tournamentState.matches[data.matchId].score1 || 0;
                    const score2 = tournamentState.matches[data.matchId].score2 || 0;
                    const team1 = tournamentState.matches[data.matchId].team1;
                    const team2 = tournamentState.matches[data.matchId].team2;
                    
                    if (score1 > score2) {
                        tournamentState.matches[data.matchId].winner = team1;
                        tournamentState.matches[data.matchId].loser = team2;
                    } else if (score2 > score1) {
                        tournamentState.matches[data.matchId].winner = team2;
                        tournamentState.matches[data.matchId].loser = team1;
                    }
                }
                
                console.log('État du match mis à jour:', tournamentState.matches[data.matchId]);
                saveTournamentState();
                updateUI();
            }
        });
        
        return socket;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de Socket.IO:', error);
        isSocketConnected = false;
        return null;
    }
}

// Remplacer la fonction sendWebSocketMessage
function sendMessage(type, data) {
    if (socket && isSocketConnected) {
        try {
            socket.emit(type, data);
            console.log('Message envoyé via Socket.IO:', type);
        } catch (error) {
            console.error(`Erreur lors de l'envoi du message (${type}):`, error);
            messageQueue.push({ type, data });
        }
    } else {
        console.warn(`Socket.IO non connecté, message (${type}) mis en file d'attente`);
        messageQueue.push({ type, data });
    }
}

// Adapter loadMatchScores pour utiliser Socket.IO
async function loadMatchScores() {
    try {
        if (!socket || !isSocketConnected) {
            if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
                console.error('Nombre maximum de tentatives de reconnexion atteint');
                return;
            }
            
            console.log('Socket.IO non connecté, tentative de connexion...');
            await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY));
            initializeWebSocket();
            return;
        }
        
        socket.emit('request_matches_state', { sport: 'football' });
    } catch (error) {
        console.error('Erreur lors de la demande des scores:', error);
    }
}

// ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
const positionPoints = {
1: 50,
2: 40,
3: 35,
4: 30,
5: 25,
6: 20,
7: 10,
9: 5
};

// ----- INITIALISATION -----
document.addEventListener('DOMContentLoaded', async function() {
    // Charger le script Socket.IO s'il n'est pas déjà présent
    if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = () => {
            console.log('Socket.IO chargé, initialisation...');
            initializeWebSocket();
            continueInitialization(false); // Ajouter un paramètre pour contrôler l'envoi
        };
        script.onerror = (error) => {
            console.error('Erreur de chargement de Socket.IO:', error);
            continueInitialization(false);
        };
        document.head.appendChild(script);
    } else {
        initializeWebSocket();
        continueInitialization(false);
    }
    
    function continueInitialization(shouldEmitUpdates = false) {
        // Forcer une synchronisation complète au démarrage
        if (socket && isSocketConnected) {
            socket.emit('request_tournament_state', { sport: 'football' });
        }
        
        socket.on('tournament_state', (data) => {
            if (data && data.state) {
                tournamentState = data.state;
                console.log('État du tournoi synchronisé depuis le serveur');
            } else {
                // Si pas d'état serveur, initialiser avec l'état par défaut
                initializeDefaultState();
            }
            updateUI();
        });
        
        if (loadTournamentState()) {
            console.log('État précédent du tournoi chargé');
            loadStoredScores();
        } else {
            console.log('Nouveau tournoi initialisé');
        }
        
        loadMatchScores();
        linkWinnersAndLosers();
        updateUI();
        addMatchClickHandlers();
        
        // Envoyer une seule fois les mises à jour initiales si nécessaire
        if (shouldEmitUpdates && socket && isSocketConnected) {
            Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
                if (matchData.status === 'terminé') {
                    socket.emit('match_status_updated', {
                        matchId,
                        ...matchData
                    });
                }
            });
        }
    }
});

// Demander une synchronisation complète au chargement
document.addEventListener('DOMContentLoaded', () => {
    if (socket && isSocketConnected) {
        socket.emit('request_full_sync');
    }
});

// Ajouter cette nouvelle fonction
function initializeDefaultState() {
    // S'assurer que les équipes qualifiées sont préservées dans les quarts
    if (tournamentState.matches) {
        // Quart de finale 1 : ICAM vs FMMS (vainqueurs des matches 1 et 2)
        if (tournamentState.matches[1].winner && tournamentState.matches[2].winner) {
            tournamentState.matches[5].team1 = tournamentState.matches[1].winner;
            tournamentState.matches[5].team2 = tournamentState.matches[2].winner;
        }
        
        // Quart de finale 2 : IKPO vs FGES (équipes pré-qualifiées)
        tournamentState.matches[6].team1 = 'IKPO';
        tournamentState.matches[6].team2 = 'FGES';
        
        // Quart de finale 3 : ESPAS-ESTICE vs IESEG
        if (tournamentState.matches[3].winner) {
            tournamentState.matches[7].team1 = tournamentState.matches[3].winner;
        }
        tournamentState.matches[7].team2 = 'IESEG';
        
        // Quart de finale 4 : ESPOL vs FLD
        if (tournamentState.matches[4].winner) {
            tournamentState.matches[8].team1 = tournamentState.matches[4].winner;
        }
        tournamentState.matches[8].team2 = 'FLD';
    }
}

// ----- LIEN ENTRE LES MATCHES (Vainqueur/Perdant vers le match suivant) -----
function linkWinnersAndLosers() {
for (const [mId, match] of Object.entries(tournamentState.matches)) {
  if (match.winner && match.nextMatchWin) {
    const nextMatch = tournamentState.matches[match.nextMatchWin];
    if (nextMatch) {
      if (!nextMatch.team1) nextMatch.team1 = match.winner;
      else if (!nextMatch.team2) nextMatch.team2 = match.winner;
    }
  }
  if (match.loser && match.nextMatchLose) {
    const nextMatch = tournamentState.matches[match.nextMatchLose];
    if (nextMatch) {
      if (!nextMatch.team1) nextMatch.team1 = match.loser;
      else if (!nextMatch.team2) nextMatch.team2 = match.loser;
    }
  }
}
}

// ----- MISE À JOUR DE L'INTERFACE (affichage des scores, logos et couleurs) -----
function updateUI() {
  Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
    const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
    if (!matchElement) return;

    console.log(`Mise à jour UI match ${matchId}:`, {
        status: matchData.status,
        score1: matchData.score1,
        score2: matchData.score2
    });

    // Mettre à jour les classes CSS selon le statut
    matchElement.classList.remove('a-venir', 'en-cours', 'termine', 'à-venir', 'à_venir', 'en_cours', 'terminé');
    const statusClass = matchData.status.replace('_', '-');
    matchElement.classList.add(statusClass);
    
    // Mettre à jour l'affichage du statut
    const statusDiv = matchElement.querySelector('.match-status');
    if (statusDiv) {
        const statusText = {
            'à_venir': 'À venir',
            'en_cours': 'En cours',
            'terminé': 'Terminé'
        }[matchData.status] || matchData.status;
        
        statusDiv.textContent = statusText;
    }
    
    // Supprimer les sauvegardes localStorage
    /*
    if (matchData.score1 !== null && matchData.score2 !== null) {
        sendMessage('update_match', {
            matchId: matchId,
            score1: matchData.score1,
            score2: matchData.score2,
            status: matchData.status,
            winner: matchData.winner,
            loser: matchData.loser
        });
    }
    */
    
    // Mettre à jour le statut dans l'attribut data
    matchElement.setAttribute('data-status', matchData.status);
    
    const teamDivs = matchElement.querySelectorAll('.team');
    if (teamDivs.length < 2) return;
    
    // Forcer la mise à jour complète
    fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
    fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
    
    // Mettre à jour l'affichage du temps et du statut
    const infoContainer = matchElement.querySelector('.match-info-container');
    if (infoContainer) {
      const timeDiv = infoContainer.querySelector('.match-time');
      const statusDiv = infoContainer.querySelector('.match-status');
      
      if (timeDiv) timeDiv.textContent = matchData.time || '';
      if (statusDiv) {
          const displayStatus = {
              'à_venir': 'À venir',
              'en_cours': 'En cours',
              'terminé': 'Terminé'
          }[matchData.status] || matchData.status;
          statusDiv.textContent = displayStatus;
      }
    }

    // Gestion de l'affichage selon l'état jouable
    if (!isMatchPlayable(matchId) && matchData.status !== 'terminé') {
      matchElement.classList.add('disabled');
      matchElement.style.opacity = '0.5';
      matchElement.style.cursor = 'not-allowed';
    } else {
      matchElement.classList.remove('disabled');
      matchElement.style.opacity = '1';
      matchElement.style.cursor = 'pointer';
    }
  });
  
  // Mise à jour automatique du classement après chaque changement
  updateRankingDisplay();
  
  // Mise à jour du champion
  updateChampion();
}

// Ajouter une fonction pour charger les scores depuis le localStorage
function loadStoredScores() {
  Object.keys(tournamentState.matches).forEach(matchId => {
    const storedScore = localStorage.getItem(`match_${matchId}_score`);
    if (storedScore) {
      const scoreData = JSON.parse(storedScore);
      tournamentState.matches[matchId].score1 = scoreData.score1;
      tournamentState.matches[matchId].score2 = scoreData.score2;
      tournamentState.matches[matchId].status = scoreData.status;
      tournamentState.matches[matchId].winner = scoreData.winner;
      tournamentState.matches[matchId].loser = scoreData.loser;
    }
  });
}

// Mise à jour automatique du classement après chaque changement
updateRankingDisplay();

// Mise à jour du champion
const finalMatch = tournamentState.matches[15];
const championDiv = document.getElementById('champion');
if (championDiv) {
  if (finalMatch && finalMatch.winner) {
    championDiv.textContent = finalMatch.winner;
    championDiv.style.display = 'block';
    // Ajouter une animation pour le champion
    championDiv.classList.add('champion-crowned');
  } else {
    championDiv.textContent = 'A déterminé';
    championDiv.style.display = 'block';
    championDiv.classList.remove('champion-crowned');
  }
}

// Sauvegarde automatique de l'état
localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));


function fillTeamDiv(teamDiv, teamName, score, winnerName) {
const nameDiv = teamDiv.querySelector('.team-name');
const scoreDiv = teamDiv.querySelector('.score');
if (!nameDiv || !scoreDiv) return;
if (!teamName) {
  nameDiv.innerHTML = `<div class='team-logo'></div>-`;
  scoreDiv.textContent = '-';  // Changé de '0' à '-' pour les scores non définis
  teamDiv.classList.remove('winner','loser');
  return;
}
const teamObj = teams[teamName];
const logoUrl = teamObj ? `/img/${teamName}.png` : `/img/default.png`;
nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;
if (score === null || score === undefined) {
  scoreDiv.textContent = '-';
  teamDiv.classList.remove('winner','loser');
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
    teamDiv.classList.remove('winner','loser');
  }
}

// Si on a un élément match-type, mettre à jour sa traduction
const matchTypeElement = teamDiv.closest('.match').querySelector('.match-type');
if (matchTypeElement) {
  const matchType = teamDiv.closest('.match').dataset.matchType;
  matchTypeElement.textContent = getMatchTypeTranslation(matchType);
}

}

// ----- SIMULATION D'UN MATCH -----
async function simulateMatch(matchId) {
  const match = tournamentState.matches[matchId];
  if (!match || match.status === MATCH_STATUS.FINISHED) return;

  console.log(`Début du match ${matchId} - Status initial:`, match.status);

  // Ajouter l'identifiant du match dans l'objet match pour la propagation
  match.matchId = matchId;

  // Mettre le match en cours
  match.status = MATCH_STATUS.IN_PROGRESS;
  await updateUI();

  // Simuler une petite attente
  await new Promise(resolve => setTimeout(resolve, 1000));

  match.score1 = Math.floor(Math.random() * 6);
  match.score2 = Math.floor(Math.random() * 6);

  // Gérer l'égalité
  if (match.score1 === match.score2) {
      match.score1++;
  }

  // Déterminer le vainqueur
  if (match.score1 > match.score2) {
      match.winner = match.team1;
      match.loser = match.team2;
  } else {
      match.winner = match.team2;
      match.loser = match.team1;
  }

  match.status = MATCH_STATUS.FINISHED;
  
  console.log(`Match ${matchId} terminé:`, match);

  // Propager les équipes aux matchs suivants
  await propagateTeamsToNextMatches(match);
  
  await updateUI();
  saveTournamentState();

  if (socket && isSocketConnected) {
      socket.emit('match_completed', {
          ...match,
          matchId,
          needsUpdate: true
      });
  }
}

// Nouvelle fonction dédiée à la propagation des équipes
async function propagateTeamsToNextMatches(match) {
  console.log(`Propagation des équipes pour le match ${match.matchId}`);

  // Propager le vainqueur
  if (match.nextMatchWin && match.winner) {
      console.log(`Propagation du vainqueur ${match.winner} vers match ${match.nextMatchWin}`);
      const nextMatch = tournamentState.matches[match.nextMatchWin];
      if (nextMatch) {
          // Pour les quarts de finale vers demi-finale
          if (match.matchId == 5 || match.matchId == 6) {
              // Première demi-finale (match 12)
              if (match.matchId == 5) {
                  nextMatch.team1 = match.winner;
              } else {
                  nextMatch.team2 = match.winner;
              }
          } 
          // Pour les quarts de finale vers demi-finale
          else if (match.matchId == 7 || match.matchId == 8) {
              // Deuxième demi-finale (match 13)
              if (match.matchId == 7) {
                  nextMatch.team1 = match.winner;
              } else {
                  nextMatch.team2 = match.winner;
              }
          }
          // Pour les demi-finales vers finale
          else if (match.matchId == 12) {
              nextMatch.team1 = match.winner;
          } 
          else if (match.matchId == 13) {
              nextMatch.team2 = match.winner;
          }
          // Pour les autres cas
          else {
              if (!nextMatch.team1) nextMatch.team1 = match.winner;
              else if (!nextMatch.team2) nextMatch.team2 = match.winner;
          }
          
          nextMatch.status = 'à_venir';
      }
  }

  // Propager le perdant
  if (match.nextMatchLose && match.loser) {
      console.log(`Propagation du perdant ${match.loser} vers match ${match.nextMatchLose}`);
      const nextMatch = tournamentState.matches[match.nextMatchLose];
      if (nextMatch) {
          // Pour les quarts de finale vers matchs de classement
          if (match.matchId == 5 || match.matchId == 6) {
              // Premier match de classement (match 9)
              if (match.matchId == 5) {
                  nextMatch.team1 = match.loser;
              } else {
                  nextMatch.team2 = match.loser;
              }
          } 
          // Pour les quarts de finale vers matchs de classement
          else if (match.matchId == 7 || match.matchId == 8) {
              // Deuxième match de classement (match 10)
              if (match.matchId == 7) {
                  nextMatch.team1 = match.loser;
              } else {
                  nextMatch.team2 = match.loser;
              }
          }
          // Pour les demi-finales vers petite finale
          else if (match.matchId == 12) {
              nextMatch.team1 = match.loser;
          } 
          else if (match.matchId == 13) {
              nextMatch.team2 = match.loser;
          }
          // Pour les autres cas
          else {
              if (!nextMatch.team1) nextMatch.team1 = match.loser;
              else if (!nextMatch.team2) nextMatch.team2 = match.loser;
          }
          
          nextMatch.status = 'à_venir';
      }
  }

  // Assurons-nous que l'état est sauvegardé et synchronisé
  saveTournamentState();
  
  if (socket && isSocketConnected) {
      socket.emit('propagate_teams', {
          matchId: match.matchId,
          nextWinMatchId: match.nextMatchWin,
          nextLoseMatchId: match.nextMatchLose,
          winner: match.winner,
          loser: match.loser,
          timestamp: Date.now()
      });
      
      // Force une synchronisation complète
      socket.emit('force_sync', {
          matches: tournamentState.matches,
          timestamp: Date.now()
      });
  }
}

// ----- SIMULATION DE LA COMPÉTITION -----
async function simulateTournament() {
const ids = Object.keys(tournamentState.matches).map(x => parseInt(x)).sort((a, b) => a - b);

for (const id of ids) {
  const match = tournamentState.matches[id];
  if (match.status === 'à_venir' || match.status === 'en_cours') {
    await simulateMatch(id);
  }
}

await linkWinnersAndLosers();
saveTournamentState();
updateRankingDisplay(); // Cela enverra les points finaux au serveur
alert('Simulation terminée !');
}

// ----- CALCUL DU CLASSEMENT FINAL -----
function calculateRankings() {
// Initialiser le classement avec des points à 0
let ranking = allTeams.map(name => ({ 
  name,
  points: 0,
  position: null,
  finalPhase: null // Pour suivre la phase finale de chaque équipe
}));

// Première passe : déterminer la phase finale de chaque équipe
for (const match of Object.values(tournamentState.matches)) {
  if (match.status !== 'terminé') continue;

  if (match.winner && match.loser) {
    // Attribution des positions finales selon le type de match
    switch(match.matchType) {
      case 'qualification':
        // Les perdants des qualifications sont 9èmes
        const loserTeam = ranking.find(r => r.name === match.loser);
        if (loserTeam) loserTeam.finalPhase = '9th';
        break;

      case 'classification_semifinal':
        // Les perdants des repêchages sont 7èmes
        const loserClassif = ranking.find(r => r.name === match.loser);
        if (loserClassif) loserClassif.finalPhase = '7th';
        break;

      case 'classification_final':
        // 5ème et 6ème places
        const winnerClassif = ranking.find(r => r.name === match.winner);
        const loserClassif6 = ranking.find(r => r.name === match.loser);
        if (winnerClassif) winnerClassif.finalPhase = '5th';
        if (loserClassif6) loserClassif6.finalPhase = '6th';
        break;

      case 'smallfinal':
        // 3ème et 4ème places
        const winner3rd = ranking.find(r => r.name === match.winner);
        const loser4th = ranking.find(r => r.name === match.loser);
        if (winner3rd) winner3rd.finalPhase = '3rd';
        if (loser4th) loser4th.finalPhase = '4th';
        break;

      case 'final':
        // 1ère et 2ème places
        const winner1st = ranking.find(r => r.name === match.winner);
        const loser2nd = ranking.find(r => r.name === match.loser);
        if (winner1st) winner1st.finalPhase = '1st';
        if (loser2nd) loser2nd.finalPhase = '2nd';
        break;
    }
  }
}

// Deuxième passe : attribuer les points selon la position finale
ranking.forEach(team => {
  switch(team.finalPhase) {
    case '1st': team.points = 50; break;
    case '2nd': team.points = 40; break;
    case '3rd': team.points = 35; break;
    case '4th': team.points = 30; break;
    case '5th': team.points = 25; break;
    case '6th': team.points = 20; break;
    case '7th': team.points = 10; break;
    case '9th': team.points = 5; break;
    default: team.points = 0;
  }
});

// Trier par points (décroissant)
ranking.sort((a, b) => b.points - a.points);

return ranking;
}

// ----- MISE À JOUR DU TABLEAU DE CLASSEMENT -----
async function updateRankingDisplay() {
  const ranking = calculateRankings();
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  
  rankingList.innerHTML = '';
  
  // Création d'un objet pour l'envoi des points
  const teamPoints = {};
  
  ranking.forEach((team, idx) => {
      const position = idx + 1;
      const highlightClass = position <= 3 ? `highlight-${position}` : '';
      
      // Déterminer si c'est un match de classement
      const isClassement = ['5th', '6th', '7th', '9th'].includes(team.finalPhase);
      
      teamPoints[team.name] = {
          points: team.points,
          isClassement: isClassement
      };
      
      // Affichage HTML...
      rankingList.innerHTML += `
          <div class="ranking-row ${highlightClass}">
              <div class="rank">${position}</div>
              <div class="teamname">
                  <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                  ${team.name}
              </div>
              <div class="points">${team.points}</div>
          </div>
      `;
  });

  try {
      if (!socket || !isSocketConnected) {
          if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
              console.log('Socket.IO non prêt, tentative de reconnexion...');
              await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY));
              initializeWebSocket();
          } else {
              console.error('Impossible de se connecter au serveur');
          }
          return;
      }
      
      sendMessage('updatePoints', { sport: 'football', points: teamPoints });
  } catch (error) {
      console.error('Erreur lors de l\'envoi des points:', error);
  }

  saveTournamentState();
}

// Ajout de la fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
try {
  // Définir l'ID du tournoi une seule fois pour toute la requête
  const tournoisId = 1;

  // Créer un tableau de matchs avec id_tournois obligatoire
  const matches = Object.entries(tournamentState.matches).map(([id, match]) => {
    if (!match) return null;

    // Vérification du terrain
    const terrain = terrains[match.matchType];
    if (!terrain) {
      console.error(`Type de match non défini dans terrains: ${match.matchType}`);
    }

    // Récupération des IDs d'équipe
    const id_equipe1 = match.team1 ? (teams[match.team1]?.id || null) : null;
    const id_equipe2 = match.team2 ? (teams[match.team2]?.id || null) : null;

    // Création de l'objet match avec toutes les propriétés requises
    return {
      id_tournois: tournoisId,  // Obligatoire pour chaque match
      id_match: parseInt(id),
      id_equipe1: id_equipe1,
      id_equipe2: id_equipe2,
      score1: match.score1 ?? null, // Utilisation de ?? pour gérer 0
      score2: match.score2 ?? null,
      status: match.status || 'à_venir',
      winner: match.winner || null,
      loser: match.loser || null,
      match_type: match.matchType,
      id_terrain: terrain || 1
    };
  }).filter(Boolean); // Filtrer les valeurs null/undefined

  // Création de l'objet final
  const matchData = {
    id_tournois: tournoisId,
    id_sport: 1,
    nom_tournois: 'football',
    matches: matches // Utilisation du tableau préparé
  };

  // Log détaillé pour débogage
  console.log('Données à envoyer:', JSON.stringify(matchData, null, 2));

  // Envoi au serveur
  const response = await fetch('http://localhost:3000/api/tournois/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(matchData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erreur serveur: ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log('Réponse du serveur:', result);
  return result;

} catch (error) {
  console.error('Erreur lors de l\'envoi des données:', error);
  // Afficher l'erreur complète pour le débogage
  console.error('Détails:', error.message);
  return null;
}
}

// ----- RÉINITIALISATION DU TOURNOI -----
async function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;

    try {
        // 1. Définir l'état initial avec les qualifications terminées
        const initialState = {
            matches: {
                // Matchs de qualification (ne pas les réinitialiser)
                1: {
                    matchType: 'qualification',
                    team1: 'JUNIA',
                    team2: 'ICAM',
                    score1: 1,
                    score2: 5,
                    status: 'terminé',
                    winner: 'ICAM',
                    loser: 'JUNIA',
                    nextMatchWin: 5
                },
                2: {
                    matchType: 'qualification',
                    team1: 'FMMS',
                    team2: 'USCHOOL',
                    score1: 5,
                    score2: 0,
                    status: 'terminé',
                    winner: 'FMMS',
                    loser: 'USCHOOL',
                    nextMatchWin: 5
                },
                3: {
                    matchType: 'qualification',
                    team1: 'ESPAS-ESTICE',
                    team2: 'FLSH',
                    score1: 1,
                    score2: 0,
                    status: 'terminé',
                    winner: 'ESPAS-ESTICE',
                    loser: 'FLSH',
                    nextMatchWin: 7
                },
                4: {
                    matchType: 'qualification',
                    team1: 'ESPOL',
                    team2: 'ESSLIL',
                    score1: 14,
                    score2: 0,
                    status: 'terminé',
                    winner: 'ESPOL',
                    loser: 'ESSLIL',
                    nextMatchWin: 8
                },
                
                // Quarts de finale avec équipes déjà qualifiées
                5: {
                    matchType: 'quarterfinal',
                    team1: 'ICAM',
                    team2: 'FMMS',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '9:30',
                    nextMatchWin: 12,
                    nextMatchLose: 9
                },
                6: {
                    matchType: 'quarterfinal',
                    team1: 'IKPO',
                    team2: 'FGES',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '10:15',
                    nextMatchWin: 12,
                    nextMatchLose: 9
                },
                7: {
                    matchType: 'quarterfinal',
                    team1: 'ESPAS-ESTICE',
                    team2: 'IESEG',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '11:00',
                    nextMatchWin: 13,
                    nextMatchLose: 10
                },
                8: {
                    matchType: 'quarterfinal',
                    team1: 'ESPOL',
                    team2: 'FLD',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '11:45',
                    nextMatchWin: 13,
                    nextMatchLose: 10
                },
                
                // Réinitialiser les autres matchs
                9: { ...tournamentState.matches[9], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                10: { ...tournamentState.matches[10], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                11: { ...tournamentState.matches[11], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                12: { ...tournamentState.matches[12], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                13: { ...tournamentState.matches[13], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                14: { ...tournamentState.matches[14], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null },
                15: { ...tournamentState.matches[15], score1: null, score2: null, winner: null, loser: null, status: 'à_venir', team1: null, team2: null }
            }
        };

        // 2. Effacer le localStorage
        localStorage.removeItem('footballTournamentState');
        localStorage.removeItem('lastUpdate');

        // 3. Mettre à jour l'état local
        tournamentState = initialState;

        // 4. Informer le serveur
        if (socket && isSocketConnected) {
            socket.emit('save_tournament_state', {
                sport: 'football',
                state: initialState,
                timestamp: new Date().toISOString()
            });

            socket.emit('reset_tournament', {
                sport: 'football',
                timestamp: Date.now(),
                state: initialState
            });

            socket.emit('force_sync', {
                timestamp: Date.now(),
                matches: initialState.matches
            });
        }

        // 5. Mettre à jour l'interface
        await updateUI();
        
        // 6. Recharger la page
        window.location.reload();

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Erreur lors de la réinitialisation : ' + error.message);
    }
}

// Nouvelle fonction pour initialiser un état vide
function initializeEmptyState() {
    tournamentState = {
        matches: {
            // Garder uniquement la structure de base avec les qualifications
            // ...existing tournament structure...
        }
    };
}

// ----- EXPOSITION DES FONCTIONS GLOBALES -----
window.simulateMatch = simulateMatch;
window.simulateTournament = simulateTournament;
window.resetTournament = resetTournament;

// Ajouter les gestionnaires de clic
function addMatchClickHandlers() {
    document.querySelectorAll('.match[data-match-id]').forEach(match => {
        match.addEventListener('click', function() {
            const matchId = this.dataset.matchId;
            const matchData = tournamentState.matches[matchId];

            if (!matchData) {
                console.error('Données du match non trouvées:', matchId);
                return;
            }

            // Vérifier si le match est jouable
            if (!isMatchPlayable(matchId)) {
                if (matchData.status !== 'terminé') {
                    alert('Ce match ne peut pas encore être joué. Terminez d\'abord les matchs précédents.');
                    return;
                }
            }

            // Empêcher de cliquer sur un match terminé sauf en mode correction
            if (matchData.status === 'terminé' && !correctionModeActive) {
                return;
            }

            if (correctionModeActive && matchData.status === 'terminé') {
                // Mode correction
                if (confirm('Voulez-vous corriger ce match ?')) {
                    const params = new URLSearchParams({
                        matchId: matchId,
                        team1: matchData.team1,
                        team2: matchData.team2,
                        matchType: matchData.matchType,
                        score1: matchData.score1,
                        score2: matchData.score2,
                        correction: 'true'
                    });
                    window.location.href = `marquage.html?${params.toString()}`;
                }
            } else if (matchData.status === 'à_venir' && isMatchPlayable(matchId)) {
                // Mettre à jour le statut et sauvegarder immédiatement
                matchData.status = 'en_cours';
                saveTournamentState();

                // Mise à jour visuelle
                const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
                if (matchElement) {
                    matchElement.setAttribute('data-status', 'en_cours');
                    matchElement.classList.remove('a-venir', 'à-venir');
                    matchElement.classList.add('en-cours');
                    
                    const statusDiv = matchElement.querySelector('.match-status');
                    if (statusDiv) statusDiv.textContent = 'En cours';
                }

                // Redirection vers la page de marquage
                const params = new URLSearchParams({
                    matchId: matchId,
                    team1: matchData.team1,
                    team2: matchData.team2,
                    matchType: getMatchTypeTranslation(matchData.matchType), // Utiliser la traduction ici
                    matchTypeTranslated: getMatchTypeTranslation(matchData.matchType)
                });
                
                window.location.href = `marquage.html?${params.toString()}`;
            }
        });
    });
}

// Ajouter cette fonction pour vérifier si un match est jouable
function isMatchPlayable(matchId) {
    const match = tournamentState.matches[matchId];
    
    // Vérifier si le match existe
    if (!match) return false;
    
    // Si le match est déjà terminé, il n'est plus jouable
    if (match.status === 'terminé') return false;
    
    // Les matchs de qualification sont toujours jouables (sauf si terminés)
    if (match.matchType === 'qualification') return match.status !== 'terminé';
    
    // Vérifier les dépendances
    const dependencies = getMatchDependencies(matchId);
    return dependencies.every(depId => {
        const depMatch = tournamentState.matches[depId];
        return depMatch && depMatch.status === 'terminé';
    });
}

// Ajouter une fonction pour obtenir les dépendances d'un match
function getMatchDependencies(matchId) {
    const dependencies = [];
    
    switch(matchId) {
        case '5': dependencies.push('1', '2'); break;
        case '6': dependencies.push('1', '2'); break;
        case '7': dependencies.push('3', '4'); break;
        case '8': dependencies.push('3', '4'); break;
        case '9': dependencies.push('5', '6'); break;
        case '10': dependencies.push('7', '8'); break;
        case '11': dependencies.push('9', '10'); break;
        case '12': dependencies.push('5', '6'); break;
        case '13': dependencies.push('7', '8'); break;
        case '14': dependencies.push('12', '13'); break;
        case '15': dependencies.push('12', '13'); break;
        default: break;
    }
    
    return dependencies;
}

let correctionModeActive = false;

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

// ----- EXPOSITION DE LA FONCTION DE CORRECTION -----
window.toggleCorrectionMode = toggleCorrectionMode;

// Fonction pour mettre à jour le champion
function updateChampion() {
    const finalMatch = tournamentState.matches[15];  // Match final
    const championDiv = document.getElementById('champion');
    
    if (championDiv) {
        if (finalMatch && finalMatch.winner) {
            championDiv.textContent = finalMatch.winner;
            championDiv.style.display = 'block';
            championDiv.classList.add('champion-crowned');
        } else {
            championDiv.textContent = 'À déterminer';
            championDiv.style.display = 'block';
            championDiv.classList.remove('champion-crowned');
        }
    }
}

// ...existing code...

async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    try {
        stopChrono();
        const matchId = matchData.matchId;
        const score1 = matchData.teamA.score;
        const score2 = matchData.teamB.score;
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;

        // Déterminer le vainqueur et le perdant
        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;

        // Préparer les données finales
        const finalData = {
            matchId,
            score1,
            score2,
            team1,
            team2,
            winner,
            loser,
            status: 'terminé',
            needsUpdate: true // Nouveau flag pour forcer la mise à jour
        };

        // Mettre à jour l'état local
        tournamentState.matches[matchId] = {
            ...tournamentState.matches[matchId],
            ...finalData
        };

        // Propager le vainqueur et le perdant aux matchs suivants
        await updateNextMatches(tournamentState.matches[matchId]);
        
        // Envoyer via Socket.IO
        if (socket && isSocketConnected) {
            // Envoyer l'état final
            socket.emit('match_completed', finalData);
            
            // Forcer une mise à jour complète
            socket.emit('force_sync', {
                timestamp: Date.now(),
                matches: tournamentState.matches,
                needsUpdate: true
            });
        }

        // Sauvegarder localement
        saveTournamentState();
        
        // Attendre un peu pour la synchronisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Rediriger vers la page principale
        window.location.href = 'football.html';
    } catch (error) {
        console.error('Erreur lors de la finalisation du match:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Modifier la fonction updateNextMatches
function updateNextMatches(match) {
    return new Promise((resolve) => {
        if (match.nextMatchWin && match.winner) {
            const nextMatch = tournamentState.matches[match.nextMatchWin];
            if (nextMatch) {
                if (!nextMatch.team1) {
                    nextMatch.team1 = match.winner;
                } else if (!nextMatch.team2) {
                    nextMatch.team2 = match.winner;
                }
                nextMatch.status = 'à_venir';
            }
        }

        if (match.nextMatchLose && match.loser) {
            const nextMatch = tournamentState.matches[match.nextMatchLose];
            if (nextMatch) {
                if (!nextMatch.team1) {
                    nextMatch.team1 = match.loser;
                } else if (!nextMatch.team2) {
                    nextMatch.team2 = match.loser;
                }
                nextMatch.status = 'à_venir';
            }
        }

        // Sauvegarder et synchroniser
        if (socket && isSocketConnected) {
            socket.emit('save_tournament_state', {
                sport: 'football',
                state: tournamentState,
                timestamp: new Date().toISOString(),
                needsUpdate: true
            });
        }

        resolve();
    });
}

// Améliorer la fonction de gestion des événements socket
socket.on('tournament_state', (data) => {
    if (data && data.state && data.needsUpdate) {
        tournamentState = data.state;
        console.log('État du tournoi synchronisé depuis le serveur');
        linkWinnersAndLosers();
        updateUI();
        saveTournamentState();
    }
});

// ...existing code...

// Résoudre le problème des fonctions dupliquées
function saveTournamentState() {
    // Sauvegarder localement d'abord
    try {
        localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
        localStorage.setItem('lastUpdate', new Date().toISOString());
        console.log('État du tournoi sauvegardé localement avec succès');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde localStorage:', error);
    }
    
    // Ensuite essayer d'envoyer au serveur via WebSocket
    if (socket && isSocketConnected) {
        try {
            socket.emit('save_tournament_state', {
                sport: 'football',
                state: tournamentState,
                timestamp: new Date().toISOString()
            });
            console.log('État du tournoi envoyé au serveur');
        } catch (error) {
            console.error('Erreur lors de l\'envoi au serveur:', error);
        }
    } else {
        console.warn('Socket non connecté, sauvegarde uniquement locale');
    }
}

// Simplifier la fonction de réinitialisation
async function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;

    try {
        // 1. Version simplifiée de l'état initial
        const initialState = {
            matches: {
                // Qualifications (déjà jouées)
                1: {
                    matchType: 'qualification',
                    team1: 'JUNIA',
                    team2: 'ICAM',
                    score1: 1,
                    score2: 5,
                    status: 'terminé',
                    winner: 'ICAM',
                    loser: 'JUNIA',
                    nextMatchWin: 5
                },
                2: {
                    matchType: 'qualification',
                    team1: 'FMMS',
                    team2: 'USCHOOL',
                    score1: 5,
                    score2: 0,
                    status: 'terminé',
                    winner: 'FMMS',
                    loser: 'USCHOOL',
                    nextMatchWin: 5
                },
                3: {
                    matchType: 'qualification',
                    team1: 'ESPAS-ESTICE',
                    team2: 'FLSH',
                    score1: 1,
                    score2: 0,
                    status: 'terminé',
                    winner: 'ESPAS-ESTICE',
                    loser: 'FLSH',
                    nextMatchWin: 7
                },
                4: {
                    matchType: 'qualification',
                    team1: 'ESPOL',
                    team2: 'ESSLIL',
                    score1: 14,
                    score2: 0,
                    status: 'terminé',
                    winner: 'ESPOL',
                    loser: 'ESSLIL',
                    nextMatchWin: 8
                },
                
                // Quarts de finale (équipes déjà définies)
                5: {
                    matchType: 'quarterfinal',
                    team1: 'ICAM',
                    team2: 'FMMS',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '9:30',
                    nextMatchWin: 12,
                    nextMatchLose: 9
                },
                6: {
                    matchType: 'quarterfinal',
                    team1: 'IKPO',
                    team2: 'FGES',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '10:15',
                    nextMatchWin: 12,
                    nextMatchLose: 9
                },
                7: {
                    matchType: 'quarterfinal',
                    team1: 'ESPAS-ESTICE',
                    team2: 'IESEG',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '11:00',
                    nextMatchWin: 13,
                    nextMatchLose: 10
                },
                8: {
                    matchType: 'quarterfinal',
                    team1: 'ESPOL',
                    team2: 'FLD',
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '11:45',
                    nextMatchWin: 13,
                    nextMatchLose: 10
                },
                
                // Matchs futurs - tous réinitialisés
                9: {
                    matchType: 'classification_semifinal',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '13:00',
                    nextMatchWin: 11
                },
                10: {
                    matchType: 'classification_semifinal',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '13:45',
                    nextMatchWin: 11
                },
                11: {
                    matchType: 'classification_final',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '16:00'
                },
                12: {
                    matchType: 'semifinal',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '14:30',
                    nextMatchWin: 15,
                    nextMatchLose: 14
                },
                13: {
                    matchType: 'semifinal',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '15:15',
                    nextMatchWin: 15,
                    nextMatchLose: 14
                },
                14: {
                    matchType: 'smallfinal',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '16:45'
                },
                15: {
                    matchType: 'final',
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    status: 'à_venir',
                    winner: null,
                    loser: null,
                    time: '17:30'
                }
            }
        };

        // 2. Force une mise à jour directe de l'état local
        tournamentState = initialState;
        
        // 3. Nettoyer localStorage sans attendre
        localStorage.removeItem('footballTournamentState');
        localStorage.removeItem('lastUpdate');
        
        // 4. Afficher la réussite de cette étape
        console.log('État local réinitialisé avec succès');
        alert('Réinitialisation locale effectuée');

        // 5. Mise à jour de l'interface immédiate
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        // 6. Tentative de synchronisation serveur
        if (socket && isSocketConnected) {
            try {
                // Envoyer des commandes simples et séparées
                socket.emit('reset_tournament', {
                    sport: 'football',
                    state: initialState
                });

                socket.emit('force_sync', {
                    matches: initialState.matches
                });

                socket.emit('save_tournament_state', {
                    sport: 'football',
                    state: initialState,
                    timestamp: new Date().toISOString()
                });
                
                console.log('Commandes de réinitialisation envoyées au serveur');
                alert('Synchronisation avec le serveur effectuée');
            } catch (error) {
                console.error('Erreur lors de la synchronisation avec le serveur', error);
                alert('Erreur de synchronisation avec le serveur, mais réinitialisation locale effectuée');
            }
        }

        // 7. Recharger la page après tout le reste
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur critique lors de la réinitialisation:', error);
        alert('Erreur lors de la réinitialisation. Veuillez recharger la page manuellement.');
    }
}

// ...existing code...

async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    try {
        stopChrono();
        const matchId = matchData.matchId;
        const score1 = matchData.teamA.score;
        const score2 = matchData.teamB.score;
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;

        // Déterminer le vainqueur et le perdant
        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;

        // Préparer les données finales
        const finalData = {
            matchId,
            score1,
            score2,
            team1,
            team2,
            winner,
            loser,
            status: 'terminé',
            needsUpdate: true // Nouveau flag pour forcer la mise à jour
        };

        // Mettre à jour l'état local
        tournamentState.matches[matchId] = {
            ...tournamentState.matches[matchId],
            ...finalData
        };

        // Propager le vainqueur et le perdant aux matchs suivants
        await propagateTeamsToNextMatches(tournamentState.matches[matchId]);
        
        // Envoyer via Socket.IO
        if (socket && isSocketConnected) {
            // Envoyer l'état final
            socket.emit('match_completed', finalData);
            
            // Forcer une mise à jour complète
            socket.emit('force_sync', {
                timestamp: Date.now(),
                matches: tournamentState.matches,
                needsUpdate: true
            });
        }

        // Sauvegarder localement
        saveTournamentState();
        
        // Attendre un peu pour la synchronisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Rediriger vers la page principale
        window.location.href = 'football.html';
    } catch (error) {
        console.error('Erreur lors de la finalisation du match:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Remplacer les fonctions de propagation par cette version unifiée et corrigée
function propagateTeamsToNextMatches(match) {
    console.log(`🔄 Propagation des équipes pour le match ${match.matchId}`);
    
    // S'assurer que matchId est traité comme un nombre pour les comparaisons
    const matchId = parseInt(match.matchId);
    
    // 1. Vérifications essentielles
    if (!match || !match.winner || !match.loser) {
        console.error("❌ Impossible de propager: données de match incomplètes", match);
        return;
    }
    
    // 2. Traitement du vainqueur
    if (match.nextMatchWin) {
        const nextMatch = tournamentState.matches[match.nextMatchWin];
        if (nextMatch) {
            console.log(`✅ Propagation du vainqueur ${match.winner} vers match ${match.nextMatchWin}`);
            
            // Règles spécifiques selon le match d'origine
            switch(matchId) {
                // Quarts de finale 1 et 2 -> Demi-finale 1 (match 12)
                case 5:
                    nextMatch.team1 = match.winner;
                    break;
                case 6:
                    nextMatch.team2 = match.winner;
                    break;
                    
                // Quarts de finale 3 et 4 -> Demi-finale 2 (match 13)
                case 7:
                    nextMatch.team1 = match.winner;
                    break;
                case 8:
                    nextMatch.team2 = match.winner;
                    break;
                    
                // Demi-finales -> Finale (match 15)
                case 12:
                    nextMatch.team1 = match.winner;
                    break;
                case 13:
                    nextMatch.team2 = match.winner;
                    break;
                    
                // Cas génériques (matchs de classement)
                default:
                    if (!nextMatch.team1) {
                        nextMatch.team1 = match.winner;
                    } else if (!nextMatch.team2) {
                        nextMatch.team2 = match.winner;
                    }
            }
            
            nextMatch.status = 'à_venir';
        }
    }
    
    // 3. Traitement du perdant
    if (match.nextMatchLose) {
        const nextMatch = tournamentState.matches[match.nextMatchLose];
        if (nextMatch) {
            console.log(`✅ Propagation du perdant ${match.loser} vers match ${match.nextMatchLose}`);
            
            // Règles spécifiques selon le match d'origine
            switch(matchId) {
                // Quarts de finale 1 et 2 -> Match de classement 1 (match 9)
                case 5:
                    nextMatch.team1 = match.loser;
                    break;
                case 6:
                    nextMatch.team2 = match.loser;
                    break;
                    
                // Quarts de finale 3 et 4 -> Match de classement 2 (match 10)
                case 7:
                    nextMatch.team1 = match.loser;
                    break;
                case 8:
                    nextMatch.team2 = match.loser;
                    break;
                    
                // Demi-finales -> Petite finale (match 14)
                case 12:
                    nextMatch.team1 = match.loser;
                    break;
                case 13:
                    nextMatch.team2 = match.loser;
                    break;
                    
                // Cas génériques
                default:
                    if (!nextMatch.team1) {
                        nextMatch.team1 = match.loser;
                    } else if (!nextMatch.team2) {
                        nextMatch.team2 = match.loser;
                    }
            }
            
            nextMatch.status = 'à_venir';
        }
    }
    
    // 4. Sauvegarder l'état du tournoi
    saveTournamentState();
    
    // 5. Synchroniser avec le serveur
    sendServerUpdate(match);
}

// Nouvelle fonction pour envoyer une mise à jour complète au serveur
function sendServerUpdate(match) {
    if (!socket || !isSocketConnected) return;
    
    // 1. Envoyer l'état complet du tournoi
    socket.emit('save_tournament_state', {
        sport: 'football',
        state: tournamentState,
        timestamp: Date.now()
    });
    
    // 2. Forcer une mise à jour de tous les clients
    socket.emit('force_sync', {
        matches: tournamentState.matches,
        timestamp: Date.now(),
        updatedMatch: match.matchId
    });
    
    // 3. Notifier spécifiquement de la propagation
    socket.emit('propagate_teams', {
        matchId: match.matchId,
        nextWinMatchId: match.nextMatchWin,
        nextLoseMatchId: match.nextMatchLose,
        winner: match.winner,
        loser: match.loser,
        timestamp: Date.now()
    });
}

// Remplacer la fonction resetGame pour garantir la propagation correcte
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    try {
        // Arrêter le chronomètre
        stopChrono();
        
        // Récupérer les données du match
        const matchId = matchData.matchId;
        const score1 = matchData.teamA.score;
        const score2 = matchData.teamB.score;
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;

        // Déterminer le vainqueur et le perdant
        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;

        // Récupérer le match complet de l'état du tournoi
        const currentMatchInfo = tournamentState.matches[matchId];
        if (!currentMatchInfo) {
            alert("Erreur: Impossible de trouver les informations du match dans l'état du tournoi");
            return;
        }

        // Préparation des données finales avec toutes les informations nécessaires
        const finalData = {
            matchId: matchId,
            score1: score1,
            score2: score2,
            team1: team1,
            team2: team2,
            winner: winner,
            loser: loser,
            status: 'terminé',
            matchType: currentMatchInfo.matchType,
            nextMatchWin: currentMatchInfo.nextMatchWin,
            nextMatchLose: currentMatchInfo.nextMatchLose
        };

        // Mise à jour de l'état local
        tournamentState.matches[matchId] = {
            ...tournamentState.matches[matchId],
            ...finalData
        };

        // IMPORTANT: Propager le vainqueur et le perdant vers les matchs suivants
        await propagateTeamsToNextMatches(tournamentState.matches[matchId]);

        // Synchroniser avec le serveur
        if (socket && isSocketConnected) {
            // Notification du match terminé
            socket.emit('match_completed', finalData);
        }

        // Redirection vers la page principale après un court délai
        setTimeout(() => {
            window.location.href = 'football.html';
        }, 800);
        
    } catch (error) {
        console.error('❌ Erreur lors de la finalisation du match:', error);
        alert('Erreur: ' + error.message);
    }
}

// Modifier la fonction simulateMatch pour utiliser la nouvelle propagation
async function simulateMatch(matchId) {
    const match = tournamentState.matches[matchId];
    if (!match || match.status === MATCH_STATUS.FINISHED) return;

    // Ajouter l'identifiant du match dans l'objet match pour la propagation
    match.matchId = matchId;

    // Mettre le match en cours
    match.status = MATCH_STATUS.IN_PROGRESS;
    await updateUI();

    // Simuler une petite attente
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Générer les scores
    match.score1 = Math.floor(Math.random() * 6);
    match.score2 = Math.floor(Math.random() * 6);

    // Gérer l'égalité
    if (match.score1 === match.score2) {
        match.score1++;
    }

    // Déterminer le vainqueur
    match.winner = match.score1 > match.score2 ? match.team1 : match.team2;
    match.loser = match.score1 > match.score2 ? match.team2 : match.team1;

    // Terminer le match
    match.status = MATCH_STATUS.FINISHED;
    
    // IMPORTANT: Utiliser notre nouvelle fonction de propagation
    await propagateTeamsToNextMatches(match);
    
    await updateUI();
    saveTournamentState();

    if (socket && isSocketConnected) {
        socket.emit('match_completed', {
            ...match,
            matchId,
            needsUpdate: true
        });
    }
}

// Supprimer updateNextMatches pour éviter les conflits
// (cette fonction est remplacée par propagateTeamsToNextMatches)

// ...existing code...