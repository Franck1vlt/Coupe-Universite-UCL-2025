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
    // Initialiser toutes les équipes avec 0 points
    rankings = TEAMS.map(team => ({
        name: team,
        points: 0
    })).sort((a, b) => a.name.localeCompare(b.name));

    displayRanking(); // Afficher d'abord la liste avec 0 points

    try {
        const response = await fetch('/api/rankings/ambiance');
        const data = await response.json();
        
        if (data && data.rankings) {
            // Mettre à jour uniquement les points des équipes qui en ont
            data.rankings.forEach(dbTeam => {
                const team = rankings.find(t => t.name === dbTeam.team_name);
                if (team) {
                    team.points = dbTeam.points || 0;
                }
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du classement:', error);
    } finally {
        // Toujours réafficher le classement, même en cas d'erreur
        displayRanking();
    }
}

async function addPoints() {
    const team = document.getElementById('teamSelect').value;
    const points = parseInt(document.getElementById('pointsInput').value);

    if (!team || isNaN(points)) {
        alert('Veuillez sélectionner une équipe et entrer un nombre de points valide');
        return;
    }

    try {
        const response = await fetch('/api/rankings/ambiance/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, points })
        });

        if (response.ok) {
            location.reload(); // Recharge la page après une mise à jour réussie
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout des points:', error);
        alert('Erreur lors de la mise à jour des points');
    }
}

async function removePoints() {
    const team = document.getElementById('teamSelect').value;
    const points = parseInt(document.getElementById('pointsInput').value);

    if (!team || isNaN(points)) {
        alert('Veuillez sélectionner une équipe et entrer un nombre de points valide');
        return;
    }

    try {
        const response = await fetch('/api/rankings/ambiance/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, points: -points })
        });

        if (response.ok) {
            location.reload(); // Recharge la page après une mise à jour réussie
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors du retrait des points:', error);
        alert('Erreur lors de la mise à jour des points');
    }
}

async function resetRanking() {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les points ?')) {
        return;
    }

    try {
        const response = await fetch('/api/rankings/ambiance/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            // Réinitialiser les points localement
            rankings.forEach(team => team.points = 0);
            displayRanking();
            alert('Le classement a été réinitialisé avec succès.');
        } else {
            throw new Error('Erreur lors de la réinitialisation');
        }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Erreur lors de la réinitialisation du classement.');
    }
}

function displayRanking() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    rankings.sort((a, b) => {
        if (a.points === b.points) {
            return a.name.localeCompare(b.name); // Tri alphabétique si même nombre de points
        }
        return b.points - a.points; // Sinon tri par points
    }).forEach((team, index) => {
        const position = index + 1;
        rankingList.innerHTML += `
            <div class="ranking-row ${position <= 3 ? 'highlight-' + position : ''}">
                <div class="rank">${position}</div>
                <div class="team">${team.name}</div>
                <div class="points">${team.points}</div>
            </div>
        `;
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', initializeRankings);
