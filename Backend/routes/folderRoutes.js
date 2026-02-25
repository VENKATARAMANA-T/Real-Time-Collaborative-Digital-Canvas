const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  getFolderCanvases
} = require('../controllers/folderController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');

// ALL routes are protected
router.use(authMiddleware);

router.route('/')
  .post(createFolder)   // POST: Create new folder
  .get(getFolders);     // GET: List all folders

router.route('/:id')
  .get(getFolderById)   // GET: Get specific folder
  .put(updateFolder)    // PUT: Update folder name
  .delete(deleteFolder);// DELETE: Delete folder

router.route('/:id/canvases')
  .get(getFolderCanvases); // GET: Get all canvases in folder

module.exports = router;
