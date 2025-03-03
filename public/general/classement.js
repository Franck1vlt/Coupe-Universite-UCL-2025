const TEAMS = [
    'ESPAS-ESTICE', 'ESPOL', 'ESSLIL', 'FGES', 'FLD', 'FLSH', 'FMMS', 
    'ICAM', 'IESEG', 'IKPO', 'ISTC', 'JUNIA', 'LiDD', 'PINKTURA', 'USCHOOL'
];

let rankings = [];

async function fetchAllPoints() {
    try {
        // Récupérer les points de tous les sports
        const sportsResponse = await fetch('/api/rankings/sports');
        const sportsData = await sportsResponse.json();
        
        // Récupérer les points d'ambiance
        const ambianceResponse = await fetch('/api/rankings/ambiance');
        const ambianceData = await ambianceResponse.json();
        
        // Récupérer les points de route150
        const route150Response = await fetch('/api/rankings/route150');
        const route150Data = await route150Response.json();
        
        // Combiner tous les points
        return TEAMS.map(teamName => {
            const sportsPoints = calculateTeamSportsPoints(teamName, sportsData.rankings);
            const ambiancePoints = findTeamPoints(teamName, ambianceData.rankings);
            const route150Points = findTeamPoints(teamName, route150Data.rankings);
            
            return {
                name: teamName,
                sportsPoints: sportsPoints,
                bonusPoints: ambiancePoints + route150Points,
                totalPoints: sportsPoints + ambiancePoints + route150Points
            };
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des points:', error);
        return [];
    }
}

function findTeamPoints(teamName, rankings) {
    const team = rankings?.find(r => r.team_name === teamName);
    return team ? team.points : 0;
}

function calculateTeamSportsPoints(teamName, sportsRankings) {
    const teamScores = sportsRankings?.filter(r => r.team_name === teamName) || [];
    return teamScores.reduce((sum, score) => sum + score.points, 0);
}

function displayRanking(filterType = 'all') {
    const generalRankingList = document.getElementById('generalRankingList');
    if (!generalRankingList) return;

    // Si pas de données, initialiser avec les équipes à 0 points
    if (!rankings || rankings.length === 0) {
        rankings = TEAMS.map(teamName => ({
            name: teamName,
            sportsPoints: 0,
            bonusPoints: 0,
            totalPoints: 0
        }));
    }

    generalRankingList.innerHTML = '';

    // Trier selon le filtre sélectionné
    const sortedRankings = [...rankings].sort((a, b) => {
        if (filterType === 'sports') {
            return b.sportsPoints - a.sportsPoints || a.name.localeCompare(b.name);
        }
        if (filterType === 'extra') {
            return b.bonusPoints - a.bonusPoints || a.name.localeCompare(b.name);
        }
        // Par défaut: tri par points totaux puis par ordre alphabétique
        return b.totalPoints - a.totalPoints || a.name.localeCompare(b.name);
    });

    sortedRankings.forEach((team, index) => {
        const position = index + 1;
        generalRankingList.innerHTML += `
            <div class="ranking-row ${position <= 3 ? 'highlight-' + position : ''}">
                <div class="rank">${position}</div>
                <div class="team">${team.name}</div>
                <div class="points">${team.sportsPoints}</div>
                <div class="points">${team.bonusPoints}</div>
                <div class="points total-points">${team.totalPoints}</div>
            </div>
        `;
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    try {
        rankings = await fetchAllPoints();
    } catch (error) {
        console.error('Erreur lors de la récupération des points:', error);
        rankings = []; // En cas d'erreur, on continuera avec un tableau vide
    }
    
    // Toujours afficher quelque chose, même en cas d'erreur
    displayRanking('general');

    document.getElementById('viewSelect')?.addEventListener('change', async (e) => {
        const selectedView = e.target.value;
        const generalView = document.getElementById('generalView');
        const specificView = document.getElementById('specificView');

        if (selectedView === 'general') {
            generalView.style.display = 'block';
            specificView.style.display = 'none';
            displayRanking('all');
        } else {
            generalView.style.display = 'none';
            specificView.style.display = 'block';
            await displaySpecificRanking(selectedView);
        }
    });
});

async function displaySpecificRanking(category) {
    const specificList = document.getElementById('specificRankingList');
    if (!specificList) return;

    specificList.innerHTML = '';
    
    // Afficher d'abord toutes les équipes avec 0 points
    let rankingData = TEAMS.map(team => ({
        team_name: team,
        points: 0
    }));

    try {
        const response = await fetch(`/api/rankings/${category.toLowerCase()}`);
        const data = await response.json();
        
        if (data.rankings && data.rankings.length > 0) {
            // Mettre à jour les points des équipes existantes
            data.rankings.forEach(dbTeam => {
                const teamIndex = rankingData.findIndex(t => t.team_name === dbTeam.team_name);
                if (teamIndex !== -1) {
                    rankingData[teamIndex].points = dbTeam.points;
                }
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du classement:', error);
    }

    // Trier et afficher
    rankingData
        .sort((a, b) => b.points - a.points || a.team_name.localeCompare(b.team_name))
        .forEach((team, index) => {
            const position = index + 1;
            specificList.innerHTML += `
                <div class="ranking-row ${position <= 3 ? 'highlight-' + position : ''}">
                    <div class="rank">${position}</div>
                    <div class="team">${team.team_name}</div>
                    <div class="points">${team.points}</div>
                </div>
            `;
        });
}
