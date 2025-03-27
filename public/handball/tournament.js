/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

// Liste des équipes de la poule
const pouleTeams = [
    "FGES",
    "FMMS",
    "FLD",
    "ICAM",
    "IKPO",
    "JUNIA"
  ];
  
  // Liste complète des équipes pour le classement final
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
    "PIKTURA",
    "LiDD"
  ];
  
  const teams = {};
  allTeams.sort().forEach((name, index) => {
    teams[name] = {
      id: index + 1,
      name: name,
      logo: `/img/${name}.png`
    };
  });
  
  // Définir les terrains
  const terrains = {
      'poule': 8,          // Terrain de handball
      'final': 8,          // Terrain de handball
  };
  
  // ----- STRUCTURE DU TOURNOI -----
  // La structure est définie par matchId avec les informations de chaque rencontre.
  let tournamentState = {
    matches: {
      // Matchs de poule (matchIds 1 à 12)
      1: { matchType: 'Poule', team1: 'FGES', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:45' },
      2: { matchType: 'Poule', team1: 'FMMS', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15' },
      3: { matchType: 'Poule', team1: 'ICAM', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:45' },
      4: { matchType: 'Poule', team1: 'IKPO', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:15' },
      5: { matchType: 'Poule', team1: 'JUNIA', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45' },
      6: { matchType: 'Poule', team1: 'FMMS', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:15' },
      7: { matchType: 'Poule', team1: 'FGES', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:45' },
      8: { matchType: 'Poule', team1: 'IKPO', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:15' },
      9: { matchType: 'Poule', team1: 'JUNIA', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:45' },
      10: { matchType: 'Poule', team1: 'ICAM', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:15' },
      11: { matchType: 'Poule', team1: 'FLD', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:45' },
      12: { matchType: 'Poule', team1: 'IKPO', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:15' },
      // Finale (matchId 13)
      13: { matchType: 'Finale', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:45' }
    }
  };
  
  // Fonction pour sauvegarder l'état du tournoi
  function saveTournamentState() {
      localStorage.setItem('handballTournamentState', JSON.stringify(tournamentState));
      localStorage.setItem('lastUpdate', new Date().toISOString());
      
      // Si Socket.io est disponible, émettre la mise à jour de l'état du tournoi
      if (window.io) {
          try {
              const socket = io('/handball');
              socket.emit('tournamentUpdate', {
                  state: tournamentState,
                  timestamp: new Date().toISOString()
              });
          } catch (error) {
              console.error('Erreur lors de l\'envoi de l\'état du tournoi via Socket.io:', error);
          }
      }
  }
  
  // Fonction pour charger l'état du tournoi
  function loadTournamentState() {
      const savedState = localStorage.getItem('handballTournamentState');
      if (savedState) {
          tournamentState = JSON.parse(savedState);
          return true;
      }
      return false;
  }
  
  // Fonction pour mettre à jour l'interface utilisateur
  function updateUI() {
    console.log("Mise à jour de l'interface utilisateur");
    
    try {
        // 1. Mettre à jour les matchs
        for (const [matchId, matchData] of Object.entries(tournamentState.matches)) {
            const matchElement = document.querySelector(`.match[data-match-id="${matchId}"]`);
            if (!matchElement) continue;
            
            // Équipe 1
            const team1Element = matchElement.querySelector('.team:first-child .team-name');
            if (team1Element) {
                if (matchData.team1) {
                    // Mettre à jour le nom
                    const nameSpan = team1Element.querySelector('div:not(.team-logo)') || team1Element;
                    if (nameSpan) nameSpan.textContent = matchData.team1;
                    
                    // Mettre à jour le logo
                    const logoElement = team1Element.querySelector('.team-logo');
                    if (logoElement) {
                        logoElement.style.backgroundImage = `url('/img/${matchData.team1}.png')`;
                    }
                }
            }
            
            // Équipe 2
            const team2Element = matchElement.querySelector('.team:last-child .team-name');
            if (team2Element) {
                if (matchData.team2) {
                    // Mettre à jour le nom
                    const nameSpan = team2Element.querySelector('div:not(.team-logo)') || team2Element;
                    if (nameSpan) nameSpan.textContent = matchData.team2;
                    
                    // Mettre à jour le logo
                    const logoElement = team2Element.querySelector('.team-logo');
                    if (logoElement) {
                        logoElement.style.backgroundImage = `url('/img/${matchData.team2}.png')`;
                    }
                }
            }
            
            // Scores - Assurez-vous que les scores sont bien affichés
            const score1Element = matchElement.querySelector('.team:first-child .score');
            const score2Element = matchElement.querySelector('.team:last-child .score');
            
            if (score1Element) {
                score1Element.textContent = matchData.score1 !== null && matchData.score1 !== undefined ? matchData.score1 : '-';
            }
            
            if (score2Element) {
                score2Element.textContent = matchData.score2 !== null && matchData.score2 !== undefined ? matchData.score2 : '-';
            }
            
            // Statut du match
            const statusElement = matchElement.querySelector('.match-status');
            if (statusElement && matchData.status) {
                statusElement.textContent = matchData.status.replace('_', ' ');
                matchElement.dataset.status = matchData.status;
            }
            
            // Styles pour le gagnant/perdant si terminé - correction de la logique
            if (matchData.status === 'terminé') {
                const team1 = matchElement.querySelector('.team:first-child');
                const team2 = matchElement.querySelector('.team:last-child');
                
                // Nettoyer les classes existantes d'abord
                if (team1) {
                    team1.classList.remove('winner', 'loser', 'draw');
                }
                if (team2) {
                    team2.classList.remove('winner', 'loser', 'draw');
                }
                
                if (team1 && team2) {
                    // Appliquer les classes en fonction du résultat
                    if (matchData.score1 > matchData.score2) {
                        team1.classList.add('winner');
                        team2.classList.add('loser');
                    } else if (matchData.score1 < matchData.score2) {
                        team1.classList.add('loser');
                        team2.classList.add('winner');
                    } else if (matchData.score1 === matchData.score2) {
                        team1.classList.add('draw');
                        team2.classList.add('draw');
                    }
                }
            }
        }
        
        // Le reste de la fonction reste inchangé...
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'interface:', error);
    }
}


  
  // ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
  // Les points sont attribués en fonction des résultats des matchs de poule et de la finale.
  const positionPoints = {
    1: 50,
    2: 40,
    3: 30,
    4: 20,
    5: 15,
    6: 10
  };
  
  // ----- INITIALISATION -----
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du tournoi de handball");
    
    // Charger l'état initial
    if (loadTournamentState()) {
      console.log('État précédent du tournoi chargé');
    } else {
      console.log('Nouveau tournoi initialisé');
    }
    
    // Définir updateUI comme fonction globale mais éviter la récursion
    window.originalUpdateUI = updateUI;
    window.updateUI = function() {
      // Éviter la récursion infinie
      if (window._updatingUI) return;
      window._updatingUI = true;
      try {
        window.originalUpdateUI();
        // Mise à jour des matchs clickables après l'UI
        if (typeof updateMatchClickability === 'function') {
          updateMatchClickability();
        }
      } finally {
        window._updatingUI = false;
      }
    };
  
    // Initialiser la synchronisation Socket.io 
    initSocketIO();
    
    // Synchronisation initiale avec le serveur
    syncWithServer();
    
    // Synchronisations périodiques
    setInterval(syncWithServer, 5000); // Toutes les 5 secondes
    setInterval(refreshUI, 2000); // Rafraîchir l'UI toutes les 2 secondes
  
    // Initialiser les handlers
    addMatchClickHandlers();
  });
  
  // Fonction d'initialisation de Socket.io
  function initSocketIO() {
    if (!window.io) {
      console.warn("Socket.io n'est pas disponible");
      return;
    }
  
    try {
      console.log("Initialisation de la connexion Socket.io");
      const socket = io('/handball');
      
      // Stocker la référence Socket.io dans une variable globale
      window.handballSocket = socket;
      
      socket.on('connect', function() {
        console.log("Connecté au serveur Socket.io (namespace /handball)");
        
        // S'abonner aux mises à jour du tournoi
        socket.emit('subscribeTournament', { sport: 'handball' });
        
        // Demander l'état actuel
        socket.emit('requestData', { global: true });
        
        socket.on('scoreUpdate', function(data) {
          console.log("Réception d'une mise à jour de score:", data);
          updateMatchFromServerData(data);
          saveTournamentState();
          updateUI();
        });
        
        socket.on('tournamentState', function(data) {
          console.log("Réception de l'état du tournoi");
          if (data && data.state) {
            // Ne pas écraser des données plus récentes
            const currentTimestamp = localStorage.getItem('handballLastUpdate');
            if (!currentTimestamp || new Date(data.timestamp) > new Date(currentTimestamp)) {
              tournamentState = data.state;
              localStorage.setItem('handballTournamentState', JSON.stringify(data.state));
              localStorage.setItem('handballLastUpdate', data.timestamp);
              updateUI();
            }
          }
        });
        
        // Demander l'état initial du tournoi
        socket.emit('request_tournament_state', { sport: 'handball' });
      });
      
      socket.on('connect_error', function(error) {
        console.error('Erreur de connexion Socket.io:', error);
        // Fallback: utiliser localStorage et HTTP
      });
      
      socket.on('disconnect', function() {
        console.warn('Déconnecté du serveur Socket.io');
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation Socket.io:', error);
    }
  }
  
  // Synchronisation avec le serveur (comme dans football)
  function syncWithServer() {
    console.log("Synchronisation avec le serveur...");
    
    // Vérifier si Socket.io est disponible et connecté
    if (window.handballSocket && window.handballSocket.connected) {
      window.handballSocket.emit('request_tournament_state', { sport: 'handball' });
      window.handballSocket.emit('requestData', { global: true });
      return;
    }
    
    // IMPORTANT: Modification du fallback pour éviter les erreurs HTTP
    // Ne pas essayer d'utiliser fetch() qui génère des erreurs HTML
    try {
      // Utiliser uniquement localStorage comme solution de secours
      const savedState = localStorage.getItem('handballTournamentState');
      if (savedState) {
        tournamentState = JSON.parse(savedState);
        console.log('État chargé depuis localStorage');
        updateUI();
      }
    } catch (error) {
      console.warn('Erreur lors de la synchronisation depuis localStorage:', error);
    }
  }
  
  // Mise à jour d'un match à partir des données du serveur
  function updateMatchFromServerData(data) {
    if (!data || !data.matchId) return;
    const matchId = data.matchId;
    
    // Si le match n'existe pas encore dans notre état, on l'ignore
    if (!tournamentState.matches[matchId]) return;
    
    console.log(`Mise à jour du match ${matchId} depuis les données serveur`);
    
    // Mettre à jour les données du match
    tournamentState.matches[matchId].score1 = data.score1 !== undefined ? data.score1 : tournamentState.matches[matchId].score1;
    tournamentState.matches[matchId].score2 = data.score2 !== undefined ? data.score2 : tournamentState.matches[matchId].score2;
    tournamentState.matches[matchId].status = data.status || tournamentState.matches[matchId].status;
    
    // Mettre à jour l'équipe gagnante/perdante si le match est terminé
    if (data.status === 'terminé') {
      const score1 = parseInt(data.score1);
      const score2 = parseInt(data.score2);
      
      if (score1 > score2) {
        tournamentState.matches[matchId].winner = data.team1;
        tournamentState.matches[matchId].loser = data.team2;
      } else if (score2 > score1) {
        tournamentState.matches[matchId].winner = data.team2;
        tournamentState.matches[matchId].loser = data.team1;
      } else {
        // Match nul
        tournamentState.matches[matchId].draw = true;
        tournamentState.matches[matchId].winner = null;
        tournamentState.matches[matchId].loser = null;
      }
    }
  }
  
  // Mise à jour de plusieurs matchs à partir des données du serveur
  function updateMatchesFromServerData(matches) {
    if (!matches || !Array.isArray(matches)) return;
    
    matches.forEach(match => {
      // Convertir au format attendu par updateMatchFromServerData
      const data = {
        matchId: match.id_match,
        score1: match.score_equipe1,
        score2: match.score_equipe2,
        status: match.status,
        team1: match.team1,
        team2: match.team2
      };
      updateMatchFromServerData(data);
    });
  }
  
  // Nouveau: fonction pour rafraîchir périodiquement l'UI
  function refreshUI() {
    // Actualiser l'UI si nous avons chargé des données depuis le serveur
    if (localStorage.getItem('handballTournamentState')) {
      const savedState = localStorage.getItem('handballTournamentState');
      if (savedState) {
        const newState = JSON.parse(savedState);
        // Vérifier si l'état a changé avant de mettre à jour l'UI
        if (JSON.stringify(tournamentState) !== JSON.stringify(newState)) {
          console.log('Mise à jour de l\'UI depuis localStorage');
          tournamentState = newState;
          updateUI();
        }
      }
    }
  }
  
  // ----- SIMULATION D'UN MATCH -----
  async function simulateMatch(matchId) {
      const match = tournamentState.matches[matchId];
      if (!match || match.status === 'terminé') return;
      
      match.score1 = Math.floor(Math.random() * 6);
      match.score2 = Math.floor(Math.random() * 6);
  
      // Gestion du match nul
      if (match.score1 === match.score2) {
          match.draw = true;
          match.winner = null;
          match.loser = null;
      } else {
          match.draw = false;
          if (match.score1 > match.score2) {
              match.winner = match.team1;
              match.loser = match.team2;
          } else {
              match.winner = match.team2;
              match.loser = match.team1;
          }
      }
  
      match.status = 'terminé';
      
      // Notifier via Socket.io si disponible
      if (window.io) {
          try {
              const socket = io('/handball');
              socket.emit('matchUpdate', {
                  matchId: matchId,
                  match: match
              });
          } catch (error) {
              console.error('Erreur lors de l\'envoi de mise à jour de match via Socket.io:', error);
          }
      }
      
      await updateUI();
      saveTournamentState();
  }
  
  // ----- SIMULATION DE LA COMPÉTITION -----
  async function simulateTournament() {
      try {
          // 1. Simuler tous les matchs de poule
          console.log("Début simulation des matchs de poule");
          for (let i = 1; i <= 12; i++) {
              if (tournamentState.matches[i].status !== 'terminé') {
                  await simulateMatch(i);
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }
  
          // 2. Déterminer les finalistes après tous les matchs de poule
          const teamStats = calculateTeamStats(); // Utilise la fonction existante
          console.log("Statistiques des équipes:", teamStats);
  
          // 3. Trier les équipes par points et différence de buts
          const sortedTeams = Object.entries(teamStats).sort((a, b) => {
              const teamA = a[1];
              const teamB = b[1];
              // D'abord comparer les points
              if (teamA.points !== teamB.points) {
                  return teamB.points - teamA.points;
              }
              // En cas d'égalité, utiliser la différence de buts
              const diffA = teamA.goalsFor - teamA.goalsAgainst;
              const diffB = teamB.goalsFor - teamB.goalsAgainst;
              return diffB - diffA;
          });
  
          console.log("Équipes triées:", sortedTeams);
  
          // 4. Configurer la finale avec les deux meilleures équipes
          const finalMatch = tournamentState.matches[13];
          finalMatch.team1 = sortedTeams[0][0]; // Première équipe
          finalMatch.team2 = sortedTeams[1][0]; // Deuxième équipe
          finalMatch.score1 = null;
          finalMatch.score2 = null;
          finalMatch.status = 'à_venir';
          finalMatch.winner = null;
          finalMatch.loser = null;
  
          console.log("Configuration de la finale:", {
              team1: finalMatch.team1,
              team2: finalMatch.team2
          });
  
          // 5. Simuler la finale
          await simulateMatch(13);
          
          saveTournamentState();
          updateUI();
          alert('Simulation terminée !');
  
      } catch (error) {
          console.error('Erreur lors de la simulation:', error);
          alert('Erreur lors de la simulation du tournoi');
      }
  }
  
  // Fonction pour calculer les stats des équipes en poule
  function calculateTeamStats() {
      // Initialiser les stats pour toutes les équipes de la poule
      const teamStats = {};
      
      // S'assurer que chaque équipe a ses statistiques initialisées
      pouleTeams.forEach(team => {
          teamStats[team] = {
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0
          };
      });
  
      // Parcourir uniquement les matchs de poule terminés
      for (let i = 1; i <= 12; i++) {
          const match = tournamentState.matches[i];
          if (match && match.status === 'terminé' && match.team1 && match.team2) {
              const team1Stats = teamStats[match.team1];
              const team2Stats = teamStats[match.team2];
  
              if (!team1Stats || !team2Stats) continue; // Ignorer si une équipe n'est pas trouvée
  
              team1Stats.played++;
              team2Stats.played++;
  
              if (match.score1 === match.score2) {
                  // Match nul
                  team1Stats.draws++;
                  team2Stats.draws++;
                  team1Stats.points += 2;
                  team2Stats.points += 2;
              } else if (match.winner === match.team1) {
                  // Victoire team1
                  team1Stats.wins++;
                  team2Stats.losses++;
                  team1Stats.points += 3;
                  team2Stats.points += 1;
              } else {
                  // Victoire team2
                  team2Stats.wins++;
                  team1Stats.losses++;
                  team2Stats.points += 3;
                  team1Stats.points += 1;
              }
  
              // Mise à jour des buts
              if (typeof match.score1 === 'number' && typeof match.score2 === 'number') {
                  team1Stats.goalsFor += match.score1;
                  team1Stats.goalsAgainst += match.score2;
                  team2Stats.goalsFor += match.score2;
                  team2Stats.goalsAgainst += match.score1;
              }
          }
      }
  
      return teamStats;
  }
  
  // ----- CALCUL DU CLASSEMENT FINAL -----
  function calculateRankings() {
    let ranking = allTeams.map(name => ({ 
      name,
      points: 0,
      position: null,
      isPouleTeam: pouleTeams.includes(name)
    }));
  
    // Calculer d'abord le classement de la poule
    const teamStats = {};
    pouleTeams.forEach(team => {
      teamStats[team] = {
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0
      };
    });
  
    // Calculer les stats de la poule
    Object.values(tournamentState.matches)
      .filter(match => match.matchType === 'Poule' && match.status === 'terminé')
      .forEach(match => {
        if (match.winner && match.loser) {
          teamStats[match.winner].points += 3;
          teamStats[match.winner].goalsFor += match.score1;
          teamStats[match.winner].goalsAgainst += match.score2;
          teamStats[match.loser].points += 1;
          teamStats[match.loser].goalsFor += match.score2;
          teamStats[match.loser].goalsAgainst += match.score1;
        }
      });
  
    // Trier les équipes de la poule
    const sortedPouleTeams = Object.entries(teamStats)
      .sort(([,a], [,b]) => 
        b.points - a.points || 
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
      )
      .map(([team]) => team);
  
    // Attribuer les points selon la position finale
    const finalMatch = tournamentState.matches[13];
    if (finalMatch && finalMatch.status === 'terminé') {
      // 1er place (50 points)
      const winner = ranking.find(r => r.name === finalMatch.winner);
      if (winner) {
        winner.points = 50;
        winner.position = 1;
      }
  
      // 2e place (40 points)
      const runnerUp = ranking.find(r => r.name === finalMatch.loser);
      if (runnerUp) {
        runnerUp.points = 40;
        runnerUp.position = 2;
      }
  
      // 3e à 6e place selon le classement de la poule
      // Exclure les 2 finalistes du classement de poule
      const remainingTeams = sortedPouleTeams
        .filter(team => team !== finalMatch.winner && team !== finalMatch.loser);
  
      // Attribuer les points pour les positions 3 à 6
      remainingTeams.forEach((team, index) => {
        const teamRanking = ranking.find(r => r.name === team);
        if (teamRanking) {
          switch (index) {
            case 0: teamRanking.points = 30; teamRanking.position = 3; break; // 3e place
            case 1: teamRanking.points = 20; teamRanking.position = 4; break; // 4e place
            case 2: teamRanking.points = 15; teamRanking.position = 5; break; // 5e place
            case 3: teamRanking.points = 10; teamRanking.position = 6; break; // 6e place
          }
        }
      });
    }
  
    // Trier le classement final
    ranking.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.isPouleTeam && !b.isPouleTeam) return -1;
      if (!a.isPouleTeam && b.isPouleTeam) return 1;
      return a.name.localeCompare(b.name);
    });
  
    return ranking;
  }
  
  // ----- MISE À JOUR DU TABLEAU DE CLASSEMENT -----
  function updateRankingDisplay() {
    const ranking = calculateRankings();
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    rankingList.innerHTML = '';
    
    // Création d'un objet pour l'envoi des points
    const teamPoints = {};
    
    ranking.forEach((team, idx) => {
      const position = idx + 1;
      const highlightClass = position <= 3 ? `highlight-${position}` : '';
      
      // Ajout des points à l'objet teamPoints
      teamPoints[team.name] = team.points;
      
      rankingList.innerHTML += `
        <div class="ranking-row ${highlightClass}">
          <div class="rank">${position}</div>
          <div class="team-name">
            <img src="/img/${team.name}.png" alt="${team.name}" class="team-logo-mini" />
            ${team.name}
          </div>
          <div class="points">${team.points}</div>
        </div>
      `;
    });
    
    // Envoi des points au serveur
    sendPointsToServer(teamPoints);
    
    // Sauvegarder l'état après la mise à jour
    saveTournamentState();
  }
  
  // Modifier la fonction pour envoyer les points via Socket.io uniquement (sans HTTP)
  async function sendPointsToServer(teamPoints) {
    try {
      console.log('Points handball calculés:', teamPoints);
      
      // Sauvegarde locale uniquement (pas d'appel HTTP)
      localStorage.setItem('handballPoints', JSON.stringify({
        points: teamPoints,
        timestamp: new Date().toISOString()
      }));
      
      // Si Socket.io est disponible, on envoie par ce canal
      if (window.io) {
        try {
          const socket = io('/handball');
          socket.emit('handball_points', {
            points: teamPoints,
            timestamp: new Date().toISOString()
          });
          console.log('Points envoyés via Socket.io');
        } catch (error) {
          console.error('Erreur lors de l\'envoi des points via Socket.io:', error);
        }
      }
      
      console.log('Points handball sauvegardés localement');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des points:', error);
      return false;
    }
  }
  
  // ----- RÉINITIALISATION DU TOURNOI -----
function resetTournament() {
  try {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;
    
    console.log("Début de la réinitialisation du tournoi...");
    
    // 1. Effacer toutes les données stockées dans localStorage
    localStorage.removeItem('handballTournamentState');
    localStorage.removeItem('handballLastUpdate');
    localStorage.removeItem('lastUpdate');
    localStorage.removeItem('handballPoints');
    
    // 2. Réinitialiser l'état en mémoire
    tournamentState = {
      matches: {
        // Matchs de poule (matchIds 1 à 12)
        1: { matchType: 'Poule', team1: 'FGES', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:45' },
        2: { matchType: 'Poule', team1: 'FMMS', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15' },
        3: { matchType: 'Poule', team1: 'ICAM', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:45' },
        4: { matchType: 'Poule', team1: 'IKPO', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:15' },
        5: { matchType: 'Poule', team1: 'JUNIA', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45' },
        6: { matchType: 'Poule', team1: 'FMMS', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:15' },
        7: { matchType: 'Poule', team1: 'FGES', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:45' },
        8: { matchType: 'Poule', team1: 'IKPO', team2: 'ICAM', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:15' },
        9: { matchType: 'Poule', team1: 'JUNIA', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '16:45' },
        10: { matchType: 'Poule', team1: 'ICAM', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:15' },
        11: { matchType: 'Poule', team1: 'FLD', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '17:45' },
        12: { matchType: 'Poule', team1: 'IKPO', team2: 'JUNIA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:15' },
        // Finale (matchId 13)
        13: { matchType: 'Finale', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '18:45' }
      }
    };
    
    // 3. Notification visuelle de réinitialisation
    alert('Tournoi réinitialisé avec succès');
    
    // 4. Mettre à jour l'interface avec les données réinitialisées
    updateUI();
    
    // 5. Revenir à l'onglet poule
    const phaseSelect = document.getElementById('phaseSelect');
    if (phaseSelect) {
      phaseSelect.value = 'poule-phase';
      phaseSelect.dispatchEvent(new Event('change'));
    }
    
    // 6. Si Socket.io est disponible, informer le serveur
    if (window.handballSocket) {
      window.handballSocket.emit('reset_tournament', { 
        sport: 'handball',
        state: tournamentState,
        timestamp: new Date().toISOString()
      });
      console.log('Notification de réinitialisation envoyée au serveur');
    }
    
    // 7. Enregistrer l'état réinitialisé
    saveTournamentState();
    
    console.log("Réinitialisation terminée avec succès");
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    alert("Erreur lors de la réinitialisation: " + error.message);
    return false;
  }
}

// ----- EXPOSITION DES FONCTIONS GLOBALES -----
  window.simulateMatch = simulateMatch;
  window.simulateTournament = simulateTournament;
  window.resetTournament = resetTournament;
  
  // Ajouter les gestionnaires de clic
  function addMatchClickHandlers() {
      const matchElements = document.querySelectorAll('.match[data-match-id]');
      if (!matchElements || matchElements.length === 0) return;
      
      matchElements.forEach(match => {
          match.addEventListener('click', async function() {
              const matchId = parseInt(this.dataset.matchId);
              const matchData = tournamentState.matches[matchId];
              
              // Ajouter la gestion du mode correction
              if (correctionModeActive && matchData.status === 'terminé') {
                  if (confirm('Voulez-vous corriger ce match ?')) {
                      const params = new URLSearchParams({
                          matchId: matchId,
                          team1: matchData.team1,
                          team2: matchData.team2,
                          matchType: matchData.matchType,
                          score1: matchData.score1,
                          score2: matchData.score2,
                          correction: 'true'
                      });
                      window.location.href = `marquage.html?${params.toString()}`;
                  }
                  return;
              }
  
              // Reste du code existant pour la gestion des matchs normaux
              try {
                  // Vérifier si le match précédent est terminé (sauf pour le premier match)
                  if (matchId > 1) {
                      const previousMatch = tournamentState.matches[matchId - 1];
                      if (previousMatch.status !== 'terminé') {
                          alert('Le match précédent doit être terminé avant de commencer celui-ci.');
                          return;
                      }
                  }
  
                  const matchData = tournamentState.matches[matchId];
                  const displayType = matchData.matchType; // Utilise directement matchType qui est déjà 'Poule' ou 'Finale'
  
                  if (matchData.status === 'à_venir') {
                      matchData.status = 'en_cours';
                      
                      // Mise à jour du statut
                      await fetch(`/api/match-status/${matchId}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              status: 'en_cours',
                              score1: 0,
                              score2: 0,
                              id_terrain: 8
                          })
                      });
  
                      // Notification Socket.io en plus de la sauvegarde locale
                      if (window.io) {
                          try {
                              const socket = io('/handball');
                              socket.emit('statusUpdate', {
                                  matchId: matchId,
                                  status: 'en_cours',
                                  score1: 0,
                                  score2: 0,
                                  id_terrain: 8
                              });
                          } catch (error) {
                              console.error('Erreur Socket.io:', error);
                          }
                      }
                      
                      saveTournamentState();
  
                      const params = new URLSearchParams({
                          matchId: matchId,
                          team1: matchData.team1,
                          team2: matchData.team2,
                          matchType: displayType,
                          score1: '0',
                          score2: '0'
                      });
  
                      window.location.href = `marquage.html?${params.toString()}`;
                  }
              } catch (error) {
                  console.error('Erreur lors du traitement du match:', error);
                  alert('Une erreur est survenue lors du traitement du match');
              }
          });
  
          // Mise à jour visuelle des matchs non-cliquables
          function updateMatchClickability() {
              document.querySelectorAll('.match[data-match-id]').forEach(matchElement => {
                  const matchId = parseInt(matchElement.dataset.matchId);
                  const match = tournamentState.matches[matchId];
  
                  if (matchId > 1) {
                      const previousMatch = tournamentState.matches[matchId - 1];
                      if (previousMatch.status !== 'terminé') {
                          matchElement.classList.add('disabled');
                          matchElement.style.cursor = 'not-allowed';
                          matchElement.style.opacity = '0.6';
                      } else {
                          matchElement.classList.remove('disabled');
                          matchElement.style.cursor = 'pointer';
                          matchElement.style.opacity = '1';
                      }
                  }
              });
          }
  
          // Appeler updateMatchClickability lors de la mise à jour de l'UI
          const originalUpdateUI = window.updateUI; // Utiliser window.updateUI au lieu de updateUI
          window.updateUI = function() {
              originalUpdateUI();
              updateMatchClickability();
          };
  
          // Appeler updateMatchClickability au chargement initial
          updateMatchClickability();
      });
  }
  
  let correctionModeActive = false;
  
  function toggleCorrectionMode() {
      correctionModeActive = !correctionModeActive;
      const button = document.getElementById('correctionMode');
      
      if (button) {
          if (correctionModeActive) {
              button.style.backgroundColor = '#4CAF50';
              button.title = 'Mode correction actif';
              console.log('Mode correction activé');
          } else {
              button.style.backgroundColor = '#f44336';
              button.title = 'Mode correction inactif';
              console.log('Mode correction désactivé');
          }
      } else {
          console.error("Bouton 'correctionMode' introuvable");
      }
  }
  
  // Ajouter cette nouvelle fonction pour gérer les stats de la poule
  function updateGroupStandings() {
      // Calculer les statistiques
      const teamStats = {};
      
      // Initialiser les stats pour chaque équipe de la poule
      pouleTeams.forEach(team => {
          teamStats[team] = {
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0
          };
      });
  
      // Mettre à jour les stats avec les résultats des matchs
      for (let i = 1; i <= 12; i++) {
          const match = tournamentState.matches[i];
          if (match && match.status === 'terminé') {
              // Équipe 1
              teamStats[match.team1].played++;
              teamStats[match.team1].goalsFor += match.score1;
              teamStats[match.team1].goalsAgainst += match.score2;
              
              // Équipe 2
              teamStats[match.team2].played++;
              teamStats[match.team2].goalsFor += match.score2;
              teamStats[match.team2].goalsAgainst += match.score1;
  
              // Attribuer les points (victoire = 3pts, nul = 2pts, défaite = 1pt)
              if (match.score1 === match.score2) {
                  teamStats[match.team1].draws++;
                  teamStats[match.team2].draws++;
                  teamStats[match.team1].points += 2;
                  teamStats[match.team2].points += 2;
              } else if (match.winner === match.team1) {
                  teamStats[match.team1].wins++;
                  teamStats[match.team2].losses++;
                  teamStats[match.team1].points += 3;
                  teamStats[match.team2].points += 1;
              } else {
                  teamStats[match.team2].wins++;
                  teamStats[match.team1].losses++;
                  teamStats[match.team2].points += 3;
                  teamStats[match.team1].points += 1;
              }
          }
      }
  
      // Trier les équipes
      const sortedTeams = Object.entries(teamStats).sort((a, b) => {
          if (b[1].points !== a[1].points) return b[1].points - a[1].points;
          const diffA = a[1].goalsFor - a[1].goalsAgainst;
          const diffB = b[1].goalsFor - b[1].goalsAgainst;
          if (diffB !== diffA) return diffB - diffA;
          return b[1].goalsFor - a[1].goalsFor;
      });
  
      // Mettre à jour l'affichage
      const groupList = document.getElementById('groupList');
      if (!groupList) return;
  
      groupList.innerHTML = sortedTeams.map(([team, stats], index) => `
          <div class="ranking-row ${index < 2 ? 'qualified' : ''}">
              <div class="rank">${index + 1}</div>
              <div class="name">
                  <img src="/img/${team}.png" alt="${team}" class="team-logo-mini" />
                  ${team}
              </div>
              <div class="stats">${stats.played}</div>
              <div class="stats">${stats.wins}</div>
              <div class="stats">${stats.draws}</div>
              <div class="stats">${stats.losses}</div>
              <div class="stats">${stats.points}</div>
              <div class="stats">${stats.goalsFor}</div>
              <div class="stats">${stats.goalsAgainst}</div>
              <div class="stats">${stats.goalsFor - stats.goalsAgainst}</div>
          </div>
      `).join('');
  
      console.log('Classement mis à jour:', sortedTeams);
  }
  
  // ----- GESTION DE LA FINALE -----
  async function setupFinalMatch() {
      try {
          const teamStats = calculateTeamStats();
          console.log("Stats des équipes:", teamStats);
  
          // Trier les équipes par points et différence de buts
          const sortedTeams = Object.entries(teamStats)
              .sort((a, b) => {
                  if (b[1].points !== a[1].points) return b[1].points - a[1].points;
                  const diffA = a[1].goalsFor - a[1].goalsAgainst;
                  const diffB = b[1].goalsFor - b[1].goalsAgainst;
                  return diffB - diffA;
              });
  
          console.log("Équipes triées:", sortedTeams);
  
          // Configurer la finale
          const finalMatch = tournamentState.matches[13];
          finalMatch.team1 = sortedTeams[0][0];
          finalMatch.team2 = sortedTeams[1][0];
          finalMatch.status = 'à_venir';
          finalMatch.score1 = null;
          finalMatch.score2 = null;
  
          console.log("Finale configurée:", finalMatch);
  
          saveTournamentState();
          updateUI();
          
          // Activer visuellement le match de finale
          const finalElement = document.querySelector('.match[data-match-id="13"]');
          if (finalElement) {
              finalElement.classList.remove('disabled');
              finalElement.style.cursor = 'pointer';
              finalElement.style.opacity = '1';
          }
  
      } catch (error) {
          console.error("Erreur lors de la configuration de la finale:", error);
      }
  }
  
  // ----- EXPOSITION DE LA FONCTION DE CORRECTION -----
  window.toggleCorrectionMode = toggleCorrectionMode;
  
  // Ajout d'une fonction globale pour être appelée depuis handball.html
  window.updateTournamentFromSync = function(newState) {
    if (newState) {
      tournamentState = newState;
      console.log("État du tournoi mis à jour depuis le module de synchronisation");
      
      // Appel sécurisé à updateUI
      if (typeof window.updateUI === 'function') {
        window.updateUI();
      }
    }
  };

    // Exposer les fonctions pour les utiliser dans le HTML
    window.simulateMatch = simulateMatch;
    window.simulateTournament = simulateTournament;
    window.resetTournament = resetTournament;
    window.updateUI = updateUI;
    window.updatePouleStandings = updatePouleStandings;
    window.updateRankingDisplay = updateRankingDisplay;
    window.navigateToScoring = navigateToScoring;