import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// API methods
export const airdropAPI = {
  // Check eligibility
  checkEligibility: async (walletAddress) => {
    return api.post('/check-eligibility', { walletAddress });
  },

  // Claim airdrop
  claim: async (walletAddress, signature, captchaToken) => {
    return api.post('/claim', { walletAddress, signature, captchaToken });
  },

  // Get claim status
  getClaimStatus: async (address) => {
    return api.get(`/claim-status/${address}`);
  },

  // Get statistics
  getStats: async () => {
    return api.get('/stats');
  },

  // Get recent claims
  getRecentClaims: async (limit = 10) => {
    return api.get(`/recent-claims?limit=${limit}`);
  },
};

export default api;
