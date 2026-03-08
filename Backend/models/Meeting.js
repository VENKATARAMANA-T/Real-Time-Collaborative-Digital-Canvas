const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // 📛 Meeting Name (User-provided)
  name: {
    type: String,
    default: 'Untitled Meeting'
  },

  // 🆔 Unique Identifier (Generated in Route/Controller)
  meetingId: {
    type: String,
    required: true,
    unique: true
  },

  // 🔑 Security (Required)
  password: {
    type: String,
    required: true, 
    select: false // Security: Won't return in queries unless explicitly asked
  },

  // 🔗 The Canvas being worked on (optional for scheduled meetings until host starts)
  canvas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    default: null
  },

  // 👑 The Person who started it
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isChatEnabled: {
    type: Boolean,
    default: true // Chat is ON by default
  },

  isAllMuted: {
    type: Boolean,
    default: false // All participants muted by host
  },

  isAllVideoOff: {
    type: Boolean,
    default: false // All participants video off by host
  },

  isScreenRecordingAllowed: {
    type: Boolean,
    default: false // Screen recording disabled by default, host can enable
  },

  // Path to the recording file on disk (set after upload)
  recordingPath: {
    type: String,
    default: null
  },

  // Who recorded. Stored after recording is uploaded
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Array of all recordings (supports multiple recordings per meeting)
  recordings: [{
    filename: { type: String, required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // � Meeting Status (pending, live, ended)
  status: {
    type: String,
    enum: ['pending', 'live', 'ended'],
    default: 'pending' // Waiting for host to start
  },

  // �👥 Participants Tracking
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    joinTime: {
      type: Date,
      default: Date.now
    },
    leaveTime: {
      type: Date,
      default: null // Null means they are still in the meeting
    },
    canChat: { 
      type: Boolean, 
      default: true // Users can chat by default
    }
  }],
  
  linkToken: {
    type: String,
    unique: true,
    required: true,
    index: true // Faster lookups
  },
  // 🔗 Sharable Link (Generated in Route/Controller)
  shareLink: {
    type: String,
    required: true
  },

  // 🏷️ Whether this is an instant meeting (not shown on dashboard lists)
  isInstant: {
    type: Boolean,
    default: false
  },

  // 🕒 Time Tracking
  startTime: {
    type: Date,
    default: Date.now
  },
  
  // If endTime exists, the meeting is considered "Ended"
  endTime: {
    type: Date,
    default: null
  },

  // 🔗 Meeting canvas share link (set by host after meeting ends)
  sharedCanvasLink: {
    type: String,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);