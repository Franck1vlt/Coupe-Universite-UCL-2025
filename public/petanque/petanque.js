// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId'),
    cochonnet: 'A' // Par défaut l'équipe A a le lancer du cochonnet
};

let server = 'A';

// Déplacer la fonction updateTeams dans le scope global
function updateTeams() {
    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');
    const teamAName = document.getElementById('teamAName');
    const teamBName = document.getElementById('teamBName');
    
    if (teamA && teamB && teamAName && teamBName) {
        teamAName.textContent = teamA.value || 'Team A';
        teamBName.textContent = teamB.value || 'Team B';
    }
    
    // Mettre à jour l'affichage du bouton cochonnet
    updateCochonnetDisplay();
}

// Fonctions pour le chronomètre
function startChrono() {
    if (!matchData.chrono.running) {
        matchData.chrono.running = true;
        matchData.chrono.interval = setInterval(updateChrono, 1000);
    }
}

function stopChrono() {
    matchData.chrono.running = false;
    clearInterval(matchData.chrono.interval);
}

function updateChrono() {
    matchData.chrono.time++;
    const minutes = Math.floor(matchData.chrono.time / 60);
    const seconds = matchData.chrono.time % 60;
    document.getElementById('gameChrono').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonction pour basculer le lancer de cochonnet entre les équipes
function toggleCochonnet() {
    matchData.cochonnet = (matchData.cochonnet === 'A') ? 'B' : 'A';
    
    // Vérifier si le bouton et son contenu existent avant de les mettre à jour
    const buttonElement = document.getElementById('cochonnetButton');
    const teamElement = document.getElementById('cochonnetTeam');
    
    if (buttonElement && teamElement) {
        const teamAName = document.getElementById('teamAName');
        const teamBName = document.getElementById('teamBName');
        
        const teamName = (matchData.cochonnet === 'A') 
            ? (teamAName ? teamAName.textContent : 'Team A')
            : (teamBName ? teamBName.textContent : 'Team B');
        
        teamElement.textContent = teamName;
        buttonElement.className = 'cochonnet-button';
        buttonElement.classList.add(`team${matchData.cochonnet}-cochonnet`);
    }
    
    // Mise à jour des icônes
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = matchData.cochonnet === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = matchData.cochonnet === 'B' ? 'visible' : 'hidden';
    }
    
    // Mettre à jour localStorage
    const currentData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
    currentData.cochonnet = matchData.cochonnet;
    localStorage.setItem('liveMatchData', JSON.stringify(currentData));

    updateDisplay();
}

// Mettre à jour l'affichage du bouton cochonnet
function updateCochonnetDisplay() {
    const buttonElement = document.getElementById('cochonnetButton');
    const teamElement = document.getElementById('cochonnetTeam');
    const teamName = (matchData.cochonnet === 'A') 
        ? document.getElementById('teamAName').textContent 
        : document.getElementById('teamBName').textContent;
    
    teamElement.textContent = teamName;
    
    // Mettre à jour la classe pour l'apparence
    buttonElement.className = 'cochonnet-button';
    buttonElement.classList.add(`team${matchData.cochonnet}-cochonnet`);

    // Mettre à jour les icônes
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = matchData.cochonnet === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = matchData.cochonnet === 'B' ? 'visible' : 'hidden';
    }
}

// Fonctions pour les points et cartons
function addPoint(team) {
    matchData[`team${team}`].score++;
    
    // Attribuer automatiquement le lancer de cochonnet à l'équipe qui vient de marquer
    matchData.cochonnet = team;
    updateCochonnetDisplay();
    
    updateDisplay();
}

function subPoint(team) {
    if (matchData[`team${team}`].score > 0) {
        matchData[`team${team}`].score--;
        updateDisplay();
    }
}

function addYellowCard(team) {
    matchData[`team${team}`].yellowCards++;
    updateDisplay();
}

function subYellowCard(team) {
    if (matchData[`team${team}`].yellowCards > 0) {
        matchData[`team${team}`].yellowCards--;
        updateDisplay();
    }
}

function addRedCard(team) {
    matchData[`team${team}`].redCards++;
    updateDisplay();
}

function subRedCard(team) {
    if (matchData[`team${team}`].redCards > 0) {
        matchData[`team${team}`].redCards--;
        updateDisplay();
    }
}

// Fonction de fin de match
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const team1 = document.getElementById('teamA').value;
    const team2 = document.getElementById('teamB').value;
    const score1 = matchData.teamA.score;
    const score2 = matchData.teamB.score;
    const matchType = new URLSearchParams(window.location.search).get('matchType');
    const winner = score1 > score2 ? team1 : team2;
    const loser = score1 > score2 ? team2 : team1;

    try {
        // Récupérer l'état actuel du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('petanqueTournamentState')) || { matches: {} };
        
        // Mettre à jour le match actuel
        if (tournamentState.matches) {
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                team1: team1,
                team2: team2,
                score1: score1,
                score2: score2,
                status: 'terminé',
                winner: winner,
                loser: loser,
                matchType: matchType
            };

            // Gérer spécifiquement les demi-finales
            if (matchId === '8' || matchId === '9') {
                // Mettre à jour la finale (match 11)
                tournamentState.matches[11] = {
                    ...tournamentState.matches[11],
                    [matchId === '8' ? 'team1' : 'team2']: winner,
                    status: 'à_venir',
                    score1: null,
                    score2: null,
                    winner: null,
                    loser: null
                };

                // Mettre à jour la petite finale (match 10)
                tournamentState.matches[10] = {
                    ...tournamentState.matches[10],
                    [matchId === '8' ? 'team1' : 'team2']: loser,
                    status: 'à_venir',
                    score1: null,
                    score2: null,
                    winner: null,
                    loser: null
                };
            }

            // Sauvegarder l'état mis à jour
            localStorage.setItem('petanqueTournamentState', JSON.stringify(tournamentState));
        }

        // Envoyer les résultats au serveur
        await fetch('/api/match-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                matchId,
                team1,
                team2,
                score1,
                score2,
                matchType,
                status: 'terminé',
                winner,
                loser
            })
        });

        // Supprimer les données live à la fin du match
        localStorage.removeItem(`liveMatchData_petanque_${matchId}`);

        // Attendre un peu avant la redirection pour assurer la sauvegarde
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirection vers la page principale
        window.location.href = 'petanque.html#final-phase';

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Fonction de mise à jour de l'affichage
function updateDisplay() {
    const teamAScore = document.getElementById('teamAScore');
    const teamBScore = document.getElementById('teamBScore');
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    
    if (teamAScore) teamAScore.textContent = matchData.teamA.score;
    if (teamBScore) teamBScore.textContent = matchData.teamB.score;

    const teamAName = document.getElementById('teamAName');
    const teamBName = document.getElementById('teamBName');
    const matchType = document.getElementById('matchType');
    const gameChrono = document.getElementById('gameChrono');

    // Mettre à jour les données en direct uniquement si tous les éléments nécessaires existent
    if (teamAName && teamBName && matchType && gameChrono) {
        const liveData = {
            matchId: matchId,
            team1: teamAName.textContent,
            team2: teamBName.textContent,
            matchType: matchType.textContent,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score,
            chrono: gameChrono.textContent,
            cochonnet: matchData.cochonnet,
            status: 'en cours'  // Important: toujours mettre 'en cours' pendant le match
        };

        // Stocker avec la clé spécifique à la pétanque
        localStorage.setItem(`liveMatchData_petanque_${matchId}`, JSON.stringify(liveData));
    }
}

function ChangeServer() {
    // Alterner le lanceur entre A et B
    server = server === 'A' ? 'B' : 'A';

    // Mettre à jour les icônes de cochonnet
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = server === 'A' ? 'visible' : 'hidden';
        ballIconB.style.visibility = server === 'B' ? 'visible' : 'hidden';
    }

    // Mettre à jour les données en direct
    const liveData = JSON.parse(localStorage.getItem('livePetanqueData') || '{}');
    liveData.server = server;
    localStorage.setItem('livePetanqueData', JSON.stringify(liveData));
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Mettre le match en status "en cours" au chargement
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    fetch(`/api/match-status/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: 'en cours',
            score1: 0,
            score2: 0
        })
    });

    updateTeams();
    updateDisplay();
    
    // Initialiser l'affichage du cochonnet
    matchData.cochonnet = 'A'; // Par défaut l'équipe A
    updateCochonnetDisplay();

    // Rendre les icônes de cochonnet invisibles par défaut
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    if (ballIconA && ballIconB) {
        ballIconA.style.visibility = 'hidden';
        ballIconB.style.visibility = 'hidden';
    }
});