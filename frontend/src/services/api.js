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

// Admin API methods
export const adminAPI = {
  // Get admin dashboard data
  getDashboard: async (adminKey) => {
    return api.get('/admin/dashboard', {
      headers: {
        'x-admin-key': adminKey
      }
    });
  },

  // Export claims as CSV
  exportClaims: async (adminKey) => {
    const response = await axios.get(`${API_BASE_URL}/admin/export`, {
      headers: {
        'x-admin-key': adminKey
      },
      responseType: 'blob' // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'verified-claims.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  },

  // Get paginated users
  getUsers: async (adminKey, page = 1, limit = 50, claimed = null) => {
    const params = new URLSearchParams({ page, limit });
    if (claimed !== null) {
      params.append('claimed', claimed);
    }
    return api.get(`/admin/users?${params.toString()}`, {
      headers: {
        'x-admin-key': adminKey
      }
    });
  },
};

export default api;
