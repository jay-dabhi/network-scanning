const config = require('../config/config');

function validateNetworkRange(req, res, next) {
  const { networkRange } = req.body;

  if (!networkRange) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'networkRange is required'
    });
  }

  if (!config.isNetworkRangeValid(networkRange)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid network range format. Expected format: x.x.x.x/xx (e.g., 192.168.1.0/24)'
    });
  }

  const ipMatch = networkRange.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/);
  if (ipMatch) {
    const testIP = `${ipMatch[1]}.${ipMatch[2]}.${ipMatch[3]}.${ipMatch[4]}`;
    if (!config.validatePrivateIP(testIP)) {
      return res.status(403).json({
        error: 'Validation failed',
        message: 'Only private IP ranges are allowed (10.x.x.x, 172.16-31.x.x, 192.168.x.x)',
        providedRange: networkRange
      });
    }
  }

  next();
}

function validateScanRequest(req, res, next) {
  const { tools, ollamaModel } = req.body;

  if (tools && !Array.isArray(tools)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'tools must be an array'
    });
  }

  if (tools && tools.length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'At least one tool must be specified'
    });
  }

  if (ollamaModel && typeof ollamaModel !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'ollamaModel must be a string'
    });
  }

  next();
}

function validateToolName(req, res, next) {
  const { toolName } = req.params;

  if (!toolName || !/^[a-zA-Z0-9_-]+$/.test(toolName)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid tool name'
    });
  }

  next();
}

function validateScanId(req, res, next) {
  const { scanId } = req.params;

  if (!scanId || !/^[a-zA-Z0-9_-]+$/.test(scanId)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid scan ID'
    });
  }

  next();
}

function validateExportFormat(req, res, next) {
  const { format } = req.query;

  const validFormats = ['json', 'csv', 'html'];

  if (format && !validFormats.includes(format.toLowerCase())) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Invalid export format. Supported formats: ${validFormats.join(', ')}`
    });
  }

  next();
}

module.exports = {
  validateNetworkRange,
  validateScanRequest,
  validateToolName,
  validateScanId,
  validateExportFormat
};
