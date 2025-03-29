/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Variables globales
let correctionModeActive = false;
let socket;
let socketConnected = false;

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

let tournamentState = {
    matches: {
      // Barrages (matchIds 1 à 2)
      1: {
        matchType: 'barrage',
        team1: 'FMMS',  // Corrigé: inverser avec match 2
        team2: 'IESEG', // Corrigé: inverser avec match 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 4,  // Le gagnant va en QF2
        nextMatchLose: null,
        time: '9:00'
      },
      2: {
        matchType: 'barrage',
        team1: 'FGES',  // Corrigé: inverser avec match 1
        team2: 'FLSH',  // Corrigé: inverser avec match 1
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 6,  // Le gagnant va en QF4 - CORRIGÉ: Était 7, maintenant 6
        nextMatchLose: null,
        time: '9:00'
      },
      // Quarts de finale (matchIds 3 à 6)
      3: {  // QF1
        matchType: 'quarterfinal',
        team1: 'ESPAS-ESTICE',
        team2: 'FLD',
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 9,  // Le gagnant va en DF1 - CORRIGÉ: Était 8, maintenant 9
        nextMatchLose: 7, // Le perdant va en DC1 - CORRIGÉ: Était 10, maintenant 7
        time: '9:30'
      },
      4: {  // QF2
        matchType: 'quarterfinal', 
        team1: 'ICAM',
        team2: null, // Gagnant Barrage 1
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 9,  // Le gagnant va en DF1 - CORRIGÉ: Était 8, maintenant 9
        nextMatchLose: 7, // Le perdant va en DC1 - CORRIGÉ: Était 10, maintenant 7
        time: '9:30'
      },
      5: {  // QF3
        matchType: 'quarterfinal',
        team1: 'IKPO',
        team2: 'USCHOOL',
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 10,  // Le gagnant va en DF2 - CORRIGÉ: Était 9, maintenant 10
        nextMatchLose: 8, // Le perdant va en DC2 - CORRIGÉ: Était 11, maintenant 8
        time: '10:00'
      },
      6: {  // QF4
        matchType: 'quarterfinal',
        team1: 'PIKTURA',
        team2: null, // Gagnant Barrage 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 10,  // Le gagnant va en DF2 - CORRIGÉ: Était 9, maintenant 10
        nextMatchLose: 8, // Le perdant va en DC2 - CORRIGÉ: Était 11, maintenant 8
        time: '10:00'
      },
      // Matchs de classement (entre perdants des quarts) - CORRIGÉS: Nouveaux IDs 7 et 8
      7: {
        matchType: 'classification_semifinal',
        team1: null, // Perdant QF1
        team2: null, // Perdant QF2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 12,  // Gagnant va en match 5ème place
        nextMatchLose: 11,  // Perdant va en match 7ème place
        time: '10:30'
      },
      8: {
        matchType: 'classification_semifinal',
        team1: null, // Perdant QF3
        team2: null, // Perdant QF4
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 12,  // Gagnant va en match 5ème place
        nextMatchLose: 11,  // Perdant va en match 7ème place
        time: '11:00'
      },
      // Demi-finales principales - CORRIGÉS: Nouveaux IDs 9 et 10
      9: {
        matchType: 'semifinal',
        team1: null, // Gagnant QF1
        team2: null, // Gagnant QF2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 14,  // Gagnant va en finale
        nextMatchLose: 13,  // Perdant va en petite finale
        time: '10:30'
      },
      10: {
        matchType: 'semifinal',
        team1: null, // Gagnant QF3
        team2: null, // Gagnant QF4
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        nextMatchWin: 14,  // Gagnant va en finale
        nextMatchLose: 13,  // Perdant va en petite finale
        time: '11:00'
      },
      // Matchs de classement finaux
      11: { // Match 7ème place - CORRIGÉ: ID changé de 14 à 11
        matchType: 'classification_smallfinal',
        team1: null, // Perdant SF Classement 1
        team2: null, // Perdant SF Classement 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        time: '11:30'
      },
      12: { // Match 5ème place - CORRIGÉ: ID changé de 13 à 12
        matchType: 'classification_final',
        team1: null, // Gagnant SF Classement 1
        team2: null, // Gagnant SF Classement 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        time: '11:30'
      },
      // Matchs pour les médailles
      13: { // Petite finale 3ème place - CORRIGÉ: ID changé de 12 à 13
        matchType: 'smallfinal',
        team1: null, // Perdant SF 1
        team2: null, // Perdant SF 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        time: '12:00'
      },
      14: { // Finale 1ère place - CORRIGÉ: ID changé de 11 à 14
        matchType: 'final',
        team1: null, // Gagnant SF 1
        team2: null, // Gagnant SF 2
        score1: null,
        score2: null,
        status: 'à_venir',
        winner: null,
        loser: null,
        time: '12:00'
      }
    }
  };

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
    localStorage.setItem('badmintonTournamentState', JSON.stringify(tournamentState));
    localStorage.setItem('lastUpdateBadminton', new Date().toISOString());
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
    const savedState = localStorage.getItem('badmintonTournamentState');
    if (savedState) {
        try {
            const newState = JSON.parse(savedState);
            
            // Avant de remplacer complètement l'état, vérifier s'il y a des matchs terminés à conserver
            if (tournamentState && tournamentState.matches) {
                const finishedMatches = {};
                
                // Identifier les matchs terminés dans l'état actuel
                Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
                    if (matchData.status === 'terminé') {
                        finishedMatches[matchId] = true;
                        console.log(`Match terminé détecté: ${matchId}`);
                    }
                });
                
                // Vérifier si nous avons des matchs terminés sauvegardés séparément
                const savedFinishedMatches = localStorage.getItem('badminton_finishedMatches');
                if (savedFinishedMatches) {
                    const additionalMatches = JSON.parse(savedFinishedMatches);
                    Object.keys(additionalMatches).forEach(matchId => {
                        finishedMatches[matchId] = true;
                        console.log(`Match terminé supplémentaire: ${matchId}`);
                    });
                }
                
                // Appliquer le statut "terminé" aux matchs appropriés dans le nouvel état
                if (Object.keys(finishedMatches).length > 0) {
                    Object.keys(finishedMatches).forEach(matchId => {
                        if (newState.matches[matchId]) {
                            // Conservation explicite du statut "terminé"
                            console.log(`Conservation du statut 'terminé' pour match ${matchId}`);
                            newState.matches[matchId].status = 'terminé';
                        }
                    });
                }
            }
            
            // Remplacer l'état complet
            tournamentState = newState;
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état du tournoi:', error);
            return false;
        }
    }
    return false;
}

// ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
const positionPoints = {
  1: 50,  // Champion
  2: 40,  // Finaliste
  3: 35,  // 3ème place (gagnant Place de 3e)
  4: 30,  // 4ème place (perdant Place de 3e)
  5: 25,  // 5ème place (gagnant Place de 5e)
  6: 20,  // 6ème place (perdant Place de 5e)
  7: 15,   // 7ème place (gagnant Place de 7e)
  8: 10,    // 8ème place (perdant Place de 7e)
  9: 5,    // 9ème place (les deux perdants des barrages)
};

// ----- INITIALISATION -----
document.addEventListener('DOMContentLoaded', function() {
  // Ajouter un indicateur de synchronisation dans l'interface
  addSyncIndicator();
  
  // Initialiser la connexion WebSocket
  initWebSocket();
  
  // Ajouter vérification de cohérence entre HTML et tournamentState
  checkMatchConsistency();
  
  // Charger d'abord depuis le serveur, puis utiliser le local storage comme fallback
  initFromServer().then(success => {
    if (!success) {
      if (loadTournamentState()) {
        console.log('État précédent du tournoi chargé depuis le localStorage');
      } else {
        console.warn('Aucun état valide trouvé, réinitialisation du tournoi');
        // Réinitialiser avec l'état par défaut si aucun état valide n'est trouvé
        resetTournamentToDefault();
      }
    }
    
    // Recalculer les liens entre matchs pour s'assurer de la cohérence
    linkWinnersAndLosers();
    updateUI();
    addMatchClickHandlers();
    initializePageState();
  });
});

// Ajouter un indicateur de synchronisation
function addSyncIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'syncIndicator';
  indicator.style.position = 'fixed';
  indicator.style.top = '45px';
  indicator.style.right = '10px';
  indicator.style.padding = '5px 10px';
  indicator.style.background = '#f0f0f0';
  indicator.style.borderRadius = '5px';
  indicator.style.fontSize = '12px';
  indicator.style.zIndex = '1000';
  indicator.style.display = 'flex';
  indicator.style.alignItems = 'center';
  indicator.textContent = 'Status: Non synchronisé';
  
  document.body.appendChild(indicator);
  
  // Ajouter un bouton de rafraîchissement
  const refreshButton = document.createElement('button');
  refreshButton.textContent = '🔄';
  refreshButton.style.marginLeft = '8px';
  refreshButton.style.background = 'none';
  refreshButton.style.border = 'none';
  refreshButton.style.fontSize = '16px';
  refreshButton.style.cursor = 'pointer';
  refreshButton.title = 'Forcer la synchronisation avec le serveur';
  refreshButton.onclick = () => syncWithServer(true);
  
  indicator.appendChild(refreshButton);
}

// Mettre à jour l'indicateur de synchronisation
function updateSyncIndicator(status, message) {
  const indicator = document.getElementById('syncIndicator');
  if (!indicator) return;
  
  if (status === 'success') {
    indicator.style.background = '#d4edda';
    indicator.style.color = '#155724';
    indicator.textContent = `Synchronisé: ${message}`;
  } else if (status === 'error') {
    indicator.style.background = '#f8d7da';
    indicator.style.color = '#721c24';
    indicator.textContent = `Erreur: ${message}`;
  } else if (status === 'syncing') {
    indicator.style.background = '#fff3cd';
    indicator.style.color = '#856404';
    indicator.textContent = 'Synchronisation...';
  }
}

// Fonction pour initialiser l'état du tournoi depuis le serveur
async function initFromServer() {
    updateSyncIndicator('syncing', '');
    
    try {
        // Utiliser WebSocket au lieu de l'API HTTP
        if (socket && socketConnected) {
            return new Promise((resolve, reject) => {
                socket.emit('get_tournament_data', { id_tournois: 5 }); // ID pour badminton
                
                const timeout = setTimeout(() => {
                    socket.off('tournament_data');
                    socket.off('tournament_error');
                    reject(new Error('Timeout WebSocket'));
                }, 10000);
                
                socket.once('tournament_data', (data) => {
                    clearTimeout(timeout);
                    if (data && data.matches) {
                        // Mise à jour des données du tournoi
                        Object.keys(data.matches).forEach(matchId => {
                            if (tournamentState.matches[matchId]) {
                                tournamentState.matches[matchId] = {
                                    ...tournamentState.matches[matchId],
                                    ...data.matches[matchId]
                                };
                            }
                        });
                        saveTournamentState();
                        updateUI();
                        updateSyncIndicator('success', 'Données chargées via WebSocket');
                        resolve(true);
                    } else {
                        reject(new Error('Format de données invalide'));
                    }
                });
                
                socket.once('tournament_error', (error) => {
                    clearTimeout(timeout);
                    reject(new Error(error.message));
                });
            });
        } else {
            // Fallback au localStorage si WebSocket n'est pas disponible
            const localData = localStorage.getItem('badmintonTournamentState');
            if (localData) {
                tournamentState = JSON.parse(localData);
                updateSyncIndicator('success', 'Données locales chargées (mode hors-ligne)');
                return true;
            }
            throw new Error('WebSocket non disponible et pas de données locales');
        }
    } catch (error) {
        console.warn('Erreur lors du chargement:', error);
        updateSyncIndicator('error', error.message);
        return false;
    }
}

// Fonction pour synchroniser l'état du tournoi avec le serveur
function setupServerSynchronization(interval = 3000) {
  // Ne rien faire si WebSocket est activé
  if (socket && socketConnected) {
    console.log('Synchronisation HTTP désactivée car WebSocket est actif');
    return;
  }
  
  // Utiliser la synchronisation HTTP classique comme fallback
  console.log('Configuration de la synchronisation HTTP (fallback) toutes les ' + interval + 'ms');
  setInterval(syncWithServer, interval);
}

// Fonction pour synchroniser avec le serveur
async function syncWithServer(forceFullSync = false) {
    try {
        updateSyncIndicator('syncing', '');
        
        // Vérifier d'abord les statuts des matchs dans localStorage
        const activeMatchIds = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('liveMatchData_match')) {
                try {
                    const matchId = key.replace('liveMatchData_match', '');
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.status === 'en_cours') {
                        activeMatchIds.push(matchId);
                        
                        // Mettre à jour le statut dans tournamentState
                        if (tournamentState.matches[matchId]) {
                            tournamentState.matches[matchId].status = 'en_cours';
                        }
                    }
                } catch (e) {
                    console.warn(`Erreur lors de la lecture des données pour ${key}:`, e);
                }
            }
        }
        
        if (activeMatchIds.length > 0) {
            console.log("Matchs actifs détectés dans localStorage:", activeMatchIds);
        }
        
        const response = await fetch('/api/matches/badminton');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        if (data.matches && Array.isArray(data.matches)) {
            let hasChanges = false;
            let updatedCount = 0;
            
            // Mettre à jour les matchs dans tournamentState
            data.matches.forEach(match => {
                const matchId = match.id_match.toString();
                if (tournamentState.matches[matchId]) {
                    const currentMatch = tournamentState.matches[matchId];
                    
                    // Vérifier si les données du match ont changé
                    const scoreChanged = match.score_equipe1 !== currentMatch.score1 || match.score_equipe2 !== currentMatch.score2;
                    const statusChanged = match.status !== currentMatch.status;
                    const winnerChanged = match.winner !== currentMatch.winner || match.loser !== currentMatch.loser;
                    const teamsChanged = match.team1 !== currentMatch.team1 || match.team2 !== currentMatch.team2;
                    
                    // Si forceFullSync est true, considérer tous les matchs comme modifiés
                    if (forceFullSync || scoreChanged || statusChanged || winnerChanged || teamsChanged) {
                        console.log(`Mise à jour du match ${matchId} depuis le serveur:`, {
                            avant: {
                                team1: currentMatch.team1,
                                team2: currentMatch.team2,
                                score: `${currentMatch.score1}-${currentMatch.score2}`,
                                status: currentMatch.status,
                                winner: currentMatch.winner
                            },
                            après: {
                                team1: match.team1,
                                team2: match.team2,
                                score: `${match.score_equipe1}-${match.score_equipe2}`,
                                status: match.status,
                                winner: match.winner
                            }
                        });
                        
                        // Mettre à jour les données
                        tournamentState.matches[matchId].team1 = match.team1;
                        tournamentState.matches[matchId].team2 = match.team2;
                        tournamentState.matches[matchId].score1 = match.score_equipe1;
                        tournamentState.matches[matchId].score2 = match.score_equipe2;
                        tournamentState.matches[matchId].status = match.status;
                        tournamentState.matches[matchId].winner = match.winner;
                        tournamentState.matches[matchId].loser = match.loser;
                        
                        hasChanges = true;
                        updatedCount++;
                    }
                }
            });
            
            if (hasChanges) {
                console.log(`${updatedCount} match(es) mis à jour depuis le serveur`);
                
                // Recalculer les liens et mettre à jour l'interface
                linkWinnersAndLosers();
                updateUI();
                saveTournamentState();
                
                updateSyncIndicator('success', `${updatedCount} match(es) mis à jour`);
            } else {
                updateSyncIndicator('success', 'Aucun changement');
            }
        } else {
            updateSyncIndicator('success', 'Aucun changement');
        }
        
        // Mettre à jour l'UI après la synchronisation
        updateUI();
    } catch (error) {
        console.error('Erreur lors de la synchronisation avec le serveur:', error);
        updateSyncIndicator('error', 'Erreur de synchronisation');
    }
}

// Fonction pour initialiser la connexion WebSocket
function initWebSocket() {
  try {
    // Vérifier si Socket.IO est disponible
    if (typeof io === 'undefined') {
      console.error('Socket.IO n\'est pas chargé. Vérifiez que le script est inclus dans votre page HTML.');
      return;
    }
    
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
      socketConnected = true;
      updateConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket');
      socketConnected = false;
      updateConnectionStatus('disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
      socketConnected = false;
      updateConnectionStatus('disconnected');
    });
    
    socket.on('matches_data', (data) => {
      console.log('Données de matchs reçues via WebSocket:', data);
      if (data.success && data.matches && Array.isArray(data.matches)) {
        updateMatchesFromWebSocket(data.matches);
      }
    });
    
    socket.on('match_updated', (data) => {
      console.log('Mise à jour de match reçue via WebSocket:', data);
      if (data && data.matchId) {
        updateSingleMatchFromWebSocket(data);
      }
    });
    
    socket.on('matches_error', (error) => {
      console.error('Erreur WebSocket lors de la récupération des matchs:', error);
      updateSyncIndicator('error', 'Erreur WebSocket: ' + (error.message || 'Inconnu'));
    });
    
    socket.on('match_status_updated', (data) => {
      console.log('Mise à jour du statut de match reçue via WebSocket:', data);
      if (data && data.matchId) {
        // Mise à jour spécifique du statut d'un match
        const matchId = data.matchId.toString();
        
        if (tournamentState.matches[matchId]) {
          const match = tournamentState.matches[matchId];
          let hasChanges = false;
          
          if (data.status && data.status !== match.status) {
            console.log(`Mise à jour du statut du match ${matchId} : ${match.status} -> ${data.status}`);
            match.status = data.status;
            hasChanges = true;
          }
          
          if (data.score1 !== undefined && data.score1 !== match.score1) {
            match.score1 = data.score1;
            hasChanges = true;
          }
          
          if (data.score2 !== undefined && data.score2 !== match.score2) {
            match.score2 = data.score2;
            hasChanges = true;
          }
          
          if (hasChanges) {
            // Mettre à jour l'UI pour refléter les changements
            updateUI();
            updateSyncIndicator('success', `Statut du match ${matchId} mis à jour en temps réel`);
          }
        }
      }
    });

    socket.on('tournament_reset', (data) => {
        console.log('Notification de réinitialisation du tournoi reçue:', data);
        if (data.id_tournois === 5) { // Pour le tournoi de volleyball
            // Recharger les données depuis le serveur
            initFromServer().then(() => {
                // Recalculer les liens et mettre à jour l'interface
                linkWinnersAndLosers();
                updateUI();
                updateSyncIndicator('success', 'Tournoi réinitialisé par un administrateur');
            });
        }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation WebSocket:', error);
  }
}

// Fonction pour mettre à jour les matchs depuis WebSocket
function updateMatchesFromWebSocket(matches) {
  if (!matches || matches.length === 0) return;
  
  const serverMatches = {};
  let matchCount = 0;
  
  matches.forEach(match => {
    if (match && match.id_match) {
      const matchId = match.id_match.toString();
      matchCount++;
      
      // Conserver la structure existante du match si elle existe
      const existingMatch = tournamentState.matches[matchId] || {};
      
      // Fusionner les données
      serverMatches[matchId] = {
        ...existingMatch,
        matchType: match.match_type || existingMatch.matchType || 'barrage',
        team1: match.team1 || existingMatch.team1 || null,
        team2: match.team2 || existingMatch.team2 || null,
        score1: match.score_equipe1 !== undefined ? match.score_equipe1 : (existingMatch.score1 || 0),
        score2: match.score_equipe2 !== undefined ? match.score_equipe2 : (existingMatch.score2 || 0),
        status: match.status || existingMatch.status || 'à_venir',
        winner: match.winner || existingMatch.winner || null,
        loser: match.loser || existingMatch.loser || null,
        nextMatchWin: existingMatch.nextMatchWin || null,
        nextMatchLose: existingMatch.nextMatchLose || null,
        time: existingMatch.time || null
      };
    }
  });
  
  // Pour les matchs qui n'existent pas sur le serveur
  Object.keys(tournamentState.matches).forEach(matchId => {
    if (!serverMatches[matchId]) {
      serverMatches[matchId] = tournamentState.matches[matchId];
    }
  });
  
  // Mettre à jour l'état du tournoi
  tournamentState.matches = serverMatches;
  
  // Recalculer les liens et mettre à jour l'interface
  linkWinnersAndLosers();
  updateUI();
  saveTournamentState();
  
  updateSyncIndicator('success', `${matchCount} matchs synchronisés via WebSocket`);
}

// Fonction pour mettre à jour un seul match depuis WebSocket
function updateSingleMatchFromWebSocket(data) {
  const { matchId, team1, team2, score1, score2, status, winner, loser } = data;
  
  if (!matchId || !tournamentState.matches[matchId]) return;
  
  const match = tournamentState.matches[matchId];
  let hasChanges = false;
  
  if (team1 && team1 !== match.team1) {
    match.team1 = team1;
    hasChanges = true;
  }
  
  if (team2 && team2 !== match.team2) {
    match.team2 = team2;
    hasChanges = true;
  }
  
  if (score1 !== undefined && score1 !== match.score1) {
    match.score1 = score1;
    hasChanges = true;
  }
  
  if (score2 !== undefined && score2 !== match.score2) {
    match.score2 = score2;
    hasChanges = true;
  }
  
  if (status && status !== match.status) {
    console.log(`WebSocket - Mise à jour du statut du match ${matchId} : "${match.status}" → "${status}"`);
    match.status = status;
    hasChanges = true;
  }
  
  if (winner && winner !== match.winner) {
    match.winner = winner;
    hasChanges = true;
  }
  
  if (loser && loser !== match.loser) {
    match.loser = loser;
    hasChanges = true;
  }
  
  if (hasChanges) {
    console.log(`Match ${matchId} mis à jour depuis WebSocket`);
    linkWinnersAndLosers();
    updateUI();
    saveTournamentState();
    updateSyncIndicator('success', `Match ${matchId} mis à jour en temps réel`);
  }
}

// Modifier la fonction updateConnectionStatus pour utiliser l'état WebSocket
function updateConnectionStatus(state) {
    const connectionStatus = document.getElementById('connectionStatus');
    if (!connectionStatus) return;
    
    if (state === 'connected') {
        connectionStatus.textContent = 'WebSocket: ✅ Connecté';
        connectionStatus.style.background = '#d4edda';
        connectionStatus.style.color = '#155724';
    } else if (state === 'disconnected') {
        connectionStatus.textContent = 'WebSocket: ❌ Déconnecté';
        connectionStatus.style.background = '#f8d7da';
        connectionStatus.style.color = '#721c24';
    } else if (state === 'connecting') {
        connectionStatus.textContent = 'WebSocket: ⌛ Connexion...';
        connectionStatus.style.background = '#fff3cd';
        connectionStatus.style.color = '#856404';
    }
}

// Remplacer la fonction sendMatchResultToServer pour utiliser WebSocket quand disponible
async function sendMatchResultToServer(matchId, matchData) {
    console.log(`Envoi des résultats du match ${matchId} au serveur:`, matchData);
    
    // Si WebSocket est disponible et connecté, utiliser WebSocket
    if (socket && socketConnected) {
        try {
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    socket.off('update_match_success');
                    socket.off('update_match_error');
                    reject(new Error('Timeout WebSocket'));
                }, 10000); // Augmenté à 10 secondes
                
                socket.emit('update_match', {
                    matchId,
                    ...matchData,
                    id_tournois: 5 // ID pour volleyball
                });
                
                socket.once('update_match_success', () => {
                    clearTimeout(timeoutId);
                    resolve();
                });
                
                socket.once('update_match_error', (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
            });
        } catch (error) {
            console.warn('Erreur WebSocket, utilisation HTTP:', error);
            // Continuer avec le fallback HTTP
        }
    }
    
    // Fallback HTTP ou si WebSocket a échoué
    const response = await fetch('/api/match-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            matchId,
            team1: matchData.team1,
            team2: matchData.team2,
            score1: matchData.score1,
            score2: matchData.score2,
            status: matchData.status,
            winner: matchData.winner,
            loser: matchData.loser,
            matchType: matchData.matchType,
            id_tournois: 5 // ID du tournoi de volleyball
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
}

// Fonction pour recalculer et mettre à jour les relations entre les matchs
function linkWinnersAndLosers() {
  console.log("Recalcul des liens entre les matchs");
  
  // Parcourir tous les matchs
  Object.entries(tournamentState.matches).forEach(([matchId, match]) => {
    // Ne traiter que les matchs terminés avec un vainqueur
    if (match.status === 'terminé' && match.winner) {
      
      // Si ce match a un lien vers un match suivant pour le gagnant
      if (match.nextMatchWin && tournamentState.matches[match.nextMatchWin]) {
        const nextMatch = tournamentState.matches[match.nextMatchWin];
        
        // Déterminer si le gagnant doit aller à team1 ou team2
        // Pour les matchs de barrage (1 et 2), on sait exactement où ils vont
        if (matchId === '1') {
          // Gagnant du barrage 1 va dans QF2 (match 4) en team2
          console.log(`Propagation: Gagnant du barrage 1 (${match.winner}) → QF2 (team2)`);
          nextMatch.team2 = match.winner;
        } else if (matchId === '2') {
          // Gagnant du barrage 2 va dans QF4 (match 6) en team2
          console.log(`Propagation: Gagnant du barrage 2 (${match.winner}) → QF4 (team2)`);
          nextMatch.team2 = match.winner;
        } 
        // Pour les quarts de finale
        else if (matchId === '3' || matchId === '4') {
          // Gagnants des QF1 et QF2 vont en demi-finale 1
          // QF1 va en team1, QF2 va en team2
          if (matchId === '3') {
            console.log(`Propagation: Gagnant du QF1 (${match.winner}) → SF1 (team1)`);
            nextMatch.team1 = match.winner;
          } else {
            console.log(`Propagation: Gagnant du QF2 (${match.winner}) → SF1 (team2)`);
            nextMatch.team2 = match.winner;
          }
        } else if (matchId === '5' || matchId === '6') {
          // Gagnants des QF3 et QF4 vont en demi-finale 2
          // QF3 va en team1, QF4 va en team2
          if (matchId === '5') {
            console.log(`Propagation: Gagnant du QF3 (${match.winner}) → SF2 (team1)`);
            nextMatch.team1 = match.winner;
          } else {
            console.log(`Propagation: Gagnant du QF4 (${match.winner}) → SF2 (team2)`);
            nextMatch.team2 = match.winner;
          }
        }
        // Pour les demi-finales principales
        else if (matchId === '7' || matchId === '8') {
          // Gagnants des demi-finales vont en finale
          if (matchId === '7') {
            console.log(`Propagation: Gagnant du SF1 (${match.winner}) → Finale (team1)`);
            nextMatch.team1 = match.winner;
          } else {
            console.log(`Propagation: Gagnant du SF2 (${match.winner}) → Finale (team2)`);
            nextMatch.team2 = match.winner;
          }
        }
        // Pour les demi-finales de classement
        else if (matchId === '9' || matchId === '10') {
          // Gagnants des demi-finales de classement vont au match pour la 5ème place
          if (matchId === '9') {
            console.log(`Propagation: Gagnant du SF Class 1 (${match.winner}) → Match 5ème place (team1)`);
            nextMatch.team1 = match.winner;
          } else {
            console.log(`Propagation: Gagnant du SF Class 2 (${match.winner}) → Match 5ème place (team2)`);
            nextMatch.team2 = match.winner;
          }
        }
      }
      
      // Si ce match a un lien vers un match suivant pour le perdant
      if (match.nextMatchLose && match.loser && tournamentState.matches[match.nextMatchLose]) {
        const nextMatch = tournamentState.matches[match.nextMatchLose];
        
        // Pour les quarts de finale - perdants vont en demi-finales de classement
        if (matchId === '3' || matchId === '4') {
          // Perdants des QF1 et QF2 vont en demi-finale de classement 1
          if (matchId === '3') {
            console.log(`Propagation: Perdant du QF1 (${match.loser}) → SF Class 1 (team1)`);
            nextMatch.team1 = match.loser;
          } else {
            console.log(`Propagation: Perdant du QF2 (${match.loser}) → SF Class 1 (team2)`);
            nextMatch.team2 = match.loser;
          }
        } else if (matchId === '5' || matchId === '6') {
          // Perdants des QF3 et QF4 vont en demi-finale de classement 2
          if (matchId === '5') {
            console.log(`Propagation: Perdant du QF3 (${match.loser}) → SF Class 2 (team1)`);
            nextMatch.team1 = match.loser;
          } else {
            console.log(`Propagation: Perdant du QF4 (${match.loser}) → SF Class 2 (team2)`);
            nextMatch.team2 = match.loser;
          }
        }
        // Pour les demi-finales principales - perdants vont au match pour la 3ème place
        else if (matchId === '7' || matchId === '8') {
          if (matchId === '7') {
            console.log(`Propagation: Perdant du SF1 (${match.loser}) → Match 3ème place (team1)`);
            nextMatch.team1 = match.loser;
          } else {
            console.log(`Propagation: Perdant du SF2 (${match.loser}) → Match 3ème place (team2)`);
            nextMatch.team2 = match.loser;
          }
        }
        // Pour les demi-finales de classement - perdants vont au match pour la 7ème place
        else if (matchId === '9' || matchId === '10') {
          if (matchId === '9') {
            console.log(`Propagation: Perdant du SF Class 1 (${match.loser}) → Match 7ème place (team1)`);
            nextMatch.team1 = match.loser;
          } else {
            console.log(`Propagation: Perdant du SF Class 2 (${match.loser}) → Match 7ème place (team2)`);
            nextMatch.team2 = match.loser;
          }
        }
      }
    }
  });
  
  // Sauvegarder après la propagation
  saveTournamentState();
}

// Initialiser l'état de la page au chargement
function initializePageState() {
  // Afficher le premier onglet par défaut
  const phaseSelect = document.getElementById('phaseSelect');
  if (phaseSelect) {
    phaseSelect.value = 'qualification-phase';
    phaseSelect.dispatchEvent(new Event('change'));
  }
  
  // Vérifier s'il y a des barrages terminés et mettre à jour la navigation
  const barrage1 = tournamentState.matches['1'];
  const barrage2 = tournamentState.matches['2'];
  
  if ((barrage1 && barrage1.status === 'terminé') || 
      (barrage2 && barrage2.status === 'terminé')) {
    // Si un des barrages est terminé, rediriger vers la phase finale
    if (phaseSelect) {
      phaseSelect.value = 'final-phase';
      phaseSelect.dispatchEvent(new Event('change'));
    }
  }
}

// Fonction pour calculer le classement final
function calculateRankings() {
  const rankings = [];
  
  // 1. Ajouter les 1er et 2e places (finale)
  const finalMatch = tournamentState.matches[11];
  if (finalMatch && finalMatch.status === 'terminé') {
    if (finalMatch.winner) {
      rankings.push({ name: finalMatch.winner, points: positionPoints[1], position: 1 });
    }
    if (finalMatch.loser) {
      rankings.push({ name: finalMatch.loser, points: positionPoints[2], position: 2 });
    }
  }

  // 2. Ajouter les 3e et 4e places (petite finale)
  const thirdPlaceMatch = tournamentState.matches[12];
  if (thirdPlaceMatch && thirdPlaceMatch.status === 'terminé') {
    if (thirdPlaceMatch.winner) {
      rankings.push({ name: thirdPlaceMatch.winner, points: positionPoints[3], position: 3 });
    }
    if (thirdPlaceMatch.loser) {
      rankings.push({ name: thirdPlaceMatch.loser, points: positionPoints[4], position: 4 });
    }
  }

  // 3. Ajouter les 5e et 6e places
  const fifthPlaceMatch = tournamentState.matches[13];
  if (fifthPlaceMatch && fifthPlaceMatch.status === 'terminé') {
    if (fifthPlaceMatch.winner) {
      rankings.push({ name: fifthPlaceMatch.winner, points: positionPoints[5], position: 5 });
    }
    if (fifthPlaceMatch.loser) {
      rankings.push({ name: fifthPlaceMatch.loser, points: positionPoints[6], position: 6 });
    }
  }

  // 4. Ajouter les 7e et 8e places
  const seventhPlaceMatch = tournamentState.matches[14];
  if (seventhPlaceMatch && seventhPlaceMatch.status === 'terminé') {
    if (seventhPlaceMatch.winner) {
      rankings.push({ name: seventhPlaceMatch.winner, points: positionPoints[7], position: 7 });
    }
    if (seventhPlaceMatch.loser) {
      rankings.push({ name: seventhPlaceMatch.loser, points: positionPoints[8], position: 8 });
    }
  }

  // 5. Ajouter les autres équipes avec 0 point
  allTeams.forEach(team => {
    if (!rankings.some(r => r.name === team)) {
      rankings.push({ name: team, points: 0, position: null });
    }
  });

  // Trier le classement par points décroissants
  rankings.sort((a, b) => {
    if (a.position !== null && b.position !== null) {
      return a.position - b.position;
    }
    return b.points - a.points;
  });

  return rankings;
}

// Fonction pour mettre à jour l'affichage du classement
function updateRankingDisplay() {
  try {
    console.log("Mise à jour du classement final");
    const rankings = calculateRankings();
    const rankingList = document.getElementById('rankingList');
    
    if (!rankingList) {
      console.error("Élément 'rankingList' non trouvé dans le DOM");
      return;
    }
    
    // Vider la liste actuelle
    rankingList.innerHTML = '';
    
    // Créer un objet pour stocker les points à envoyer au serveur
    const teamPoints = {};
    
    // Générer les lignes du classement
    rankings.forEach((team, index) => {
      const position = index + 1;
      const highlightClass = position <= 3 ? `highlight-${position}` : '';
      
      // Stocker les points pour l'envoi au serveur
      teamPoints[team.name] = team.points;
      
      // Générer le HTML pour cette équipe
      rankingList.innerHTML += `
        <div class="ranking-row ${highlightClass}">
          <div class="rank">${position}</div>
          <div class="teamname">
            <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" onerror="this.src='/img/default.png';" />
            ${team.name}
          </div>
          <div class="points">${team.points}</div>
        </div>
      `;
    });
    
    // Envoyer les points au serveur si disponible
    if (socket && socketConnected) {
      socket.emit('badminton_points', {
        points: teamPoints,
        timestamp: new Date().toISOString()
      });
      console.log('Points envoyés au serveur via WebSocket');
    } else {
      // Sauvegarde locale si le serveur n'est pas disponible
      localStorage.setItem('badmintonPoints', JSON.stringify({
        points: teamPoints,
        timestamp: new Date().toISOString()
      }));
      console.log('Points sauvegardés localement');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du classement:', error);
  }
}

// Fonction pour réinitialiser le tournoi
function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) {
      return;
    }
    
    console.log("Réinitialisation du tournoi de badminton");
    
    // Supprimer les données locales
    localStorage.removeItem('badmintonTournamentState');
    localStorage.removeItem('badmintonPoints');
    localStorage.removeItem('lastUpdateBadminton');
    
    // AJOUT: Supprimer toutes les données des matchs en cours qui pourraient persister
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('liveMatchData_match') || 
                    key.startsWith('liveMatchData_badminton_') ||
                    key === 'liveMatchData' ||
                    key === 'badminton_finishedMatches')) {
            localStorage.removeItem(key);
            console.log(`Suppression de la clé: ${key}`);
            // Comme on modifie localStorage pendant l'itération, on doit ajuster l'index
            i--;
        }
    }
    
    // Réinitialiser l'état en mémoire à l'état initial avec statut explicitement à 'à_venir'
    tournamentState = {
      matches: {
        // Barrages (matchIds 1 à 2)
        1: {
          matchType: 'barrage',
          team1: 'FMMS',
          team2: 'IESEG',
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 4,
          nextMatchLose: null,
          time: '9:00'
        },
        2: {
          matchType: 'barrage',
          team1: 'FGES',
          team2: 'FLSH',
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 6,
          nextMatchLose: null,
          time: '9:00'
        },
        // Quarts de finale (matchIds 3 à 6)
        3: {  // QF1
          matchType: 'quarterfinal',
          team1: 'ESPAS-ESTICE',
          team2: 'FLD',
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 9,
          nextMatchLose: 7,
          time: '9:30'
        },
        4: {  // QF2
          matchType: 'quarterfinal', 
          team1: 'ICAM',
          team2: null, // Gagnant Barrage 1
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 9,
          nextMatchLose: 7,
          time: '9:30'
        },
        5: {  // QF3
          matchType: 'quarterfinal',
          team1: 'IKPO',
          team2: 'USCHOOL',
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 10,
          nextMatchLose: 8,
          time: '10:00'
        },
        6: {  // QF4
          matchType: 'quarterfinal',
          team1: 'PIKTURA',
          team2: null, // Gagnant Barrage 2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 10,
          nextMatchLose: 8,
          time: '10:00'
        },
        // Matchs de classement (entre perdants des quarts) - CORRIGÉS: Nouveaux IDs 7 et 8
        7: {
          matchType: 'classification_semifinal',
          team1: null, // Perdant QF1
          team2: null, // Perdant QF2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 12,
          nextMatchLose: 11,
          time: '10:30'
        },
        8: {
          matchType: 'classification_semifinal',
          team1: null, // Perdant QF3
          team2: null, // Perdant QF4
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 12,
          nextMatchLose: 11,
          time: '11:00'
        },
        // Demi-finales principales - CORRIGÉS: Nouveaux IDs 9 et 10
        9: {
          matchType: 'semifinal',
          team1: null, // Gagnant QF1
          team2: null, // Gagnant QF2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 14,
          nextMatchLose: 13,
          time: '10:30'
        },
        10: {
          matchType: 'semifinal',
          team1: null, // Gagnant QF3
          team2: null, // Gagnant QF4
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          nextMatchWin: 14,
          nextMatchLose: 13,
          time: '11:00'
        },
        // Matchs de classement finaux
        11: { // Match 7ème place - CORRIGÉ: ID changé de 14 à 11
          matchType: 'classification_smallfinal',
          team1: null, // Perdant SF Classement 1
          team2: null, // Perdant SF Classement 2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          time: '11:30'
        },
        12: { // Match 5ème place - CORRIGÉ: ID changé de 13 à 12
          matchType: 'classification_final',
          team1: null, // Gagnant SF Classement 1
          team2: null, // Gagnant SF Classement 2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          time: '11:30'
        },
        // Matchs pour les médailles
        13: { // Petite finale 3ème place - CORRIGÉ: ID changé de 12 à 13
          matchType: 'smallfinal',
          team1: null, // Perdant SF 1
          team2: null, // Perdant SF 2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          time: '12:00'
        },
        14: { // Finale 1ère place - CORRIGÉ: ID changé de 11 à 14
          matchType: 'final',
          team1: null, // Gagnant SF 1
          team2: null, // Gagnant SF 2
          score1: null,
          score2: null,
          status: 'à_venir',
          winner: null,
          loser: null,
          time: '12:00'
        }
      }
    };
    
    // Sauvegarder explicitement l'état réinitialisé
    localStorage.setItem('badmintonTournamentState', JSON.stringify(tournamentState));
    
    // Notifier le serveur si disponible
    if (socket && socketConnected) {
      socket.emit('reset_tournament', {
        sport: 'badminton',
        state: tournamentState,
        timestamp: new Date().toISOString()
      });
      console.log('Notification de réinitialisation envoyée au serveur');
    }
    
    // MODIFICATION: Forcer l'actualisation complète de la page pour éviter les problèmes d'état
    if (confirm('Tournoi réinitialisé avec succès. La page va être rechargée pour appliquer les changements.')) {
      window.location.reload();
    } else {
      // Si l'utilisateur annule le rechargement, mettre quand même à jour l'UI
      updateUI();
      
      // Revenir à l'onglet de qualification
      const phaseSelect = document.getElementById('phaseSelect');
      if (phaseSelect) {
        phaseSelect.value = 'qualification-phase';
        phaseSelect.dispatchEvent(new Event('change'));
      }
    }
}

// Exposer les fonctions globales
window.updateRankingDisplay = updateRankingDisplay;
window.resetTournament = resetTournament;
window.simulateTournament = simulateTournament;
window.toggleCorrectionMode = toggleCorrectionMode;
window.linkWinnersAndLosers = linkWinnersAndLosers;

// Fonction pour mettre à jour l'interface utilisateur
function updateUI() {
  console.log("Mise à jour de l'interface utilisateur");
  
  try {
    // Vérifier les paramètres d'URL pour préserver les matchs terminés
    const urlParams = new URLSearchParams(window.location.search);
    const preserveFinished = urlParams.has('preserveFinished');
    
    // Vérifier aussi les matchs terminés sauvegardés
    const savedFinishedMatches = localStorage.getItem('badminton_finishedMatches');
    let finishedMatchIds = [];
    
    try {
      if (savedFinishedMatches) {
        finishedMatchIds = Object.keys(JSON.parse(savedFinishedMatches));
        console.log("Matchs terminés à préserver:", finishedMatchIds);
      }
    } catch (e) {
      console.error("Erreur lors de l'analyse des matchs terminés sauvegardés:", e);
    }
    
    // Vérifier s'il y a un match spécifique à forcer comme terminé
    const matchIdToForce = urlParams.get('forceClear');
    const forcedStatus = urlParams.get('matchStatus');
    
    // Créer un ensemble de tous les matchs qui sont marqués comme terminés
    // pour les préserver pendant cette mise à jour d'interface
    const preserveTermineStatus = new Set();
    const preserveEnCoursStatus = new Set();
    
    // Ajouter tous les matchs qui sont déjà terminés à l'ensemble
    Object.entries(tournamentState.matches).forEach(([id, matchData]) => {
      if (matchData.status === 'terminé') {
        preserveTermineStatus.add(id);
      } else if (matchData.status === 'en_cours') {
        preserveEnCoursStatus.add(id);
      }
    });
    
    // Ajouter les matchs terminés sauvegardés
    if (finishedMatchIds.length > 0) {
      finishedMatchIds.forEach(id => preserveTermineStatus.add(id));
    }
    
    // Ajouter le match forcé
    if (matchIdToForce && forcedStatus === 'termine') {
      preserveTermineStatus.add(matchIdToForce);
    }
    
    console.log("Matchs dont le statut 'terminé' est préservé:", Array.from(preserveTermineStatus));
    console.log("Matchs dont le statut 'en_cours' est préservé:", Array.from(preserveEnCoursStatus));
    
    // MODIFICATION: Ne vérifier les matchs actifs que si nous ne sommes pas dans un état de réinitialisation
    const isResetting = window.isResettingTournament || false;
    
    // Vérifier s'il y a des matchs actifs dans le localStorage
    const activeMatches = new Set();
    if (!isResetting) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('liveMatchData_match')) {
          try {
            const matchId = key.replace('liveMatchData_match', '');
            const data = JSON.parse(localStorage.getItem(key));
            // Vérifier que les données sont valides et que le statut est bien 'en_cours'
            // Ne pas ajouter comme actif si le match est déjà marqué comme terminé
            if (data && data.status === 'en_cours' && !preserveTermineStatus.has(matchId)) {
              activeMatches.add(matchId);
              console.log(`Match actif détecté dans localStorage: ${matchId}`);
            }
          } catch (e) {
            console.warn(`Erreur lors de la lecture des données pour ${key}:`, e);
          }
        }
      }
    }
    
    // Mettre à jour les matchs dans l'interface
    Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
      const matchElement = document.querySelector(`.match[data-match-id="${matchId}"]`);
      if (!matchElement) return;
      
      // Préserver explicitement le statut 'terminé' pour les matchs concernés
      if (preserveTermineStatus.has(matchId)) {
        matchData.status = 'terminé';
        // Supprimer toute entrée liveMatchData pour ce match pour éviter des conflits
        localStorage.removeItem(`liveMatchData_match${matchId}`);
      } 
      // Ou préserver le statut 'en_cours' si applicable et non terminé
      else if (!isResetting && !preserveTermineStatus.has(matchId) && 
              (preserveEnCoursStatus.has(matchId) || activeMatches.has(matchId))) {
        matchData.status = 'en_cours';
      }
      
      // Mettre à jour les équipes
      const teams = matchElement.querySelectorAll('.team');
      if (teams.length >= 2) {
        // Équipe 1
        const team1Name = teams[0].querySelector('.team-name');
        const score1 = teams[0].querySelector('.score');
        if (team1Name && matchData.team1) {
          team1Name.textContent = matchData.team1;
        }
        if (score1 && matchData.score1 !== null) {
          score1.textContent = matchData.score1;
        }
        
        // Équipe 2
        const team2Name = teams[1].querySelector('.team-name');
        const score2 = teams[1].querySelector('.score');
        if (team2Name && matchData.team2) {
          team2Name.textContent = matchData.team2;
        }
        if (score2 && matchData.score2 !== null) {
          score2.textContent = matchData.score2;
        }
        
        // Appliquer les classes winner/loser si match terminé
        if (matchData.status === 'terminé') {    
          teams.forEach(team => team.classList.remove('winner', 'loser'));
          if (matchData.winner === matchData.team1) {
            teams[0].classList.add('winner');
            teams[1].classList.add('loser');
          } else if (matchData.winner === matchData.team2) {
            teams[0].classList.add('loser');
            teams[1].classList.add('winner');
          }
        }
      }

      // Vérifier si ce match doit être forcé à 'terminé'
      if ((preserveFinished && matchData.status === 'terminé') || 
          finishedMatchIds.includes(matchId) ||
          (matchId === matchIdToForce && forcedStatus === 'termine')) {
          matchData.status = 'terminé';
      }
      
      // Mettre à jour le statut du match
      const statusElement = matchElement.querySelector('.match-status');
      if (statusElement) {
        let statusText = matchData.status;
        if (statusText === 'à_venir') statusText = 'À venir';
        else if (statusText === 'en_cours') statusText = 'En cours';
        else if (statusText === 'terminé') statusText = 'Terminé';
        
        statusElement.textContent = statusText;
        matchElement.setAttribute('data-status', matchData.status);
        matchElement.classList.remove('à_venir', 'en_cours', 'terminé');
        matchElement.classList.add(matchData.status);
        
        // Appliquer les styles de statut appropriés
        statusElement.style.backgroundColor = '#f0f0f0';
        statusElement.style.color = '#666';
        
        if (matchData.status === 'en_cours') {
          statusElement.style.backgroundColor = '#fff3cd';
          statusElement.style.color = '#856404';
        } else if (matchData.status === 'terminé') {
          statusElement.style.backgroundColor = '#d4edda';
          statusElement.style.color = '#155724';
        }
      }
      
      // Mettre à jour également le type de match affiché si nécessaire
      const matchTypeElement = matchElement.querySelector('.match-type');
      if (matchTypeElement && matchData.matchType) {
        let displayMatchType = matchData.matchType;
        
        // Convertir les types de match en textes plus lisibles
        if (displayMatchType === 'barrage') displayMatchType = 'Barrage';
        else if (displayMatchType === 'quarterfinal') displayMatchType = 'Quart de finale';
        else if (displayMatchType === 'semifinal') displayMatchType = 'Demi-finale';
        else if (displayMatchType === 'smallfinal') displayMatchType = 'Place de 3ème';
        else if (displayMatchType === 'final') displayMatchType = 'Finale';
        else if (displayMatchType === 'classification_semifinal') displayMatchType = 'Demi-finale de classement';
        else if (displayMatchType === 'classification_final') displayMatchType = 'Place de 5ème';
        else if (displayMatchType === 'classification_smallfinal') displayMatchType = 'Place de 7ème';
        
        matchTypeElement.textContent = displayMatchType;
      }
    });

    // Mettre à jour le champion si disponible
    const championElement = document.getElementById('champion');
    if (championElement) {
      const finalMatch = tournamentState.matches[11]; // Match de la finale
      if (finalMatch && finalMatch.status === 'terminé' && finalMatch.winner) {
        championElement.textContent = finalMatch.winner;
        championElement.classList.add('champion-crowned');
      } else {
        championElement.textContent = 'À déterminer';
        championElement.classList.remove('champion-crowned');
      }
    }

    // Mettre à jour la cliquabilité des matchs
    updateMatchClickability();
    
    // Sauvegarder les modifications d'état
    saveTournamentState();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'interface:', error);
  } finally {
    // Réinitialiser le flag de réinitialisation si présent
    window.isResettingTournament = false;
  }
}

// Fonction mise à jour pour gérer la cliquabilité des matchs
function updateMatchClickability() {
    console.log("Mise à jour de la cliquabilité des matchs");
    
    // Configuration des dépendances entre matchs (IDs mis à jour)
    const matchDependencies = {
      // Quarts de finale dépendent des barrages
      '4': ['1'],  // QF2 dépend du barrage 1
      '6': ['2'],  // QF4 dépend du barrage 2
      
      // Demi-finales dépendent des quarts
      '9': ['3', '4'],  // SF1 dépend de QF1 et QF2
      '10': ['5', '6'],  // SF2 dépend de QF3 et QF4
      
      // Match de classement dépendent des quarts
      '7': ['3', '4'],  // Match classement 1 dépend des perdants de QF1 et QF2
      '8': ['5', '6'], // Match classement 2 dépend des perdants de QF3 et QF4
      
      // Finale dépend des demi-finales
      '14': ['9', '10'], // Finale dépend des deux demi-finales
      
      // Match 3ème place dépend des demi-finales
      '13': ['9', '10'], // Match 3ème place dépend des deux demi-finales
      
      // Matchs de classement 5-8
      '12': ['7', '8'], // Match 5ème place
      '11': ['7', '8']  // Match 7ème place
    };
  
    document.querySelectorAll('.match[data-match-id]').forEach(matchElement => {
      const matchId = matchElement.getAttribute('data-match-id');
      const matchData = tournamentState.matches[matchId];
      
      if (!matchData) {
        console.log(`Match ${matchId} introuvable dans la structure du tournoi`);
        return;
      }
      
      // En mode correction, tous les matchs sont cliquables
      if (correctionModeActive) {
        matchElement.style.cursor = 'pointer';
        matchElement.style.opacity = '1';
        matchElement.classList.remove('disabled');
        return;
      }
      
      // Si le match est déjà terminé, le rendre cliquable pour consultation/modification en mode correction
      if (matchData.status === 'terminé') {
        matchElement.style.cursor = 'pointer';
        matchElement.style.opacity = '1';
        matchElement.classList.remove('disabled');
        return;
      }
      
      // QF1 et QF3 sont toujours cliquables car ils ont des équipes pré-assignées
      if (matchId === '3' || matchId === '5') {
        matchElement.style.cursor = 'pointer';
        matchElement.style.opacity = '1';
        matchElement.classList.remove('disabled');
        return;
      }
      
      // Pour les autres matchs, vérifier les dépendances
      const dependencies = matchDependencies[matchId] || [];
      const allDependenciesResolved = dependencies.every(depId => {
        const depMatch = tournamentState.matches[depId];
        return depMatch && depMatch.status === 'terminé';
      });
      
      // Vérifier aussi que les équipes sont définies
      const teamsReady = matchData.team1 && matchData.team2;
      
      if (allDependenciesResolved && teamsReady) {
        matchElement.style.cursor = 'pointer';
        matchElement.style.opacity = '1';
        matchElement.classList.remove('disabled');
      } else {
        // Même si les dépendances ne sont pas résolues, on peut rendre le match consultable mais avec une apparence différente
        matchElement.style.cursor = 'not-allowed';
        matchElement.style.opacity = '0.6';
        matchElement.classList.add('disabled');
      }
    });
}

// Fonction pour gérer les clics sur les matchs
function addMatchClickHandlers() {
  const matches = document.querySelectorAll('.match[data-match-id]');
  
  matches.forEach(match => {
    match.addEventListener('click', function() {
      const matchId = this.getAttribute('data-match-id');
      console.log(`Clic sur le match ${matchId}, vérification de l'existence...`);
      console.log(`Matchs disponibles:`, Object.keys(tournamentState.matches));
      
      // Vérifier que matchData existe avant d'accéder à ses propriétés
      const matchData = tournamentState.matches[matchId];
      if (!matchData) {
        console.error(`Match ${matchId} non trouvé dans tournamentState`);
        
        // Réinitialiser le tournoi si des données sont manquantes
        if (confirm(`Erreur: Le match ${matchId} est manquant dans la structure du tournoi. Voulez-vous réinitialiser le tournoi?`)) {
          resetTournament();
        }
        return;
      }
      
      // Les matchs désactivés peuvent quand même être cliqués en mode correction
      if (this.classList.contains('disabled') && !correctionModeActive) {
        // Afficher un message plus informatif
        if (!matchData.team1 || !matchData.team2) {
          alert('Ce match n\'est pas encore disponible car les équipes n\'ont pas encore été déterminées.');
        } else {
          alert('Ce match n\'est pas encore disponible. Terminez d\'abord les matchs précédents.');
        }
        return;
      }
      
      // En mode correction ou si le match est à venir, on peut aller à la page de marquage
      if (correctionModeActive || matchData.status !== 'terminé') {
        // Naviguer vers la page de marquage pour saisir les scores
        navigateToScoring(matchId);
      } else {
        // Pour les matchs terminés, on affiche un dialogue avec les résultats
        const resultMessage = `${matchData.team1} ${matchData.score1} - ${matchData.score2} ${matchData.team2}\n\nVainqueur: ${matchData.winner}\n\nVoulez-vous modifier ce résultat?`;
        if (confirm(resultMessage)) {
          navigateToScoring(matchId);
        }
      }
    });
  });
}

// Fonction de navigation vers la page de marquage des scores
function navigateToScoring(matchId) {
  try {
    // Vérifier explicitement l'existence du match
    if (!tournamentState.matches[matchId]) {
      console.error(`Match ${matchId} non trouvé dans tournamentState lors de la navigation`);
      alert(`Erreur: Le match ${matchId} n'existe pas. Réinitialisez le tournoi depuis la page principale.`);
      return;
    }
    
    const matchData = tournamentState.matches[matchId];
    
    // Ajouter des logs de débogage
    console.log(`Tentative de navigation vers le match ${matchId}:`, matchData);
    
    // Construire les paramètres URL
    const params = new URLSearchParams();
    params.append('matchId', matchId);
    params.append('team1', matchData.team1 || '');
    params.append('team2', matchData.team2 || '');
    
    // Convertir le type de match pour un affichage plus lisible dans la table de marquage
    let displayMatchType = matchData.matchType || 'inconnu';
    
    // Laisser le type de match tel quel pour que la logique dans marquage.html puisse le convertir
    params.append('matchType', displayMatchType);
    
    params.append('score1', matchData.score1 !== null ? matchData.score1 : '');
    params.append('score2', matchData.score2 !== null ? matchData.score2 : '');
    params.append('correction', correctionModeActive ? 'true' : 'false');
    
    // Imprimer l'URL pour débogage
    const fullURL = `marquage.html?${params.toString()}`;
    console.log("URL de navigation:", fullURL);
    
    // Rediriger vers la page de marquage
    window.location.href = fullURL;
  } catch (error) {
    console.error('Erreur lors de la navigation:', error);
    alert('Une erreur est survenue lors de la navigation vers la page de marquage: ' + error.message);
  }
}

// Fonction pour simuler un match individuel
function simulateMatch(matchId) {
  const match = tournamentState.matches[matchId];
  if (!match || !match.team1 || !match.team2) return null;

  console.log(`Simulation du match ${matchId}: ${match.team1} vs ${match.team2}`);
  
  // Générer des scores aléatoires (1-21)
  let score1 = Math.floor(Math.random() * 21) + 1;
  let score2 = Math.floor(Math.random() * 21) + 1;
  
  // S'assurer qu'il n'y a pas d'égalité
  if (score1 === score2) {
    // Ajouter un point à l'une des équipes
    if (Math.random() > 0.5) {
      score1 += 1;
    } else {
      score2 += 1;
    }
  }
  
  // S'assurer qu'il y a au moins 2 points d'écart dans le badminton
  if (Math.abs(score1 - score2) < 2) {
    if (score1 > score2) {
      score1 = score2 + 2;
    } else {
      score2 = score1 + 2;
    }
  }
  
  // Mettre à jour le match
  match.score1 = score1;
  match.score2 = score2;
  match.status = 'terminé';
  
  // Déterminer le gagnant et le perdant
  if (score1 > score2) {
    match.winner = match.team1;
    match.loser = match.team2;
  } else if (score2 > score1) {
    match.winner = match.team2;
    match.loser = match.team1;
  } else {
    // En cas d'égalité (ne devrait pas arriver avec nos vérifications)
    console.error(`Égalité impossible dans le match ${matchId}: ${score1}-${score2}`);
    // Par défaut, l'équipe 1 gagne
    match.winner = match.team1;
    match.loser = match.team2;
    // Ajuster le score pour éviter l'égalité
    match.score1 += 2;
  }
  
  console.log(`Résultat: ${match.team1} ${score1} - ${score2} ${match.team2}, Gagnant: ${match.winner}`);
  
  // Envoyer au serveur via WebSocket
  try {
    if (socket && socketConnected) {
      socket.emit('update_match', {
        matchId,
        team1: match.team1,
        team2: match.team2,
        score1: match.score1,
        score2: match.score2,
        status: 'terminé',
        winner: match.winner,
        loser: match.loser,
        id_tournois: 5
      });
    }
  } catch (e) {
    console.error("Erreur lors de l'envoi du résultat au serveur:", e);
  }
  
  return match.winner;
}

// Fonction pour simuler l'ensemble du tournoi
async function simulateTournament() {
  try {
    console.log("Début de la simulation du tournoi de badminton");
    
    // 1. Simuler les barrages
    await simulateMatch('1');
    await simulateMatch('2');
    
    // Mettre à jour les quarts de finale avec les gagnants des barrages
    const gagnantBarrage1 = tournamentState.matches['1'].winner;
    const gagnantBarrage2 = tournamentState.matches['2'].winner;
    
    tournamentState.matches['4'].team2 = gagnantBarrage1;
    tournamentState.matches['6'].team2 = gagnantBarrage2;
    
    // Mettre à jour l'interface
    updateUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 2. Simuler les quarts de finale
    await simulateMatch('3');
    await simulateMatch('4');
    await simulateMatch('5');
    await simulateMatch('6');
    
    // Propager les résultats vers les demi-finales
    linkWinnersAndLosers();
    updateUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 3. Simuler les demi-finales et de classement
    await simulateMatch('7');
    await simulateMatch('8');
    await simulateMatch('9');
    await simulateMatch('10');
    
    // Propager les résultats
    linkWinnersAndLosers();
    updateUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Simuler les finales et matchs de classement
    await simulateMatch('11');
    await simulateMatch('12');
    await simulateMatch('13');
    await simulateMatch('14');
    
    // Mise à jour finale
    updateUI();
    
    // Sauvegarder l'état du tournoi
    saveTournamentState();
    
    // Mettre à jour le classement final
    updateRankingDisplay();
    
    console.log("Simulation du tournoi terminée");
    
    // Passer à l'onglet des résultats finaux
    const phaseSelect = document.getElementById('phaseSelect');
    if (phaseSelect) {
      phaseSelect.value = 'ranking-phase';
      phaseSelect.dispatchEvent(new Event('change'));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la simulation du tournoi:', error);
    alert('Une erreur est survenue lors de la simulation du tournoi.');
    return false;
  }
}

// Nouvelle fonction pour vérifier la cohérence entre HTML et tournamentState
function checkMatchConsistency() {
  console.log('Vérification de la cohérence des matchs...');
  const matchElements = document.querySelectorAll('.match[data-match-id]');
  const htmlMatchIds = Array.from(matchElements).map(el => el.getAttribute('data-match-id'));
  const stateMatchIds = Object.keys(tournamentState.matches);
  
  console.log('Matchs HTML:', htmlMatchIds);
  console.log('Matchs État:', stateMatchIds);
  
  htmlMatchIds.forEach(id => {
    if (!stateMatchIds.includes(id)) {
      console.warn(`Match ID ${id} présent dans le HTML mais pas dans l'état`);
    }
  });
}

// Nouvelle fonction pour réinitialiser avec l'état par défaut
function resetTournamentToDefault() {
  console.log("Réinitialisation du tournoi avec l'état par défaut");
  
  // Indiquer que nous sommes en train de réinitialiser pour empêcher la détection de matchs actifs
  window.isResettingTournament = true;
  
  // Supprimer les données locales
  localStorage.removeItem('badmintonTournamentState');
  localStorage.removeItem('badmintonPoints');
  localStorage.removeItem('lastUpdateBadminton');
  
  // Supprimer toutes les données de matchs en cours
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('liveMatchData_match') || 
                key.startsWith('liveMatchData_badminton_') ||
                key === 'liveMatchData' ||
                key === 'badminton_finishedMatches')) {
      localStorage.removeItem(key);
      i--;
    }
  }
  
  // S'assurer que tous les matchs sont correctement définis
  saveTournamentState();
  
  console.log("Tournoi réinitialisé avec succès");
}

// Ajouter une fonction pour identifier explicitement un match comme terminé
function markMatchAsFinished(matchId) {
  if (tournamentState.matches[matchId]) {
    tournamentState.matches[matchId].status = 'terminé';
    console.log(`Match ${matchId} marqué explicitement comme terminé`);
    
    // Ajouter à la liste des matchs terminés pour sauvegarde
    const finishedMatches = JSON.parse(localStorage.getItem('badminton_finishedMatches') || '{}');
    finishedMatches[matchId] = true;
    localStorage.setItem('badminton_finishedMatches', JSON.stringify(finishedMatches));
    
    // Enregistrer immédiatement l'état mis à jour
    saveTournamentState();
    
    return true;
  }
  return false;
}