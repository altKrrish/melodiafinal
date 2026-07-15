import express from 'express';
import axios from 'axios';
import Song from '../models/Song.js';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import { protect } from '../middleware/auth.js';
import { searchYouTube, getTrendingTracks } from '../utils/youtubeService.js';
import { classifyMood } from '../utils/classifier.js';
import { runKMeansClustering } from '../utils/kmeans.js';

const router = express.Router();

// Get all songs from local database with optional filters
router.get('/', async (req, res) => {
  try {
    const { genre, artist, q } = req.query;
    let query = {};

    if (genre) query.genre = new RegExp(genre, 'i');
    if (artist) query.artist = new RegExp(artist, 'i');
    if (q) query.$or = [{ title: new RegExp(q, 'i') }, { artist: new RegExp(q, 'i') }];

    const songs = await Song.find(query).limit(50);
    res.json(songs);
  } catch (err) {
    console.error('Error fetching local songs:', err);
    res.status(500).json({ error: 'Failed to fetch songs.' });
  }
});

// Expose Vibe Mixes (K-Means Clustering on Liked Songs)
router.get('/vibe-mixes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('likedSongs');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const likedSongs = user.likedSongs || [];
    if (likedSongs.length === 0) {
      return res.json([]);
    }

    // Run K-Means clustering pipeline (k=3 vibes)
    const clusters = runKMeansClustering(likedSongs, 3);
    const vibeMixPlaylists = [];

    for (const cluster of clusters) {
      const name = cluster.label;
      let playlist = await Playlist.findOne({ owner: user._id, name });

      if (!playlist) {
        playlist = await Playlist.create({
          name,
          description: `K-Means vibe mix containing acoustic clusters of your saved songs. Features: ${cluster.songs.slice(0, 3).map(s => s.title).join(', ')}.`,
          owner: user._id,
          songs: cluster.songs.map(s => s._id),
          isSmartPlaylist: true,
          isPublic: false
        });
        user.playlists.push(playlist._id);
      } else {
        playlist.songs = cluster.songs.map(s => s._id);
        playlist.description = `K-Means vibe mix containing acoustic clusters of your saved songs. Features: ${cluster.songs.slice(0, 3).map(s => s.title).join(', ')}.`;
        await playlist.save();
      }

      const populated = await Playlist.findById(playlist._id).populate('songs');
      vibeMixPlaylists.push({
        _id: populated._id,
        name: populated.name,
        description: populated.description,
        songs: populated.songs,
        gradient: cluster.gradient,
        coverImage: populated.coverImage
      });
    }

    await user.save();
    res.json(vibeMixPlaylists);
  } catch (err) {
    console.error('Error compiling vibe mixes:', err);
    res.status(500).json({ error: 'Failed to compile vibe mixes.' });
  }
});

// Get trending songs from YouTube
router.get('/trending', async (req, res) => {
  try {
    const youtubeSongs = await getTrendingTracks();
    // Classify mood of trending tracks
    const taggedSongs = youtubeSongs.map(song => {
      song.predictedMoods = classifyMood(song.title, [song.artist]);
      return song;
    });
    res.json(taggedSongs);
  } catch (err) {
    console.error('Error fetching trending songs:', err);
    res.status(500).json({ error: 'Failed to fetch trending songs.' });
  }
});

// Search songs using YouTube and classify their mood in real-time
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const youtubeSongs = await searchYouTube(q);
    
    // Run real-time mood classification tagging on search results
    const taggedSongs = youtubeSongs.map(song => {
      song.predictedMoods = classifyMood(song.title, [song.artist]);
      return song;
    });

    res.json(taggedSongs);
  } catch (err) {
    console.error('Error searching songs:', err);
    res.status(500).json({ error: 'Failed to search songs.' });
  }
});

// Helper: clean YouTube-style noise from title/artist for lyrics lookup
function cleanForLyrics(text) {
  return text
    .replace(/\(official\s*(video|audio|music\s*video|lyric\s*video|visualizer)?\)/gi, '')
    .replace(/\[official\s*(video|audio|music\s*video|lyric\s*video|visualizer)?\]/gi, '')
    .replace(/\((lyrics?|hd|hq|4k|live|remix|explicit)\)/gi, '')
    .replace(/\[(lyrics?|hd|hq|4k|live|remix|explicit)\]/gi, '')
    .replace(/\|.*$/g, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/\s*-\s*topic$/i, '')
    .replace(/vevo$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Fetch lyrics for a song by videoId (multi-provider fallback)
router.get('/:videoId/lyrics', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, artist } = req.query;

    let songTitle = title;
    let songArtist = artist;

    // If title/artist not provided in query, look up from DB
    if (!songTitle || !songArtist) {
      const song = await Song.findOne({ videoId });
      if (song) {
        songTitle = songTitle || song.title;
        songArtist = songArtist || song.artist;
      }
    }

    if (!songTitle || !songArtist) {
      return res.status(400).json({ success: false, message: 'title and artist are required' });
    }

    const cleanTitle = cleanForLyrics(songTitle);
    const cleanArtist = cleanForLyrics(songArtist);

    // Provider 1: lrclib.net (free, no API key, often has synced lyrics)
    try {
      const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const lrclibRes = await axios.get(lrclibUrl, { timeout: 6000 });
      const data = lrclibRes.data;

      // Prefer synced lyrics, fall back to plain lyrics
      const rawLyrics = data?.syncedLyrics || data?.plainLyrics || '';
      if (rawLyrics && rawLyrics.length > 20) {
        // Parse synced lyrics: strip timestamps like [00:12.34]
        const lines = rawLyrics
          .split('\n')
          .map(l => l.replace(/^\[\d{2}:\d{2}\.\d{2,3}\]\s?/, '').trim())
          .filter(l => l.length > 0);

        return res.json({ success: true, lyrics: lines, raw: rawLyrics, source: 'lrclib' });
      }
    } catch (lrclibErr) {
      // lrclib failed, try next provider
    }

    // Provider 2: lyrics.ovh (free, no API key)
    try {
      const encodedArtist = encodeURIComponent(cleanArtist);
      const encodedTitle = encodeURIComponent(cleanTitle);
      const lyricsUrl = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;

      const response = await axios.get(lyricsUrl, { timeout: 8000 });
      const rawLyrics = response.data?.lyrics || '';

      if (rawLyrics && rawLyrics.length > 20) {
        const lines = rawLyrics
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);

        return res.json({ success: true, lyrics: lines, raw: rawLyrics, source: 'lyrics.ovh' });
      }
    } catch (ovhErr) {
      // lyrics.ovh failed too
    }

    // All providers failed
    return res.status(404).json({ success: false, message: 'Lyrics not found for this song' });
  } catch (err) {
    console.error('Error fetching lyrics:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch lyrics' });
  }
});

// Find or create a song by videoId
router.post('/', async (req, res) => {
  try {
    const { videoId, title, artist, coverImage, duration } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    let song = await Song.findOne({ videoId });
    if (!song) {
      // Run mood classifier on initial database save
      const predictedMoods = classifyMood(title, [artist]);
      
      song = new Song({
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        coverImage: coverImage || '',
        duration: duration || 180,
        audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        source: 'youtube',
        predictedMoods
      });
      await song.save();
    }
    res.status(200).json(song);
  } catch (err) {
    console.error('Error finding or creating song:', err);
    res.status(500).json({ error: 'Failed to find or create song.' });
  }
});

export default router;
