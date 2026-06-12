const logger = require('../utils/logger');
const env = require('./env');

let redisAvailable = false;
let redisClient = null;
let pubClient = null;
let subClient = null;

const createRedisClient = (name = 'default') => {
  try {
    const Redis = require('ioredis');
    const client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          // Stop retrying after 3 attempts
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    });

    client.on('connect', () => {
      logger.info(`Redis ${name} client connected`);
    });

    client.on('error', (err) => {
      // Only log once, don't spam
      if (!client._errorLogged) {
        logger.warn(`Redis ${name}: ${err.message} (Redis is optional - app works without it)`);
        client._errorLogged = true;
      }
    });

    return client;
  } catch (error) {
    logger.warn(`Redis ${name} client creation failed: ${error.message}`);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const getPubSubClients = () => {
  return { pubClient, subClient };
};

const isRedisAvailable = () => redisAvailable;

const connectRedis = async () => {
  try {
    redisClient = createRedisClient('main');
    if (!redisClient) throw new Error('Client creation failed');

    await redisClient.connect();

    pubClient = createRedisClient('pub');
    subClient = createRedisClient('sub');
    if (!pubClient || !subClient) throw new Error('Pub/Sub client creation failed');

    await pubClient.connect();
    await subClient.connect();

    redisAvailable = true;
    logger.info('All Redis clients connected successfully');
  } catch (error) {
    redisAvailable = false;
    // Clean up failed clients
    redisClient = null;
    pubClient = null;
    subClient = null;
    logger.warn(`Redis not available: ${error.message}`);
    logger.info('App will run without Redis (single-instance mode, real-time still works via in-memory)');
  }
};

module.exports = {
  getRedisClient,
  getPubSubClients,
  connectRedis,
  isRedisAvailable,
};
