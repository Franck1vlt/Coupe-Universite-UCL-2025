/**
 * handball-sync.js - Module de synchronisation pour le tournoi de handball
 * Assure que tous les clients voient les mêmes scores et statuts de match
 */

// Assurons-nous que le module est chargé correctement
console.log("Chargement du module de synchronisation handball...");

// Classe principale pour la synchronisation
class HandballSync {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.tournamentState = null;
    this.lastUpdateTimestamp = null;
    this.updateCallback = null;
    this.useFallback = false;

    // Charger l'état depuis localStorage au démarrage
    this.loadFromLocalStorage();
    
    // Initialiser Socket.io si disponible
    this.initSocketIO();
    
    // Démarrer la synchronisation périodique
    this.startPeriodicSync();
  }
  
  // Initialisation de Socket.io - améliorer la gestion des erreurs
  initSocketIO() {
    if (!window.io) {
      console.warn("Socket.io n'est pas disponible, utilisation du mode hors-ligne");
      this.useFallback = true;
      return;
    }
    
    try {
      console.log("Initialisation de la connexion Socket.io pour le handball");
      // S'assurer qu'on utilise la bonne syntaxe pour le namespace
      this.socket = io('/handball', {
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5
      });
      
      this.socket.on('connect', () => {
        console.log("Connecté au serveur Socket.io");
        this.connected = true;
        this.useFallback = false;
        
        // S'abonner aux mises à jour du tournoi
        this.socket.emit('subscribeTournament', { sport: 'handball' });
        
        // Demander l'état initial
        this.socket.emit('request_tournament_state');
        this.socket.emit('requestData', { global: true });
      });
      
      this.socket.on('scoreUpdate', (data) => {
        console.log("Mise à jour de score reçue:", data);
        this.updateMatchData(data);
      });
      
      this.socket.on('tournamentState', (data) => {
        console.log("État du tournoi reçu");
        if (data && data.state) {
          this.updateTournamentState(data.state, data.timestamp);
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.error("Erreur de connexion Socket.io:", error.message);
        this.connected = false;
        this.useFallback = true;
      });
      
      this.socket.on('disconnect', () => {
        console.warn("Déconnecté du serveur Socket.io");
        this.connected = false;
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Socket.io:", error);
      this.useFallback = true;
    }
  }
  
  // Charger l'état depuis localStorage
  loadFromLocalStorage() {
    try {
      const savedState = localStorage.getItem('handballTournamentState');
      const timestamp = localStorage.getItem('handballLastUpdate');
      
      if (savedState) {
        this.tournamentState = JSON.parse(savedState);
        this.lastUpdateTimestamp = timestamp;
        console.log("État du tournoi chargé depuis localStorage");
      }
    } catch (error) {
      console.error("Erreur lors du chargement depuis localStorage:", error);
    }
  }
  
  // Sauvegarder l'état dans localStorage
  saveToLocalStorage() {
    if (!this.tournamentState) return;
    
    try {
      localStorage.setItem('handballTournamentState', JSON.stringify(this.tournamentState));
      localStorage.setItem('handballLastUpdate', new Date().toISOString());
      console.log("État du tournoi sauvegardé dans localStorage");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans localStorage:", error);
    }
  }
  
  // Mettre à jour l'état du tournoi
  updateTournamentState(newState, timestamp) {
    // Ne pas écraser des données plus récentes
    if (this.lastUpdateTimestamp && timestamp < this.lastUpdateTimestamp) {
      console.log("Ignorer mise à jour plus ancienne");
      return;
    }
    
    this.tournamentState = newState;
    this.lastUpdateTimestamp = timestamp || new Date().toISOString();
    this.saveToLocalStorage();
    
    // Notifier les composants abonnés
    if (this.updateCallback) {
      this.updateCallback(this.tournamentState);
    }
  }
  
  // Mettre à jour les données d'un match spécifique
  updateMatchData(data) {
    if (!data || !data.matchId || !this.tournamentState || !this.tournamentState.matches) {
      return;
    }
    
    const matchId = data.matchId;
    
    // Vérifier si le match existe dans notre état
    if (!this.tournamentState.matches[matchId]) {
      return;
    }
    
    // Mettre à jour le match
    this.tournamentState.matches[matchId] = {
      ...this.tournamentState.matches[matchId],
      score1: data.score1 !== undefined ? data.score1 : this.tournamentState.matches[matchId].score1,
      score2: data.score2 !== undefined ? data.score2 : this.tournamentState.matches[matchId].score2,
      status: data.status || this.tournamentState.matches[matchId].status
    };
    
    // Mettre à jour le gagnant/perdant si le match est terminé
    if (data.status === 'terminé') {
      const score1 = parseInt(data.score1);
      const score2 = parseInt(data.score2);
      
      if (score1 > score2) {
        this.tournamentState.matches[matchId].winner = data.team1;
        this.tournamentState.matches[matchId].loser = data.team2;
      } else if (score2 > score1) {
        this.tournamentState.matches[matchId].winner = data.team2;
        this.tournamentState.matches[matchId].loser = data.team1;
      } else {
        this.tournamentState.matches[matchId].draw = true;
      }
    }
    
    this.saveToLocalStorage();
    
    // Notifier les composants abonnés
    if (this.updateCallback) {
      this.updateCallback(this.tournamentState);
    }
  }
  
  // S'abonner aux mises à jour
  subscribe(callback) {
    this.updateCallback = callback;
    
    // Envoyer immédiatement l'état actuel au nouveau souscripteur
    if (this.tournamentState && callback) {
      callback(this.tournamentState);
    }
  }
  
  // Synchronisation périodique avec le serveur
  startPeriodicSync() {
    setInterval(() => {
      this.sync();
    }, 5000); // Toutes les 5 secondes
  }
  
  // Synchroniser avec le serveur
  sync() {
    if (this.connected && this.socket) {
      console.log("Synchronisation avec le serveur via Socket.io");
      this.socket.emit('request_tournament_state');
      this.socket.emit('requestData', { global: true });
    } else if (this.useFallback) {
      console.log("Mode hors-ligne actif, utilisation de localStorage");
      this.loadFromLocalStorage();
      
      // Notifier les composants abonnés
      if (this.updateCallback && this.tournamentState) {
        this.updateCallback(this.tournamentState);
      }
    }
  }
}

// S'assurer que l'instance globale est correctement créée
try {
  console.log("Création de l'instance HandballSync globale");
  window.handballSync = new HandballSync();
  console.log("Instance HandballSync créée avec succès");
} catch (error) {
  console.error("Erreur lors de la création de l'instance HandballSync:", error);
}

// Export pour les modules ES6 - mais rendre compatible avec les navigateurs
try {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = window.handballSync;
  }
} catch (e) {
  // Ignorer les erreurs d'export dans un environnement navigateur
}
