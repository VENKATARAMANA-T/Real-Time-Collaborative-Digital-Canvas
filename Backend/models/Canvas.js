const mongoose = require('mongoose');

const canvasSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a canvas title'],
    trim: true,
    default: 'Untitled Canvas'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  data: {
    type: Object,
    default: {}
  },
  thumbnail: {
    type: String,
    default: ''
  },
  thumbnailPublicId: {
    type: String,
    default: ''
  },
  pixelDataUrl: {
    type: String,
    default: ''
  },
  pixelDataPublicId: {
    type: String,
    default: ''
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isMeetingCanvas: {
    type: Boolean,
    default: false
  },
  versions: [{
    data: Object,
    timestamp: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  lastSyncedAt: {
    type: Date,
    default: null
  },
  backupUrl: {
    type: String,
    default: ''
  },
  backupPublicId: {
    type: String,
    default: ''
  },
  drawingActions: [{
    action: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Canvas', canvasSchema);