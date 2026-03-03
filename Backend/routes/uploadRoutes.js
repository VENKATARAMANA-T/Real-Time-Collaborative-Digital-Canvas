const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware.js');
const { imageUpload, mediaUpload } = require('../middleware/uploadMiddleware.js');
const {
  uploadBase64Image,
  uploadMultipleBase64Images,
  uploadFile,
  uploadRecording,
  deleteUpload,
} = require('../controllers/uploadController.js');

// All routes require authentication
router.use(authMiddleware);

// Upload a single base64 image (canvas thumbnail, pixel data, imported images)
router.post('/image', uploadBase64Image);

// Upload multiple base64 images (canvas with imported images)
router.post('/images', uploadMultipleBase64Images);

// Upload a single file via multipart form (profile picture)
router.post('/file', imageUpload.single('file'), uploadFile);

// Upload a recording file (video)
router.post('/recording', mediaUpload.single('recording'), uploadRecording);

// Delete a Cloudinary resource
router.delete('/delete', deleteUpload);

module.exports = router;
