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
// La structure est définie par matchId avec les informations de chaque rencontre.
// Certains matchs possèdent des références (nextMatchWin, nextMatchLose) vers le match suivant.
let tournamentState = {
  matches: {
    // Qualifications (matchIds 1 à 3) : les perdants reçoivent 5 points (9ème)
    1: {
      matchType: 'qualification',
      team1: 'FMMS',
      team2: 'ESPAS-ESTICE',
      score1: 25,
      score2: 12,
      status: 'terminé',
      winner: 'FMMS',
      loser: 'ESPAS-ESTICE'
    },
    2: {
      matchType: 'qualification', 
      team1: 'FLD',
      team2: 'PIKTURA',
      score1: 25,
      score2: 20,
      status: 'terminé',
      winner: 'FLD',
      loser: 'PIKTURA'
    },
    3: {
      matchType: 'qualification',
      team1: 'FLSH',
      team2: 'IKPO',
      score1: 25,
      score2: 14,
      status: 'terminé', 
      winner: 'FLSH',
      loser: 'IKPO'
    },
    // Quarts de finale (matchIds 4 à 7)
    4: {  // QF1
      matchType: 'quarterfinal',
      team1: 'FMMS',
      team2: 'FGES',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8  // Le gagnant va en SF1
    },
    5: {  // QF2
      matchType: 'quarterfinal', 
      team1: 'FLD',
      team2: 'JUNIA',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8  // Le gagnant va en SF1
    },
    6: {  // QF3
      matchType: 'quarterfinal',
      team1: 'FLSH',
      team2: 'IESEG',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9  // Le gagnant va en SF2
    },
    7: {  // QF4
      matchType: 'quarterfinal',
      team1: 'ICAM',
      team2: 'ESPOL',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9  // Le gagnant va en SF2
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
      nextMatchLose: 10  // Perdant va en petite finale
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
      nextMatchLose: 10  // Perdant va en petite finale
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
      loser: null
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
      loser: null
    }
  }
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
    localStorage.setItem('volleyHTournamentState', JSON.stringify(tournamentState));
    localStorage.setItem('lastUpdate', new Date().toISOString());
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
    const savedState = localStorage.getItem('volleyHTournamentState');
    if (savedState) {
        tournamentState = JSON.parse(savedState);
        return true;
    }
    return false;
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
  // Ajouter un indicateur de synchronisation dans l'interface
  addSyncIndicator();
  
  // Initialiser la connexion WebSocket
  initWebSocket();
  
  // Charger d'abord depuis le serveur, puis utiliser le local storage comme fallback
  initFromServer().then(success => {
    if (!success && loadTournamentState()) {
      console.log('État précédent du tournoi chargé depuis le localStorage');
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
        console.log('Chargement initial des données depuis le serveur...');
        const response = await fetch('/api/matches/volleyballH');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        if (data.matches && Array.isArray(data.matches)) {
            // D'abord essayer de charger depuis localStorage comme fallback immédiat
            const localData = localStorage.getItem('volleyHTournamentState');
            if (localData) {
                console.log('Données trouvées dans le localStorage, utilisées comme fallback initial');
                // Charger les données locales au cas où le serveur échoue
                tournamentState = JSON.parse(localData);
            }
            
            // Essayer jusqu'à 3 fois avec délai entre les tentatives
            let attempts = 0;
            let success = false;
            
            while (attempts < 3 && !success) {
                try {
                    console.log(`Tentative ${attempts + 1}/3 de connexion au serveur...`);
                    const response = await fetch('/api/matches/volleyball');
                    
                    console.log('Réponse brute du serveur:', response);
                    
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('Données reçues du serveur:', data);
                    
                    // Vérifier si les données contiennent au moins un match valide
                    if (data && data.matches && Array.isArray(data.matches)) {
                        // On reconstitue l'état du tournoi à partir des données du serveur
                        const serverMatches = {};
                        let matchCount = 0;
                        
                        // Si aucun match n'est retourné, on conserve l'état local
                        if (data.matches.length === 0) {
                            console.log('Aucun match retourné par le serveur, conservation de l\'état local');
                            updateSyncIndicator('success', 'État local conservé (aucun match sur le serveur)');
                            return true; // Considérer comme un succès car c'est une situation normale
                        }
                        
                        data.matches.forEach(match => {
                            if (match && match.id_match) {
                                const matchId = match.id_match.toString();
                                matchCount++;
                                
                                // Conserver la structure existante du match si elle existe
                                const existingMatch = tournamentState.matches[matchId] || {};
                                
                                // Fusionner les données avec des valeurs par défaut sécurisées
                                serverMatches[matchId] = {
                                    ...existingMatch,
                                    matchType: match.match_type || existingMatch.matchType || 'qualification',
                                    team1: match.team1 || existingMatch.team1 || null,
                                    team2: match.team2 || existingMatch.team2 || null,
                                    score1: match.score_equipe1 !== undefined ? match.score_equipe1 : (existingMatch.score1 || 0),
                                    score2: match.score_equipe2 !== undefined ? match.score_equipe2 : (existingMatch.score2 || 0),
                                    status: match.status || existingMatch.status || 'à_venir',
                                    winner: match.winner || existingMatch.winner || null,
                                    loser: match.loser || existingMatch.loser || null,
                                    nextMatchWin: existingMatch.nextMatchWin || null,
                                    nextMatchLose: existingMatch.nextMatchLose || null
                                };
                            }
                        });
                        
                        // Si au moins un match valide a été trouvé, mettre à jour l'état
                        if (matchCount > 0) {
                            console.log(`${matchCount} matchs valides trouvés dans les données du serveur`);
                            
                            // Pour les matchs qui n'existent pas sur le serveur mais qui sont définis dans notre structure par défaut
                            Object.keys(tournamentState.matches).forEach(matchId => {
                                if (!serverMatches[matchId]) {
                                    console.log(`Match ${matchId} non trouvé sur le serveur, utilisation de la structure par défaut`);
                                    serverMatches[matchId] = tournamentState.matches[matchId];
                                }
                            });
                            
                            // Mettre à jour l'état du tournoi
                            tournamentState.matches = serverMatches;
                            
                            // Sauvegarder en localStorage pour les chargements futurs
                            saveTournamentState();
                            
                            console.log(`État du tournoi mis à jour depuis le serveur (${matchCount} matchs)`);
                            updateSyncIndicator('success', `${matchCount} matchs chargés pour le tournoi masculin`);
                            success = true;
                        } else {
                            console.warn('Aucun match valide trouvé dans les données du serveur');
                            // Au lieu d'échouer, utiliser les données locales par défaut si présentes
                            if (localData) {
                                console.log('Utilisation des données locales par défaut');
                                success = true; // Considérer comme un succès
                                updateSyncIndicator('success', 'État local utilisé (aucun match valide sur le serveur)');
                            } else {
                                throw new Error('Aucun match valide dans les données');
                            }
                        }
                    } else {
                        console.warn('Format de données incorrect depuis le serveur:', data);
                        // Utiliser la structure locale par défaut si présente
                        if (localData) {
                            console.log('Utilisation des données locales en raison d\'un format de données incorrect');
                            success = true;
                            updateSyncIndicator('success', 'État local utilisé (format incorrect des données serveur)');
                        } else {
                            throw new Error('Format de données incorrect');
                        }
                    }
                } catch (error) {
                    attempts++;
                    console.warn(`Tentative ${attempts}/3 échouée: ${error.message}`, error);
                    if (attempts < 3) {
                        // Attendre de plus en plus longtemps entre les tentatives
                        await new Promise(r => setTimeout(r, attempts * 1000));
                    }
                }
            }
            
            // Si toutes les tentatives ont échoué mais que nous avons chargé les données locales au début
            if (!success && localData) {
                console.log('Utilisation des données locales après échec des tentatives serveur');
                updateSyncIndicator('error', 'Serveur inaccessible - données locales utilisées');
                return true;
            }
            
            if (!success && !localData) {
                updateSyncIndicator('error', 'Impossible de charger les données du tournoi');
                console.error('Impossible de charger les données du tournoi après 3 tentatives');
                return false;
            }
            
            return true;
            
        } else {
            updateSyncIndicator('error', 'Aucun match disponible pour le tournoi masculin');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation depuis le serveur:', error);
        updateSyncIndicator('error', 'Erreur serveur - données locales utilisées');
        return loadTournamentState();
    }
    return true;
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
        const response = await fetch('/api/matches/volleyballH');
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
                
                updateSyncIndicator('success', `${updatedCount} match(es) mis à jour pour le tournoi masculin`);
            } else {
                updateSyncIndicator('success', 'Aucun changement pour le tournoi masculin');
            }
        } else {
            updateSyncIndicator('success', 'Aucun changement pour le tournoi masculin');
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation avec le serveur:', error);
        updateSyncIndicator('error', 'Erreur de synchronisation pour le tournoi masculin');
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
        if (data.id_tournois === 4) { // Pour le tournoi de volleyball hommes
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
        matchType: match.match_type || existingMatch.matchType || 'qualification',
        team1: match.team1 || existingMatch.team1 || null,
        team2: match.team2 || existingMatch.team2 || null,
        score1: match.score_equipe1 !== undefined ? match.score_equipe1 : (existingMatch.score1 || 0),
        score2: match.score_equipe2 !== undefined ? match.score_equipe2 : (existingMatch.score2 || 0),
        status: match.status || existingMatch.status || 'à_venir',
        winner: match.winner || existingMatch.winner || null,
        loser: match.loser || existingMatch.loser || null,
        nextMatchWin: existingMatch.nextMatchWin || null,
        nextMatchLose: existingMatch.nextMatchLose || null
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
        return new Promise((resolve, reject) => {
            socket.emit('update_match', {
                matchId,
                team1: matchData.team1,
                team2: matchData.team2,
                score1: matchData.score1,
                score2: matchData.score2,
                status: matchData.status,
                winner: matchData.winner,
                loser: matchData.loser,
                matchType: matchData.matchType
            });
            
            // Définir un délai de 5 secondes pour la réponse
            const timeoutId = setTimeout(() => {
                socket.off('update_match_success');
                socket.off('update_match_error');
                reject(new Error('Délai d\'attente dépassé pour la mise à jour WebSocket'));
            }, 5000);
            
            socket.once('update_match_success', (response) => {
                clearTimeout(timeoutId);
                resolve(response);
            });
            
            socket.once('update_match_error', (error) => {
                clearTimeout(timeoutId);
                reject(new Error(error.message || 'Erreur lors de la mise à jour WebSocket'));
            });
        });
    }
    
    // Sinon, utiliser HTTP comme avant
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
            id_tournois: 4 // ID du tournoi de volleyball hommes
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
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
            
            // Important: Ne pas modifier le statut du match suivant
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
    // Mettre à jour l'affichage de tous les matchs
    Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
        const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
        if (!matchElement) return;
        
        const teamDivs = matchElement.querySelectorAll('.team');
        if (teamDivs.length < 2) return;
        
        fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
        fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
        
        // Mettre à jour l'état du match et l'heure
        const statusElement = matchElement.querySelector('.match-status');
        const timeElement = matchElement.querySelector('.match-time');
        
        // Déboguer pour voir les valeurs exactes
        console.log(`Match ${matchId} - status: "${matchData.status}"`);
        
        if (statusElement) {
            // Normaliser l'affichage du statut
            let displayStatus;
            switch(matchData.status) {
                case 'à_venir':
                case 'a_venir':
                    displayStatus = 'à venir';
                    break;
                case 'en_cours':
                case 'en cours':
                    displayStatus = 'en cours';
                    break;
                case 'terminé':
                case 'termine':
                    displayStatus = 'terminé';
                    break;
                default:
                    displayStatus = matchData.status || 'à venir';
            }
            statusElement.textContent = displayStatus;
        }
        
        // Mettre à jour la classe CSS du statut du match
        matchElement.classList.remove('a_venir', 'en_cours', 'termine', 'à_venir', 'terminé');
        
        // Normaliser également les classes CSS
        let cssClass;
        switch(matchData.status) {
            case 'en_cours':
            case 'en cours':
                cssClass = 'en_cours';
                break;
            case 'terminé':
            case 'termine':
                cssClass = 'termine';
                break;
            default:
                cssClass = 'a_venir';
        }
        matchElement.classList.add(cssClass);
        
        // Définir également l'attribut data-status pour ciblage CSS
        matchElement.setAttribute('data-status', matchData.status);
        
        // Définir l'heure selon le type de match
        if (timeElement) {
            let matchTime;
            switch(matchData.matchType) {
                case 'qualification':
                    matchTime = '04/02';
                    break;
                case 'quarterfinal':
                    matchTime = matchId <= 5 ? '9:00' : '10:00';
                    break;
                case 'semifinal':
                    matchTime = '11:00';
                    break;
                case 'smallfinal':
                    matchTime = '12:00';
                    break;
                case 'final':
                    matchTime = '12:00';
                    break;
                default:
                    matchTime = '-';
            }
            timeElement.textContent = matchTime;
        }
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
    
    // Envoyer les données au serveur immédiatement
    try {
        updateSyncIndicator('syncing', 'Sauvegarde du match...');
        await sendMatchResultToServer(matchId, match);
        updateSyncIndicator('success', 'Match sauvegardé sur le serveur');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du match sur le serveur:', error);
        updateSyncIndicator('error', 'Échec de la sauvegarde');
    }
    
    // Mettre à jour la progression du tournoi
    await linkWinnersAndLosers();
    await updateUI();
    
    saveTournamentState();
}

// Remplacer la fonction sendMatchResultToServer pour utiliser WebSocket quand disponible
async function sendMatchResultToServer(matchId, matchData) {
    console.log(`Envoi des résultats du match ${matchId} au serveur:`, matchData);
    
    // Si WebSocket est disponible et connecté, utiliser WebSocket
    if (socket && socketConnected) {
        return new Promise((resolve, reject) => {
            socket.emit('update_match', {
                matchId,
                team1: matchData.team1,
                team2: matchData.team2,
                score1: matchData.score1,
                score2: matchData.score2,
                status: matchData.status,
                winner: matchData.winner,
                loser: matchData.loser,
                matchType: matchData.matchType
            });
            
            // Définir un délai de 5 secondes pour la réponse
            const timeoutId = setTimeout(() => {
                socket.off('update_match_success');
                socket.off('update_match_error');
                reject(new Error('Délai d\'attente dépassé pour la mise à jour WebSocket'));
            }, 5000);
            
            socket.once('update_match_success', (response) => {
                clearTimeout(timeoutId);
                resolve(response);
            });
            
            socket.once('update_match_error', (error) => {
                clearTimeout(timeoutId);
                reject(new Error(error.message || 'Erreur lors de la mise à jour WebSocket'));
            });
        });
    }
    
    // Sinon, utiliser HTTP comme avant
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
            id_tournois: 4 // ID du tournoi de volleyball hommes
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
}

// ----- SIMULATION DE LA COMPÉTITION -----
async function simulateTournament() {
    // Trier les IDs de match pour les simuler dans l'ordre
    const ids = Object.keys(tournamentState.matches)
                     .map(x => parseInt(x))
                     .sort((a, b) => a - b);
    
    updateSyncIndicator('syncing', 'Simulation du tournoi...');
    
    try {
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
        updateSyncIndicator('success', 'Tournoi simulé avec succès');
        
        // Forcer une resynchronisation complète avec le serveur
        await syncWithServer(true);
        
        alert('Simulation terminée !');
    } catch (error) {
        console.error('Erreur lors de la simulation du tournoi:', error);
        updateSyncIndicator('error', 'Erreur: ' + error.message);
    }
}

// ----- CALCUL DU CLASSEMENT FINAL -----
function calculateRankings() {
    let ranking = allTeams.map(name => ({ 
        name,
        pointsH: 0,    // Points tournoi masculin
        pointsF: 0,    // Points tournoi féminin
        totalPoints: 0, // Total des points
        position: null,
        finalPhase: null
    }));
    
    // Déterminer les perdants des qualifications (9ème place)
    for (let i = 1; i <= 3; i++) {
        const match = tournamentState.matches[i];
        if (match.status === 'terminé' && match.loser) {
            const loserTeam = ranking.find(r => r.name === match.loser);
            if (loserTeam) {
                loserTeam.pointsH = positionPoints[9];
            }
        }
    }
    
    // Déterminer les perdants des quarts de finale (5ème place)
    for (let i = 4; i <= 7; i++) {
        const match = tournamentState.matches[i];
        if (match.status === 'terminé' && match.loser) {
            const loserTeam = ranking.find(r => r.name === match.loser);
            if (loserTeam) {
                loserTeam.pointsH = positionPoints[5];
            }
        }
    }
    
    // Déterminer les 3ème et 4ème places
    const smallFinal = tournamentState.matches[10];
    if (smallFinal.status === 'terminé' && smallFinal.winner && smallFinal.loser) {
        const winnerTeam = ranking.find(r => r.name === smallFinal.winner);
        const loserTeam = ranking.find(r => r.name === smallFinal.loser);
        
        if (winnerTeam) winnerTeam.pointsH = positionPoints[3];
        if (loserTeam) loserTeam.pointsH = positionPoints[4];
    }
    
    // Déterminer les 1ère et 2ème places
    const final = tournamentState.matches[11];
    if (final.status === 'terminé' && final.winner && final.loser) {
        const winnerTeam = ranking.find(r => r.name === final.winner);
        const loserTeam = ranking.find(r => r.name === final.loser);
        
        if (winnerTeam) winnerTeam.pointsH = positionPoints[1];
        if (loserTeam) loserTeam.pointsH = positionPoints[2];
    }
    
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
        
        await sendPointsToServer(teamPoints);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du classement:', error);
    }
}

// Fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
    try {
        console.log('Points à envoyer:', teamPoints);
        // Temporairement désactivé jusqu'à ce que l'API soit prête
        return { success: true, message: 'API simulation' };
        /* À décommenter quand l'API sera prête
        const response = await fetch('/api/rankings/volley_h/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teamPoints)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);nt() {
        }seront remis à zéro.')) {

        const result = await response.json();
        return result;
        */
    } catch (error) {
        console.log('Points non envoyés - API non disponible:', error);
        return { success: true, message: 'API simulation' };
    }
}

// ----- RÉINITIALISATION DU TOURNOI -----
async function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Tous les matchs sauf les qualifications seront remis à zéro.')) {
        return;
    }
    
    try {
        updateSyncIndicator('syncing', 'Réinitialisation des matchs en cours...');
        
        // Si WebSocket est disponible, utilisons-le
        if (socket && socketConnected) {
            return new Promise((resolve, reject) => {
                socket.emit('reset_tournament_except_qualif', { id_tournois: 4 });
                
                const timeoutId = setTimeout(() => {
                    socket.off('reset_success');
                    socket.off('reset_error');
                    reject(new Error('Délai d\'attente dépassé pour la réinitialisation WebSocket'));
                }, 5000);
                
                socket.once('reset_success', () => {
                    clearTimeout(timeoutId);
                    
                    // Conserver uniquement les matchs de qualification dans la structure locale
                    const qualifMatches = {};
                    for (let i = 1; i <= 3; i++) {
                        qualifMatches[i] = tournamentState.matches[i];
                    }
                    
                    // Réinitialiser les autres matchs (4 à 11)
                    for (let i = 4; i <= 11; i++) {
                        const matchType = i <= 7 ? 'quarterfinal' : 
                                        i <= 9 ? 'semifinal' : 
                                        i === 10 ? 'smallfinal' : 'final';
                        
                        qualifMatches[i] = {
                            ...tournamentState.matches[i],
                            score1: null,
                            score2: null,
                            status: 'à_venir',
                            winner: null,
                            loser: null,
                            matchType: matchType
                        };
                        
                        // Conserver les informations des équipes pour QF seulement
                        if (i > 7) {
                            qualifMatches[i].team1 = null;
                            qualifMatches[i].team2 = null;
                        }
                    }
                    
                    tournamentState.matches = qualifMatches;
                    saveTournamentState();
                    updateUI();
                    updateSyncIndicator('success', 'Tournoi réinitialisé avec succès');
                    
                    // Recharger la page après une courte pause
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    
                    resolve();
                });
                
                socket.once('reset_error', (error) => {
                    clearTimeout(timeoutId);
                    updateSyncIndicator('error', `Erreur de réinitialisation: ${error.message}`);
                    reject(error);
                });
            });
        } else {
            // Utiliser HTTP comme fallback
            const response = await fetch('/api/tournois/reset-except-qualif', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_tournois: 4 // ID du tournoi de volleyball hommes
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Conserver uniquement les matchs de qualification dans la structure locale
                const qualifMatches = {};
                for (let i = 1; i <= 3; i++) {
                    qualifMatches[i] = tournamentState.matches[i];
                }
                
                // Réinitialiser les autres matchs (4 à 11)
                for (let i = 4; i <= 11; i++) {
                    const matchType = i <= 7 ? 'quarterfinal' : 
                                    i <= 9 ? 'semifinal' : 
                                    i === 10 ? 'smallfinal' : 'final';
                    
                    qualifMatches[i] = {
                        ...tournamentState.matches[i],
                        score1: null,
                        score2: null,
                        status: 'à_venir',
                        winner: null,
                        loser: null,
                        matchType: matchType
                    };
                    
                    // Conserver les informations des équipes pour QF seulement
                    if (i > 7) {
                        qualifMatches[i].team1 = null;
                        qualifMatches[i].team2 = null;
                    }
                }
                
                tournamentState.matches = qualifMatches;
                saveTournamentState();
                updateUI();
                updateSyncIndicator('success', 'Tournoi réinitialisé avec succès');
                
                // Effacer les données du localStorage et recharger la page
                localStorage.removeItem('lastUpdate');
                
                // Recharger la page après une courte pause
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(result.message || 'Erreur inconnue lors de la réinitialisation');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du tournoi:', error);
        updateSyncIndicator('error', `Erreur: ${error.message}`);
        alert(`Échec de la réinitialisation: ${error.message}`);
    }
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
    // Qualifications - toujours jouables
    if (matchData.matchType === 'qualification') {
        return true;
    }
    
    // Quarts de finale - vérifier que les qualifications sont terminées
    if (matchData.matchType === 'quarterfinal') {
        const qualificationMatches = [1, 2, 3];
        if (!areMatchesCompleted(qualificationMatches)) {
            alert('Les qualifications doivent être terminées avant de jouer les quarts de finale.');
            return false;
        }
        
        // Vérifier que les équipes sont définies
        if (!matchData.team1 || !matchData.team2) {
            alert('Les équipes ne sont pas encore déterminées pour ce match.');
            return false;
        }
    }
    
    // Demi-finales - vérifier que les quarts sont terminés
    if (matchData.matchType === 'semifinal') {
        const quarterFinals = [4, 5, 6, 7];
        if (!areMatchesCompleted(quarterFinals)) {
            alert('Les quarts de finale doivent être terminées avant de jouer les demi-finales.');
            return false;
        }
        
        // Vérifier que les équipes sont définies
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
        
        // Vérifier que les équipes sont définies
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
        
        console.log('Redirection vers marquage.html avec params:', Object.fromEntries(params));
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
    
    const params = new URLSearchParams({
        matchId: matchId,
        team1: matchData.team1,
        team2: matchData.team2,
        matchType: matchData.matchType
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

        // Mise à jour des matchs suivants sans changer leur statut
        if (matchId >= 4 && matchId <= 7) { // Quarts de finale
            const semifinalId = matchId <= 5 ? 8 : 9; // QF1&2 -> SF1, QF3&4 -> SF2
            const semifinal = tournamentState.matches[semifinalId];
            
            // Mise à jour des équipes uniquement, pas du statut
            if (!semifinal.team1) {
                semifinal.team1 = winner;
            } else if (!semifinal.team2 && semifinal.team1 !== winner) {
                semifinal.team2 = winner;
            }
            
            // S'assurer que le statut reste "à_venir" sauf s'il est déjà "terminé"
            if (semifinal.status !== 'terminé') {
                semifinal.status = 'à_venir';
            }
        }

        // Gérer la progression vers la finale et petite finale
        if (matchId === 8 || matchId === 9) { // Demi-finales
            const final = tournamentState.matches[11];
            const smallFinal = tournamentState.matches[10];
            
            // Mise à jour des équipes uniquement, pas des statuts
            if (matchId === 8) {
                if (!final.team1) final.team1 = winner;
                if (!smallFinal.team1) smallFinal.team1 = loser;
            } else {
                if (!final.team2) final.team2 = winner;
                if (!smallFinal.team2) smallFinal.team2 = loser;
            }
            
            // S'assurer que les statuts restent "à_venir" sauf s'ils sont déjà "terminé"
            if (final.status !== 'terminé') final.status = 'à_venir';
            if (smallFinal.status !== 'terminé') smallFinal.status = 'à_venir';
        }

        // Envoyer les résultats au serveur
        sendMatchResultToServer(matchId, tournamentState.matches[matchId])
            .then(() => {
                console.log(`Match ${matchId} terminé et sauvegardé sur le serveur`);
                saveTournamentState();
                window.location.href = 'volleyball.html#final-phase';
            })
            .catch(error => {
                console.error('Erreur lors de la sauvegarde du match:', error);
                alert(`Erreur lors de la sauvegarde: ${error.message}`);
                // Continuer la redirection même en cas d'erreur pour ne pas bloquer l'utilisateur
                saveTournamentState();
                window.location.href = 'volleyball.html#final-phase';
            });
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