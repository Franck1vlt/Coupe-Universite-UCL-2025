/**
 * Utilitaire pour vérifier le statut du serveur
 * Ce script est utilisé pour afficher l'état de la connexion dans l'interface
 */

(function() {
    // Délai avant de vérifier la connexion
    const initialDelay = 2000;
    
    // Configuration
    const checkInterval = 30000; // 30 secondes entre chaque vérification
    const socketTimeout = 5000;  // 5 secondes de timeout
    
    // État de la connexion
    let connectionState = 'checking';
    
    /**
     * Met à jour l'indicateur visuel de l'état de la connexion
     */
    function updateConnectionIndicator(state, message = '') {
        const indicator = document.querySelector('.connection-status');
        if (!indicator) return;
        
        // Supprimer les classes précédentes
        indicator.classList.remove('connected', 'disconnected', 'connecting', 'offline');
        
        // Appliquer le nouvel état
        switch(state) {
            case 'connected':
                indicator.textContent = 'Connexion: ✅';
                indicator.classList.add('connected');
                connectionState = 'connected';
                break;
            case 'disconnected':
                indicator.textContent = 'Connexion: ❌';
                indicator.classList.add('disconnected');
                connectionState = 'disconnected';
                break;
            case 'offline':
                indicator.textContent = `Mode hors ligne ${message ? '(' + message + ')' : ''}`;
                indicator.classList.add('offline');
                connectionState = 'offline';
                break;
            default:
                indicator.textContent = 'Connexion...';
                indicator.classList.add('connecting');
                connectionState = 'checking';
        }
    }
    
    /**
     * Vérifie la connexion au serveur via Socket.IO
     */
    function checkServerConnection() {
        // Si Socket.IO n'est pas chargé, considérer comme hors ligne
        if (typeof io === 'undefined') {
            console.warn('Socket.IO non disponible');
            updateConnectionIndicator('offline', 'Socket.IO non chargé');
            return;
        }
        
        // Tentative de connexion Socket.IO
        try {
            updateConnectionIndicator('connecting');
            
            // Créer une connexion temporaire pour tester
            const socket = io({
                reconnection: false,
                timeout: socketTimeout
            });
            
            // Si la connexion réussit
            socket.on('connect', () => {
                updateConnectionIndicator('connected');
                setTimeout(() => {
                    // Déconnecter après vérification réussie
                    socket.disconnect();
                }, 500);
            });
            
            // Erreurs de connexion
            socket.on('connect_error', () => {
                updateConnectionIndicator('offline', 'Serveur non disponible');
            });
            
            // Timeout de sécurité
            setTimeout(() => {
                if (connectionState === 'checking') {
                    updateConnectionIndicator('offline', 'Délai dépassé');
                    socket.disconnect();
                }
            }, socketTimeout);
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            updateConnectionIndicator('offline', error.message);
        }
    }
    
    // Exécuter la vérification après un délai initial
    setTimeout(() => {
        // Vérifier la connexion
        checkServerConnection();
        
        // Vérifier périodiquement
        setInterval(checkServerConnection, checkInterval);
    }, initialDelay);
})();
