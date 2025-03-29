// handball-sync-init.js
// Ce script doit être inclus dans handball.html AVANT le script principal tournament.js

(function() {
    // Variable pour suivre les tentatives
    let checkAttempts = 0;
    const maxAttempts = 10;
    
    // Fonction pour vérifier si le module est chargé
    function checkHandballSyncLoaded() {
        checkAttempts++;
        
        // Si le module est déjà disponible
        if (window.HandballSync) {
            console.log("Module de synchronisation handball détecté avec succès");
            
            // Déclencher un événement pour informer le reste de l'application
            const event = new CustomEvent('handball_sync_detected', {
                detail: { sync: window.HandballSync },
                bubbles: true
            });
            document.dispatchEvent(event);
            
            return true;
        }
        
        // Si le nombre maximum de tentatives est atteint
        if (checkAttempts >= maxAttempts) {
            console.warn("Module de synchronisation handball non détecté après plusieurs tentatives");
            
            // Créer un module de secours très simple pour éviter les erreurs
            window.HandballSync = {
                isReady: function() { return false; },
                getCurrentState: function() { return null; },
                forceSync: function() { return false; },
                sendMatchUpdate: function() { return false; },
                sendScoreUpdate: function() { return false; }
            };
            
            // Déclencher un événement d'erreur
            const event = new CustomEvent('handball_sync_error', {
                detail: { error: "Module non détecté" },
                bubbles: true
            });
            document.dispatchEvent(event);
            
            return false;
        }
        
        // Réessayer après un délai
        console.log(`Tentative de détection du module handball ${checkAttempts}/${maxAttempts}...`);
        setTimeout(checkHandballSyncLoaded, 300);
        return false;
    }
    
    // Commencer la vérification une fois le DOM chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkHandballSyncLoaded);
    } else {
        // Si le DOM est déjà chargé
        checkHandballSyncLoaded();
    }
    
    // Écouter également l'événement qui indique que le module est chargé
    document.addEventListener('handball_sync_loaded', function() {
        console.log("Événement de chargement du module handball détecté");
        checkHandballSyncLoaded();
    });
})();
