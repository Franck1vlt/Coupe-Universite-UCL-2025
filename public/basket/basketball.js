/**
 * Basketball.js - Gestion des fonctionnalités de la table de marquage
 */

// Variables pour les chronos
let gameSeconds = 9 * 60; // 1 minute en secondes (modifié de 9 minutes)
let gameMilli = 0; // Millisecondes pour le chrono principal
let shotClockSeconds = 24;
let shotClockMilli = 0; // Millisecondes pour le shot clock
let timerInterval = null;
let shotClockInterval = null;
let isTimerRunning = false;

// Variables pour les raccourcis clavier
let isMultiKeyPressed = false;
let isSlashKeyPressed = false;
let activeKeys = new Set(); // Ensemble pour stocker toutes les touches actuellement enfoncées

// Gestionnaire d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les chronos
    displayGameTime();
    displayShotClock();
    
    // Si on est sur la page de marquage, mettre le statut en "en cours"
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    if (matchId) {
        updateMatchStatus(matchId, 'en_cours');
    }
    
    // Remplacer les gestionnaires d'événements clavier
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
});

// Fonctions de gestion du chrono
function startTimers() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        // Utiliser un intervalle de 100ms pour une mise à jour plus fluide
        timerInterval = setInterval(updateGameTimer, 100);
        shotClockInterval = setInterval(updateShotClock, 100);
    }
}

function stopTimers() {
    clearInterval(timerInterval);
    clearInterval(shotClockInterval);
    isTimerRunning = false;
}

function updateGameTimer() {
    // Décrémenter les millisecondes de 100 à chaque appel
    gameMilli -= 100;
    
    // Si les millisecondes sont négatives, décrémenter une seconde
    if (gameMilli < 0) {
        if (gameSeconds > 0) {
            gameSeconds--;
            gameMilli = 900; // Réinitialiser à 900ms (équivalent à 0.9s)
        } else {
            gameSeconds = 0;
            gameMilli = 0;
            stopTimers();
            playBuzzer();
            return;
        }
    }
    
    displayGameTime();
    // Appel explicite pour mettre à jour les données en direct
    updateLiveData();
}

function updateShotClock() {
    // Décrémenter les millisecondes de 100 à chaque appel
    shotClockMilli -= 100;
    
    // Si les millisecondes sont négatives, décrémenter une seconde
    if (shotClockMilli < 0) {
        if (shotClockSeconds > 0) {
            shotClockSeconds--;
            shotClockMilli = 900; // Réinitialiser à 900ms
        } else {
            // Le chronomètre de tir a atteint 0
            shotClockSeconds = 0;
            shotClockMilli = 0;
            
            // Arrêter les deux chronomètres
            stopTimers();
            
            // Jouer le buzzer
            playBuzzer();
            
            // Réinitialiser le chronomètre de tir à 24s sans redémarrer
            shotClockSeconds = 24;
            shotClockMilli = 0;
            displayShotClock();
            
            // Ne pas relancer les chronomètres, ils resteront arrêtés
            return;
        }
    }
    
    displayShotClock();
    updateLiveData();
}

// Nouveau gestionnaire keydown avec logs détaillés
function handleKeyDown(event) {
    console.log('Touche pressée:', event.key);
    
    // Ajouter la touche à l'ensemble des touches actives
    activeKeys.add(event.key);
    
    // Afficher toutes les touches actuellement actives
    console.log('Touches actives:', Array.from(activeKeys));
    
    // Vérifier les combinaisons de touches à chaque appui
    checkKeyCombinations();
}

// Nouveau gestionnaire keyup avec logs
function handleKeyUp(event) {
    console.log('Touche relâchée:', event.key);
    
    // Retirer la touche de l'ensemble des touches actives
    activeKeys.delete(event.key);
    
    // Afficher les touches restantes actives
    console.log('Touches actives après relâchement:', Array.from(activeKeys));
}

// Fonction qui vérifie les combinaisons de touches actives - avec logs
function checkKeyCombinations() {
    // Touche individuelle de contrôle
    if (activeKeys.has('9')) {
        console.log('Action détectée: Start (9)');
        startTimers();
        activeKeys.delete('9'); // Éviter les déclenchements multiples
    }
    
    if (activeKeys.has('7')) {
        console.log('Action détectée: Stop (7)');
        stopTimers();
        activeKeys.delete('7');
    }
    
    if (activeKeys.has('4')) {
        console.log('Action détectée: Reset Shot Clock 24s (4)');
        resetShotClock();
        activeKeys.delete('4');
    }
    
    if (activeKeys.has('6')) {
        console.log('Action détectée: Set Shot Clock 14s (6)');
        setShotClock(14);
        activeKeys.delete('6');
    }
    
    // Nouvelle touche pour ajouter 1 seconde
    if (activeKeys.has('1')) {
        console.log('Action détectée: Ajouter 1 seconde (1)');
        addSecond();
        activeKeys.delete('1');
    }

    if (activeKeys.has('0')) {
        console.log('Action détectée: Buzzer (0)');
        playBuzzer();
        activeKeys.delete('0');
    }
    
    
    // Vérifier explicitement si les combinaisons de touches sont présentes
    console.log('Vérification des combinaisons:');
    console.log('/ présent?', activeKeys.has('/'));
    console.log('* présent?', activeKeys.has('*'));
    
    // Combinaisons pour l'équipe A (avec la touche '/')
    if (activeKeys.has('/')) {
        if (activeKeys.has('-')) {
            console.log('Action détectée: Équipe A +1 point (/ + -)');
            addScore('A', 1);
            activeKeys.delete('-');
        }
        
        if (activeKeys.has('+')) {
            console.log('Action détectée: Équipe A +2 points (/ + +)');
            addScore('A', 2);
            activeKeys.delete('+');
        }
        
        if (activeKeys.has('Enter')) {
            console.log('Action détectée: Équipe A +3 points (/ + Enter)');
            addScore('A', 3);
            activeKeys.delete('Enter');
        }
        
        // Nouvelle combinaison pour enlever une seconde pour l'équipe A
        if (activeKeys.has('.')) {
            console.log('Action détectée: Équipe A -1 point (/ + .)');
            supScore('A', 1);
            activeKeys.delete('.');
        }
    }
    
    // Combinaisons pour l'équipe B (avec la touche '*')
    if (activeKeys.has('*')) {
        if (activeKeys.has('-')) {
            console.log('Action détectée: Équipe B +1 point (* + -)');
            addScore('B', 1);
            activeKeys.delete('-');
        }
        
        if (activeKeys.has('+')) {
            console.log('Action détectée: Équipe B +2 points (* + +)');
            addScore('B', 2);
            activeKeys.delete('+');
        }
        
        if (activeKeys.has('Enter')) {
            console.log('Action détectée: Équipe B +3 points (* + Enter)');
            addScore('B', 3);
            activeKeys.delete('Enter');
        }
        
        // Nouvelle combinaison pour enlever une seconde pour l'équipe B
        if (activeKeys.has('.')) {
            console.log('Action détectée: Équipe B -1 points (* + .)');
            supScore('B', 1);
            activeKeys.delete('.');
        }
    }
}

// Ajouter une nouvelle fonction pour enlever une seconde
function removeSecond() {
    if (gameSeconds > 0) {
        gameSeconds--;
        displayGameTime();
    }
}

function resetGameTimer() {
    // Ne plus réinitialiser gameSeconds, mais seulement le chrono de tir
    resetShotClock();
}

function resetShotClock() {
    shotClockSeconds = 24;
    shotClockMilli = 0;
    displayShotClock();
}

function setShotClock(seconds) {
    shotClockSeconds = seconds;
    shotClockMilli = 0; // Réinitialisation des millisecondes à 0
    displayShotClock();
}

function displayGameTime() {
    const minutes = Math.floor(gameSeconds / 60);
    const seconds = gameSeconds % 60;
    // Formater les millisecondes (uniquement le premier chiffre)
    const millis = Math.floor(gameMilli / 100);
    
    const timerElement = document.getElementById('gameTimer');
    
    if (timerElement) {
        // Revenir au comportement original - toujours afficher au format minutes:secondes.millisecondes
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${millis}`;
        
        // Mise à jour directe du localStorage après chaque affichage du temps
        const currentData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
        currentData.gameTimer = timerElement.textContent;
        
        // Ajouter les valeurs brutes des chronomètres pour que la page d'affichage puisse faire ses propres calculs
        currentData.gameTimeInSeconds = gameSeconds + (gameMilli / 1000);
        currentData.shotClockTimeInSeconds = shotClockSeconds + (shotClockMilli / 1000);
        
        localStorage.setItem('liveMatchData', JSON.stringify(currentData));
    }
}

function displayShotClock() {
    // Formater les millisecondes (uniquement le premier chiffre)
    const millis = Math.floor(shotClockMilli / 100);
    
    const clockElement = document.getElementById('shotClock');
    if (clockElement) {
        clockElement.textContent = `${shotClockSeconds}.${millis}`;
        // Mise à jour directe du localStorage après chaque affichage du temps
        const currentData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
        currentData.shotClock = clockElement.textContent;
        localStorage.setItem('liveMatchData', JSON.stringify(currentData));
    }
}

function addSecond() {
    gameSeconds++;
    displayGameTime();
}

function playBuzzer() {
    try {
        const buzzer = new Audio('buzzer.mp3');
        buzzer.play().catch(e => console.warn("Impossible de jouer le buzzer:", e));
    } catch (e) {
        console.warn("Erreur lors de la lecture du buzzer:", e);
    }
}

// Fonctions de gestion des points et fautes
function addScore(team, points) {
    const scoreElement = document.getElementById(`team${team}Score`);
    if (scoreElement) {
        const currentScore = parseInt(scoreElement.textContent);
        scoreElement.textContent = currentScore + points;
        updateLiveData();
    }
}

function supScore(team, points) {
    const scoreElement = document.getElementById(`team${team}Score`);
    if (scoreElement) {
        const currentScore = parseInt(scoreElement.textContent);
        if (currentScore >= points) {
            scoreElement.textContent = currentScore - points;
            updateLiveData();
        }
    }
}

function addFoul(team) {
    const foulElement = document.getElementById(`team${team}FoulCount`);
    if (foulElement) {
        const currentFouls = parseInt(foulElement.textContent);
        foulElement.textContent = currentFouls + 1;
        updateLiveData();
    }
}

function supFoul(team) {
    const foulElement = document.getElementById(`team${team}FoulCount`);
    if (foulElement) {
        const currentFouls = parseInt(foulElement.textContent);
        if (currentFouls > 0) {
            foulElement.textContent = currentFouls - 1;
            updateLiveData();
        }
    }
}

function togglePeriod() {
    const periodToggle = document.getElementById('periodToggle');
    const periodText = document.getElementById('period');
    if (periodToggle && periodText) {
        const currentPeriod = periodToggle.checked ? 2 : 1;
        periodText.textContent = `MT${currentPeriod}`;
        
        // À chaque changement de période, réinitialiser les deux chronos
        gameSeconds = 9 * 60;
        gameMilli = 0;
        shotClockSeconds = 24;
        shotClockMilli = 0;
        displayGameTime();
        displayShotClock();
        
        updateLiveData();
    }
}

// Mise à jour des données en direct
function updateLiveData() {
    try {
        const liveData = {
            score1: document.getElementById('teamAScore')?.textContent || '0',
            score2: document.getElementById('teamBScore')?.textContent || '0',
            gameTimer: document.getElementById('gameTimer')?.textContent || '00:00.0',
            shotClock: document.getElementById('shotClock')?.textContent || '24.0',
            period: document.getElementById('period')?.textContent || 'MT1'
        };
        
        // Mettre à jour le localStorage
        const currentData = JSON.parse(localStorage.getItem('liveMatchData') || '{}');
        localStorage.setItem('liveMatchData', JSON.stringify({
            ...currentData,
            ...liveData
        }));
    } catch (error) {
        console.error('Erreur lors de la mise à jour des données en direct:', error);
    }
}

// Mise à jour du statut d'un match avec amélioration de la synchronisation
function updateMatchStatus(matchId, status, score1 = null, score2 = null) {
    if (!matchId) return;
    
    // Mise à jour immédiate du localStorage pour une détection plus rapide
    localStorage.setItem('currentMatchState', JSON.stringify({
        matchId: matchId,
        status: status,
        timestamp: new Date().getTime()
    }));
    
    const urlParams = new URLSearchParams(window.location.search);
    const team1 = urlParams.get('team1') || document.getElementById('teamAName')?.textContent;
    const team2 = urlParams.get('team2') || document.getElementById('teamBName')?.textContent;
    const matchType = urlParams.get('matchType') || document.getElementById('matchType')?.textContent;
    
    // Si tournamentState est défini et accessible, mettre à jour directement
    if (window.opener && window.opener.tournamentState && window.opener.tournamentState.matches) {
        const match = window.opener.tournamentState.matches[matchId];
        if (match) {
            match.status = status;
            // Déclencher une mise à jour UI dans la fenêtre parente
            if (typeof window.opener.updateUI === 'function') {
                window.opener.updateUI();
            }
        }
    }
    
    // Mise à jour via l'API comme avant
    fetch('/api/matches/basket/update', {
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
            status,
            matchType
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Erreur lors de la mise à jour du match:', response.statusText);
        }
    })
    .catch(error => console.error('Erreur:', error));
}

// Fonction pour terminer un match (mise à jour)
function resetGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    
    if (!matchId) {
        console.error('ID de match non trouvé dans l\'URL');
        return;
    }
    
    const score1 = parseInt(document.getElementById('teamAScore').textContent);
    const score2 = parseInt(document.getElementById('teamBScore').textContent);
    const team1 = document.getElementById('teamAName').textContent;
    const team2 = document.getElementById('teamBName').textContent;
    const matchType = document.getElementById('matchType').textContent;
    
    if (!confirm(`Êtes-vous sûr de vouloir terminer le match avec un score de ${score1}-${score2} ?`)) {
        return;
    }

    // Déterminer le gagnant et le perdant
    let winner, loser;
    if (score1 > score2) {
        winner = team1;
        loser = team2;
    } else if (score2 > score1) {
        winner = team2;
        loser = team1;
    } else {
        // En cas d'égalité
        winner = null;
        loser = null;
    }

    // Sauvegarder dans localStorage pour mise à jour immédiate
    const currentTournament = JSON.parse(localStorage.getItem('basketTournamentState') || '{}');
    if (currentTournament.matches && currentTournament.matches[matchId]) {
        currentTournament.matches[matchId].score1 = score1;
        currentTournament.matches[matchId].score2 = score2;
        currentTournament.matches[matchId].status = 'terminé';
        currentTournament.matches[matchId].winner = winner;
        currentTournament.matches[matchId].loser = loser;
        localStorage.setItem('basketTournamentState', JSON.stringify(currentTournament));
    }

    // Sauvegarder le résultat du match via l'API
    fetch('/api/matches/basket/update', {
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
            status: 'terminé',
            winner,
            loser,
            matchType
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde du match');
        }
        // Stockage des infos du dernier match pour synchronisation
        localStorage.setItem('basketballLastMatch', JSON.stringify({
            matchId,
            score1,
            score2,
            status: 'terminé',
            winner,
            loser
        }));
        
        // IMPORTANT: Nettoyer TOUS les états liés aux matchs
        localStorage.removeItem('currentMatchState');
        localStorage.removeItem('currentMatchId');
        localStorage.removeItem('liveMatchData');
        
        // Redirection vers le tableau des matchs
        window.location.href = 'basketball.html#final-phase';
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du match');
    });
}

