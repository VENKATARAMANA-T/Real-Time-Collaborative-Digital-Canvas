require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Canvas = require('./models/Canvas');
const Meeting = require('./models/Meeting');
const Chat = require('./models/Chat');
const Folder = require('./models/Folder');
const Notification = require('./models/Notification');
const ActivityLog = require('./models/ActivityLog');

const connectDB = require('./config/db');

const initializeCollections = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL or MONGO_URI is not defined in .env');
    }
    
    console.log(`[DB] Connecting to MongoDB Atlas...`);
    await mongoose.connect(mongoUrl);
    console.log(`✅ MongoDB Connected successfully`);

    console.log('\nStarting explicit collection creation...');
    
    await User.createCollection();
    console.log('✅ Users collection created');
    
    await Canvas.createCollection();
    console.log('✅ Canvases collection created');
    
    await Meeting.createCollection();
    console.log('✅ Meetings collection created');
    
    await Chat.createCollection();
    console.log('✅ Chats collection created');
    
    await Folder.createCollection();
    console.log('✅ Folders collection created');
    
    await Notification.createCollection();
    console.log('✅ Notifications collection created');
    
    await ActivityLog.createCollection();
    console.log('✅ ActivityLogs collection created');

    console.log('\n🎉 All collections have been successfully created in MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    if (error.code === 48) {
      console.log('⚠️ Collection already exists (Code 48). Moving on safely...');
      process.exit(0);
    } else {
      console.error('❌ Error creating collections:', error);
      process.exit(1);
    }
  }
};

initializeCollections();