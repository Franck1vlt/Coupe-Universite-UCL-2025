/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

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
    'poule': 8,          // Terrain de Flechettes
    'final': 8,          // Terrain de Flechettes
};

// Définition des équipes par poule
const pouleATeams = ["ESPAS-ESTICE", "FGES", "FMMS", "FLSH"];
const pouleBTeams = ["IKPO", "PIKTURA", "LiDD", "USCHOOL", "FLD"];

// ----- STRUCTURE DU TOURNOI -----
// La structure est définie par matchId avec les informations de chaque rencontre.
let tournamentState = {
    matches: {
        // Poule A (matchIds 1 à 6)
        1: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:45' },
        2: { matchType: 'poule_a', team1: 'FGES', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15' },
        3: { matchType: 'poule_a', team1: 'FLSH', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:45' },
        4: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:15' },
        5: { matchType: 'poule_a', team1: 'FMMS', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45' },
        6: { matchType: 'poule_a', team1: 'FGES', team2: 'ESPAS-ESTICE', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:15' },

        // Poule B (matchIds 7 à 12)
        7: { matchType: 'poule_b', team1: 'IKPO', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:45' },
        8: { matchType: 'poule_b', team1: 'LiDD', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:15' },
        9: { matchType: 'poule_b', team1: 'IKPO', team2: 'LiDD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:45' },
        10: { matchType: 'poule_b', team1: 'PIKTURA', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:15' },
        11: { matchType: 'poule_b', team1: 'IKPO', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:45' },
        12: { matchType: 'poule_b', team1: 'PIKTURA', team2: 'LiDD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:15' },

        // Demi-finales (matchIds 13 et 14)
        13: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:45', nextMatchWin: 17, nextMatchLose: 16 },
        14: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '19:15', nextMatchWin: 17, nextMatchLose: 16 },

        // Matchs de classement (3ème et finale)
        15: { matchType: 'smallfinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '19:45' },
        16: { matchType: 'final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '20:15' }
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
        tournamentState = JSON.parse(savedState);
        return true;
    }
    return false;
}

// ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
// Les points sont attribués en fonction des résultats des matchs de poule et de la finale.
const positionPoints = {
  1: 25,
  2: 20,
  3: 18,
  4: 15,
  5: 12,
  6: 10,
  7: 8,
  8: 6,
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
  localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));

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
    const statsA = {};
    const statsB = {};

    // Initialiser les stats pour chaque poule
    pouleATeams.forEach(team => {
        statsA[team] = {
            played: 0, wins: 0, draws: 0, losses: 0,
            points: 0, goalsFor: 0, goalsAgainst: 0
        };
    });

    pouleBTeams.forEach(team => {
        statsB[team] = {
            played: 0, wins: 0, draws: 0, losses: 0,
            points: 0, goalsFor: 0, goalsAgainst: 0
        };
    });

    // Traiter les matchs de la poule A
    for (let i = 1; i <= 6; i++) {
        processMatchStats(tournamentState.matches[i], statsA);
    }

    // Traiter les matchs de la poule B
    for (let i = 7; i <= 12; i++) {
        processMatchStats(tournamentState.matches[i], statsB);
    }

    return { pouleA: statsA, pouleB: statsB };
}

// Fonction helper pour traiter les stats d'un match
function processMatchStats(match, stats) {
    if (match && match.status === 'terminé') {
        stats[match.team1].played++;
        stats[match.team2].played++;
        
        if (match.score1 === match.score2) {
            stats[match.team1].draws++;
            stats[match.team2].draws++;
            stats[match.team1].points += 2;
            stats[match.team2].points += 2;
        } else if (match.winner === match.team1) {
            stats[match.team1].wins++;
            stats[match.team2].losses++;
            stats[match.team1].points += 3;
            stats[match.team2].points += 1;
        } else {
            stats[match.team2].wins++;
            stats[match.team1].losses++;
            stats[match.team2].points += 3;
            stats[match.team1].points += 1;
        }

        stats[match.team1].goalsFor += match.score1;
        stats[match.team1].goalsAgainst += match.score2;
        stats[match.team2].goalsFor += match.score2;
        stats[match.team2].goalsAgainst += match.score1;
    }
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
    const response = await fetch('/api/points/flechettes', {
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
  localStorage.removeItem('flechettesTournamentState');
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
    // Initialisation des statistiques pour les deux poules
    const statsA = {};
    const statsB = {};

    // Initialiser les stats pour la poule A
    pouleATeams.forEach(team => {
        statsA[team] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    });

    // Initialiser les stats pour la poule B
    pouleBTeams.forEach(team => {
        statsB[team] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    });

    // Traiter les matchs de la poule A (matchs 1-6)
    for (let i = 1; i <= 6; i++) {
        const match = tournamentState.matches[i];
        if (match && match.status === 'terminé') {
            processMatchStats(match, statsA);
        }
    }

    // Traiter les matchs de la poule B (matchs 7-12)
    for (let i = 7; i <= 12; i++) {
        const match = tournamentState.matches[i];
        if (match && match.status === 'terminé') {
            processMatchStats(match, statsB);
        }
    }

    // Trier les équipes de chaque poule
    const sortedTeamsA = Object.entries(statsA).sort(sortTeams);
    const sortedTeamsB = Object.entries(statsB).sort(sortTeams);

    // Mettre à jour l'affichage de la poule A
    const groupListA = document.getElementById('groupListA');
    if (groupListA) {
        groupListA.innerHTML = sortedTeamsA.map(([team, stats], index) => `
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
    }

    // Mettre à jour l'affichage de la poule B
    const groupListB = document.getElementById('groupListB');
    if (groupListB) {
        groupListB.innerHTML = sortedTeamsB.map(([team, stats], index) => `
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
    }
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

function setupSemiFinals() {
    const stats = calculateTeamStats();
    
    // Trier les équipes de chaque poule
    const sortedPouleA = Object.entries(stats.pouleA).sort(sortTeams);
    const sortedPouleB = Object.entries(stats.pouleB).sort(sortTeams);

    // Configurer les demi-finales
    const sf1 = tournamentState.matches[13];
    const sf2 = tournamentState.matches[14];

    // SF1: 1er Poule A vs 2ème Poule B
    sf1.team1 = sortedPouleA[0][0];
    sf1.team2 = sortedPouleB[1][0];

    // SF2: 2ème Poule A vs 1er Poule B
    sf2.team1 = sortedPouleA[1][0];
    sf2.team2 = sortedPouleB[0][0];

    saveTournamentState();
    updateUI();
}

// Fonction helper pour trier les équipes
function sortTeams(a, b) {
    if (a[1].points !== b[1].points) return b[1].points - a[1].points;
    const diffA = a[1].goalsFor - a[1].goalsAgainst;
    const diffB = b[1].goalsFor - b[1].goalsAgainst;
    return diffB - diffA;
}

function updateGroupStandings(poule = 'A') {
    // Sélectionner les équipes et matchs selon la poule
    const teams = poule === 'A' ? pouleATeams : pouleBTeams;
    const matchRange = poule === 'A' ? {start: 1, end: 6} : {start: 7, end: 12};
    
    const stats = {};
    
    // Initialiser les stats pour la poule sélectionnée
    teams.forEach(team => {
        stats[team] = {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    });

    // Traiter les matchs de la poule sélectionnée
    for (let i = matchRange.start; i <= matchRange.end; i++) {
        const match = tournamentState.matches[i];
        if (match && match.status === 'terminé') {
            processMatchStats(match, stats);
        }
    }

    // Trier les équipes
    const sortedTeams = Object.entries(stats).sort(sortTeams);

    // Mettre à jour l'affichage
    const groupList = document.getElementById('groupList');
    if (groupList) {
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
    }

    // Mettre à jour la liste des matchs
    updateMatchesList(poule);
}

function updateMatchesList(poule) {
    const matchesContainer = document.getElementById('currentPouleMatches');
    const matchRange = poule === 'A' ? {start: 1, end: 6} : {start: 7, end: 12};
    
    if (matchesContainer) {
        let matchesHTML = '';
        for (let i = matchRange.start; i <= matchRange.end; i++) {
            const match = tournamentState.matches[i];
            matchesHTML += `
                <div class="match-wrapper">
                    <div class="match" data-match-id="${i}" data-match-type="poule_${poule.toLowerCase()}">
                        <div class="team">
                            <div class="team-name">
                                <div class="team-logo" style="background-image:url('/img/${match.team1}.png')"></div>
                                ${match.team1}
                            </div>
                            <div class="score">${match.score1 ?? '-'}</div>
                        </div>
                        <div class="team">
                            <div class="team-name">
                                <div class="team-logo" style="background-image:url('/img/${match.team2}.png')"></div>
                                ${match.team2}
                            </div>
                            <div class="score">${match.score2 ?? '-'}</div>
                        </div>
                        <div class="match-info-container">
                            <div class="match-time">${match.time}</div>
                            <div class="match-status">${match.status.replace('_', ' ')}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        matchesContainer.innerHTML = matchesHTML;
    }
    
    // Réappliquer les gestionnaires de clic sur les nouveaux matchs
    addMatchClickHandlers();
}