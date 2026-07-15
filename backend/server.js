import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { initializeFirebase } from './config/firebase.js';
import logger from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDiscoveryAgent } from './utils/discoveryAgent.js';

// Import routes
import authRoutes from './routes/auth.js';
import songsRoutes from './routes/songs.js';
import usersRoutes from './routes/users.js';
import playlistRoutes from './routes/playlists.js';

const app = express();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow the requesting origin to prevent CORS blocks on Vercel
    callback(null, origin || true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Request logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message) } }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting (relaxed to prevent quota lockouts during rapid client testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================================================
// DATABASE & EXTERNAL SERVICES INITIALIZATION
// ============================================================================

const initializeServices = async () => {
  try {
    await connectDB();
    logger.info('Database connected');

    await initializeRedis();
    logger.info('Redis initialized');

    if (config.FIREBASE_CONFIG.projectId) {
      initializeFirebase();
      logger.info('Firebase initialized');
    }

    // Start background autonomous DJ discovery agent
    initializeDiscoveryAgent();
  } catch (error) {
    logger.error(`Service initialization failed: ${error.message}`);
    process.exit(1);
  }
};

let servicesInitialized = false;
let initializingPromise = null;

const ensureServicesInitialized = async () => {
  if (servicesInitialized) return;
  if (!initializingPromise) {
    initializingPromise = initializeServices().then(() => {
      servicesInitialized = true;
    }).catch(err => {
      logger.error('Failed to initialize services globally');
    });
  }
  await initializingPromise;
};

// Middleware for serverless to ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  if (!servicesInitialized) {
    await ensureServicesInitialized();
  }
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/playlists', playlistRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    await initializeServices();
    servicesInitialized = true;

    const server = app.listen(config.PORT, () => {
      logger.info(`🎵 Melodia server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

export default app;

import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
