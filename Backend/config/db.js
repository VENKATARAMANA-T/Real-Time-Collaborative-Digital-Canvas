const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/collab-canvas';
    console.log(`[DB] Connecting to MongoDB...`);
    const conn = await mongoose.connect(mongoUrl);
    
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[DB] Error: ${error.message}`);
    console.warn('[DB] Server will continue running without database. Features requiring DB will not work.');
  }
};

module.exports = connectDB;