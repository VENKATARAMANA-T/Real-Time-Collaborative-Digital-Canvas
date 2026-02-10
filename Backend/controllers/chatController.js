const Chat = require('../models/Chat');
const Meeting = require('../models/Meeting');

// @desc    Get Chat History
// @route   GET /api/chat/:meetingId
// @access  Private (Participant)
exports.getChatHistory = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // 1. Verify Access (User must be in meeting)
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const isHost = meeting.host.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.leaveTime === null
    );

    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // 2. Fetch Chat Document
    let chat = await Chat.findOne({ meetingId });

    // If no chat history exists yet, return a default structure
    if (!chat) {
      return res.status(200).json({ 
        meetingId, 
        hostId: meeting.host, 
        messages: [] 
      });
    }

    res.status(200).json(chat);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Global Chat (Host Only)
// @route   PUT /api/chat/:meetingId/toggle-global
// @access  Private (Host)
exports.toggleGlobalChat = async (req, res) => {
  try {
    const { isEnabled } = req.body; 
    
    // Update the MEETING model (Permission Source of Truth)
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.meetingId, host: req.user._id },
      { isChatEnabled: isEnabled },
      { new: true }
    );

    if (!meeting) return res.status(404).json({ message: 'Meeting not found or unauthorized' });

    res.status(200).json({ 
      success: true, 
      message: `Chat ${isEnabled ? 'enabled' : 'disabled'}`,
      isChatEnabled: meeting.isChatEnabled
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Individual User Chat (Host Only)
// @route   PUT /api/chat/:meetingId/toggle-user
// @access  Private (Host)
exports.toggleUserChat = async (req, res) => {
  try {
    const { userId, canChat } = req.body;

    const meeting = await Meeting.findOne({ 
      _id: req.params.meetingId, 
      host: req.user._id 
    });

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const participant = meeting.participants.find(p => p.user.toString() === userId);
    
    if (participant) {
      participant.canChat = canChat;
      await meeting.save();
      res.status(200).json({ success: true, message: `User chat permission updated` });
    } else {
      res.status(404).json({ message: 'User not found in meeting' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// meeting should be active during this time 

