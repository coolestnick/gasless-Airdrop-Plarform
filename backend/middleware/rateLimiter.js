const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Check if in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // More lenient in dev
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.ip === '::1', // Skip rate limiting for localhost in dev
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Strict limiter for claim endpoint (prevent abuse)
const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // Max 100 in dev, 5 in production
  message: {
    success: false,
    message: 'Too many claim attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use wallet address as key if available
  keyGenerator: (req) => {
    return req.body.walletAddress || req.ip;
  },
  skip: (req) => isDevelopment && req.ip === '::1', // Skip for localhost in dev
  handler: (req, res) => {
    logger.warn(`Claim rate limit exceeded for: ${req.body.walletAddress || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many claim attempts. Please try again in 15 minutes.'
    });
  }
});

// Eligibility check limiter
const eligibilityLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 10, // Very high in dev, 10 in production
  message: {
    success: false,
    message: 'Too many eligibility checks. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.ip === '::1' // Skip for localhost in dev
});

module.exports = {
  apiLimiter,
  claimLimiter,
  eligibilityLimiter
};
