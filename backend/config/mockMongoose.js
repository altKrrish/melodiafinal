import mongoose from 'mongoose';
import logger from './logger.js';

export const applyMongooseMock = () => {
  logger.warn('Applying Mongoose Mock for Vercel deployment without MongoDB URI');
  
  const mockSongs = [
    { _id: '1', videoId: '1', title: 'Cyberpunk City', artist: 'Neon Voyager', duration: 180, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&h=100&fit=crop', playCount: 1500, genre: ['Electronic'], predictedMoods: ['Energetic'] },
    { _id: '2', videoId: '2', title: 'Synthwave Dreams', artist: 'Retro Future', duration: 210, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop', playCount: 890, genre: ['Pop'], predictedMoods: ['Chill'] },
    { _id: '3', videoId: '3', title: 'Midnight Drive', artist: 'Lazerhawk', duration: 240, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=100&h=100&fit=crop', playCount: 300, genre: ['Electronic'], predictedMoods: ['Focused'] }
  ];

  const mockUsers = [
    { _id: 'u1', username: 'Guest', profilePicture: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&q=80', followers: [], following: [], likedSongs: mockSongs, xp: 100, level: 2 }
  ];

  const mockPlaylists = [
    { _id: 'p1', name: 'My Chill Mix', description: 'Vibes', coverImage: '', creator: mockUsers[0], songs: mockSongs, isPublic: true, likes: 5, tags: ['Chill'] }
  ];

  // Override Mongoose Model methods to return mock data
  mongoose.Model.find = function() {
    return Promise.resolve(this.modelName === 'Song' ? mockSongs : this.modelName === 'User' ? mockUsers : mockPlaylists);
  };
  
  mongoose.Model.findOne = function() {
    return Promise.resolve((this.modelName === 'Song' ? mockSongs : this.modelName === 'User' ? mockUsers : mockPlaylists)[0]);
  };
  
  mongoose.Model.findById = function() {
    return Promise.resolve((this.modelName === 'Song' ? mockSongs : this.modelName === 'User' ? mockUsers : mockPlaylists)[0]);
  };
  
  mongoose.Model.countDocuments = function() {
    return Promise.resolve(3);
  };
  
  mongoose.Model.prototype.save = function() {
    return Promise.resolve(this);
  };
  
  mongoose.Model.updateOne = function() {
    return Promise.resolve({ modifiedCount: 1 });
  };
  
  mongoose.Model.deleteOne = function() {
    return Promise.resolve({ deletedCount: 1 });
  };
};
