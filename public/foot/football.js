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
        const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState'));
        
        if (tournamentState && tournamentState.matches) {
            const currentMatch = tournamentState.matches[matchId];
            
            // Mise à jour du match actuel
            currentMatch.team1 = team1;
            currentMatch.team2 = team2;
            currentMatch.score1 = score1;
            currentMatch.score2 = score2;
            currentMatch.status = 'terminé';
            currentMatch.winner = winner;
            currentMatch.loser = loser;

            // Gestion du match suivant pour le vainqueur
            if (currentMatch.nextMatchWin) {
                const nextMatch = tournamentState.matches[currentMatch.nextMatchWin];
                if (nextMatch) {
                    // Déterminer dans quelle position placer le vainqueur
                    const matchIdNum = parseInt(matchId);
                    if (matchIdNum % 2 === 1) {
                        // Si c'est un match impair (1,3,5,7), le vainqueur va en team1
                        nextMatch.team1 = winner;
                    } else {
                        // Si c'est un match pair (2,4,6,8), le vainqueur va en team2
                        nextMatch.team2 = winner;
                    }
                }
            }

            // Gestion du match suivant pour le perdant
            if (currentMatch.nextMatchLose) {
                const nextLoseMatch = tournamentState.matches[currentMatch.nextMatchLose];
                if (nextLoseMatch) {
                    // Même logique pour les perdants
                    const matchIdNum = parseInt(matchId);
                    if (matchIdNum % 2 === 1) {
                        nextLoseMatch.team1 = loser;
                    } else {
                        nextLoseMatch.team2 = loser;
                    }
                }
            }

            localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
        }

        // Mise à jour du match dans la base de données
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
                loser,
                nextMatchWin: tournamentState.matches[matchId].nextMatchWin,
                nextMatchLose: tournamentState.matches[matchId].nextMatchLose
            })
        });

        // Redirection vers la page principale
        window.location.href = 'football.html';

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