import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a song title'],
      trim: true,
      maxlength: 200,
    },
    artist: {
      type: String,
      required: [true, 'Please provide an artist name'],
      trim: true,
    },
    album: {
      type: String,
      trim: true,
      default: 'Unknown Album',
    },
    duration: {
      type: Number,
      required: [true, 'Please provide song duration in seconds'],
    },
    genre: [{
      type: String,
      enum: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country', 'Folk', 'Indie', 'Other'],
    }],
    mood: [{
      type: String,
      enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Focused', 'Party'],
    }],
    audioUrl: {
      type: String,
      required: [true, 'Please provide an audio URL'],
    },
    coverImage: {
      type: String,
      default: null,
    },
    releaseDate: Date,
    likeCount: {
      type: Number,
      default: 0,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    source: {
      type: String,
      enum: ['local', 'spotify', 'youtube'],
      default: 'youtube',
    },
    spotifyId: String,
    videoId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isExplicit: {
      type: Boolean,
      default: false,
    },
    lyrics: String,
    tags: [String],
    predictedMoods: [String],
    vibeCluster: String,
  },
  { timestamps: true },
);

// Full-text search index
songSchema.index({ title: 'text', artist: 'text', album: 'text' });
songSchema.index({ genre: 1 });
songSchema.index({ mood: 1 });
songSchema.index({ uploadedBy: 1 });

export default mongoose.model('Song', songSchema);
