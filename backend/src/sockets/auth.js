const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const logger = require('../utils/logger');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.userId = user._id.toString();
    socket.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    logger.debug(`Socket authenticated: ${user.name} (${socket.id})`);
    next();
  } catch (error) {
    logger.error('Socket auth error:', error.message);
    next(new Error('Invalid authentication token'));
  }
};

module.exports = socketAuth;
