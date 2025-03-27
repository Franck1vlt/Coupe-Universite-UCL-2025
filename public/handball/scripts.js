async function loadLiveMatches() {
    try {
        const liveData = JSON.parse(localStorage.getItem('liveMatchData'));
        if (!liveData || !liveData.matchId) return;

        const matchCard = `
            <div class="match-card">
                <div class="match-header">
                    <span class="match-type">${liveData.matchType || 'Match'}</span>
                    <span class="match-time">${liveData.chrono || '00:00'}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <img src="/img/${liveData.team1}.png" alt="${liveData.team1}" class="team-logo">
                        <span class="team-name">${liveData.team1}</span>
                        <span class="team-score">${liveData.score1 || '0'}</span>
                    </div>
                    <div class="team">
                        <img src="/img/${liveData.team2}.png" alt="${liveData.team2}" class="team-logo">
                        <span class="team-name">${liveData.team2}</span>
                        <span class="team-score">${liveData.score2 || '0'}</span>
                    </div>
                </div>
                <div class="match-details">
                    <div class="cards">
                        <div>🟡 ${liveData.yellowCards1 || '0'} 🔴 ${liveData.redCards1 || '0'}</div>
                        <div>🟡 ${liveData.yellowCards2 || '0'} 🔴 ${liveData.redCards2 || '0'}</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('liveMatches').innerHTML = matchCard;
    } catch (error) {
        console.error('Erreur lors du chargement des matchs:', error);
    }
}

// Mettre à jour plus fréquemment
document.addEventListener('DOMContentLoaded', () => {
    loadLiveMatches();
    setInterval(loadLiveMatches, 100); // Toutes les 100ms au lieu de 1000ms
});
