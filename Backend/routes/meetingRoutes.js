const express = require('express');
const router = express.Router();
const { 
  createMeeting,
  createInstantMeeting,
  generateInstantMeetingCredentials,
  startMeeting,
  joinMeeting, 
  joinMeetingByLink, 
  endMeeting, 
  updatePermission,
  leaveMeeting,
  getMeetingDetails
} = require('../controllers/meetingController');
const { authMiddleware } = require('../middleware/authMiddleware'); // Ensure this matches your export name

// All routes require login
router.use(authMiddleware);

// Get Meeting Details with Participants
router.get('/:id', getMeetingDetails);

// Create a new meeting (regular - immediately live)
router.post('/', createMeeting);

// Generate instant meeting credentials (no DB creation)
router.post('/generate-credentials', generateInstantMeetingCredentials);

// Create instant meeting (pending status - must be called after generate)
router.post('/instant', createInstantMeeting);

// Start meeting (transition from pending to live)
router.put('/:id/start', startMeeting);

// Join via Manual Entry (ID + Password)
router.post('/join', joinMeeting);

// Join via Secure Link (Token)
// Note: The :token param matches req.params.token in your controller
router.post('/join-link/:token', joinMeetingByLink); 

// End Meeting (Host Only)
router.put('/:id/end', endMeeting);

// Leave Meeting (Participant Only)
router.put('/:id/leave', leaveMeeting);

// Update Permissions (Host Only)
router.put('/:id/permissions', updatePermission);

module.exports = router;