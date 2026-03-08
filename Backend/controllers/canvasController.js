const Canvas = require('../models/Canvas.js');
const ActivityLog = require('../models/ActivityLog.js');
const Meeting = require('../models/Meeting.js');
const Folder = require('../models/Folder.js');
const crypto = require('crypto');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary.js');

// Helper: Upload images embedded in canvas elements to Cloudinary
const uploadCanvasImagesToCloud = async (elements) => {
  if (!elements || !Array.isArray(elements)) return elements;

  const updatedElements = await Promise.all(
    elements.map(async (el) => {
      // Check if element is an image with base64 data
      if (el.type === 'image' && el.src && el.src.startsWith('data:')) {
        try {
          const result = await uploadToCloudinary(el.src, {
            folder: 'RealTimeDigitalCanvas/canvas-images',
            public_id: `canvas_img_${el.id || Date.now()}`,
          });
          return {
            ...el,
            src: result.secure_url,
            cloudinaryPublicId: result.public_id,
          };
        } catch (err) {
          console.warn('[Canvas] Failed to upload image element:', err.message);
          return el; // Keep original if upload fails
        }
      }
      // Also handle imageData property (some canvas implementations use this)
      if (el.imageData && el.imageData.startsWith('data:')) {
        try {
          const result = await uploadToCloudinary(el.imageData, {
            folder: 'RealTimeDigitalCanvas/canvas-images',
            public_id: `canvas_imgdata_${el.id || Date.now()}`,
          });
          return {
            ...el,
            imageData: result.secure_url,
            cloudinaryPublicId: result.public_id,
          };
        } catch (err) {
          console.warn('[Canvas] Failed to upload imageData element:', err.message);
          return el;
        }
      }
      return el;
    })
  );

  return updatedElements;
};

// Helper: Upload thumbnail and pixel data to Cloudinary
const uploadCanvasMediaToCloud = async (thumbnail, pixelData, canvasId) => {
  const result = { thumbnail: '', thumbnailPublicId: '', pixelDataUrl: '', pixelDataPublicId: '' };

  if (thumbnail && thumbnail.startsWith('data:')) {
    try {
      const thumbResult = await uploadToCloudinary(thumbnail, {
        folder: 'RealTimeDigitalCanvas/thumbnails',
        public_id: `thumb_${canvasId || Date.now()}`,
        overwrite: true,
        transformation: [{ width: 400, height: 200, crop: 'fill', quality: 'auto:low' }],
      });
      result.thumbnail = thumbResult.secure_url;
      result.thumbnailPublicId = thumbResult.public_id;
    } catch (err) {
      console.warn('[Canvas] Thumbnail upload failed:', err.message);
    }
  } else if (thumbnail) {
    result.thumbnail = thumbnail; // Already a URL
  }

  if (pixelData && pixelData.startsWith('data:')) {
    try {
      const pixelResult = await uploadToCloudinary(pixelData, {
        folder: 'RealTimeDigitalCanvas/canvas-data',
        public_id: `pixeldata_${canvasId || Date.now()}`,
        overwrite: true,
      });
      result.pixelDataUrl = pixelResult.secure_url;
      result.pixelDataPublicId = pixelResult.public_id;
    } catch (err) {
      console.warn('[Canvas] Pixel data upload failed:', err.message);
    }
  } else if (pixelData) {
    result.pixelDataUrl = pixelData; // Already a URL
  }

  return result;
};

// @desc    Create a new blank canvas (Private by default)
// @route   POST /api/canvases
// @access  Private
exports.createCanvas = async (req, res) => {
  try {
    const { title, folderId, data, thumbnail } = req.body;
    const safeTitle = title && title.trim().length > 0
      ? title.trim()
      : `Untitled Canvas ${Date.now()}`;

    // Upload images within canvas elements to Cloudinary
    let processedData = data || {};
    if (processedData.elements && Array.isArray(processedData.elements)) {
      processedData.elements = await uploadCanvasImagesToCloud(processedData.elements);
    }

    // Upload thumbnail and pixel data to Cloudinary
    const canvasId = Date.now().toString();
    const mediaResult = await uploadCanvasMediaToCloud(
      thumbnail, processedData.pixelData, canvasId
    );

    // Remove raw pixel data from data object (it's now in Cloudinary)
    if (processedData.pixelData) {
      delete processedData.pixelData;
    }

    const canvas = new Canvas({
      title: safeTitle,
      owner: req.user._id,
      folder: folderId || null,
      data: processedData,
      thumbnail: mediaResult.thumbnail,
      thumbnailPublicId: mediaResult.thumbnailPublicId,
      pixelDataUrl: mediaResult.pixelDataUrl,
      pixelDataPublicId: mediaResult.pixelDataPublicId,
    });

    const createdCanvas = await canvas.save();

    // Log Activity
    const log = await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_CANVAS',
    });
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
    }

    res.status(201).json(createdCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get ALL canvases created by the current user
// @route   GET /api/canvases
// @access  Private
exports.getCanvases = async (req, res) => {
  try {
    // Strictly find canvases where OWNER is the logged-in user
    const canvases = await Canvas.find({ owner: req.user._id })
      .sort({ updatedAt: -1 }); // Show newest first

    res.status(200).json(canvases);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single canvas (Load the board)
// @route   GET /api/canvases/:id
// @access  Private
exports.getCanvasById = async (req, res) => {
  try {
    // Find canvas by ID AND ensure the owner is the current user
    const canvas = await Canvas.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Include pixelDataUrl in the response data for frontend to load
    const responseCanvas = canvas.toObject();
    if (responseCanvas.pixelDataUrl) {
      if (!responseCanvas.data) responseCanvas.data = {};
      responseCanvas.data.pixelData = responseCanvas.pixelDataUrl;
    }

    res.status(200).json(responseCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update/Save canvas drawing data
// @route   PUT /api/canvases/:id
// @access  Private
exports.updateCanvas = async (req, res) => {
  try {
    const { data, thumbnail, title } = req.body;

    // Process canvas images - upload base64 images to Cloudinary
    let processedData = data;
    if (processedData && processedData.elements && Array.isArray(processedData.elements)) {
      processedData = { ...processedData };
      processedData.elements = await uploadCanvasImagesToCloud(processedData.elements);
    }

    // Upload thumbnail and pixel data to Cloudinary
    const mediaResult = await uploadCanvasMediaToCloud(
      thumbnail, processedData?.pixelData, req.params.id
    );

    // Remove raw pixel data from data object
    if (processedData && processedData.pixelData) {
      processedData = { ...processedData };
      delete processedData.pixelData;
    }

    // Delete old thumbnail/pixel data from Cloudinary
    const existingCanvas = await Canvas.findOne({ _id: req.params.id, owner: req.user._id });
    if (existingCanvas) {
      if (existingCanvas.thumbnailPublicId && mediaResult.thumbnailPublicId) {
        try { await deleteFromCloudinary(existingCanvas.thumbnailPublicId); } catch (e) { /* ignore */ }
      }
      if (existingCanvas.pixelDataPublicId && mediaResult.pixelDataPublicId) {
        try { await deleteFromCloudinary(existingCanvas.pixelDataPublicId); } catch (e) { /* ignore */ }
      }
    }

    // Find and Update strictly by Owner
    const canvas = await Canvas.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        $set: {
          data: processedData,
          thumbnail: mediaResult.thumbnail || (existingCanvas?.thumbnail || ''),
          thumbnailPublicId: mediaResult.thumbnailPublicId || (existingCanvas?.thumbnailPublicId || ''),
          pixelDataUrl: mediaResult.pixelDataUrl || (existingCanvas?.pixelDataUrl || ''),
          pixelDataPublicId: mediaResult.pixelDataPublicId || (existingCanvas?.pixelDataPublicId || ''),
          title: title
        }
      },
      { new: true } // Return the updated document
    );

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Log Activity: UPDATE_CANVAS
    try {
      const log = await ActivityLog.create({
        user: req.user._id,
        action: 'UPDATE_CANVAS',
      });
      if (req.app && req.app.get('io')) {
        req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
      }
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    res.status(200).json(canvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a canvas
// @route   DELETE /api/canvases/:id
// @access  Private
exports.deleteCanvas = async (req, res) => {
  try {
    const canvas = await Canvas.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Clean up Cloudinary resources
    const cleanupPromises = [];
    if (canvas.thumbnailPublicId) {
      cleanupPromises.push(deleteFromCloudinary(canvas.thumbnailPublicId).catch(() => {}));
    }
    if (canvas.pixelDataPublicId) {
      cleanupPromises.push(deleteFromCloudinary(canvas.pixelDataPublicId).catch(() => {}));
    }
    // Clean up image elements stored in Cloudinary
    if (canvas.data?.elements && Array.isArray(canvas.data.elements)) {
      canvas.data.elements.forEach(el => {
        if (el.cloudinaryPublicId) {
          cleanupPromises.push(deleteFromCloudinary(el.cloudinaryPublicId).catch(() => {}));
        }
      });
    }
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
    }

    // Log Activity
    const log = await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_CANVAS',
    });
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
    }
    res.status(200).json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// for meeting

// =============================================================================
// 2. UNIFIED OPERATIONS (Private Owner + Meeting Participants)
// =============================================================================

// @desc    Get a single canvas (Load the board)
// @route   GET /api/canvases/meetingCanvas/:id
// @access  Private (Owner OR Active Meeting Participant)
exports.getMeetingCanvasById = async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id)
      .populate('owner', 'username email');

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    // --- CHECK 1: Are you the Owner? ---
    if (canvas.owner._id.toString() === req.user._id.toString()) {
      const responseCanvas = canvas.toObject();
      if (responseCanvas.pixelDataUrl) {
        if (!responseCanvas.data) responseCanvas.data = {};
        responseCanvas.data.pixelData = responseCanvas.pixelDataUrl;
      }
      return res.status(200).json(responseCanvas);
    }

    // --- CHECK 2: Are you in an Active Meeting? ---
    const activeMeeting = await Meeting.findOne({
      canvas: canvas._id,
      endTime: null,
      participants: {
        $elemMatch: {
          user: req.user._id,
          leaveTime: null
        }
      }
    });

    if (activeMeeting) {
      const responseCanvas = canvas.toObject();
      if (responseCanvas.pixelDataUrl) {
        if (!responseCanvas.data) responseCanvas.data = {};
        responseCanvas.data.pixelData = responseCanvas.pixelDataUrl;
      }
      return res.status(200).json(responseCanvas);
    }

    // If neither, access denied
    return res.status(403).json({ message: 'Access denied. You are not the owner or in an active meeting.' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update/Save canvas drawing data
// @route   PUT /api/canvases/meetingCanvas/:id
// @access  Private (Owner OR Editor Participant)
exports.updateMeetingCanvas = async (req, res) => {
  try {

    const canvas = await Canvas.findById(req.params.id);

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    let hasPermission = false;

    // --- CHECK 1: Are you the Owner? ---
    if (canvas.owner.toString() === req.user._id.toString()) {
      hasPermission = true;
    } else {
      // --- CHECK 2: Are you an Editor in an Active Meeting? ---
      const activeMeeting = await Meeting.findOne({
        canvas: canvas._id,
        endTime: null,
        participants: {
          $elemMatch: {
            user: req.user._id,
            leaveTime: null,
            permission: 'edit' // <--- MUST have edit permission
          }
        }
      });

      if (activeMeeting) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to edit this canvas.' });
    }
    const { data, thumbnail, title } = req.body;

    // Process canvas images - upload base64 images to Cloudinary
    let processedData = data;
    if (processedData && processedData.elements && Array.isArray(processedData.elements)) {
      processedData = { ...processedData };
      processedData.elements = await uploadCanvasImagesToCloud(processedData.elements);
    }

    // Upload thumbnail and pixel data to Cloudinary
    const mediaResult = await uploadCanvasMediaToCloud(
      thumbnail, processedData?.pixelData, req.params.id
    );

    // Remove raw pixel data from data object
    if (processedData && processedData.pixelData) {
      processedData = { ...processedData };
      delete processedData.pixelData;
    }

    // --- PERFORM UPDATE ---
    if (processedData) canvas.data = processedData;
    if (mediaResult.thumbnail) {
      // Clean up old thumbnail
      if (canvas.thumbnailPublicId) {
        try { await deleteFromCloudinary(canvas.thumbnailPublicId); } catch (e) { /* ignore */ }
      }
      canvas.thumbnail = mediaResult.thumbnail;
      canvas.thumbnailPublicId = mediaResult.thumbnailPublicId;
    }
    if (mediaResult.pixelDataUrl) {
      // Clean up old pixel data
      if (canvas.pixelDataPublicId) {
        try { await deleteFromCloudinary(canvas.pixelDataPublicId); } catch (e) { /* ignore */ }
      }
      canvas.pixelDataUrl = mediaResult.pixelDataUrl;
      canvas.pixelDataPublicId = mediaResult.pixelDataPublicId;
    }
    if (title) canvas.title = title;

    const updatedCanvas = await canvas.save();

    res.status(200).json(updatedCanvas);

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Duplicate a canvas
// @route   POST /api/canvases/:id/duplicate
// @access  Private
exports.duplicateCanvas = async (req, res) => {
  try {
    // Find the original canvas
    const originalCanvas = await Canvas.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!originalCanvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Create a new canvas with duplicated data
    const duplicatedTitle = `${originalCanvas.title}_duplicate`;
    const duplicatedData = JSON.parse(JSON.stringify(originalCanvas.data)); // Deep copy

    const newCanvas = new Canvas({
      title: duplicatedTitle,
      owner: req.user._id,
      folder: originalCanvas.folder,
      data: duplicatedData,
      thumbnail: originalCanvas.thumbnail,
      pixelDataUrl: originalCanvas.pixelDataUrl || '',
      // Don't copy publicIds – re-upload to give the duplicate its own Cloudinary copies
    });

    let savedCanvas = await newCanvas.save();

    // Re-upload thumbnail & pixelData so each canvas owns its own Cloudinary resources
    try {
      if (originalCanvas.thumbnail) {
        const thumbResult = await uploadToCloudinary(originalCanvas.thumbnail, {
          folder: 'RealTimeDigitalCanvas/thumbnails',
          public_id: `canvas_${savedCanvas._id}_thumb`,
          overwrite: true,
          transformation: [{ width: 400, height: 300, crop: 'limit', quality: 'auto' }],
        });
        savedCanvas.thumbnail = thumbResult.secure_url;
        savedCanvas.thumbnailPublicId = thumbResult.public_id;
      }
      if (originalCanvas.pixelDataUrl) {
        const pixelResult = await uploadToCloudinary(originalCanvas.pixelDataUrl, {
          folder: 'RealTimeDigitalCanvas/canvas-data',
          public_id: `canvas_${savedCanvas._id}_pixels`,
          overwrite: true,
        });
        savedCanvas.pixelDataUrl = pixelResult.secure_url;
        savedCanvas.pixelDataPublicId = pixelResult.public_id;
      }
      savedCanvas = await savedCanvas.save();
    } catch (uploadErr) {
      console.error('Duplicate canvas: cloud re-upload failed, using shared URLs', uploadErr.message);
    }

    // Log Activity
    const log = await ActivityLog.create({
      user: req.user._id,
      action: 'DUPLICATE_CANVAS',
    });
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
    }

    res.status(201).json(savedCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};



// need to update thumbnail

// @desc    Rename a canvas
// @route   PATCH /api/canvases/:id/rename
// @access  Private
exports.renameCanvas = async (req, res) => {
  try {
    const { title } = req.body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a valid canvas title' });
    }

    // Find and update canvas strictly by owner
    const canvas = await Canvas.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: { title: title.trim() } },
      { new: true }
    );

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Log Activity
    try {
      const log = await ActivityLog.create({
        user: req.user._id,
        action: 'RENAME_CANVAS',
      });
      if (req.app && req.app.get('io')) {
        req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
      }
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    res.status(200).json(canvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Export a canvas as JSON
// @route   GET /api/canvases/:id/export
// @access  Private
exports.exportCanvas = async (req, res) => {
  try {
    // Find canvas by ID and ensure the owner is the current user
    const canvas = await Canvas.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).lean();

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Prepare export data
    const exportData = {
      title: canvas.title,
      data: canvas.data,
      thumbnail: canvas.thumbnail,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Log Activity
    try {
      const log = await ActivityLog.create({
        user: req.user._id,
        action: 'EXPORT_CANVAS',
      });
      if (req.app && req.app.get('io')) {
        req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
      }
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    // Set headers for file download
    const filename = `${canvas.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Import a canvas from JSON file
// @route   POST /api/canvases/import
// @access  Private
exports.importCanvas = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a JSON file' });
    }

    // Parse JSON from buffer
    let importData;
    try {
      const fileContent = req.file.buffer.toString('utf8');
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON file format' });
    }

    // Validate imported data structure
    if (!importData.data || typeof importData.data !== 'object') {
      return res.status(400).json({ message: 'Invalid canvas data structure' });
    }

    // Create new canvas with imported data
    const canvas = new Canvas({
      title: importData.title || `Imported Canvas ${Date.now()}`,
      owner: req.user._id,
      folder: req.body.folderId || null,
      data: importData.data,
      thumbnail: importData.thumbnail || ''
    });

    const createdCanvas = await canvas.save();

    // Log Activity
    try {
      const log = await ActivityLog.create({
        user: req.user._id,
        action: 'IMPORT_CANVAS',
      });
      if (req.app && req.app.get('io')) {
        req.app.get('io').to(req.user._id.toString()).emit('activity_update', { userId: req.user._id, log });
      }
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    res.status(201).json(createdCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};   

// @desc    Generate a share token for a canvas
// @route   POST /api/canvases/:id/share
// @access  Private (owner only)
exports.generateShareToken = async (req, res) => {
  try {
    const canvas = await Canvas.findOne({ _id: req.params.id, owner: req.user._id });
    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Generate token if not already present
    if (!canvas.shareToken) {
      canvas.shareToken = crypto.randomBytes(32).toString('hex');
      await canvas.save();
    }

    res.status(200).json({ shareToken: canvas.shareToken });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get shared canvas by share token (read-only, any authenticated user)
// @route   GET /api/canvases/shared/:shareToken
// @access  Private (any authenticated user)
exports.getSharedCanvas = async (req, res) => {
  try {
    const canvas = await Canvas.findOne({ shareToken: req.params.shareToken })
      .populate('owner', 'name email');

    if (!canvas) {
      return res.status(404).json({ message: 'Shared canvas not found or link is invalid' });
    }

    // Return canvas data for read-only viewing
    const responseCanvas = canvas.toObject();
    if (responseCanvas.pixelDataUrl) {
      if (!responseCanvas.data) responseCanvas.data = {};
      responseCanvas.data.pixelData = responseCanvas.pixelDataUrl;
    }

    res.status(200).json(responseCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Clone a shared canvas into the current user's Personal Sketches folder
// @route   POST /api/canvases/shared/:shareToken/clone
// @access  Private (any authenticated user)
exports.cloneSharedCanvas = async (req, res) => {
  try {
    const originalCanvas = await Canvas.findOne({ shareToken: req.params.shareToken });
    if (!originalCanvas) {
      return res.status(404).json({ message: 'Shared canvas not found or link is invalid' });
    }

    // Find or create "Personal Sketches" folder for this user
    let folder = await Folder.findOne({ name: 'Personal Sketches', owner: req.user._id });
    if (!folder) {
      folder = await Folder.create({ name: 'Personal Sketches', owner: req.user._id });
    }

    // Deep clone canvas data
    const clonedData = JSON.parse(JSON.stringify(originalCanvas.data || {}));

    const newCanvas = new Canvas({
      title: originalCanvas.title,
      owner: req.user._id,
      folder: folder._id,
      data: clonedData,
      thumbnail: originalCanvas.thumbnail || '',
      pixelDataUrl: originalCanvas.pixelDataUrl || '',
      isMeetingCanvas: originalCanvas.isMeetingCanvas || false,
    });

    const savedCanvas = await newCanvas.save();

    // Add canvas to folder
    folder.canvases.push(savedCanvas._id);
    await folder.save();

    // Log activity
    try {
      await ActivityLog.create({ user: req.user._id, action: 'CREATE_CANVAS' });
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    res.status(201).json(savedCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};