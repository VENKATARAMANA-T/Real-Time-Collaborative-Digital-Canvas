const express = require('express');
const dotenv = require('dotenv');
// Load env vars early so all modules see them
dotenv.config();

const connectDB = require('./config/db.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');
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
const botRoutes = require('./routes/botRoutes.js');

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

const socketHandler = require('./socket/socketHandler');

const app = express();

// Wrap Express app with HTTP Server
const server = http.createServer(app);
// Initialize Socket.io with CORS settings
// Accept any localhost origin in dev; in production use FRONTEND_URL or ALLOWED_ORIGINS
const isLocalOrigin = (origin) => !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const FRONTEND_URL = process.env.FRONTEND_URL; // e.g. https://your-app.example.com
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const allowedOrigin = [
  'http://localhost:5173', // Local development
  process.env.FRONTEND_URL // Deployed frontend on Vercel
];

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // 1. Allow no origin (Postman/Mobile)
      if (!origin) return callback(null, true);

      // 2. Check exact matches
      const isAllowed = allowedOrigin.includes(origin);
      
      // 3. Check for Vercel dynamic previews
      const isVercelPreview = origin.endsWith('.vercel.app');

      if (isAllowed || isVercelPreview) {
        return callback(null, true);
      }
      
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
    // Required if you have older clients or specific load balancing needs
    allowEIO3: true 
  }
});

app.set('io', io);
socketHandler(io);

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow internal/non-browser requests (Postman, Mobile)
    if (!origin) return callback(null, true);

    // 2. Allow exact matches from our list
    if (allowedOrigin.includes(origin)) return callback(null, true);

    // 3. Allow Vercel Preview/Branch deployments using a regex
    // Matches patterns like: myapp-git-main-user.vercel.app
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"] // Essential for preflight success
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Recordings are now served from Cloudinary — no static file serving needed

app.use('/api/auth', authRoutes);
app.use('/api/canvases', canvasRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bot', botRoutes);

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