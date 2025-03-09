const allTeams = [
    "ESPAS-ESTICE",
    "ESPOL",
    "ICAM",
    "FMMS",
    "USCHOOL",
    "FLSH",
    "FLD",
    "FGES",
    "JUNIA",
    "IESEG",
    "IKPO",
    "ESSLIL",
    "ISTC",
    "LiDD",
    "PIKTURA"
];

async function updateBasketRanking() {
    try {s
        // Récupérer les points de basket H et F
        const [basketH, basketF] = await Promise.all([
            fetch('/api/rankings/basket_h').then(r => r.json()),
            fetch('/api/rankings/basket_f').then(r => r.json())
        ]);

        const allTeams = new Set([
            ...basketH.rankings.map(r => r.team_name),
            ...basketF.rankings.map(r => r.team_name)
        ]);

        const combinedRankings = Array.from(allTeams).map(team => {
            const hPoints = basketH.rankings.find(r => r.team_name === team)?.points || 0;
            const fPoints = basketF.rankings.find(r => r.team_name === team)?.points || 0;
            return {
                name: team,
                pointsH: hPoints,
                pointsF: fPoints,
                totalPoints: hPoints + fPoints
            };
        });

        // Trier par points totaux décroissants
        combinedRankings.sort((a, b) => b.totalPoints - a.totalPoints);

        const basketRankingList = document.getElementById('basketRankingList');
        basketRankingList.innerHTML = '';

        combinedRankings.forEach((team, idx) => {
            const position = idx + 1;
            const highlightClass = position <= 3 ? `highlight-${position}` : '';

            basketRankingList.innerHTML += `
                <div class="ranking-row ${highlightClass}">
                    <div class="rank">${position}</div>
                    <div class="team-name">
                        <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                        ${team.name}
                    </div>
                    <div class="points-h">${team.pointsH || '-'}</div>
                    <div class="points-f">${team.pointsF || '-'}</div>
                    <div class="points-total">${team.totalPoints}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du classement basket:', error);
    }
}

async function updateGeneralRanking() {
    try {
        const response = await fetch('/api/rankings/general');
        const data = await response.json();
        
        const rankingList = document.getElementById('generalRankingList');
        rankingList.innerHTML = '';

        // Filtrer les entrées nulles et invalides
        const validRankings = data.rankings.filter(team => 
            team && team.team_name && allTeams.includes(team.team_name)
        );

        validRankings.forEach((team, idx) => {
            const position = idx + 1;
            const highlightClass = position <= 3 ? `highlight-${position}` : '';
            
            rankingList.innerHTML += `
                <div class="ranking-row ${highlightClass}">
                    <div class="rank">${position}</div>
                    <div class="team">
                        <img src="/img/${team.team_name}.png" alt="${team.team_name}" class="team-logo-mini" />
                        ${team.team_name}
                    </div>
                    <div class="points">${team.basket_points + team.foot_points}</div>
                    <div class="points">${team.bonus_points}</div>
                    <div class="points">${team.total_points}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du classement général:', error);
    }
}

// Simplifier la fonction d'initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const viewSelect = document.getElementById('viewSelect');
    viewSelect.addEventListener('change', updateRanking);
    
    // Première mise à jour
    await updateRanking();
});

async function updateSpecificRanking(category) {
    try {
        const response = await fetch(`/api/rankings/${category.toLowerCase()}`);
        const data = await response.json();

        // Filtrer pour n'inclure que les équipes valides
        const validRankings = allTeams
            .map(team => {
                const teamData = data.rankings.find(r => r.team_name === team);
                return {
                    name: team,
                    points: teamData ? teamData.points : 0
                };
            })
            .filter(team => team && team.name); // Filtre supplémentaire pour la sécurité

        // Trier par points décroissants
        validRankings.sort((a, b) => b.points - a.points);

        const rankingList = document.getElementById('specificRankingList');
        rankingList.innerHTML = '';

        validRankings.forEach((team, idx) => {
            const position = idx + 1;
            const highlightClass = position <= 3 ? `highlight-${position}` : '';

            rankingList.innerHTML += `
                <div class="ranking-row ${highlightClass}">
                    <div class="rank">${position}</div>
                    <div class="team">
                        <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
                        ${team.name}
                    </div>
                    <div class="points">${team.points}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du classement ${category}:`, error);
    }
}

// Mettre à jour directement la fonction updateRanking
async function updateRanking() {
    const viewSelect = document.getElementById('viewSelect');
    const selectedView = viewSelect.value;
    const rankingTable = document.getElementById('rankingList');
    
    if (!rankingTable) return;
    
    try {
        if (selectedView === 'general') {
            // Vue du classement général
            const response = await fetch('/api/rankings/general');
            const data = await response.json();
            
            rankingTable.innerHTML = '';
            data.rankings.forEach((team, index) => {
                const row = `
                    <tr class="${index < 3 ? `highlight-${index + 1}` : ''}">
                        <td>${index + 1}</td>
                        <td>
                            <img src="/img/${team.nom_equipe}.png" alt="${team.nom_equipe}" class="team-logo-mini" />
                            ${team.nom_equipe}
                        </td>
                        <td class="total-points">${team.points || 0}</td>
                    </tr>`;
                rankingTable.innerHTML += row;
            });
        } 
        else if (selectedView === 'AMBIANCE' || selectedView === 'ROUTE150') {
            // Vue des points bonus
            const response = await fetch(`/api/rankings/${selectedView.toLowerCase()}`);
            const data = await response.json();
            
            rankingTable.innerHTML = '';
            data.rankings.forEach((team, index) => {
                const row = `
                    <tr class="${index < 3 ? `highlight-${index + 1}` : ''}">
                        <td>${index + 1}</td>
                        <td>
                            <img src="/img/${team.nom_equipe}.png" alt="${team.nom_equipe}" class="team-logo-mini" />
                            ${team.nom_equipe}
                        </td>
                        <td>${team.points || 0}</td>
                    </tr>`;
                rankingTable.innerHTML += row;
            });
        }
        else {
            // Vue par sport spécifique
            const response = await fetch(`/api/rankings/${selectedView.toLowerCase()}`);
            const data = await response.json();
            
            rankingTable.innerHTML = '';
            data.rankings.forEach((team, index) => {
                const row = `
                    <tr class="${index < 3 ? `highlight-${index + 1}` : ''}">
                        <td>${index + 1}</td>
                        <td>
                            <img src="/img/${team.nom_equipe}.png" alt="${team.nom_equipe}" class="team-logo-mini" />
                            ${team.nom_equipe}
                        </td>
                        <td>${team.points || 0}</td>
                    </tr>`;
                rankingTable.innerHTML += row;
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function changeView() {
    const viewSelect = document.getElementById('viewSelect');
    const selectedView = viewSelect.value;
    
    if (selectedView === 'general') {
        updateRanking();
    } else {
        updateSpecificRanking(selectedView);
    }
}

// Mise à jour initiale
document.addEventListener('DOMContentLoaded', updateRanking);
// Mise à jour toutes les 30 secondes
setInterval(updateRanking, 30000);
