const express = require('express');
const connectDB = require('./config/db.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes.js');
const canvasRoutes = require('./routes/canvasRoutes.js');
const meetingRoutes = require('./routes/meetingRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const folderRoutes = require('./routes/folderRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

const socketHandler = require('./socket/socketHandler');

// Load env vars
dotenv.config();

const app = express();

// Wrap Express app with HTTP Server
const server = http.createServer(app);
// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true
  }
});
app.set('io', io);
socketHandler(io);

app.use(cors({
  origin: process.env.FRONTEND_URL,   // read from .env
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Serve recordings as static files
app.use('/api/recordings', express.static(path.join(__dirname, 'uploads', 'recordings')));

app.use('/api/auth', authRoutes);
app.use('/api/canvases', canvasRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/upload', uploadRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// === ERROR MIDDLEWARE (MUST BE LAST) ===
app.use(notFound);
app.use(errorHandler);

// app.listen(process.env.PORT || 5000, () => {
//   console.log(`Server running on port ${process.env.PORT || 5000}`);

//   connectDB();
// });

const PORT = process.env.PORT || 5000;

// ─── Meeting Reminder Scheduler ───
// Checks every 30s for pending meetings whose startTime has arrived
const Meeting = require('./models/Meeting');
const Notification = require('./models/Notification');
const _notifiedMeetings = new Set(); // Track already-notified meeting IDs

const startMeetingReminderScheduler = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      // Find scheduled (non-instant) pending meetings that are becoming active
      // A meeting becomes active when startTime <= now + 5 minutes
      const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      const dueMeetings = await Meeting.find({
        status: 'pending',
        isInstant: { $ne: true },
        startTime: { $lte: fiveMinFromNow }
      }).populate('host', '_id username');

      for (const meeting of dueMeetings) {
        const key = meeting._id.toString();
        if (_notifiedMeetings.has(key)) continue;
        _notifiedMeetings.add(key);

        const hostId = meeting.host._id.toString();

        // Persist notification to DB
        const saved = await Notification.create({
          user: hostId,
          type: 'meeting_reminder',
          meeting: meeting._id,
          meetingId: meeting.meetingId,
          meetingName: meeting.name || 'Untitled Meeting',
          startTime: meeting.startTime
        });

        // Emit reminder to host's personal room
        io.to(hostId).emit('meeting_reminder', {
          _id: saved._id,
          meetingId: meeting.meetingId,
          name: meeting.name || 'Untitled Meeting',
          startTime: meeting.startTime,
          read: false,
          createdAt: saved.createdAt
        });
        console.log(`[Reminder] Notified user ${hostId} about meeting "${meeting.name}" (${meeting.meetingId})`);
      }

      // Cleanup old entries from the set
      if (_notifiedMeetings.size > 500) {
        _notifiedMeetings.clear();
      }
    } catch (err) {
      console.error('[Reminder Scheduler] Error:', err.message);
    }
  }, 30000); // Every 30 seconds
  console.log('[Reminder Scheduler] Started — checking every 30s for due meetings');
};

// 1. Connect to DB first
connectDB().then(() => {
  // 2. ONLY start server if DB connects successfully
  console.log('Database connected successfully. Starting server...');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  // 3. Start the meeting reminder scheduler
  startMeetingReminderScheduler();
}).catch((err) => {
  console.log('Database connection failed. Server not started.');
  console.error(err);
});