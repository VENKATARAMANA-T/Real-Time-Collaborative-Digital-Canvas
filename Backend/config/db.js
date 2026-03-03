const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/collab-canvas';
  console.log(`[DB] Connecting to MongoDB at: ${mongoUrl}`);

  try {
    const conn = await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`[DB] Primary connection failed: ${error.message}`);
    console.log('[DB] Starting in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[DB] In-memory MongoDB running at: ${memUri}`);
      console.log(`[DB] Connected: ${conn.connection.host}/${conn.connection.name}`);
      return true;
    } catch (memErr) {
      console.error(`[DB] In-memory fallback also failed: ${memErr.message}`);
      console.warn('[DB] Server will run without database. Auth-protected routes will return 503.');
      return false;
    }
  }
};

module.exports = connectDB;