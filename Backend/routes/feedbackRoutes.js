const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, submitFeedback);
router.get('/', authMiddleware, getAllFeedback);

module.exports = router;
