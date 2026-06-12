const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { getPubSubClients, isRedisAvailable } = require('../config/redis');
const socketAuth = require('./auth');
const projectHandler = require('./handlers/project.handler');
const taskHandler = require('./handlers/task.handler');
const logger = require('../utils/logger');
const env = require('../config/env');

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Try to attach Redis adapter for horizontal scaling
  if (isRedisAvailable()) {
    try {
      const { pubClient, subClient } = getPubSubClients();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter attached');
    } catch (error) {
      logger.warn('Socket.IO Redis adapter failed, running in single instance mode:', error.message);
    }
  } else {
    logger.info('Socket.IO running in single-instance mode (no Redis)');
  }

  // Auth middleware
  io.use(socketAuth);

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.name} (${socket.id})`);

    // Register handlers
    projectHandler(io, socket);
    taskHandler(io, socket);

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.user.name}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
