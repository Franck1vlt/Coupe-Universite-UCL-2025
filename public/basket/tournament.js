/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Variable globale pour le mode correction
let correctionModeActive = false;

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
    // Qualifications (matchIds 1 à 4) : les perdants reçoivent 5 points (9ème)
    1: {
      matchType: 'qualification',
      team1: 'FLSH',
      team2: 'JUNIA',
      score1: 15,
      score2: 35,
      status: 'terminé',
      winner: 'JUNIA',
      loser: 'FLSH',
      nextMatchWin: 4
    },
    2: {
      matchType: 'qualification', 
      team1: 'IKPO',
      team2: 'ESPOL',
      score1: 33,
      score2: 43,
      status: 'terminé',
      winner: 'ESPOL',
      loser: 'IKPO',
      nextMatchWin: 6
    },
    3: {
      matchType: 'qualification',
      team1: 'PIKTURA',
      team2: 'ESPAS-ESTICE',
      score1: 22,
      score2: 37,
      status: 'terminé', 
      winner: 'ESPAS-ESTICE',
      loser: 'PIKTURA',
      nextMatchWin: 7
    },
    // Quarts de finale (matchIds 5 à 8)
    4: {
      matchType: 'quarterfinal',
      team1: 'JUNIA',
      team2: 'IESEG',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8,  // Changé de 12 à 8
      nextMatchPosition: 'team1', // Ajouter cette précision
      time: '13:15',
      id_terrain: 9
    },
    5: {
      matchType: 'quarterfinal', 
      team1: 'ESPOL',
      team2: 'FGES',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8,  // Changé de 12 à 8
      nextMatchPosition: 'team2', // Ajouter cette précision
      time: '14:00',
      id_terrain: 9
    },
    6: {
      matchType: 'quarterfinal',
      team1: 'ESPAS-ESTICE',
      team2: 'ICAM',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9,  // Changé de 13 à 9
      nextMatchPosition: 'team1', // Ajouter cette précision
      time: '14:45',
      id_terrain: 9
    },
    7: {
      matchType: 'quarterfinal',
      team1: 'FLD',
      team2: 'FMMS',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9,  // Changé de 13 à 9
      nextMatchPosition: 'team2', // Ajouter cette précision
      time: '15:30',
      id_terrain: 9
    },
    // Demi-finales (matchIds 12 et 13)
    8: {  // Changé de 8 à 12
      matchType: 'semifinal',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 11,
      nextMatchLose: 10,
      time: '16:15',
      id_terrain: 9
    },
    9: {  // Changé de 9 à 13
      matchType: 'semifinal',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 11,
      nextMatchLose: 10,
      time: '17:00',
      id_terrain: 9
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
      time: '18:30',
      id_terrain: 9
    },
    // Finale (matchId 15) pour la 1ère / 2ème place
    11: {
      matchType: 'final-h',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      time: '19:15',
      id_terrain: 9
    },

    // Match Féminin - Finale FLD vs FLSH
    12: {
      matchType: 'final-f',
      team1: 'FLD',
      team2: 'FLSH',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      time: '17:45',
      id_terrain: 9
    }
  }
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
    localStorage.setItem('basketTournamentState', JSON.stringify(tournamentState));
    localStorage.setItem('lastUpdate', new Date().toISOString());
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
    const savedState = localStorage.getItem('basketTournamentState');
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

const positionPointsFeminin = {
  winner: 10,  // Vainqueur finale féminine
  loser: 5     // Perdant finale féminine
};

// ----- INITIALISATION -----
document.addEventListener('DOMContentLoaded', function() {
  // Tente de charger l'état sauvegardé
  if (loadTournamentState()) {
  } else {
  }
  linkWinnersAndLosers();
  updateUI();
  addMatchClickHandlers();  // Ajouter les gestionnaires de clic
  initializePageState();
  // Vérifier périodiquement les matches en cours (toutes les 5 secondes)
  setInterval(checkActiveMatches, 5000);
});

// ----- LIEN ENTRE LES MATCHES (Vainqueur/Perdant vers le match suivant) -----
function linkWinnersAndLosers() {
  for (const [mId, match] of Object.entries(tournamentState.matches)) {
    if (match.winner && match.nextMatchWin) {
      const nextMatch = tournamentState.matches[match.nextMatchWin];
      if (nextMatch) {
        // Déterminer la position pour le vainqueur
        if (match.nextMatchPosition) {
          // Utiliser la position spécifiée
          nextMatch[match.nextMatchPosition] = match.winner;
        } else if (parseInt(mId) === 8) {
          // Semi-finale 1: vainqueur en team1 pour la finale
          nextMatch.team1 = match.winner;
        } else if (parseInt(mId) === 9) {
          // Semi-finale 2: vainqueur en team2 pour la finale
          nextMatch.team2 = match.winner;
        } else if (!nextMatch.team1) {
          nextMatch.team1 = match.winner;
        } else if (!nextMatch.team2) {
          nextMatch.team2 = match.winner;
        }
      }
    }
    
    if (match.loser && match.nextMatchLose) {
      const nextMatch = tournamentState.matches[match.nextMatchLose];
      if (nextMatch) {
        // Déterminer la position pour le perdant
        if (parseInt(mId) === 8) {
          // Semi-finale 1: perdant en team1 pour la petite finale
          nextMatch.team1 = match.loser;
        } else if (parseInt(mId) === 9) {
          // Semi-finale 2: perdant en team2 pour la petite finale
          nextMatch.team2 = match.loser;
        } else if (!nextMatch.team1) {
          nextMatch.team1 = match.loser;
        } else if (!nextMatch.team2) {
          nextMatch.team2 = match.loser;
        }
      }
    }
  }
}

// Amélioration de la fonction updateUI pour détecter les matchs en cours
function updateUI() {
  // Vérifier d'abord si un match est en cours
  const currentMatchState = JSON.parse(localStorage.getItem('currentMatchState') || '{}');
  const currentMatchId = currentMatchState.matchId;
  const isMatchInProgress = currentMatchState.status === 'en_cours';
  
  // Vérifions que le match en cours n'est pas déjà marqué comme terminé dans tournamentState
  if (currentMatchId && isMatchInProgress && 
      tournamentState.matches[currentMatchId] && 
      tournamentState.matches[currentMatchId].status === 'terminé') {
    // Le match est marqué comme terminé mais l'état indique qu'il est en cours
    // On nettoie l'état incohérent
    localStorage.removeItem('currentMatchState');
    localStorage.removeItem('currentMatchId');
    hideMatchTimeDisplay();
  } else if (currentMatchId && isMatchInProgress) {
    // Si un match est en cours, mettre à jour son statut visuellement
    const matchElement = document.querySelector(`.match[data-match-id='${currentMatchId}']`);
    if (matchElement) {
      const statusElement = matchElement.querySelector('.match-status');
      if (statusElement) {
        statusElement.textContent = 'en cours';
        
        // Appliquer les classes CSS
        matchElement.classList.remove('à_venir', 'terminé');
        matchElement.classList.add('en_cours');
        matchElement.classList.remove('à-venir');
        matchElement.classList.add('en-cours');
      }
      
      // Aussi mettre à jour l'objet tournamentState pour refléter le statut
      if (tournamentState.matches[currentMatchId]) {
        tournamentState.matches[currentMatchId].status = 'en_cours';
      }
    }
  }

  // Continuer avec la mise à jour UI normale
  Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
    const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
    if (!matchElement) return;

    // Désactiver les matchs qui ne peuvent pas encore être joués
    if (!canPlayMatch(matchId)) {
      matchElement.classList.add('disabled');
    } else {
      matchElement.classList.remove('disabled');
    }

    // Mettre à jour le statut
    const statusElement = matchElement.querySelector('.match-status');
    if (statusElement) {
      // Afficher le statut de façon consistante
      let displayStatus = matchData.status;
      if (matchData.status === 'en_cours') displayStatus = 'en cours';
      if (matchData.status === 'à_venir') displayStatus = 'à venir';
      
      statusElement.textContent = displayStatus;
      
      // Appliquer manuellement les classes CSS pour le statut
      matchElement.classList.remove('à_venir', 'en_cours', 'terminé');
      matchElement.classList.add(matchData.status);
      
      // Ajouter également les classes avec tiret pour la compatibilité CSS
      matchElement.classList.remove('à-venir', 'en-cours');
      if (matchData.status === 'en_cours') matchElement.classList.add('en-cours');
      else if (matchData.status === 'à_venir') matchElement.classList.add('à-venir');
    }
    
    // Mise à jour des équipes
    const teamDivs = matchElement.querySelectorAll('.team');
    if (teamDivs.length < 2) return;
    
    // Mise à jour détaillée des équipes et scores
    updateTeamInfo(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
    updateTeamInfo(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
  });
  
  // Mise à jour automatique du classement après chaque changement
  updateRankingDisplay();

  // Mise à jour du champion
  const finalMatch = tournamentState.matches[11]; // Changé de 15 à 11
  const championDiv = document.getElementById('champion');
  if (championDiv) {
    if (finalMatch && finalMatch.winner) {
      championDiv.textContent = finalMatch.winner;
      championDiv.style.display = 'block';
      // Ajouter une animation pour le champion
      championDiv.classList.add('champion-crowned');
    } else {
      championDiv.textContent = '-';
      championDiv.style.display = 'block';
      championDiv.classList.remove('champion-crowned');
    }
  }

  // Supprimer l'appel à debugSemifinals qui cause l'erreur
  // debugSemifinals();  // Cette ligne causait l'erreur

  // Sauvegarde automatique de l'état
  localStorage.setItem('basketTournamentState', JSON.stringify(tournamentState));
}

// Nouvelle fonction pour la mise à jour détaillée des infos d'équipe
function updateTeamInfo(teamDiv, teamName, score, winnerName) {
  if (!teamDiv) return;
  
  // Mettre à jour le nom de l'équipe
  const nameDiv = teamDiv.querySelector('.team-name');
  if (nameDiv) {
    if (teamName) {
      const teamObj = teams[teamName];
      const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
      nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;
    } else {
      nameDiv.innerHTML = `<div class='team-logo'></div>-`;
    }
  }
  
  // Mettre à jour le score
  const scoreDiv = teamDiv.querySelector('.score');
  if (scoreDiv) {
    if (score !== null && score !== undefined) {
      scoreDiv.textContent = score;
    } else {
      scoreDiv.textContent = '-';
    }
  }
  
  // Mettre à jour les classes winner/loser
  if (teamName && winnerName) {
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

// Remplacer fillTeamDiv qui est maintenant inutilisée
function fillTeamDiv(teamDiv, teamName, score, winnerName) {
  updateTeamInfo(teamDiv, teamName, score, winnerName);
}

// ----- SIMULATION D'UN MATCH -----
async function simulateMatch(matchId) {
  const match = tournamentState.matches[matchId];
  if (!match || match.status === 'terminé') return;
  
  match.score1 = Math.floor(Math.random() * 6);
  match.score2 = Math.floor(Math.random() * 6);
  if (match.score1 > match.score2) {
    match.winner = match.team1;
    match.loser = match.team2;
  } else if (match.score2 > match.score1) {
    match.winner = match.team2;
    match.loser = match.team1;
  } else {
    match.score1++;
    match.winner = match.team1;
    match.loser = match.team2;
  }
  match.status = 'terminé';
  
  // Ne plus gérer directement les placements ici, car linkWinnersAndLosers s'en chargera
  
  // Si c'est la finale (match 11), mettre à jour le champion
  if (matchId === 11) { // Changé de 15 à 11
    const championDiv = document.getElementById('champion');
    if (championDiv && match.winner) {
      championDiv.textContent = match.winner;
      championDiv.classList.add('champion-crowned');
    }
  }
  
  await linkWinnersAndLosers();
  await updateUI();
  saveTournamentState();
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
  let ranking = allTeams.map(name => ({ 
    name,
    pointsH: 0,    // Points tournoi masculin
    pointsF: 0,    // Points tournoi féminin
    totalPoints: 0, // Total des points
    position: null,
    finalPhase: null
  }));

  // Attribution des points selon les résultats des matchs
  for (const match of Object.values(tournamentState.matches)) {
    if (match.status !== 'terminé') continue;

    if (match.winner && match.loser) {
      const winnerTeam = ranking.find(r => r.name === match.winner);
      const loserTeam = ranking.find(r => r.name === match.loser);

      switch(match.matchType) {
        // Matchs masculins
        case 'qualification':
          if (loserTeam) loserTeam.pointsH = positionPoints[9];
          break;
        case 'quarterfinal':
          if (loserTeam) loserTeam.pointsH = positionPoints[5];
          break;
        case 'smallfinal':
          if (winnerTeam) winnerTeam.pointsH = positionPoints[3];
          if (loserTeam) loserTeam.pointsH = positionPoints[4];
          break;
        case 'final-h':
          if (winnerTeam) winnerTeam.pointsH = positionPoints[1];
          if (loserTeam) loserTeam.pointsH = positionPoints[2];
          break;
        // Match féminin
        case 'final-f':
          if (winnerTeam) winnerTeam.pointsF = positionPointsFeminin.winner;
          if (loserTeam) loserTeam.pointsF = positionPointsFeminin.loser;
          break;
      }
    }
  }

  // Calcul des points totaux
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
          <div class="points-h">${team.pointsH || '-'}</div>
          <div class="points-f">${team.pointsF || '-'}</div>
          <div class="points-total">${team.totalPoints}</div>
        </div>
      `;
    });
    
    // Tentative d'envoi au serveur, mais continue même en cas d'échec
    await sendPointsToServer(teamPoints);
    saveTournamentState();
  } catch (error) {
    console.warn('Erreur lors de la mise à jour du classement:', error);
    // Continue l'exécution même en cas d'erreur
  }
}

// Ajout de la fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
  try {
    const response = await fetch('/api/rankings/basket/update', {  // Modification du chemin
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points: teamPoints
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // On ne propage plus l'erreur pour éviter l'interruption
    console.warn('Erreur lors de l\'envoi des points:', error);
    // Continue l'exécution même en cas d'erreur
    return null;
  }
}

// ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
  if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;
  
  // Liste complète de tous les éléments du localStorage à supprimer
  const keysToRemove = [
    'basketTournamentState', 
    'lastUpdate',
    'currentMatchState',
    'currentMatchId',
    'basketballMatchStates',
    'basketballLastMatch',
    'liveMatchData'
  ];
  
  // Supprimer tous les éléments du localStorage liés au basket
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Réinitialiser explicitement l'état des matchs problématiques,
  // notamment le match 6
  if (tournamentState && tournamentState.matches) {
    // Pour tous les matchs sauf les matchs déjà joués (1, 2, 3)
    for (let i = 4; i <= 12; i++) {
      if (tournamentState.matches[i]) {
        const match = tournamentState.matches[i];
        
        // Conserver seulement les équipes pour les matchs de qualification et les finales prédéfinies
        if (i >= 4 && i <= 7 || i === 12) {
          // Ne pas toucher aux équipes pour les quarts et finale féminine
          match.score1 = null;
          match.score2 = null;
          match.status = 'à_venir';
          match.winner = null;
          match.loser = null;
        } else {
          // Réinitialiser complètement pour les demi-finales, petite finale, finale
          match.team1 = null;
          match.team2 = null;
          match.score1 = null;
          match.score2 = null;
          match.status = 'à_venir';
          match.winner = null;
          match.loser = null;
        }
      }
    }
  }
  
  // Enregistrer l'état réinitialisé
  localStorage.setItem('basketTournamentState', JSON.stringify(tournamentState));
  
  // Recharger la page pour afficher le tournoi réinitialisé
  setTimeout(() => {
    window.location.reload();
  }, 500);
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
            const matchData = tournamentState?.matches?.[matchId];
            
            if (!matchData) {
                console.error(`Match ${matchId} non trouvé dans tournamentState`);
                return;
            }

            // Vérifier si les matchs précédents sont terminés
            if (!canPlayMatch(matchId)) {
                alert('Les matchs précédents doivent être terminés avant de pouvoir jouer ce match');
                return;
            }

            if (correctionModeActive && matchData.status === 'terminé') {
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
            } else if (matchData.status === 'à_venir') {
                const params = new URLSearchParams({
                    matchId: matchId,
                    team1: matchData.team1 || '',
                    team2: matchData.team2 || '',
                    matchType: matchData.matchType || ''
                });
                window.location.href = `marquage.html?${params.toString()}`;
            }
        });
    });
}

// Ajouter cette nouvelle fonction pour vérifier si un match peut être joué
function canPlayMatch(matchId) {
    const match = tournamentState.matches[matchId];
    
    // Vérifier le type de match
    switch(match.matchType) {
        case 'semifinal':
            // Vérifier que tous les quarts sont terminés
            return areAllMatchesComplete([4, 5, 6, 7]);
        case 'smallfinal':
        case 'final-h':
            // Vérifier que toutes les demi-finales sont terminées
            return areAllMatchesComplete([8, 9]);
        default:
            return true;
    }
}

// Fonction auxiliaire pour vérifier si tous les matchs d'un groupe sont terminés
function areAllMatchesComplete(matchIds) {
    return matchIds.every(id => 
        tournamentState.matches[id] && 
        tournamentState.matches[id].status === 'terminé'
    );
}

// Ajouter une fonction pour gérer l'état initial de la page
function initializePageState() {
    const hash = window.location.hash;
    if (hash === '#final-phase') {
        const phaseSelect = document.getElementById('phaseSelect');
        phaseSelect.value = 'final-phase';
        phaseSelect.dispatchEvent(new Event('change'));
    }
}

// Mise à jour de la fonction resetGame dans basketball.js pour rediriger vers la phase finale
async function resetGame() {
    // ...existing code...

    try {
        // ...existing saving logic...

        // Rediriger vers la page principale avec la phase finale sélectionnée
        window.location.href = 'basketball.html#final-phase';

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

let matchStates = {};

function updateMatchState(matchId, state) {
    const match = document.querySelector(`[data-match-id="${matchId}"]`);
    if (match) {
        const statusEl = match.querySelector('.match-status');
        if (statusEl) {
            statusEl.textContent = state;
            statusEl.className = `match-status ${state}`;
        }
    }
}

function endMatch(matchId, score1, score2) {
    const match = document.querySelector(`[data-match-id="${matchId}"]`);
    if (match) {
        const scores = match.querySelectorAll('.score');
        scores[0].textContent = score1;
        scores[1].textContent = score2;
        updateMatchState(matchId, 'terminé');
        
        // Sauvegarder l'état
        matchStates[matchId] = {
            status: 'terminé',
            score1: score1,
            score2: score2
        };
        localStorage.setItem('basketballMatchStates', JSON.stringify(matchStates));
    }

    // Synchroniser avec le serveur
    syncMatchState(matchId);
    window.location.href = 'basketball.html';
}

function showScoreForm(matchId) {
    const html = `
        <div class="score-form" id="scoreForm">
            <h3>Entrez les scores</h3>
            <input type="number" id="score1" placeholder="Score équipe 1" required>
            <input type="number" id="score2" placeholder="Score équipe 2" required>
            <button onclick="submitScores(${matchId})">Valider</button>
            <button onclick="closeScoreForm()">Annuler</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('scoreForm').classList.add('active');
}

function closeScoreForm() {
    const form = document.getElementById('scoreForm');
    if (form) {
        form.remove();
    }
}

function submitScores(matchId) {
    const score1 = document.getElementById('score1').value;
    const score2 = document.getElementById('score2').value;
    endMatch(matchId, score1, score2);
    closeScoreForm();
}

// Charger les états au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const savedStates = localStorage.getItem('basketballMatchStates');
    if (savedStates) {
        matchStates = JSON.parse(savedStates);
        for (const [matchId, state] of Object.entries(matchStates)) {
            if (state.status === 'terminé') {
                endMatch(matchId, state.score1, state.score2);
            }
        }
    }
});

// Fonction pour synchroniser les données des matchs depuis le serveur
async function syncMatchState(matchId) {
    try {
        const response = await fetch(`/api/matches/basket/${matchId}`);
        if (!response.ok) {
            throw new Error(`Erreur lors de la synchronisation du match ${matchId}: ${response.statusText}`);
        }
        const matchData = await response.json();
        if (matchData) {
            // Mettre à jour l'état local du match
            const match = tournamentState.matches[matchId];
            if (match) {
                match.status = matchData.status;
                match.score1 = matchData.score1;
                match.score2 = matchData.score2;
                match.winner = matchData.winner;
                match.loser = matchData.loser;
            }
            updateUI(); // Mettre à jour l'interface utilisateur
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation des données:', error);
    }
}

// Amélioration pour la vérification périodique des matches en cours
function checkActiveMatches() {
  const currentMatchState = JSON.parse(localStorage.getItem('currentMatchState') || '{}');
  // Vérifier si le match est toujours actif (moins de 3 heures)
  if (currentMatchState.matchId && currentMatchState.timestamp) {
    const now = new Date().getTime();
    const matchTime = currentMatchState.timestamp;
    // Si le match est actif depuis plus de 3 heures, le considérer comme abandonné
    if (now - matchTime > 3 * 60 * 60 * 1000) {
      localStorage.removeItem('currentMatchState');
      localStorage.removeItem('currentMatchId');
      localStorage.removeItem('liveMatchData');
    } else {
      // Vérifier que ce match n'est pas déjà terminé dans tournamentState
      const match = tournamentState.matches[currentMatchState.matchId];
      if (match && match.status === 'terminé') {
        // Le match est terminé mais l'état indique qu'il est en cours
        // On nettoie l'état incohérent
        localStorage.removeItem('currentMatchState');
        localStorage.removeItem('currentMatchId');
        localStorage.removeItem('liveMatchData');
      } else {
        // Le match est en cours, mise à jour de l'UI
        updateUI();
      }
    }
  }
}

function toggleCorrectionMode() {
    correctionModeActive = !correctionModeActive;
    const button = document.getElementById('correctionMode');
    
    if (button) {
        if (correctionModeActive) {
            button.style.backgroundColor = '#4CAF50';
            button.title = 'Mode correction actif';
            console.log('Mode correction activé');
        } else {
            button.style.backgroundColor = '#f44336';
            button.title = 'Mode correction inactif';
            console.log('Mode correction désactivé');
        }
    } else {
        console.error("Bouton 'correctionMode' introuvable");
    }
}

// ----- EXPOSITION DE LA FONCTION DE CORRECTION -----
window.toggleCorrectionMode = toggleCorrectionMode;