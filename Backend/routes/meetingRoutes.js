const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  createMeeting,
  createInstantMeeting,
  generateInstantMeetingCredentials,
  startMeeting,
  joinMeeting, 
  joinMeetingByLink, 
  endMeeting, 
  cancelMeeting,
  updatePermission,
  updateHostSettings,
  leaveMeeting,
  getMeetingDetails,
  getUserMeetings,
  uploadRecording,
  getMeetingNotes,
  updateSharedCanvasLink
} = require('../controllers/meetingController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Multer config for recording uploads - memory storage (saved to local disk in controller)
const recordingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for recordings
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// All routes require login
router.use(authMiddleware);

// Get all meetings for the logged-in user
router.get('/', getUserMeetings);

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

// Cancel Meeting (Host Only — permanently deletes)
router.delete('/:id/cancel', cancelMeeting);

// Leave Meeting (Participant Only)
router.put('/:id/leave', leaveMeeting);

// Update Permissions (Host Only)
router.put('/:id/permissions', updatePermission);

// Update Host Settings (Mute All, Video Off All, Chat Toggle, Screen Recording) - Host Only
router.put('/:id/host-settings', updateHostSettings);

// Upload Meeting Recording
router.post('/:id/recording', recordingUpload.single('recording'), uploadRecording);

// Get Meeting Notes (Chat + Recording info for ended meetings)
router.get('/:id/notes', getMeetingNotes);

// Update shared canvas link (Host Only)
router.put('/:id/canvas-link', updateSharedCanvasLink);

module.exports = router;