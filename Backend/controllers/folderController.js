const Folder = require('../models/Folder.js');
const Canvas = require('../models/Canvas.js');
const ActivityLog = require('../models/ActivityLog.js');

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // Check if folder with same name already exists for this user
    const existingFolder = await Folder.findOne({ 
      name: name.trim(), 
      owner: req.user._id 
    });

    if (existingFolder) {
      return res.status(400).json({ message: 'Folder with this name already exists' });
    }

    const folder = new Folder({
      name: name.trim(),
      owner: req.user._id
    });

    const createdFolder = await folder.save();

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_FOLDER',
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json(createdFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all folders for current user
// @route   GET /api/folders
// @access  Private
exports.getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single folder by ID
// @route   GET /api/folders/:id
// @access  Private
exports.getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('canvases');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update folder name
// @route   PUT /api/folders/:id
// @access  Private
exports.updateFolder = async (req, res) => {
  try {
    const { name } = req.body;

    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    if (name && name.trim()) {
      folder.name = name.trim();
    }

    const updatedFolder = await folder.save();

    res.status(200).json(updatedFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:id
// @access  Private
exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    // Delete all canvases in this folder
    await Canvas.deleteMany({ folder: folder._id });

    await Folder.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_FOLDER',
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all canvases in a folder
// @route   GET /api/folders/:id/canvases
// @access  Private
exports.getFolderCanvases = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    const canvases = await Canvas.find({
      folder: folder._id,
      owner: req.user._id
    }).sort({ updatedAt: -1 });

    res.status(200).json(canvases);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
