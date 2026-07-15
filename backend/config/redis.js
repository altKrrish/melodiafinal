import redis from 'redis';
import config from './index.js';
import logger from './logger.js';

let redisClient;

export const initializeRedis = async () => {
  try {
    if (!config.REDIS.url) {
      logger.warn('Redis URL not configured, caching disabled');
      return null;
    }

    redisClient = redis.createClient({ 
      url: config.REDIS.url,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection failed 3 times. Disabling Redis.');
            redisClient = null;
            return false;
          }
          return 1000;
        }
      }
    });
    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect().catch(err => {
      logger.warn('Failed to connect to Redis initially. Continuing without Redis cache.');
      redisClient = null;
    });
    return redisClient;
  } catch (error) {
    logger.error(`Redis initialization failed: ${error.message}`);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const cacheGet = async (key) => {
  try {
    if (!redisClient) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Cache get failed: ${error.message}`);
    return null;
  }
};

export const cacheSet = async (key, value, ttl = config.REDIS.ttl) => {
  try {
    if (!redisClient) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache set failed: ${error.message}`);
  }
};

export const cacheDelete = async (key) => {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Cache delete failed: ${error.message}`);
  }
};

export const cacheClear = async () => {
  try {
    if (!redisClient) return;
    await redisClient.flushDb();
  } catch (error) {
    logger.error(`Cache clear failed: ${error.message}`);
  }
};

export default { initializeRedis, getRedisClient, cacheGet, cacheSet, cacheDelete, cacheClear };
