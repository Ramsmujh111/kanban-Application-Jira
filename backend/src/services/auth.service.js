const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  const refreshToken = jwt.sign({ userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const register = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email is already registered');
  }

  const user = await User.create({ name, email, password });
  const tokens = generateTokens(user._id);

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = generateTokens(user._id);

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const tokens = generateTokens(user._id);
    return {
      user: user.toJSON(),
      ...tokens,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw error;
  }
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user.toJSON();
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
};
