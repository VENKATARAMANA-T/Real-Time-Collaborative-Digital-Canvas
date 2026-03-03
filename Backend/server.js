const dotenv = require('dotenv');
// Load env vars
dotenv.config();

const express = require('express');
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
const botRoutes = require('./routes/botRoutes.js');

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

const socketHandler = require('./socket/socketHandler');

const app = express();

// Wrap Express app with HTTP Server
const server = http.createServer(app);
// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true
  }
});
app.set('io', io);
socketHandler(io);

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
app.use('/api/bot', botRoutes);

// === ERROR MIDDLEWARE (MUST BE LAST) ===
app.use(notFound);
app.use(errorHandler);

// app.listen(process.env.PORT || 5000, () => {
//   console.log(`Server running on port ${process.env.PORT || 5000}`);

//   connectDB();
// });

const PORT = process.env.PORT || 5000;

// 1. Connect to DB first
// Start server immediately — DB connection failure is non-fatal
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Connect DB in background
  connectDB().then((dbOk) => {
    if (dbOk) console.log('[DB] All features available.');
    else console.warn('[DB] Running in degraded mode — bot & public routes still available.');
  });
});