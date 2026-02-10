const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
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

  // 🔗 The Canvas being worked on
  canvas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    required: true
  },

  // 👑 The Person who started it
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 👥 Participants Tracking
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

  // 🕒 Time Tracking
  startTime: {
    type: Date,
    default: Date.now
  },
  
  // If endTime exists, the meeting is considered "Ended"
  endTime: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);