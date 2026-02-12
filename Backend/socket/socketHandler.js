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
      const { username } = socket.userData || {};
      const meetingId = typeof payload === 'string' ? payload : payload?.meetingId;
      const silent = typeof payload === 'object' ? payload?.silent : false;
      if (!meetingId) return;
      socket.leave(meetingId);
      // Broadcast to all users in the meeting that a user left
      if (!silent) {
        io.to(meetingId).emit('user_left', { username });
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