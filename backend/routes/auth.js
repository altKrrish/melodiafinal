import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

const router = express.Router();

const JWT_SECRET = config.JWT_SECRET;

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with that email or username.' });
    }

    // Create new user (save profilePicture if provided)
    const user = new User({ username, email, password, profilePicture: req.body.profilePicture || null });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture, level: user.level || 1, xp: user.xp || 0 }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture, level: user.level || 1, xp: user.xp || 0 }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

export default router;
