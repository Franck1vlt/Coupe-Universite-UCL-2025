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

// Mettre à jour la fonction d'initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const viewSelect = document.getElementById('viewSelect');
    const generalView = document.getElementById('generalView');
    const specificView = document.getElementById('specificView');

    viewSelect.addEventListener('change', async function() {
        const selectedView = viewSelect.value;
        if (selectedView === 'general') {
            generalView.style.display = 'block';
            specificView.style.display = 'none';
            await updateGeneralRanking();
        } else {
            generalView.style.display = 'none';
            specificView.style.display = 'block';
            await updateSpecificRanking(selectedView);
        }
    });

    // Déclencher l'événement change initial
    viewSelect.dispatchEvent(new Event('change'));
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
