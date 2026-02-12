const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
	getChatHistory,
	toggleGlobalChat,
	toggleUserChat
} = require('../controllers/chatController');

router.use(authMiddleware);

// Get chat history for a meeting
router.get('/:meetingId', getChatHistory);

// Host controls
router.put('/:meetingId/toggle-global', toggleGlobalChat);
router.put('/:meetingId/toggle-user', toggleUserChat);

module.exports = router;
