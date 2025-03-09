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
"qualification": 1,              // Terrain de football
"quarterfinal": 1,              // Terrain de football
"classification_semifinal": 1,   // Terrain de football
"classification_final": 1,       // Terrain de football - ajout pour match 11
"semifinal": 1,                 // Terrain de football
"smallfinal": 1,                // Terrain de football
"final": 1                      // Terrain de football
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
    loser: null
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
    loser: null
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
    loser: null
  }
}
};

// Fonction pour sauvegarder l'état du tournoi
function saveTournamentState() {
  localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
  localStorage.setItem('lastUpdate', new Date().toISOString());
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
const finalMatch = tournamentState.matches[15];
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
localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
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

// Si c'est la finale (match 15), mettre à jour le champion
if (matchId === 15) {
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
              <div class="team-name">
                  <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                  ${team.name}
              </div>
              <div class="points">${team.points}</div>
          </div>
      `;
  });

  try {
      // Envoyer les points au serveur
      const response = await fetch('/api/points/football', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              sport_id: 1,  // ID du football
              points: teamPoints
          })
      });

      if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour des points');
      }
  } catch (error) {
      console.error('Erreur:', error);
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
  // Réinitialisation du tournoi dans la base de données
  const response = await fetch('http://localhost:3000/api/tournois/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_tournois: 1,
      id_sport: 1,
      nom_tournois: 'football'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erreur serveur: ${JSON.stringify(errorData)}`);
  }
  
  // Efface les données sauvegardées localement
  localStorage.removeItem('footballTournamentState');
  localStorage.removeItem('lastUpdate');
  
  // Recharge la page
  window.location.reload();
} catch (error) {
  console.error('Erreur lors de la réinitialisation:', error);
  alert('Erreur lors de la réinitialisation du tournoi: ' + error.message);
}
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
              // Comportement normal pour un nouveau match
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

// ----- EXPOSITION DE LA FONCTION DE CORRECTION -----
window.toggleCorrectionMode = toggleCorrectionMode;