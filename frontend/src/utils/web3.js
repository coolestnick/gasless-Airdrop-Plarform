import { ethers } from 'ethers';

const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID);
const CHAIN_NAME = process.env.REACT_APP_CHAIN_NAME;
const RPC_URL = process.env.REACT_APP_RPC_URL;
const BLOCK_EXPLORER = process.env.REACT_APP_BLOCK_EXPLORER;
const CURRENCY_SYMBOL = process.env.REACT_APP_CURRENCY_SYMBOL;

export const NETWORK_CONFIG = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: {
    name: CURRENCY_SYMBOL,
    symbol: CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [BLOCK_EXPLORER],
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

// Get provider
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

// Connect wallet
export const connectWallet = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('Please install MetaMask to use this feature');
    }

    const provider = getProvider();

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];

    // Check if on correct network
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      await switchNetwork();
    }

    return address;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Switch to correct network
export const switchNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add network to MetaMask');
      }
    } else {
      throw new Error('Failed to switch network');
    }
  }
};

// Get current account
export const getCurrentAccount = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Sign message
export const signMessage = async (message) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

// Format address (0x1234...5678)
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Check if on correct network
export const isCorrectNetwork = async () => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return Number(network.chainId) === CHAIN_ID;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Listen to account changes
export const onAccountsChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen to chain changes
export const onChainChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

// Remove listeners
export const removeListeners = () => {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};

export default {
  isMetaMaskInstalled,
  connectWallet,
  switchNetwork,
  getCurrentAccount,
  signMessage,
  formatAddress,
  isCorrectNetwork,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
  NETWORK_CONFIG,
};
