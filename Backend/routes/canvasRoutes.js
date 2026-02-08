const express = require('express');
const router = express.Router();
const {
  createCanvas,
  getCanvases,
  getCanvasById,
  updateCanvas,
  deleteCanvas
} = require('../controllers/canvasController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');

// ALL routes are protected
router.use(authMiddleware);

router.route('/')
  .post(createCanvas)   // POST: Create blank canvas
  .get(getCanvases);    // GET: List my canvases

router.route('/:id')
  .get(getCanvasById)   // GET: Load specific canvas
  .put(updateCanvas)    // PUT: Save drawing
  .delete(deleteCanvas);// DELETE: Remove canvas

module.exports = router;