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

async function initializeRankings() {
    try {
        const response = await fetch('/api/rankings/ambiance');
        const data = await response.json();
        
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;

        rankingList.innerHTML = '';
        
        // S'assurer que toutes les équipes sont présentes, même celles sans points
        const allTeams = new Set(TEAMS);
        const teamPoints = new Map();
        
        // Récupérer les points existants
        data.rankings.forEach(team => {
            teamPoints.set(team.nom_equipe, parseInt(team.points) || 0);
            allTeams.delete(team.nom_equipe);
        });
        
        // Ajouter les équipes manquantes avec 0 points
        allTeams.forEach(team => {
            teamPoints.set(team, 0);
        });

        // Trier les équipes par points
        const sortedTeams = Array.from(teamPoints.entries())
            .sort(([,a], [,b]) => b - a)
            .map(([name, points]) => ({ nom_equipe: name, points }));

        // Afficher le classement
        sortedTeams.forEach((team, index) => {
            const position = index + 1;
            const highlightClass = position <= 3 ? `highlight-${position}` : '';
            
            rankingList.innerHTML += `
                <div class="ranking-row ${highlightClass}">
                    <div class="rank">${position}</div>
                    <div class="team">
                        <img src="../img/${team.nom_equipe}.png" alt="${team.nom_equipe}" class="team-logo">
                        ${team.nom_equipe}
                    </div>
                    <div class="points">${team.points}</div>
                </div>
            `;
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        loadRankingsFromLocal();
    }
}

function displayRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) {
        console.error('Element rankingList non trouvé');
        return;
    }

    // Tri des équipes
    const sortedRankings = [...rankings].sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        return a.name.localeCompare(b.name);
    });

    console.log('Rankings triés avant affichage:', sortedRankings); // Debug

    rankingList.innerHTML = '';
    sortedRankings.forEach((team, index) => {
        const position = index + 1;
        const logoSrc = `../img/${team.name}.png`;
        
        const row = document.createElement('div');
        row.className = `ranking-row ${position <= 3 ? 'highlight-' + position : ''}`;
        row.innerHTML = `
            <div class="rank">${position}</div>
            <div class="team">
                <img src="${logoSrc}" alt="${team.name} logo" class="team-logo">
                ${team.name}
            </div>
            <div class="points">${team.points}</div>
        `;
        rankingList.appendChild(row);
    });
}

async function updatePoints(action) {
    try {
        const teamSelect = document.getElementById('teamSelect');
        const pointsInput = document.getElementById('pointsInput');
        
        const selectedTeam = teamSelect.value;
        const pointsToAdd = parseInt(pointsInput.value);

        if (!selectedTeam) throw new Error('Veuillez sélectionner une équipe');
        if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
            throw new Error('Veuillez entrer un nombre de points valide');
        }

        // 1. Récupérer les points actuels
        const response = await fetch('/api/rankings/ambiance');
        const data = await response.json();
        const currentTeamData = data.rankings.find(r => r.nom_equipe === selectedTeam);
        const currentPoints = currentTeamData ? parseInt(currentTeamData.points) || 0 : 0;

        console.log('Points actuels:', currentPoints);

        // 2. Calculer les nouveaux points
        const newPoints = action === 'add' ? 
            currentPoints + pointsToAdd : 
            Math.max(0, currentPoints - pointsToAdd);

        // 3. Envoyer la mise à jour avec les nouveaux points absolus
        const updateResponse = await fetch('/api/rankings/ambiance/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamName: selectedTeam,
                points: newPoints
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        // 4. Rafraîchir immédiatement
        await initializeRankings();

        // 5. Réinitialiser le formulaire
        pointsInput.value = '';
        teamSelect.value = '';

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

// Modifier la fonction resetRanking et l'exposition globale
async function resetRanking() {
    if (!confirm('Voulez-vous vraiment réinitialiser tous les points d\'ambiance ? Cette action est irréversible.')) {
        return;
    }

    try {
        // Réinitialiser les points de toutes les équipes en une seule requête
        const response = await fetch('/api/rankings/ambiance/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la réinitialisation');
        }

        // Rafraîchir l'affichage
        await initializeRankings();
        
        // Réinitialiser les champs du formulaire
        document.getElementById('teamSelect').value = '';
        document.getElementById('pointsInput').value = '';
        
        alert('Points d\'ambiance réinitialisés avec succès !');
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Une erreur est survenue lors de la réinitialisation des points');
    }
}

// Exposer les fonctions nécessaires globalement
window.addPoints = addPoints;
window.removePoints = removePoints;
window.resetRanking = resetRanking;

// Initialisation
document.addEventListener('DOMContentLoaded', initializeRankings);

// Fonctions de gestion du localStorage
function saveRankingsToLocal() {
    try {
        localStorage.setItem('ambianceRankings', JSON.stringify(rankings));
        localStorage.setItem('ambianceLastUpdate', new Date().getTime().toString());
    } catch (error) {
        console.error('Erreur lors de la sauvegarde locale:', error);
    }
}

function loadRankingsFromLocal() {
    try {
        const savedRankings = localStorage.getItem('ambianceRankings');
        if (savedRankings) {
            rankings = JSON.parse(savedRankings);
            displayRanking();
            rankings = JSON.parse(savedRankings);
            displayRanking();
        }
    } catch (error) {
        console.error('Erreur lors du chargement local:', error);
        rankings = TEAMS.map(team => ({
            name: team,
            points: 0
        }));
        displayRanking();
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
