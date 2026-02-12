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

// Create multer upload instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = { upload };
