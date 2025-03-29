/**
 * Script d'initialisation du module de synchronisation handball
 * Ce script tente plusieurs fois d'initialiser le module en cas d'échec
 */

// Nombre maximal de tentatives d'initialisation
const MAX_INIT_ATTEMPTS = 5;
// Délai entre les tentatives (en millisecondes)
const RETRY_DELAY = 500;

// Variable pour suivre le nombre de tentatives
let initAttempts = 0;

/**
 * Tente d'initialiser le module de synchronisation handball
 */
function initializeHandballSyncModule() {
  // Vérifier si le module existe
  if (typeof handballSyncModule === 'undefined') {
    console.warn("Module de synchronisation handball non trouvé, nouvelle tentative dans " + RETRY_DELAY + "ms");
    
    // Vérifier si le nombre maximal de tentatives a été atteint
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      initAttempts++;
      setTimeout(initializeHandballSyncModule, RETRY_DELAY);
    } else {
      console.error("Module de synchronisation handball non détecté après plusieurs tentatives");
    }
    return;
  }
  
  // Tenter d'initialiser le module
  if (!handballSyncModule.isInitialized()) {
    const success = handballSyncModule.init();
    if (!success) {
      console.warn("Échec de l'initialisation du module de synchronisation handball, nouvelle tentative dans " + RETRY_DELAY + "ms");
      
      // Vérifier si le nombre maximal de tentatives a été atteint
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        initAttempts++;
        setTimeout(initializeHandballSyncModule, RETRY_DELAY);
      } else {
        console.error("Échec de l'initialisation du module de synchronisation handball après plusieurs tentatives");
      }
    } else {
      console.log("Module de synchronisation handball initialisé avec succès");
    }
  } else {
    console.log("Module de synchronisation handball déjà initialisé");
  }
}

// Attendre que le DOM soit chargé avant de tenter l'initialisation
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM chargé, tentative d'initialisation du module de synchronisation handball");
  initializeHandballSyncModule();
});

// Également tenter l'initialisation immédiatement au cas où le script est chargé après le DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("Document déjà chargé, tentative d'initialisation immédiate du module de synchronisation handball");
  initializeHandballSyncModule();
}
