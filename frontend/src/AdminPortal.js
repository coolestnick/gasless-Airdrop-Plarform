import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { adminAPI } from './services/api';
import './App.css';

function AdminPortal({ onBack }) {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [filterClaimed, setFilterClaimed] = useState(null);

  useEffect(() => {
    // Check if admin key is stored in localStorage
    const storedKey = localStorage.getItem('admin_key');
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
      loadDashboard(storedKey);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      toast.error('Please enter admin key');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminAPI.getDashboard(adminKey);
      setIsAuthenticated(true);
      localStorage.setItem('admin_key', adminKey);
      setDashboard(result.dashboard);
      loadUsers(adminKey, 1);
      toast.success('Admin access granted!');
    } catch (error) {
      toast.error(error.message || 'Invalid admin key');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey('');
    setDashboard(null);
    setUsers([]);
    localStorage.removeItem('admin_key');
    toast.success('Logged out successfully');
  };

  const loadDashboard = async (key) => {
    try {
      const result = await adminAPI.getDashboard(key);
      setDashboard(result.dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.status === 401) {
        handleLogout();
      }
    }
  };

  const loadUsers = async (key, page = 1, claimedFilter = null) => {
    try {
      const result = await adminAPI.getUsers(key, page, 50, claimedFilter !== null ? claimedFilter : filterClaimed);
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleExport = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    setIsExporting(true);
    try {
      await adminAPI.exportClaims(adminKey);
      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting:', error);
      if (error.status === 401) {
        toast.error('Unauthorized. Please login again.');
        handleLogout();
      } else {
        toast.error(error.message || 'Failed to export CSV');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (value) => {
    setFilterClaimed(value);
    loadUsers(adminKey, 1, value);
  };

  const handlePageChange = (page) => {
    loadUsers(adminKey, page);
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Toaster position="top-right" />
        <div className="container" style={{ maxWidth: '500px', margin: '100px auto' }}>
          <div className="main-card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>🔐 Admin Portal</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Enter your admin key to access the dashboard
              </p>
              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Admin Key"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ width: '100%' }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Authenticating...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Toaster position="top-right" />
      
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
                <p className="logo-subtitle">Admin Portal</p>
              </div>
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', gap: '0.5rem' }}>
            {onBack && (
              <button className="btn btn-secondary" onClick={onBack}>
                ← Back to App
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Dashboard Stats */}
        {dashboard && (
          <>
            <div className="hero">
              <h2>Admin Dashboard</h2>
              <p>Manage and export verified claims data</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Eligible</div>
                <div className="stat-value">
                  {dashboard.stats?.totalEligible?.toLocaleString()}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Claimed</div>
                <div className="stat-value">
                  {dashboard.stats?.totalClaimed?.toLocaleString()}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Claim Rate</div>
                <div className="stat-value">
                  {dashboard.stats?.claimPercentage}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Distributed</div>
                <div className="stat-value">
                  {parseFloat(dashboard.stats?.totalDistributed || 0).toFixed(2)} SHM
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="main-card" style={{ marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>📥 Export Verified Claims</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Download a CSV file containing all verified claims with wallet addresses, amounts, 
                  XP points, ranks, claim dates, transaction hashes, IP addresses, and countries.
                </p>
                <button
                  className="btn btn-success"
                  onClick={handleExport}
                  disabled={isExporting}
                  style={{ minWidth: '200px' }}
                >
                  {isExporting ? (
                    <>
                      <span className="spinner"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      📊 Download CSV Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="main-card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Users List</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn ${filterClaimed === null ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleFilterChange(null)}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      All
                    </button>
                    <button
                      className={`btn ${filterClaimed === true ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleFilterChange(true)}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Claimed
                    </button>
                    <button
                      className={`btn ${filterClaimed === false ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleFilterChange(false)}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Unclaimed
                    </button>
                  </div>
                </div>

                {users.length > 0 ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Wallet</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rank</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>XP</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Country</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Claim Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                {user.walletAddress?.slice(0, 10)}...{user.walletAddress?.slice(-8)}
                              </td>
                              <td style={{ padding: '0.75rem' }}>{user.allocatedAmount} SHM</td>
                              <td style={{ padding: '0.75rem' }}>#{user.rank}</td>
                              <td style={{ padding: '0.75rem' }}>{user.xpPoints}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    background: user.claimed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: user.claimed ? '#22c55e' : '#ef4444'
                                  }}
                                >
                                  {user.claimed ? '✓ Claimed' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem' }}>{user.country || 'Unknown'}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                {user.claimDate ? new Date(user.claimDate).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Previous
                        </button>
                        <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No users found
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPortal;

