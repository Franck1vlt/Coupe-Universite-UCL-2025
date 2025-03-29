/**
 * handball-sync.js
 * Module de synchronisation pour le tournoi de handball
 */

document.addEventListener('DOMContentLoaded', function() {
  if (!window.io) {
    console.warn("Socket.io n'est pas disponible - synchronisation désactivée");
    return;
  }

  try {
    console.log("Initialisation du module de synchronisation handball");
    const socket = io('/handball');

    socket.on('connect', function() {
      console.log("Module de synchronisation connecté");
      
      // S'abonner aux mises à jour du tournoi - format corrigé
      socket.emit('subscribeTournament', { 
        sport: 'handball',
        state: {} // Ajout d'un état vide pour éviter l'erreur
      });
      
      // Demander l'état initial du tournoi - format corrigé
      socket.emit('request_tournament_state', { 
        sport: 'handball',
        state: {} // Ajout d'un état vide pour éviter l'erreur
      });
    });

    // Écouter les mises à jour du tournoi
    socket.on('tournamentState', function(data) {
      console.log("Réception d'un état du tournoi via Socket.io");
      
      if (!data) {
        console.error("Données d'état invalides reçues");
        return;
      }
      
      // S'assurer que les données sont correctement formatées
      const formattedData = formatTournamentData(data);
      
      // Sauvegarder les données dans localStorage pour backup
      localStorage.setItem('handballTournamentState', JSON.stringify(formattedData));
      localStorage.setItem('handballLastUpdate', new Date().toISOString());
      
      // Propager les données vers le module principal de tournoi
      if (window.updateTournamentFromSync) {
        window.updateTournamentFromSync(formattedData);
      }
    });

    // Envoyer des données au serveur avec le format correct
    window.sendToServer = function(eventName, data) {
      try {
        // S'assurer que l'objet data existe
        const dataObj = data || {};
        
        // Assurer une structure cohérente pour toutes les données envoyées
        const formattedData = {
          sport: 'handball',
          timestamp: new Date().toISOString(),
          state: dataObj // Utiliser les données fournies comme état
        };
        
        console.log(`Envoi de données au serveur (${eventName}):`, formattedData);
        socket.emit(eventName, formattedData);
        return true;
      } catch (error) {
        console.error(`Erreur lors de l'envoi de données (${eventName}):`, error);
        return false;
      }
    };

    // Exposer le socket pour une utilisation externe
    window.handballSyncSocket = socket;
    
    // Interception et redirection des émissions socket directes
    const originalEmit = socket.emit;
    socket.emit = function(eventName, data) {
      // Liste d'événements système à ne pas modifier
      const systemEvents = ['connect', 'disconnect', 'error', 'connect_error'];
      
      if (systemEvents.includes(eventName)) {
        return originalEmit.call(this, eventName, data);
      }
      
      // Pour les autres événements, s'assurer que la structure est correcte
      if (data && !data.state) {
        const formattedData = {
          sport: 'handball',
          timestamp: new Date().toISOString(),
          state: data
        };
        console.log(`[Socket Interceptor] Formatage de l'événement ${eventName}:`, formattedData);
        return originalEmit.call(this, eventName, formattedData);
      }
      
      return originalEmit.call(this, eventName, data);
    };
    
  } catch (error) {
    console.error("Erreur d'initialisation du module de synchronisation:", error);
  }
});

// Formatage des données du tournoi pour assurer un format cohérent
function formatTournamentData(data) {
  // Si les données ont déjà la bonne structure, les utiliser
  if (data && data.state && typeof data.state === 'object' && data.state.matches) {
    return data.state;
  }
  
  // Si les données sont directement l'état du tournoi
  if (data && data.matches) {
    return data;
  }
  
  // Structure de secours minimale
  return {
    matches: {}
  };
}
