const Meeting = require('../models/Meeting');
const Canvas = require('../models/Canvas');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Built-in Node module for random passwords

// @desc    Create a Meeting (New or Existing Canvas)
// @route   POST /api/meetings
// @access  Private (Host)
exports.createMeeting = async (req, res) => {
  try {
    const { canvasId, title } = req.body;
    let canvasToUse;

    // 1. Determine Canvas (New vs Existing)
    if (canvasId) {
      // Use Existing: Check ownership
      canvasToUse = await Canvas.findOne({ _id: canvasId, owner: req.user._id });
      if (!canvasToUse) {
        return res.status(404).json({ message: 'Canvas not found or you are not the owner' });
      }
    } else {
      // Create New: "Untitled Meeting Canvas"
      canvasToUse = await Canvas.create({
        title: title || `Meeting Canvas - ${new Date().toLocaleDateString()}`,
        owner: req.user._id,
        data: {},
        folder: null
      });
    }

    // 2. Generate Meeting Credentials
    const meetingId = uuidv4().slice(0, 8); // e.g., "a1b2-c3d4"
    const password = crypto.randomBytes(3).toString('hex'); // e.g., "a7f39b"
    
    // 3. Generate Secure Link Token (URL-Safe replacement for Bcrypt)
    // This creates a long, random string that is impossible to guess
    const linkToken = crypto.randomBytes(32).toString('hex'); 
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // 4. Create Meeting
    const meeting = await Meeting.create({
      meetingId,
      password,
      linkToken, // Store the token
      shareLink: `${clientUrl}/join-link/${linkToken}`, // Link uses the secure token, NOT the ID
      canvas: canvasToUse._id,
      host: req.user._id,
      participants: [],
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      meetingId: meeting.meetingId,
      password: password, // Show this ONCE to the host
      shareLink: meeting.shareLink,
      canvasId: canvasToUse._id
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// @desc    Join Meeting via Share Link (No Password Needed)
// @route   POST /api/meetings/join-link/:token
// @access  Private (User must be logged in to app)
exports.joinMeetingByLink = async (req, res) => {
  try {
    const { token } = req.params; // The secure token from the URL

    // 1. Find Meeting by Secure Token
    const meeting = await Meeting.findOne({ 
      linkToken: token, 
      endTime: null 
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Invalid or expired meeting link' });
    }

    // 2. Logic same as regular Join: Add to participants
    const isHost = meeting.host.toString() === req.user._id.toString();
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isHost && !existingParticipant) {
      meeting.participants.push({
        user: req.user._id,
        permission: 'view', // Default requirement
        joinTime: new Date()
      });
      await meeting.save();
    }else if(!isHost && existingParticipant && existingParticipant.leaveTime){
      // If the user had previously left, we allow them to rejoin by resetting leaveTime
      existingParticipant.permission = 'view'; // Reset to default permission
      existingParticipant.leaveTime = null; // Mark as active again
      await meeting.save();
    }

    // 3. Success
    res.status(200).json({
      success: true,
      canvasId: meeting.canvas,
      role: isHost ? 'host' : 'participant',
      permission: isHost ? 'edit' : (existingParticipant?.permission || 'view')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Join Meeting
// @route   POST /api/meetings/join
// @access  Private (Participant)
exports.joinMeeting = async (req, res) => {
  try {
    const { meetingId, password } = req.body;

    // 1. Find Active Meeting
    // We select '+password' because it's hidden by default in the model
    const meeting = await Meeting.findOne({ 
      meetingId, 
      endTime: null // Must be active
    }).select('+password');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or has ended' });
    }

    // 2. Verify Password
    if (meeting.password !== password) {
      return res.status(401).json({ message: 'Invalid Meeting Password' });
    }

    // 3. Add User to Participants (if not host and not already joined)
    const isHost = meeting.host.toString() === req.user._id.toString();
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isHost && !existingParticipant) {
      meeting.participants.push({
        user: req.user._id,
        permission: 'view', // Default requirement
        joinTime: new Date()
      });
      await meeting.save();
    }else if(!isHost && existingParticipant && existingParticipant.leaveTime){
      // If the user had previously left, we allow them to rejoin by resetting leaveTime
      existingParticipant.permission = 'view'; // Reset to default permission
      existingParticipant.leaveTime = null; // Mark as active again
      await meeting.save();
    }

    // 4. Return Canvas ID (Frontend redirects here)
    res.status(200).json({
      success: true,
      canvasId: meeting.canvas,
      role: isHost ? 'host' : 'participant',
      permission: isHost ? 'edit' : (existingParticipant?.permission || 'view')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    End Meeting
// @route   PUT /api/meetings/:id/end
// @access  Private (Host Only)
exports.endMeeting = async (req, res) => {
  try {
    // Find meeting by ID and ensure Requester is Host
    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      host: req.user._id 
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or authorized' });
    }

    // Mark as ended
    meeting.endTime = new Date();
    meeting.participants.forEach(p => {
      if (!p.leaveTime) {
        p.leaveTime = new Date(); // Mark all active participants as left
      }
    });



    await meeting.save();

    // Canvas is ALREADY saved in owner's collection (Canvas Model), 
    // so no data transfer is needed. It's safe.

    res.status(200).json({ message: 'Meeting ended successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// @desc    Update Participant Permission (e.g., Allow Edit)
// @route   PUT /api/meetings/:id/permissions
// @access  Private (Host Only)
exports.updatePermission = async (req, res) => {
  try {
    const { userId, permission } = req.body; // permission = 'edit' or 'view'

    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      host: req.user._id,
      endTime: null
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Find participant and update
    const participant = meeting.participants.find(
      p => p.user.toString() === userId && p.leaveTime === null 
    );

    if (participant) {
      participant.permission = permission;
      await meeting.save();
      res.status(200).json({ success: true, message: `User set to ${permission}` });
    } else {
      res.status(404).json({ message: 'User not found in this meeting' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};





// @desc    Leave Meeting (Participant)
// @route   PUT /api/meetings/:id/leave
// @access  Private (Participant)
exports.leaveMeeting = async (req, res) => {
  try {
    // Find the meeting by ID (ensure it's active)
    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      endTime: null 
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or already ended' });
    }

    // Find the participant entry for this user
    // We look for the entry where 'leaveTime' is null (currently active)
    const participantIndex = meeting.participants.findIndex(
      (p) => p.user.toString() === req.user._id.toString() && p.leaveTime === null
    );

    if (participantIndex === -1) {

            // If user is the Host, they should use 'End Meeting' instead
        if (meeting.host.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Host cannot leave. End the meeting instead.' });
        }
        
      return res.status(404).json({ message: 'You are not in this meeting' });
    }



    // Mark as left
    meeting.participants[participantIndex].leaveTime = new Date();

    await meeting.save();

    res.status(200).json({ message: 'You have left the meeting' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
