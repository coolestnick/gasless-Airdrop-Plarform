const { ethers } = require('ethers');
const logger = require('../utils/logger');
const Transaction = require('../models/Transaction');

class WalletService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.initialized = false;
  }

  // Initialize wallet and provider
  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.RPC_URL) {
        throw new Error('RPC_URL is not defined in environment variables');
      }
      if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY is not defined in environment variables');
      }

      // Create provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

      // Verify chain ID
      if (Number(network.chainId) !== Number(process.env.CHAIN_ID)) {
        logger.warn(`Chain ID mismatch! Expected: ${process.env.CHAIN_ID}, Got: ${network.chainId}`);
      }

      // Create wallet
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.initialized = true; // Set initialized before calling getBalance
      logger.info(`Wallet initialized: ${this.wallet.address}`);

      // Check wallet balance
      const balance = await this.getBalance();
      logger.info(`Wallet balance: ${ethers.formatEther(balance)} SHM`);

      if (balance === 0n) {
        logger.warn('⚠️  WARNING: Wallet balance is 0! Please fund the wallet before processing claims.');
      }
      return true;
    } catch (error) {
      logger.error('Failed to initialize wallet service:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance() {
    if (!this.initialized) {
      throw new Error('Wallet service not initialized');
    }
    return await this.provider.getBalance(this.wallet.address);
  }

  // Get formatted balance
  async getFormattedBalance() {
    const balance = await this.getBalance();
    return ethers.formatEther(balance);
  }

  // Estimate gas for transaction
  async estimateGas(to, amount) {
    try {
      const tx = {
        to,
        value: amount
      };
      const gasEstimate = await this.provider.estimateGas(tx);
      const feeData = await this.provider.getFeeData();

      const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
      const gasCost = gasEstimate * gasPrice;

      return {
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        gasCost: gasCost,
        gasCostFormatted: ethers.formatEther(gasCost)
      };
    } catch (error) {
      logger.error('Gas estimation failed:', error);

      // Check if error is due to insufficient balance
      if (error.message?.includes('insufficient balance') ||
          error.info?.error?.message?.includes('insufficient balance')) {
        throw new Error('Backend wallet has insufficient SHM balance to process claims. Please fund the wallet.');
      }

      throw error;
    }
  }

  // Send native token (SHM) to address
  async sendNativeToken(toAddress, amount) {
    if (!this.initialized) {
      throw new Error('Wallet service not initialized');
    }

    try {
      logger.info(`Preparing to send ${ethers.formatEther(amount)} SHM to ${toAddress}`);

      // Check balance
      const balance = await this.getBalance();
      const gasEstimate = await this.estimateGas(toAddress, amount);
      const totalRequired = amount + gasEstimate.gasCost;

      if (balance < totalRequired) {
        throw new Error(
          `Insufficient balance. Required: ${ethers.formatEther(totalRequired)} SHM, ` +
          `Available: ${ethers.formatEther(balance)} SHM`
        );
      }

      // Get current nonce
      const nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');

      // Prepare transaction
      const tx = {
        to: toAddress,
        value: amount,
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice,
        nonce: nonce,
        chainId: Number(process.env.CHAIN_ID)
      };

      logger.info(`Sending transaction with nonce: ${nonce}`);

      // Send transaction
      const txResponse = await this.wallet.sendTransaction(tx);
      logger.info(`Transaction sent: ${txResponse.hash}`);

      // Save to database
      await Transaction.create({
        walletAddress: toAddress.toLowerCase(),
        txHash: txResponse.hash,
        amount: amount.toString(),
        status: 'pending'
      });

      // Wait for confirmation (1 block)
      logger.info(`Waiting for confirmation...`);
      const receipt = await txResponse.wait(1);

      if (receipt.status === 1) {
        logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

        // Update transaction in database
        await Transaction.findOneAndUpdate(
          { txHash: txResponse.hash },
          {
            status: 'confirmed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPaid: (receipt.gasUsed * receipt.gasPrice).toString()
          }
        );

        return {
          success: true,
          txHash: txResponse.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      logger.error('Error sending transaction:', error);

      // Update transaction as failed if it was created
      if (error.transaction?.hash) {
        await Transaction.findOneAndUpdate(
          { txHash: error.transaction.hash },
          {
            status: 'failed',
            error: error.message
          }
        );
      }

      throw error;
    }
  }

  // Send ERC20 tokens (if using ERC20 instead of native)
  async sendERC20Token(toAddress, amount, tokenAddress) {
    if (!this.initialized) {
      throw new Error('Wallet service not initialized');
    }

    try {
      // ERC20 ABI (minimal)
      const erc20ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, this.wallet);

      // Check token balance
      const tokenBalance = await tokenContract.balanceOf(this.wallet.address);
      if (tokenBalance < amount) {
        throw new Error(
          `Insufficient token balance. Required: ${amount.toString()}, ` +
          `Available: ${tokenBalance.toString()}`
        );
      }

      // Send tokens
      const tx = await tokenContract.transfer(toAddress, amount);
      logger.info(`ERC20 transfer transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);

      if (receipt.status === 1) {
        logger.info(`ERC20 transfer confirmed in block ${receipt.blockNumber}`);

        await Transaction.create({
          walletAddress: toAddress.toLowerCase(),
          txHash: tx.hash,
          amount: amount.toString(),
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });

        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        };
      } else {
        throw new Error('ERC20 transfer failed');
      }
    } catch (error) {
      logger.error('Error sending ERC20 tokens:', error);
      throw error;
    }
  }

  // Verify signature
  verifySignature(message, signature, address) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  // Get wallet address
  getAddress() {
    if (!this.initialized) {
      throw new Error('Wallet service not initialized');
    }
    return this.wallet.address;
  }

  // Check if address is valid
  isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

// Create singleton instance
const walletService = new WalletService();

module.exports = walletService;
