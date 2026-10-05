const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gratiwall';
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB connection lost. API calls that need the database will fail until it reconnects.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[db] MongoDB reconnected.');
  });
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] Connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.error('[db] Could not connect to MongoDB:', err.message);
    console.error('[db] The server will keep running. Start MongoDB (e.g. "brew services start mongodb-community")');
    console.error('[db] or point MONGO_URI at a reachable instance, then restart.');
    return false;
  }
}

module.exports = connectDB;
