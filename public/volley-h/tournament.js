/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

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
      team1: 'FMMS',
      team2: 'ESPAS-ESTICE',
      score1: 25,
      score2: 12,
      status: 'terminé',
      winner: 'FMMS',
      loser: 'ESPAS-ESTICE',
      nextMatchWin: 4
    },
    2: {
      matchType: 'qualification', 
      team1: 'FLD',
      team2: 'PIKTURA',
      score1: 25,
      score2: 20,
      status: 'terminé',
      winner: 'FLD',
      loser: 'PIKTURA',
      nextMatchWin: 5
    },
    3: {
      matchType: 'qualification',
      team1: 'FLSH',
      team2: 'IKPO',
      score1: 25,
      score2: 14,
      status: 'terminé', 
      winner: 'FLSH',
      loser: 'IKPO',
      nextMatchWin: 6
    },
    // Quarts de finale (matchIds 5 à 8)
    4: {
      matchType: 'quarterfinal',
      team1: 'FMMS',
      team2: 'FGES',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8  // Changé de 12 à 8
    },
    5: {
      matchType: 'quarterfinal', 
      team1: 'FLD',
      team2: 'JUNIA',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 8  // Changé de 12 à 8
    },
    6: {
      matchType: 'quarterfinal',
      team1: 'FLSH',
      team2: 'IESEG',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9  // Changé de 13 à 9
    },
    7: {
      matchType: 'quarterfinal',
      team1: 'ICAM',
      team2: 'ESPOL',
      score1: null,
      score2: null,
      status: 'à_venir',
      winner: null,
      loser: null,
      nextMatchWin: 9  // Changé de 13 à 9
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
      nextMatchLose: 10
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
      nextMatchLose: 10
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
    // Finale (matchId 15) pour la 1ère / 2ème place
    11: {
      matchType: 'final-h',
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
  // Tente de charger l'état sauvegardé
  if (loadTournamentState()) {
      console.log('État précédent du tournoi chargé');
  } else {
      console.log('Nouveau tournoi initialisé');
  }
  linkWinnersAndLosers();
  updateUI();
  addMatchClickHandlers();  // Ajouter les gestionnaires de clic
  initializePageState();
});

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
    const teamDivs = matchElement.querySelectorAll('.team');
    if (teamDivs.length < 2) return;
    fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
    fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
    matchElement.classList.remove('a_venir','en_cours','termine');
    matchElement.classList.add(matchData.status);
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
      championDiv.textContent = 'À déterminer';
      championDiv.style.display = 'block';
      championDiv.classList.remove('champion-crowned');
    }
  }

  // Sauvegarde automatique de l'état
  localStorage.setItem('volleyHTournamentState', JSON.stringify(tournamentState));
}

function fillTeamDiv(teamDiv, teamName, score, winnerName) {
  const nameDiv = teamDiv.querySelector('.team-name');
  const scoreDiv = teamDiv.querySelector('.score');
  if (!nameDiv || !scoreDiv) return;
  if (!teamName) {
    nameDiv.innerHTML = `<div class='team-logo'></div>À déterminer`;
    scoreDiv.textContent = '-';
    teamDiv.classList.remove('winner','loser');
    return;
  }
  const teamObj = teams[teamName];
  const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
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
  if (match.nextMatchWin) {
    const nmw = tournamentState.matches[match.nextMatchWin];
    if (nmw) {
      if (!nmw.team1) nmw.team1 = match.winner;
      else if (!nmw.team2) nmw.team2 = match.winner;
    }
  }
  if (match.nextMatchLose) {
    const nml = tournamentState.matches[match.nextMatchLose];
    if (nml) {
      if (!nml.team1) nml.team1 = match.loser;
      else if (!nml.team2) nml.team2 = match.loser;
    }
  }
  
  // Si c'est la finale (match 11), mettre à jour le champion
  if (matchId === 11) { // Changé de 15 à 11
    const championDiv = document.getElementById('champion');
    if (championDiv && match.winner) {
      championDiv.textContent = match.winner;
      championDiv.classList.add('champion-crowned');
    }
  }
  
  // La mise à jour de l'UI inclut maintenant automatiquement le classement
  await updateUI();
  saveTournamentState(); // Sauvegarde après chaque match
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
        case 'final':
          if (winnerTeam) winnerTeam.pointsH = positionPoints[1];
          if (loserTeam) loserTeam.pointsH = positionPoints[2];
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
          <div class="team-name">
            <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
            ${team.name}
          </div>
          <div class="points">${team.totalPoints}</div>
        </div>
      `;
    });
    
    await sendPointsToServer(teamPoints);
    saveTournamentState();
  } catch (error) {
    console.error('Erreur lors de la mise à jour du classement:', error);
  }
}

// Ajout de la fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
  try {
    const response = await fetch('/api/rankings/volley_h/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamPoints)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Points mis à jour avec succès:', result);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des points:', error);
    throw error; // Propager l'erreur pour la gestion plus haut
  }
}

// ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
  if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;
  
  // Efface les données sauvegardées
  localStorage.removeItem('volleyHTournamentState');
  localStorage.removeItem('lastUpdate');
  
  // Recharge la page avec un état neuf
  window.location.reload();
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
            
            // Vérifier si le match existe dans tournamentState
            if (!matchData) {
                console.error(`Match ${matchId} non trouvé dans tournamentState`);
                return;
            }

            // Empêcher la sélection directe de la finale homme
            if (matchData.matchType === 'final' && (!matchData.team1 || !matchData.team2)) {
                alert('La finale sera disponible une fois les demi-finales terminées');
                return;
            }

            if (correctionModeActive && matchData.status === 'terminé') {
                // Mode correction pour un match terminé
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
                // Comportement normal pour un nouveau match
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
        window.location.href = 'volleyball.html#final-phase';

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}
