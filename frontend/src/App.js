import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { airdropAPI } from './services/api';
import web3 from './utils/web3';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);

  // Load reCAPTCHA Enterprise script dynamically
  useEffect(() => {
    const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

    if (!recaptchaSiteKey) {
      console.error('reCAPTCHA site key is not configured');
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src*="recaptcha/enterprise.js"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${recaptchaSiteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const scriptElement = document.querySelector(`script[src*="recaptcha/enterprise.js"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
    loadStats();
    loadRecentClaims();

    // Set up listeners
    web3.onAccountsChanged(handleAccountsChanged);
    web3.onChainChanged(handleChainChanged);

    return () => {
      web3.removeListeners();
    };
  }, []);

  // Check eligibility when account changes
  useEffect(() => {
    if (account) {
      checkEligibility();
    } else {
      setEligibility(null);
    }
  }, [account]);

  const checkConnection = async () => {
    const currentAccount = await web3.getCurrentAccount();
    if (currentAccount) {
      setAccount(currentAccount);
      const correctNetwork = await web3.isCorrectNetwork();
      setIsCorrectNetwork(correctNetwork);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setEligibility(null);
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      if (!web3.isMetaMaskInstalled()) {
        toast.error('Please install MetaMask to continue', {
          icon: '🦊',
          duration: 5000,
        });
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      const address = await web3.connectWallet();
      setAccount(address);
      setIsCorrectNetwork(true);

      toast.success('Wallet connected successfully!', {
        icon: '🎉',
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);

      // Handle user rejection
      if (
        error.code === 4001 ||
        error.code === 'ACTION_REJECTED' ||
        error.message?.includes('rejected') ||
        error.message?.includes('denied')
      ) {
        toast.error('Wallet connection was cancelled.', {
          icon: '✋',
          duration: 3000,
        });
        return;
      }

      // Generic error
      toast.error(error.message || 'Failed to connect wallet. Please try again.', {
        icon: '❌',
        duration: 4000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToCorrectNetwork = async () => {
    try {
      await web3.switchNetwork();
      setIsCorrectNetwork(true);
      toast.success('Network switched successfully!', {
        icon: '✅',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error switching network:', error);

      // Handle user rejection
      if (
        error.code === 4001 ||
        error.code === 'ACTION_REJECTED' ||
        error.message?.includes('rejected') ||
        error.message?.includes('denied')
      ) {
        toast.error('Network switch was cancelled.', {
          icon: '✋',
          duration: 3000,
        });
        return;
      }

      // Generic error
      toast.error('Failed to switch network. Please switch manually in MetaMask.', {
        icon: '⚠️',
        duration: 5000,
      });
    }
  };

  const checkEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const result = await airdropAPI.checkEligibility(account);
      setEligibility(result);

      if (!result.eligible) {
        toast.error('This wallet is not eligible for the airdrop', {
          duration: 4000,
        });
      } else if (result.claimed) {
        toast.success('You have already claimed your rewards!', {
          icon: '✅',
          duration: 4000,
        });
      } else {
        toast.success(`You're eligible for ${result.amountFormatted} ${process.env.REACT_APP_CURRENCY_SYMBOL}!`, {
          icon: '🎁',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Failed to check eligibility');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const claimAirdrop = async () => {
    try {
      setIsClaiming(true);

      toast.loading('Verifying you are human...', {
        id: 'signing',
      });

      // Execute invisible reCAPTCHA Enterprise
      const captchaToken = await new Promise((resolve, reject) => {
        if (!window.grecaptcha || !window.grecaptcha.enterprise) {
          reject(new Error('reCAPTCHA Enterprise not loaded'));
          return;
        }

        window.grecaptcha.enterprise.ready(async () => {
          try {
            const token = await window.grecaptcha.enterprise.execute(
              process.env.REACT_APP_RECAPTCHA_SITE_KEY,
              { action: 'CLAIM_AIRDROP' }
            );
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });

      // Create simple message to sign (must match backend exactly)
      const message = `Claim airdrop for ${account}`;

      toast.loading('Please sign the message in your wallet...', {
        id: 'signing',
      });

      // Request signature
      const signature = await web3.signMessage(message);

      toast.loading('Processing your claim...', {
        id: 'signing',
      });

      // Submit claim with CAPTCHA token
      const result = await airdropAPI.claim(account, signature, captchaToken);

      toast.success('Airdrop claimed successfully!', {
        id: 'signing',
        icon: '🎉',
        duration: 6000,
      });

      // Update eligibility
      setEligibility({
        ...eligibility,
        claimed: true,
        txHash: result.txHash,
      });

      // Refresh stats and recent claims
      loadStats();
      loadRecentClaims();

      // Show transaction link
      setTimeout(() => {
        toast.success(
          (t) => (
            <div>
              <p>Transaction confirmed!</p>
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
                style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'inline-block' }}
              >
                View on Explorer →
              </a>
            </div>
          ),
          {
            duration: 8000,
            icon: '✅',
          }
        );
      }, 1000);
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      toast.dismiss('signing');

      // Handle MetaMask user rejection
      if (
        error.code === 'ACTION_REJECTED' ||
        error.code === 4001 ||
        error.message?.includes('user rejected') ||
        error.message?.includes('User denied') ||
        error.message?.includes('rejected')
      ) {
        toast.error('Signature request was cancelled. Please try again when ready.', {
          duration: 4000,
          icon: '✋',
        });
        return;
      }

      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('connection')) {
        toast.error('Network error. Please check your connection and try again.', {
          duration: 5000,
          icon: '🌐',
        });
        return;
      }

      // Handle already claimed
      if (error.message?.includes('already claimed')) {
        toast.error('This airdrop has already been claimed!', {
          duration: 5000,
          icon: '⚠️',
        });
        return;
      }

      // Handle invalid signature
      if (error.message?.includes('Invalid signature')) {
        toast.error('Signature verification failed. Please try again.', {
          duration: 5000,
          icon: '❌',
        });
        return;
      }

      // Handle service unavailable (503 - backend wallet funding)
      if (error.status === 503 || error.message?.includes('being funded')) {
        toast.error('Airdrop service is currently being funded. Please try again in a few minutes.', {
          duration: 6000,
          icon: '⏳',
        });
        return;
      }

      // Handle insufficient balance (backend wallet)
      if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
        toast.error('Service temporarily unavailable. Please try again later.', {
          duration: 6000,
          icon: '⚠️',
        });
        return;
      }

      // Generic error fallback
      toast.error(error.message || 'Failed to claim airdrop. Please try again.', {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await airdropAPI.getStats();
      setStats(result.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentClaims = async () => {
    try {
      const result = await airdropAPI.getRecentClaims(5);
      setRecentClaims(result.claims);
    } catch (error) {
      console.error('Error loading recent claims:', error);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    toast.success('Address copied!', { duration: 2000 });
  };

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <div className="logo-icon">
                <img
                  src={process.env.PUBLIC_URL + '/Shardeum New Logo.png'}
                  alt="Shardeum Logo"
                  style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                />
              </div>
              <div className="logo-text">
                <h1>SHARDEUM</h1>
                <p className="logo-subtitle">Gasless Rewards</p>
              </div>
            </div>
            <div className="network-badge">
              <span className="network-dot"></span>
              Shardeum Mainnet
            </div>
          </div>

          <div className="header-right">
            {account ? (
              <div className="connected-badge">
                <div className="wallet-badge">
                  <div className="wallet-avatar">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.2"/>
                      <circle cx="8" cy="6" r="3" fill="currentColor"/>
                      <path d="M3 13C3 10.5 5 9 8 9C11 9 13 10.5 13 13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <span className="wallet-address-display">{web3.formatAddress(account)}</span>
                </div>
                <button className="btn-icon" onClick={copyAddress} title="Copy address">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M3 11V3C3 2.5 3.5 2 4 2H10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                className="btn btn-connect"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="spinner"></span>
                    Connecting
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M15 6L13 4L9 8L5 4L3 6L9 12L15 6Z" fill="currentColor"/>
                    </svg>
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Hero Section */}
        <div className="hero">
          <h2>Welcome to Shardeum Rewards</h2>
          <p>
            Connect your wallet to check your eligibility and claim your airdrop rewards.
            All transactions are gasless!
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Eligible</div>
              <div className="stat-value">{stats.totalEligible?.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Claims Made</div>
              <div className="stat-value">{stats.totalClaimed?.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Claim Rate</div>
              <div className="stat-value">{stats.claimPercentage}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Distributed</div>
              <div className="stat-value">
                {parseFloat(stats.totalDistributed).toFixed(2)} SHM
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="main-card">
          {!account ? (
            // Not Connected
            <div className="wallet-section">
              <div className="connect-prompt">
                <h3>Connect Your Wallet</h3>
                <p>Connect your wallet to check if you're eligible for the airdrop</p>
                <button
                  className="btn btn-primary"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  style={{ minWidth: '200px' }}
                >
                  {isConnecting ? (
                    <>
                      <span className="spinner"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      🦊 Connect MetaMask
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : !isCorrectNetwork ? (
            // Wrong Network
            <div className="network-warning">
              <p>⚠️ Please switch to Shardeum Mainnet</p>
              <button className="btn btn-warning" onClick={switchToCorrectNetwork}>
                Switch Network
              </button>
            </div>
          ) : (
            // Connected
            <div>
              {/* Wallet Info */}
              <div className="connected-wallet">
                <div className="wallet-info">
                  <div className="wallet-address">
                    <div className="wallet-icon">👛</div>
                    <div className="address-text">
                      <h4>Connected Wallet</h4>
                      <div className="address">{web3.formatAddress(account)}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary" onClick={copyAddress}>
                    📋 Copy Address
                  </button>
                </div>
              </div>

              {/* Eligibility Check Loading */}
              {isCheckingEligibility && (
                <div className="status-message status-info">
                  <span className="spinner"></span>
                  Checking eligibility...
                </div>
              )}

              {/* Eligibility Results */}
              {eligibility && !isCheckingEligibility && (
                <div className="claim-section">
                  {eligibility.eligible ? (
                    <>
                      {/* Eligible - Not Claimed */}
                      {!eligibility.claimed ? (
                        <>
                          <div className="eligibility-info">
                            <div className="reward-amount">
                              {eligibility.amountFormatted} {process.env.REACT_APP_CURRENCY_SYMBOL}
                            </div>
                            <div className="reward-label">Your Reward Amount</div>

                            <div className="user-rank">
                              <div className="rank-item">
                                <div className="rank-value">#{eligibility.rank}</div>
                                <div className="rank-label">Rank</div>
                              </div>
                              <div className="rank-item">
                                <div className="rank-value">{eligibility.xpPoints}</div>
                                <div className="rank-label">XP Points</div>
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-success"
                            onClick={claimAirdrop}
                            disabled={isClaiming}
                            style={{ minWidth: '200px', fontSize: '1.125rem', padding: '1rem 2rem' }}
                          >
                            {isClaiming ? (
                              <>
                                <span className="spinner"></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                🎁 Claim Airdrop
                              </>
                            )}
                          </button>

                          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            💡 You won't pay any gas fees. We cover it for you!
                          </p>
                        </>
                      ) : (
                        // Already Claimed
                        <>
                          <div className="status-message status-success">
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <div>
                              <strong>Airdrop Already Claimed!</strong>
                              <br />
                              <small>
                                Claimed on {new Date(eligibility.claimDate).toLocaleDateString()}
                              </small>
                            </div>
                          </div>

                          <div className="eligibility-info">
                            <div className="reward-amount">
                              {eligibility.amountFormatted} {process.env.REACT_APP_CURRENCY_SYMBOL}
                            </div>
                            <div className="reward-label">Amount Claimed</div>
                          </div>

                          {eligibility.txHash && (
                            <a
                              href={`${process.env.REACT_APP_BLOCK_EXPLORER}/tx/${eligibility.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ marginTop: '1rem' }}
                            >
                              View Transaction →
                            </a>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    // Not Eligible
                    <div className="status-message status-error">
                      <span style={{ fontSize: '1.5rem' }}>❌</span>
                      <div>
                        <strong>Not Eligible</strong>
                        <br />
                        <small>This wallet is not eligible for the airdrop</small>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Claims */}
        {recentClaims.length > 0 && (
          <div className="recent-claims">
            <h3>🔥 Recent Claims</h3>
            <div className="claims-list">
              {recentClaims.map((claim, index) => (
                <div key={index} className="claim-item">
                  <div>
                    <span className="claim-address">
                      {web3.formatAddress(claim.walletAddress)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      • Rank #{claim.rank}
                    </span>
                  </div>
                  <div className="claim-amount">
                    {claim.amount} {process.env.REACT_APP_CURRENCY_SYMBOL}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Powered by Shardeum • Gasless Airdrop System
        </p>
      </footer>
    </div>
  );
}

export default App;
