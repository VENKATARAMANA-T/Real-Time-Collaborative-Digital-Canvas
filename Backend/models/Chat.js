const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    unique: true // One chat document per meeting
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Array of message objects
  messages: [{
    username: { type: String, required: true },
    msg: { type: String, required: true },
  }]
}, 
{ timestamps: true }
); // Tracks when the Chat document was created/updated

module.exports = mongoose.model('Chat', chatSchema);