require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    defaultModel: process.env.DEFAULT_MODEL || 'mistral',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 120000
  },

  network: {
    defaultRange: process.env.DEFAULT_NETWORK || '192.168.1.0/24',
    privateRanges: [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/
    ]
  },

  scan: {
    rateLimitSeconds: parseInt(process.env.RATE_LIMIT_SECONDS) || 60,
    maxConcurrentScans: parseInt(process.env.MAX_CONCURRENT_SCANS) || 1,
    resultRetentionDays: parseInt(process.env.RESULT_RETENTION_DAYS) || 30
  },

  fetch: {
    timeout: parseInt(process.env.FETCH_TIMEOUT) || 5000,
    ports: {
      http: [80, 3000, 5000, 8000, 8080],
      https: [443, 8443]
    },
    maxRedirects: 3,
    previewLength: 500
  },

  data: {
    scansDir: process.env.SCANS_DIR || './data/scans',
    cacheDir: process.env.CACHE_DIR || './data/cache'
  },

  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    tokenExpiry: process.env.TOKEN_EXPIRY || '24h'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};

function validatePrivateIP(ip) {
  return config.network.privateRanges.some(regex => regex.test(ip));
}

function isNetworkRangeValid(range) {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  return cidrRegex.test(range);
}

module.exports = {
  ...config,
  validatePrivateIP,
  isNetworkRangeValid
};
