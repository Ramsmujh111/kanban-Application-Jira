const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { initializeSocket } = require('./src/sockets');
const logger = require('./src/utils/logger');
const env = require('./src/config/env');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    // Start listening
    server.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port} (${env.nodeEnv})`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🔗 API: http://localhost:${env.port}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
