document.addEventListener('DOMContentLoaded', () => {
    loadLiveMatches();
});

async function loadLiveMatches() {
    const response = await fetch('http://localhost:3000/live-matches');
    const data = await response.json();
    const liveMatchesSection = document.getElementById('liveMatches');

    // Réinitialiser la section
    liveMatchesSection.innerHTML = '';

    data.matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML = `
            <h2>${match.sport}</h2>
            <div class="teams">
                <div class="team">
                    <img src="path/to/teamA-logo.png" alt="${match.teamA} Logo">
                    <span class="team-name">${match.teamA}</span>
                </div>
                <div class="score">${match.scoreA} - ${match.scoreB}</div>
                <div class="team">
                    <img src="path/to/teamB-logo.png" alt="${match.teamB} Logo">
                    <span class="team-name">${match.teamB}</span>
                </div>
            </div>
            <p class="chrono">${match.chrono}</p>
        `;
        liveMatchesSection.appendChild(matchCard);
    });
}