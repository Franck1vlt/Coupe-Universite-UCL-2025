// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

// Ajouter une variable pour stocker le chrono
let currentChrono = '00:00';

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

// Modifier la fonction de gestion du chrono
function updateChrono() {
    matchData.chrono.time++;
    const minutes = Math.floor(matchData.chrono.time / 60);
    const seconds = matchData.chrono.time % 60;
    document.getElementById('gameChrono').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    currentChrono = document.getElementById('gameChrono').textContent;
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

// Fonction de fin de match modifiée
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
        const tournamentState = JSON.parse(localStorage.getItem('flechettesTournamentState'));
        
        if (tournamentState && tournamentState.matches) {
            // Mettre à jour le match avec le statut 'terminé'
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

            // Sauvegarder l'état mis à jour
            localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
        }

        // Redirection vers la page principale
        window.location.href = 'flechettes.html' + (matchType === 'final' ? '#final-phase' : '#poule-phase');

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

// Ajouter un écouteur pour le chrono
document.getElementById('gameChrono').addEventListener('change', updateChrono);

// Ajouter la fonction pour sauvegarder le match
async function saveMatchData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const matchId = urlParams.get('matchId');
        const score1 = parseInt(document.getElementById('teamAScore').textContent);
        const score2 = parseInt(document.getElementById('teamBScore').textContent);
        const chrono = document.getElementById('gameChrono').textContent;

        // Déterminer s'il y a match nul
        const isDraw = score1 === score2;
        
        const matchData = {
            status: 'terminé',
            score1: score1,
            score2: score2,
            chrono: chrono,
            draw: isDraw,
            winner: isDraw ? null : (score1 > score2 ? document.getElementById('teamAName').textContent : document.getElementById('teamBName').textContent),
            loser: isDraw ? null : (score1 > score2 ? document.getElementById('teamBName').textContent : document.getElementById('teamAName').textContent)
        };

        const response = await fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        console.log('Match sauvegardé avec succès');

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    }
}

// Ajout de la vérification du statut au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Récupération des paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Récupérer les informations du match
    const team1 = urlParams.get('team1');
    const team2 = urlParams.get('team2');
    const matchType = urlParams.get('matchType');

    // Mettre à jour les noms d'équipes
    if (team1) {
        document.getElementById('teamAName').textContent = team1;
    }
    if (team2) {
        document.getElementById('teamBName').textContent = team2;
    }

    // Mettre à jour le type de match
    if (matchType) {
        document.getElementById('matchType').textContent = matchType;
    }

    const matchId = new URLSearchParams(window.location.search).get('matchId');
    
    // Charger l'état du tournoi
    const tournamentState = JSON.parse(localStorage.getItem('flechettesTournamentState'));
    if (tournamentState && tournamentState.matches[matchId]) {
        const match = tournamentState.matches[matchId];
        
        // Si le match est déjà terminé en mode correction, charger les scores existants
        if (match.status === 'terminé' && new URLSearchParams(window.location.search).get('correction') === 'true') {
            matchData.teamA.score = match.score1;
            matchData.teamB.score = match.score2;
        }
    }

    updateTeams();
    updateDisplay();
    
    // Mettre le match en status "en cours" au chargement
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

async function updateMatchStatus(status) {
    const matchId = matchData.matchId;
    if (!matchId) {
        console.error('Pas de matchId disponible');
        return;
    }

    try {
        console.log('Envoi de la mise à jour:', {
            matchId,
            status,
            score1: matchData.teamA.score,
            score2: matchData.teamB.score
        });

        const response = await fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                score1: matchData.teamA.score || 0,
                score2: matchData.teamB.score || 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur serveur');
        }

        const result = await response.json();
        console.log('Réponse du serveur:', result);
        return result;

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        throw error;
    }
}