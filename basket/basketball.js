let gameTimerInterval;
let shotClockInterval;
let gameMinutes = 9;
let gameSeconds = 0;
let gameMilliseconds = 0;
let shotClockSeconds = 24;
let shotClockMilliseconds = 0;
let teamAFoulCount = 0;
let teamBFoulCount = 0;
let teamAScore = 0;
let teamBScore = 0;
let matchPeriod = 1;
const buzzer = new Audio('../vraibuzzer.mp3');

const gameTimerElement = document.getElementById('gameTimer');
const shotClockElement = document.getElementById('shotClock');
const teamAFoulCountElement = document.getElementById('teamAFoulCount');
const teamBFoulCountElement = document.getElementById('teamBFoulCount');
const teamAScoreElement = document.getElementById('teamAScore');
const teamBScoreElement = document.getElementById('teamBScore');

function updateGameTimerDisplay() {
    const minutes = String(gameMinutes).padStart(2, '0');
    const seconds = String(gameSeconds).padStart(2, '0');
    const tenths = Math.floor(gameMilliseconds / 100);
    const gameTimer = document.getElementById('gameTimer');
    if (gameTimer) {
        gameTimer.textContent = `${minutes}:${seconds}.${tenths}`;
        // Sync shot clock with game timer
        if (parseFloat(gameTimer.textContent) < parseFloat(document.getElementById('shotClock').textContent)) {
            document.getElementById('shotClock').textContent = gameTimer.textContent;
        }
    }
}

function updateShotClockDisplay() {
    const seconds = String(shotClockSeconds).padStart(2, '0');
    const tenths = Math.floor(shotClockMilliseconds / 100);
    const shotClock = document.getElementById('shotClock');
    if (shotClock) {
        shotClock.textContent = `${seconds}.${tenths}`;
    }
}

function startTimers() {
    if (gameTimerInterval || shotClockInterval) return;

    gameTimerInterval = setInterval(() => {
        if (gameMilliseconds === 0) {
            if (gameSeconds === 0) {
                if (gameMinutes === 0) {
                    buzzer.play();
                    stopTimers();
                    return;
                }
                gameMinutes--;
                gameSeconds = 59;
                gameMilliseconds = 900;
            } else {
                gameSeconds--;
                gameMilliseconds = 900;
            }
        } else {
            gameMilliseconds -= 100;
        }
        updateGameTimerDisplay();
    }, 100);

    shotClockInterval = setInterval(() => {
        if (shotClockMilliseconds === 0) {
            if (shotClockSeconds === 0) {
                buzzer.play();
                stopTimers();
                return;
            }
            shotClockSeconds--;
            shotClockMilliseconds = 900;
        } else {
            shotClockMilliseconds -= 100;
        }
        updateShotClockDisplay();
    }, 100);
}

function stopTimers() {
    clearInterval(gameTimerInterval);
    clearInterval(shotClockInterval);
    gameTimerInterval = null;
    shotClockInterval = null;
}

function setMatchPeriod(period) {
    matchPeriod = period;
    const periodElement = document.getElementById('period');
    if (periodElement) {
        periodElement.textContent = matchPeriod;
    }
    if (window.opener && !window.opener.closed) {
        window.opener.updateDisplayScores();
    }
    console.log(`Période du match définie à: ${matchPeriod}`);
}

function resetGameTimer() {
    stopTimers();
    gameMinutes = 9;
    gameSeconds = 0;
    gameMilliseconds = 0;
    setShotClock(24);
    updateGameTimerDisplay();
}

function resetGame() {
    resetGameTimer();
    teamAFoulCount = 0;
    teamBFoulCount = 0;
    teamAScore = 0;
    teamBScore = 0;
    teamAFoulCountElement.textContent = teamAFoulCount;
    teamBFoulCountElement.textContent = teamBFoulCount;
    teamAScoreElement.textContent = teamAScore;
    teamBScoreElement.textContent = teamBScore;
}

function setShotClock(seconds) {
    shotClockSeconds = seconds;
    shotClockMilliseconds = 0;
    updateShotClockDisplay();
}

function addFoul(team) {
    if (team === 'A') {
        teamAFoulCount++;
        teamAFoulCountElement.textContent = teamAFoulCount;
    } else if (team === 'B') {
        teamBFoulCount++;
        teamBFoulCountElement.textContent = teamBFoulCount;
    }
}

function supFoul(team) { 
    if (team === 'A') {
        teamAFoulCount--;
        teamAFoulCountElement.textContent = teamAFoulCount;
    } else if (team === 'B') {
        teamBFoulCount--;
        teamBFoulCountElement.textContent = teamBFoulCount;
    }
}

function addScore(team, points) {
    if (team === 'A') {
        teamAScore += points;
        teamAScoreElement.textContent = teamAScore;
    } else if (team === 'B') {
        teamBScore += points;
        teamBScoreElement.textContent = teamBScore;
    }
}

function supScore(team, points) {
    if (team === 'A') {
        teamAScore -= points;
        teamAScoreElement.textContent = teamAScore;
    } else if (team === 'B') {
        teamBScore -= points;
        teamBScoreElement.textContent = teamBScore;
    }
}

// Fonction pour ouvrir l'affichage des scores
function openScoreDisplay() {
    window.open('affichage_score_basket.html', 'scoreDisplay');
}

// Fonction pour sélectionner le type de match
function updateMatchType() {
    const matchTypeValue = document.getElementById('matchTypeSelector').value;
    localStorage.setItem('matchTypeKey', matchTypeValue);
}

function updateTeams() {
    const tA = document.getElementById('teamA').value;
    const tB = document.getElementById('teamB').value;
    localStorage.setItem('teamAKey', tA);
    localStorage.setItem('teamBKey', tB);
}

function changePeriod() {
    matchPeriod = matchPeriod === 1 ? 2 : 1;
    document.getElementById('period').textContent = `MT${matchPeriod}`;
    resetGameTimer();
}

function togglePeriod() {
    const toggle = document.getElementById('periodToggle');
    const periodValue = toggle.checked ? '2' : '1';
    const periodText = `MT${periodValue}`;
    
    // Mettre à jour l'affichage local
    document.getElementById('period').textContent = periodText;
    
    // Sauvegarder dans localStorage pour l'autre interface
    localStorage.setItem('periodValue', periodText);
    
    // Mettre à jour la période du match
    matchPeriod = parseInt(periodValue);
}

function updateDisplayScores() {
    if (window.opener && !window.opener.closed) {
        // Mise à jour des scores et fautes
        const teamAScoreElement = window.opener.document.getElementById('teamAScore');
        const teamBScoreElement = window.opener.document.getElementById('teamBScore');
        const teamAFoulCountElement = window.opener.document.getElementById('teamAFoulCount');
        const teamBFoulCountElement = window.opener.document.getElementById('teamBFoulCount');
        const shotClockElement = window.opener.document.getElementById('shotClock');
        const gameTimerElement = window.opener.document.getElementById('gameTimer');
        // matchType
        const matchTypeElement = window.opener.document.getElementById('matchTypeKey');
        // period
        const periodElement = window.opener.document.getElementById('period');

        if (teamAScoreElement && teamBScoreElement && teamAFoulCountElement && teamBFoulCountElement) {
            document.getElementById('teamAScore').innerText = teamAScoreElement.innerText;
            document.getElementById('teamBScore').innerText = teamBScoreElement.innerText;
            document.getElementById('teamAFoulCount').innerText = teamAFoulCountElement.innerText;
            document.getElementById('teamBFoulCount').innerText = teamBFoulCountElement.innerText;
        }

        if (shotClockElement) {
            document.getElementById('shotClock').innerText = shotClockElement.innerText;
        }

        if (gameTimerElement) {
            document.getElementById('mainTimer').innerText = gameTimerElement.innerText;
        }

        if (matchTypeElement) {
            document.getElementById('matchType').innerText = matchTypeElement.innerText;
        }

        if (periodElement) {
            document.getElementById('period').innerText = periodElement.innerText;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const storedType = localStorage.getItem('matchTypeKey');
    if (storedType) {
      document.getElementById('matchType').textContent = storedType;
    }
});

document.addEventListener('DOMContentLoaded', () => {
const teamA = localStorage.getItem('teamAKey') || 'TEAM A';
const teamB = localStorage.getItem('teamBKey') || 'TEAM B';
document.getElementById('teamAName').textContent = teamA;
document.getElementById('teamBName').textContent = teamB;
});

document.addEventListener('DOMContentLoaded', () => {
    const storedPeriod = localStorage.getItem('periodValue') || 'MT : 1';
    document.getElementById('period').textContent = storedPeriod;
});

document.addEventListener('keydown', function(event) {
    if (event.repeat) return; // Évite les répétitions si la touche est maintenue

    switch (event.key.toLowerCase()) {
        case '1': 
        case 'a':
            event.preventDefault(); // Empêche d'éventuels conflits avec les raccourcis du navigateur
            startTimers();
            break;
        case '2': 
        case 'z':
            event.preventDefault();
            stopTimers();
            break;
        case '3': 
        case 'e':
            event.preventDefault();
            resetGameTimer();
            break;
        case '4': 
        case 'r':
            event.preventDefault();
            setShotClock(24);
            break;
        case '5': 
        case 't':
            event.preventDefault();
            setShotClock(14);
            break;
        case '6': 
        case 'y':
            event.preventDefault();
            resetGame();
            break;
    }
});

// Mise à jour toutes les 100ms
setInterval(updateDisplayScores, 100);

// Informer la page parent que l'affichage est ouvert
if (window.opener && !window.opener.closed) {
    window.opener.displayWindow = window;
}