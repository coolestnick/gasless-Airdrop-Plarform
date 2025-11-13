const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const EligibleUser = require('../models/EligibleUser');
const Transaction = require('../models/Transaction');
const walletService = require('../services/walletService');
const logger = require('../utils/logger');

// Simple admin authentication (you should implement proper auth in production)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
};

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await EligibleUser.getStats();
    const backendBalance = await walletService.getFormattedBalance();
    const backendAddress = walletService.getAddress();

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(20);

    // Failed transactions
    const failedTransactions = await Transaction.find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(10);

    // Top claimers
    const topClaimers = await EligibleUser.find({ claimed: true })
      .sort({ allocatedAmount: -1 })
      .limit(10)
      .select('walletAddress allocatedAmount xpPoints rank claimDate');

    // Claims by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const claimsByDay = await EligibleUser.aggregate([
      {
        $match: {
          claimed: true,
          claimDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$claimDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$allocatedAmount' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          ...stats,
          backendWallet: {
            address: backendAddress,
            balance: backendBalance
          },
          claimPercentage: ((stats.totalClaimed / stats.totalEligible) * 100).toFixed(2)
        },
        recentTransactions: recentTransactions.map(tx => ({
          txHash: tx.txHash,
          walletAddress: tx.walletAddress,
          amount: ethers.formatEther(tx.amount),
          status: tx.status,
          createdAt: tx.createdAt,
          blockNumber: tx.blockNumber
        })),
        failedTransactions: failedTransactions.map(tx => ({
          txHash: tx.txHash,
          walletAddress: tx.walletAddress,
          error: tx.error,
          createdAt: tx.createdAt
        })),
        topClaimers: topClaimers.map(user => ({
          walletAddress: user.walletAddress,
          amount: ethers.formatEther(user.allocatedAmount),
          rank: user.rank,
          xpPoints: user.xpPoints,
          claimDate: user.claimDate
        })),
        claimsByDay
      }
    });
  } catch (error) {
    logger.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting dashboard data',
      error: error.message
    });
  }
});

// @route   POST /api/admin/pause
// @desc    Pause/unpause claiming
// @access  Private
router.post('/pause', adminAuth, async (req, res) => {
  try {
    // In production, you'd want to implement this with a database flag
    // For now, we'll return a success message
    res.json({
      success: true,
      message: 'Pause functionality not yet implemented. Please stop the server to pause claims.'
    });
  } catch (error) {
    logger.error('Error pausing claims:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing claims',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get paginated list of eligible users
// @access  Private
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const claimed = req.query.claimed;

    const query = {};
    if (claimed !== undefined) {
      query.claimed = claimed === 'true';
    }

    const users = await EligibleUser.find(query)
      .sort({ rank: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await EligibleUser.countDocuments(query);

    res.json({
      success: true,
      users: users.map(user => ({
        walletAddress: user.walletAddress,
        allocatedAmount: ethers.formatEther(user.allocatedAmount),
        xpPoints: user.xpPoints,
        rank: user.rank,
        claimed: user.claimed,
        claimDate: user.claimDate,
        txHash: user.txHash,
        attempts: user.attempts
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit
      }
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
});

// @route   GET /api/admin/export
// @desc    Export claims data as CSV
// @access  Private
router.get('/export', adminAuth, async (req, res) => {
  try {
    const users = await EligibleUser.find({ claimed: true })
      .sort({ claimDate: -1 });

    // Generate CSV
    const csvRows = [
      'Wallet Address,Amount,XP Points,Rank,Claim Date,Transaction Hash'
    ];

    users.forEach(user => {
      csvRows.push(
        `${user.walletAddress},${ethers.formatEther(user.allocatedAmount)},${user.xpPoints},${user.rank},${user.claimDate},${user.txHash}`
      );
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=claims-export.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting claims:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting claims',
      error: error.message
    });
  }
});

module.exports = router;
