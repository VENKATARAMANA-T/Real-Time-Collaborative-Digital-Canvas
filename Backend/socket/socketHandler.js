const { chatSocket } = require('./chatSocket');
const { canvasSocket } = require('./canvasSocket'); 
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // =================================================================
    // 1. GLOBAL ROOM MANAGEMENT
    // =================================================================
    
    socket.on('join_meeting', (data) => {
      // Expecting: { meetingId, userId, username }
      const { meetingId, userId, username } = data;
      
      socket.join(meetingId);

      // Store User Context in the Socket instance
      // This allows us to know "Who is sending this?" without the frontend sending ID every time
      socket.userData = { 
        userId: userId, 
        username: username,
        meetingId: meetingId 
      };

      console.log(`${username} joined meeting room: ${meetingId}`);
    });




    socket.on('leave_meeting', (meetingId) => {
      socket.leave(meetingId);
      console.log(`Socket ${socket.id} left room: ${meetingId}`);
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

    // =================================================================
    // 4. DISCONNECT
    // =================================================================
    socket.on('disconnect', () => {
      console.log('User Disconnected  ', socket.id);
    });

  });
};