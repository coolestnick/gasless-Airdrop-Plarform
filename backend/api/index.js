// Vercel serverless function wrapper for Express app
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('../config/database');
const walletService = require('../services/walletService');
const errorHandler = require('../middleware/errorHandler');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

// Import routes
const airdropRoutes = require('../routes/airdrop');
const adminRoutes = require('../routes/admin');

// Initialize express app
const app = express();

// Trust proxy to get real client IP (important for Vercel)
app.set('trust proxy', true);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', airdropRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and wallet service (cached for serverless)
let dbInitialized = false;
let walletInitialized = false;

async function initializeServices() {
  if (!dbInitialized) {
    try {
      await connectDB();
      logger.info('✅ Database connected');
      dbInitialized = true;
    } catch (error) {
      logger.error('Database connection error:', error);
      // Don't throw - allow function to continue
    }
  }

  if (!walletInitialized) {
    try {
      await walletService.initialize();
      logger.info('✅ Wallet service initialized');
      walletInitialized = true;
    } catch (error) {
      logger.error('Wallet service initialization error:', error);
      // Don't throw - allow function to continue
    }
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Initialize services on first request
    await initializeServices();
    
    // Handle the request with Express
    app(req, res);
  } catch (error) {
    logger.error('Serverless function error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

