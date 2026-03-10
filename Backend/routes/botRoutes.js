const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');

// Bot route does not require auth — only needs GROQ_API_KEY (no DB dependency)
router.post('/chat', botController.getChatResponse);

module.exports = router;
