const express = require('express');
const router = express.Router();
const {
	updateUserProfile,
	updatePassword,
	getUserActivityLogs
} = require('../controllers/userController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');

// All routes require login
router.use(authMiddleware);

router.put('/:id/profile', updateUserProfile);
router.put('/:id/password', updatePassword);
router.get('/:id/activity-logs', getUserActivityLogs);


module.exports = router;
