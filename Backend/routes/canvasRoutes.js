const express = require('express');
const router = express.Router();
const {
  createCanvas,
  getCanvases,
  getCanvasById,
  updateCanvas,
  deleteCanvas,
  duplicateCanvas,
  getMeetingCanvasById,
  updateMeetingCanvas,
  renameCanvas,
  exportCanvas,
  importCanvas,
  // EPIC 4: File Management, Storage, History & Export
  toggleFavorite,
  saveVersion,
  getVersions,
  restoreVersion,
  autosaveCanvas,
  importImage,
  getDrawingActions,
  backupCanvas,
  syncCanvas
} = require('../controllers/canvasController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');
const { upload, imageUpload } = require('../middleware/uploadMiddleware.js');

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

// EPIC 4: Sub-resource routes (must be before /:id catch-all)
router.patch('/:id/favorite', toggleFavorite);                // Toggle favorite
router.post('/:id/versions', saveVersion);                    // Save version snapshot
router.get('/:id/versions', getVersions);                     // Get version history
router.put('/:id/versions/:versionId/restore', restoreVersion); // Restore a version
router.put('/:id/autosave', autosaveCanvas);                  // Autosave canvas
router.post('/:id/import-image', imageUpload.single('image'), importImage); // Import image
router.get('/:id/drawing-actions', getDrawingActions);        // Time-lapse replay data
router.post('/:id/backup', backupCanvas);                     // Cloud backup
router.put('/:id/sync', syncCanvas);                          // Sync across devices

router.route('/:id')
  .get(getCanvasById)   // GET: Load specific canvas
  .put(updateCanvas)    // PUT: Save drawing
  .delete(deleteCanvas);// DELETE: Remove canvas

router.route('/:id/duplicate')
  .post(duplicateCanvas); // POST: Duplicate a canvas
// Rename canvas
router.patch('/:id/rename', renameCanvas);

// Export canvas as JSON
router.get('/:id/export', exportCanvas);



module.exports = router;