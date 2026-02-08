const express = require('express');
const router = express.Router();
const { 
  createMeeting, 
  joinMeeting, 
  joinMeetingByLink, 
  endMeeting, 
  updatePermission,
  leaveMeeting 
} = require('../controllers/meetingController');
const { authMiddleware } = require('../middleware/authMiddleware'); // Ensure this matches your export name

// All routes require login
router.use(authMiddleware);



// Create a new meeting
router.post('/', createMeeting);

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