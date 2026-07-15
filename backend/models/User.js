import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/index.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    likedSongs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
    }],
    playlists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist',
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    listeningHistory: [{
      song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
      },
      listenedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to hide sensitive info
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual: compute XP from activity
userSchema.virtual('xp').get(function () {
  const likedXP = (this.likedSongs?.length || 0) * 10;
  const playlistXP = (this.playlists?.length || 0) * 25;
  const followerXP = (this.followers?.length || 0) * 15;
  const followingXP = (this.following?.length || 0) * 5;
  return likedXP + playlistXP + followerXP + followingXP;
});

// Virtual: compute level from XP (1-99 range)
userSchema.virtual('level').get(function () {
  const totalXP = this.xp || 0;
  const rawLevel = Math.floor(Math.sqrt(totalXP / 10));
  return Math.max(1, Math.min(rawLevel, 99));
});

// Ensure virtuals are included in JSON and Object outputs
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
