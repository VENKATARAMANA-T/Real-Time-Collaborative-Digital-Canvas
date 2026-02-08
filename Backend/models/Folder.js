const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a folder name'],
    unique: true, // Folder names must now be unique
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Folder', folderSchema);