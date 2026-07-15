import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect } from '../middleware/auth.js';
import { validatePlaylist } from '../middleware/validation.js';
import Playlist from '../models/Playlist.js';
import Song from '../models/Song.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { generateSmartPlaylistName, generatePlaylistDescription, generateAiPlaylist, generateSmartPlaylistFromLikes } from '../utils/aiService.js';
import { searchYouTube } from '../utils/youtubeService.js';

const router = express.Router();

// Get all public playlists for the Community tab (discoverability)
router.get(
  '/community',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 24, 50);
    const skip = (page - 1) * limit;

    const playlists = await Playlist.find({ isPublic: true })
      .populate('owner', 'username profilePicture')
      .populate('songs', 'title artist coverImage duration videoId')
      .sort({ playCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Playlist.countDocuments({ isPublic: true });

    res.status(200).json({
      success: true,
      data: playlists,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  }),
);

router.post(
  '/ai-generate',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    logger.info(`AI Playlist request received for prompt: "${prompt}"`);
    const result = await generateAiPlaylist(prompt);
    
    // Resolve each recommended song on YouTube
    const songs = [];
    for (const recommendedSong of (result.songs || [])) {
      try {
        const searchQuery = `${recommendedSong.title} ${recommendedSong.artist}`;
        const searchResults = await searchYouTube(searchQuery);
        if (searchResults && searchResults.length > 0) {
          const track = searchResults[0];
          songs.push({
            _id: track.videoId,
            videoId: track.videoId,
            title: track.title,
            artist: track.artist,
            genre: 'AI Recommended',
            duration: track.duration || 180,
            audioUrl: track.audioUrl,
            coverImage: track.coverImage,
            source: 'youtube'
          });
        }
      } catch (err) {
        logger.error(`Failed to resolve AI song on YouTube: ${recommendedSong.title} - ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      name: result.name || 'AI Playlist',
      description: result.description || `Generated playlist for: ${prompt}`,
      songs
    });
  })
);

router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const playlists = await Playlist.find({ owner: req.user.userId })
      .populate('songs', 'title artist coverImage duration videoId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: playlists,
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    // 1. Try to extract and decode token optionally
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, config.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // invalid token, ignore
      }
    }

    // 2. Find playlist by ID or shareLink
    let playlist;
    const mongoose = (await import('mongoose')).default;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      playlist = await Playlist.findById(req.params.id)
        .populate('owner', 'username profilePicture')
        .populate('songs');
    } else {
      playlist = await Playlist.findOne({ shareLink: req.params.id })
        .populate('owner', 'username profilePicture')
        .populate('songs');
    }

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    // 3. Permission check
    const ownerId = playlist.owner ? (playlist.owner._id || playlist.owner) : null;
    if (!playlist.isPublic && (!userId || !ownerId || ownerId.toString() !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this playlist',
      });
    }

    playlist.playCount += 1;
    await playlist.save();

    res.status(200).json({
      success: true,
      data: playlist,
    });
  }),
);

router.post(
  '/',
  protect,
  validatePlaylist,
  asyncHandler(async (req, res) => {
    const { name, description, coverImage, songs, isPublic } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      coverImage,
      owner: req.user.userId,
      songs: [],
      isPublic: Boolean(isPublic)
    });
    
    // Support bulk insertion of songs during playlist creation
    if (songs && Array.isArray(songs) && songs.length > 0) {
      const songIds = [];
      const Song = (await import('../models/Song.js')).default;
      
      for (const track of songs) {
        const targetSongId = track.videoId || track.songId;
        if (!targetSongId) continue;
        
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetSongId);
        let songDoc;
        
        if (isObjectId) {
          songDoc = await Song.findById(targetSongId);
        } else {
          songDoc = await Song.findOne({ videoId: targetSongId });
        }
        
        if (!songDoc && track.title) {
          songDoc = new Song({
            title: track.title,
            artist: track.artist || 'Unknown Artist',
            coverImage: track.coverImage || '',
            duration: track.duration || 180,
            audioUrl: `https://www.youtube.com/watch?v=${targetSongId}`,
            videoId: targetSongId,
            source: 'youtube'
          });
          await songDoc.save();
        }
        
        if (songDoc && !songIds.includes(songDoc._id)) {
          songIds.push(songDoc._id);
        }
      }
      
      playlist.songs = songIds;
      await playlist.save();
    }

    logger.info(`New playlist created: ${name} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: playlist,
    });
  }),
);

router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this playlist',
      });
    }

    playlist = await Playlist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Playlist updated successfully',
      data: playlist,
    });
  }),
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this playlist',
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    logger.info(`Playlist deleted: ${playlist.name}`);

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully',
    });
  }),
);

router.post(
  '/:id/songs',
  protect,
  asyncHandler(async (req, res) => {
    const { songId, title, artist, coverImage, duration, videoId } = req.body;
    const targetSongId = songId || videoId;

    if (!targetSongId) {
      return res.status(400).json({
        success: false,
        message: 'Song ID or Video ID is required',
      });
    }

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this playlist',
      });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetSongId);
    let song;

    if (isObjectId) {
      song = await Song.findById(targetSongId);
    } else {
      song = await Song.findOne({ videoId: targetSongId });
    }

    // If song is not in DB yet, create it from metadata
    if (!song && title) {
      song = new Song({
        title,
        artist: artist || 'Unknown Artist',
        coverImage: coverImage || '',
        duration: duration || 180,
        audioUrl: `https://www.youtube.com/watch?v=${videoId || targetSongId}`,
        videoId: videoId || targetSongId,
        source: 'youtube'
      });
      await song.save();
    }

    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found in database and no metadata provided.',
      });
    }

    const resolvedSongId = song._id;

    if (playlist.songs.includes(resolvedSongId)) {
      return res.status(400).json({
        success: false,
        message: 'Song already in playlist',
      });
    }

    playlist.songs.push(resolvedSongId);
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Song added to playlist',
      data: playlist,
    });
  }),
);

router.delete(
  '/:id/songs/:songId',
  protect,
  asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this playlist',
      });
    }

    playlist.songs = playlist.songs.filter((id) => id.toString() !== req.params.songId);
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Song removed from playlist',
      data: playlist,
    });
  }),
);

router.post(
  '/smart/generate',
  protect,
  asyncHandler(async (req, res) => {
    const { moods = [], genres = [] } = req.body;

    const user = await User.findById(req.user.userId).populate('likedSongs');

    const criteria = {
      moods,
      genres,
      basedOnLikedSongs: true,
      basedOnHistory: true,
    };

    const playlistName = await generateSmartPlaylistName(criteria);
    const playlistDescription = await generatePlaylistDescription(playlistName, criteria);

    let query = {};
    if (moods.length > 0) query.mood = { $in: moods };
    if (genres.length > 0) query.genre = { $in: genres };

    let songs = await Song.find(query).limit(50);

    if (songs.length === 0 && user.likedSongs.length > 0) {
      songs = user.likedSongs.slice(0, 50);
    }

    const playlist = await Playlist.create({
      name: playlistName,
      description: playlistDescription,
      owner: req.user.userId,
      songs: songs.map((s) => s._id),
      isSmartPlaylist: true,
      aiGenerationCriteria: criteria,
    });

    user.playlists.push(playlist._id);
    await user.save();

    logger.info(`Smart playlist created: ${playlistName} for user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Smart playlist generated successfully',
      data: playlist,
    });
  }),
);

router.post(
  '/smart',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).populate('likedSongs');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const likedSongs = user.likedSongs || [];

    if (likedSongs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You have no Liked Songs. Please search and like some tracks first before generating an AI Smart Playlist.',
      });
    }

    // Take top 10-15 liked songs
    const sampleSongs = likedSongs.slice(0, 15);
    
    let recommendedSongs;
    try {
      recommendedSongs = await generateSmartPlaylistFromLikes(sampleSongs);
    } catch (llmErr) {
      return res.status(500).json({
        success: false,
        message: `Failed to compile recommendations from OpenRouter: ${llmErr.message}`
      });
    }

    const limitedRecommendations = (recommendedSongs || []).slice(0, 10);

    const songsToSave = [];
    
    for (const rec of limitedRecommendations) {
      try {
        const searchQuery = `${rec.title} ${rec.artist} official audio`;
        const searchResults = await searchYouTube(searchQuery);
        
        if (searchResults && searchResults.length > 0) {
          const track = searchResults[0];
          
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
      } catch (err) {
        logger.error(`Failed to map smart AI recommended song "${rec.title}" by ${rec.artist}: ${err.message}`);
      }
    }

    if (songsToSave.length === 0) {
      songsToSave.push(...likedSongs.slice(0, 3).map(s => s._id));
    }

    const playlistName = `AI Mix: ${new Date().toLocaleDateString()}`;
    const playlist = await Playlist.create({
      name: playlistName,
      description: `Tailored soundtrack compiled by Nvidia Nemotron model based on your favorite tracks like ${sampleSongs[0]?.title || ''}.`,
      owner: req.user.userId,
      songs: songsToSave,
      isSmartPlaylist: true,
      isPublic: false
    });

    user.playlists.push(playlist._id);
    await user.save();

    const populatedPlaylist = await Playlist.findById(playlist._id).populate('songs');

    const tracksFormatted = populatedPlaylist.songs.map(song => ({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.coverImage
    }));

    res.status(201).json({
      success: true,
      message: 'Smart playlist generated successfully',
      data: populatedPlaylist,
    });
  }),
);

router.post(
  '/:id/share',
  protect,
  asyncHandler(async (req, res) => {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found',
      });
    }

    if (playlist.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to share this playlist',
      });
    }

    playlist.shareLink = uuidv4();
    playlist.isPublic = true;
    await playlist.save();

    const shareUrl = `${config.CLIENT_URL}/playlist/share/${playlist.shareLink}`;

    res.status(200).json({
      success: true,
      message: 'Share link generated',
      data: { shareLink: playlist.shareLink, shareUrl },
    });
  }),
);

export default router;
