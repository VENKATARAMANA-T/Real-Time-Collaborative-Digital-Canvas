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

// ALL routes are protected
router.use(authMiddleware);

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

// Rename, Export, Import routes
router.post('/import', importCanvas);              // POST: Import canvas from JSON

router.route('/:id/rename')
  .patch(renameCanvas);  // PATCH: Rename canvas

router.route('/:id/export')
  .get(exportCanvas);    // GET: Export canvas as JSON


module.exports = router;