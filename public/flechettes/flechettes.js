// Variables globales additionnelles pour gérer les sets
let sets = {
    teamA: 0,
    teamB: 0
};

// Variable pour stocker les points temporaires d'un joueur pendant ses 3 tirs
let currentTurnPoints = {
    "1A": 0,
    "2A": 0,
    "1B": 0,
    "2B": 0
};

// Points de départ pour chaque tour (utilisé en cas de tir manqué)
let startingTurnScores = {
    teamA: 301,
    teamB: 301
};

// Nombres de sets à atteindre pour gagner
const SETS_TO_WIN = 3;

// Compatibilité avec les variables existantes
window.currentPlayer = window.currentPlayer || "1A";
window.throwsLeft = window.throwsLeft || {
    "1A": 3,
    "2A": 3,
    "1B": 3,
    "2B": 3
};
window.scores = window.scores || {
    teamA: 301,
    teamB: 301
};
window.currentMultiplier = window.currentMultiplier || 1;

// Modification de l'ordre des joueurs
const playerOrder = ["1A", "1B", "2A", "2B"];

// Fonction pour sélectionner un joueur
function selectPlayer(playerId) {
    window.currentPlayer = playerId;
    const playerElement = document.getElementById('currentPlayer');
    if (playerElement) {
        playerElement.textContent = `Joueur actuel: ${playerId} (${window.throwsLeft[playerId]} lancers restants)`;
    }
    
    // Mettre à jour le style des boutons des joueurs
    document.querySelectorAll('.player-button').forEach(button => {
        if (button.dataset.player === playerId) {
            button.style.backgroundColor = '#4CAF50';
            button.style.transform = 'scale(1.1)';
        } else {
            button.style.backgroundColor = '#28a745';
            button.style.transform = 'scale(1)';
        }
    });

    // Si la fonction existe, mettre à jour les données
    if (typeof sendLiveUpdate === 'function') {
        sendLiveUpdate();
    }
}

// Fonction pour changer de joueur
function changePlayer() {
    let currentIndex = playerOrder.indexOf(window.currentPlayer);
    let nextIndex = (currentIndex + 1) % playerOrder.length;
    selectPlayer(playerOrder[nextIndex]);
    window.throwsLeft[window.currentPlayer] = 3; // Réinitialiser les lancers
    currentTurnPoints[window.currentPlayer] = 0; // Réinitialiser les points temporaires
}

// Fonction pour définir le multiplicateur et mettre à jour les boutons
function mulScore(multiplier) {
    window.currentMultiplier = multiplier;
    updateButtonValues();
    
    // Mettre à jour la classe active pour les boutons multiplicateurs
    document.querySelectorAll('.control-button').forEach(button => {
        if (button.textContent.includes(`x${multiplier}`)) {
            button.classList.add('active');
        } else if (!button.textContent.includes('Manqué')) {
            button.classList.remove('active');
        }
    });
}

// Fonction pour soustraire les points après un lancer
function supScore(points) {
    if (!window.currentPlayer) {
        alert("Veuillez sélectionner un joueur avant de jouer.");
        return;
    }
    
    // Si ce n'est pas une correction (+1) et qu'il n'y a plus de lancers
    if (points !== 1 && window.throwsLeft[window.currentPlayer] <= 0) {
        alert("Ce joueur a déjà utilisé ses 3 fléchettes.");
        return;
    }
    
    let team = window.currentPlayer.endsWith("A") ? "teamA" : "teamB";
    
    // Si c'est le premier tir du joueur, sauvegarder le score actuel
    if (window.throwsLeft[window.currentPlayer] === 3) {
        startingTurnScores[team] = window.scores[team];
        currentTurnPoints[window.currentPlayer] = 0;
    }
    
    // Traiter un tir manqué (0 point)
    if (points === 0) {
        // Un tir manqué compte simplement comme 0 point
        window.throwsLeft[window.currentPlayer]--;
        
        // Mettre à jour l'affichage du joueur actuel avec le nombre de lancers restants
        const playerElement = document.getElementById('currentPlayer');
        if (playerElement) {
            playerElement.textContent = `Joueur actuel: ${window.currentPlayer} (${window.throwsLeft[window.currentPlayer]} lancers restants)`;
        }
        
        // Changer de joueur si nécessaire
        if (window.throwsLeft[window.currentPlayer] === 0) {
            changePlayer();
        }
        
        return;
    }
    
    // Considérer le multiplicateur sauf pour les corrections
    const finalPoints = (points === 1) ? points : (points * window.currentMultiplier);
    
    // Poursuivre normalement pour un tir réussi
    let newScore = window.scores[team] - finalPoints;
    
    if (newScore < 0) {
        alert("Dépassement! Vous perdez tous les points de ce tour.");
        // Annuler tous les points marqués pendant ce tour
        window.scores[team] = startingTurnScores[team];
        currentTurnPoints[window.currentPlayer] = 0;
        
        // Mettre à jour l'affichage
        updateScoreDisplay();
        
        // Réinitialiser les lancers et passer au joueur suivant
        window.throwsLeft[window.currentPlayer] = 0;
        changePlayer();
        return;
    }
    
    // Mettre à jour le score
    window.scores[team] = newScore;
    if (points !== 1) {
        window.throwsLeft[window.currentPlayer]--;
        // Mettre à jour l'affichage du joueur actuel avec le nombre de lancers restants
        const playerElement = document.getElementById('currentPlayer');
        if (playerElement) {
            playerElement.textContent = `Joueur actuel: ${window.currentPlayer} (${window.throwsLeft[window.currentPlayer]} lancers restants)`;
        }
    }
    updateScoreDisplay();
    
    // Vérifier si une équipe a gagné un set (atteint exactement 0)
    if (newScore === 0) {
        // Incrémenter le compteur de sets
        sets[team]++;
        
        const setsElement = document.getElementById(team + 'Sets');
        if (setsElement) {
            setsElement.textContent = sets[team];
        }
        
        // Vérifier si l'équipe a gagné le match (3 sets)
        if (sets[team] >= SETS_TO_WIN) {
            const winningTeam = team === 'teamA' ? document.getElementById('teamAName').textContent : document.getElementById('teamBName').textContent;
            alert(`${winningTeam} a gagné le match avec ${sets[team]} sets!`);
            // Envoyer les données de fin de match
            finishGame(team === 'teamA');
        } else {
            // Annoncer le gain du set
            const teamName = team === 'teamA' ? document.getElementById('teamAName').textContent : document.getElementById('teamBName').textContent;
            alert(`${teamName} remporte le set! Score des sets: ${sets.teamA}-${sets.teamB}`);
            
            // Réinitialiser pour le prochain set
            window.scores.teamA = 301;
            window.scores.teamB = 301;
            startingTurnScores.teamA = 301;
            startingTurnScores.teamB = 301;
            
            // Réinitialiser les lancers pour tous les joueurs
            Object.keys(window.throwsLeft).forEach(player => {
                window.throwsLeft[player] = 3;
                currentTurnPoints[player] = 0;
            });
            
            // Commencer le nouveau set avec le premier joueur
            selectPlayer("1A");
        }
    }
    
    // Changer de joueur seulement si ce n'est pas une correction et que les lancers sont épuisés
    if (points !== 1 && window.throwsLeft[window.currentPlayer] === 0) {
        changePlayer();
    }
    
    // Réinitialiser le multiplicateur après chaque lancer
    window.currentMultiplier = 1;
    updateButtonValues();
    document.querySelectorAll('.control-button').forEach(button => {
        if (button.textContent.includes('x1')) {
            button.classList.add('active');
        } else if (!button.textContent.includes('Manqué')) {
            button.classList.remove('active');
        }
    });
}

// Fonction pour ajouter des points (correction)
function addScore(points) {
    if (!window.currentPlayer) {
        alert("Veuillez sélectionner un joueur avant de jouer.");
        return;
    }
    
    let team = window.currentPlayer.endsWith("A") ? "teamA" : "teamB";
    let newScore = window.scores[team] + (points * window.currentMultiplier);
    
    // Vérifier que le score ne dépasse pas 301
    if (newScore > 301) {
        alert("Le score ne peut pas dépasser 301 !");
        return;
    }
    
    window.scores[team] = newScore;
    
    // Mise à jour des points du tour si nécessaire
    if (window.throwsLeft[window.currentPlayer] < 3) {
        currentTurnPoints[window.currentPlayer] -= (points * window.currentMultiplier);
        if (currentTurnPoints[window.currentPlayer] < 0) currentTurnPoints[window.currentPlayer] = 0;
    }
    
    updateScoreDisplay();
}

// Fonction pour mettre à jour l'affichage des scores
function updateScoreDisplay() {
    const teamAScore = document.getElementById('teamAScore');
    const teamBScore = document.getElementById('teamBScore');
    
    if (teamAScore) teamAScore.textContent = window.scores.teamA;
    if (teamBScore) teamBScore.textContent = window.scores.teamB;
    
    // Si la fonction existe, envoyer la mise à jour
    if (typeof sendLiveUpdate === 'function') {
        sendLiveUpdate();
    }
}

// Fonction pour mettre à jour les valeurs des boutons
function updateButtonValues() {
    const buttons = document.querySelectorAll('.points-button:not(.correction-button):not(.missed-shot-button)');
    buttons.forEach(button => {
        if (!button.dataset.originalValue) return;
        
        const originalValue = parseInt(button.dataset.originalValue);
        // Ne pas multiplier 25 et 50
        if (originalValue !== 25 && originalValue !== 50) {
            button.textContent = originalValue * window.currentMultiplier;
        }
    });
}

// Fonction pour générer les boutons de points (1 à 50)
function generatePointButtons() {
    const pointsContainer = document.getElementById('pointsButtons');
    if (!pointsContainer) {
        console.error("Conteneur de points non trouvé");
        return;
    }
    
    console.log("Génération des boutons de points...");
    
    // Vider le conteneur
    pointsContainer.innerHTML = '';
    
    // Ajouter les boutons de 1 à 20
    for (let i = 1; i <= 20; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = 'points-button';
        button.dataset.originalValue = i; // Stockage de la valeur originale pour le multiplicateur
        button.onclick = function() {
            supScore(i);
        };
        pointsContainer.appendChild(button);
    }
    
    // Ajouter le bouton pour le bullseye (25 points)
    const bullseyeButton = document.createElement('button');
    bullseyeButton.textContent = '25';
    bullseyeButton.className = 'points-button';
    bullseyeButton.style.backgroundColor = '#c00'; // Rouge pour le bullseye
    bullseyeButton.dataset.originalValue = 25;
    bullseyeButton.onclick = function() {
        supScore(25);
    };
    pointsContainer.appendChild(bullseyeButton);
    
    // Ajouter le bouton pour le bullseye double (50 points)
    const bullseyeDoubleButton = document.createElement('button');
    bullseyeDoubleButton.textContent = '50';
    bullseyeDoubleButton.className = 'points-button';
    bullseyeDoubleButton.style.backgroundColor = '#900'; // Rouge plus foncé pour le bullseye double
    bullseyeDoubleButton.dataset.originalValue = 50;
    bullseyeDoubleButton.onclick = function() {
        supScore(50);
    };
    pointsContainer.appendChild(bullseyeDoubleButton);
    
    // Ajouter le bouton de correction +1
    const correctionButton = document.createElement('button');
    correctionButton.textContent = '+1';
    correctionButton.className = 'points-button correction-button';
    correctionButton.style.backgroundColor = '#ff9800'; // Orange pour le bouton de correction
    correctionButton.dataset.originalValue = 1;
    correctionButton.onclick = function() {
        addScore(1); // Appel à addScore pour ajouter des points
    };
    pointsContainer.appendChild(correctionButton);
    
    console.log("Boutons de points générés avec succès");
}

// Fonction pour initialiser l'affichage des sets
function initSetDisplay() {
    // Le HTML contient déjà les éléments pour les sets, on se contente de vérifier et d'initialiser
    const teamASets = document.getElementById('teamASets');
    const teamBSets = document.getElementById('teamBSets');
    
    if (teamASets) {
        teamASets.textContent = sets.teamA;
    }
    
    if (teamBSets) {
        teamBSets.textContent = sets.teamB;
    }
    
    // Ajouter du CSS pour le style des sets si nécessaire
    const style = document.createElement('style');
    style.textContent = `
        .control-button.active {
            background-color: #28a745;
            transform: scale(1.05);
        }
        
        .points-button {
            margin: 5px;
            width: 50px;
            height: 50px;
            font-size: 18px;
            font-weight: bold;
            border: none;
            border-radius: 50%;
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.2s;
        }
        
        .points-button:hover {
            background-color: #3e8e41;
            transform: scale(1.05);
        }
        
        .correction-button {
            background-color: #ff9800;
        }
        
        .correction-button:hover {
            background-color: #e68a00;
        }
    `;
    document.head.appendChild(style);
}

// Fonction pour terminer le match et enregistrer le résultat
function finishGame(teamAWins) {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) {
        alert("Impossible de terminer le match: ID de match manquant");
        return;
    }
    
    if (!confirm(`Voulez-vous vraiment terminer le match avec un score de ${sets.teamA}-${sets.teamB} ?`)) return;
    
    try {
        // Récupérer les noms d'équipe
        const team1 = document.getElementById('teamAName').textContent;
        const team2 = document.getElementById('teamBName').textContent;
        
        // Déterminer le gagnant
        const winner = sets.teamA > sets.teamB ? team1 : team2;
        const loser = sets.teamA > sets.teamB ? team2 : team1;
        
        // Mettre à jour l'état du tournoi
        const tournamentState = JSON.parse(localStorage.getItem('flechettesTournamentState') || '{"matches":{}}');
        
        if (tournamentState.matches[matchId]) {
            // Mettre à jour les informations du match
            tournamentState.matches[matchId] = {
                ...tournamentState.matches[matchId],
                status: 'terminé',
                score1: sets.teamA,
                score2: sets.teamB,
                winner: winner,
                loser: loser
            };
            
            // Sauvegarder les changements
            localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
            
            // Envoyer les données via WebSocket ou API si disponible
            if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                socket.emit('update_match', {
                    matchId: matchId,
                    status: 'terminé',
                    score1: sets.teamA,
                    score2: sets.teamB,
                    winner: winner,
                    loser: loser
                });
                
                console.log("Résultats du match envoyés via WebSocket");
            } else {
                // Fallback HTTP si WebSocket n'est pas disponible
                fetch('/api/match-status/' + matchId, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'terminé',
                        score1: sets.teamA,
                        score2: sets.teamB,
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Résultats du match envoyés via HTTP", data);
                })
                .catch(error => {
                    console.error("Erreur lors de l'envoi des résultats:", error);
                });
            }
            
            // Rediriger vers la page principale après un court délai
            setTimeout(() => {
                alert("Match terminé avec succès! Redirection vers le tableau des matchs...");
                window.location.href = 'flechettes.html';
            }, 1000);
        } else {
            alert("Erreur: Match non trouvé dans l'état du tournoi.");
        }
    } catch (error) {
        console.error("Erreur lors de la finalisation du match:", error);
        alert("Erreur lors de la finalisation du match: " + error.message);
    }
}

// Document ready event
document.addEventListener("DOMContentLoaded", function() {
    try {
        // Initialiser l'affichage des sets
        initSetDisplay();
        
        // Générer les boutons de points
        generatePointButtons();
        
        // Initialiser les boutons de multiplicateur existants
        document.querySelectorAll('.control-button').forEach(button => {
            if (button.textContent.includes('x1')) {
                button.classList.add('active');
            }
        });
        
        console.log("Initialisation du jeu de fléchettes (version sets) terminée");
    } catch (e) {
        console.error("Erreur lors de l'initialisation du jeu de fléchettes:", e);
    }
});

// Fonction pour mettre à jour l'affichage des scores dans flechettes.html
function updateUI() {
    Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
        const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
        if (!matchElement) return;
        
        matchElement.setAttribute('data-status', matchData.status);
        
        const teamDivs = matchElement.querySelectorAll('.team');
        if (teamDivs.length < 2) return;
        
        // Passer l'objet match complet au lieu de juste le winner
        fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData);
        fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData);
        
        // Mettre à jour l'heure et le statut
        const infoContainer = matchElement.querySelector('.match-info-container');
        if (infoContainer) {
            const timeDiv = infoContainer.querySelector('.match-time');
            const statusDiv = infoContainer.querySelector('.match-status');
            const matchTypeDiv = infoContainer.querySelector('.match-type');

            if (timeDiv) timeDiv.textContent = matchData.time || '';
            if (statusDiv) statusDiv.textContent = matchData.status.replace('_', ' ');

            // Correction : Afficher le type de match correctement
            if (matchTypeDiv) {
                matchTypeDiv.textContent = matchData.matchType.includes('poule') 
                    ? 'Match de Poule' 
                    : matchData.matchType.replace('_', ' ');
            }
        }
    });
    
    // Mise à jour automatique du classement après chaque changement
    updateRankingDisplay();
    
    // Mise à jour du champion
    const finalMatch = tournamentState.matches[13];
    const championDiv = document.getElementById('champion');
    if (championDiv) {
        if (finalMatch && finalMatch.winner) {
            championDiv.textContent = finalMatch.winner;
            championDiv.style.display = 'block';
            // Ajouter une animation pour le champion
        } else {
            championDiv.textContent = 'À déterminer';
            championDiv.style.display = 'block';
            championDiv.classList.remove('champion-crowned');
        }
    }

    // Sauvegarde automatique de l'état
    localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));

    // Ajouter cette ligne après la mise à jour des matchs
    updateGroupStandings();

    // Vérifier si tous les matchs de poule sont terminés
    const pouleAMatchesFinished = checkPouleMatchesFinished('A'); // Matchs 1-6
    const pouleBMatchesFinished = checkPouleMatchesFinished('B'); // Matchs 7-16

    if (pouleAMatchesFinished && pouleBMatchesFinished) {
        console.log("Tous les matchs de poule sont terminés, configuration des demi-finales et matchs de classement...");
        setupSemiFinals();
        setupClassificationMatches();
    }
}

// Fonction modifiée pour afficher le score avec les sets
function fillTeamDiv(teamDiv, teamName, score, matchData) {
    const nameDiv = teamDiv.querySelector('.team-name');
    const scoreDiv = teamDiv.querySelector('.score');
    if (!nameDiv || !scoreDiv) return;

    if (!teamName) {
        nameDiv.innerHTML = `<div class='team-logo'></div>-`;
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser', 'draw');
        return;
    }

    const teamObj = teams[teamName];
    const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
    nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;

    if (score === null || score === undefined) {
        scoreDiv.textContent = '-';
        teamDiv.classList.remove('winner', 'loser', 'draw');
    } else {
        // Utiliser le nombre de sets comme score
        scoreDiv.textContent = score;
        
        // Si les scores sont égaux, appliquer le style de match nul
        if (matchData.winner === null && matchData.score1 === matchData.score2) {
            teamDiv.classList.add('draw');
            teamDiv.classList.remove('winner', 'loser');
            scoreDiv.classList.add('draw');
        } else if (matchData.winner) {
            teamDiv.classList.remove('draw');
            scoreDiv.classList.remove('draw');
            if (teamName === matchData.winner) {
                teamDiv.classList.add('winner');
                teamDiv.classList.remove('loser');
            } else {
                teamDiv.classList.add('loser');
                teamDiv.classList.remove('winner');
            }
        } else {
            teamDiv.classList.remove('winner', 'loser', 'draw');
            scoreDiv.classList.remove('draw');
        }
    }
}




// Exposer les fonctions et variables globalement pour que marquage.html puisse y accéder
window.selectPlayer = selectPlayer;
window.updateScoreDisplay = updateScoreDisplay;
window.supScore = supScore;
window.mulScore = mulScore;
window.addScore = addScore;
window.resetGame = finishGame;
window.finishGame = finishGame;
window.changePlayer = changePlayer;
window.sets = sets;
window.currentTurnPoints = currentTurnPoints;
window.startingTurnScores = startingTurnScores;
window.generatePointButtons = generatePointButtons;
window.updateButtonValues = updateButtonValues;