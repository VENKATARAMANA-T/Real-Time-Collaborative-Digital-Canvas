const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	refreshAccessToken,
	logoutUser,
	forgotPassword,
	resetPassword
} = require('../controllers/authController.js');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;