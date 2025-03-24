const express = require('express');
const router = express.Router();

// Données temporaires des tournois (à remplacer par une BD ou des fichiers)
let tournoiHommes = {
  nom: "Volley Hommes",
  equipes: [],
  matchs: []
};

let tournoiFemmes = {
  nom: "Volley Femmes",
  equipes: [],
  matchs: []
};

// Routes pour le tournoi hommes
router.get('/tournois/hommes', (req, res) => {
  res.json(tournoiHommes);
});

router.post('/tournois/hommes/equipes', (req, res) => {
  const nouvelleEquipe = req.body;
  tournoiHommes.equipes.push(nouvelleEquipe);
  res.status(201).json(nouvelleEquipe);
});

router.post('/tournois/hommes/matchs', (req, res) => {
  const nouveauMatch = req.body;
  tournoiHommes.matchs.push(nouveauMatch);
  res.status(201).json(nouveauMatch);
});

// Routes pour le tournoi femmes
router.get('/tournois/femmes', (req, res) => {
  res.json(tournoiFemmes);
});

router.post('/tournois/femmes/equipes', (req, res) => {
  const nouvelleEquipe = req.body;
  tournoiFemmes.equipes.push(nouvelleEquipe);
  res.status(201).json(nouvelleEquipe);
});

router.post('/tournois/femmes/matchs', (req, res) => {
  const nouveauMatch = req.body;
  tournoiFemmes.matchs.push(nouveauMatch);
  res.status(201).json(nouveauMatch);
});

module.exports = router;
