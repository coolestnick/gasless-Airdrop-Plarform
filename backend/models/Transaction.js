const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  gasUsed: {
    type: String,
    default: '0'
  },
  gasPaid: {
    type: String,
    default: '0'
  },
  blockNumber: {
    type: Number,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ walletAddress: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Methods
transactionSchema.methods.markAsConfirmed = function(blockNumber, gasUsed) {
  this.status = 'confirmed';
  this.blockNumber = blockNumber;
  this.gasUsed = gasUsed;
  return this.save();
};

transactionSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// Statics
transactionSchema.statics.findByTxHash = function(txHash) {
  return this.findOne({ txHash });
};

transactionSchema.statics.findByAddress = function(address) {
  return this.find({ walletAddress: address.toLowerCase() })
    .sort({ createdAt: -1 });
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
