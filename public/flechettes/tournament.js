/***********************************************
 * tournament.js
 * Gestion du tournoi, simulation et classement
 ***********************************************/

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
  
  // AJOUTER CETTE FONCTION AU DÉBUT DU FICHIER, AVANT SON UTILISATION
  // Fonction helper pour trier les équipes
  function sortTeams(a, b) {
      if (a[1].points !== b[1].points) return b[1].points - a[1].points;
      const diffA = a[1].goalsFor - a[1].goalsAgainst;
      const diffB = b[1].goalsFor - b[1].goalsAgainst;
      return diffB - diffA;
  }
  
  const teams = {};
  allTeams.sort().forEach((name, index) => {
    teams[name] = {
      id: index + 1,
      name: name,
      logo: `/img/${name}.png`
    };
  });
  
  // Définir les terrains avec leur ID correct
  const terrains = {
      'Cible 1': 2,
      'Cible 2': 3,
      'Cible 3': 4,
      'Cible 4': 5
  };
  
  // Définition des équipes par poule
  const pouleATeams = ["ESPAS-ESTICE", "FGES", "FMMS", "FLSH"];
  const pouleBTeams = ["IKPO", "PIKTURA", "LiDD", "USCHOOL", "FLD"];
  
  // ----- STRUCTURE DU TOURNOI -----
  let tournamentState = {
      matches: {
          // Poule A (matchIds 1 à 6)
          1: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 3', terrainId: 4 },
          2: { matchType: 'poule_a', team1: 'FGES', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 4', terrainId: 5 },
          3: { matchType: 'poule_a', team1: 'FLSH', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 1', terrainId: 2 },
          4: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 2', terrainId: 3 },
          5: { matchType: 'poule_a', team1: 'FMMS', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 1', terrainId: 2 },
          6: { matchType: 'poule_a', team1: 'FGES', team2: 'ESPAS-ESTICE', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 2', terrainId: 3 },
  
          // Poule B (matchIds 7 à 16)
          7: { matchType: 'poule_b', team1: 'LiDD', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 1', terrainId: 2 },
          8: { matchType: 'poule_b', team1: 'IKPO', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 2', terrainId: 3 },
          9: { matchType: 'poule_b', team1: 'USCHOOL', team2: 'FLD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 3', terrainId: 4 },
          10: { matchType: 'poule_b', team1: 'PIKTURA', team2: 'LiDD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 4', terrainId: 5 },
          11: { matchType: 'poule_b', team1: 'IKPO', team2: 'USCHOOL', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 3', terrainId: 4 },
          12: { matchType: 'poule_b', team1: 'FLD', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 4', terrainId: 5 },
          13: { matchType: 'poule_b', team1: 'LiDD', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 1', terrainId: 2 },
          14: { matchType: 'poule_b', team1: 'USCHOOL', team2: 'PIKTURA', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:45', terrain: 'Cible 2', terrainId: 3 },
          15: { matchType: 'poule_b', team1: 'PIKTURA', team2: 'IKPO', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:30', terrain: 'Cible 1', terrainId: 2 },
          16: { matchType: 'poule_b', team1: 'FLD', team2: 'LiDD', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '12:30', terrain: 'Cible 2', terrainId: 3 },
  
          // Classification demi-finale (5-8)
          17: { matchType: 'classif_semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15', terrain: 'Cible 2', terrainId: 3, nextMatchWin: 19, nextMatchLose: 20 },
          18: { matchType: 'classif_semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:00', terrain: 'Cible 2', terrainId: 3, nextMatchWin: 19, nextMatchLose: 20 },
  
          // Finales de classification
          19: { matchType: 'final_5th', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45', terrain: 'Cible 2', terrainId: 3 },
          20: { matchType: 'final_7th', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:30', terrain: 'Cible 2', terrainId: 3 },
  
          // Demi-finales principales
          21: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '13:15', terrain: 'Cible 1', terrainId: 2, nextMatchWin: 23, nextMatchLose: 22 },
          22: { matchType: 'semifinal', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:00', terrain: 'Cible 1', terrainId: 3, nextMatchWin: 23, nextMatchLose: 22 },
  
          // Finales principales
          23: { matchType: 'bronze_final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '14:45', terrain: 'Cible 1', terrainId: 2 },
          24: { matchType: 'final', team1: null, team2: null, score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '15:30', terrain: 'Cible 1', terrainId: 2 }
      }
  };
  
  // Fonction pour sauvegarder l'état du tournoi
  function saveTournamentState() {
      localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
      localStorage.setItem('lastUpdate', new Date().toISOString());
  }
  
  // Fonction pour charger l'état du tournoi
  function loadTournamentState() {
      const savedState = localStorage.getItem('flechettesTournamentState');
      if (savedState) {
          tournamentState = JSON.parse(savedState);
          return true;
      }
      return false;
  }
  
  // ----- POINTS ATTRIBUÉS SELON LA PLACE FINALE -----
  // Les points sont attribués en fonction des résultats des matchs de poule et de la finale.
  const positionPoints = {
    1: 25,
    2: 20,
    3: 18,
    4: 15,
    5: 12,
    6: 10,
    7: 8,
    8: 6,
    9: 3
  };
  
  // Variables WebSocket
  let socket;
  let socketConnected = false;
  
  // Initialisation WebSocket
  function initWebSocket() {
      try {
          // Vérifier si Socket.IO est disponible
          if (typeof io === 'undefined') {
              console.log('Socket.IO n\'est pas chargé, utilisation du mode local');
              return;
          }
          
          socket = io();
          
          socket.on('connect', () => {
              console.log('Connecté au serveur WebSocket');
              socketConnected = true;
              // Mettre à jour l'indicateur de connexion
              updateConnectionStatus(true);
          });
          
          socket.on('disconnect', () => {
              console.log('Déconnecté du serveur WebSocket');
              socketConnected = false;
              updateConnectionStatus(false);
          });
          
          socket.on('connect_error', (error) => {
              console.error('Erreur de connexion WebSocket:', error);
              socketConnected = false;
              updateConnectionStatus(false);
          });
          
          // Écouter les mises à jour des matchs
          socket.on('match_updated', (data) => {
              if (data.priority === 'high' || data.priority === 'critical') {
                  console.log('Mise à jour PRIORITAIRE reçue:', data);
                  
                  // Pour les mises à jour prioritaires, on force le traitement
                  if (data.matchId && tournamentState.matches[data.matchId]) {
                      // Application directe sans vérification supplémentaire si match terminé
                      if (data.status === 'terminé') {
                          const match = tournamentState.matches[data.matchId];
                          match.status = 'terminé';
                          if (data.score1 !== undefined) match.score1 = data.score1;
                          if (data.score2 !== undefined) match.score2 = data.score2;
                          if (data.winner) match.winner = data.winner;
                          if (data.loser) match.loser = data.loser;
                          
                          saveTournamentState();
                      }
                  }
              }
              
              // Traitement normal
              handleMatchUpdate(data);
          });
  
          // Nouveau: Écouter la mise à jour forcée du statut
          socket.on('force_match_status', (data) => {
              console.log('Mise à jour forcée du statut reçue:', data);
              if (data && data.matchId && tournamentState.matches[data.matchId]) {
                  const match = tournamentState.matches[data.matchId];
                  
                  // Toujours accepter un statut "terminé"
                  if (data.status === 'terminé') {
                      match.status = 'terminé';
                      if (data.score1 !== undefined) match.score1 = data.score1;
                      if (data.score2 !== undefined) match.score2 = data.score2;
                      if (data.winner) match.winner = data.winner;
                      if (data.loser) match.loser = data.loser;
                      
                      console.log(`Match ${data.matchId} marqué comme terminé par mise à jour forcée`);
                      saveTournamentState();
                      updateUI();
                  }
              }
          });
          
          // Écouter les synchronisations globales d'état
          socket.on('matches_state_sync', (data) => {
              console.log('Synchronisation des états de match reçue');
              if (data && data.sport === 'flechettes' && data.matches) {
                  let stateChanged = false;
                  
                  // Traiter chaque match
                  Object.entries(data.matches).forEach(([matchId, matchData]) => {
                      matchId = parseInt(matchId);
                      
                      if (tournamentState.matches[matchId]) {
                          // Si le match est terminé dans les données reçues, le marquer comme terminé localement
                          if (matchData.status === 'terminé' && tournamentState.matches[matchId].status !== 'terminé') {
                              console.log(`Synchronisation: Match ${matchId} mis à jour à "terminé"`);
                              tournamentState.matches[matchId].status = 'terminé';
                              if (matchData.score1 !== undefined) tournamentState.matches[matchId].score1 = matchData.score1;
                              if (matchData.score2 !== undefined) tournamentState.matches[matchId].score2 = matchData.score2;
                              if (matchData.winner) tournamentState.matches[matchId].winner = matchData.winner;
                              if (matchData.loser) tournamentState.matches[matchId].loser = matchData.loser;
                              stateChanged = true;
                          }
                      }
                  });
                  
                  // Si des changements ont été appliqués, sauvegarder et mettre à jour l'UI
                  if (stateChanged) {
                      console.log("Des matchs ont été mis à jour depuis la synchronisation");
                      saveTournamentState();
                      updateUI();
                  }
              }
          });
  
          // Ajouter un gestionnaire pour l'événement de réinitialisation
          socket.on('reset_tournament', (data) => {
              console.log('Événement de réinitialisation reçu:', data);
              
              if (data.sport === 'flechettes') {
                  // Afficher une notification à l'utilisateur
                  const notification = document.createElement('div');
                  notification.className = 'reset-notification';
                  notification.textContent = 'Le tournoi a été réinitialisé par un autre utilisateur. Rechargement...';
                  notification.style.position = 'fixed';
                  notification.style.top = '50%';
                  notification.style.left = '50%';
                  notification.style.transform = 'translate(-50%, -50%)';
                  notification.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                  notification.style.color = 'white';
                  notification.style.padding = '20px';
                  notification.style.borderRadius = '10px';
                  notification.style.zIndex = '9999';
                  document.body.appendChild(notification);
                  
                  // Supprimer les données locales
                  localStorage.removeItem('flechettesTournamentState');
                  localStorage.removeItem('lastUpdate');
                  localStorage.removeItem('flechettesPoints');
                  
                  // Attendre un peu avant de recharger pour que l'utilisateur voie la notification
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
              }
          });
          
          // Nouvel événement pour les mises à jour prioritaires
          socket.on('force_match_update', (data) => {
              console.log('Mise à jour CRITIQUE reçue:', data);
              if (data.action === 'enforce_match_completion' && data.matchId) {
                  const match = tournamentState.matches[data.matchId];
                  if (match) {
                      // Appliquer inconditionnellement cette mise à jour
                      match.status = 'terminé';
                      if (data.score1 !== undefined) match.score1 = data.score1;
                      if (data.score2 !== undefined) match.score2 = data.score2;
                      if (data.winner) match.winner = data.winner;
                      if (data.loser) match.loser = data.loser;
                      
                      console.log(`Match ${data.matchId} FORCÉ à "terminé"`);
                      saveTournamentState();
                      updateUI();
                      
                      // Afficher un indicateur visuel
                      showSyncNotification('Match mis à jour (terminé)');
                  }
              }
          });
          
          // Nouvelle réponse au broadcast global
          socket.on('global_state_refresh', (data) => {
              console.log('Rafraîchissement global des états reçu');
              
              if (data && data.matchStates) {
                  let stateChanged = false;
                  
                  // Vérifier tous les matchs "terminés" dans les données reçues
                  Object.entries(data.matchStates).forEach(([matchId, matchData]) => {
                      matchId = parseInt(matchId);
                      
                      if (tournamentState.matches[matchId] && 
                          matchData.status === 'terminé' && 
                          tournamentState.matches[matchId].status !== 'terminé') {
                          
                          console.log(`Synchronisation globale: Match ${matchId} corrigé à "terminé"`);
                          tournamentState.matches[matchId].status = 'terminé';
                          if (matchData.score1 !== undefined) tournamentState.matches[matchId].score1 = matchData.score1;
                          if (matchData.score2 !== undefined) tournamentState.matches[matchId].score2 = matchData.score2;
                          if (matchData.winner) tournamentState.matches[matchId].winner = matchData.winner;
                          if (matchData.loser) tournamentState.matches[matchId].loser = matchData.loser;
                          stateChanged = true;
                      }
                  });
                  
                  if (stateChanged) {
                      console.log("État synchronisé depuis le serveur");
                      saveTournamentState();
                      updateUI();
                      showSyncNotification('Synchronisation réussie');
                  }
              }
          });
          
      } catch (error) {
          console.error('Erreur lors de l\'initialisation WebSocket:', error);
      }
  }
  
  // Gérer les mises à jour des matchs provenant d'autres clients
  function handleMatchUpdate(data) {
      if (!data || !data.matchId) return;
      
      console.log('Mise à jour du match reçue:', data);
      
      // Mettre à jour l'état local
      if (tournamentState.matches[data.matchId]) {
          tournamentState.matches[data.matchId] = {
              ...tournamentState.matches[data.matchId],
              ...data
          };
          
          // Mettre à jour l'interface utilisateur
          updateUI();
      }
  }
  
  // Gérer les mises à jour de statut
  function handleStatusUpdate(data) {
      if (!data || !data.matchId) return;
      
      console.log('Mise à jour de statut reçue:', data);
      
      // Vérifier si la mise à jour est plus récente que notre état actuel
      const currentMatch = tournamentState.matches[data.matchId];
      
      // Si le match est déjà marqué comme terminé dans notre état local,
      // mais qu'on reçoit une mise à jour qui le marque comme "en cours",
      // ignorer cette mise à jour pour éviter de revenir en arrière
      if (currentMatch.status === 'terminé' && data.status === 'en_cours') {
          console.log(`Match ${data.matchId} déjà terminé localement, mise à jour ignorée`);
          
          // Renvoyer immédiatement notre état à tous pour forcer la cohérence
          if (socket && socketConnected) {
              socket.emit('force_match_status', {
                  matchId: data.matchId,
                  status: 'terminé',
                  score1: currentMatch.score1,
                  score2: currentMatch.score2,
                  winner: currentMatch.winner,
                  loser: currentMatch.loser,
                  // Ajouter un timestamp pour résoudre les conflits
                  timestamp: Date.now()
              });
          }
          return;
      }
      
      // Appliquer normalement la mise à jour
      if (currentMatch) {
          if (data.status) currentMatch.status = data.status;
          if (data.score1 !== undefined) currentMatch.score1 = data.score1;
          if (data.score2 !== undefined) currentMatch.score2 = data.score2;
          if (data.winner) currentMatch.winner = data.winner;
          if (data.loser) currentMatch.loser = data.loser;
          
          // Sauvegarder les changements immédiatement
          saveTournamentState();
          
          // Mettre à jour l'interface utilisateur
          updateUI();
          
          // Si match terminé, vérifier si on doit configurer les prochains matchs
          if (data.status === 'terminé') {
              console.log(`Match ${data.matchId} terminé, mise à jour des prochains matchs si nécessaire`);
              const pouleAMatchesFinished = checkPouleMatchesFinished('A');
              const pouleBMatchesFinished = checkPouleMatchesFinished('B');
              
              if (pouleAMatchesFinished && pouleBMatchesFinished) {
                  console.log("Tous les matchs de poule sont terminés, configuration des prochaines phases...");
                  setupSemiFinals();
                  setupClassificationMatches();
              }
          }
      }
  }
  
  // Afficher l'état de la connexion WebSocket
  function updateConnectionStatus(isConnected) {
      let statusElement = document.getElementById('connectionStatus');
      
      if (!statusElement) {
          statusElement = document.createElement('div');
          statusElement.id = 'connectionStatus';
          statusElement.className = 'connection-status';
          document.body.appendChild(statusElement);
      }
      
      if (isConnected) {
          statusElement.innerHTML = '🟢 Connecté';
          statusElement.classList.add('connected');
      } else {
          statusElement.innerHTML = '🔴 Mode hors ligne';
          statusElement.classList.remove('connected');
      }
  }
  
  // ----- INITIALISATION -----
  document.addEventListener('DOMContentLoaded', function() {
      try {
          console.log("Initialisation du tournoi...");
          
          // Essayer de charger l'état du tournoi
          let loadSuccess = false;
          try {
              loadSuccess = loadTournamentState();
          } catch (e) {
              console.error("Erreur lors du chargement du tournoi:", e);
          }
          
          // Si le chargement a échoué, essayer la récupération
          if (!loadSuccess) {
              console.log("Chargement du tournoi échoué, tentative de récupération");
              recoverTournamentState();
          }
          
          // Mettre à jour l'interface et ajouter les gestionnaires d'événements
          try {
              updateUI();
              addMatchClickHandlers();
              
              // S'assurer que la poule A est affichée par défaut
              console.log("Affichage de la poule A par défaut");
              updateGroupStandings('A');
              
              // Initialiser les boutons de sélection de poule
              initializePouleButtons();
          } catch (e) {
              console.error("Erreur lors de la mise à jour de l'interface:", e);
          }
          
          // Initialiser WebSocket avec gestion d'erreur
          try {
              initWebSocket();
          } catch (e) {
              console.error("Erreur lors de l'initialisation de WebSocket:", e);
              updateConnectionStatus(false);
          }
      } catch (e) {
          console.error("Erreur critique lors de l'initialisation du tournoi:", e);
          alert("Une erreur s'est produite lors de l'initialisation. Essayez de rafraîchir la page.");
      }
  });
  
  // ----- MISE À JOUR DE L'INTERFACE (affichage des scores, logos et couleurs) -----
  function updateUI() {
      Object.entries(tournamentState.matches).forEach(([matchId, matchData]) => {
          const matchElement = document.querySelector(`.match[data-match-id='${matchId}']`);
          if (!matchElement) return;
          
          matchElement.setAttribute('data-status', matchData.status);
          
          const teamDivs = matchElement.querySelectorAll('.team');
          if (teamDivs.length < 2) return;
          
          // Passer l'objet match complet au lieu de juste le winner
          fillTeamDiv(teamDivs[0], matchData.team1, matchData.score1, matchData);
          fillTeamDiv(teamDivs[1], matchData.team2, matchData.score2, matchData);
          
          // Mettre à jour l'heure et le statut
          const infoContainer = matchElement.querySelector('.match-info-container');
          if (infoContainer) {
            const timeDiv = infoContainer.querySelector('.match-time');
            const statusDiv = infoContainer.querySelector('.match-status');
            const matchTypeDiv = infoContainer.querySelector('.match-type');
  
            if (timeDiv) timeDiv.textContent = matchData.time || '';
            if (statusDiv) statusDiv.textContent = matchData.status.replace('_', ' ');
  
            // Correction : Afficher le type de match correctement
            if (matchTypeDiv) {
                matchTypeDiv.textContent = matchData.matchType.includes('poule') 
                    ? 'Match de Poule' 
                    : matchData.matchType.replace('_', ' ');
            }
          }
      });
      
      // Mise à jour automatique du classement après chaque changement
      updateRankingDisplay();
    
      // Mise à jour du champion
      const finalMatch = tournamentState.matches[13];
      const championDiv = document.getElementById('champion');
      if (championDiv) {
        if (finalMatch && finalMatch.winner) {
          championDiv.textContent = finalMatch.winner;
          championDiv.style.display = 'block';
          // Ajouter une animation pour le champion
      } else {
        championDiv.textContent = 'À déterminer';
        championDiv.style.display = 'block';
        championDiv.classList.remove('champion-crowned');
      }
    }
  
    // Sauvegarde automatique de l'état
    localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
  
    // Ajouter cette ligne après la mise à jour des matchs
    updateGroupStandings();
  
    // Vérifier si tous les matchs de poule sont terminés
    const pouleAMatchesFinished = checkPouleMatchesFinished('A'); // Matchs 1-6
    const pouleBMatchesFinished = checkPouleMatchesFinished('B'); // Matchs 7-16
  
    if (pouleAMatchesFinished && pouleBMatchesFinished) {
        console.log("Tous les matchs de poule sont terminés, configuration des demi-finales et matchs de classement...");
        setupSemiFinals();
        setupClassificationMatches();
    }
  }
  
  function fillTeamDiv(teamDiv, teamName, score, matchData) {
      const nameDiv = teamDiv.querySelector('.team-name');
      const scoreDiv = teamDiv.querySelector('.score');
      if (!nameDiv || !scoreDiv) return;
  
      if (!teamName) {
          nameDiv.innerHTML = `<div class='team-logo'></div>-`;
          scoreDiv.textContent = '-';
          teamDiv.classList.remove('winner', 'loser', 'draw');
          return;
      }
  
      const teamObj = teams[teamName];
      const logoUrl = teamObj ? teamObj.logo : `/img/default.png`;
      nameDiv.innerHTML = `<div class='team-logo' style="background-image:url('${logoUrl}')"></div>${teamName}`;
  
      if (score === null || score === undefined) {
          scoreDiv.textContent = '-';
          teamDiv.classList.remove('winner', 'loser', 'draw');
      } else {
          scoreDiv.textContent = score;
          
          // Si les scores sont égaux, appliquer le style de match nul
          if (matchData.winner === null && matchData.score1 === matchData.score2) {
              teamDiv.classList.add('draw');
              teamDiv.classList.remove('winner', 'loser');
              scoreDiv.classList.add('draw');
          } else if (matchData.winner) {
              teamDiv.classList.remove('draw');
              scoreDiv.classList.remove('draw');
              if (teamName === matchData.winner) {
                  teamDiv.classList.add('winner');
                  teamDiv.classList.remove('loser');
              } else {
                  teamDiv.classList.add('loser');
                  teamDiv.classList.remove('winner');
              }
          } else {
              teamDiv.classList.remove('winner', 'loser', 'draw');
              scoreDiv.classList.remove('draw');
          }
      }
  }
  
  function calculateTeamStats() {
      const statsA = {};
      const statsB = {}; // Ajouter cette ligne pour définir statsB
  
      // Initialiser les stats pour chaque poule
      pouleATeams.forEach(team => {
          statsA[team] = {
              played: 0, wins: 0, draws: 0, losses: 0,
              points: 0, goalsFor: 0, goalsAgainst: 0
          };
      });
  
      pouleBTeams.forEach(team => {
          statsB[team] = {
              played: 0, wins: 0, draws: 0, losses: 0,
              points: 0, goalsFor: 0, goalsAgainst: 0
          };
      });
  
      // Traiter les matchs de la poule A
      for (let i = 1; i <= 6; i++) {
          processMatchStats(tournamentState.matches[i], statsA);
      }
  
      // Traiter les matchs de la poule B
      for (let i = 7; i <= 12; i++) {
          processMatchStats(tournamentState.matches[i], statsB);
      }
  
      return { pouleA: statsA, pouleB: statsB };
  }
  
  // Fonction helper pour traiter les stats d'un match
  function processMatchStats(match, stats) {
      if (match && match.status === 'terminé') {
          stats[match.team1].played++;
          stats[match.team2].played++;
          
          if (match.score1 === match.score2) {
              stats[match.team1].draws++;
              stats[match.team2].draws++;
              stats[match.team1].points += 2;
              stats[match.team2].points += 2;
          } else if (match.winner === match.team1) {
              stats[match.team1].wins++;
              stats[match.team2].losses++;
              stats[match.team1].points += 3;
              stats[match.team2].points += 1;
          } else {
              stats[match.team2].wins++;
              stats[match.team1].losses++;
              stats[match.team2].points += 3;
              stats[match.team1].points += 1;
          }
  
          stats[match.team1].goalsFor += match.score1;
          stats[match.team1].goalsAgainst += match.score2;
          stats[match.team2].goalsFor += match.score2;
          stats[match.team2].goalsAgainst += match.score1;
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
      
      // Sauvegarder localement
      saveTournamentState();
      updateUI();
      
      // Envoyer la mise à jour via WebSocket si disponible
      if (socket && socketConnected) {
          socket.emit('update_match', {
              matchId,
              ...match
          });
      }
  }
  
  // ----- SIMULATION DE LA COMPÉTITION -----
  async function simulateTournament() {
      try {
          // 1. Simuler tous les matchs de poule
          console.log("Début simulation des matchs de poule");
          for (let i = 1; i <= 16; i++) {
              if (tournamentState.matches[i] && tournamentState.matches[i].status !== 'terminé') {
                  await simulateMatch(i);
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }
  
          // 2. Configurer les demi-finales et matchs de classement
          setupSemiFinals();
          setupClassificationMatches();
  
          // 3. Simuler les demi-finales et matchs de classement
          for (let i = 17; i <= 22; i++) {
              if (tournamentState.matches[i] && tournamentState.matches[i].status !== 'terminé') {
                  await simulateMatch(i);
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }
  
          // 4. Configurer les finales
          setupFinals();
  
          // 5. Simuler les finales
          for (let i = 19; i <= 24; i++) {
              if (tournamentState.matches[i] && tournamentState.matches[i].status !== 'terminé') {
                  await simulateMatch(i);
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }
          
          saveTournamentState();
          updateUI();
          alert('Simulation terminée !');
  
      } catch (error) {
          console.error('Erreur lors de la simulation:', error);
          alert('Erreur lors de la simulation du tournoi');
      }
  }
  
  // ----- CALCUL DU CLASSEMENT FINAL -----
  function calculateRankings() {
      let ranking = allTeams.map(name => ({ 
          name,
          points: 0,
          position: null,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0
      }));
  
      // Trier par ordre alphabétique
      ranking.sort((a, b) => a.name.localeCompare(b.name));
  
      // Charger les points sauvegardés si disponibles
      const savedPoints = JSON.parse(localStorage.getItem('flechettesPoints') || '{}');
      ranking.forEach(team => {
          if (savedPoints[team.name]) {
              team.points = savedPoints[team.name];
          }
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
      let highlightClass = '';
      if (position === 1) highlightClass = 'highlight-1';
      else if (position === 2) highlightClass = 'highlight-2';
      else if (position === 3) highlightClass = 'highlight-3';
      else if (position === 4) highlightClass = 'highlight-4';
      
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
  
  // Modifier la fonction sendPointsToServer pour gérer le cas où l'API n'est pas disponible
  async function sendPointsToServer(teamPoints) {
      try {
          // Temporairement désactivé jusqu'à ce que l'API soit disponible
          console.log('Points à envoyer (API non disponible):', teamPoints);
          
          // Sauvegarder quand même les points localement
          localStorage.setItem('flechettesPoints', JSON.stringify(teamPoints));
          
          // Ne pas afficher d'erreur à l'utilisateur
          return true;
          
          /* Code à réactiver quand l'API sera disponible
          const response = await fetch('/api/points/flechettes', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  points: teamPoints
              })
          });
  
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const result = await response.json();
          console.log('Points mis à jour avec succès:', result);
          return result;
          */
      } catch (error) {
          // Logger l'erreur mais ne pas l'afficher à l'utilisateur
          console.log('Debug - Erreur API fléchettes:', error);
          return false;
      }
  }
  
  // ----- RÉINITIALISATION DU TOURNOI -----
  function resetTournament() {
    if (!confirm('Voulez-vous vraiment réinitialiser le tournoi ? Toutes les données seront effacées.')) return;
    
    try {
        // Efface les données sauvegardées localement
        localStorage.removeItem('flechettesTournamentState');
        localStorage.removeItem('lastUpdate');
        localStorage.removeItem('flechettesPoints');
        
        // Notification pour informer que la réinitialisation est en cours
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '20px';
        notification.style.borderRadius = '10px';
        notification.style.zIndex = '9999';
        notification.innerHTML = 'Réinitialisation du tournoi en cours...';
        document.body.appendChild(notification);
        
        // Envoyer l'événement de réinitialisation si WebSocket est disponible
        let resetEventSent = false;
        if (typeof socket !== 'undefined' && socket && socketConnected) {
            try {
                socket.emit('reset_tournament', { 
                    sport: 'flechettes',
                    timestamp: Date.now(),
                    initiatedBy: socket.id
                });
                resetEventSent = true;
            } catch (e) {
                console.error("Erreur lors de l'envoi de l'événement de réinitialisation:", e);
            }
        }
        
        // Recharger la page après un court délai
        setTimeout(() => {
            window.location.reload();
        }, resetEventSent ? 1000 : 500);
        
    } catch (e) {
        console.error("Erreur lors de la réinitialisation du tournoi:", e);
        alert("Une erreur s'est produite lors de la réinitialisation. Veuillez rafraîchir la page manuellement.");
        window.location.reload();
    }
  }
  
  // ----- EXPOSITION DES FONCTIONS GLOBALES -----
  window.simulateMatch = simulateMatch;
  window.simulateTournament = simulateTournament;
  window.resetTournament = resetTournament;
  
  // Ajouter les gestionnaires de clic
  function addMatchClickHandlers() {
      document.querySelectorAll('.match[data-match-id]').forEach(match => {
          match.addEventListener('click', async function() {
              try {
                  const matchId = parseInt(this.dataset.matchId);
                  const matchData = tournamentState.matches[matchId];
                  const displayType = matchData.matchType === 'poule' ? 'Poule' : 'Finale';
  
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
      });
  }
  
  let correctionModeActive = false;
  
  function toggleCorrectionMode() {
      correctionModeActive = !correctionModeActive;
      const button = document.getElementById('correctionMode');
      
      if (correctionModeActive) {
          button.style.backgroundColor = '#4CAF50';
          button.title = 'Mode correction actif';
      } else {
          button.style.backgroundColor = '#f44336';
          button.title = 'Mode correction inactif';
      }
  }
  
  // FONCTION UNIFIÉE: Remplacer TOUTES les versions de updateGroupStandings par celle-ci
  function updateGroupStandings(poule = 'A') {
      console.log(`Mise à jour du classement et matchs de la poule ${poule}...`);
      
      // Sélectionner les équipes et matchs selon la poule
      const teams = poule === 'A' ? pouleATeams : pouleBTeams;
      const matchRange = poule === 'A' ? {start: 1, end: 6} : {start: 7, end: 16};
      
      const stats = {};
      
      // Initialiser les stats pour la poule sélectionnée
      teams.forEach(team => {
          stats[team] = {
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              goalsFor: 0,
              goalsAgainst: 0
          };
      });
  
      // Traiter les matchs de la poule sélectionnée
      for (let i = matchRange.start; i <= matchRange.end; i++) {
          const match = tournamentState.matches[i];
          if (match && match.status === 'terminé') {
              processMatchStats(match, stats);
          }
      }
  
      // Trier les équipes
      const sortedTeams = Object.entries(stats).sort(sortTeams);
  
      // Mettre à jour l'affichage dans l'élément groupList principal
      const groupList = document.getElementById('groupList');
      if (groupList) {
          groupList.innerHTML = sortedTeams.map(([team, stats], index) => {
              let highlightClass = '';
              if (index === 0 || index === 1) highlightClass = 'qualification'; // 1ère et 2e places
              else if (index === 2 || index === 3) highlightClass = 'qualification-classement'; // 3e et 4e places
  
              return `
                  <div class="ranking-row ${highlightClass}">
                      <div class="rank">${index + 1}</div>
                      <div class="name">
                          <img src="/img/${team}.png" alt="${team}" class="team-logo-mini" onerror="this.src='/img/default.png'"/>
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
              `;
          }).join('');
          console.log(`Classement de la poule ${poule} mis à jour avec ${sortedTeams.length} équipes`);
      } else {
          console.error("L'élément #groupList n'a pas été trouvé dans le DOM");
      }
  
      // IMPORTANT: Mettre à jour la liste des matchs explicitement
      updateMatchesList(poule);
  
      // Mettre à jour le titre de la poule
      const titleElement = document.getElementById('currentPouleTitle');
      if (titleElement) {
          titleElement.textContent = `Poule ${poule}`;
      }
  }
  
  // Fonction révisée pour mettre à jour correctement la liste des matchs d'une poule
  function updateMatchesList(poule) {
      console.log(`Mise à jour de la liste des matchs de la poule ${poule}...`);
      const matchesContainer = document.getElementById('currentPouleMatches');
      const matchRange = poule === 'A' ? {start: 1, end: 6} : {start: 7, end: 16};
      
      if (!matchesContainer) {
          console.error("ERREUR CRITIQUE: Élément #currentPouleMatches introuvable dans le DOM");
          return;
      }
      
      // Debug: afficher le conteneur et ses attributs
      console.log("Conteneur trouvé:", matchesContainer);
      console.log("Type du conteneur:", matchesContainer.tagName);
      console.log("Classes du conteneur:", matchesContainer.className);
      
      let matchesHTML = '';
      let matchCount = 0;
      
      for (let i = matchRange.start; i <= matchRange.end; i++) {
          const match = tournamentState.matches[i];
          if (!match) {
              console.warn(`Match ${i} non trouvé dans tournamentState`);
              continue;
          }
          
          // Debug: afficher les détails du match
          console.log(`Match ${i}:`, match.team1, "vs", match.team2, "Status:", match.status);
          
          let team1Logo = '/img/default.png';
          let team2Logo = '/img/default.png';
          
          if (match.team1 && teams[match.team1]) {
              team1Logo = teams[match.team1].logo || '/img/default.png';
          }
          if (match.team2 && teams[match.team2]) {
              team2Logo = teams[match.team2].logo || '/img/default.png';
          }
          
          matchesHTML += `
              <div class="match-wrapper">
                  <div class="match" data-match-id="${i}" data-match-type="poule_${poule.toLowerCase()}" data-status="${match.status || 'à_venir'}">
                      <div class="team ${match.winner === match.team1 ? 'winner' : match.loser === match.team1 ? 'loser' : ''}">
                          <div class="team-name">
                              <div class="team-logo" style="background-image:url('${team1Logo}')"></div>
                              ${match.team1}
                          </div>
                          <div class="score">${match.score1 !== null ? match.score1 : '-'}</div>
                      </div>
                      <div class="team ${match.winner === match.team2 ? 'winner' : match.loser === match.team2 ? 'loser' : ''}">
                          <div class="team-name">
                              <div class="team-logo" style="background-image:url('${team2Logo}')"></div>
                              ${match.team2}
                          </div>
                          <div class="score">${match.score2 !== null ? match.score2 : '-'}</div>
                      </div>
                      <div class="match-info-container">
                          <div class="match-time">${match.time || ''}</div>
                          <div class="match-status">${(match.status || 'à_venir').replace('_', ' ')}</div>
                      </div>
                  </div>
              </div>
          `;
          matchCount++;
      }
      
      // Vérifier si nous avons généré des matchs
      if (matchCount > 0) {
          matchesContainer.innerHTML = matchesHTML;
          console.log(`${matchCount} matchs générés pour la poule ${poule}`);
      } else {
          matchesContainer.innerHTML = '<div class="match-placeholder">Aucun match trouvé pour cette poule</div>';
          console.warn(`Aucun match trouvé pour la poule ${poule}`);
      }
      
      // Réappliquer les gestionnaires de clic sur les nouveaux matchs
      addMatchClickHandlers();
  }
  
  // Fonction pour vérifier si tous les matchs d'une poule sont terminés
  function checkPouleMatchesFinished(poule) {
      const matchRange = poule === 'A' ? {start: 1, end: 6} : {start: 7, end: 16};
      
      for (let i = matchRange.start; i <= matchRange.end; i++) {
          if (tournamentState.matches[i].status !== 'terminé') {
              return false;
          }
      }
      
      return true;
  }
  
  // Configuration des demi-finales principales
  function setupSemiFinals() {
      const stats = calculateTeamStats();
      
      // Trier les équipes de chaque poule
      const sortedPouleA = Object.entries(stats.pouleA).sort(sortTeams);
      const sortedPouleB = Object.entries(stats.pouleB).sort(sortTeams);
      
      console.log("Poule A classement:", sortedPouleA);
      console.log("Poule B classement:", sortedPouleB);
  
      if (sortedPouleA.length < 2 || sortedPouleB.length < 2) {
          console.error("Pas assez d'équipes pour configurer les demi-finales");
          return;
      }
  
      // 1er Poule A vs 2e Poule B (match 21)
      tournamentState.matches[21].team1 = sortedPouleA[0][0]; // 1er Poule A
      tournamentState.matches[21].team2 = sortedPouleB[1][0]; // 2e Poule B
      tournamentState.matches[21].status = 'à_venir';
      
      // 1er Poule B vs 2e Poule A (match 22)
      tournamentState.matches[22].team1 = sortedPouleB[0][0]; // 1er Poule B
      tournamentState.matches[22].team2 = sortedPouleA[1][0]; // 2e Poule A
      tournamentState.matches[22].status = 'à_venir';
      
      console.log("Demi-finales configurées:", tournamentState.matches[21], tournamentState.matches[22]);
      
      saveTournamentState();
  }
  
  // Configuration des matchs de classement (5-8)
  function setupClassificationMatches() {
      const stats = calculateTeamStats();
      
      // Trier les équipes de chaque poule
      const sortedPouleA = Object.entries(stats.pouleA).sort(sortTeams);
      const sortedPouleB = Object.entries(stats.pouleB).sort(sortTeams);
      
      if (sortedPouleA.length < 4 || sortedPouleB.length < 4) {
          console.warn("Pas assez d'équipes pour configurer tous les matchs de classement");
          // Essayer de configurer avec les équipes disponibles
      }
      
      // 3e Poule A vs 4e Poule B (match 17)
      if (sortedPouleA.length >= 3 && sortedPouleB.length >= 4) {
          tournamentState.matches[17].team1 = sortedPouleA[2][0]; // 3e Poule A
          tournamentState.matches[17].team2 = sortedPouleB[3][0]; // 4e Poule B
          tournamentState.matches[17].status = 'à_venir';
      }
      
      // 3e Poule B vs 4e Poule A (match 18)
      if (sortedPouleA.length >= 4 && sortedPouleB.length >= 3) {
          tournamentState.matches[18].team1 = sortedPouleB[2][0]; // 3e Poule B
          tournamentState.matches[18].team2 = sortedPouleA[3][0]; // 4e Poule A
          tournamentState.matches[18].status = 'à_venir';
      }
      
      console.log("Matchs de classement configurés:", tournamentState.matches[17], tournamentState.matches[18]);
      
      saveTournamentState();
  }
  
  // Configuration des finales (principale et de classement)
  function setupFinals() {
      // Finale principale (match 24)
      const sf1 = tournamentState.matches[21];
      const sf2 = tournamentState.matches[22];
      
      if (sf1.winner && sf2.winner) {
          tournamentState.matches[24].team1 = sf1.winner;
          tournamentState.matches[24].team2 = sf2.winner;
          tournamentState.matches[24].status = 'à_venir';
      }
      
      // Petite finale / Match pour la 3ème place (match 23)
      if (sf1.loser && sf2.loser) {
          tournamentState.matches[23].team1 = sf1.loser;
          tournamentState.matches[23].team2 = sf2.loser;
          tournamentState.matches[23].status = 'à_venir';
      }
      
      // Finale 5-6ème place (match 19)
      const csf1 = tournamentState.matches[17];
      const csf2 = tournamentState.matches[18];
      
      if (csf1.winner && csf2.winner) {
          tournamentState.matches[19].team1 = csf1.winner;
          tournamentState.matches[19].team2 = csf2.winner;
          tournamentState.matches[19].status = 'à_venir';
      }
      
      // Finale 7-8ème place (match 20)
      if (csf1.loser && csf2.loser) {
          tournamentState.matches[20].team1 = csf1.loser;
          tournamentState.matches[20].team2 = csf2.loser;
          tournamentState.matches[20].status = 'à_venir';
      }
      
      console.log("Finales configurées");
      
      saveTournamentState();
  }
  
  // Ajout d'une fonction pour vérifier périodiquement la cohérence des données
  function setupPeriodicStateCheck() {
      // Vérifier toutes les 20 secondes
      setInterval(() => {
          if (socket && socketConnected) {
              // Demander l'état actuel de tous les matchs
              socket.emit('request_tournament_state', { sport: 'flechettes' });
              console.log("Demande de vérification de l'état du tournoi envoyée");
          }
      }, 20000);
  }
  
  // Ajoutons une fonction de récupération d'urgence et corrigeons les problèmes
  
  // Fonction pour vérifier et restaurer les données du tournoi en cas de problème
  function recoverTournamentState() {
      try {
          console.log("Tentative de récupération de l'état du tournoi...");
          
          // Vérifier si l'état actuel est valide
          let isStateValid = false;
          try {
              if (tournamentState && tournamentState.matches && Object.keys(tournamentState.matches).length > 0) {
                  isStateValid = true;
              }
          } catch (e) {
              console.error("État du tournoi invalide:", e);
          }
          
          // Si l'état n'est pas valide, essayer de le charger depuis localStorage
          if (!isStateValid) {
              console.log("État du tournoi invalide, tentative de restauration depuis localStorage");
              const savedState = localStorage.getItem('flechettesTournamentState');
              
              if (savedState) {
                  try {
                      tournamentState = JSON.parse(savedState);
                      console.log("État du tournoi restauré depuis localStorage");
                      isStateValid = true;
                  } catch (e) {
                      console.error("Échec de la restauration depuis localStorage:", e);
                  }
              }
          }
          
          // Si toujours pas valide, réinitialiser à l'état par défaut
          if (!isStateValid) {
              console.log("Réinitialisation à l'état par défaut");
              tournamentState = {
                  matches: {
                      // Poule A (matchIds 1 à 6)
                      1: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 3', terrainId: 4 },
                      2: { matchType: 'poule_a', team1: 'FGES', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '9:30', terrain: 'Cible 4', terrainId: 5 },
                      3: { matchType: 'poule_a', team1: 'FLSH', team2: 'FGES', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 1', terrainId: 2 },
                      4: { matchType: 'poule_a', team1: 'ESPAS-ESTICE', team2: 'FMMS', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '10:15', terrain: 'Cible 2', terrainId: 3 },
                      5: { matchType: 'poule_a', team1: 'FMMS', team2: 'FLSH', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 1', terrainId: 2 },
                      6: { matchType: 'poule_a', team1: 'FGES', team2: 'ESPAS-ESTICE', score1: null, score2: null, status: 'à_venir', winner: null, loser: null, time: '11:00', terrain: 'Cible 2', terrainId: 3 },
                      // Autres matchs...
                  }
              };
              
              // Enregistrer cet état par défaut
              localStorage.setItem('flechettesTournamentState', JSON.stringify(tournamentState));
              console.log("État par défaut enregistré dans localStorage");
          }
          
          return true;
      } catch (e) {
          console.error("Erreur critique lors de la récupération du tournoi:", e);
          return false;
      }
  }
  
  // Fonction améliorée pour tenter de gérer les erreurs WebSocket
  function initWebSocket() {
      try {
          // Vérifier si Socket.IO est disponible
          if (typeof io === 'undefined') {
              console.log('Socket.IO n\'est pas chargé, utilisation du mode local');
              updateConnectionStatus(false);
              return;
          }
          
          // Essayer de créer une connexion avec des options robustes
          socket = io({
              reconnection: true,
              reconnectionAttempts: Infinity,
              reconnectionDelay: 1000,
              timeout: 5000,
              transports: ['websocket', 'polling']
          });
          
          // Événements de base
          socket.on('connect', () => {
              console.log('Connecté au serveur WebSocket:', socket.id);
              socketConnected = true;
              updateConnectionStatus(true);
          });
          
          socket.on('disconnect', () => {
              console.log('Déconnecté du serveur WebSocket');
              socketConnected = false;
              updateConnectionStatus(false);
          });
          
          socket.on('connect_error', (error) => {
              console.error('Erreur de connexion WebSocket:', error);
              socketConnected = false;
              updateConnectionStatus(false);
          });
          
          // Autres événements...
      } catch (error) {
          console.error('Erreur fatale lors de l\'initialisation WebSocket:', error);
          updateConnectionStatus(false);
      }
  }
  
  // Fonction pour initialiser les boutons de sélection des poules
  function initializePouleButtons() {
    const pouleButtons = document.querySelectorAll('.poule-button');
    pouleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const poule = this.dataset.poule;

            // Mise à jour visuelle des boutons
            pouleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Mise à jour du classement et des matchs
            updateGroupStandings(poule);
        });
    });
}