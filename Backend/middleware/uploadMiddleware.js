const multer = require('multer');

// Configure multer for memory storage (we'll parse JSON directly)
const storage = multer.memoryStorage();

// File filter to accept only JSON files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
    cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed'), false);
  }
};

// File filter to accept images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter to accept images and videos
const mediaFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Create multer upload instance for JSON files
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create multer upload instance for image files (profile pics, canvas images)
const imageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create multer upload instance for media files (recordings, video)
const mediaUpload = multer({
  storage: storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for recordings
  }
});

module.exports = { upload, imageUpload, mediaUpload };
