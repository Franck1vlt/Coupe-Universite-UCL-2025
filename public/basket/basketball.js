// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

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

// Fonctions pour les points et cartons
function addPoint(team) {
    matchData[`team${team}`].score++;
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
        const tournamentState = JSON.parse(localStorage.getItem('basketTournamentState')) || { matches: {} };
        
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
            localStorage.setItem('basketTournamentState', JSON.stringify(tournamentState));
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

        // Attendre un peu avant la redirection pour assurer la sauvegarde
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirection vers la page principale
        window.location.href = 'basketball.html#final-phase';

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Fonction de mise à jour de l'affichage
function updateDisplay() {
    document.getElementById('teamAScore').textContent = matchData.teamA.score;
    document.getElementById('teamBScore').textContent = matchData.teamB.score;
    document.getElementById('teamAYellowCard').textContent = matchData.teamA.yellowCards;
    document.getElementById('teamBYellowCard').textContent = matchData.teamB.yellowCards;
    document.getElementById('teamARedCard').textContent = matchData.teamA.redCards;
    document.getElementById('teamBRedCard').textContent = matchData.teamB.redCards;

    // Mettre à jour les données en direct
    const liveData = {
        matchId: new URLSearchParams(window.location.search).get('matchId'),
        team1: document.getElementById('teamAName').textContent,
        team2: document.getElementById('teamBName').textContent,
        matchType: document.getElementById('matchType').textContent,
        score1: matchData.teamA.score,
        score2: matchData.teamB.score,
        yellowCards1: matchData.teamA.yellowCards,
        yellowCards2: matchData.teamB.yellowCards,
        redCards1: matchData.teamA.redCards,
        redCards2: matchData.teamB.redCards,
        chrono: document.getElementById('gameChrono').textContent,
        status: 'en cours'
    };

    localStorage.setItem('liveMatchData', JSON.stringify(liveData));
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
});