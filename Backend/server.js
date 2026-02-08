const express = require('express');
const connectDB = require('./config/db.js');

const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes.js');

// Load env vars
dotenv.config();

const app = express();




// Body parser
app.use(express.json(),express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);

  connectDB();
});
