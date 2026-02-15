const Meeting = require('../models/Meeting');
const Canvas = require('../models/Canvas');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Built-in Node module for random passwords

// @desc    Generate Instant Meeting Credentials (No DB creation)
// @route   POST /api/meetings/generate-credentials
// @access  Private (Host)
exports.generateInstantMeetingCredentials = async (req, res) => {
  try {
    // Generate Meeting Credentials (no DB interaction)
    const meetingId = uuidv4().slice(0, 8); // e.g., "a1b2-c3d4"
    const password = crypto.randomBytes(3).toString('hex'); // e.g., "a7f39b"
    const linkToken = crypto.randomBytes(32).toString('hex'); // Generate link token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const shareLink = `${clientUrl}/join-link/${linkToken}`;
    
    res.status(200).json({
      success: true,
      meetingId: meetingId,
      password: password,
      shareLink: shareLink,
      linkToken: linkToken
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create Instant Meeting (Creates meeting with pending status)
// @route   POST /api/meetings/instant
// @access  Private (Host)
exports.createInstantMeeting = async (req, res) => {
  try {
    const { title, meetingId, password } = req.body;

    // 1. Create New Canvas for instant meeting
    const timestamp = Date.now();
    const canvasToUse = await Canvas.create({
      title: title || `Instant Meeting - ${new Date().toLocaleDateString()} (${timestamp})`,
      owner: req.user._id,
      data: {},
      folder: null
    });
    
    // 2. Generate Secure Link Token
    const linkToken = crypto.randomBytes(32).toString('hex'); 
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // 3. Create Meeting with PENDING status using provided credentials
    const meeting = await Meeting.create({
      meetingId,
      password,
      linkToken,
      shareLink: `${clientUrl}/join-link/${linkToken}`,
      canvas: canvasToUse._id,
      host: req.user._id,
      participants: [],
      status: 'pending', // Instant meetings start in pending
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      password: password,
      shareLink: meeting.shareLink,
      canvasId: canvasToUse._id,
      role: 'host',
      permission: 'edit',
      status: meeting.status
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Start Meeting (Host transitions meeting from pending to live)
// @route   PUT /api/meetings/:id/start
// @access  Private (Host Only)
exports.startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      host: req.user._id
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or not authorized' });
    }

    if (meeting.status !== 'pending') {
      return res.status(400).json({ message: 'Meeting is already started or ended' });
    }

    // Transition from pending to live
    meeting.status = 'live';
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting started successfully',
      meetingStatus: 'live'
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

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
      // Create New: "Untitled Meeting Canvas" with unique timestamp
      const timestamp = Date.now();
      canvasToUse = await Canvas.create({
        title: title || `Meeting Canvas - ${new Date().toLocaleDateString()} (${timestamp})`,
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
      status: 'live', // Regular meetings are live immediately
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      password: password, // Show this ONCE to the host
      shareLink: meeting.shareLink,
      canvasId: canvasToUse._id,
      role: 'host',
      permission: 'edit',
      status: meeting.status
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

    // 1. Find Meeting by Secure Token (not ended)
    const meeting = await Meeting.findOne({ 
      linkToken: token,
      status: { $ne: 'ended' } // Only block if meeting has ended
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Invalid, expired, or ended meeting link' });
    }

    // 2. Allow all users (host and non-host) to join as long as meeting is not ended
    const isHost = meeting.host.toString() === req.user._id.toString();

    // 3. Add to participants if not already joined
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!existingParticipant) {
      meeting.participants.push({
        user: req.user._id,
        permission: 'view', // Default permission
        joinTime: new Date()
      });
      await meeting.save();
    } else if (existingParticipant.leaveTime) {
      // If the user had previously left, allow them to rejoin by resetting leaveTime
      existingParticipant.permission = 'view'; // Reset to default permission
      existingParticipant.leaveTime = null; // Mark as active again
      await meeting.save();
    }

    // 4. Success
    res.status(200).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      meetingStatus: meeting.status,
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

    // 1. Find Meeting (status is NOT ended)
    // We select '+password' because it's hidden by default in the model
    const meeting = await Meeting.findOne({ 
      meetingId,
      status: { $ne: 'ended' } // Only block if meeting has ended
    }).select('+password');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or has ended' });
    }

    // 2. Verify Password
    if (meeting.password !== password) {
      return res.status(401).json({ message: 'Invalid Meeting Password' });
    }

    // 3. Allow all users (host and non-host) to join as long as meeting is not ended
    const isHost = meeting.host.toString() === req.user._id.toString();

    // 4. Add User to Participants (if not already joined)
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!existingParticipant) {
      meeting.participants.push({
        user: req.user._id,
        permission: 'view', // Default permission
        joinTime: new Date()
      });
      await meeting.save();
    } else if (existingParticipant.leaveTime) {
      // If the user had previously left, allow them to rejoin by resetting leaveTime
      existingParticipant.permission = 'view'; // Reset to default permission
      existingParticipant.leaveTime = null; // Mark as active again
      await meeting.save();
    }

    // 5. Return Canvas ID (Frontend redirects here)
    res.status(200).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      meetingStatus: meeting.status,
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
      return res.status(404).json({ message: 'Meeting not found or not authorized' });
    }

    // Mark as ended
    meeting.status = 'ended';
    meeting.endTime = new Date();
    meeting.participants.forEach(p => {
      if (!p.leaveTime) {
        p.leaveTime = new Date(); // Mark all active participants as left
      }
    });

    await meeting.save();

    // Canvas is ALREADY saved in owner's collection (Canvas Model), 
    // so no data transfer is needed. It's safe.

    res.status(200).json({ 
      success: true,
      message: 'Meeting ended successfully',
      meetingStatus: 'ended',
      endTime: meeting.endTime
    });

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





// @desc    Get Meeting Details with Participants
// @route   GET /api/meetings/:id
// @access  Private (Host or Participant)
exports.getMeetingDetails = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'username name email')
      .populate('participants.user', 'username name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is host or participant
    const isHost = meeting.host._id.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: 'You do not have access to this meeting' });
    }

    // Format response with host first, then other participants (exclude host from participants list)
    const formattedParticipants = [
      {
        _id: meeting.host._id,
        username: meeting.host.username || meeting.host.name,
        role: 'host',
        isActive: true
      },
      ...meeting.participants
        .filter(p => p.user._id.toString() !== meeting.host._id.toString()) // Exclude host
        .map(p => ({
          _id: p.user._id,
          username: p.user.username || p.user.name,
          role: 'participant',
          permission: p.permission,
          joinTime: p.joinTime,
          leaveTime: p.leaveTime,
          isActive: !p.leaveTime
        }))
    ];

    res.status(200).json({
      success: true,
      meeting: {
        _id: meeting._id,
        meetingId: meeting.meetingId,
        status: meeting.status,
        host: meeting.host,
        participants: formattedParticipants
      }
    });

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
      status: { $in: ['pending', 'live'] } // Can only leave if meeting is pending or live
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
        return res.status(400).json({ message: 'Host cannot leave. Use End Meeting instead.' });
      }
      
      return res.status(404).json({ message: 'You are not in this meeting' });
    }

    // Mark as left with timestamp
    meeting.participants[participantIndex].leaveTime = new Date();

    await meeting.save();

    res.status(200).json({ 
      success: true,
      message: 'You have left the meeting',
      leaveTime: meeting.participants[participantIndex].leaveTime
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
