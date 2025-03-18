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

// Définir les terrains
const terrains = {
    'poule': 8,          // Terrain de handball
    'final': 8,          // Terrain de handball
};

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
        
        matchElement.setAttribute('data-status', matchData.status);
        
        const teamDivs = matchElement.querySelectorAll('.team');
        if (teamDivs.length < 2) return;
        
        // Passer l'objet match complet au lieu de juste le winner
        fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData);
        fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData);
        
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

  // Vérifier si tous les matchs de poule sont terminés
  const allPouleMatchesFinished = Object.values(tournamentState.matches)
      .filter(m => m.matchType === 'poule')
      .every(m => m.status === 'terminé');

  if (allPouleMatchesFinished) {
      const finalMatch = tournamentState.matches[13];
      if (finalMatch.status === 'à_venir' && !finalMatch.team1 && !finalMatch.team2) {
          console.log("Tous les matchs de poule sont terminés, configuration de la finale...");
          setupFinalMatch();
      }
  }
}

function fillTeamDiv(teamDiv, teamName, score, winnerName) {
    const nameDiv = teamDiv.querySelector('.team-name');
    const scoreDiv = teamDiv.querySelector('.score');
    if (!nameDiv || !scoreDiv) return;

    if (!teamName) {
        nameDiv.innerHTML = `<div class='team-logo'></div>-`;
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser', 'draw');
        return;
    }

    const teamObj = teams[teamName];
    const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
    nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;

    if (score === null || score === undefined) {
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser', 'draw');
    } else {
        scoreDiv.textContent = score;
        
        // Si les scores sont égaux, appliquer le style de match nul
        if (winnerName === null && match.score1 === match.score2) {
            teamDiv.classList.add('draw');
            teamDiv.classList.remove('winner', 'loser');
            scoreDiv.classList.add('draw');
        } else if (winnerName) {
            teamDiv.classList.remove('draw');
            scoreDiv.classList.remove('draw');
            if (teamName === winnerName) {
                teamDiv.classList.add('winner');
                teamDiv.classList.remove('loser');
            } else {
                teamDiv.classList.add('loser');
                teamDiv.classList.remove('winner');
            }
        } else {
            teamDiv.classList.remove('winner', 'loser', 'draw');
            scoreDiv.classList.remove('draw');
        }
    }
}

function calculateTeamStats() {
  // Initialiser les stats pour toutes les équipes de la poule
  const teamStats = {};
  
  // S'assurer que chaque équipe a ses statistiques initialisées
  pouleTeams.forEach(team => {
      teamStats[team] = {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0
      };
  });

  // Parcourir uniquement les matchs de poule terminés
  for (let i = 1; i <= 12; i++) {
      const match = tournamentState.matches[i];
      if (match && match.status === 'terminé' && match.team1 && match.team2) {
          const team1Stats = teamStats[match.team1];
          const team2Stats = teamStats[match.team2];

          if (!team1Stats || !team2Stats) continue; // Ignorer si une équipe n'est pas trouvée

          team1Stats.played++;
          team2Stats.played++;

          // Vérifier si c'est un match nul (scores égaux)
          if (match.score1 === match.score2) {
              // Match nul - incrémenter les compteurs draws
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

          // Mise à jour des buts
          if (typeof match.score1 === 'number' && typeof match.score2 === 'number') {
              team1Stats.goalsFor += match.score1;
              team1Stats.goalsAgainst += match.score2;
              team2Stats.goalsFor += match.score2;
              team2Stats.goalsAgainst += match.score1;
          }
      }
  }

  return teamStats;
}

// ----- SIMULATION D'UN MATCH -----
async function simulateMatch(matchId) {
    const match = tournamentState.matches[matchId];
    if (!match || match.status === 'terminé') return;
    
    match.score1 = Math.floor(Math.random() * 6);
    match.score2 = Math.floor(Math.random() * 6);

    // Gestion du match nul
    if (match.score1 === match.score2) {
        match.draw = true;
        match.winner = null;
        match.loser = null;
    } else {
        match.draw = false;
        if (match.score1 > match.score2) {
            match.winner = match.team1;
            match.loser = match.team2;
        } else {
            match.winner = match.team2;
            match.loser = match.team1;
        }
    }

    match.status = 'terminé';
    
    await updateUI();
    saveTournamentState();
}

// ----- SIMULATION DE LA COMPÉTITION -----
async function simulateTournament() {
    try {
        // 1. Simuler tous les matchs de poule
        console.log("Début simulation des matchs de poule");
        for (let i = 1; i <= 12; i++) {
            if (tournamentState.matches[i].status !== 'terminé') {
                await simulateMatch(i);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 2. Déterminer les finalistes après tous les matchs de poule
        const teamStats = calculateTeamStats(); // Utilise la fonction existante
        console.log("Statistiques des équipes:", teamStats);

        // 3. Trier les équipes par points et différence de buts
        const sortedTeams = Object.entries(teamStats).sort((a, b) => {
            const teamA = a[1];
            const teamB = b[1];
            // D'abord comparer les points
            if (teamA.points !== teamB.points) {
                return teamB.points - teamA.points;
            }
            // En cas d'égalité, utiliser la différence de buts
            const diffA = teamA.goalsFor - teamA.goalsAgainst;
            const diffB = teamB.goalsFor - teamB.goalsAgainst;
            return diffB - diffA;
        });

        console.log("Équipes triées:", sortedTeams);

        // 4. Configurer la finale avec les deux meilleures équipes
        const finalMatch = tournamentState.matches[13];
        finalMatch.team1 = sortedTeams[0][0]; // Première équipe
        finalMatch.team2 = sortedTeams[1][0]; // Deuxième équipe
        finalMatch.score1 = null;
        finalMatch.score2 = null;
        finalMatch.status = 'à_venir';
        finalMatch.winner = null;
        finalMatch.loser = null;

        console.log("Configuration de la finale:", {
            team1: finalMatch.team1,
            team2: finalMatch.team2
        });

        // 5. Simuler la finale
        await simulateMatch(13);
        
        saveTournamentState();
        updateUI();
        alert('Simulation terminée !');

    } catch (error) {
        console.error('Erreur lors de la simulation:', error);
        alert('Erreur lors de la simulation du tournoi');
    }
}

// Fonction pour calculer les stats des équipes en poule
function calculateTeamStats() {
    // Initialiser les stats pour toutes les équipes de la poule
    const teamStats = {};
    
    // S'assurer que chaque équipe a ses statistiques initialisées
    pouleTeams.forEach(team => {
        teamStats[team] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    });

    // Parcourir uniquement les matchs de poule terminés
    for (let i = 1; i <= 12; i++) {
        const match = tournamentState.matches[i];
        if (match && match.status === 'terminé' && match.team1 && match.team2) {
            const team1Stats = teamStats[match.team1];
            const team2Stats = teamStats[match.team2];

            if (!team1Stats || !team2Stats) continue; // Ignorer si une équipe n'est pas trouvée

            team1Stats.played++;
            team2Stats.played++;

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

            // Mise à jour des buts
            if (typeof match.score1 === 'number' && typeof match.score2 === 'number') {
                team1Stats.goalsFor += match.score1;
                team1Stats.goalsAgainst += match.score2;
                team2Stats.goalsFor += match.score2;
                team2Stats.goalsAgainst += match.score1;
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
        match.addEventListener('click', async function() {
            try {
                const matchId = parseInt(this.dataset.matchId);
                
                // Vérifier si le match précédent est terminé (sauf pour le premier match)
                if (matchId > 1) {
                    const previousMatch = tournamentState.matches[matchId - 1];
                    if (previousMatch.status !== 'terminé') {
                        alert('Le match précédent doit être terminé avant de commencer celui-ci.');
                        return;
                    }
                }

                const matchData = tournamentState.matches[matchId];
                const displayType = matchData.matchType === 'poule' ? 'Poule' : 'Finale';

                if (matchData.status === 'à_venir') {
                    matchData.status = 'en_cours';
                    
                    // Mise à jour du statut
                    await fetch(`/api/match-status/${matchId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'en_cours',
                            score1: 0,
                            score2: 0,
                            id_terrain: 8
                        })
                    });

                    saveTournamentState();

                    const params = new URLSearchParams({
                        matchId: matchId,
                        team1: matchData.team1,
                        team2: matchData.team2,
                        matchType: displayType,
                        score1: '0',
                        score2: '0'
                    });

                    window.location.href = `marquage.html?${params.toString()}`;
                }
            } catch (error) {
                console.error('Erreur lors du traitement du match:', error);
                alert('Une erreur est survenue lors du traitement du match');
            }
        });

        // Mise à jour visuelle des matchs non-cliquables
        function updateMatchClickability() {
            document.querySelectorAll('.match[data-match-id]').forEach(matchElement => {
                const matchId = parseInt(matchElement.dataset.matchId);
                const match = tournamentState.matches[matchId];

                if (matchId > 1) {
                    const previousMatch = tournamentState.matches[matchId - 1];
                    if (previousMatch.status !== 'terminé') {
                        matchElement.classList.add('disabled');
                        matchElement.style.cursor = 'not-allowed';
                        matchElement.style.opacity = '0.6';
                    } else {
                        matchElement.classList.remove('disabled');
                        matchElement.style.cursor = 'pointer';
                        matchElement.style.opacity = '1';
                    }
                }
            });
        }

        // Appeler updateMatchClickability lors de la mise à jour de l'UI
        const originalUpdateUI = updateUI;
        updateUI = function() {
            originalUpdateUI();
            updateMatchClickability();
        };

        // Appeler updateMatchClickability au chargement initial
        updateMatchClickability();
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
    // Calculer les statistiques
    const teamStats = {};
    
    // Initialiser les stats pour chaque équipe de la poule
    pouleTeams.forEach(team => {
        teamStats[team] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    });

    // Mettre à jour les stats avec les résultats des matchs
    for (let i = 1; i <= 12; i++) {
        const match = tournamentState.matches[i];
        if (match && match.status === 'terminé') {
            // Équipe 1
            teamStats[match.team1].played++;
            teamStats[match.team1].goalsFor += match.score1;
            teamStats[match.team1].goalsAgainst += match.score2;
            
            // Équipe 2
            teamStats[match.team2].played++;
            teamStats[match.team2].goalsFor += match.score2;
            teamStats[match.team2].goalsAgainst += match.score1;

            // Attribuer les points (victoire = 3pts, nul = 2pts, défaite = 1pt)
            if (match.score1 === match.score2) {
                teamStats[match.team1].draws++;
                teamStats[match.team2].draws++;
                teamStats[match.team1].points += 2;
                teamStats[match.team2].points += 2;
            } else if (match.winner === match.team1) {
                teamStats[match.team1].wins++;
                teamStats[match.team2].losses++;
                teamStats[match.team1].points += 3;
                teamStats[match.team2].points += 1;
            } else {
                teamStats[match.team2].wins++;
                teamStats[match.team1].losses++;
                teamStats[match.team2].points += 3;
                teamStats[match.team1].points += 1;
            }
        }
    }

    // Trier les équipes
    const sortedTeams = Object.entries(teamStats).sort((a, b) => {
        if (b[1].points !== a[1].points) return b[1].points - a[1].points;
        const diffA = a[1].goalsFor - a[1].goalsAgainst;
        const diffB = b[1].goalsFor - b[1].goalsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return b[1].goalsFor - a[1].goalsFor;
    });

    // Mettre à jour l'affichage
    const groupList = document.getElementById('groupList');
    if (!groupList) return;

    groupList.innerHTML = sortedTeams.map(([team, stats], index) => `
        <div class="ranking-row ${index < 2 ? 'qualified' : ''}">
            <div class="rank">${index + 1}</div>
            <div class="name">
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

    console.log('Classement mis à jour:', sortedTeams);
}

// ----- GESTION DE LA FINALE -----
async function setupFinalMatch() {
    try {
        const teamStats = calculateTeamStats();
        console.log("Stats des équipes:", teamStats);

        // Trier les équipes par points et différence de buts
        const sortedTeams = Object.entries(teamStats)
            .sort((a, b) => {
                if (b[1].points !== a[1].points) return b[1].points - a[1].points;
                const diffA = a[1].goalsFor - a[1].goalsAgainst;
                const diffB = b[1].goalsFor - b[1].goalsAgainst;
                return diffB - diffA;
            });

        console.log("Équipes triées:", sortedTeams);

        // Configurer la finale
        const finalMatch = tournamentState.matches[13];
        finalMatch.team1 = sortedTeams[0][0];
        finalMatch.team2 = sortedTeams[1][0];
        finalMatch.status = 'à_venir';
        finalMatch.score1 = null;
        finalMatch.score2 = null;

        console.log("Finale configurée:", finalMatch);

        saveTournamentState();
        updateUI();
        
        // Activer visuellement le match de finale
        const finalElement = document.querySelector('.match[data-match-id="13"]');
        if (finalElement) {
            finalElement.classList.remove('disabled');
            finalElement.style.cursor = 'pointer';
            finalElement.style.opacity = '1';
        }

    } catch (error) {
        console.error("Erreur lors de la configuration de la finale:", error);
    }
}