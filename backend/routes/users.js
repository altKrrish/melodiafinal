import express from 'express';
import User from '../models/User.js';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get current user stats (level, XP breakdown)
router.get('/me/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const likedCount = user.likedSongs?.length || 0;
    const playlistCount = user.playlists?.length || 0;
    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    const likedXP = likedCount * 10;
    const playlistXP = playlistCount * 25;
    const followerXP = followerCount * 15;
    const followingXP = followingCount * 5;
    const totalXP = likedXP + playlistXP + followerXP + followingXP;
    const level = Math.max(1, Math.min(Math.floor(Math.sqrt(totalXP / 10)), 99));

    // XP needed for next level
    const nextLevel = Math.min(level + 1, 99);
    const xpForCurrentLevel = (level * level) * 10;
    const xpForNextLevel = (nextLevel * nextLevel) * 10;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    res.json({
      level,
      xp: totalXP,
      xpProgress,
      xpNeeded,
      breakdown: {
        likedSongs: { count: likedCount, xp: likedXP },
        playlists: { count: playlistCount, xp: playlistXP },
        followers: { count: followerCount, xp: followerXP },
        following: { count: followingCount, xp: followingXP },
      }
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Failed to fetch user stats.' });
  }
});

// Discover other users (excludes current user)
router.get('/discover', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const users = await User.find({ _id: { $ne: req.user.userId }, isActive: true })
      .select('username profilePicture bio likedSongs playlists followers following')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ _id: { $ne: req.user.userId }, isActive: true });

    const currentUser = await User.findById(req.user.userId).select('following');
    const followingIds = (currentUser?.following || []).map(id => id.toString());

    const usersWithMeta = users.map(u => ({
      _id: u._id,
      username: u.username,
      profilePicture: u.profilePicture,
      bio: u.bio,
      level: u.level || 1,
      xp: u.xp || 0,
      likedCount: u.likedSongs?.length || 0,
      playlistCount: u.playlists?.length || 0,
      followerCount: u.followers?.length || 0,
      isFollowing: followingIds.includes(u._id.toString()),
    }));

    res.json({ users: usersWithMeta, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Error discovering users:', err);
    res.status(500).json({ error: 'Failed to discover users.' });
  }
});

// Get a specific user's public profile
router.get('/:id/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username profilePicture bio likedSongs playlists followers following createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get their public playlists
    const publicPlaylists = await Playlist.find({ owner: user._id, isPublic: true })
      .populate('songs', 'title artist coverImage duration videoId')
      .sort({ createdAt: -1 })
      .limit(20);

    const currentUser = await User.findById(req.user.userId).select('following');
    const isFollowing = (currentUser?.following || []).some(id => id.toString() === user._id.toString());

    res.json({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      bio: user.bio,
      level: user.level || 1,
      xp: user.xp || 0,
      likedCount: user.likedSongs?.length || 0,
      playlistCount: user.playlists?.length || 0,
      followerCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isFollowing,
      publicPlaylists,
      memberSince: user.createdAt,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Toggle follow/unfollow a user
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully'
    });
  } catch (err) {
    console.error('Error toggling follow:', err);
    res.status(500).json({ error: 'Failed to toggle follow.' });
  }
});

// Get liked songs
router.get('/liked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('likedSongs');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user.likedSongs);
  } catch (err) {
    console.error('Error fetching liked songs:', err);
    res.status(500).json({ error: 'Failed to fetch liked songs.' });
  }
});

// Toggle like on a song
router.post('/:id/like', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const songId = req.params.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(songId);
    let song;

    if (isObjectId) {
      song = await Song.findById(songId);
    } else {
      song = await Song.findOne({ videoId: songId });
    }

    // If song does not exist yet in MongoDB, create it using metadata in req.body
    if (!song && req.body.title) {
      song = new Song({
        title: req.body.title,
        artist: req.body.artist || 'Unknown Artist',
        coverImage: req.body.coverImage || '',
        duration: req.body.duration || 180,
        audioUrl: `https://www.youtube.com/watch?v=${req.body.videoId || songId}`,
        videoId: req.body.videoId || songId,
        source: 'youtube'
      });
      await song.save();
    }

    if (!song) {
      return res.status(404).json({ error: 'Song not found and no metadata provided.' });
    }

    const targetSongIdStr = song._id.toString();
    const index = user.likedSongs.findIndex(id => id.toString() === targetSongIdStr);

    if (index === -1) {
      user.likedSongs.push(song._id);
    } else {
      user.likedSongs.splice(index, 1);
    }

    await user.save();
    const populatedUser = await User.findById(user._id).populate('likedSongs');
    res.json({ likedSongs: populatedUser.likedSongs, message: 'Like toggled successfully.', song });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// Update profile picture
router.post('/profile-picture', protect, async (req, res) => {
  try {
    const { profilePicture } = req.body;
    if (!profilePicture) {
      return res.status(400).json({ error: 'profilePicture parameter is required.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ error: 'Failed to update profile picture.' });
  }
});

export default router;
