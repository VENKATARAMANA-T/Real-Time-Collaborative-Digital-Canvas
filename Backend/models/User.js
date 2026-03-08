const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address (e.g., youremail@gmail.com)'
    ]
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Still good practice to hide this by default
  },
  profileImage: {
    type: String,
    default: ''
  },
  profileImagePublicId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  activationTokenHash: {
    type: String,
    default: null
  },
  activationTokenExpire: {
    type: Date,
    default: null
  },
  
  refreshTokenHash: {
    type: String,
    default: null
  },

  // Storage for reset flow
  resetPasswordTokenHash: String,
  resetPasswordExpire: Date
}, 
{ timestamps: true }
);

module.exports = mongoose.model('User', userSchema);