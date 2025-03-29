/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/


// Fonction pour mettre à jour le classement final
function updateRankingDisplay() {
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  
  // Vider la liste actuelle
  rankingList.innerHTML = '';
  
  // Obtenir le classement final basé sur les résultats des matchs
  const finalRanking = calculateFinalRanking();
  
  // Remplir avec les nouvelles données
  finalRanking.forEach((team, index) => {
    const position = index + 1;
    const rankRow = document.createElement('div');
    rankRow.className = 'ranking-row';
    
    // Calculer les points selon la position
    const points = position <= 8 ? positionPoints[position] || 0 : 0;
    
    rankRow.innerHTML = `
      <div class="rank">${position}</div>
      <div class="teamname">${team}</div>
      <div class="points">${points}</div>
    `;
    rankingList.appendChild(rankRow);
  });
}

// Calculer le classement final
function calculateFinalRanking() {
  // Tableau pour stocker le classement
  const ranking = new Array(8).fill(null);
  
  // Vérifier que les matchs existent avant d'y accéder
  if (!tournamentState.matches) {
    console.error("tournamentState.matches est undefined");
    return [];
  }
  
  // Remplir les positions connues à partir des matchs finaux
  const finalMatch = tournamentState.matches[36];  // Match pour la 1ère place
  const bronzeMatch = tournamentState.matches[35]; // Match pour la 3ème place
  const fifthMatch = tournamentState.matches[31];  // Match pour la 5ème place
  const seventhMatch = tournamentState.matches[32]; // Match pour la 7ème place
  
  // Positions 1 et 2
  if (finalMatch && finalMatch.status === 'terminé') {
    ranking[0] = finalMatch.winner;
    ranking[1] = finalMatch.loser;
  }
  
  // Positions 3 et 4
  if (bronzeMatch && bronzeMatch.status === 'terminé') {
    ranking[2] = bronzeMatch.winner;
    ranking[3] = bronzeMatch.loser;
  }
  
  // Positions 5 et 6
  if (fifthMatch && fifthMatch.status === 'terminé') {
    ranking[4] = fifthMatch.winner;
    ranking[5] = fifthMatch.loser;
  }
  
  // Positions 7 et 8
  if (seventhMatch && seventhMatch.status === 'terminé') {
    ranking[6] = seventhMatch.winner;
    ranking[7] = seventhMatch.loser;
  }
  
  // Si le tournoi n'est pas encore terminé, compléter avec le classement de poule
  const missingPositions = ranking.some(pos => pos === null);
  if (missingPositions) {
    const stats = calculateGroupStats();
    const sortedTeams = Object.values(stats).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      const diffA = a.goalsFor - a.goalsAgainst;
      const diffB = b.goalsFor - b.goalsAgainst;
      return diffB - diffA;
    });
    
    // Compléter les positions manquantes avec le classement de poule
    for (let i = 0; i < ranking.length; i++) {
      if (ranking[i] === null && sortedTeams[i]) {
        ranking[i] = sortedTeams[i].team;
      }
    }
  }
  
  // Filtrer les positions nulles
  return ranking.filter(team => team !== null);
}

// Points attribués selon les positions
const positionPoints = {
  1: 25, // Champion
  2: 20, // Finaliste
  3: 18, // 3ème place
  4: 15, // 4ème place
  5: 12, // 5ème place
  6: 10, // 6ème place
  7: 8,  // 7ème place
  8: 6   // 8ème place
}; 

//Liste des équipes pour la poule unique
const pouleTeams = [
  "FMMS", 
  "FLSH", 
  "FGES", 
  "FLD", 
  "ESPAS-ESTICE", 
  "IKPO", 
  "USCHOOL", 
  "PIKTURA"
];

// Fonction helper pour trier les équipes selon leur classement
function sortTeams(a, b) {
  if (a.points !== b.points) return b.points - a.points;
  const diffA = a.goalsFor - a.goalsAgainst;
  const diffB = b.goalsFor - b.goalsAgainst;
  return diffB - diffA;
}

// Terrains disponibles
const terrains = {
  'Cible 1': 2,
  'Cible 2': 3,
  'Cible 3': 4,
  'Cible 4': 5
};

// ----- STRUCTURE DU TOURNOI -----
let tournamentState = {
  // Définition directe des matchs sans getter/setter
  _matches: {
    // Poule A (matchIds 1 à 16)
    1: { matchType: 'poule', team1: 'ESPAS-ESTICE', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 1', terrainId: 2 },
    2: { matchType: 'poule', team1: 'IKPO', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 2', terrainId: 3 },
    3: { matchType: 'poule', team1: 'FLD', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 3', terrainId: 4 },
    4: { matchType: 'poule', team1: 'USCHOOL', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 4', terrainId: 5 },
    5: { matchType: 'poule', team1: 'ESPAS-ESTICE', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 1', terrainId: 2 },
    6: { matchType: 'poule', team1: 'FLSH', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 2', terrainId: 3 },
    7: { matchType: 'poule', team1: 'IKPO', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 3', terrainId: 4 },
    8: { matchType: 'poule', team1: 'FLD', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 4', terrainId: 5 },
    9: { matchType: 'poule', team1: 'ESPAS-ESTICE', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 1', terrainId: 2 },
    10: { matchType: 'poule', team1: 'FMMS', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 2', terrainId: 3 },
    11: { matchType: 'poule', team1: 'FLSH', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 3', terrainId: 4 },
    12: { matchType: 'poule', team1: 'IKPO', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 4', terrainId: 5 },
    13: { matchType: 'poule', team1: 'ESPAS-ESTICE', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 1', terrainId: 2 },
    14: { matchType: 'poule', team1: 'FGES', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 2', terrainId: 3 },
    15: { matchType: 'poule', team1: 'FMMS', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 3', terrainId: 4 },
    16: { matchType: 'poule', team1: 'FLSH', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 4', terrainId: 5 },

    // Classification demi-finale (5-8)
    29: { matchType: 'classif_semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15', terrain: 'Cible 1', terrainId: 2, nextMatchWin: 31, nextMatchLose: 32 },
    30: { matchType: 'classif_semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15', terrain: 'Cible 2', terrainId: 3, nextMatchWin: 31, nextMatchLose: 32 },

    // Finales de classification
    32: { matchType: 'final_7th', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45', terrain: 'Cible 2', terrainId: 3 },
    31: { matchType: 'final_5th', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:30', terrain: 'Cible 2', terrainId: 3 },

    // Demi-finales principales
    33: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:00', terrain: 'Cible 1', terrainId: 2, nextMatchWin: 36, nextMatchLose: 35 },
    34: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:00', terrain: 'Cible 1', terrainId: 2, nextMatchWin: 36, nextMatchLose: 35 },

    // Finales principales
    35: { matchType: 'bronze_final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45', terrain: 'Cible 1', terrainId: 2 },
    36: { matchType: 'final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:30', terrain: 'Cible 1', terrainId: 2 }
  },
  // Définir les accesseurs correctement
  get matches() {
    return this._matches;
  },
  set matches(value) {
    this._matches = value;
  }
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
  localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
  localStorage.setItem('lastUpdate', new Date().toISOString());
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
  const savedState = localStorage.getItem('flechettesTournamentState');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Vérifier que tous les matchs requis existent
      const requiredMatchIds = [33, 34, 29, 30, 31, 32, 35, 36];
      
      // S'assurer que parsed.matches existe avant de l'utiliser
      if (!parsed._matches) {
        console.log("Structure de données invalide dans l'état sauvegardé");
        return false;
      }
      
      const hasMissingMatches = requiredMatchIds.some(id => !parsed._matches[id]);
      
      if (hasMissingMatches) {
        console.log("Des matchs sont manquants dans l'état sauvegardé, utilisation de l'état initial");
        return false;
      }
      
      tournamentState = parsed;
      return true;
    } catch (e) {
      console.error("Erreur lors du parsing de l'état sauvegardé:", e);
      return false;
    }
  }
  return false;
}

// Réinitialiser complètement le tournoi
function resetTournament() {
  if (confirm("Êtes-vous sûr de vouloir réinitialiser le tournoi ? Tous les scores seront effacés.")) {
    localStorage.removeItem('flechettesTournamentState');
    localStorage.removeItem('lastUpdate');
    window.location.reload();
  }
}

// Initialisation du mode de correction
let correctionMode = false;
function toggleCorrectionMode() {
  correctionMode = !correctionMode;
  const button = document.getElementById('correctionMode');
  if (button) {
    button.style.backgroundColor = correctionMode ? '#4CAF50' : '#f44336';
  }
  
  // Ajouter/enlever la classe correction-active au body
  if (correctionMode) {
    document.body.classList.add('correction-active');
  } else {
    document.body.classList.remove('correction-active');
  }
}

// ----- GESTION DES MATCHS ET DU CLASSEMENT -----

// Calculer les statistiques pour chaque équipe de la poule
function calculateGroupStats() {
  const stats = {};
  
  // Initialiser les statistiques pour chaque équipe
  pouleTeams.forEach(team => {
    stats[team] = {
      team: team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };
  });
  
  // Vérifier que tournamentState.matches existe avant de l'utiliser
  if (!tournamentState.matches) {
    console.error("tournamentState.matches est undefined");
    return stats;
  }
  
  // Parcourir tous les matchs de poule terminés
  Object.values(tournamentState.matches).forEach(match => {
    if (match.matchType === 'poule' && match.status === 'terminé' && 
        match.score1 !== null && match.score2 !== null) {
      
      const team1 = match.team1;
      const team2 = match.team2;
      
      if (stats[team1] && stats[team2]) {
        // Compter le match joué
        stats[team1].played++;
        stats[team2].played++;
        
        // Ajouter les buts marqués/encaissés
        stats[team1].goalsFor += match.score1;
        stats[team1].goalsAgainst += match.score2;
        stats[team2].goalsFor += match.score2;
        stats[team2].goalsAgainst += match.score1;
        
        // Déterminer le résultat
        if (match.score1 > match.score2) {
          // Équipe 1 gagne
          stats[team1].won++;
          stats[team2].lost++;
          stats[team1].points += 3;
        } else if (match.score1 < match.score2) {
          // Équipe 2 gagne
          stats[team2].won++;
          stats[team1].lost++;
          stats[team2].points += 3;
        } else {
          // Match nul
          stats[team1].drawn++;
          stats[team2].drawn++;
          stats[team1].points += 1;
          stats[team2].points += 1;
        }
      }
    }
  });
  
  return stats;
}

// Mettre à jour l'affichage du classement
function updateGroupStandings() {
  const groupList = document.getElementById('groupList');
  if (!groupList) return;
  
  // Calculer les statistiques
  const stats = calculateGroupStats();
  
  // Trier les équipes selon le classement
  const sortedTeams = Object.values(stats).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.goalsFor - a.goalsFor;
  });
  
  // Vider la liste actuelle
  groupList.innerHTML = '';
  
  // Remplir avec les nouvelles données
  sortedTeams.forEach((teamStats, index) => {
    const rankRow = document.createElement('div');
    rankRow.className = 'ranking-row poule';
    rankRow.innerHTML = `
      <div class="rank">${index + 1}</div>
      <div class="teamname">${teamStats.team}</div>
      <div class="stats">${teamStats.played}</div>
      <div class="stats">${teamStats.won}</div>
      <div class="stats">${teamStats.drawn}</div>
      <div class="stats">${teamStats.lost}</div>
      <div class="stats">${teamStats.points}</div>
      <div class="stats">${teamStats.goalsFor}</div>
      <div class="stats">${teamStats.goalsAgainst}</div>
      <div class="stats">${teamStats.goalsFor - teamStats.goalsAgainst}</div>
    `;
    groupList.appendChild(rankRow);
  });
  
  // Vérifier si tous les matchs de poule sont terminés
  const allPouleMatchesFinished = checkAllPouleMatchesFinished();
  
  // Vérifier que les phases finales ne sont pas déjà configurées
  const knockoutAlreadySetup = checkKnockoutPhaseConfigured();
  
  if (allPouleMatchesFinished && sortedTeams.length >= 8 && !knockoutAlreadySetup) {
    try {
      setupKnockoutPhase(sortedTeams);
    } catch (error) {
      console.error("Erreur lors de la configuration des phases finales:", error);
    }
  }
}

// Vérifier si les phases finales sont déjà configurées
function checkKnockoutPhaseConfigured() {
  // Vérifier si les demi-finales principales ont déjà des équipes assignées
  return tournamentState.matches[33].team1 !== null || 
         tournamentState.matches[33].team2 !== null || 
         tournamentState.matches[34].team1 !== null || 
         tournamentState.matches[34].team2 !== null;
}

// Vérifier si tous les matchs de poule sont terminés
function checkAllPouleMatchesFinished() {
  const pouleMatches = Object.values(tournamentState.matches).filter(match => match.matchType === 'poule');
  return pouleMatches.every(match => match.status === 'terminé');
}

// Configuration des matchs de phase finale en fonction du classement
function setupKnockoutPhase(sortedTeams) {
  // Assurer qu'on a assez d'équipes classées
  if (sortedTeams.length < 8) return;
  
  console.log("Configuration de la phase finale avec le classement:", sortedTeams);
  
  // Vérifier que tous les matchs attendus existent
  if (!tournamentState.matches[33] || !tournamentState.matches[34] || 
      !tournamentState.matches[29] || !tournamentState.matches[30]) {
    console.error("Certains matchs de phase finale n'existent pas dans l'état du tournoi");
    return;
  }
  
  // Demi-finales principales (1er vs 4ème et 2ème vs 3ème)
  const team1 = sortedTeams[0].team; // 1er
  const team2 = sortedTeams[3].team; // 4ème
  const team3 = sortedTeams[1].team; // 2ème
  const team4 = sortedTeams[2].team; // 3ème
  
  // Matchs de classement (5ème vs 8ème et 6ème vs 7ème)
  const team5 = sortedTeams[4].team; // 5ème
  const team6 = sortedTeams[7].team; // 8ème
  const team7 = sortedTeams[5].team; // 6ème
  const team8 = sortedTeams[6].team; // 7ème
  
  // Configurer les demi-finales principales
  tournamentState.matches[33].team1 = team1;
  tournamentState.matches[33].team2 = team2;
  tournamentState.matches[34].team1 = team3;
  tournamentState.matches[34].team2 = team4;
  
  // Configurer les matchs de classement
  tournamentState.matches[29].team1 = team5;
  tournamentState.matches[29].team2 = team6;
  tournamentState.matches[30].team1 = team7;
  tournamentState.matches[30].team2 = team8;
  
  // Sauvegarder l'état sans appeler updateUI pour éviter la récursion
  saveTournamentState();
  
  // Au lieu d'appeler directement updateUI, on met à jour seulement les éléments nécessaires
  updateKnockoutMatchesDisplay();
}

// Fonction pour mettre à jour uniquement l'affichage des matchs à élimination directe
function updateKnockoutMatchesDisplay() {
  // Mettre à jour les matchs à élimination directe dans le DOM
  Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
    if (matchData.matchType !== 'poule') {
      const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
      if (matchElement) {
        // Mise à jour des équipes
        const teamElements = matchElement.querySelectorAll('.team');
        if (teamElements.length >= 2) {
          teamElements[0].textContent = matchData.team1 || '-';
          teamElements[1].textContent = matchData.team2 || '-';
        }
      }
    }
  });
}

// Traitement d'un match terminé
function processCompletedMatch(matchId) {
  const match = tournamentState.matches[matchId];
  if (!match || match.status !== 'terminé') return;
  
  // Déterminer le vainqueur et le perdant
  if (match.score1 > match.score2) {
    match.winner = match.team1;
    match.loser = match.team2;
  } else if (match.score1 < match.score2) {
    match.winner = match.team2;
    match.loser = match.team1;
  }
  
  // Si c'est un match de phase finale, mettre à jour les matchs suivants
  if (match.nextMatchWin && match.winner) {
    // Pour le gagnant
    const winnerMatch = tournamentState.matches[match.nextMatchWin];
    if (winnerMatch) {
      if (!winnerMatch.team1) {
        winnerMatch.team1 = match.winner;
      } else if (!winnerMatch.team2) {
        winnerMatch.team2 = match.winner;
      }
    }
  }
  
  if (match.nextMatchLose && match.loser) {
    // Pour le perdant
    const loserMatch = tournamentState.matches[match.nextMatchLose];
    if (loserMatch) {
      if (!loserMatch.team1) {
        loserMatch.team1 = match.loser;
      } else if (!loserMatch.team2) {
        loserMatch.team2 = match.loser;
      }
    }
  }
  
  saveTournamentState();
}

// Gérer le clic sur un match
function handleMatchClick(matchId) {
  const match = tournamentState.matches[matchId];
  if (!match) return;
  
  if (correctionMode) {
    // Mode correction - modifier les scores directement
    const score1 = prompt(`Score pour ${match.team1}:`, match.score1 || 0);
    if (score1 === null) return; // Annulé
    
    const score2 = prompt(`Score pour ${match.team2}:`, match.score2 || 0);
    if (score2 === null) return; // Annulé
    
    // Mettre à jour les scores
    match.score1 = parseInt(score1);
    match.score2 = parseInt(score2);
    match.status = 'terminé';
    
    // Traiter le match terminé
    processCompletedMatch(matchId);
    
    // Mettre à jour l'interface
    updateUI();
    updatePouleMatches();
  } else {
    // Mode normal - rediriger vers marquage.html avec les paramètres du match
    if (match.team1 && match.team2 && match.status !== 'terminé') {
      // Mettre à jour le statut du match à "en_cours" avant de rediriger
      match.status = 'en_cours';
      saveTournamentState();
      
      const params = new URLSearchParams();
      params.append('matchId', matchId);
      params.append('team1', match.team1);
      params.append('team2', match.team2);
      params.append('terrain', match.terrainId);
      params.append('sport', 'flechettes');
      
      window.location.href = `marquage.html?${params.toString()}`;
    } else if (match.status === 'terminé') {
      alert(`Match terminé: ${match.team1} ${match.score1} - ${match.score2} ${match.team2}`);
    } else if (match.status === 'en_cours') {
      alert(`Le match est en cours. Rendez-vous sur le terrain ${match.terrain} pour le suivre.`);
    } else {
      alert("Ce match n'est pas encore configuré avec les équipes.");
    }
  }
}

// Afficher les matchs de poule
function updatePouleMatches() {
  const matchesContainer = document.getElementById('currentPouleMatches');
  if (!matchesContainer) return;
  
  matchesContainer.innerHTML = '';
  
  // Obtenir tous les matchs de poule
  const pouleMatches = Object.entries(tournamentState.matches)
    .filter(([_, match]) => match.matchType === 'poule')
    .map(([id, match]) => ({ id, ...match }))
    .sort((a, b) => {
      // D'abord par heure
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      } else if (timeA[1] !== timeB[1]) {
        return timeA[1] - timeB[1];
      }
      
      // Puis par ID
      return parseInt(a.id) - parseInt(b.id);
    });
  
  // Créer les éléments pour chaque match
  pouleMatches.forEach(match => {
    const matchElement = document.createElement('div');
    matchElement.className = `match ${match.status}`;
    matchElement.setAttribute('data-match-id', match.id);
    matchElement.setAttribute('data-match-type', 'poule');
    matchElement.setAttribute('data-status', match.status);
    
    let score1Display = match.score1 !== null ? match.score1 : '-';
    let score2Display = match.score2 !== null ? match.score2 : '-';
    
    let statusDisplay = match.status.replace('_', ' ');
    // Afficher un indicateur spécial pour les matchs en cours
    if (match.status === 'en_cours') {
      statusDisplay = '🔴 EN DIRECT';
    }
    
    matchElement.innerHTML = `
      <div class="match-time">${match.time}</div>
      <div class="match-teams">
        <div class="team ${match.winner === match.team1 ? 'winner' : ''}">${match.team1}</div>
        <div class="score">${score1Display} - ${score2Display}</div>
        <div class="team ${match.winner === match.team2 ? 'winner' : ''}">${match.team2}</div>
      </div>
      <div class="match-info">
        <div class="match-status">${statusDisplay}</div>
        <div class="match-terrain">${match.terrain}</div>
      </div>
    `;
    
    // Ajouter un gestionnaire de clic pour la modification
    matchElement.addEventListener('click', () => handleMatchClick(match.id));
    
    // Ajouter une classe pour indiquer que le match est cliquable
    matchElement.classList.add('clickable');
    
    matchesContainer.appendChild(matchElement);
  });
}

// Mise à jour globale de l'interface
function updateUI() {
  console.log("Mise à jour de l'interface...");
  
  // Mettre à jour les classements
  updateGroupStandings();
  
  // Mettre à jour les matchs de poule
  updatePouleMatches();
  
  // Mettre à jour tous les matchs des phases finales dans le DOM
  Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
    if (matchData.matchType !== 'poule') {
      const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
      if (matchElement) {
        // Mettre à jour l'élément du match
        matchElement.setAttribute('data-status', matchData.status);
        
        // Mise à jour des équipes
        const teamElements = matchElement.querySelectorAll('.team');
        if (teamElements.length >= 2) {
          teamElements[0].textContent = matchData.team1 || '-';
          teamElements[1].textContent = matchData.team2 || '-';
          
          // Ajouter la classe winner si nécessaire
          if (matchData.winner === matchData.team1) {
            teamElements[0].classList.add('winner');
            teamElements[1].classList.remove('winner');
          } else if (matchData.winner === matchData.team2) {
            teamElements[0].classList.remove('winner');
            teamElements[1].classList.add('winner');
          } else {
            teamElements[0].classList.remove('winner');
            teamElements[1].classList.remove('winner');
          }
        }
        
        // Mise à jour du score et du statut
        const scoreElement = matchElement.querySelector('.score');
        if (scoreElement) {
          const score1 = matchData.score1 !== null ? matchData.score1 : '-';
          const score2 = matchData.score2 !== null ? matchData.score2 : '-';
          scoreElement.textContent = `${score1} - ${score2}`;
        }
        
        const statusElement = matchElement.querySelector('.match-status');
        if (statusElement) {
          let statusDisplay = matchData.status.replace('_', ' ');
          // Afficher un indicateur spécial pour les matchs en cours
          if (matchData.status === 'en_cours') {
            statusDisplay = '🔴 EN DIRECT';
          }
          statusElement.textContent = statusDisplay;
        }
        
        // Ajouter un gestionnaire de clic pour tous les matchs
        matchElement.onclick = () => {
          handleMatchClick(matchId);
        };
      }
    }
  });
  
  // Sauvegarder l'état
  saveTournamentState();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation du tournoi de fléchettes...");
  
  // Essayer de charger l'état sauvegardé
  const loaded = loadTournamentState();
  if (!loaded) {
    console.log("Aucun état sauvegardé trouvé, utilisation de l'état initial");
    saveTournamentState();
  }
  
  // Initialiser l'interface
  updateUI();
  
  // Ajouter les gestionnaires d'événements pour les matchs
  document.querySelectorAll('.match').forEach(matchElement => {
    const matchId = matchElement.getAttribute('data-match-id');
    if (matchId) {
      matchElement.addEventListener('click', () => {
        handleMatchClick(matchId);
      });
    }
  });
  
  // Initialiser le mode de correction
  const correctionButton = document.getElementById('correctionMode');
  if (correctionButton) {
    correctionButton.addEventListener('click', toggleCorrectionMode);
  }
  
  // Afficher la vue des poules par défaut
  const phaseSelect = document.getElementById('phaseSelect');
  if (phaseSelect) {
    phaseSelect.value = 'poule-phase';
    const event = new Event('change');
    phaseSelect.dispatchEvent(event);
  }
  
  // Mettre à jour le classement final quand nécessaire
  updateRankingDisplay();
});