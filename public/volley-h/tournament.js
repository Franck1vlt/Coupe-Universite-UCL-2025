/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Variables globales
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
  
  // Recalculer les liens entre matchs pour s'assurer de la cohérence
  linkWinnersAndLosers();
  updateUI();
  addMatchClickHandlers();
  initializePageState();
});

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
        
        // Mettre à jour la classe CSS du statut du match
        matchElement.classList.remove('a_venir', 'en_cours', 'termine');
        matchElement.classList.add(matchData.status === 'terminé' ? 'termine' : 
                                  matchData.status === 'en_cours' ? 'en_cours' : 'a_venir');
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
            championDiv.textContent = 'À déterminer';
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
        nameDiv.innerHTML = `<div class='team-logo'></div>À déterminer`;
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
    
    // Mettre à jour la progression du tournoi
    await linkWinnersAndLosers();
    await updateUI();
    
    saveTournamentState();
}

// ----- SIMULATION DE LA COMPÉTITION -----
async function simulateTournament() {
    // Trier les IDs de match pour les simuler dans l'ordre
    const ids = Object.keys(tournamentState.matches)
                     .map(x => parseInt(x))
                     .sort((a, b) => a - b);
    
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
                    <div class="team-name">
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

        const response = await fetch('/api/rankings/volley_h/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teamPoints)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur serveur:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Réponse du serveur:', result);
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'envoi des points:', error);
        throw error;
    }
}

// ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) {
        return;
    }
    
    // Effacer les données sauvegardées
    localStorage.removeItem('volleyHTournamentState');
    localStorage.removeItem('lastUpdate');
    
    // Recharger la page
    window.location.reload();
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
    if (matchData.matchType === 'smallfinal' || matchData.matchType === 'final-h') {
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

    // Rediriger vers la page de marquage
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

        // Gérer la progression vers les demi-finales
        if (matchId >= 4 && matchId <= 7) { // Quarts de finale
            const semifinalId = matchId <= 5 ? 8 : 9; // QF1&2 -> SF1, QF3&4 -> SF2
            const semifinal = tournamentState.matches[semifinalId];
            
            // Si c'est le premier gagnant pour cette demi-finale
            if (!semifinal.team1) {
                semifinal.team1 = winner;
            } 
            // Si c'est le deuxième gagnant pour cette demi-finale
            else if (!semifinal.team2 && semifinal.team1 !== winner) {
                semifinal.team2 = winner;
            }
        }

        // Gérer la progression vers la finale et petite finale
        if (matchId === 8 || matchId === 9) { // Demi-finales
            const final = tournamentState.matches[11];
            const smallFinal = tournamentState.matches[10];

            if (matchId === 8) {
                final.team1 = winner;
                smallFinal.team1 = loser;
            } else {
                final.team2 = winner;
                smallFinal.team2 = loser;
            }
        }

        saveTournamentState();
        window.location.href = 'volleyball.html#final-phase';
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