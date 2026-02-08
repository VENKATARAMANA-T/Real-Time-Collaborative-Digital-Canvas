const express = require('express');
const connectDB = require('./config/db.js');

const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes.js');
const canvasRoutes = require('./routes/canvasRoutes.js');
const meetingRoutes = require('./routes/meetingRoutes.js');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

// Load env vars
dotenv.config();

const app = express();




// Body parser
app.use(express.json(),express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/canvases', canvasRoutes);
app.use('/api/meetings', meetingRoutes);

// === ERROR MIDDLEWARE (MUST BE LAST) ===
app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);

  connectDB();
});
