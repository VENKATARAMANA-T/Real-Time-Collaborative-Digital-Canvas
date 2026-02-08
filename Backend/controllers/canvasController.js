const Canvas = require('../models/Canvas.js');
const ActivityLog = require('../models/ActivityLog.js');

// @desc    Create a new blank canvas (Private by default)
// @route   POST /api/canvases
// @access  Private
exports.createCanvas = async (req, res) => {
  try {
    const { title, folderId } = req.body;

    const canvas = new Canvas({
      title: title || 'Untitled Canvas',
      owner: req.user._id, 
      folder: folderId || null,
      data: {}, // Always start blank
      collaborators: [] // Always start private (No meeting yet)
    });

    const createdCanvas = await canvas.save();

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_CANVAS',
      ipAddress: req.ip || '127.0.0.1'
    });

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

    res.status(200).json(canvas);
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

    // Find and Update strictly by Owner
    const canvas = await Canvas.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { 
        $set: { 
          data: data,           // The JSON drawing data 
          thumbnail: thumbnail, // Screenshot/Preview string
          title: title 
        } 
      },
      { new: true } // Return the updated document
    );

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found or access denied' });
    }

    // Log Activity: UPDATE_CANVAS
    // We wrap this in a try-catch so logging failures don't stop the save
    try {
      await ActivityLog.create({
        user: req.user._id,
        action: 'UPDATE_CANVAS',
        ipAddress: req.ip || '127.0.0.1'
      });
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

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_CANVAS',
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(200).json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};