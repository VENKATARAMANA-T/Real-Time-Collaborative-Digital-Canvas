const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a folder name'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  // Direct array of Canvases inside this folder
  canvases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas'
  }],
  // Direct array of Sub-folders inside this folder
  subFolders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  }]
}, { timestamps: true });

// Compound unique: each user can have only one folder with a given name
folderSchema.index({ name: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);