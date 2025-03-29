// Configuration des terrains par sport
const sportsConfig = {
    football: {
        terrainIds: [1],
        scoreType: 3,
        storagePrefix: 'football_'
    },
    flechettes: {
        terrainIds: [2, 3, 4, 5],
        scoreType: 1,
        storagePrefix: 'flechettes_'
    },
    petanque: {
        terrainIds: [6, 7],
        scoreType: 2,
        storagePrefix: 'petanque_'
    },
    badminton: {
        terrainIds: [8],
        scoreType: 2, 
        storagePrefix: 'badminton_'
    },
    volley: {
        terrainIds: [9],
        scoreType: 3,
        storagePrefix: 'volley_',
        matchesPerTerrain: 2  // Nombre de matchs sur le terrain de volley
    },
    basket: {
        terrainIds: [9],      // Le basket utilise aussi le terrain 9
        scoreType: 3,
        storagePrefix: 'basket_',
        matchesPerTerrain: 2  // Identique au volley
    }
};

// Fonction pour initialiser les gestionnaires de chaque sport
function initializeSportsHandlers() {
    // Surveiller les changements dans le localStorage pour tous les sports
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les événements personnalisés pour les mises à jour en temps réel du basket
    document.addEventListener('basketball-update', handleBasketballUpdate);
    document.addEventListener('basketball-timer-update', handleBasketballTimerUpdate);
    
    // Attendre que la génération d'affichage soit terminée avant de charger les états
    setTimeout(() => {
        console.log("Initialisation différée des états - conteneurs maintenant disponibles");
        loadInitialStates();
        
        // Configurer un rafraîchissement périodique
        setInterval(loadInitialStates, 20000); // Rafraîchir toutes les 20 secondes
    }, 500);
    
    // Vérifier si des données de foot existent, sinon créer des données de test
    let footballDataExists = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (identifySport(key) === 'football') {
            footballDataExists = true;
            break;
        }
    }

    if (!footballDataExists) {
        console.log("Aucune donnée de football trouvée, création de données test");
        createTestFootballData();
    }
}

// Fonction pour charger les états initiaux des matchs, avec option pour contrôler l'actualisation de l'horodatage
function loadInitialStates(updateTimestamp = true) {
    let hasChanges = false;
    
    // Parcourir chaque sport
    Object.keys(sportsConfig).forEach(sport => {
        const changes = loadSportInitialState(sport);
        if (changes) hasChanges = true;
    });
    
    // Vérification spéciale pour les données de basket (liveMatchData)
    const basketData = localStorage.getItem('liveMatchData');
    if (basketData) {
        try {
            const data = JSON.parse(basketData);
            console.log('Données de basket trouvées dans liveMatchData:', data);
            
            // Mettre à jour l'affichage du terrain de basket (terrain 9)
            if (data.score1 && data.score2) {
                // Position 2 du terrain 9 réservée pour le basket
                updateBasketDisplay(9, 2, data);
                hasChanges = true;
            }
        } catch (e) {
            console.error('Erreur lors du traitement des données de basket:', e);
        }
    }
    
    // Mettre à jour l'horodatage uniquement s'il y a des changements et si demandé
    if (hasChanges && updateTimestamp) {
        const now = Date.now();
        // Mettre à jour au maximum une fois toutes les 10 secondes
        if (now - window._lastUpdateTimestamp > 10000) {
            window._lastUpdateTimestamp = now;
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = 'Dernière mise à jour: ' + new Date().toLocaleTimeString();
            }
        }
    }
    
    return hasChanges;
}

// Fonction pour charger l'état initial d'un sport spécifique
function loadSportInitialState(sport) {
    const config = sportsConfig[sport];
    console.log(`Tentative de chargement des données pour ${sport}`);
    
    // Débogage: Vérifier toutes les clés dans localStorage
    if (sport === 'football') {
        console.log('Debug - Toutes les clés dans localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`Clé ${i}: ${key}`);
            try {
                const value = localStorage.getItem(key);
                console.log(`Contenu [${key.substring(0, 30)}...]: ${value.substring(0, 50)}...`);
            } catch (e) {
                console.log(`Erreur lors de la lecture de ${key}`);
            }
        }
    }
    
    // Récupérer les données du tournoi avec différentes clés possibles
    const possibleKeys = [
        `${config.storagePrefix}TournamentState`,
        `${sport}TournamentState`,
        `${sport}_liveMatchData`,
        `liveMatchData_${sport}`,
        `${sport}_match`,
        `${sport}_current_match`,
        `${sport}-match`,
        `match_${sport}`
    ];
    
    let tournamentState = null;
    let hasChanges = false;
    
    // Essayer chaque clé possible
    for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
            console.log(`Données trouvées pour ${sport} avec la clé: ${key}`);
            try {
                tournamentState = JSON.parse(data);
                break;
            } catch (e) {
                console.warn(`Erreur de parsing pour ${key}:`, e);
            }
        }
    }
    
    if (!tournamentState) {
        console.log(`Aucune donnée trouvée pour ${sport} - pas d'erreur, normal pour certains sports`);
        return hasChanges;
    }
    
    // EMPÊCHER LA MISE À JOUR DES TERRAINS DE FLÉCHETTES PAR D'AUTRES SPORTS
    if (sport !== 'flechettes') {
        // Filtrer les terrains à mettre à jour pour exclure ceux réservés aux fléchettes
        config.terrainIds = config.terrainIds.filter(id => {
            const terrainContainer = document.getElementById(`terrain-${id}`);
            return !(terrainContainer && 
                   (terrainContainer.getAttribute('data-sport') === 'flechettes' || 
                    terrainContainer.getAttribute('data-reserved') === 'true'));
        });
    }
    
    // Traiter les données selon leur structure
    if (tournamentState.matches) {
        // Structure de tournoi standard
        Object.entries(tournamentState.matches).forEach(([matchId, match]) => {
            if ((match.status === 'en_cours' || match.status === 'à_venir') && match.terrainId) {
                // Vérifier que le terrain appartient bien à ce sport
                if (!config.terrainIds.includes(match.terrainId)) {
                    console.warn(`Le match ${matchId} (${sport}) est assigné au terrain ${match.terrainId} qui n'est pas configuré pour ce sport`);
                    return;
                }
                
                // Chercher des données en direct
                const liveData = getLiveMatchData(sport, matchId);
                if (liveData) {
                    updateSportDisplay(sport, match.terrainId, liveData);
                    hasChanges = true;
                } else {
                    updateSportDisplay(sport, match.terrainId, {
                        team1: match.team1,
                        team2: match.team2,
                        score1: match.score1 || '0',
                        score2: match.score2 || '0',
                        matchType: match.matchType,
                        matchId: matchId,
                        chrono: match.chrono || '00:00',
                        sport: sport // Ajouter explicitement le sport
                    });
                    hasChanges = true;
                }
            }
        });
    } else if (sport === 'football' && tournamentState.team1) {
        // Format spécifique pour le football
        config.terrainIds.forEach(terrainId => {
            updateSportDisplay(sport, terrainId, {
                team1: tournamentState.team1,
                team2: tournamentState.team2,
                score1: tournamentState.score1 || tournamentState.scoreA || '0',
                score2: tournamentState.score2 || tournamentState.scoreB || '0',
                chrono: tournamentState.chrono || tournamentState.timer || '00:00',
                matchType: tournamentState.matchType || 'Match',
                status: tournamentState.status || 'en_cours'
            });
            hasChanges = true;
        });
    } else if (Array.isArray(tournamentState)) {
        // Format de tableau pour certains sports
        tournamentState.forEach(match => {
            if (match.terrainId && (match.status === 'en_cours' || match.status === 'à_venir')) {
                updateSportDisplay(sport, match.terrainId, match);
                hasChanges = true;
            }
        });
    } else {
        // Format générique - supposer qu'il s'agit des données d'un match
        // Utiliser le premier terrain configuré pour ce sport
        const terrainId = config.terrainIds[0];
        updateSportDisplay(sport, terrainId, tournamentState);
        hasChanges = true;
    }
    
    // Traitement spécifique pour le volley - distribution de matchs multiples
    if (sport === 'volley') {
        // Chercher tous les matchs de volley
        const volleyMatches = [];
        
        for (const key of Object.keys(localStorage)) {
            if (key.includes('volley') || key.includes('volleyball')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    // Vérifier si ces données contiennent un numéro de match
                    if (data.matchNumber || data.match_number || data.num) {
                        const matchNumber = data.matchNumber || data.match_number || data.num;
                        volleyMatches.push({
                            matchNumber: parseInt(matchNumber),
                            data: data
                        });
                        console.log(`Match de volley trouvé: ${matchNumber}`);
                    } else if (data.matches && Array.isArray(data.matches)) {
                        // Format avec tableau de matchs
                        data.matches.forEach((match, index) => {
                            volleyMatches.push({
                                matchNumber: index + 1,
                                data: match
                            });
                        });
                    }
                } catch (e) {
                    console.warn(`Erreur lors de l'analyse de ${key}:`, e);
                }
            }
        }
        
        // Trier les matchs par numéro
        volleyMatches.sort((a, b) => a.matchNumber - b.matchNumber);
        
        // Distribuer les matchs sur les positions du terrain
        volleyMatches.forEach((match, index) => {
            if (index < config.matchesPerTerrain) {
                // Position: 1 = premier scorebar, 2 = deuxième scorebar
                const position = index + 1;
                updateVolleyDisplay(9, position, match.data);
                console.log(`Match de volley ${match.matchNumber} affiché en position ${position}`);
                hasChanges = true;
            }
        });
        
        return hasChanges; // Sortir après traitement spécial
    }
    
    return hasChanges;
}

// Fonction pour récupérer les données en direct d'un match
function getLiveMatchData(sport, matchId) {
    const config = sportsConfig[sport];
    
    // Chercher dans toutes les clés possibles pour ce sport
    const keys = Object.keys(localStorage).filter(key => 
        (key.includes(config.storagePrefix) || key.includes(sport)) && 
        (key.includes(`match${matchId}`) || key.includes('liveMatchData'))
    );
    
    for (const key of keys) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.matchId == matchId || 
                (data.match && data.match == matchId)) {
                return data;
            }
        } catch (e) {
            console.warn(`Erreur de parsing pour la clé ${key}:`, e);
        }
    }
    return null;
}

// Fonction pour gérer les changements dans le localStorage
function handleStorageChange(e) {
    try {
        // Vérifier si la valeur existe et n'est pas vide
        if (!e.newValue) return;
        
        // Log de la valeur brute pour le débogage
        console.log(`Valeur brute reçue pour ${e.key}:`, e.newValue);
        
        // Corriger les problèmes d'échappement
        let cleanValue = e.newValue;
        
        // Vérifier si la valeur n'est pas un JSON valide
        try {
            // Vérifier que la valeur peut être parsée
            JSON.parse(cleanValue);
        } catch (parseError) {
            console.log(`Tentative de correction du JSON pour ${e.key}`);
            
            // Essayer de nettoyer le JSON si possible
            try {
                // Si la chaîne contient des caractères spéciaux non échappés
                cleanValue = cleanValue.replace(/[\n\r\t]/g, '');
                
                // Si le problème est lié aux guillemets
                cleanValue = cleanValue.replace(/(['"])\1+/g, '"');
                
                // Essayer de détecter un JSON dans la chaîne
                const jsonStartIndex = cleanValue.indexOf('{');
                const jsonEndIndex = cleanValue.lastIndexOf('}');
                
                if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                    cleanValue = cleanValue.substring(jsonStartIndex, jsonEndIndex + 1);
                    // Essayer de parser pour vérifier
                    JSON.parse(cleanValue);
                } else {
                    // Impossible de trouver un JSON valide
                    console.log(`Impossible de trouver un JSON valide dans ${e.key}`);
                    return;
                }
            } catch (error) {
                console.error(`Échec de la correction du JSON pour ${e.key}:`, error);
                console.log('Contenu problématique:', e.newValue.substring(0, 100));
                return;
            }
        }
        
        // Déterminer le sport concerné par cette mise à jour
        const sportName = identifySport(e.key);
        if (!sportName) return;
        
        console.log(`Mise à jour détectée pour ${sportName}: ${e.key}`);
        
        // Parser les données avec la version corrigée
        let data = JSON.parse(cleanValue);
        
        // Traitement spécial pour le volley
        if (sportName === 'volley') {
            try {
                const data = JSON.parse(cleanValue);
                // Déterminer le numéro du match
                let matchNumber = 1; // Par défaut
                
                if (data.matchNumber !== undefined) {
                    matchNumber = parseInt(data.matchNumber);
                } else if (data.match_number !== undefined) {
                    matchNumber = parseInt(data.match_number);
                } else if (data.num !== undefined) {
                    matchNumber = parseInt(data.num);
                } else if (e.key.match(/[_-](\d+)$/)) {
                    // Essayer d'extraire le numéro du match de la clé
                    matchNumber = parseInt(e.key.match(/[_-](\d+)$/)[1]);
                }
                
                // Limiter le numéro de match à la plage valide (1-2)
                matchNumber = Math.min(Math.max(matchNumber, 1), 2);
                
                updateVolleyDisplay(9, matchNumber, data);
                return; // Sortir après traitement spécial
            } catch (error) {
                console.error('Erreur lors du traitement du match de volley:', error);
            }
        }
        
        // Identifier le terrain concerné
        const terrainId = identifyTerrain(sportName, e.key, data);
        if (terrainId) {
            // Vérifier que ce terrain est bien configuré pour ce sport
            if (sportsConfig[sportName] && sportsConfig[sportName].terrainIds.includes(terrainId)) {
                updateSportDisplay(sportName, terrainId, data);
            } else {
                console.warn(`Le terrain ${terrainId} n'est pas configuré pour le sport ${sportName} - mise à jour ignorée`);
            }
        }
    } catch (error) {
        console.error('Erreur lors du traitement de la mise à jour:', error);
    }
}

// Nouvelle fonction pour gérer les mises à jour en temps réel du basket
function handleBasketballUpdate(event) {
    const data = event.detail;
    console.log('Mise à jour du basket reçue en temps réel:', data);
    
    if (data && data.terrainId) {
        // Mise à jour directe du terrain spécifié
        updateBasketDisplay(data.terrainId, data.position || 2, data);
    }
}

// Fonction spécialisée pour gérer uniquement les mises à jour du chronomètre
function handleBasketballTimerUpdate(event) {
    const data = event.detail;
    
    // Récupérer le container pour la position 2 du terrain 9 (basket)
    const container = document.getElementById('terrain-9-partie-2');
    if (!container) return;
    
    // Mettre à jour uniquement le chronomètre
    const chrono = container.querySelector('.chrono');
    if (chrono && data.gameTimer) {
        // Format standard avec millisecondes pour un affichage optimal du chrono
        const previousTime = chrono.textContent;
        
        // Ne pas déclencher d'animation si seulement les millisecondes changent
        const mainPartPrevious = previousTime.split('.')[0];
        const mainPartNew = data.gameTimer.split('.')[0];
        
        chrono.textContent = data.gameTimer;
        
        // Animation uniquement sur changement de seconde (pas sur millisecondes)
        if (mainPartPrevious !== mainPartNew) {
            chrono.classList.add('time-changed');
            setTimeout(() => chrono.classList.remove('time-changed'), 200);
        }
    }
}

// Fonction pour identifier le sport à partir de la clé localStorage
function identifySport(key) {
    if (!key) return null;
    
    // Ajouter des logs pour faciliter le débogage
    console.log(`Analyse de la clé: ${key}`);
    
    // Vérifier d'abord les préfixes spécifiques
    for (const [sport, config] of Object.entries(sportsConfig)) {
        if (key.includes(config.storagePrefix) || key.startsWith(`${sport}_`)) {
            console.log(`Sport identifié par préfixe: ${sport}`);
            return sport;
        }
    }
    
    // Liste élargie de mots-clés pour le football
    const footTerms = ['football', 'soccer', 'foot', 'match_foot', 'match-foot', 
                      'matchfoot', 'scoring_foot', 'foot_score', 'footballmatch'];
    
    for (const term of footTerms) {
        if (key.toLowerCase().includes(term.toLowerCase())) {
            console.log(`Sport identifié par mot-clé élargi: football (${term})`);
            return 'football';
        }
    }
    
    // Ensuite, chercher des mots-clés spécifiques à chaque sport
    if (key.includes('flechettes') || key.includes('darts') || key.includes('301_')) {
        // Vérifier en plus que les données ont le format fléchettes
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && (data.points1 !== undefined || data.points2 !== undefined)) {
                return 'flechettes';
            }
        } catch (e) {}
    }
    if (key.includes('petanque') || key.includes('cochonnet')) return 'petanque';
    if (key.includes('badminton')) return 'badminton';
    if (key.includes('volley')) return 'volley';
    if (key.includes('basket') || key.includes('basketball') || key.includes('liveMatchData')) return 'basket';
    
    return null;
}

// Fonction pour identifier le terrain à partir des données
function identifyTerrain(sport, key, data) {
    // Si le terrain est directement spécifié dans les données
    if (data.terrainId) {
        // Vérifier que le terrain appartient bien au sport correspondant
        if (sportsConfig[sport] && sportsConfig[sport].terrainIds.includes(data.terrainId)) {
            return data.terrainId;
        } else {
            console.log(`Le terrain ${data.terrainId} n'est pas configuré pour le sport ${sport}`);
            // Si le terrain n'appartient pas à ce sport, utiliser le premier terrain configuré
            return sportsConfig[sport]?.terrainIds[0] || null;
        }
    }
    
    // Essayer d'extraire l'ID du terrain depuis la clé
    const terrainPattern = /terrain-(\d+)/;
    const terrainMatch = key.match(terrainPattern);
    if (terrainMatch && terrainMatch[1]) {
        return parseInt(terrainMatch[1]);
    }
    
    // Si les données contiennent un matchId, chercher le terrain dans l'état du tournoi
    if (data.matchId) {
        const tournamentKey = `${sportsConfig[sport].storagePrefix}TournamentState`;
        const genericKey = sport + 'TournamentState'; // Pour compatibilité
        
        let tournamentState = JSON.parse(localStorage.getItem(tournamentKey) || '{}');
        if (!tournamentState.matches) {
            tournamentState = JSON.parse(localStorage.getItem(genericKey) || '{}');
        }
        
        if (tournamentState.matches && tournamentState.matches[data.matchId]) {
            return tournamentState.matches[data.matchId].terrainId;
        }
    }
    
    // Si aucun terrain spécifique n'est trouvé, utiliser le premier terrain configuré pour ce sport
    if (sportsConfig[sport] && sportsConfig[sport].terrainIds.length > 0) {
        return sportsConfig[sport].terrainIds[0];
    }
    
    return null;
}

// Fonction pour mettre à jour l'affichage d'un terrain
function updateSportDisplay(sport, terrainId, data) {
    // Vérification de sécurité: s'assurer que le terrain est configuré pour ce sport
    if (!sportsConfig[sport] || !sportsConfig[sport].terrainIds.includes(terrainId)) {
        console.warn(`Le terrain ${terrainId} n'est pas configuré pour le sport ${sport} - mise à jour ignorée`);
        return;
    }
    
    // Vérifier d'abord si le conteneur existe
    const container = document.getElementById(`terrain-${terrainId}`);
    if (!container) {
        console.log(`Conteneur pour le terrain ${terrainId} non trouvé`);
        return;
    }
    
    // Vérifier si le terrain a été réservé par un autre gestionnaire
    if (container.getAttribute('data-reserved') === 'true') {
        // Si le conteneur est réservé et que ce n'est pas le sport correspondant, ignorer
        const containerSport = container.getAttribute('data-sport');
        if (containerSport && containerSport !== sport) {
            console.warn(`Terrain ${terrainId} réservé pour ${containerSport}, mise à jour de ${sport} ignorée`);
            return;
        }
    }
    
    // Pour les fléchettes, utiliser le gestionnaire spécifique
    if (sport === 'flechettes' && window.updateFlechettesDisplay) {
        window.updateFlechettesDisplay(terrainId, data);
        return;
    }
    
    console.log(`Mise à jour du terrain ${terrainId} pour ${sport} avec`, data);
    
    // Sélectionner les éléments appropriés selon le type de scorebar
    const scoreType = sportsConfig[sport].scoreType;
    
    // Vérifier s'il y a un changement réel avant d'animer
    let hasChanged = false;
    
    // Stocker les valeurs précédentes pour comparaison
    const previousValues = {
        team1: container.querySelector('.team-name-left')?.textContent,
        team2: container.querySelector('.team-name-right')?.textContent,
        score1: container.querySelector('.team-score-left')?.textContent,
        score2: container.querySelector('.team-score-right')?.textContent,
        chrono: container.querySelector('.chrono')?.textContent
    };
    
    // Mettre à jour les éléments communs
    hasChanged = updateTeamNames(container, data, previousValues) || hasChanged;
    
    // Mettre à jour les éléments spécifiques au type de scoreboard
    if (scoreType === 1) {
        // Fléchettes
        hasChanged = updateFlechettesDisplay(container, data, previousValues) || hasChanged;
    } else if (scoreType === 2) {
        // Pétanque / Badminton
        hasChanged = updatePetanqueDisplay(container, data, previousValues) || hasChanged;
    } else if (scoreType === 3) {
        // Football / Volley
        hasChanged = updateFootballDisplay(container, data, previousValues) || hasChanged;
    }
    
    // Ajouter une animation de mise à jour UNIQUEMENT s'il y a un changement
    if (hasChanged) {
        container.classList.add('updated');
        setTimeout(() => {
            container.classList.remove('updated');
        }, 1500);
    }
}

// Fonction spécifique pour mettre à jour l'affichage des matchs de volley
function updateVolleyDisplay(terrainId, position, data) {
    // Vérifier que le conteneur existe avant de tenter de le mettre à jour
    const container = document.getElementById(`terrain-${terrainId}-partie-${position}`);
    if (!container) {
        console.log(`Conteneur pour le volley (terrain ${terrainId}, position ${position}) non trouvé - attendons la génération`);
        return;
    }
    
    // Mettre à jour l'affichage de ce match spécifique
    const teamLeft = container.querySelector('.team-name-left');
    const teamRight = container.querySelector('.team-name-right');
    const scoreLeft = container.querySelector('.team-score-left');
    const scoreRight = container.querySelector('.team-score-right');
    const chrono = container.querySelector('.chrono');
    
    // Vérifier s'il y a un changement réel avant d'animer
    let hasChanged = false;
    const previousValues = {
        team1: teamLeft?.textContent,
        team2: teamRight?.textContent,
        score1: scoreLeft?.textContent,
        score2: scoreRight?.textContent,
        chrono: chrono?.textContent
    };
    
    if (teamLeft && data.team1 && data.team1 !== previousValues.team1) {
        teamLeft.textContent = data.team1;
        hasChanged = true;
    }
    
    if (teamRight && data.team2 && data.team2 !== previousValues.team2) {
        teamRight.textContent = data.team2;
        hasChanged = true;
    }
    
    if (scoreLeft) {
        const score = data.score1 !== undefined ? data.score1 : 
                     (data.scoreA !== undefined ? data.scoreA : 
                     (data.points1 !== undefined ? data.points1 : '0'));
        if (score !== previousValues.score1) {
            scoreLeft.textContent = score;
            hasChanged = true;
        }
    }
    
    if (scoreRight) {
        const score = data.score2 !== undefined ? data.score2 : 
                     (data.scoreB !== undefined ? data.scoreB : 
                     (data.points2 !== undefined ? data.points2 : '0'));
        if (score !== previousValues.score2) {
            scoreRight.textContent = score;
            hasChanged = true;
        }
    }
    
    if (chrono && (data.chrono || data.timer || data.time)) {
        const time = data.chrono || data.timer || data.time;
        if (time !== previousValues.chrono) {
            chrono.textContent = time;
            hasChanged = true;
        }
    }
    
    // Ajouter une animation de mise à jour UNIQUEMENT s'il y a un changement
    if (hasChanged) {
        container.classList.add('updated');
        setTimeout(() => container.classList.remove('updated'), 1500);
    }
}

// Amélioration de la fonction updateBasketDisplay
function updateBasketDisplay(terrainId, position, data) {
    // Vérifier que le conteneur existe avant de tenter de le mettre à jour
    const container = document.getElementById(`terrain-${terrainId}-partie-${position}`);
    if (!container) {
        console.log(`Conteneur pour le basket (terrain ${terrainId}, position ${position}) non trouvé - attendons la génération`);
        return;
    }
    
    // Mettre à jour l'affichage de ce match spécifique
    const teamLeft = container.querySelector('.team-name-left');
    const teamRight = container.querySelector('.team-name-right');
    const scoreLeft = container.querySelector('.team-score-left');
    const scoreRight = container.querySelector('.team-score-right');
    const chrono = container.querySelector('.chrono');
    
    // Vérifier s'il y a un changement réel avant d'animer
    let hasChanged = false;
    const previousValues = {
        team1: teamLeft?.textContent,
        team2: teamRight?.textContent,
        score1: scoreLeft?.textContent,
        score2: scoreRight?.textContent,
        chrono: chrono?.textContent
    };
    
    // Récupérer les équipes depuis les données ou utiliser des valeurs par défaut
    const team1 = data.team1 || 'BASKET 1';
    const team2 = data.team2 || 'BASKET 2';
    
    if (teamLeft && team1 !== previousValues.team1) {
        teamLeft.textContent = team1;
        hasChanged = true;
    }
    
    if (teamRight && team2 !== previousValues.team2) {
        teamRight.textContent = team2;
        hasChanged = true;
    }
    
    if (scoreLeft && data.score1 !== undefined && data.score1 !== previousValues.score1) {
        scoreLeft.textContent = data.score1;
        hasChanged = true;
    }
    
    if (scoreRight && data.score2 !== undefined && data.score2 !== previousValues.score2) {
        scoreRight.textContent = data.score2;
        hasChanged = true;
    }
    
    if (chrono && data.gameTimer && data.gameTimer !== previousValues.chrono) {
        // Mise à jour du chrono en temps réel
        chrono.textContent = data.gameTimer;
        hasChanged = true;
    }
    
    // Ajouter une animation de mise à jour UNIQUEMENT s'il y a un changement
    if (hasChanged) {
        container.classList.add('updated');
        setTimeout(() => container.classList.remove('updated'), 1500);
        console.log('Affichage du basket mis à jour avec:', data);
    }
}

// Fonction pour mettre à jour les noms d'équipes
function updateTeamNames(container, data, previousValues = {}) {
    const teamLeft = container.querySelector('.team-name-left');
    const teamRight = container.querySelector('.team-name-right');
    let hasChanged = false;
    
    if (teamLeft && data.team1 && data.team1 !== previousValues.team1) {
        teamLeft.textContent = data.team1;
        console.log(`Équipe gauche mise à jour: ${data.team1}`);
        hasChanged = true;
    }
    
    if (teamRight && data.team2 && data.team2 !== previousValues.team2) {
        teamRight.textContent = data.team2;
        console.log(`Équipe droite mise à jour: ${data.team2}`);
        hasChanged = true;
    }
    
    return hasChanged;
}

// Fonction pour mettre à jour l'affichage fléchettes
function updateFlechettesDisplay(container, data, previousValues = {}) {
    const scoreLeft = container.querySelector('.team-score-left');
    const scoreRight = container.querySelector('.team-score-right');
    const points1 = container.querySelector('.points-1');
    const points2 = container.querySelector('.points-2');
    let hasChanged = false;
    
    // Mettre à jour les sets (score principal)
    if (scoreLeft) {
        let newScore = null;
        if (data.sets?.teamA !== undefined) {
            newScore = data.sets.teamA;
        } else if (data.score1 !== undefined) {
            newScore = data.score1;
        }
        
        if (newScore !== null && newScore !== previousValues.score1) {
            scoreLeft.textContent = newScore;
            hasChanged = true;
        }
    }
    
    if (scoreRight) {
        let newScore = null;
        if (data.sets?.teamB !== undefined) {
            newScore = data.sets.teamB;
        } else if (data.score2 !== undefined) {
            newScore = data.score2;
        }
        
        if (newScore !== null && newScore !== previousValues.score2) {
            scoreRight.textContent = newScore;
            hasChanged = true;
        }
    }
    
    // Mettre à jour les points actuels
    if (points1 && data.points1 !== undefined && data.points1 !== previousValues.points1) {
        points1.textContent = data.points1;
        hasChanged = true;
    } else if (points1 && data.currentScore?.teamA !== undefined && data.currentScore.teamA !== previousValues.points1) {
        points1.textContent = data.currentScore.teamA;
        hasChanged = true;
    }
    
    if (points2 && data.points2 !== undefined && data.points2 !== previousValues.points2) {
        points2.textContent = data.points2;
        hasChanged = true;
    } else if (points2 && data.currentScore?.teamB !== undefined && data.currentScore.teamB !== previousValues.points2) {
        points2.textContent = data.currentScore.teamB;
        hasChanged = true;
    }
    
    return hasChanged;
}

// Fonction pour mettre à jour l'affichage pétanque
function updatePetanqueDisplay(container, data, previousValues = {}) {
    const scoreLeft = container.querySelector('.team-score-left');
    const scoreRight = container.querySelector('.team-score-right');
    let hasChanged = false;
    
    if (scoreLeft && data.score1 !== undefined && data.score1 !== previousValues.score1) {
        scoreLeft.textContent = data.score1;
        console.log(`Score pétanque gauche mis à jour: ${data.score1}`);
        hasChanged = true;
    }
    
    if (scoreRight && data.score2 !== undefined && data.score2 !== previousValues.score2) {
        scoreRight.textContent = data.score2;
        console.log(`Score pétanque droit mis à jour: ${data.score2}`);
        hasChanged = true;
    }
    
    return hasChanged;
}

// Fonction pour mettre à jour l'affichage football/volley
function updateFootballDisplay(container, data, previousValues = {}) {
    console.log('Mise à jour de l\'affichage football avec les données:', data);
    
    const scoreLeft = container.querySelector('.team-score-left');
    const scoreRight = container.querySelector('.team-score-right');
    const chrono = container.querySelector('.chrono');
    let hasChanged = false;
    
    if (scoreLeft) {
        const score = data.score1 !== undefined ? data.score1 : 
                    (data.scoreA !== undefined ? data.scoreA : 
                    (data.points1 !== undefined ? data.points1 : '0'));
        
        if (score !== previousValues.score1) {
            scoreLeft.textContent = score;
            console.log(`Score gauche mis à jour: ${score}`);
            hasChanged = true;
        }
    }
    
    if (scoreRight) {
        const score = data.score2 !== undefined ? data.score2 : 
                    (data.scoreB !== undefined ? data.scoreB : 
                    (data.points2 !== undefined ? data.points2 : '0'));
        
        if (score !== previousValues.score2) {
            scoreRight.textContent = score;
            console.log(`Score droit mis à jour: ${score}`);
            hasChanged = true;
        }
    }
    
    if (chrono) {
        const time = data.chrono || data.timer || data.time || '00:00';
        
        if (time !== previousValues.chrono) {
            chrono.textContent = time;
            console.log(`Chrono mis à jour: ${time}`);
            hasChanged = true;
        }
    }
    
    return hasChanged;
}

// Fonction pour créer des données de test pour le football
function createTestFootballData() {
    console.log("Création de données de test pour le football");
    const testData = {
        team1: "JUNIA",
        team2: "ESPOL",
        score1: 2,
        score2: 1,
        chrono: "32:15",
        status: "en_cours",
        matchType: "Football",
        terrainId: 1
    };
    
    // Enregistrer dans localStorage
    localStorage.setItem("football_test_match", JSON.stringify(testData));
    
    // Mettre à jour l'affichage
    updateSportDisplay('football', 1, testData);
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système de scores en direct...');
    
    // Générer d'abord l'affichage statique
    generateStaticDisplay();

    
    // Variable globale pour suivre le dernier temps de mise à jour
    window._lastUpdateTimestamp = Date.now();
    
    // PUIS initialiser les gestionnaires d'événements et les données
    setTimeout(() => {
        initializeSportsHandlers();
    }, 300);
    
    // Configuration du rafraîchissement automatique contrôlé
    setInterval(() => {
        console.log("Vérification des mises à jour disponibles...");
        // Effectuer le rafraîchissement sans forcer la mise à jour de l'horodatage
        loadInitialStates(false);
    }, 20000); // 20 secondes entre les vérifications
});

// Fonction d'aide pour surveiller la disponibilité des conteneurs
function waitForContainer(terrainId, callback, maxAttempts = 5) {
    let attempts = 0;
    
    function checkContainer() {
        attempts++;
        const container = document.getElementById(`terrain-${terrainId}`);
        if (container) {
            callback(container);
        } else if (attempts < maxAttempts) {
            setTimeout(checkContainer, 200);
        } else {
            console.warn(`Abandonné après ${maxAttempts} tentatives: conteneur pour terrain-${terrainId} introuvable`);
        }
    }
    
    checkContainer();
}

// Variable globale pour connecter le HTML et JS
window.terrains = [
    { id: 1, name: "Terrain n°1 - Football", type: "football", scorebarType: 3, count: 1 },
    { id: 2, name: "Terrain n°2 - Cible 1", type: "flechettes", scorebarType: 1, count: 1 },
    { id: 3, name: "Terrain n°3 - Cible 2", type: "flechettes", scorebarType: 1, count: 1 },
    { id: 4, name: "Terrain n°4 - Cible 3", type: "flechettes", scorebarType: 1, count: 1 },
    { id: 5, name: "Terrain n°5 - Cible 4", type: "flechettes", scorebarType: 1, count: 1 },
    { id: 6, name: "Terrain n°6 - Pétanque 1", type: "petanque", scorebarType: 2, count: 1 },
    { id: 7, name: "Terrain n°7 - Pétanque 2", type: "petanque", scorebarType: 2, count: 1 },
    { id: 8, name: "Terrain n°8 - Badminton/Handball", type: "badminton", mixedScorebarTypes: [2, 2, 3], count: 3 },
    { id: 9, name: "Terrain n°9 - Volley/Basket", type: "volley", scorebarType: 3, count: 2 }
];