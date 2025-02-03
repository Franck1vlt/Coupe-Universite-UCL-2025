// Variables globales
let teamAScore = 0;
let teamBScore = 0;
let teamAYellowCards = 0;
let teamBYellowCards = 0;
let teamARedCards = 0;
let teamBRedCards = 0;
let chrono;
let chronoRunning = false;
let server = 'A'; // 'A' pour l'équipe A, 'B' pour l'équipe B

// Initialisation de la page
function updateDisplay() {
    updateTeams();
    updateMatchType();
    updateScores();
    updateCards();
    updateChronoDisplay();
    updateServer();
}

// Fonction de reset du game
function resetGame() {
    localStorage.clear();
    stopChrono();
    updateDisplay();
}


// Mets à jour le nom des équipes et renvoie les id teamAName et teamBName
function updateTeams() {
    if (document.getElementById('teamA')) {
        // On est sur la page de contrôle
        const tA = document.getElementById('teamA').value;
        const tB = document.getElementById('teamB').value;
        localStorage.setItem('teamAName', tA);
        localStorage.setItem('teamBName', tB);
    }
    
    // Met à jour l'affichage sur les deux pages
    const teamAName = localStorage.getItem('teamAName') || 'TEAM A';
    const teamBName = localStorage.getItem('teamBName') || 'TEAM B';
    
    const teamAElements = document.querySelectorAll('#teamAName');
    const teamBElements = document.querySelectorAll('#teamBName');
    
    teamAElements.forEach(element => {
        element.innerText = teamAName;
    });
    
    teamBElements.forEach(element => {
        element.innerText = teamBName;
    });
}

// Mets à jour le type de match et renvoie l'id matchType
function updateMatchType() {
    if (document.getElementById('matchTypeSelector')) {
        // On est sur la page de contrôle
        const matchType = document.getElementById('matchTypeSelector').value;
        localStorage.setItem('matchType', matchType);
    }
    
    const matchType = localStorage.getItem('matchType') || 'Match';
    const matchTypeElements = document.querySelectorAll('#matchType');
    
    matchTypeElements.forEach(element => {
        element.textContent = matchType;
    });
}

// Mets à jour les scores des équipes
function updateScores() {
    teamAScore = parseInt(localStorage.getItem('teamAScore')) || 0;
    teamBScore = parseInt(localStorage.getItem('teamBScore')) || 0;
    
    const teamAScoreElements = document.querySelectorAll('#teamAScore');
    const teamBScoreElements = document.querySelectorAll('#teamBScore');
    
    teamAScoreElements.forEach(element => {
        element.innerText = teamAScore;
    });
    
    teamBScoreElements.forEach(element => {
        element.innerText = teamBScore;
    });
}

// Mets à jour les cartons des équipes
function updateCards() {
    teamAYellowCards = parseInt(localStorage.getItem('teamAYellowCards')) || 0;
    teamBYellowCards = parseInt(localStorage.getItem('teamBYellowCards')) || 0;
    teamARedCards = parseInt(localStorage.getItem('teamARedCards')) || 0;
    teamBRedCards = parseInt(localStorage.getItem('teamBRedCards')) || 0;
    
    const elements = {
        teamAYellow: document.querySelectorAll('#teamAYellowCard'),
        teamBYellow: document.querySelectorAll('#teamBYellowCard'),
        teamARed: document.querySelectorAll('#teamARedCard'),
        teamBRed: document.querySelectorAll('#teamBRedCard')
    };
    
    elements.teamAYellow.forEach(element => {
        element.innerText = teamAYellowCards;
    });
    elements.teamBYellow.forEach(element => {
        element.innerText = teamBYellowCards;
    });
    elements.teamARed.forEach(element => {
        element.innerText = teamARedCards;
    });
    elements.teamBRed.forEach(element => {
        element.innerText = teamBRedCards;
    });
}

// Les fonctions existantes restent les mêmes, mais avec mise à jour du localStorage

function subPoint(team) {
    if (team === 'A' && teamAScore > 0) {
        teamAScore--;
        localStorage.setItem('teamAScore', teamAScore);
    } else if (team === 'B' && teamBScore > 0) {
        teamBScore--;
        localStorage.setItem('teamBScore', teamBScore);
    }
    updateDisplay();
}

function addPoint(team) {
    if (team === 'A') {
        teamAScore++;
        localStorage.setItem('teamAScore', teamAScore);
    } else if (team === 'B') {
        teamBScore++;
        localStorage.setItem('teamBScore', teamBScore);
    }
    updateDisplay();
}

function addYellowCard(team) {
    if (team === 'A') {
        teamAYellowCards++;
        localStorage.setItem('teamAYellowCards', teamAYellowCards);
    } else if (team === 'B') {
        teamBYellowCards++;
        localStorage.setItem('teamBYellowCards', teamBYellowCards);
    }
    updateDisplay();
}

function addRedCard(team) {
    if (team === 'A') {
        teamARedCards++;
        localStorage.setItem('teamARedCards', teamARedCards);
    } else if (team === 'B') {
        teamBRedCards++;
        localStorage.setItem('teamBRedCards', teamBRedCards);
    }
    updateDisplay();
}

function subRedCard(team) {
    if (team === 'A' && teamARedCards > 0) {
        teamARedCards--;
        localStorage.setItem('teamARedCards', teamARedCards);
    } else if (team === 'B' && teamBRedCards > 0) {
        teamBRedCards--;
        localStorage.setItem('teamBRedCards', teamBRedCards);
    }
    updateDisplay();
}

function subYellowCard(team) {
    if (team === 'A' && teamAYellowCards > 0) {
        teamAYellowCards--;
        localStorage.setItem('teamAYellowCards', teamAYellowCards);
    } else if (team === 'B' && teamBYellowCards > 0) {
        teamBYellowCards--;
        localStorage.setItem('teamBYellowCards', teamBYellowCards);
    }
    updateDisplay();
}   

// Lance le chrono et synchronise entre les pages
function startChrono() {
    let minutes = parseInt(localStorage.getItem('minutes')) || 0;
    let seconds = parseInt(localStorage.getItem('seconds')) || 0;
    chrono = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            minutes++;
            seconds = 0;
        }
        localStorage.setItem('minutes', minutes);
        localStorage.setItem('seconds', seconds);
        
        const chronoElements = document.querySelectorAll('#gameChrono');
        chronoElements.forEach(element => {
            element.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (minutes >= 20) {
                element.style.color = 'red';
            }
        });
    }, 1000);
    chronoRunning = true;
}

// Arrête le chrono
function stopChrono() {
    if (chronoRunning) {
        clearInterval(chrono);
        chronoRunning = false;
    }
}

// Mets à jour l'affichage du chrono
function updateChronoDisplay() {
    let minutes = parseInt(localStorage.getItem('minutes')) || 0;
    let seconds = parseInt(localStorage.getItem('seconds')) || 0;
    const chronoElements = document.querySelectorAll('#gameChrono');
    chronoElements.forEach(element => {
        element.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (minutes >= 20) {
            element.style.color = 'red';
        }
    });
}

// Change la main de service
function ChangeServer() {
    server = server === 'A' ? 'B' : 'A';
    localStorage.setItem('server', server);
    updateServer();
}

// Mets à jour l'affichage du serveur
function updateServer() {
    const server = localStorage.getItem('server') || 'A';
    const ballIconA = document.getElementById('ballIconA');
    const ballIconB = document.getElementById('ballIconB');
    
    if (server === 'A') {
        ballIconA.style.opacity = 1;
        ballIconB.style.opacity = 0;
    } else {
        ballIconA.style.opacity = 0;
        ballIconB.style.opacity = 1;
    }
}

// Ouvre la fenêtre d'affichage des scores
function openScoreDisplay() {
    window.open('affichage_score_volleyball.html', 'scoreDisplay');
}

// Ajoute un écouteur d'événements pour le stockage
window.addEventListener('storage', (e) => {
    updateDisplay();
});

// Efface les données de localStorage lors du rechargement de la page de contrôle
window.addEventListener('beforeunload', () => {
    localStorage.removeItem('teamAScore');
    localStorage.removeItem('teamBScore');
    localStorage.removeItem('teamAYellowCards');
    localStorage.removeItem('teamBYellowCards');
    localStorage.removeItem('teamARedCards');
    localStorage.removeItem('teamBRedCards');
    localStorage.removeItem('minutes');
    localStorage.removeItem('seconds');
    localStorage.removeItem('teamAName');
    localStorage.removeItem('teamBName');
    localStorage.removeItem('matchType');
    localStorage.removeItem('server');
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('teamA')) {
        // Page de contrôle
        document.getElementById('teamA').addEventListener('change', updateTeams);
        document.getElementById('teamB').addEventListener('change', updateTeams);
        document.getElementById('matchTypeSelector').addEventListener('change', updateMatchType);
    }
    updateDisplay();
    updateChronoDisplay(); // Ajout de cette ligne pour s'assurer que le chrono est mis à jour au chargement de la page
});

// Raccourcis clavier
document.addEventListener('keydown', function(event) {
    if (event.repeat) return; // Évite les répétitions si la touche est maintenue

    switch (event.key.toLowerCase()) {
        case '1': 
        case 'a':
            addPoint('A');
            break;
        case '2': 
        case 'z':
            addPoint('B');
            break;
        case '3': 
        case 'e':
            subPoint('A');
            break;
        case '4': 
        case 'r':
            subPoint('B');
            break;
        case '5': 
        case 't':
            addYellowCard('A');
            break;
        case '6': 
        case 'y':
            addYellowCard('B');
            break;

        case '7':
        case 'u':
            subYellowCard('A');
            break;
        case '8':
        case 'i':
            subYellowCard('B');
            break;
        case '9':
        case 'o':
            addRedCard('A');
            break;
        case '0':
        case 'p':
            addRedCard('B');
            break;
        case 's':
            startChrono();
            break;
        case 'd':
            stopChrono();
            break;
        case 'f':
            ChangeServer();
            break;
        case 'c':
            openScoreDisplay();
            break;
    }
});