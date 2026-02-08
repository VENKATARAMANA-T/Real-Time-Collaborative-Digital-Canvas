const mongoose = require('mongoose');

const canvasSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a canvas title'],
    unique: true, // Titles must now be unique across the entire collection
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
  isFavorite: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Canvas', canvasSchema);