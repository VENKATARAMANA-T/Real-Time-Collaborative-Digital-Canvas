const Canvas = require('../models/Canvas.js');
const ActivityLog = require('../models/ActivityLog.js');
const Meeting = require('../models/Meeting.js');

// @desc    Create a new blank canvas (Private by default)
// @route   POST /api/canvases
// @access  Private
exports.createCanvas = async (req, res) => {
  try {
    const { title, folderId, data, thumbnail } = req.body;
    const safeTitle = title && title.trim().length > 0
      ? title.trim()
      : `Untitled Canvas ${Date.now()}`;

    const canvas = new Canvas({
      title: safeTitle,
      owner: req.user._id,
      folder: folderId || null,
      data: data || {},
      thumbnail: thumbnail || ''
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
    console.log(data, thumbnail, title);
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
      return res.status(200).json(canvas);
    }

    // --- CHECK 2: Are you in an Active Meeting? ---
    // We check the Meeting collection to see if:
    // a) The meeting is for THIS canvas
    // b) The meeting is ACTIVE (endTime is null)
    // c) You are in the participants list AND haven't left
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
      return res.status(200).json(canvas);
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
    // --- PERFORM UPDATE ---
    if (data) canvas.data = data;
    if (thumbnail) canvas.thumbnail = thumbnail;
    if (title) canvas.title = title;

    const updatedCanvas = await canvas.save();

    // No need to log activites in meeting 

    res.status(200).json(updatedCanvas);

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
      await ActivityLog.create({
        user: req.user._id,
        action: 'RENAME_CANVAS',
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
      await ActivityLog.create({
        user: req.user._id,
        action: 'EXPORT_CANVAS',
        ipAddress: req.ip || '127.0.0.1'
      });
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
      await ActivityLog.create({
        user: req.user._id,
        action: 'IMPORT_CANVAS',
        ipAddress: req.ip || '127.0.0.1'
      });
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    res.status(201).json(createdCanvas);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};   