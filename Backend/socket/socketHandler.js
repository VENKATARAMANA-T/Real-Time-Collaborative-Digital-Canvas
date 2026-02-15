const { chatSocket } = require('./chatSocket');
const { canvasSocket } = require('./canvasSocket'); 
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

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
    socket.on('end_meeting', (data) => {
        // data: { meetingId, meetingDbId }
        // Broadcast to everyone in the room that meeting is ended
        io.to(data.meetingId).emit('meeting_ended', { 
          meetingId: data.meetingId,
          message: 'Host has ended the meeting'
        });
        console.log(`Meeting ended: ${data.meetingId}`);
    });

    // Listen for Host Toggling Global Chat
    socket.on('update_chat_status', (data) => {
        // data: { meetingId, isChatEnabled }
        // Broadcast to everyone in the room so their UI updates instantly
        io.to(data.meetingId).emit('chat_status_updated', data);
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
    // 4. DISCONNECT
    // =================================================================
    socket.on('disconnect', () => {
      console.log('User Disconnected  ', socket.id);
    });

  });
};