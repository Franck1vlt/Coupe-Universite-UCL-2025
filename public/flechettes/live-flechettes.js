/**
 * Fichier dédié à la gestion des données en direct pour les fléchettes
 */

// Numéros des terrains de fléchettes
const FLECHETTES_TERRAINS = [2, 3, 4, 5];

// Attribution persistante des matchs aux terrains (stockée dans localStorage)
const STORAGE_KEY_TERRAIN_ASSIGNMENTS = 'flechettes_terrain_assignments';

// Suivi de la dernière fois qu'on a assigné les matchs
let lastAssignmentTime = 0;
const MIN_REASSIGNMENT_INTERVAL = 60000; // 60 secondes minimum entre les réassignments

// Fonction d'initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du système de scores pour les fléchettes...');
    
    // Réserver tous les terrains de fléchettes immédiatement
    reserveFlechettesTerrains();
    
    // Écouter les événements spécifiques aux fléchettes
    window.addEventListener('storage', handleFlechettesStorageChange);
    
    // Charger les données initiales
    setTimeout(() => {
        console.log('Chargement initial des matchs de fléchettes...');
        loadFlechettesInitialState(true); // Force l'attribution initiale
        
        // Configurer une actualisation périodique uniquement des DONNÉES (pas des assignations)
        setInterval(() => refreshMatchData(), 5000);
    }, 500);
});

// Fonction pour réserver les terrains spécifiquement pour les fléchettes
function reserveFlechettesTerrains() {
    FLECHETTES_TERRAINS.forEach(terrainId => {
        const terrainContainer = document.getElementById(`terrain-${terrainId}`);
        if (terrainContainer) {
            // Marquer explicitement comme terrain de fléchettes
            terrainContainer.setAttribute('data-sport', 'flechettes');
            terrainContainer.setAttribute('data-reserved', 'true');
            console.log(`Terrain ${terrainId} réservé exclusivement pour les fléchettes`);
        }
    });
}

// Récupérer les assignations terrain-match sauvegardées
function getTerrainAssignments() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_TERRAIN_ASSIGNMENTS);
        if (saved) {
            const assignments = JSON.parse(saved);
            console.log("Assignations récupérées:", assignments);
            return assignments;
        }
        return {};
    } catch (e) {
        console.error("Erreur lors de la récupération des assignations:", e);
        return {};
    }
}

// Sauvegarder les assignations terrain-match
function saveTerrainAssignments(assignments) {
    try {
        localStorage.setItem(STORAGE_KEY_TERRAIN_ASSIGNMENTS, JSON.stringify(assignments));
        console.log("Assignations sauvegardées:", assignments);
        lastAssignmentTime = Date.now();
    } catch (e) {
        console.error("Erreur lors de la sauvegarde des assignations:", e);
    }
}

// Chargement initial des données de fléchettes avec assignation fixe
function loadFlechettesInitialState(forceAssignment = false) {
    console.log('Chargement des données de fléchettes...');
    
    // Vérifier si on peut réassigner les matchs
    const now = Date.now();
    if (!forceAssignment && now - lastAssignmentTime < MIN_REASSIGNMENT_INTERVAL) {
        console.log(`Trop tôt pour réassigner les matchs (${Math.floor((now - lastAssignmentTime)/1000)}s écoulées). Rafraîchissement uniquement.`);
        refreshMatchData();
        return;
    }
    
    // Récupérer les matchs actuels
    const allMatches = getAllFlechettesMatches();
    console.log(`${allMatches.length} matchs de fléchettes trouvés`);
    
    // 1. Identifier les matchs "en cours" pour leur donner priorité
    const activeMatches = allMatches.filter(m => 
        m.data.status === 'en_cours' || 
        m.data.etat === 'en_cours' || 
        m.data.state === 'en_cours' ||
        m.data.isActive === true
    );
    console.log(`${activeMatches.length} matchs sont marqués "en cours"`);
    
    // 2. Récupérer les assignations sauvegardées
    let terrainAssignments = getTerrainAssignments();
    
    // 3. VÉRIFICATION DE STABILITÉ: Est-ce que les matchs déjà assignés existent toujours?
    let hasInvalidAssignments = false;
    for (const [terrainId, matchId] of Object.entries(terrainAssignments)) {
        // Vérifier si ce match existe dans notre liste
        const matchExists = allMatches.some(m => m.matchId === matchId);
        if (!matchExists) {
            console.log(`Le match ${matchId} assigné au terrain ${terrainId} n'existe plus`);
            delete terrainAssignments[terrainId]; // Retirer cette assignation
            hasInvalidAssignments = true;
        }
    }
    
    // 4. VÉRIFICATION DE COMPLÉTUDE: Est-ce que tous les terrains ont un match assigné?
    const assignedTerrains = Object.keys(terrainAssignments).map(id => parseInt(id));
    const unassignedTerrains = FLECHETTES_TERRAINS.filter(id => !assignedTerrains.includes(id));
    
    if (unassignedTerrains.length > 0) {
        console.log(`${unassignedTerrains.length} terrains n'ont pas de match assigné: ${unassignedTerrains.join(', ')}`);
    }
    
    // 5. VÉRIFICATION DE PRIORITÉ: Est-ce que les matchs actifs sont bien assignés?
    const assignedMatchIds = Object.values(terrainAssignments);
    const unassignedActiveMatches = activeMatches.filter(m => !assignedMatchIds.includes(m.matchId));
    
    if (unassignedActiveMatches.length > 0 && unassignedTerrains.length > 0) {
        console.log(`${unassignedActiveMatches.length} matchs actifs non assignés, attribuant aux terrains libres`);
        
        // Assigner les matchs actifs aux terrains libres
        unassignedActiveMatches.forEach((match, index) => {
            if (index < unassignedTerrains.length) {
                const terrainId = unassignedTerrains[index];
                console.log(`Attribution du match actif ${match.matchId} au terrain libre ${terrainId}`);
                terrainAssignments[terrainId] = match.matchId;
            }
        });
    }
    
    // 6. VÉRIFICATION FINALE: Assigner des matchs aux terrains restants
    const remainingTerrains = FLECHETTES_TERRAINS.filter(id => !Object.keys(terrainAssignments).map(Number).includes(id));
    
    if (remainingTerrains.length > 0) {
        console.log(`Attribution de matchs aux ${remainingTerrains.length} terrains restants`);
        
        // Créer une liste des matchs non assignés
        const assignedMatchIds = Object.values(terrainAssignments);
        const unassignedMatches = allMatches.filter(m => !assignedMatchIds.includes(m.matchId));
        
        // Assigner les matchs disponibles aux terrains restants
        remainingTerrains.forEach((terrainId, index) => {
            if (index < unassignedMatches.length) {
                terrainAssignments[terrainId] = unassignedMatches[index].matchId;
                console.log(`Terrain ${terrainId} reçoit le match ${unassignedMatches[index].matchId}`);
            } else {
                // Si plus de matchs disponibles, créer un match vide
                console.log(`Pas de match disponible pour le terrain ${terrainId}, affichage par défaut`);
                setDefaultFlechettesDisplay(terrainId);
            }
        });
    }
    
    // 7. MISE À JOUR DE L'AFFICHAGE avec les assignations finales
    FLECHETTES_TERRAINS.forEach(terrainId => {
        const matchId = terrainAssignments[terrainId];
        if (matchId) {
            const match = allMatches.find(m => m.matchId === matchId);
            if (match) {
                // Mettre à jour l'affichage
                console.log(`MAJ terrain ${terrainId} avec match ${matchId}: ${match.data.team1 || ''} vs ${match.data.team2 || ''}`);
                updateTerrainDisplay(terrainId, match.data, matchId);
            } else {
                // Ce cas ne devrait pas arriver après nos vérifications
                console.warn(`Match ${matchId} assigné au terrain ${terrainId} mais introuvable`);
                setDefaultFlechettesDisplay(terrainId);
            }
        } else {
            // Terrain sans match assigné
            setDefaultFlechettesDisplay(terrainId);
        }
    });
    
    // Enregistrer les assignations finales
    saveTerrainAssignments(terrainAssignments);
    
    // Afficher un résumé des assignations
    console.log("Résumé des assignations:");
    FLECHETTES_TERRAINS.forEach(id => {
        const matchId = terrainAssignments[id];
        const match = matchId ? allMatches.find(m => m.matchId === matchId) : null;
        const matchDesc = match ? `${match.data.team1 || 'Équipe 1'} vs ${match.data.team2 || 'Équipe 2'}` : 'Aucun match';
        console.log(`- Terrain ${id}: ${matchDesc} (${matchId || 'non assigné'})`);
    });
}

// Mettre à jour uniquement les données des matchs sans réassigner les terrains
function refreshMatchData() {
    console.log('Rafraîchissement des données des matchs existants...');
    
    // Récupérer les matchs les plus récents
    const allMatches = getAllFlechettesMatches();
    
    // Récupérer les assignations actuelles
    const terrainAssignments = getTerrainAssignments();
    
    // Pour chaque terrain avec un match assigné, mettre à jour les données
    let updateCount = 0;
    
    FLECHETTES_TERRAINS.forEach(terrainId => {
        const matchId = terrainAssignments[terrainId];
        if (matchId) {
            const match = allMatches.find(m => m.matchId === matchId);
            if (match) {
                // Mettre à jour l'affichage avec les dernières données
                updateTerrainDisplay(terrainId, match.data, matchId);
                updateCount++;
            }
        }
    });
    
    console.log(`Rafraîchissement terminé: ${updateCount} terrains mis à jour`);
}

// Mettre à jour l'affichage d'un terrain spécifique
function updateTerrainDisplay(terrainId, data, matchId) {
    // Assurer que le conteneur existe
    const container = document.getElementById(`terrain-${terrainId}`);
    if (!container) {
        console.warn(`Conteneur pour terrain ${terrainId} introuvable`);
        return false;
    }
    
    // Stocker l'ID du match dans le conteneur pour référence
    container.setAttribute('data-match-id', matchId);
    
    // Stocker les équipes pour le débogage visuel
    if (data.team1 && data.team2) {
        container.setAttribute('data-teams', `${data.team1} vs ${data.team2}`);
    }
    
    // Mise à jour via la fonction globale
    if (window.updateFlechettesDisplay) {
        // Ajout d'un timestamp pour aider à déboguer les mises à jour
        data._updateTime = new Date().toLocaleTimeString();
        
        window.updateFlechettesDisplay(terrainId, data);
        return true;
    }
    
    return false;
}

// Définir un affichage par défaut pour les terrains sans match
function setDefaultFlechettesDisplay(terrainId) {
    const defaultData = {
        team1: "EN ATTENTE",
        team2: "DE MATCH",
        score1: "0",
        score2: "0",
        points1: "301",
        points2: "301",
        sport: "flechettes"
    };
    
    updateTerrainDisplay(terrainId, defaultData, 'default');
}

// Gestionnaire pour les changements localStorage spécifiques aux fléchettes
function handleFlechettesStorageChange(e) {
    // Vérifier si la mise à jour concerne les fléchettes
    if (!e.key || !e.newValue || !isFlechettesKey(e.key)) return;
    
    try {
        const data = JSON.parse(e.newValue);
        
        // Vérifier que ce sont des données valides
        if (!isValidFlechettesData(data)) return;
        
        // Extraire l'identifiant du match
        const matchId = extractMatchId(e.key, data);
        
        // Ajouter un timestamp pour le tri
        data.lastUpdate = Date.now();
        
        // Récupérer les assignations actuelles
        const terrainAssignments = getTerrainAssignments();
        
        // Trouver le terrain assigné à ce match
        let terrainId = null;
        for (const [tid, mid] of Object.entries(terrainAssignments)) {
            if (mid === matchId) {
                terrainId = parseInt(tid);
                break;
            }
        }
        
        if (terrainId) {
            // Mettre à jour UNIQUEMENT le terrain déjà assigné à ce match
            console.log(`MAJ directe: match ${matchId} → terrain ${terrainId}`);
            updateTerrainDisplay(terrainId, data, matchId);
        } else {
            // Si c'est un nouveau match marqué "en cours", déclencher une réassignation
            const isActiveMatch = data.status === 'en_cours' || data.etat === 'en_cours' || 
                                data.state === 'en_cours' || data.isActive === true;
            
            if (isActiveMatch) {
                console.log(`Nouveau match actif détecté (${matchId}), vérification des assignations`);
                
                // Vérifier si on peut réassigner maintenant
                const now = Date.now();
                if (now - lastAssignmentTime >= MIN_REASSIGNMENT_INTERVAL) {
                    loadFlechettesInitialState(true);
                } else {
                    console.log(`Trop tôt pour réassigner (${Math.floor((now - lastAssignmentTime)/1000)}s écoulées)`);
                }
            } else {
                console.log(`Mise à jour pour match non assigné ${matchId} ignorée`);
            }
        }
    } catch (error) {
        console.error('Erreur lors du traitement de la mise à jour:', error);
    }
}

// Récupérer tous les matchs de fléchettes de localStorage
function getAllFlechettesMatches() {
    const matches = [];
    const processedKeys = new Set();
    
    // Parcourir toutes les clés de localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Ignorer les clés déjà traitées, la clé d'assignation ou non-fléchettes
        if (processedKeys.has(key) || 
            key === STORAGE_KEY_TERRAIN_ASSIGNMENTS || 
            !isFlechettesKey(key)) continue;
        
        processedKeys.add(key);
        
        try {
            const data = JSON.parse(localStorage.getItem(key));
            
            // Vérifier que ce sont des données valides pour fléchettes
            if (!isValidFlechettesData(data)) continue;
            
            // Générer un identifiant stable pour ce match
            const matchId = extractMatchId(key, data);
            
            // Éviter les doublons
            if (matches.some(m => m.matchId === matchId)) continue;
            
            // Déterminer si le match est actif
            const isActive = data.status === 'en_cours' || 
                            data.etat === 'en_cours' || 
                            data.state === 'en_cours' ||
                            data.isActive === true;
            
            // Ajouter ce match à notre liste
            matches.push({
                matchId: matchId,
                key: key,
                data: data,
                isActive: isActive,
                lastUpdate: data.lastUpdate || Date.now() - (matches.length * 1000)
            });
        } catch (error) {
            console.error(`Erreur lors du traitement de la clé ${key}:`, error);
        }
    }
    
    // Trier: d'abord les matchs en cours, puis par heure de mise à jour la plus récente
    return matches.sort((a, b) => {
        // Priorité 1: Matchs actifs en premier
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        // Priorité 2: Date de mise à jour (plus récent d'abord)
        return b.lastUpdate - a.lastUpdate;
    });
}

// Fonction pour vérifier si une clé concerne les fléchettes
function isFlechettesKey(key) {
    if (!key) return false;
    
    // Liste de mots-clés spécifiques aux fléchettes
    const flechettesKeywords = [
        'flechettes', 'flechette', 'darts', 'dart', '301', '501'
    ];
    
    // La clé doit contenir au moins un mot-clé de fléchettes
    const containsFlechettesKeyword = flechettesKeywords.some(keyword => 
        key.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!containsFlechettesKeyword) return false;
    
    // Exclusions explicites
    if (key.includes('football') || key.includes('petanque') || 
        key.includes('badminton') || key.includes('volleyball') || 
        key.includes('basket') || key.includes('terrain_assignments')) {
        return false;
    }
    
    return true;
}

// Vérifier si les données correspondent à un match de fléchettes
function isValidFlechettesData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Un match de fléchettes doit avoir au moins une des caractéristiques suivantes
    return (
        // Des points pour chaque équipe
        (data.points1 !== undefined || data.points2 !== undefined) ||
        // Structure avec scores actuels
        (data.currentScore && (data.currentScore.teamA !== undefined || data.currentScore.teamB !== undefined)) ||
        // Sport indiqué comme fléchettes
        (data.sport === 'flechettes' || data.sport === 'darts') ||
        // Type de match indiqué
        (data.matchType === 'flechettes' || data.matchType === 'darts') ||
        // Type de jeu correspondant à des fléchettes
        (data.gameType === '301' || data.gameType === '501' || data.gameMode === '301' || data.gameMode === '501')
    );
}

// Extraire un identifiant unique de match
function extractMatchId(key, data) {
    // Essayer d'extraire depuis les données (cas idéal)
    if (data.matchId) return `flechettes_${data.matchId}`;
    if (data.id) return `flechettes_${data.id}`;
    
    // Générer un ID basé sur les équipes
    if (data.team1 && data.team2) {
        // Normaliser les noms d'équipe pour éviter les variations mineures
        const team1 = data.team1.trim().toLowerCase().replace(/\s+/g, '_');
        const team2 = data.team2.trim().toLowerCase().replace(/\s+/g, '_');
        return `flechettes_${team1}_vs_${team2}`;
    }
    
    // Dernière option : utiliser une partie de la clé
    return `flechettes_key_${key.substring(0, 20)}`;
}