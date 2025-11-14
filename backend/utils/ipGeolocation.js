const axios = require('axios');
const logger = require('./logger');

/**
 * Check if IP is private/localhost
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if private/localhost
 */
function isPrivateIP(ip) {
  if (!ip) return true;
  
  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  
  // IPv4 localhost
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  
  // Private IPv4 ranges
  if (ip.startsWith('192.168.') || 
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')) {
    return true;
  }
  
  // IPv6 private ranges
  if (ip.startsWith('fc00:') || ip.startsWith('fe80:')) return true;
  
  return false;
}

/**
 * Get country name from IP address
 * Uses ip-api.com (free, no API key required, 45 requests/minute)
 * Fallback to ipapi.co if needed
 * @param {string} ipAddress - IP address to lookup
 * @returns {Promise<string|null>} - Country name or null if not found
 */
async function getCountryFromIP(ipAddress) {
  // Check if IP is private/localhost
  if (!ipAddress || ipAddress === 'Unknown' || isPrivateIP(ipAddress)) {
    return 'Local/Private';
  }

  try {
    // Try ip-api.com first (free, no API key, 45 req/min)
    try {
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,country`, {
        timeout: 5000
      });

      if (response.data && response.data.status === 'success' && response.data.country) {
        logger.info(`Country lookup successful for IP ${ipAddress}: ${response.data.country}`);
        return response.data.country;
      }
    } catch (ipApiError) {
      logger.warn(`ip-api.com lookup failed for ${ipAddress}, trying fallback:`, ipApiError.message);
    }

    // Fallback to ipapi.co (free tier: 1000 requests/day)
    try {
      const response = await axios.get(`https://ipapi.co/${ipAddress}/country_name/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.data && response.data.trim() && !response.data.includes('error')) {
        logger.info(`Country lookup successful (fallback) for IP ${ipAddress}: ${response.data.trim()}`);
        return response.data.trim();
      }
    } catch (ipapiError) {
      logger.warn(`ipapi.co lookup failed for ${ipAddress}:`, ipapiError.message);
    }

    logger.warn(`Could not determine country for IP: ${ipAddress}`);
    return 'Unknown';
  } catch (error) {
    logger.error(`Error getting country from IP ${ipAddress}:`, error);
    return 'Unknown';
  }
}

/**
 * Extract real IP address from request
 * Handles proxies, load balancers, and IPv6/IPv4
 * @param {object} req - Express request object
 * @returns {string} - IP address
 */
function getClientIP(req) {
  // Try multiple headers in order of preference
  let ip = null;
  
  // X-Forwarded-For (most common, can contain multiple IPs)
  if (req.headers['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'].split(',');
    // Get the first non-internal IP
    for (const addr of forwarded) {
      const trimmed = addr.trim();
      if (trimmed && !isPrivateIP(trimmed)) {
        ip = trimmed;
        break;
      }
    }
    // If all are private, use the first one
    if (!ip && forwarded.length > 0) {
      ip = forwarded[0].trim();
    }
  }
  
  // X-Real-IP (nginx proxy)
  if (!ip && req.headers['x-real-ip']) {
    ip = req.headers['x-real-ip'].trim();
  }
  
  // CF-Connecting-IP (Cloudflare)
  if (!ip && req.headers['cf-connecting-ip']) {
    ip = req.headers['cf-connecting-ip'].trim();
  }
  
  // X-Client-IP (some proxies)
  if (!ip && req.headers['x-client-ip']) {
    ip = req.headers['x-client-ip'].trim();
  }
  
  // Direct connection (req.ip works when trust proxy is enabled)
  if (!ip && req.ip) {
    ip = req.ip;
  }
  
  // Fallback to connection remote address
  if (!ip) {
    ip = req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.socket?.remote?.address ||
         'Unknown';
  }
  
  // Handle IPv6 mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Remove IPv6 brackets if present
  if (ip && ip.startsWith('[') && ip.endsWith(']')) {
    ip = ip.slice(1, -1);
  }
  
  return ip || 'Unknown';
}

module.exports = {
  getCountryFromIP,
  getClientIP,
  isPrivateIP
};

