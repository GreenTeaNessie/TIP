const express = require('express');
const router = express.Router();
const votesController = require('../controllers/votesController');

// GET /api/votes - Получить все голоса (с поддержкой ?format=percent)
router.get('/votes', votesController.getAllVotes);

// GET /api/votes/:id - Получить голоса по конкретному варианту
router.get('/votes/:id', votesController.getVoteById);

// POST /api/votes - Добавить голос
router.post('/votes', votesController.addVote);

// DELETE /api/votes - Сбросить все голоса
router.delete('/votes', votesController.resetVotes);

module.exports = router;
