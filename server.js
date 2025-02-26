const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const liveMatches = [
    { sport: 'Football', teamA: 'Équipe A', teamB: 'Équipe B', scoreA: 1, scoreB: 2, chrono: '45:00' },
    { sport: 'Basketball', teamA: 'Équipe C', teamB: 'Équipe D', scoreA: 50, scoreB: 48, chrono: '30:00' },
    { sport: 'Volleyball', teamA: 'Équipe E', teamB: 'Équipe F', scoreA: 2, scoreB: 1, chrono: '20:00' }
];

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/live-matches', (req, res) => {
    res.json({ matches: liveMatches });
});

app.post('/api/update-match', (req, res) => {
    const { matchId, team1, team2, team1Score, team2Score, winner, loser, round } = req.body;
    // Mettre à jour la base de données avec les informations du match
    // Exemple : db.updateMatch(matchId, { team1, team2, team1Score, team2Score, winner, loser, round });
    console.log(`Match ${matchId} mis à jour : ${team1} ${team1Score} - ${team2Score} ${team2}`);
    res.status(200).send('Match mis à jour');
});

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});