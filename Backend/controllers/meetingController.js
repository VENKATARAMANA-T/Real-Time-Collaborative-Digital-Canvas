const Meeting = require('../models/Meeting');
const Canvas = require('../models/Canvas');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Built-in Node module for random passwords
const { uploadToCloudinary, uploadBufferToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper: Check if user is already in an active (live) meeting
const checkUserInActiveMeeting = async (userId, excludeMeetingId = null) => {
  const query = {
    status: 'live',
    $or: [
      { host: userId },
      { 'participants.user': userId, 'participants.leaveTime': null }
    ]
  };
  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }
  const activeMeeting = await Meeting.findOne(query).select('meetingId name').lean();
  return activeMeeting;
};

// @desc    Get all meetings for the logged-in user (as host or participant)
// @route   GET /api/meetings
// @access  Private
exports.getUserMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('[getUserMeetings] Fetching meetings for user:', userId.toString());

    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ]
    })
      .populate('host', 'username email')
      .select('+password')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[getUserMeetings] Total meetings found:', meetings.length, '| Statuses:', meetings.map(m => m.status));

    // Categorize meetings into active / upcoming / ended
    // Instant meetings are excluded from active and upcoming lists
    const now = new Date();
    const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const active = [];
    const upcoming = [];
    const ended = [];

    for (const m of meetings) {
      const isHost = m.host._id.toString() === userId.toString();
      const item = {
        _id: m._id,
        name: m.name || 'Untitled Meeting',
        meetingId: m.meetingId,
        password: isHost ? m.password : undefined,
        shareLink: m.shareLink || undefined,
        status: m.status,
        host: m.host,
        participantCount: (m.participants || []).length,
        participants: (m.participants || []).map(p => ({
          user: p.user,
          joinTime: p.joinTime,
          leaveTime: p.leaveTime
        })),
        startTime: m.startTime,
        endTime: m.endTime,
        createdAt: m.createdAt,
        isHost,
        isInstant: !!m.isInstant,
        hasRecording: !!m.recordingPath
      };

      if (m.status === 'ended') {
        ended.push(item);
      } else if (m.isInstant) {
        // Instant meetings are not shown in dashboard lists
        continue;
      } else if (m.status === 'live' || (m.startTime && new Date(m.startTime) <= fiveMinFromNow)) {
        // Live meetings or scheduled meetings within 5 min → active
        active.push(item);
      } else {
        // Scheduled meetings more than 5 min away → upcoming
        upcoming.push(item);
      }
    }

    console.log('[getUserMeetings] Returning => active:', active.length, 'upcoming:', upcoming.length, 'ended:', ended.length);
    res.status(200).json({ success: true, active, upcoming, ended });
  } catch (error) {
    console.error('[getUserMeetings] ERROR:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Generate Instant Meeting Credentials (No DB creation)
// @route   POST /api/meetings/generate-credentials
// @access  Private (Host)
exports.generateInstantMeetingCredentials = async (req, res) => {
  try {
    // Generate Meeting Credentials (no DB interaction)
    const meetingId = uuidv4().slice(0, 8); // e.g., "a1b2-c3d4"
    const password = crypto.randomBytes(3).toString('hex'); // e.g., "a7f39b"
    const linkToken = crypto.randomBytes(32).toString('hex'); // Generate link token
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareLink = `${clientUrl}/#/join-link/${linkToken}`;
    
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
    const { title, meetingId, password, name, linkToken: providedLinkToken } = req.body;

    // Check if user is already in an active meeting
    const existingMeeting = await checkUserInActiveMeeting(req.user._id);
    if (existingMeeting) {
      return res.status(409).json({ message: `You are already in an active meeting (${existingMeeting.meetingId}). Please leave it before starting a new one.` });
    }

    const meetingName = name && name.trim() ? name.trim() : 'Untitled Meeting';

    // 1. Create New Canvas for instant meeting
    const timestamp = Date.now();
    const canvasToUse = await Canvas.create({
      title: title || meetingName || `Instant Meeting - ${new Date().toLocaleDateString()} (${timestamp})`,
      owner: req.user._id,
      data: {},
      folder: null,
      isMeetingCanvas: true
    });
    
    // 2. Reuse the linkToken from generateCredentials if provided, otherwise generate a new one
    const linkToken = providedLinkToken || crypto.randomBytes(32).toString('hex'); 
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 3. Create Meeting with LIVE status (instant meetings go live immediately)
    const meeting = await Meeting.create({
      name: meetingName,
      meetingId,
      password,
      linkToken,
      shareLink: `${clientUrl}/#/join-link/${linkToken}`,
      canvas: canvasToUse._id,
      host: req.user._id,
      participants: [],
      status: 'live',
      isInstant: true,
      startTime: new Date()
    });

    res.status(201).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      meetingName: meetingName,
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

    // Check if host is already in another active meeting
    const existingMeeting = await checkUserInActiveMeeting(req.user._id, meeting._id);
    if (existingMeeting) {
      return res.status(409).json({ message: `You are already in an active meeting (${existingMeeting.meetingId}). Please leave it before starting this one.` });
    }

    // If no canvas yet (scheduled meetings), create one now
    if (!meeting.canvas) {
      const canvasToUse = await Canvas.create({
        title: meeting.name || `Meeting Canvas - ${new Date().toLocaleDateString()}`,
        owner: req.user._id,
        data: {},
        folder: null,
        isMeetingCanvas: true
      });
      meeting.canvas = canvasToUse._id;
    }

    // Transition from pending to live
    meeting.status = 'live';
    await meeting.save();

    // Notify all participants' dashboards that this meeting is now live
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      // Notify the host's own dashboard
      io.to(req.user._id.toString()).emit('meeting_update', { type: 'started', meetingId: meeting._id });
      // Notify each participant's dashboard
      for (const p of meeting.participants) {
        if (p.user) {
          io.to(p.user.toString()).emit('meeting_update', { type: 'started', meetingId: meeting._id });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Meeting started successfully',
      meetingStatus: 'live',
      canvasId: meeting.canvas
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
    const { canvasId, title, name, scheduledDate, scheduledTime } = req.body;
    const meetingName = name && name.trim() ? name.trim() : 'Untitled Meeting';
    const isScheduled = scheduledDate && scheduledTime;

    // For non-scheduled (live) meetings, check if user is already in an active meeting
    if (!isScheduled) {
      const existingMeeting = await checkUserInActiveMeeting(req.user._id);
      if (existingMeeting) {
        return res.status(409).json({ message: `You are already in an active meeting (${existingMeeting.meetingId}). Please leave it before creating a new one.` });
      }
    }
    let canvasToUse = null;

    // 1. Determine Canvas — only create now for NON-scheduled (live) meetings
    //    Scheduled meetings get their canvas when the host starts/joins.
    if (!isScheduled) {
      if (canvasId) {
        canvasToUse = await Canvas.findOne({ _id: canvasId, owner: req.user._id });
        if (!canvasToUse) {
          return res.status(404).json({ message: 'Canvas not found or you are not the owner' });
        }
      } else {
        const timestamp = Date.now();
        canvasToUse = await Canvas.create({
          title: title || meetingName || `Meeting Canvas - ${new Date().toLocaleDateString()} (${timestamp})`,
          owner: req.user._id,
          data: {},
          folder: null,
          isMeetingCanvas: true
        });
      }
    }

    // 2. Generate Meeting Credentials
    const meetingId = uuidv4().slice(0, 8);
    const password = crypto.randomBytes(3).toString('hex');
    
    // 3. Generate Secure Link Token
    const linkToken = crypto.randomBytes(32).toString('hex'); 
    const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 4. Determine status and start time
    let meetingStatus = 'live';
    let startTime = new Date();
    if (isScheduled) {
      meetingStatus = 'pending';
      startTime = req.body.scheduledISO
        ? new Date(req.body.scheduledISO)
        : new Date(`${scheduledDate}T${scheduledTime}`);
    }

    // 5. Create Meeting (canvas may be null for scheduled meetings)
    const meeting = await Meeting.create({
      name: meetingName,
      meetingId,
      password,
      linkToken,
      shareLink: `${clientUrl}/#/join-link/${linkToken}`,
      canvas: canvasToUse ? canvasToUse._id : null,
      host: req.user._id,
      participants: [],
      status: meetingStatus,
      startTime
    });

    // Emit real-time meeting update
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('meeting_update', { type: 'created', meeting: { _id: meeting._id, name: meetingName, meetingId: meeting.meetingId, status: meeting.status, startTime: meeting.startTime, createdAt: meeting.createdAt } });
    }

    res.status(201).json({
      success: true,
      meetingDbId: meeting._id,
      meetingId: meeting.meetingId,
      meetingName: meetingName,
      password: password,
      shareLink: meeting.shareLink,
      canvasId: canvasToUse ? canvasToUse._id : null,
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

    // 2.5 Non-host users can only join after the host has started the meeting
    if (!isHost && meeting.status === 'pending') {
      return res.status(403).json({ message: 'The host has not started this meeting yet. Please wait for the host to start.' });
    }

    // 2.6 Check if user is already in another active meeting
    const existingActiveMeeting = await checkUserInActiveMeeting(req.user._id, meeting._id);
    if (existingActiveMeeting) {
      return res.status(409).json({ message: `You are already in an active meeting (${existingActiveMeeting.meetingId}). Please leave it before joining another.` });
    }

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

    // 3.5 Non-host users can only join after the host has started the meeting
    if (!isHost && meeting.status === 'pending') {
      return res.status(403).json({ message: 'The host has not started this meeting yet. Please wait for the host to start.' });
    }

    // 3.6 Check if user is already in another active meeting
    const existingActiveMeeting = await checkUserInActiveMeeting(req.user._id, meeting._id);
    if (existingActiveMeeting) {
      return res.status(409).json({ message: `You are already in an active meeting (${existingActiveMeeting.meetingId}). Please leave it before joining another.` });
    }

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
    const { elements } = req.body; // Canvas elements sent from the frontend
    console.log('[endMeeting] Attempting to end meeting:', req.params.id, 'by host:', req.user._id.toString());

    // Find meeting by ID and ensure Requester is Host
    const meeting = await Meeting.findOne({ 
      _id: req.params.id, 
      host: req.user._id 
    }).populate('participants.user', '_id username');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or not authorized' });
    }

    // 1. Save the final canvas state to the host's canvas
    // Upload any base64 images in elements to Cloudinary first
    const hostCanvas = await Canvas.findById(meeting.canvas);
    if (hostCanvas && elements) {
      let processedElements = elements;
      if (Array.isArray(elements)) {
        processedElements = await Promise.all(
          elements.map(async (el) => {
            // Upload image elements with base64 data to Cloudinary
            if (el.type === 'image' && el.src && el.src.startsWith('data:')) {
              try {
                const result = await uploadToCloudinary(el.src, {
                  folder: 'RealTimeDigitalCanvas/canvas-images',
                  public_id: `meeting_img_${el.id || Date.now()}`,
                });
                return { ...el, src: result.secure_url, cloudinaryPublicId: result.public_id };
              } catch (err) {
                console.warn('[endMeeting] Image upload failed:', err.message);
                return el;
              }
            }
            if (el.imageData && el.imageData.startsWith('data:')) {
              try {
                const result = await uploadToCloudinary(el.imageData, {
                  folder: 'RealTimeDigitalCanvas/canvas-images',
                  public_id: `meeting_imgdata_${el.id || Date.now()}`,
                });
                return { ...el, imageData: result.secure_url, cloudinaryPublicId: result.public_id };
              } catch (err) {
                console.warn('[endMeeting] ImageData upload failed:', err.message);
                return el;
              }
            }
            return el;
          })
        );
      }
      hostCanvas.data = { elements: processedElements };
      await hostCanvas.save();
    }

    // 2. Extract participant IDs for socket notifications
    const participantUserIds = meeting.participants
      .map(p => p.user?._id || p.user)
      .filter(uid => uid && uid.toString() !== req.user._id.toString());

    // Remove duplicate user IDs (a user may have joined/left multiple times)
    const uniqueParticipantIds = [...new Set(participantUserIds.map(id => id.toString()))];

    // 3. Mark meeting as ended
    meeting.status = 'ended';
    meeting.endTime = new Date();
    meeting.participants.forEach(p => {
      if (!p.leaveTime) {
        p.leaveTime = new Date();
      }
    });

    await meeting.save();
    console.log('[endMeeting] Meeting saved with status:', meeting.status, '| endTime:', meeting.endTime, '| Unique participants:', uniqueParticipantIds);

    // Emit real-time meeting update to ALL participants (host + members)
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      const meetingUpdatePayload = { type: 'ended', meeting: { _id: meeting._id, meetingId: meeting.meetingId, status: 'ended', endTime: meeting.endTime } };

      // Notify the host
      io.to(req.user._id.toString()).emit('meeting_update', meetingUpdatePayload);

      // Notify every participant (their personal user room on Dashboard)
      for (const uid of uniqueParticipantIds) {
        io.to(uid).emit('meeting_update', meetingUpdatePayload);
      }
    }

    console.log('[endMeeting] Success response sent for meeting:', meeting.meetingId);
    res.status(200).json({ 
      success: true,
      message: 'Meeting ended successfully',
      meetingStatus: 'ended',
      endTime: meeting.endTime
    });

  } catch (error) {
    console.error('[endMeeting] ERROR:', error.message);
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





// @desc    Update Host Settings (Mute All, Video Off All, Chat Toggle)
// @route   PUT /api/meetings/:id/host-settings
// @access  Private (Host Only)
exports.updateHostSettings = async (req, res) => {
  try {
    const { isAllMuted, isAllVideoOff, isChatEnabled, isScreenRecordingAllowed } = req.body;

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      host: req.user._id,
      status: { $in: ['pending', 'live'] }
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found or not authorized' });
    }

    // Update only the fields that were sent
    if (typeof isAllMuted === 'boolean') meeting.isAllMuted = isAllMuted;
    if (typeof isAllVideoOff === 'boolean') meeting.isAllVideoOff = isAllVideoOff;
    if (typeof isChatEnabled === 'boolean') meeting.isChatEnabled = isChatEnabled;
    if (typeof isScreenRecordingAllowed === 'boolean') meeting.isScreenRecordingAllowed = isScreenRecordingAllowed;

    await meeting.save();

    // Build the settings object with ONLY the changed fields to broadcast
    const changedSettings = {};
    if (typeof isAllMuted === 'boolean') changedSettings.isAllMuted = isAllMuted;
    if (typeof isAllVideoOff === 'boolean') changedSettings.isAllVideoOff = isAllVideoOff;
    if (typeof isChatEnabled === 'boolean') changedSettings.isChatEnabled = isChatEnabled;
    if (typeof isScreenRecordingAllowed === 'boolean') changedSettings.isScreenRecordingAllowed = isScreenRecordingAllowed;

    const hostSettings = {
      isAllMuted: meeting.isAllMuted,
      isAllVideoOff: meeting.isAllVideoOff,
      isChatEnabled: meeting.isChatEnabled,
      isScreenRecordingAllowed: meeting.isScreenRecordingAllowed
    };

    // Emit real-time update to all participants via socket (only changed fields)
    if (req.app && req.app.get('io')) {
      req.app.get('io').to(meeting.meetingId).emit('host_settings_updated', changedSettings);
    }

    res.status(200).json({
      success: true,
      message: 'Host settings updated',
      hostSettings
    });

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
      .select('+password')
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
        participants: formattedParticipants,
        password: isHost ? meeting.password : undefined,
        shareLink: meeting.shareLink || undefined,
        hostSettings: {
          isAllMuted: meeting.isAllMuted ?? false,
          isAllVideoOff: meeting.isAllVideoOff ?? false,
          isChatEnabled: meeting.isChatEnabled ?? true,
          isScreenRecordingAllowed: meeting.isScreenRecordingAllowed ?? false
        },
        recordingPath: meeting.recordingPath || null,
        sharedCanvasLink: meeting.sharedCanvasLink || null
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
// @desc    Upload Meeting Recording
// @route   POST /api/meetings/:id/recording
// @access  Private (Participant who recorded)
exports.uploadRecording = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is host or participant
    const isHost = meeting.host.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No recording file uploaded' });
    }

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`[uploadRecording] File received: ${req.file.originalname}, size: ${fileSizeMB}MB, mimetype: ${req.file.mimetype}`);

    // Upload recording to Cloudinary
    const publicId = `recording_${req.params.id}_${Date.now()}`;

    console.log(`[uploadRecording] Uploading to Cloudinary (${fileSizeMB}MB)...`);

    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, {
      resource_type: 'auto',
      folder: 'RealTimeDigitalCanvas/recordings',
      public_id: publicId,
    });

    const cloudinaryUrl = cloudinaryResult.secure_url;
    console.log(`[uploadRecording] Uploaded to Cloudinary: ${cloudinaryUrl}`);

    // Keep legacy single field updated (for backward compat)
    meeting.recordingPath = cloudinaryUrl;
    meeting.recordedBy = req.user._id;

    // Push to recordings array (supports multiple recordings)
    meeting.recordings.push({
      filename: cloudinaryUrl,
      recordedBy: req.user._id,
      uploadedAt: new Date()
    });

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Recording uploaded to cloud successfully',
      recordingPath: cloudinaryUrl
    });
  } catch (error) {
    console.error('[uploadRecording] Error:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get Meeting Notes (Chat + Recording info for ended meetings)
// @route   GET /api/meetings/:id/notes
// @access  Private (Host or Participant)
// @desc    Cancel/Delete a pending meeting permanently
// @route   DELETE /api/meetings/:id/cancel
// @access  Private (Host Only)
exports.cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can cancel this meeting' });
    }
    if (meeting.status === 'live') {
      return res.status(400).json({ message: 'Cannot cancel a live meeting. End it first.' });
    }
    // Delete canvas if one was created
    if (meeting.canvas) {
      await Canvas.findByIdAndDelete(meeting.canvas);
    }
    await Meeting.findByIdAndDelete(meeting._id);
    console.log('[cancelMeeting] Meeting', meeting.meetingId, 'cancelled and deleted by host', req.user._id.toString());
    res.status(200).json({ success: true, message: 'Meeting cancelled and removed' });
  } catch (error) {
    console.error('[cancelMeeting] ERROR:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getMeetingNotes = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'username name email')
      .populate('participants.user', 'username name email')
      .populate('recordedBy', 'username name')
      .populate('recordings.recordedBy', 'username name');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is host or participant
    const isHost = meeting.host._id.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );
    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get chat history
    const Chat = require('../models/Chat');
    const chat = await Chat.findOne({ meetingId: meeting._id });

    // Build recordings array (merge legacy single recording + new array)
    let allRecordings = [];
    if (meeting.recordings && meeting.recordings.length > 0) {
      allRecordings = meeting.recordings.map(r => ({
        filename: r.filename,
        recordedBy: r.recordedBy ? {
          _id: r.recordedBy._id,
          username: r.recordedBy.username || r.recordedBy.name
        } : null,
        uploadedAt: r.uploadedAt
      }));
    } else if (meeting.recordingPath) {
      // Fallback: legacy single recording
      allRecordings = [{
        filename: meeting.recordingPath,
        recordedBy: meeting.recordedBy ? {
          _id: meeting.recordedBy._id,
          username: meeting.recordedBy.username || meeting.recordedBy.name
        } : null,
        uploadedAt: meeting.endTime || meeting.updatedAt
      }];
    }

    res.status(200).json({
      success: true,
      meeting: {
        _id: meeting._id,
        name: meeting.name,
        meetingId: meeting.meetingId,
        status: meeting.status,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        host: {
          _id: meeting.host._id,
          username: meeting.host.username || meeting.host.name
        },
        participants: meeting.participants.map(p => ({
          _id: p.user._id,
          username: p.user.username || p.user.name,
          joinTime: p.joinTime,
          leaveTime: p.leaveTime
        })),
        recordingPath: meeting.recordingPath || null,
        recordings: allRecordings,
        recordedBy: meeting.recordedBy ? {
          _id: meeting.recordedBy._id,
          username: meeting.recordedBy.username || meeting.recordedBy.name
        } : null,
        messages: chat ? chat.messages : [],
        sharedCanvasLink: meeting.sharedCanvasLink || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update shared canvas link for a meeting (host only)
// @route   PUT /api/meetings/:id/canvas-link
// @access  Private (host only)
exports.updateSharedCanvasLink = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can update the canvas link' });
    }

    const { sharedCanvasLink } = req.body;
    meeting.sharedCanvasLink = sharedCanvasLink || null;
    await meeting.save();

    // Emit real-time update to all participants in the meeting room
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      // Emit to the meeting room (joined by DB _id in socketHandler)
      io.to(meeting._id.toString()).emit('canvas_link_updated', {
        sharedCanvasLink: meeting.sharedCanvasLink
      });
    }

    res.status(200).json({ success: true, sharedCanvasLink: meeting.sharedCanvasLink });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};