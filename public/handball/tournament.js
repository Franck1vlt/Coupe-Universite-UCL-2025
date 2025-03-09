/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Liste des équipes de la poule
const pouleTeams = [
  "FGES",
  "FMMS",
  "FLD",
  "ICAM",
  "IKPO",
  "JUNIA"
];

// Liste complète des équipes pour le classement final
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
let tournamentState = {
  matches: {
    // Matchs de poule (matchIds 1 à 12)
    1: { matchType: 'poule', team1: 'FGES', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:45' },
    2: { matchType: 'poule', team1: 'FMMS', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15' },
    3: { matchType: 'poule', team1: 'ICAM', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:45' },
    4: { matchType: 'poule', team1: 'IKPO', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:15' },
    5: { matchType: 'poule', team1: 'JUNIA', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45' },
    6: { matchType: 'poule', team1: 'FMMS', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:15' },
    7: { matchType: 'poule', team1: 'FGES', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:45' },
    8: { matchType: 'poule', team1: 'IKPO', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:15' },
    9: { matchType: 'poule', team1: 'JUNIA', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:45' },
    10: { matchType: 'poule', team1: 'ICAM', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:15' },
    11: { matchType: 'poule', team1: 'FLD', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:45' },
    12: { matchType: 'poule', team1: 'IKPO', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:15' },
    // Finale (matchId 13)
    13: { matchType: 'final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:45' }
  }
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
    localStorage.setItem('handballTournamentState', JSON.stringify(tournamentState));
    localStorage.setItem('lastUpdate', new Date().toISOString());
}

// Fonction pour charger l'état du tournoi
function loadTournamentState() {
    const savedState = localStorage.getItem('handballTournamentState');
    if (savedState) {
        tournamentState = JSON.parse(savedState);
        return true;
    }
    return false;
}

// ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
// Les points sont attribués en fonction des résultats des matchs de poule et de la finale.
const positionPoints = {
  1: 50,
  2: 40,
  3: 30,
  4: 20,
  5: 15,
  6: 10
};

// ----- INITIALISATION -----
document.addEventListener('DOMContentLoaded', function() {
  // Tente de charger l'état sauvegardé
  if (loadTournamentState()) {
      console.log('État précédent du tournoi chargé');
  } else {
      console.log('Nouveau tournoi initialisé');
  }
  updateUI();
  addMatchClickHandlers();  // Ajouter les gestionnaires de clic
});

// ----- MISE À JOUR DE L'INTERFACE (affichage des scores, logos et couleurs) -----
function updateUI() {
  Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
    const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
    if (!matchElement) return;
    
    // Mettre à jour le statut dans l'attribut data
    matchElement.setAttribute('data-status', matchData.status);
    
    const teamDivs = matchElement.querySelectorAll('.team');
    if (teamDivs.length < 2) return;
    fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData.winner);
    fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData.winner);
    
    // Mettre à jour l'heure et le statut
    const infoContainer = matchElement.querySelector('.match-info-container');
    if (infoContainer) {
      const timeDiv = infoContainer.querySelector('.match-time');
      const statusDiv = infoContainer.querySelector('.match-status');
      
      if (timeDiv) timeDiv.textContent = matchData.time || '';
      if (statusDiv) statusDiv.textContent = matchData.status.replace('_', ' ');
    }
  });
  
  // Mise à jour automatique du classement après chaque changement
  updateRankingDisplay();

  // Mise à jour du champion
  const finalMatch = tournamentState.matches[13];
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
  localStorage.setItem('handballTournamentState', JSON.stringify(tournamentState));

  // Ajouter cette ligne après la mise à jour des matchs
  updateGroupStandings();
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
  
  // Si c'est la finale (match 16), mettre à jour le champion
  if (matchId === 16) {
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
  
  // Simuler tous les matchs de poule d'abord
  for (const id of ids.slice(0, 12)) {
    const match = tournamentState.matches[id];
    if (match.status === 'à_venir' || match.status === 'en_cours') {
      await simulateMatch(id);
    }
  }

  // Après les matchs de poule, déterminer les finalistes
  const teamStats = calculateTeamStats();
  const sortedTeams = Object.entries(teamStats)
    .sort(([,a], [,b]) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));

  // Mettre à jour la finale avec les deux meilleures équipes
  const finalMatch = tournamentState.matches[13];
  finalMatch.team1 = sortedTeams[0][0]; // Premier de poule
  finalMatch.team2 = sortedTeams[1][0]; // Deuxième de poule
  
  // Simuler la finale
  await simulateMatch(13);
  
  saveTournamentState();
  updateRankingDisplay();
  alert('Simulation terminée !');
}

// Fonction pour calculer les stats des équipes en poule
function calculateTeamStats() {
  const teamStats = {};
  pouleTeams.forEach(team => {
    teamStats[team] = {
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
  });

  // Calculer les points pour chaque match de poule
  for (let i = 1; i <= 12; i++) {
    const match = tournamentState.matches[i];
    if (match.status === 'terminé') {
      const winner = match.winner;
      const loser = match.loser;
      
      if (match.score1 === match.score2) {
        // Match nul : 2 points chacun
        teamStats[match.team1].points += 2;
        teamStats[match.team2].points += 2;
        teamStats[match.team1].goalsFor += match.score1;
        teamStats[match.team1].goalsAgainst += match.score2;
        teamStats[match.team2].goalsFor += match.score2;
        teamStats[match.team2].goalsAgainst += match.score1;
      } else if (winner === match.team1) {
        // Victoire team1 : 3 points pour le vainqueur, 1 point pour le perdant
        teamStats[winner].points += 3;
        teamStats[loser].points += 1;
        teamStats[winner].goalsFor += match.score1;
        teamStats[winner].goalsAgainst += match.score2;
        teamStats[loser].goalsFor += match.score2;
        teamStats[loser].goalsAgainst += match.score1;
      } else {
        // Victoire team2 : 3 points pour le vainqueur, 1 point pour le perdant
        teamStats[winner].points += 3;
        teamStats[loser].points += 1;
        teamStats[winner].goalsFor += match.score2;
        teamStats[winner].goalsAgainst += match.score1;
        teamStats[loser].goalsFor += match.score1;
        teamStats[loser].goalsAgainst += match.score2;
      }
    }
  }

  return teamStats;
}

// ----- CALCUL DU CLASSEMENT FINAL -----
function calculateRankings() {
  let ranking = allTeams.map(name => ({ 
    name,
    points: 0,
    position: null,
    isPouleTeam: pouleTeams.includes(name)
  }));

  // Calculer d'abord le classement de la poule
  const teamStats = {};
  pouleTeams.forEach(team => {
    teamStats[team] = {
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
  });

  // Calculer les stats de la poule
  Object.values(tournamentState.matches)
    .filter(match => match.matchType === 'poule' && match.status === 'terminé')
    .forEach(match => {
      if (match.winner && match.loser) {
        teamStats[match.winner].points += 3;
        teamStats[match.winner].goalsFor += match.score1;
        teamStats[match.winner].goalsAgainst += match.score2;
        teamStats[match.loser].points += 1;
        teamStats[match.loser].goalsFor += match.score2;
        teamStats[match.loser].goalsAgainst += match.score1;
      }
    });

  // Trier les équipes de la poule
  const sortedPouleTeams = Object.entries(teamStats)
    .sort(([,a], [,b]) => 
      b.points - a.points || 
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
    )
    .map(([team]) => team);

  // Attribuer les points selon la position finale
  const finalMatch = tournamentState.matches[13];
  if (finalMatch && finalMatch.status === 'terminé') {
    // 1er place (50 points)
    const winner = ranking.find(r => r.name === finalMatch.winner);
    if (winner) {
      winner.points = 50;
      winner.position = 1;
    }

    // 2e place (40 points)
    const runnerUp = ranking.find(r => r.name === finalMatch.loser);
    if (runnerUp) {
      runnerUp.points = 40;
      runnerUp.position = 2;
    }

    // 3e à 6e place selon le classement de la poule
    // Exclure les 2 finalistes du classement de poule
    const remainingTeams = sortedPouleTeams
      .filter(team => team !== finalMatch.winner && team !== finalMatch.loser);

    // Attribuer les points pour les positions 3 à 6
    remainingTeams.forEach((team, index) => {
      const teamRanking = ranking.find(r => r.name === team);
      if (teamRanking) {
        switch (index) {
          case 0: teamRanking.points = 30; teamRanking.position = 3; break; // 3e place
          case 1: teamRanking.points = 20; teamRanking.position = 4; break; // 4e place
          case 2: teamRanking.points = 15; teamRanking.position = 5; break; // 5e place
          case 3: teamRanking.points = 10; teamRanking.position = 6; break; // 6e place
        }
      }
    });
  }

  // Trier le classement final
  ranking.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.isPouleTeam && !b.isPouleTeam) return -1;
    if (!a.isPouleTeam && b.isPouleTeam) return 1;
    return a.name.localeCompare(b.name);
  });

  return ranking;
}

// ----- MISE À JOUR DU TABLEAU DE CLASSEMENT -----
function updateRankingDisplay() {
  const ranking = calculateRankings();
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  
  rankingList.innerHTML = '';
  
  // Création d'un objet pour l'envoi des points
  const teamPoints = {};
  
  ranking.forEach((team, idx) => {
    const position = idx + 1;
    const highlightClass = position <= 3 ? `highlight-${position}` : '';
    
    // Ajout des points à l'objet teamPoints
    teamPoints[team.name] = team.points;
    
    rankingList.innerHTML += `
      <div class="ranking-row ${highlightClass}">
        <div class="rank">${position}</div>
        <div class="team-name">
          <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
          ${team.name}
        </div>
        <div class="points">${team.points}</div>
      </div>
    `;
  });
  
  // Envoi des points au serveur
  sendPointsToServer(teamPoints);
  
  // Sauvegarder l'état après la mise à jour
  saveTournamentState();
}

// Ajout de la fonction pour envoyer les points à l'API
async function sendPointsToServer(teamPoints) {
  try {
    const response = await fetch('/api/points/handball', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points: teamPoints
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Points mis à jour avec succès:', result);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des points:', error);
    alert('Erreur lors de l\'envoi des points au serveur');
  }
}

// ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
  if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;
  
  // Efface les données sauvegardées
  localStorage.removeItem('handballTournamentState');
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
            const matchData = tournamentState.matches[matchId];

            if (correctionModeActive && matchData.status === 'terminé') {
                // Mode correction pour un match terminé
                if (confirm('Voulez-vous corriger ce match ?')) {
                    matchData.status = 'en_cours';
                    saveTournamentState();
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
            } else if (matchData.status === 'à_venir') {
                // Passer le match en 'en_cours' avant la redirection
                matchData.status = 'en_cours';
                saveTournamentState();
                const params = new URLSearchParams({
                    matchId: matchId,
                    team1: matchData.team1,
                    team2: matchData.team2,
                    matchType: matchData.matchType
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

// Ajouter cette nouvelle fonction pour gérer les stats de la poule
function updateGroupStandings() {
    const groupList = document.getElementById('groupList');
    if (!groupList) return;

    // Calculer les statistiques pour chaque équipe
    const teamStats = {};
    pouleTeams.forEach(team => {
        teamStats[team] = {
            played: 0,      // Joués
            wins: 0,        // Gagnés
            draws: 0,       // Nuls
            losses: 0,      // Perdus
            points: 0,      // Points
            goalsFor: 0,    // Buts marqués
            goalsAgainst: 0 // Buts encaissés
        };
    });

    // Mettre à jour les stats avec les matchs joués
    Object.values(tournamentState.matches).forEach(match => {
        if (match.matchType === 'poule' && match.status === 'terminé') {
            if (match.team1 && match.team2) {
                const team1Stats = teamStats[match.team1];
                const team2Stats = teamStats[match.team2];
                
                team1Stats.played++;
                team2Stats.played++;
                team1Stats.goalsFor += match.score1;
                team1Stats.goalsAgainst += match.score2;
                team2Stats.goalsFor += match.score2;
                team2Stats.goalsAgainst += match.score1;

                if (match.score1 === match.score2) {
                    // Match nul
                    team1Stats.draws++;
                    team2Stats.draws++;
                    team1Stats.points += 2;
                    team2Stats.points += 2;
                } else if (match.winner === match.team1) {
                    // Victoire team1
                    team1Stats.wins++;
                    team2Stats.losses++;
                    team1Stats.points += 3;
                    team2Stats.points += 1;
                } else {
                    // Victoire team2
                    team2Stats.wins++;
                    team1Stats.losses++;
                    team2Stats.points += 3;
                    team1Stats.points += 1;
                }
            }
        }
    });

    // Trier les équipes par points
    const sortedTeams = Object.entries(teamStats).sort(([,a], [,b]) => b.points - a.points);

    // Générer le HTML pour le tableau
    groupList.innerHTML = sortedTeams.map(([team, stats]) => `
        <div class="ranking-row">
            <div class="rank">${sortedTeams.findIndex(([t]) => t === team) + 1}</div>
            <div class="team-name">
                <img src="/img/${team}.png" alt="${team}" class="team-logo-mini" />
                ${team}
            </div>
            <div class="stats">${stats.played}</div>
            <div class="stats">${stats.wins}</div>
            <div class="stats">${stats.draws}</div>
            <div class="stats">${stats.losses}</div>
            <div class="stats">${stats.points}</div>
            <div class="stats">${stats.goalsFor}</div>
            <div class="stats">${stats.goalsAgainst}</div>
            <div class="stats">${stats.goalsFor - stats.goalsAgainst}</div>
        </div>
    `).join('');
}
