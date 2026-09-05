const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Standard MongoDB failed: ${error.message}. Initializing In-Memory Fallback...`);
    try {
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`[ZERO-DEPENDENCY MODE] Connected to In-Memory MongoDB at ${uri}`);
    } catch (memError) {
      console.error(`In-Memory MongoDB also failed: ${memError.message}`);
    }
  }
};

module.exports = connectDB;
