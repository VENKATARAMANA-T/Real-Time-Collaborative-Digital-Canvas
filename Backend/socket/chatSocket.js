const Chat = require('../models/Chat.js');
const Meeting = require('../models/Meeting.js');

const chatSocket =  (io, socket) => {

    // =================================================================
    // 1. SEND MESSAGE
    // =================================================================
    socket.on('send_message', async (data) => {
      // Expecting ONLY: { meetingId, msg } 
      // User ID is pulled from socket.userData
      const { meetingId, msg } = data;
      const { userId, username } = socket.userData || {};

      if (!userId || !meetingId) {
        socket.emit('chat_error', { message: 'Connection lost. Please rejoin.' });
        return;
      }

      try {
        // --- A. VALIDATION (Check Meeting Model) ---
        const meeting = await Meeting.findById(meetingId);
        
        if (!meeting) {
            socket.emit('chat_error', { message: 'Meeting not found' });
            return;
        }

        // 1. Is Global Chat Enabled?
        if (!meeting.isChatEnabled) {
          socket.emit('chat_error', { message: 'Chat is currently disabled by the host.' });
          return;
        }

        // 2. Is Individual User Allowed?
        const isHost = meeting.host.toString() === userId;
        
        if (!isHost) {
          const participant = meeting.participants.find(p => p.user.toString() === userId);
          
          // Check if muted
          if (!participant || participant.canChat === false) {
            socket.emit('chat_error', { message: 'You have been muted by the host.' });
            return;
          }
        }

        // --- B. SAVE TO DB (Chat Model) ---
        
        const newMessage = {
          username: username, // From socket context
          msg: msg            // From payload
        };

        // Update DB: Push to array
        await Chat.findOneAndUpdate(
          { meetingId: meetingId }, 
          { 
            $setOnInsert: { hostId: meeting.host }, // Only set on creation
            $push: { messages: newMessage } 
          },
          { upsert: true, new: true }
        );

        // --- C. BROADCAST TO ROOM ---
        // Send to everyone (including sender) so their UI updates
        io.to(meetingId).emit('receive_message', newMessage);

      } catch (error) {
        console.error('Chat Socket Error:', error);
        socket.emit('chat_error', { message: 'Message failed to send' });
      }
    });

};

module.exports = { chatSocket };