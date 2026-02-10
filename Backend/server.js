const express = require('express');
const connectDB = require('./config/db.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes.js');
const canvasRoutes = require('./routes/canvasRoutes.js');
const meetingRoutes = require('./routes/meetingRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');

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
    origin: process.env.FRONTEND_URL, // Your Frontend URL (Vite default)
    methods: ["GET", "POST"]
  }
});
socketHandler(io);

app.use(cors({
  origin: process.env.FRONTEND_URL,   // read from .env
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));


// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/canvases', canvasRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// === ERROR MIDDLEWARE (MUST BE LAST) ===
app.use(notFound);
app.use(errorHandler);

// app.listen(process.env.PORT || 5000, () => {
//   console.log(`Server running on port ${process.env.PORT || 5000}`);

//   connectDB();
// });

const PORT = process.env.PORT || 5000;

// 1. Connect to DB first
connectDB().then(() => {
  // 2. ONLY start server if DB connects successfully
  console.log('Database connected successfully. Starting server...');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.log('Database connection failed. Server not started.');
  console.error(err);
});