const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All bot routes require authentication
router.use(authMiddleware);

router.post('/chat', botController.getChatResponse);

module.exports = router;
