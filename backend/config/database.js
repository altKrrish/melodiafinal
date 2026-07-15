import mongoose from 'mongoose';
import config from './index.js';
import logger from './logger.js';

const mongooseOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  bufferCommands: false,
};

import { MongoMemoryServer } from 'mongodb-memory-server';
import Song from '../models/Song.js';

let mongod;

const connectDB = async () => {
  try {
    let uri = config.MONGO_URI;
    
    // Fallback to in-memory server if local connection string or missing
    if (!uri || uri.includes('localhost')) {
      logger.info('Using in-memory MongoDB for local development');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }
    
    await mongoose.connect(uri, mongooseOptions);
    logger.info('MongoDB connected successfully');
    
    if (mongod) {
      const count = await Song.countDocuments();
      if (count === 0) {
        await Song.create([
          { title: 'Cyberpunk City', artist: 'Neon Voyager', duration: 180, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&h=100&fit=crop', playCount: 1500, genre: ['Electronic'] },
          { title: 'Synthwave Dreams', artist: 'Retro Future', duration: 210, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop', playCount: 890, genre: ['Pop'] },
          { title: 'Midnight Drive', artist: 'Lazerhawk', duration: 240, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=100&h=100&fit=crop', playCount: 300, genre: ['Electronic'] }
        ]);
        logger.info('Database seeded with mock songs');
      }
    }
    return mongoose.connection;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`MongoDB disconnection failed: ${error.message}`);
  }
};

export { connectDB, disconnectDB };
export default connectDB;
