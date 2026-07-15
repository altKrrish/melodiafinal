import axios from 'axios';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
import { searchYouTube } from './youtubeService.js';
import logger from '../config/logger.js';

// Pre-defined YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBppQSyZoT5E93sP-cnaIsydqKzgakjwuo';

/**
 * Extracts keywords from a song title to map user taste
 */
const extractKeywords = (title) => {
  const titleLower = title.toLowerCase();
  const stopwords = ['the', 'a', 'in', 'on', 'at', 'to', 'for', 'with', 'official', 'audio', 'video', 'lyrics', 'remix', 'mix'];
  const tokens = titleLower.match(/\w+/g) || [];
  return tokens.filter(t => t.length > 3 && !stopwords.includes(t));
};

/**
 * DJ Discovery agent core pipeline
 */
export const runDiscoveryPipeline = async () => {
  logger.info('DJ Discovery Agent: Scanning active user libraries for autonomous music discovery...');
  try {
    const users = await User.find({ isActive: true }).populate('likedSongs');
    if (users.length === 0) {
      logger.info('DJ Discovery Agent: No active users found.');
      return;
    }

    for (const user of users) {
      const likedSongs = user.likedSongs || [];
      if (likedSongs.length === 0) {
        logger.info(`DJ Discovery Agent: User ${user.username} has no liked songs. Skipping.`);
        continue;
      }

      // 1. Gather top artists (channels) and keywords
      const artistCounts = {};
      const userKeywords = [];
      const likedVideoIds = new Set();

      likedSongs.forEach(song => {
        if (song.artist) {
          artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
        }
        if (song.title) {
          userKeywords.push(...extractKeywords(song.title));
        }
        if (song.videoId) {
          likedVideoIds.add(song.videoId);
        }
      });

      // Sort artists by frequency
      const topArtists = Object.keys(artistCounts)
        .sort((a, b) => artistCounts[b] - artistCounts[a])
        .slice(0, 3); // top 3 artists

      // Unique keywords list
      const uniqueKeywords = [...new Set(userKeywords)];

      logger.info(`DJ Discovery Agent: User ${user.username} top artists: ${topArtists.join(', ')}`);

      // 2. Fetch recent uploads from top artists on YouTube
      const candidateSongs = [];
      for (const artist of topArtists) {
        try {
          // Search YouTube for recent releases from artist
          const searchQuery = `${artist} latest release official audio`;
          const results = await searchYouTube(searchQuery);
          
          results.slice(0, 3).forEach(track => {
            // Filter out songs already liked
            if (!likedVideoIds.has(track.videoId)) {
              candidateSongs.push(track);
            }
          });
        } catch (err) {
          logger.error(`DJ Discovery Agent: Failed to fetch candidate tracks for artist ${artist}: ${err.message}`);
        }
      }

      if (candidateSongs.length === 0) {
        logger.info(`DJ Discovery Agent: No new discovery candidates found for user ${user.username}.`);
        continue;
      }

      // 3. Score candidates based on profile
      const scoredCandidates = candidateSongs.map(track => {
        let score = 0;
        
        // Exact artist match
        if (topArtists.includes(track.artist)) {
          score += 50;
        }
        
        // Keyword overlap matches
        const trackWords = extractKeywords(track.title);
        const matchCount = trackWords.filter(word => uniqueKeywords.includes(word)).length;
        score += matchCount * 10;
        
        return { track, score };
      });

      // Sort candidates by score
      const topDiscoveries = scoredCandidates
        .sort((a, b) => b.score - a.score)
        .filter(c => c.score > 20) // min score threshold
        .slice(0, 2) // pick top 2
        .map(c => c.track);

      if (topDiscoveries.length === 0) {
        logger.info(`DJ Discovery Agent: No high-scoring candidates found for user ${user.username}.`);
        continue;
      }

      // 4. Save track records in MongoDB
      const songsToSave = [];
      for (const track of topDiscoveries) {
        let dbSong = await Song.findOne({ videoId: track.videoId });
        if (!dbSong) {
          dbSong = new Song({
            title: track.title,
            artist: track.artist,
            coverImage: track.coverImage,
            duration: track.duration || 180,
            audioUrl: track.audioUrl,
            videoId: track.videoId,
            source: 'youtube'
          });
          await dbSong.save();
        }
        songsToSave.push(dbSong._id);
      }

      // 5. Update or create Discover Weekly playlist
      let playlist = await Playlist.findOne({ owner: user._id, name: 'Discover Weekly' });
      if (!playlist) {
        playlist = await Playlist.create({
          name: 'Discover Weekly',
          description: 'Autonomously compiled by your personal AI DJ based on your recent listening profile.',
          owner: user._id,
          songs: songsToSave,
          isSmartPlaylist: true,
          isPublic: false
        });
        user.playlists.push(playlist._id);
        await user.save();
      } else {
        // Rolling playlist: append new ones and limit to 20 tracks
        const existingSongs = playlist.songs || [];
        const newSongs = songsToSave.filter(id => !existingSongs.some(eId => eId.toString() === id.toString()));
        
        playlist.songs = [...newSongs, ...existingSongs].slice(0, 20);
        await playlist.save();
      }

      logger.info(`DJ Discovery Agent: Updated Discover Weekly playlist with ${songsToSave.length} new tracks for user ${user.username}.`);
    }
  } catch (error) {
    logger.error(`DJ Discovery Agent: Pipeline failed: ${error.message}`);
  }
};

/**
 * Initializes the discovery agent background worker scheduler
 */
export const initializeDiscoveryAgent = () => {
  logger.info('DJ Discovery Agent initialized. Scheduling background updates.');
  
  // Run discovery agent 15 seconds after launch to populate demo playlists immediately
  setTimeout(() => {
    runDiscoveryPipeline();
  }, 15000);

  // Periodic scheduling: every 15 minutes
  setInterval(() => {
    runDiscoveryPipeline();
  }, 15 * 60 * 1000);
};

export default {
  runDiscoveryPipeline,
  initializeDiscoveryAgent
};
