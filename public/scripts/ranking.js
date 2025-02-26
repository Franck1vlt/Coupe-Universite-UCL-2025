document.addEventListener("DOMContentLoaded", function() {
    loadRankings();
});

function loadRankings() {
    const rankingData = [
        { rank: 1, team: "Équipe A", sport: "football", points: 15 },
        { rank: 2, team: "Équipe B", sport: "basketball", points: 12 },
        { rank: 3, team: "Équipe C", sport: "handball", points: 10 },
        { rank: 4, team: "Équipe D", sport: "volleyh", points: 9 },
        { rank: 5, team: "Équipe E", sport: "badminton", points: 7 }
    ];
    renderRankings(rankingData);
}

function renderRankings(data) {
    const tbody = document.getElementById("ranking-body");
    tbody.innerHTML = "";
    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.rank}</td>
            <td>${row.team}</td>
            <td>${row.sport}</td>
            <td>${row.points}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterBySport() {
    const selectedSport = document.getElementById("sport-select").value;
    loadRankings();
    if (selectedSport !== "all") {
        const filteredData = rankingData.filter(row => row.sport === selectedSport);
        renderRankings(filteredData);
    }
}
