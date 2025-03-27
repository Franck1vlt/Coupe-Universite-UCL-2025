const TEAMS = [
    'ESPAS-ESTICE',
    'ESPOL',
    'ESSLIL',
    'FGES',
    'FLD',
    'FLSH',
    'FMMS',
    'ICAM',
    'IESEG',
    'IKPO',
    'ISTC',
    'JUNIA',
    'LiDD',
    'PIKTURA',
    'USCHOOL'
];

let rankings = [];

let socket;
let socketConnected = false;

function initWebSocket() {
    try {
        // Vérifier si Socket.IO est disponible
        if (typeof io === 'undefined') {
            console.warn('Socket.IO non disponible - mode hors-ligne activé');
            socketConnected = false;
            loadRankingsFromLocal(); // Charger depuis le localStorage
            return;
        }
        
        socket = io();
        
        socket.on('connect', () => {
            console.log('WebSocket connecté');
            socketConnected = true;
            // Charger les données dès la connexion établie
            socket.emit('get_ambiance_rankings');
        });

        socket.on('ambiance_rankings', (data) => {
            console.log('Rankings reçus:', data);
            displayRankings(data.rankings || []);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
            socketConnected = false;
            loadRankingsFromLocal(); // Fallback vers local
        });

    } catch (error) {
        console.error('Erreur WebSocket:', error);
        socketConnected = false;
        loadRankingsFromLocal(); // Fallback vers local
    }
}

async function initializeRankings() {
    try {
        // Charger d'abord depuis le localStorage
        const savedRankings = loadRankingsFromLocal();
        if (savedRankings) {
            rankings = savedRankings;
        } else {
            // Si pas de données locales, initialiser avec des points à 0
            rankings = TEAMS.map(team => ({
                name: team,
                points: 0
            }));
        }
        
        // Afficher les données initiales
        displayRanking();

        // Ensuite essayer de charger depuis le serveur via WebSocket
        if (socket && socketConnected) {
            return new Promise((resolve, reject) => {
                socket.emit('get_ambiance_rankings');
                
                // Augmenter le timeout à 15 secondes
                const timeoutId = setTimeout(() => {
                    console.log('Timeout WebSocket - utilisation des données locales');
                    resolve(false);
                }, 15000);

                socket.once('ambiance_rankings', (data) => {
                    clearTimeout(timeoutId);
                    if (data && data.rankings) {
                        // Mettre à jour uniquement les points des équipes existantes
                        data.rankings.forEach(serverTeam => {
                            const team = rankings.find(t => t.name === serverTeam.nom_equipe);
                            if (team) {
                                team.points = parseInt(serverTeam.points) || 0;
                            }
                        });
                        displayRanking();
                    }
                    resolve(true);
                });
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        // En cas d'erreur, utiliser les données locales
        loadRankingsFromLocal();
    }
}

// Modifier displayRanking pour mieux gérer l'affichage
function displayRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    // S'assurer que toutes les équipes sont présentes
    TEAMS.forEach(teamName => {
        if (!rankings.find(r => r.name === teamName)) {
            rankings.push({ name: teamName, points: 0 });
        }
    });

    // Trier par points (décroissant) puis par nom
    const sortedRankings = [...rankings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
    });

    rankingList.innerHTML = '';
    sortedRankings.forEach((team, index) => {
        const position = index + 1;
        rankingList.innerHTML += `
            <div class="ranking-row ${position <= 3 ? `highlight-${position}` : ''}">
                <div class="rank">${position}</div>
                <div class="teamname">
                    <img src="../img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                    ${team.name}
                </div>
                <div class="points">${team.points}</div>
            </div>
        `;
    });

    // Sauvegarder après chaque mise à jour
    saveRankingsToLocal();
}

// Modifier la fonction updatePoints pour gérer le mode hors-ligne
async function updatePoints(action) {
    try {
        const teamSelect = document.getElementById('teamSelect');
        const pointsInput = document.getElementById('pointsInput');
        
        const selectedTeam = teamSelect.value;
        const pointsToAdd = parseInt(pointsInput.value);

        if (!selectedTeam) {
            throw new Error('Veuillez sélectionner une équipe');
        }
        if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
            throw new Error('Veuillez entrer un nombre de points valide');
        }

        // Trouver ou créer l'équipe dans le tableau rankings
        let team = rankings.find(t => t.name === selectedTeam);
        if (!team) {
            team = { name: selectedTeam, points: 0 };
            rankings.push(team);
        }

        const newPoints = action === 'add' ? 
            team.points + pointsToAdd : 
            Math.max(0, team.points - pointsToAdd);
        
        team.points = newPoints;

        // Sauvegarder immédiatement
        if (!saveRankingsToLocal()) {
            throw new Error('Erreur lors de la sauvegarde locale');
        }

        // Mettre à jour l'affichage
        displayRanking();

        // Synchroniser avec le serveur si disponible
        if (socket && socketConnected) {
            socket.emit('update_ambiance_points', {
                teamName: selectedTeam,
                points: newPoints,
                action: action
            });
        }

        // Réinitialiser le formulaire
        pointsInput.value = '';
        teamSelect.value = '';

        // Message de confirmation
        alert(`Points ${action === 'add' ? 'ajoutés' : 'retirés'} avec succès !`);

    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}

async function addPoints() {
    await updatePoints('add');
}

async function removePoints() {
    await updatePoints('sub');
}

async function resetRanking() {
    if (!confirm('Voulez-vous vraiment réinitialiser tous les points d\'ambiance ?')) {
        return;
    }

    try {
        // Réinitialiser localement d'abord
        rankings = TEAMS.map(team => ({
            name: team,
            points: 0
        }));

        // Sauvegarder en local
        saveRankingsToLocal();
        
        // Mettre à jour l'affichage
        displayRanking();

        // Tenter la synchronisation avec le serveur si disponible
        if (socket && socketConnected) {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    console.log('Timeout WebSocket - réinitialisation locale uniquement');
                    resolve(false);
                }, 5000);

                socket.emit('reset_ambiance_rankings');
                
                socket.once('ambiance_rankings_reset', () => {
                    clearTimeout(timeoutId);
                    console.log('Réinitialisation synchronisée avec le serveur');
                    resolve(true);
                });
            });
        }

        alert('Points d\'ambiance réinitialisés avec succès !');

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Les points ont été réinitialisés localement mais la synchronisation avec le serveur a échoué');
    }
}

// Exposer les fonctions nécessaires globalement
window.addPoints = addPoints;
window.removePoints = removePoints;
window.resetRanking = resetRanking;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger d'abord les données locales
    loadRankingsFromLocal();
    
    // Puis initialiser WebSocket
    initWebSocket();
    
    // Et enfin initialiser le classement
    initializeRankings();
});

// Fonctions de gestion du localStorage
function saveRankingsToLocal() {
    try {
        // S'assurer que toutes les équipes sont présentes
        const completeRankings = TEAMS.map(teamName => {
            const existingTeam = rankings.find(r => r.name === teamName);
            return {
                name: teamName,
                points: existingTeam ? parseInt(existingTeam.points) || 0 : 0
            };
        });

        // Sauvegarder dans le localStorage
        localStorage.setItem('ambianceRankings', JSON.stringify(completeRankings));
        localStorage.setItem('ambianceLastUpdate', new Date().toISOString());
        
        console.log('Données sauvegardées localement:', completeRankings);
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde locale:', error);
        return false;
    }
}

function loadRankingsFromLocal() {
    try {
        const savedData = localStorage.getItem('ambianceRankings');
        if (!savedData) {
            return null;
        }

        let loadedRankings = JSON.parse(savedData);
        
        // Vérifier et compléter les données manquantes
        loadedRankings = TEAMS.map(teamName => {
            const savedTeam = loadedRankings.find(r => r.name === teamName);
            return {
                name: teamName,
                points: savedTeam ? parseInt(savedTeam.points) || 0 : 0
            };
        });

        console.log('Données chargées depuis le localStorage:', loadedRankings);
        return loadedRankings;
    } catch (error) {
        console.error('Erreur lors du chargement local:', error);
        return null;
    }
}

async function simulateAmbianceRanking() {
    if (!confirm('Voulez-vous simuler le classement d\'ambiance ? Cela réinitialisera les points actuels.')) {
        return;
    }

    try {
        // D'abord réinitialiser tous les points
        await fetch('/api/rankings/ambiance/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        // Points à distribuer
        const pointsDistribution = [100, 80, 60, 50, 40, 30, 20, 10];
        
        // Mélanger aléatoirement les équipes
        const shuffledTeams = [...TEAMS].sort(() => Math.random() - 0.5);
        
        // Distribuer les points aux 8 premières équipes
        for (let i = 0; i < pointsDistribution.length; i++) {
            const team = shuffledTeams[i];
            const points = pointsDistribution[i];
            
            console.log(`Attribution de ${points} points à ${team}`);
            
            const response = await fetch('/api/rankings/ambiance/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamName: team,
                    points: points
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de l'attribution des points à ${team}`);
            }
        }

        // Rafraîchir l'affichage
        await initializeRankings();
        alert('Simulation du classement d\'ambiance terminée !');

    } catch (error) {
        console.error('Erreur lors de la simulation:', error);
        alert('Une erreur est survenue lors de la simulation');
    }
}

// Ajouter au bas du fichier
window.simulateAmbianceRanking = simulateAmbianceRanking;

window.resetRanking = resetRanking;
