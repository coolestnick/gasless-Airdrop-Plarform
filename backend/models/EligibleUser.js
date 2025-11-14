const mongoose = require('mongoose');

const eligibleUserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: props => `${props.value} is not a valid Ethereum address!`
    }
  },
  allocatedAmount: {
    type: String, // Store as string to handle BigNumber
    required: true
  },
  xpPoints: {
    type: Number,
    required: true,
    default: 0
  },
  rank: {
    type: Number,
    required: true
  },
  claimed: {
    type: Boolean,
    default: false,
    index: true
  },
  claimDate: {
    type: Date,
    default: null
  },
  txHash: {
    type: String,
    default: null
  },
  signature: {
    type: String,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
eligibleUserSchema.index({ walletAddress: 1, claimed: 1 });

// Methods
eligibleUserSchema.methods.markAsClaimed = function(txHash, ipAddress = null, country = null) {
  this.claimed = true;
  this.claimDate = new Date();
  this.txHash = txHash;
  if (ipAddress) {
    this.ipAddress = ipAddress;
  }
  if (country) {
    this.country = country;
  }
  return this.save();
};

eligibleUserSchema.methods.incrementAttempt = function() {
  this.attempts += 1;
  this.lastAttempt = new Date();
  return this.save();
};

// Statics
eligibleUserSchema.statics.findByAddress = function(address) {
  return this.findOne({ walletAddress: address.toLowerCase() });
};

eligibleUserSchema.statics.getStats = async function() {
  const totalEligible = await this.countDocuments();
  const totalClaimed = await this.countDocuments({ claimed: true });
  const totalUnclaimed = totalEligible - totalClaimed;

  const totalAllocated = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $toDouble: '$allocatedAmount' } }
      }
    }
  ]);

  const totalDistributed = await this.aggregate([
    {
      $match: { claimed: true }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $toDouble: '$allocatedAmount' } }
      }
    }
  ]);

  return {
    totalEligible,
    totalClaimed,
    totalUnclaimed,
    totalAllocated: totalAllocated[0]?.total || 0,
    totalDistributed: totalDistributed[0]?.total || 0
  };
};

const EligibleUser = mongoose.model('EligibleUser', eligibleUserSchema);

module.exports = EligibleUser;
