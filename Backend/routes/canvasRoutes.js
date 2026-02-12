const express = require('express');
const router = express.Router();
const {
  createCanvas,
  getCanvases,
  getCanvasById,
  updateCanvas,
  deleteCanvas,
  getMeetingCanvasById,
  updateMeetingCanvas,
  renameCanvas,
  exportCanvas,
  importCanvas
} = require('../controllers/canvasController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');
const { upload } = require('../middleware/uploadMiddleware.js');

// ALL routes are protected
router.use(authMiddleware);

// Import canvas from JSON file
router.post('/import', upload.single('canvas'), importCanvas);

router.route('/')
  .post(createCanvas)   // POST: Create blank canvas
  .get(getCanvases);    // GET: List my canvases

router.route('/meetingCanvas/:id')
  .get(getMeetingCanvasById)   // GET: Load specific canvas for meeting
  .put(updateMeetingCanvas);   // PUT: Save drawing for meeting

router.route('/:id')
  .get(getCanvasById)   // GET: Load specific canvas
  .put(updateCanvas)    // PUT: Save drawing
  .delete(deleteCanvas);// DELETE: Remove canvas

// Rename canvas
router.patch('/:id/rename', renameCanvas);

// Export canvas as JSON
router.get('/:id/export', exportCanvas);



module.exports = router;