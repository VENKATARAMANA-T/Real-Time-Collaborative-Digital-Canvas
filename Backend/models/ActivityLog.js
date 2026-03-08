const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // 🔐 Auth & Profile
      'REGISTER_USER',
      'ACCOUNT_ACTIVATED',
      'LOGIN_SUCCESS',
      'LOGOUT',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_SUCCESS',
      'UPDATE_PROFILE',

      // 📁 Canvas & File Management
      'CREATE_CANVAS',
      'DELETE_CANVAS',
      'RENAME_CANVAS',
      'UPDATE_CANVAS',
      'DUPLICATE_CANVAS',
      'CREATE_FOLDER',
      'DELETE_FOLDER',
      'TOGGLE_FAVORITE',
      'EXPORT_CANVAS',
      'RESTORE_VERSION',

      // ⚡ Collaboration & Help
      'JOIN_ROOM',
      'LEAVE_ROOM',
      'TOGGLE_THEME',
      'VIEW_WALKTHROUGH',
      'SEARCH_HELP',
      'SUBMIT_FEEDBACK',
      'IMPORT_CANVAS'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);