const config = require('../config/config');

class RateLimiter {
  constructor() {
    this.lastScanTime = null;
    this.cooldownSeconds = config.scan.rateLimitSeconds;
    this.activeScan = false;
  }

  middleware() {
    return (req, res, next) => {
      if (this.activeScan) {
        return res.status(429).json({
          error: 'A scan is currently in progress',
          message: 'Please wait for the current scan to complete',
          activeScan: true
        });
      }

      if (this.lastScanTime) {
        const now = Date.now();
        const elapsedSeconds = (now - this.lastScanTime) / 1000;
        const remainingSeconds = this.cooldownSeconds - elapsedSeconds;

        if (remainingSeconds > 0) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Please wait ${Math.ceil(remainingSeconds)} seconds before starting another scan`,
            retryAfter: Math.ceil(remainingSeconds),
            cooldownSeconds: this.cooldownSeconds
          });
        }
      }

      next();
    };
  }

  markScanStart() {
    this.activeScan = true;
    this.lastScanTime = Date.now();
  }

  markScanComplete() {
    this.activeScan = false;
  }

  reset() {
    this.lastScanTime = null;
    this.activeScan = false;
  }

  setCooldown(seconds) {
    this.cooldownSeconds = seconds;
  }

  getStatus() {
    const now = Date.now();
    const elapsedSeconds = this.lastScanTime 
      ? (now - this.lastScanTime) / 1000 
      : null;
    const remainingSeconds = elapsedSeconds 
      ? Math.max(0, this.cooldownSeconds - elapsedSeconds)
      : 0;

    return {
      activeScan: this.activeScan,
      lastScanTime: this.lastScanTime,
      cooldownSeconds: this.cooldownSeconds,
      remainingSeconds: Math.ceil(remainingSeconds),
      canScan: !this.activeScan && remainingSeconds === 0
    };
  }
}

module.exports = new RateLimiter();
