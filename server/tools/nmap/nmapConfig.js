const nmapConfig = {
  timeout: 3600000,
  retries: 1,
  timing: 'T4',
  
  discoveryOptions: {
    defaultArgs: ['-sn'],
    pingTypes: ['PE', 'PP', 'PM'],
    skipHostDiscovery: false
  },

  scanOptions: {
    portRange: '1-65535',
    scanType: '-sS',
    versionDetection: true,
    osDetection: true,
    aggressiveScan: false,
    scriptScan: false,
    defaultScripts: ['default', 'vuln']
  },

  performance: {
    minParallelism: 10,
    maxParallelism: 100,
    minRttTimeout: '100ms',
    maxRttTimeout: '1000ms',
    maxRetries: 1
  },

  output: {
    formats: ['xml'],
    verbosity: 1,
    debugging: 0
  }
};

module.exports = nmapConfig;
