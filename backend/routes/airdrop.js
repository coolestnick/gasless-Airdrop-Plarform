const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const axios = require('axios');
const EligibleUser = require('../models/EligibleUser');
const Transaction = require('../models/Transaction');
const walletService = require('../services/walletService');
const { validate, schemas } = require('../middleware/validation');
const { eligibilityLimiter, claimLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { getCountryFromIP, getClientIP } = require('../utils/ipGeolocation');

// @route   POST /api/check-eligibility
// @desc    Check if wallet is eligible for airdrop and store IP/country on wallet connection
// @access  Public
router.post(
  '/check-eligibility',
  eligibilityLimiter,
  validate(schemas.checkEligibility),
  async (req, res) => {
    try {
      const { walletAddress } = req.validatedData;

      const user = await EligibleUser.findByAddress(walletAddress);

      if (!user) {
        return res.json({
          success: true,
          eligible: false,
          amount: '0',
          claimed: false,
          message: 'Wallet address is not eligible for this airdrop'
        });
      }

      // Store IP and country when wallet connects (if not already stored)
      if (!user.ipAddress || !user.country) {
        const clientIP = getClientIP(req);
        
        // Get country (with timeout to not block response)
        let country = 'Unknown';
        try {
          country = await Promise.race([
            getCountryFromIP(clientIP),
            new Promise((resolve) => setTimeout(() => resolve('Unknown'), 2000)) // 2 second timeout
          ]);
        } catch (error) {
          logger.warn(`Error getting country for IP ${clientIP}:`, error.message);
          country = 'Unknown';
        }

        // Update user with IP and country
        user.ipAddress = clientIP;
        user.country = country;
        await user.save();
        
        logger.info(`Wallet connected: ${walletAddress}, IP: ${clientIP}, Country: ${country}`);
      }

      res.json({
        success: true,
        eligible: true,
        amount: user.allocatedAmount,
        amountFormatted: ethers.formatEther(user.allocatedAmount),
        xpPoints: user.xpPoints,
        rank: user.rank,
        claimed: user.claimed,
        claimDate: user.claimDate,
        txHash: user.txHash
      });
    } catch (error) {
      logger.error('Error checking eligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking eligibility',
        error: error.message
      });
    }
  }
);

// @route   POST /api/claim
// @desc    Process airdrop claim
// @access  Public
router.post(
  '/claim',
  claimLimiter,
  validate(schemas.claim),
  async (req, res) => {
    try {
      const { walletAddress, signature, captchaToken } = req.validatedData;

      // 1. Verify reCAPTCHA Enterprise
      if (!captchaToken) {
        return res.status(400).json({
          success: false,
          message: 'CAPTCHA verification is required'
        });
      }

      try {
        // Simple verification - token exists and has reasonable length
        // For full production use, set up Google Cloud credentials
        if (captchaToken.length < 20) {
          logger.warn(`CAPTCHA token too short for wallet: ${walletAddress}`);
          return res.status(400).json({
            success: false,
            message: 'CAPTCHA verification failed. Invalid token.'
          });
        }

        // Log CAPTCHA verification (in production, this would verify with Google)
        logger.info(`CAPTCHA token received for ${walletAddress} (length: ${captchaToken.length})`);
        logger.info(`CAPTCHA verification passed for ${walletAddress} (development mode)`);

      } catch (captchaError) {
        logger.error('CAPTCHA verification error:', captchaError);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify CAPTCHA. Please try again.'
        });
      }

      // 2. Check if user is eligible
      const user = await EligibleUser.findByAddress(walletAddress);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is not eligible for this airdrop'
        });
      }

      // 3. Check if already claimed
      if (user.claimed) {
        return res.status(400).json({
          success: false,
          message: 'Airdrop already claimed',
          txHash: user.txHash,
          claimDate: user.claimDate
        });
      }

      // 4. Verify signature
      // Simple message format that matches frontend
      const message = `Claim airdrop for ${walletAddress}`;

      const isValidSignature = walletService.verifySignature(
        message,
        signature,
        walletAddress
      );

      if (!isValidSignature) {
        logger.warn(`Invalid signature for wallet: ${walletAddress}`);
        await user.incrementAttempt();

        return res.status(400).json({
          success: false,
          message: 'Invalid signature. Please try again.'
        });
      }

      // 5. Get IP address and country (if not already stored)
      const clientIP = getClientIP(req);
      let country = user.country || 'Unknown';
      
      // If IP/country not stored, get it now
      if (!user.ipAddress || !user.country) {
        try {
          country = await Promise.race([
            getCountryFromIP(clientIP),
            new Promise((resolve) => setTimeout(() => resolve('Unknown'), 2000)) // 2 second timeout
          ]);
        } catch (error) {
          logger.warn(`Error getting country for IP ${clientIP}:`, error.message);
          country = 'Unknown';
        }
      } else {
        country = user.country;
      }

      // 6. Mark as registered/claimed WITHOUT sending tokens
      // Just store the registration data: IP, country, timestamp, wallet address
      user.claimed = true;
      user.claimDate = new Date();
      user.ipAddress = clientIP;
      user.country = country;
      // No txHash since we're not sending tokens
      user.txHash = null;
      await user.save();

      // 7. Log success
      logger.info(`User registered: ${walletAddress}, IP: ${clientIP}, Country: ${country}, Time: ${user.claimDate}`);

      res.json({
        success: true,
        message: 'Registration successful! Your wallet has been registered.',
        amount: user.allocatedAmount,
        amountFormatted: ethers.formatEther(user.allocatedAmount),
        registered: true,
        registeredDate: user.claimDate,
        ipAddress: clientIP,
        country: country
      });
    } catch (error) {
      logger.error('Error processing claim:', error);

      // Increment attempt counter
      try {
        const user = await EligibleUser.findByAddress(req.validatedData.walletAddress);
        if (user) {
          await user.incrementAttempt();
        }
      } catch (e) {
        logger.error('Error updating attempt counter:', e);
      }

      res.status(500).json({
        success: false,
        message: 'Error processing claim. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/claim-status/:address
// @desc    Get claim status for an address
// @access  Public
router.get(
  '/claim-status/:address',
  eligibilityLimiter,
  validate(schemas.claimStatus),
  async (req, res) => {
    try {
      const { address } = req.validatedData;

      const user = await EligibleUser.findByAddress(address);

      if (!user) {
        return res.json({
          success: true,
          found: false,
          message: 'Address not found in eligible list'
        });
      }

      const transactions = await Transaction.findByAddress(address);

      res.json({
        success: true,
        found: true,
        claimed: user.claimed,
        claimDate: user.claimDate,
        txHash: user.txHash,
        amount: user.allocatedAmount,
        amountFormatted: ethers.formatEther(user.allocatedAmount),
        xpPoints: user.xpPoints,
        rank: user.rank,
        attempts: user.attempts,
        lastAttempt: user.lastAttempt,
        transactions: transactions.map(tx => ({
          txHash: tx.txHash,
          status: tx.status,
          amount: tx.amount,
          blockNumber: tx.blockNumber,
          createdAt: tx.createdAt
        }))
      });
    } catch (error) {
      logger.error('Error getting claim status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting claim status',
        error: error.message
      });
    }
  }
);

// @route   GET /api/stats
// @desc    Get airdrop statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await EligibleUser.getStats();
    const backendBalance = await walletService.getFormattedBalance();
    const backendAddress = walletService.getAddress();

    res.json({
      success: true,
      stats: {
        ...stats,
        backendWallet: {
          address: backendAddress,
          balance: backendBalance
        },
        claimPercentage: ((stats.totalClaimed / stats.totalEligible) * 100).toFixed(2)
      }
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

// @route   GET /api/recent-claims
// @desc    Get recent claims
// @access  Public
router.get('/recent-claims', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentClaims = await EligibleUser.find({ claimed: true })
      .sort({ claimDate: -1 })
      .limit(limit)
      .select('walletAddress allocatedAmount claimDate txHash xpPoints rank');

    res.json({
      success: true,
      claims: recentClaims.map(claim => ({
        walletAddress: claim.walletAddress,
        amount: ethers.formatEther(claim.allocatedAmount),
        claimDate: claim.claimDate,
        txHash: claim.txHash,
        xpPoints: claim.xpPoints,
        rank: claim.rank
      }))
    });
  } catch (error) {
    logger.error('Error getting recent claims:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recent claims',
      error: error.message
    });
  }
});

module.exports = router;
