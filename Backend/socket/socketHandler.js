const { chatSocket } = require('./chatSocket');
const { canvasSocket } = require('./canvasSocket'); 
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // =================================================================
    // 0. USER ROOM (For activity updates on Dashboard)
    // =================================================================
    socket.on('join_user_room', (data) => {
      const { userId } = data || {};
      if (!userId) return;
      socket.join(userId);
      console.log(`User ${userId} joined personal room (socket: ${socket.id})`);
    });

    // =================================================================
    // 1. GLOBAL ROOM MANAGEMENT
    // =================================================================
    
    socket.on('join_meeting', (data) => {
      // Expecting: { meetingId, userId, username, silent }
      const { meetingId, userId, username, silent } = data || {};
      
      socket.join(meetingId);
      socket.join(userId); // THIS IS THE KEY LINE
      
      // Store User Context in the Socket instance
      // This allows us to know "Who is sending this?" without the frontend sending ID every time
      socket.userData = { 
        userId: userId, 
        username: username,
        meetingId: meetingId 
      };

      console.log(`${username} joined meeting room: ${meetingId}`);
      
      // Broadcast to all users in the meeting that a new user joined
      if (!silent) {
        socket.to(meetingId).emit('user_joined', { userId, username });
      }
    });




    socket.on('leave_meeting', (payload) => {
      const { username, userId } = socket.userData || {};
      const meetingId = typeof payload === 'string' ? payload : payload?.meetingId;
      const silent = typeof payload === 'object' ? payload?.silent : false;
      if (!meetingId) return;
      // If the leaving user was screen sharing, stop it
      if (io._screenSharers?.[meetingId]?.userId === userId) {
        delete io._screenSharers[meetingId];
        io.to(meetingId).emit('screen_share_stopped', { userId });
        console.log(`🖥️ Screen share auto-stopped (${username} left)`);
      }
      // Clean up any pending screen share requests from this user
      if (io._screenShareRequests?.[meetingId]) {
        const hadRequest = io._screenShareRequests[meetingId].some(r => r.userId === userId);
        io._screenShareRequests[meetingId] = io._screenShareRequests[meetingId].filter(r => r.userId !== userId);
        if (io._screenShareRequests[meetingId].length === 0) delete io._screenShareRequests[meetingId];
        if (hadRequest) {
          io.to(meetingId).emit('screen_share_request_withdrawn', { userId });
        }
      }
      // If the leaving user was recording, stop recording
      if (io._meetingRecorders?.[meetingId]?.userId === userId) {
        delete io._meetingRecorders[meetingId];
        io.to(meetingId).emit('recording_stopped', { userId });
        console.log(`⏹️ Recording auto-stopped (${username} left)`);
      }
      socket.leave(meetingId);
      // Broadcast to all users in the meeting that a user left
      if (!silent) {
        io.to(meetingId).emit('user_left', { username, userId });
      }
      console.log(`${username || 'Unknown'} left room: ${meetingId}`);
    });

    // =================================================================
    // 2. ATTACH CHAT MODULE
    // =================================================================
    
    // We pass the IO instance and the specific socket to the chat module
    chatSocket(io, socket);
    canvasSocket(io, socket);

    // =================================================================
    // 3. HOST CONTROLS (Notifications / Real-time Updates)
    // =================================================================

    // Listen for Host Ending Meeting
    socket.on('end_meeting', async (data) => {
        // data: { meetingId, meetingDbId }
        const meetingIdForRoom = data.meetingId || data.meetingDbId;

        // ── Safety-net DB update ──
        // The REST API (endMeeting controller) should have already updated the DB,
        // but if that call failed or was never reached, this ensures the meeting
        // is always marked as ended with an endTime in the database.
        try {
          const Meeting = require('../models/Meeting');
          const dbMeetingId = data.meetingDbId || data.meetingId;
          const meeting = await Meeting.findById(dbMeetingId);
          if (meeting && meeting.status !== 'ended') {
            meeting.status = 'ended';
            meeting.endTime = new Date();
            meeting.participants.forEach(p => {
              if (!p.leaveTime) p.leaveTime = new Date();
            });
            await meeting.save();
            console.log(`[end_meeting socket] DB safety-net: marked meeting ${dbMeetingId} as ended with endTime ${meeting.endTime}`);
          }
        } catch (dbErr) {
          console.error('[end_meeting socket] DB safety-net failed:', dbErr.message);
        }

        // Clean up screen share state for this meeting
        if (meetingIdForRoom && io._screenSharers?.[meetingIdForRoom]) {
          delete io._screenSharers[meetingIdForRoom];
        }
        // Clean up pending screen share requests
        if (meetingIdForRoom && io._screenShareRequests?.[meetingIdForRoom]) {
          delete io._screenShareRequests[meetingIdForRoom];
        }
        // Clean up recording state for this meeting
        if (meetingIdForRoom && io._meetingRecorders?.[meetingIdForRoom]) {
          delete io._meetingRecorders[meetingIdForRoom];
        }

        // Broadcast to everyone in the room that meeting is ended
        io.to(meetingIdForRoom).emit('meeting_ended', { 
          meetingId: meetingIdForRoom,
          message: 'Host has ended the meeting'
        });

        // Also emit meeting_update to each participant's personal user room
        // This ensures any open Dashboard tabs refresh their meeting lists
        const roomSockets = io.sockets.adapter.rooms.get(meetingIdForRoom);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const memberSocket = io.sockets.sockets.get(socketId);
            if (memberSocket?.userData?.userId) {
              io.to(memberSocket.userData.userId).emit('meeting_update', {
                type: 'ended',
                meetingId: meetingIdForRoom
              });
            }
          }
        }

        console.log(`Meeting ended: ${meetingIdForRoom}`);
    });

    // Listen for Host Toggling Global Chat
    socket.on('update_chat_status', (data) => {
        // data: { meetingId, isChatEnabled }
        // Broadcast to everyone in the room so their UI updates instantly
        io.to(data.meetingId).emit('chat_status_updated', data);
    });

    // Listen for Host Settings Updates (Mute All, Video Off, Chat Toggle)
    // Only forward the fields that were actually changed to avoid stale notifications
    socket.on('host_settings_updated', (data) => {
        if (!data?.meetingId) return;
        const { meetingId, ...settings } = data;
        io.to(meetingId).emit('host_settings_updated', settings);
    });

    // Listen for Host Muting a Specific User
    socket.on('update_user_permission', (data) => {
        // data: { meetingId, userId, canChat }
        // Broadcast so the specific user (and others) know the status changed
        io.to(data.meetingId).emit('user_permission_updated', data);
    });

    // Listen for Host Updating Edit Permission
    socket.on('edit_permission_updated', (data) => {
      // data: { meetingId, userId, permission }
      io.to(data.meetingId).emit('edit_permission_updated', data);
    });

    // Listen for user media status updates
    socket.on('media_status_updated', (data) => {
      // data: { meetingId, userId, mic, video, username }
      if (!data?.meetingId || !data?.userId) return;
      io.to(data.meetingId).emit('media_status_updated', data);
    });

    // // WebRTC Signaling: Offer - Broadcast to all in meeting (simplifies routing)
    // socket.on('webrtc_offer', (data) => {
    //   // data: { meetingId, from, to, offer }
    //   if (!data?.meetingId || !data?.from || !data?.offer) return;
    //   console.log(`📤 Forwarding WebRTC offer from ${data.from} to ${data.to || 'all'}`);
    //   io.to(data.meetingId).emit('webrtc_offer', {
    //     from: data.from,
    //     to: data.to,
    //     offer: data.offer
    //   });
    // });

    // // WebRTC Signaling: Answer - Broadcast to all in meeting
    // socket.on('webrtc_answer', (data) => {
    //   // data: { meetingId, from, to, answer }
    //   if (!data?.meetingId || !data?.from || !data?.answer) return;
    //   console.log(`📥 Forwarding WebRTC answer from ${data.from} to ${data.to || 'all'}`);
    //   io.to(data.meetingId).emit('webrtc_answer', {
    //     from: data.from,
    //     to: data.to,
    //     answer: data.answer
    //   });
    // });

    // // WebRTC Signaling: ICE Candidate - Broadcast to all in meeting
    // socket.on('webrtc_ice_candidate', (data) => {
    //   // data: { meetingId, from, to, candidate }
    //   if (!data?.meetingId || !data?.from || !data?.candidate) return;
    //   io.to(data.meetingId).emit('webrtc_ice_candidate', {
    //     from: data.from,
    //     to: data.to,
    //     candidate: data.candidate
    //   });
    // });

 

// Update WebRTC Signaling to be Targeted
socket.on('webrtc_offer', (data) => {
  if (!data?.to || !data?.offer) return;
  // Send ONLY to the 'to' user's private room
  io.to(data.to).emit('webrtc_offer', {
    from: data.from,
    offer: data.offer
  });
});

socket.on('webrtc_answer', (data) => {
  if (!data?.to || !data?.answer) return;
  io.to(data.to).emit('webrtc_answer', {
    from: data.from,
    answer: data.answer
  });
});

socket.on('webrtc_ice_candidate', (data) => {
  if (!data?.to || !data?.candidate) return;
  io.to(data.to).emit('webrtc_ice_candidate', {
    from: data.from,
    candidate: data.candidate
  });
});
    // Listen for Host Locking Canvas
    socket.on('canvas_locked', (data) => {
      // data: { meetingId, username }
      io.to(data.meetingId).emit('canvas_locked', data);
    });

    // Host viewport sync (zoom/pan) for locked canvas mode
    socket.on('host_viewport_sync', (data) => {
      // data: { meetingId, viewport: { scale, offset: { x, y } } }
      if (!data?.meetingId || !data?.viewport) return;
      socket.to(data.meetingId).emit('host_viewport_sync', data);
    });

    // Live cursor movement (canvas only)
    socket.on('cursor_move', (data) => {
      // data: { meetingId, userId, username, x, y }
      if (!data?.meetingId || !data?.userId) return;
      socket.to(data.meetingId).emit('cursor_move', data);
    });

    socket.on('cursor_leave', (data) => {
      // data: { meetingId, userId }
      if (!data?.meetingId || !data?.userId) return;
      socket.to(data.meetingId).emit('cursor_leave', data);
    });

    // =================================================================
    // EMOJI REACTIONS (visible to all participants)
    // =================================================================
    socket.on('emoji_reaction', (data) => {
      // data: { meetingId, userId, username, emoji }
      if (!data?.meetingId || !data?.emoji) return;
      const { userId, username } = socket.userData || {};
      io.to(data.meetingId).emit('emoji_reaction', {
        userId: data.userId || userId,
        username: data.username || username,
        emoji: data.emoji
      });
    });

    // =================================================================
    // RAISE HAND (visible to all participants)
    // =================================================================
    socket.on('raise_hand', (data) => {
      // data: { meetingId, userId, username, raised }
      if (!data?.meetingId) return;
      const { userId, username } = socket.userData || {};
      io.to(data.meetingId).emit('raise_hand', {
        userId: data.userId || userId,
        username: data.username || username,
        raised: data.raised
      });
    });

    // =================================================================
    // SCREEN SHARING (one sharer at a time per meeting, permission-based)
    // =================================================================

    // Track current screen sharer per meeting room
    if (!io._screenSharers) io._screenSharers = {};
    // Track pending screen share requests per meeting: { meetingId: [{ userId, username }] }
    if (!io._screenShareRequests) io._screenShareRequests = {};
    // Track current meeting recorder per meeting: { meetingId: { userId, username } }
    if (!io._meetingRecorders) io._meetingRecorders = {};

    // --- Permission request flow (non-host → host) ---
    socket.on('screen_share_request', (data) => {
      // data: { meetingId, userId, username, hostUserId }
      if (!data?.meetingId || !data?.userId || !data?.hostUserId) return;

      // If someone is already sharing, deny immediately
      if (io._screenSharers[data.meetingId]) {
        socket.emit('screen_share_request_declined', {
          reason: 'Another user is already sharing their screen'
        });
        return;
      }

      // Add to pending requests
      if (!io._screenShareRequests[data.meetingId]) {
        io._screenShareRequests[data.meetingId] = [];
      }

      // Prevent duplicate requests from same user
      const existing = io._screenShareRequests[data.meetingId].find(r => r.userId === data.userId);
      if (!existing) {
        io._screenShareRequests[data.meetingId].push({
          userId: data.userId,
          username: data.username
        });
      }

      // Send request to host only
      io.to(data.hostUserId).emit('screen_share_request', {
        userId: data.userId,
        username: data.username
      });
      console.log(`🖥️ Screen share request from ${data.username} → host in ${data.meetingId}`);
    });

    socket.on('screen_share_approve', (data) => {
      // data: { meetingId, userId (the requester to approve) }
      if (!data?.meetingId || !data?.userId) return;

      // If someone is already sharing, deny (race condition guard)
      if (io._screenSharers[data.meetingId]) {
        io.to(data.userId).emit('screen_share_request_declined', {
          reason: 'Another user is already sharing their screen'
        });
        // Clear all pending requests for this meeting
        delete io._screenShareRequests[data.meetingId];
        return;
      }

      // Auto-decline ALL OTHER pending requests for this meeting
      const pending = io._screenShareRequests[data.meetingId] || [];
      for (const req of pending) {
        if (req.userId !== data.userId) {
          io.to(req.userId).emit('screen_share_request_declined', {
            reason: 'Host approved another user\'s screen share request'
          });
        }
      }
      // Clear all pending requests
      delete io._screenShareRequests[data.meetingId];

      // Notify the approved user
      io.to(data.userId).emit('screen_share_approved', {
        message: 'Host allowed you to share your screen'
      });

      console.log(`🖥️ Screen share approved for ${data.userId} in ${data.meetingId}`);
    });

    socket.on('screen_share_decline', (data) => {
      // data: { meetingId, userId (the requester to decline) }
      if (!data?.meetingId || !data?.userId) return;

      // Remove from pending list
      if (io._screenShareRequests[data.meetingId]) {
        io._screenShareRequests[data.meetingId] = io._screenShareRequests[data.meetingId].filter(
          r => r.userId !== data.userId
        );
        if (io._screenShareRequests[data.meetingId].length === 0) {
          delete io._screenShareRequests[data.meetingId];
        }
      }

      // Notify the declined user
      io.to(data.userId).emit('screen_share_request_declined', {
        reason: 'Host declined your screen share request'
      });

      console.log(`🖥️ Screen share declined for ${data.userId} in ${data.meetingId}`);
    });

    // --- Direct screen share start (host bypasses permission) ---
    socket.on('screen_share_start', (data) => {
      // data: { meetingId, userId, username }
      if (!data?.meetingId || !data?.userId) return;

      // Only allow if no one else is currently sharing
      const currentSharer = io._screenSharers[data.meetingId];
      if (currentSharer && currentSharer.userId !== data.userId) {
        // Someone else is already sharing — deny
        socket.emit('screen_share_denied', {
          reason: 'Another user is already sharing their screen',
          currentSharer: currentSharer.username
        });
        return;
      }

      // When someone starts sharing, auto-decline all pending requests
      const pending = io._screenShareRequests[data.meetingId] || [];
      for (const req of pending) {
        io.to(req.userId).emit('screen_share_request_declined', {
          reason: 'Screen sharing has started by another user'
        });
      }
      delete io._screenShareRequests[data.meetingId];

      io._screenSharers[data.meetingId] = {
        userId: data.userId,
        username: data.username
      };

      console.log(`🖥️ Screen share started by ${data.username} in ${data.meetingId}`);
      io.to(data.meetingId).emit('screen_share_started', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('screen_share_stop', (data) => {
      // data: { meetingId, userId }
      if (!data?.meetingId) return;

      const currentSharer = io._screenSharers[data.meetingId];
      if (currentSharer && currentSharer.userId === data.userId) {
        delete io._screenSharers[data.meetingId];
      }

      console.log(`🖥️ Screen share stopped in ${data.meetingId}`);
      io.to(data.meetingId).emit('screen_share_stopped', {
        userId: data.userId
      });
    });

    // WebRTC signaling for screen share (separate from audio/video)
    socket.on('screen_share_offer', (data) => {
      if (!data?.to || !data?.offer) return;
      io.to(data.to).emit('screen_share_offer', {
        from: data.from,
        offer: data.offer
      });
    });

    socket.on('screen_share_answer', (data) => {
      if (!data?.to || !data?.answer) return;
      io.to(data.to).emit('screen_share_answer', {
        from: data.from,
        answer: data.answer
      });
    });

    socket.on('screen_share_ice_candidate', (data) => {
      if (!data?.to || !data?.candidate) return;
      io.to(data.to).emit('screen_share_ice_candidate', {
        from: data.from,
        candidate: data.candidate
      });
    });

    // =================================================================
    // MEETING RECORDING (one recorder at a time per meeting)
    // =================================================================

    socket.on('recording_start', (data) => {
      // data: { meetingId, userId, username }
      if (!data?.meetingId || !data?.userId) return;

      // Only allow one recorder at a time
      const currentRecorder = io._meetingRecorders[data.meetingId];
      if (currentRecorder && currentRecorder.userId !== data.userId) {
        socket.emit('recording_denied', {
          reason: 'Another user is already recording',
          currentRecorder: currentRecorder.username
        });
        return;
      }

      io._meetingRecorders[data.meetingId] = {
        userId: data.userId,
        username: data.username
      };

      console.log(`🔴 Recording started by ${data.username} in ${data.meetingId}`);
      io.to(data.meetingId).emit('recording_started', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('recording_stop', (data) => {
      // data: { meetingId, userId }
      if (!data?.meetingId) return;

      const currentRecorder = io._meetingRecorders[data.meetingId];
      if (currentRecorder && currentRecorder.userId === data.userId) {
        delete io._meetingRecorders[data.meetingId];
      }

      console.log(`⏹️ Recording stopped in ${data.meetingId}`);
      io.to(data.meetingId).emit('recording_stopped', {
        userId: data.userId
      });
    });

    // Host force-stops recording (e.g. when disabling the setting)
    socket.on('recording_force_stop', (data) => {
      // data: { meetingId }
      if (!data?.meetingId) return;

      const currentRecorder = io._meetingRecorders[data.meetingId];
      if (currentRecorder) {
        delete io._meetingRecorders[data.meetingId];
        io.to(data.meetingId).emit('recording_force_stopped', {
          reason: 'Host has disabled screen recording'
        });
        console.log(`⏹️ Recording force-stopped by host in ${data.meetingId}`);
      }
    });

    // =================================================================
    // 4. DISCONNECT
    // =================================================================
    socket.on('disconnect', () => {
      // If the disconnected user was screen sharing, stop it
      const { userId, username, meetingId } = socket.userData || {};
      if (meetingId && io._screenSharers?.[meetingId]?.userId === userId) {
        delete io._screenSharers[meetingId];
        io.to(meetingId).emit('screen_share_stopped', { userId });
        console.log(`🖥️ Screen share auto-stopped (${username} disconnected)`);
      }
      // Clean up any pending screen share requests from this user
      if (meetingId && io._screenShareRequests?.[meetingId]) {
        io._screenShareRequests[meetingId] = io._screenShareRequests[meetingId].filter(r => r.userId !== userId);
        if (io._screenShareRequests[meetingId].length === 0) delete io._screenShareRequests[meetingId];
        // Notify host that the request was withdrawn
        io.to(meetingId).emit('screen_share_request_withdrawn', { userId });
      }
      // If the disconnected user was recording, stop recording
      if (meetingId && io._meetingRecorders?.[meetingId]?.userId === userId) {
        delete io._meetingRecorders[meetingId];
        io.to(meetingId).emit('recording_stopped', { userId });
        console.log(`⏹️ Recording auto-stopped (${username} disconnected)`);
      }
      console.log('User Disconnected  ', socket.id);
    });

  });
};