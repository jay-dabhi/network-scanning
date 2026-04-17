function generateScanId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `scan_${timestamp}_${random}`;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function parseIPRange(range) {
  const match = range.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)(\d{1,3})\/(\d{1,2})$/);
  
  if (!match) return null;

  const base = match[1];
  const lastOctet = parseInt(match[2]);
  const cidr = parseInt(match[3]);

  return {
    base,
    lastOctet,
    cidr,
    hostCount: Math.pow(2, 32 - cidr) - 2
  };
}

module.exports = {
  generateScanId,
  sanitizeFilename,
  formatBytes,
  formatDuration,
  parseIPRange
};
