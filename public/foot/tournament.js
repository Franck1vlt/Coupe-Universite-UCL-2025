// Données des équipes et des matchs
const teams = {
    1: { id: 1, name: "ESPAS-ESTICE", logo: "/img/espas-estice.png" },
    2: { id: 2, name: "ESPOL", logo: "/img/espol.png" },
    3: { id: 3, name: "ESSLIL", logo: "/img/esslil.png" },
    4: { id: 4, name: "FGES", logo: "/img/fges.png" },
    5: { id: 5, name: "FLD", logo: "/img/fld.png" },
    6: { id: 6, name: "FLSH", logo: "/img/flsh.png" },
    7: { id: 7, name: "FMMS", logo: "/img/fmms.png" },
    8: { id: 8, name: "ICAM", logo: "/img/icam.png" },
    9: { id: 9, name: "IESEG", logo: "/img/ieseg.png" },
    10: { id: 10, name: "IKPO", logo: "/img/ikpo.png" },
    11: { id: 11, name: "JUNIA", logo: "/img/junia.png" },
    12: { id: 12, name: "USCHOOL", logo: "/img/uschool.png" }
};

// Structure du tournoi
const tournamentStructure = {
  quarterfinal: {
    1: { nextMatch: 9, nextPosition: 1, teams: [null, null] },
    2: { nextMatch: 9, nextPosition: 2, teams: [null, null] },
    3: { nextMatch: 10, nextPosition: 1, teams: [null, null] },
    4: { nextMatch: 10, nextPosition: 2, teams: [null, null] }
  },
  semifinal: {
    1: { nextMatch: 11, nextPosition: 1, loserNextMatch: 12, loserNextPosition: 1, teams: [null, null] },
    2: { nextMatch: 11, nextPosition: 2, loserNextMatch: 12, loserNextPosition: 2, teams: [null, null] }
  },
  final: {
    1: { championPosition: true, teams: [null, null] }
  },
  smallfinal: {
    1: { thirdPlacePosition: true, teams: [null, null] }
  }
};

// État du tournoi
let tournamentState = JSON.parse(localStorage.getItem('tournamentState')) || {
  matches: {},
  currentMatchType: "quarterfinal"
};

// Fonction pour sauvegarder l'état du tournoi
function saveState() {
  localStorage.setItem('tournamentState', JSON.stringify(tournamentState));
}

// Initialiser les matchs des quarts de finale
function initQuarterFinals() {
  // Pour chaque match de quart de finale
  for (let i = 5; i <= 8; i++) {
    const matchElement = document.querySelector(`[data-match-id="${i}"]`);
    const teamElements = matchElement.querySelectorAll('.team');
    
    // Affiche les équipes initiales dans les quarts de finale
    for (let j = 0; j < 2; j++) {
      const teamIndex = (i - 5) * 2 + j + 1;
      teamElements[j].setAttribute('data-team-id', teamIndex);
      teamElements[j].querySelector('.team-name').innerHTML = 
        `<div class="team-logo"></div>${teams[teamIndex].name}`;
    }
    
    // Initialiser la structure du match si ce n'est pas déjà fait
    if (!tournamentState.matches[i]) {
      tournamentState.matches[i] = {
        matchType: "quarterfinal",
        position: i,
        team1: { id: (i - 5) * 2 + 1, score: null },
        team2: { id: (i - 5) * 2 + 2, score: null },
        winner: null,
        loser: null,
        completed: false,
        status: "à-venir" // Ajout de l'état du match
      };
    }
  }
  
  // Sauvegarder l'état initial
  saveState();
}

// Mettre à jour l'affichage des matchs
function updateMatchDisplay() {
  Object.keys(tournamentState.matches).forEach(matchId => {
    const match = tournamentState.matches[matchId];
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
    
    if (!matchElement) return;
    
    const teamElements = matchElement.querySelectorAll('.team');
    
    // Mise à jour du statut du match
    matchElement.classList.remove('à-venir', 'en-cours', 'terminé');
    matchElement.classList.add(match.status || 'à-venir');
    
    // Mettre à jour les équipes et les scores
    if (match.team1.id) {
      const team1 = teams[match.team1.id] || { name: `Équipe ${match.team1.id}` };
      teamElements[0].querySelector('.team-name').innerHTML = `
        <div class="team-logo" style="background-image: url('${team1.logo}')"></div>
        ${team1.name}
      `;
      teamElements[0].setAttribute('data-team-id', match.team1.id);
      
      if (match.team1.score !== null) {
        teamElements[0].querySelector('.score').textContent = match.team1.score;
      }
      
      // Réinitialiser les classes winner/loser
      teamElements[0].classList.remove('winner', 'loser');
    }
    
    if (match.team2.id) {
      const team2 = teams[match.team2.id] || { name: `Équipe ${match.team2.id}` };
      teamElements[1].querySelector('.team-name').innerHTML = `
        <div class="team-logo" style="background-image: url('${team2.logo}')"></div>
        ${team2.name}
      `;
      teamElements[1].setAttribute('data-team-id', match.team2.id);
      
      if (match.team2.score !== null) {
        teamElements[1].querySelector('.score').textContent = match.team2.score;
      }
      
      // Réinitialiser les classes winner/loser
      teamElements[1].classList.remove('winner', 'loser');
    }
    
    // Mettre en évidence le vainqueur et le perdant
    if (match.completed && match.status === 'terminé') {
      if (match.winner === match.team1.id) {
        teamElements[0].classList.add('winner');
        teamElements[1].classList.add('loser');
      } else {
        teamElements[0].classList.add('loser');
        teamElements[1].classList.add('winner');
      }
    }
  });
  
  // Mettre à jour le champion
  const finalMatch = tournamentState.matches[11];
  if (finalMatch && finalMatch.completed) {
    const champion = teams[finalMatch.winner] || { name: `Équipe ${finalMatch.winner}` };
    document.getElementById('champion').textContent = champion.name;
  }
}

// Progresser vers le prochain tour
function advanceToNextMatch(matchId, winnerId, loserId) {
  const match = tournamentState.matches[matchId];
  const matchTypeInfo = tournamentStructure[match.matchType][match.position];
  
  // Vérifier s'il y a un match suivant
  if (matchTypeInfo.nextMatch) {
    // Initialiser le match suivant s'il n'existe pas encore
    if (!tournamentState.matches[matchTypeInfo.nextMatch]) {
      tournamentState.matches[matchTypeInfo.nextMatch] = {
        matchType: getNextMatchType(match.matchType),
        position: Math.ceil(match.position / 2),
        team1: { id: null, score: null },
        team2: { id: null, score: null },
        winner: null,
        loser: null,
        completed: false,
        status: "à-venir" // Ajout de l'état du match
      };
    }
    
    // Placer le vainqueur dans le match suivant
    const nextMatch = tournamentState.matches[matchTypeInfo.nextMatch];
    if (matchTypeInfo.nextPosition === 1) {
      nextMatch.team1.id = winnerId;
    } else {
      nextMatch.team2.id = winnerId;
    }
  }
  
  // Gérer les perdants pour la petite finale
  if (matchTypeInfo.loserNextMatch && loserId) {
    if (!tournamentState.matches[matchTypeInfo.loserNextMatch]) {
      tournamentState.matches[matchTypeInfo.loserNextMatch] = {
        matchType: "smallfinal",
        position: 1,
        team1: { id: null, score: null },
        team2: { id: null, score: null },
        winner: null,
        loser: null,
        completed: false,
        status: "à-venir" // Ajout de l'état du match
      };
    }
    
    const smallFinalMatch = tournamentState.matches[matchTypeInfo.loserNextMatch];
    if (matchTypeInfo.loserNextPosition === 1) {
      smallFinalMatch.team1.id = loserId;
    } else {
      smallFinalMatch.team2.id = loserId;
    }
  }
  
  saveState();
  updateMatchDisplay();
}

// Obtenir le prochain type de match
function getNextMatchType(matchType) {
  const matchTypes = {
    "quarterfinal": "semifinal",
    "semifinal": "final"
  };
  return matchTypes[matchType] || null;
}

// Fonction pour mettre à jour le statut d'un match
async function updateMatchStatus(matchId, status, score1, score2) {
  try {
    const response = await fetch(`/api/match-status/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, score1, score2 })
    });
    const data = await response.json();
    if (data.success) {
      // Mettre à jour l'état local
      if (!tournamentState.matches[matchId]) {
        tournamentState.matches[matchId] = {
          matchType: "quarterfinal",
          team1: { id: null, score: score1 },
          team2: { id: null, score: score2 },
          status: status
        };
      } else {
        tournamentState.matches[matchId].status = status;
        tournamentState.matches[matchId].team1.score = score1;
        tournamentState.matches[matchId].team2.score = score2;
      }
      saveState();
      updateMatchDisplay();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
  }
}

// Fonction pour initialiser les statuts des matchs
async function initializeMatchStatuses() {
  // Définir les matchs de qualification comme terminés
  for (let i = 1; i <= 4; i++) {
    await updateMatchStatus(i, 'terminé', 
      tournamentState.matches[i]?.team1?.score || 0,
      tournamentState.matches[i]?.team2?.score || 0
    );
  }
  
  // Définir les autres matchs comme "à-venir"
  for (let i = 5; i <= 12; i++) {
    if (!tournamentState.matches[i]?.completed) {
      await updateMatchStatus(i, 'à-venir', 0, 0);
    }
  }
}

// Rediriger vers la page de marquage
function redirectToMatchPage(matchId) {
  const match = tournamentState.matches[matchId];
  const team1 = teams[match.team1.id];
  const team2 = teams[match.team2.id];
  
  // Mettre à jour le statut en "en-cours"
  updateMatchStatus(matchId, 'en-cours', match.team1.score || 0, match.team2.score || 0);
  
  window.location.href = `marquage.html?matchId=${matchId}&team1=${team1.name}&team2=${team2.name}&matchType=${match.matchType}`;
}

// Attendre que le DOM soit chargé avant d'initialiser
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les matchs des quarts de finale
    initQuarterFinals();
    
    // Mettre à jour l'affichage des matchs
    updateMatchDisplay();
    
    // Gestionnaires d'événements
    document.querySelectorAll('.match-wrapper').forEach(matchWrapper => {
        matchWrapper.addEventListener('click', function() {
            const matchId = this.querySelector('.match').getAttribute('data-match-id');
            redirectToMatchPage(matchId);
        });
    });
    
    document.getElementById('resetTournament')?.addEventListener('click', resetTournament);
    
    document.getElementById('phaseSelect')?.addEventListener('change', function(e) {
        const phases = ['qualification-phase', 'final-phase', 'classification-phase', 'ranking-phase'];
        phases.forEach(phase => {
            document.getElementById(phase).style.display = 'none';
        });
        const selectedPhase = e.target.value + '-phase';
        document.getElementById(selectedPhase).style.display = 'flex';
        
        if (selectedPhase === 'ranking-phase') {
            updateRanking();
        }
    });

    initializeMatchStatuses();
});

// Ajouter après les fonctions existantes
function updateRanking() {
  const rankings = calculateRankings();
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';

  rankings.forEach((team, index) => {
    const position = index + 1;
    rankingList.innerHTML += `
      <div class="ranking-row ${position <= 3 ? 'highlight-' + position : ''}">
        <div class="rank">${position}</div>
        <div class="team-name">${team.name}</div>
        <div class="points">${team.points}</div>
      </div>
    `;
  });
}

// Remplacer la fonction calculateRankings existante
function calculateRankings() {
  let rankings = [];
  const matches = tournamentState.matches;

  // Points fixes selon la position finale
  const positionPoints = {
    1: 50,  // Champion
    2: 40,  // Finaliste
    3: 35,  // 3ème place
    4: 30,  // 4ème place
    5: 25,  // 5ème place
    6: 20,  // 6ème place
    7: 10,  // 7èmes places (ex-aequo)
    9: 5    // 9èmes places (perdants qualifications)
  };

  // Liste des perdants des qualifications
  const qualificationLosers = new Set();

  // Ajouter toutes les équipes
  Object.values(teams).forEach(team => {
    rankings.push({
      id: team.id,
      name: team.name,
      points: 0,
      position: null
    });
  });

  // Traiter d'abord les matches de qualification pour identifier les perdants
  Object.values(matches).forEach(match => {
    if (match.completed && match.matchType === 'qualification') {
      const loser = rankings.find(team => team.name === match.loser);
      if (loser) {
        qualificationLosers.add(loser.name);
        loser.points = positionPoints[9];
        loser.position = 9;
      }
    }
  });

  // Traiter les autres matches pour déterminer les positions
  Object.values(matches).forEach(match => {
    if (match.completed) {
      switch(match.matchType) {
        case 'final':
          const winner = rankings.find(team => team.name === match.winner);
          const loser = rankings.find(team => team.name === match.loser);
          if (winner) {
            winner.points = positionPoints[1];
            winner.position = 1;
          }
          if (loser) {
            loser.points = positionPoints[2];
            loser.position = 2;
          }
          break;

        case 'smallfinal':
          const thirdPlace = rankings.find(team => team.name === match.winner);
          const fourthPlace = rankings.find(team => team.name === match.loser);
          if (thirdPlace) {
            thirdPlace.points = positionPoints[3];
            thirdPlace.position = 3;
          }
          if (fourthPlace) {
            fourthPlace.points = positionPoints[4];
            fourthPlace.position = 4;
          }
          break;

        case 'classification_final':
          const fifthPlace = rankings.find(team => team.name === match.winner);
          const sixthPlace = rankings.find(team => team.name === match.loser);
          if (fifthPlace) {
            fifthPlace.points = positionPoints[5];
            fifthPlace.position = 5;
          }
          if (sixthPlace) {
            sixthPlace.points = positionPoints[6];
            sixthPlace.position = 6;
          }
          break;

        case 'quarter':
          // Les perdants des quarts qui ne jouent pas le match 5-6 sont 7èmes ex-aequo
          if (match.loser) {
            const quarterLoser = rankings.find(team => team.name === match.loser);
            if (quarterLoser && !quarterLoser.position) {
              quarterLoser.points = positionPoints[7];
              quarterLoser.position = 7;
            }
          }
          break;
      }
    }
  });

  // Modification de l'affichage pour les positions ex-aequo
  function getDisplayPosition(position, index) {
    if (position === 7) return "7 ex-aequo";
    if (position === 9) return "9 ex-aequo";
    return position.toString();
  }

  // Trier le classement
  const sortedRankings = rankings.sort((a, b) => {
    if (a.position === b.position) return 0;
    if (!a.position) return 1;
    if (!b.position) return -1;
    return a.position - b.position;
  });

  // Mise à jour de la fonction updateRanking pour afficher les positions ex-aequo
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';

  sortedRankings.forEach((team) => {
    if (team.position) {
      rankingList.innerHTML += `
        <div class="ranking-row ${team.position <= 3 ? 'highlight-' + team.position : ''}">
          <div class="rank">${getDisplayPosition(team.position)}</div>
          <div class="team-name">${team.name}</div>
          <div class="points">${team.points}</div>
        </div>
      `;
    }
  });

  return sortedRankings;
}

function updateMatchDisplay() {
  // Pour chaque match enregistré
  Object.keys(tournamentState.matches).forEach(matchId => {
    const match = tournamentState.matches[matchId];
    const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
    
    if (!matchElement) return;
    
    const teamElements = matchElement.querySelectorAll('.team');
    
    // Mettre à jour les équipes et les scores
    if (match.team1.id) {
      const team1 = teams[match.team1.id] || { name: `Équipe ${match.team1.id}` };
      teamElements[0].querySelector('.team-name').innerHTML = `
        <div class="team-logo" style="background-image: url('${team1.logo}')"></div>
        ${team1.name}
      `;
      teamElements[0].setAttribute('data-team-id', match.team1.id);
      
      if (match.team1.score !== null) {
        teamElements[0].querySelector('.score').textContent = match.team1.score;
      }
    }
    
    if (match.team2.id) {
      const team2 = teams[match.team2.id] || { name: `Équipe ${match.team2.id}` };
      teamElements[1].querySelector('.team-name').innerHTML = `
        <div class="team-logo" style="background-image: url('${team2.logo}')"></div>
        ${team2.name}
      `;
      teamElements[1].setAttribute('data-team-id', match.team2.id);
      
      if (match.team2.score !== null) {
        teamElements[1].querySelector('.score').textContent = match.team2.score;
      }
    }
    
    // Mettre en évidence le vainqueur et le perdant
    if (match.completed) {
      if (match.winner === match.team1.id) {
        teamElements[0].classList.add('winner');
        teamElements[1].classList.add('loser');
      } else {
        teamElements[0].classList.add('loser');
        teamElements[1].classList.add('winner');
      }
    }
    
    // Mettre à jour l'état du match
    matchElement.classList.remove('à-venir', 'en-cours', 'terminé');
    matchElement.classList.add(match.status);
  });
  
  // Mettre à jour le champion
  const finalMatch = tournamentState.matches[11];
  if (finalMatch && finalMatch.completed) {
    const champion = teams[finalMatch.winner] || { name: `Équipe ${finalMatch.winner}` };
    document.getElementById('champion').textContent = champion.name;
  }
}