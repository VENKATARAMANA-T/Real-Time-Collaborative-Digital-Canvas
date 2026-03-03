const {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require('../config/cloudinary.js');

// @desc    Upload image via base64 data URL (canvas thumbnails, canvas pixel data, canvas imported images)
// @route   POST /api/upload/image
// @access  Private
exports.uploadBase64Image = async (req, res) => {
  try {
    const { image, folder = 'RealTimeDigitalCanvas', type = 'general' } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Determine folder structure based on type
    let uploadFolder = `${folder}`;
    switch (type) {
      case 'canvas-thumbnail':
        uploadFolder = `${folder}/thumbnails`;
        break;
      case 'canvas-image':
        uploadFolder = `${folder}/canvas-images`;
        break;
      case 'canvas-pixel-data':
        uploadFolder = `${folder}/canvas-data`;
        break;
      case 'profile':
        uploadFolder = `${folder}/profiles`;
        break;
      case 'chat':
        uploadFolder = `${folder}/chat-images`;
        break;
      default:
        uploadFolder = `${folder}/general`;
    }

    const result = await uploadToCloudinary(image, {
      folder: uploadFolder,
      transformation: type === 'canvas-thumbnail' 
        ? [{ width: 400, height: 200, crop: 'fill', quality: 'auto' }]
        : undefined,
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('[Upload] Base64 upload error:', error.message);
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

// @desc    Upload multiple base64 images (for canvas with imported images)
// @route   POST /api/upload/images
// @access  Private
exports.uploadMultipleBase64Images = async (req, res) => {
  try {
    const { images, folder = 'RealTimeDigitalCanvas' } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    if (images.length > 20) {
      return res.status(400).json({ message: 'Maximum 20 images allowed per request' });
    }

    const uploadPromises = images.map((img, index) =>
      uploadToCloudinary(img.data || img, {
        folder: `${folder}/canvas-images`,
        public_id: img.id ? `img_${img.id}` : `img_${Date.now()}_${index}`,
      }).then(result => ({
        success: true,
        originalId: img.id || index,
        url: result.secure_url,
        publicId: result.public_id,
      })).catch(err => ({
        success: false,
        originalId: img.id || index,
        error: err.message,
      }))
    );

    const results = await Promise.all(uploadPromises);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      uploaded: successful,
      failed: failed,
      totalUploaded: successful.length,
      totalFailed: failed.length,
    });
  } catch (error) {
    console.error('[Upload] Multiple upload error:', error.message);
    res.status(500).json({ message: 'Batch upload failed', error: error.message });
  }
};

// @desc    Upload file via multer (profile picture file upload)
// @route   POST /api/upload/file
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { folder = 'RealTimeDigitalCanvas', type = 'general' } = req.body;

    let uploadFolder = `${folder}/general`;
    if (type === 'profile') uploadFolder = `${folder}/profiles`;
    else if (type === 'chat') uploadFolder = `${folder}/chat-images`;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: uploadFolder,
      resource_type: 'auto',
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('[Upload] File upload error:', error.message);
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// @desc    Upload recording to Cloudinary (video files)
// @route   POST /api/upload/recording
// @access  Private
exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No recording file uploaded' });
    }

    const { meetingId } = req.body;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'RealTimeDigitalCanvas/recordings',
      resource_type: 'video',
      public_id: `recording_${meetingId || 'unknown'}_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('[Upload] Recording upload error:', error.message);
    res.status(500).json({ message: 'Recording upload failed', error: error.message });
  }
};

// @desc    Delete a resource from Cloudinary
// @route   DELETE /api/upload/delete
// @access  Private
exports.deleteUpload = async (req, res) => {
  try {
    const { publicId, resourceType = 'image' } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const result = await deleteFromCloudinary(publicId, resourceType);

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[Upload] Delete error:', error.message);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};
