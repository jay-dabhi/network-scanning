const ToolInterface = require('../../core/ToolInterface');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class NmapTool extends ToolInterface {
  constructor(config = {}) {
    super(config);
    this.name = 'nmap';
    this.version = '';
    this.enabled = true;
  }

  async validate() {
    try {
      const version = await this.getVersion();
      this.version = version;
      return true;
    } catch (error) {
      console.error('Nmap validation failed:', error.message);
      return false;
    }
  }

  async getVersion() {
    return new Promise((resolve, reject) => {
      const process = spawn('nmap', ['--version']);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          const match = output.match(/Nmap version ([\d.]+)/);
          resolve(match ? match[1] : 'unknown');
        } else {
          reject(new Error('Nmap not found or not executable'));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to execute nmap: ${error.message}`));
      });
    });
  }

  async execute(targets, options = {}) {
    this.updateStatus('running');
    const outputDir = options.outputDir || './data/scans/default/nmap';

    await fs.mkdir(outputDir, { recursive: true });

    const targetsFile = path.join(outputDir, 'targets.txt');
    const outputFile = path.join(outputDir, 'full_scan.xml');

    try {
      this.updateProgress(10, 'Discovering hosts...');
      const discoveredHosts = await this.discoverHosts(targets, outputDir);

      if (discoveredHosts.length === 0) {
        throw new Error('No hosts discovered in the specified range');
      }

      await fs.writeFile(targetsFile, discoveredHosts.join('\n'));

      this.updateProgress(30, `Scanning ports on ${discoveredHosts.length} host(s)...`);
      await this.scanPorts(targetsFile, outputFile);

      this.updateProgress(90, 'Parsing results...');
      
      this.updateProgress(100, 'Scan complete');
      this.updateStatus('completed');

      return {
        targetsFile,
        outputFile,
        hostsCount: discoveredHosts.length
      };

    } catch (error) {
      this.updateStatus('failed');
      throw error;
    }
  }

  async discoverHosts(networkRange, outputDir) {
    return new Promise((resolve, reject) => {
      const args = ['-sn', networkRange, '-oG', '-'];
      
      const nmapProcess = spawn('nmap', args);
      this.currentProcess = nmapProcess;

      let output = '';
      let errorOutput = '';

      nmapProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      nmapProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      nmapProcess.on('close', (code) => {
        this.currentProcess = null;

        if (code !== 0) {
          reject(new Error(`Nmap discovery failed: ${errorOutput}`));
          return;
        }

        const hosts = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
          if (line.includes('Status: Up')) {
            const match = line.match(/Host: ([\d.]+)/);
            if (match) {
              hosts.push(match[1]);
            }
          }
        }

        resolve(hosts);
      });

      nmapProcess.on('error', (error) => {
        this.currentProcess = null;
        reject(new Error(`Failed to execute nmap: ${error.message}`));
      });
    });
  }

  async scanPorts(targetsFile, outputFile) {
    return new Promise((resolve, reject) => {
      const args = [
        '-iL', targetsFile,
        '-p-',
        '-sS',
        '-sV',
        '-O',
        '-T4',
        '--max-retries', '1',
        '-oX', outputFile
      ];

      const nmapProcess = spawn('sudo', ['nmap', ...args]);
      this.currentProcess = nmapProcess;

      let errorOutput = '';
      let lastProgress = 30;

      nmapProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        const percentMatch = output.match(/(\d+\.\d+)% done/);
        if (percentMatch) {
          const scanProgress = parseFloat(percentMatch[1]);
          const overallProgress = 30 + (scanProgress * 0.6);
          
          if (overallProgress > lastProgress + 5) {
            this.updateProgress(Math.floor(overallProgress), `Scanning ports... ${scanProgress.toFixed(1)}%`);
            lastProgress = overallProgress;
          }
        }
      });

      nmapProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      nmapProcess.on('close', (code) => {
        this.currentProcess = null;

        if (code !== 0) {
          reject(new Error(`Nmap port scan failed: ${errorOutput}`));
          return;
        }

        this.updateProgress(90, 'Scan completed, parsing results...');
        resolve(outputFile);
      });

      nmapProcess.on('error', (error) => {
        this.currentProcess = null;
        reject(new Error(`Failed to execute nmap: ${error.message}`));
      });
    });
  }

  getParser() {
    return require('./NmapParser');
  }
}

module.exports = NmapTool;
