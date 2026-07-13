import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  
  MONGO_URI: process.env.MONGO_URI,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'melodia',
  
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  FIREBASE_CONFIG: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  },
  
  SPOTIFY: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  },
  
  OPENAI: {
    apiKey: process.env.OPENAI_API_KEY,
    openRouterKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  },
  
  SENDGRID: {
    apiKey: process.env.SENDGRID_API_KEY,
    senderEmail: process.env.SENDER_EMAIL,
    senderName: process.env.SENDER_NAME
  },
  
  REDIS: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600
  },
  
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  UPLOAD: {
    maxAudioSize: parseInt(process.env.MAX_AUDIO_FILE_SIZE, 10) || 52428800,
    maxImageSize: parseInt(process.env.MAX_IMAGE_FILE_SIZE, 10) || 5242880,
    allowedAudioFormats: (process.env.ALLOWED_AUDIO_FORMATS || 'mp3,wav,flac,ogg,m4a').split(','),
    allowedImageFormats: (process.env.ALLOWED_IMAGE_FORMATS || 'jpg,jpeg,png,webp').split(',')
  },
  
  PAGINATION: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100
  }
};

export default config;
