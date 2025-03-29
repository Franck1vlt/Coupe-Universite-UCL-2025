/**
 * Module de synchronisation handball
 * Gère la synchronisation des données pour les tournois de handball
 */
const handballSyncModule = {
  initialized: false,
  
  /**
   * Initialise le module de synchronisation handball
   * @returns {boolean} - True si l'initialisation est réussie
   */
  init: function() {
    console.log("Initialisation du module de synchronisation handball...");
    
    // Vérifier si les dépendances sont disponibles
    if (!window.localStorage) {
      console.error("LocalStorage non disponible - Le module ne peut pas être initialisé");
      return false;
    }
    
    this.initialized = true;
    console.log("Module de synchronisation handball initialisé avec succès");
    
    // Charger les données existantes ou initialiser avec les valeurs par défaut
    const data = this.loadData();
    if (!data || !data.poules || data.poules.length === 0) {
      // Aucune donnée trouvée, initialiser avec les valeurs par défaut
      this.defaultPoule = initializeHandballPoule('default');
      
      // Afficher le classement par défaut si un conteneur est disponible
      const container = document.getElementById('handball-standings');
      if (container) {
        displayDefaultHandballStandings('handball-standings');
      }
    }
    
    return true;
  },
  
  /**
   * Charge les données sauvegardées
   */
  loadData: function() {
    if (!this.initialized) {
      console.warn("Le module n'est pas initialisé, impossible de charger les données");
      return null;
    }
    
    try {
      const savedData = localStorage.getItem('handball_tournament_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log("Données de tournoi handball chargées:", data);
        return data;
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données:", e);
    }
    
    return { poules: [], matches: [] };
  },
  
  /**
   * Sauvegarde les données du tournoi
   * @param {Object} data - Les données à sauvegarder
   */
  saveData: function(data) {
    if (!this.initialized) {
      console.warn("Le module n'est pas initialisé, impossible de sauvegarder les données");
      return false;
    }
    
    try {
      localStorage.setItem('handball_tournament_data', JSON.stringify(data));
      console.log("Données de tournoi handball sauvegardées avec succès");
      return true;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des données:", e);
      return false;
    }
  },
  
  /**
   * Synchronise les résultats d'un match
   * @param {Object} match - Les données du match à synchroniser
   */
  syncMatch: function(match) {
    if (!this.initialized) {
      console.warn("Le module n'est pas initialisé, impossible de synchroniser le match");
      return false;
    }
    
    console.log("Synchronisation du match:", match);
    
    // Charger les données actuelles
    const data = this.loadData();
    
    // Vérifier si le match existe déjà
    const existingMatchIndex = data.matches.findIndex(m => m.id == match.id);
    
    if (existingMatchIndex >= 0) {
      // Mettre à jour le match existant
      data.matches[existingMatchIndex] = match;
    } else {
      // Ajouter le nouveau match
      data.matches.push(match);
    }
    
    // Sauvegarder les données mises à jour
    this.saveData(data);
    
    return true;
  },
  
  findMatch: function(matchId) {
    if (!this.initialized) {
      return null;
    }
    
    const data = this.loadData();
    if (!data || !data.matches) {
      return null;
    }
    
    return data.matches.find(m => m.id == matchId);
  },
  
  findPoule: function(pouleId) {
    if (!this.initialized) {
      return null;
    }
    
    const data = this.loadData();
    if (!data || !data.poules) {
      return null;
    }
    
    return data.poules.find(p => p.id == pouleId);
  },
  
  /**
   * Vérifie si le module est correctement initialisé
   * @returns {boolean} - État d'initialisation du module
   */
  isInitialized: function() {
    return this.initialized;
  }
};

/**
 * Initialise une poule de handball avec 6 équipes à 0 points par défaut
 * @param {string|number} pouleId - L'identifiant de la poule
 * @returns {Object} - La poule initialisée
 */
function initializeHandballPoule(pouleId) {
  const defaultTeams = [
    { id: 1, name: "Équipe 1", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    { id: 2, name: "Équipe 2", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    { id: 3, name: "Équipe 3", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    { id: 4, name: "Équipe 4", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    { id: 5, name: "Équipe 5", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    { id: 6, name: "Équipe 6", points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, wins: 0, draws: 0, losses: 0, played: 0 }
  ];
  
  return {
    id: pouleId,
    teams: defaultTeams,
    matches: [],
    initialized: true
  };
}

/**
 * Affiche le classement par défaut pour le handball
 * @param {string} containerId - L'ID du conteneur HTML où afficher le classement
 */
function displayDefaultHandballStandings(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Conteneur ${containerId} non trouvé`);
    return;
  }
  
  const poule = initializeHandballPoule('default');
  
  // Créer le tableau de classement
  let standingsHTML = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>Position</th>
          <th>Équipe</th>
          <th>J</th>
          <th>V</th>
          <th>N</th>
          <th>D</th>
          <th>BP</th>
          <th>BC</th>
          <th>Diff</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  poule.teams.forEach((team, index) => {
    standingsHTML += `
      <tr class="ranking-row">
        <td>${index + 1}</td>
        <td>${team.name}</td>
        <td>${team.played}</td>
        <td>${team.wins}</td>
        <td>${team.draws}</td>
        <td>${team.losses}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td>${team.goalDifference}</td>
        <td>${team.points}</td>
      </tr>
    `;
  });
  
  standingsHTML += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = standingsHTML;
}

/**
 * Met à jour le classement des équipes dans une poule
 * @param {Array} poule - La poule dont il faut mettre à jour le classement
 */
function updatePouleStandings(poule) {
  if (!poule || !poule.teams) {
    console.error("Objet poule invalide pour la mise à jour du classement");
    return;
  }

  // Réinitialiser les statistiques pour chaque équipe
  poule.teams.forEach(team => {
    team.points = 0;
    team.goalsFor = 0;
    team.goalsAgainst = 0;
    team.goalDifference = 0;
    team.wins = 0;
    team.draws = 0;
    team.losses = 0;
    team.played = 0;
  });

  // Calculer les points et statistiques en fonction des matchs joués
  if (poule.matches && Array.isArray(poule.matches)) {
    poule.matches.forEach(match => {
      if (match.played) {
        // Trouver les équipes concernées
        const homeTeam = poule.teams.find(team => team.id === match.homeTeam);
        const awayTeam = poule.teams.find(team => team.id === match.awayTeam);
        
        if (homeTeam && awayTeam) {
          // Mettre à jour le nombre de matchs joués
          homeTeam.played++;
          awayTeam.played++;
          
          // Mettre à jour les buts marqués et encaissés
          homeTeam.goalsFor += match.homeScore;
          homeTeam.goalsAgainst += match.awayScore;
          awayTeam.goalsFor += match.awayScore;
          awayTeam.goalsAgainst += match.homeScore;
          
          // Calculer les différences de buts
          homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
          awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
          
          // Attribuer les points selon le résultat
          if (match.homeScore > match.awayScore) {
            // Victoire de l'équipe à domicile
            homeTeam.wins++;
            homeTeam.points += 3; // 3 points pour une victoire au handball
            awayTeam.losses++;
          } else if (match.homeScore < match.awayScore) {
            // Victoire de l'équipe à l'extérieur
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
          } else {
            // Match nul
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
          }
        }
      }
    });
  }
  
  // Trier les équipes selon les points, puis la différence de buts, puis les buts marqués
  poule.teams.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });
  
  // Mettre à jour l'interface utilisateur si nécessaire
  updatePouleDisplay(poule);
  
  // Sauvegarder la poule mise à jour
  if (isHandballSyncModuleAvailable()) {
    const data = handballSyncModule.loadData();
    
    // Vérifier si la poule existe déjà
    const existingPouleIndex = data.poules.findIndex(p => p.id == poule.id);
    
    if (existingPouleIndex >= 0) {
      // Mettre à jour la poule existante
      data.poules[existingPouleIndex] = poule;
    } else {
      // Ajouter la nouvelle poule
      data.poules.push(poule);
    }
    
    handballSyncModule.saveData(data);
  }
}

/**
 * Met à jour l'affichage d'une poule dans l'interface
 * @param {Object} poule - La poule à afficher
 */
function updatePouleDisplay(poule) {
  const pouleElement = document.getElementById(`poule-${poule.id}`);
  if (!pouleElement) {
    console.warn(`Élément poule-${poule.id} non trouvé dans le DOM`);
    return;
  }
  
  // Récupérer ou créer le tableau du classement
  let tableElement = pouleElement.querySelector('table.standings-table');
  if (!tableElement) {
    // Créer un nouveau tableau si aucun n'existe
    tableElement = document.createElement('table');
    tableElement.className = 'standings-table';
    pouleElement.appendChild(tableElement);
  }
  
  // Générer le contenu du tableau
  let tableHTML = `
    <thead>
      <tr>
        <th>Position</th>
        <th>Équipe</th>
        <th>J</th>
        <th>V</th>
        <th>N</th>
        <th>D</th>
        <th>BP</th>
        <th>BC</th>
        <th>Diff</th>
        <th>Pts</th>
      </tr>
    </thead>
    <tbody>
  `;
  
  poule.teams.forEach((team, index) => {
    tableHTML += `
      <tr class="ranking-row">
        <td>${index + 1}</td>
        <td>${team.name}</td>
        <td>${team.played}</td>
        <td>${team.wins}</td>
        <td>${team.draws}</td>
        <td>${team.losses}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td>${team.goalDifference}</td>
        <td>${team.points}</td>
      </tr>
    `;
  });
  
  tableHTML += '</tbody>';
  
  tableElement.innerHTML = tableHTML;
}

/**
 * Vérifie si le module de synchronisation handball est disponible
 * @returns {boolean} - True si le module est disponible et initialisé
 */
function isHandballSyncModuleAvailable() {
  if (typeof handballSyncModule !== 'undefined' && handballSyncModule.isInitialized()) {
    return true;
  }
  console.error("Module de synchronisation handball non détecté");
  return false;
}

/**
 * Met à jour l'affichage d'un match de handball terminé
 * @param {Object} match - Les données du match
 * @param {HTMLElement} matchElement - L'élément HTML du match à mettre à jour
 */
function updateHandballMatchDisplay(match, matchElement) {
  if (!matchElement) {
    console.error("Élément de match non trouvé");
    return;
  }

  // Récupérer les éléments pour les équipes A et B
  const teamAElement = matchElement.querySelector('.team-a');
  const teamBElement = matchElement.querySelector('.team-b');
  const scoreAElement = matchElement.querySelector('.score-a');
  const scoreBElement = matchElement.querySelector('.score-b');
  const logoAElement = matchElement.querySelector('.logo-a');
  const logoBElement = matchElement.querySelector('.logo-b');

  if (!teamAElement || !teamBElement || !scoreAElement || !scoreBElement || !logoAElement || !logoBElement) {
    console.error("Structure HTML du match incomplète");
    return;
  }

  // Mettre à jour les noms des équipes si nécessaire
  if (teamAElement.textContent !== match.homeTeamName) {
    teamAElement.textContent = match.homeTeamName;
  }
  
  if (teamBElement.textContent !== match.awayTeamName) {
    teamBElement.textContent = match.awayTeamName;
  }

  // Mettre à jour les scores
  scoreAElement.textContent = match.homeScore.toString();
  scoreBElement.textContent = match.awayScore.toString();

  // S'assurer que les scores sont visibles
  scoreAElement.style.display = 'inline-block';
  scoreBElement.style.display = 'inline-block';

  // Mettre à jour les logos des équipes
  if (match.homeTeamLogo) {
    logoAElement.src = match.homeTeamLogo;
    logoAElement.style.display = 'block';
  }
  
  if (match.awayTeamLogo) {
    logoBElement.src = match.awayTeamLogo;
    logoBElement.style.display = 'block';
  }

  // Marquer visuellement le vainqueur si nécessaire
  if (match.homeScore > match.awayScore) {
    teamAElement.classList.add('winner');
    teamBElement.classList.remove('winner');
  } else if (match.homeScore < match.awayScore) {
    teamAElement.classList.remove('winner');
    teamBElement.classList.add('winner');
  } else {
    teamAElement.classList.remove('winner');
    teamBElement.classList.remove('winner');
  }

  // Marquer le match comme terminé
  matchElement.classList.add('match-completed');
}

/**
 * Marque un match de handball comme terminé et met à jour l'affichage
 * @param {string|number} matchId - L'ID du match
 * @param {number} scoreA - Score de l'équipe A
 * @param {number} scoreB - Score de l'équipe B
 */
function completeHandballMatch(matchId, scoreA, scoreB) {
  // Trouver le match dans les données
  const matchElement = document.getElementById(`match-${matchId}`);
  if (!matchElement) {
    console.error(`Match élément #match-${matchId} non trouvé`);
    return;
  }

  // Récupérer ou créer les données du match
  let match = handballSyncModule.findMatch(matchId);
  if (!match) {
    // Si le match n'existe pas dans les données, créer un objet temporaire
    match = {
      id: matchId,
      homeTeamName: matchElement.querySelector('.team-a').textContent,
      awayTeamName: matchElement.querySelector('.team-b').textContent,
      homeTeamLogo: matchElement.querySelector('.logo-a').src,
      awayTeamLogo: matchElement.querySelector('.logo-b').src
    };
  }

  // Mettre à jour les scores
  match.homeScore = scoreA;
  match.awayScore = scoreB;
  match.played = true;

  // Mettre à jour l'affichage
  updateHandballMatchDisplay(match, matchElement);

  // Synchroniser avec le module
  if (isHandballSyncModuleAvailable()) {
    handballSyncModule.syncMatch(match);
  }

  // Si le match appartient à une poule, mettre à jour le classement
  const pouleId = matchElement.getAttribute('data-poule-id');
  if (pouleId) {
    const poule = handballSyncModule.findPoule(pouleId);
    if (poule) {
      updatePouleStandings(poule);
    }
  }
}
