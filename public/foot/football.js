// Variables globales
let matchData = {
    teamA: { score: 0, yellowCards: 0, redCards: 0 },
    teamB: { score: 0, yellowCards: 0, redCards: 0 },
    chrono: { running: false, time: 0, interval: null },
    matchId: new URLSearchParams(window.location.search).get('matchId')
};

// Modifier les constantes des statuts
const MATCH_STATUS = {
    NOT_STARTED: 'à_venir',
    IN_PROGRESS: 'en_cours',
    FINISHED: 'terminé'
};

// Modifier la fonction updateMatchStatus pour forcer la mise à jour du localStorage
async function updateMatchStatus(status) {
    if (!matchData.matchId) {
        console.error('Pas de matchId disponible');
        return;
    }
    
    try {
        const response = await fetch(`/api/match-status/${matchData.matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                score1: matchData.teamA.score,
                score2: matchData.teamB.score
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        // Mettre à jour le localStorage immédiatement
        const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState') || '{}');
        if (tournamentState?.matches) {
            if (!tournamentState.matches[matchData.matchId]) {
                tournamentState.matches[matchData.matchId] = {};
            }
            
            tournamentState.matches[matchData.matchId].status = status;
            tournamentState.matches[matchData.matchId].score1 = matchData.teamA.score;
            tournamentState.matches[matchData.matchId].score2 = matchData.teamB.score;
            
            // Forcer la mise à jour du localStorage
            localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
            localStorage.setItem('lastUpdate', new Date().toISOString());
            
            // Déclencher un événement de storage manuellement pour les autres onglets
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'footballTournamentState',
                newValue: JSON.stringify(tournamentState)
            }));
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
    }
}

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
    
    // Mettre à jour le statut du match
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (matchId) {
        fetch(`/api/match-status/${matchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'en_cours',
                score1: matchData.teamA.score,
                score2: matchData.teamB.score
            })
        }).catch(error => console.error('Erreur lors de la mise à jour du statut:', error));
    }
}

// Fonctions pour le chronomètre
function startChrono() {
    if (!matchData.chrono.running) {
        console.log('Démarrage du chrono et mise à jour du statut...');
        matchData.chrono.running = true;
        matchData.chrono.interval = setInterval(updateChrono, 1000);

        // Mise à jour explicite du statut
        updateMatchStatus('en_cours').then(() => {
            console.log('Statut mis à jour après démarrage du chrono');
        }).catch(error => {
            console.error('Erreur lors de la mise à jour du statut:', error);
        });
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

// Fonction de fin de match modifiée
async function resetGame() {
    if (!confirm('Voulez-vous vraiment terminer le match ?')) return;

    try {
        console.log('Arrêt du match...');
        stopChrono();

        // Récupérer les scores actuels
        const score1 = parseInt(document.getElementById('teamAScore').textContent);
        const score2 = parseInt(document.getElementById('teamBScore').textContent);
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;
        const winner = score1 > score2 ? team1 : team2;
        const loser = score1 > score2 ? team2 : team1;
        const matchId = matchData.matchId;

        // Mettre à jour l'état local
        const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState') || '{}');
        if (tournamentState?.matches) {
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                score1,
                score2,
                status: 'terminé',
                winner,
                loser,
                team1,
                team2
            };
            
            // Sauvegarder immédiatement
            localStorage.setItem('footballTournamentState', JSON.stringify(tournamentState));
        }

        // Mise à jour du match dans la base de données
        await fetch('/api/match-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId,
                team1,
                team2,
                score1,
                score2,
                status: 'terminé',
                winner,
                loser,
                id_tournois: 1
            })
        });

        // Forcer une pause pour assurer la sauvegarde
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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

// Modifier l'event listener DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    matchData.matchId = matchId;
    
    // Charger l'état du tournoi
    const tournamentState = JSON.parse(localStorage.getItem('footballTournamentState'));
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

    // Ajouter la traduction du type de match
    const matchType = new URLSearchParams(window.location.search).get('matchType');
    const matchTypeTranslated = new URLSearchParams(window.location.search).get('matchTypeTranslated');
    const matchTypeDisplay = document.getElementById('matchType');
    if (matchTypeDisplay) {
        matchTypeDisplay.textContent = matchTypeTranslated || getMatchTypeTranslation(matchType);
    }

    updateTeams();
    updateDisplay();
    
    // Mettre immédiatement le match en status "en cours"
    await updateMatchStatus('en_cours');
});