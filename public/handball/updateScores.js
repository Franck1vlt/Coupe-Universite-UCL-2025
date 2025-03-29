function updateScore(matchId) {
    const match = document.getElementById(matchId);
    const teams = match.getElementsByClassName('team');
    const scores = match.getElementsByClassName('score');

    const team1 = teams[0].textContent;
    const team2 = teams[1].textContent;
    const score1 = parseInt(prompt(`Score de ${team1}:`));
    const score2 = parseInt(prompt(`Score de ${team2}:`));

    scores[0].textContent = score1;
    scores[1].textContent = score2;

    let winner, loser;
    if (score1 > score2) {
        winner = team1;
        loser = team2;
    } else {
        winner = team2;
        loser = team1;
    }

    if (matchId.startsWith('qf')) {
        const semiFinalMatchId = matchId === 'qf1' || matchId === 'qf2' ? 'sf1' : 'sf2';
        const semiFinalMatch = document.getElementById(semiFinalMatchId);
        const semiFinalTeams = semiFinalMatch.getElementsByClassName('team');
        if (matchId === 'qf1' || matchId === 'qf3') {
            semiFinalTeams[0].textContent = winner;
        } else {
            semiFinalTeams[1].textContent = winner;
        }
    } else if (matchId.startsWith('sf')) {
        const finalMatchId = 'final';
        const smallFinalMatchId = 'small-final';
        const finalMatch = document.getElementById(finalMatchId);
        const smallFinalMatch = document.getElementById(smallFinalMatchId);
        const finalTeams = finalMatch.getElementsByClassName('team');
        const smallFinalTeams = smallFinalMatch.getElementsByClassName('team');
        if (matchId === 'sf1') {
            finalTeams[0].textContent = winner;
            smallFinalTeams[0].textContent = loser;
        } else {
            finalTeams[1].textContent = winner;
            smallFinalTeams[1].textContent = loser;
        }
    }
}
