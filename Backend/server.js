const express = require('express');
const connectDB = require('./config/db.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes.js');
const canvasRoutes = require('./routes/canvasRoutes.js');
const meetingRoutes = require('./routes/meetingRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

// Load env vars
dotenv.config();

const app = express();



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

// === ERROR MIDDLEWARE (MUST BE LAST) ===
app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);

  connectDB();
});
