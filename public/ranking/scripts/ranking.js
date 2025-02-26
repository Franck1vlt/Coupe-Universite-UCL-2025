document.addEventListener('DOMContentLoaded', () => {
    const generalRankingBody = document.getElementById('general-ranking-body');
    const sportRankingBody = document.getElementById('sport-ranking-body');
    const sportSelect = document.getElementById('sport-select');

    const teams = [
        { rank: 1, team: 'Équipe A', sport: 'Football', points: 25 },
        { rank: 2, team: 'Équipe B', sport: 'Handball', points: 20 },
        { rank: 3, team: 'Équipe C', sport: 'Basketball', points: 18 },
        { rank: 4, team: 'Équipe D', sport: 'Volley H', points: 15 },
        { rank: 5, team: 'Équipe E', sport: 'Volley F', points: 12 },
        { rank: 6, team: 'Équipe F', sport: 'Badminton', points: 10 },
        { rank: 7, team: 'Équipe G', sport: 'Pétanque', points: 8 },
        { rank: 8, team: 'Équipe H', sport: 'Fléchettes', points: 5 }
    ];

    function displayGeneralRanking() {
        generalRankingBody.innerHTML = '';
        teams.sort((a, b) => b.points - a.points).forEach((team, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.team}</td>
                <td>${team.points}</td>
            `;
            generalRankingBody.appendChild(row);
        });
    }

    function displaySportRanking(sport) {
        sportRankingBody.innerHTML = '';
        teams.filter(team => team.sport.toLowerCase() === sport.toLowerCase()).forEach((team, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${team.team}</td>
                <td>${team.sport}</td>
                <td>${team.points}</td>
            `;
            sportRankingBody.appendChild(row);
        });
    }

    function filterBySport() {
        const sport = sportSelect.value;
        if (sport === 'all') {
            displayGeneralRanking();
            sportRankingBody.innerHTML = '';
        } else {
            displaySportRanking(sport);
        }
    }

    displayGeneralRanking();
    sportSelect.addEventListener('change', filterBySport);
});
