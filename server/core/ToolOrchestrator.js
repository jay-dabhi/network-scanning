const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class ToolOrchestrator extends EventEmitter {
  constructor(toolRegistry, config = {}) {
    super();
    this.toolRegistry = toolRegistry;
    this.config = config;
    this.activeScan = null;
    this.scanResults = new Map();
  }

  async executeScan(scanId, targets, toolNames = [], options = {}) {
    this.activeScan = {
      scanId,
      targets,
      toolNames,
      startTime: Date.now(),
      status: 'running',
      toolResults: {}
    };

    this.emit('scan:start', { scanId, toolNames });

    const scanDir = path.join(process.cwd(), 'data', 'scans', scanId);
    await fs.mkdir(scanDir, { recursive: true });

    const results = {
      scanId,
      timestamp: new Date().toISOString(),
      targets,
      tools: {},
      errors: []
    };

    for (const toolName of toolNames) {
      try {
        const tool = this.toolRegistry[toolName];
        
        if (!tool) {
          throw new Error(`Tool ${toolName} not found in registry`);
        }

        if (!tool.isEnabled()) {
          console.log(`Tool ${toolName} is disabled, skipping...`);
          continue;
        }

        const isValid = await tool.validate();
        if (!isValid) {
          throw new Error(`Tool ${toolName} validation failed`);
        }

        this.emit('tool:start', { scanId, toolName });

        tool.on('progress', (data) => {
          this.emit('tool:progress', { scanId, toolName, ...data });
        });

        const toolDir = path.join(scanDir, toolName);
        await fs.mkdir(toolDir, { recursive: true });

        const toolResult = await tool.execute(targets, {
          ...options,
          outputDir: toolDir,
          previousResults: results.tools
        });

        const parser = tool.getParser();
        const parsedResult = await parser.parse(toolResult, toolDir);

        results.tools[toolName] = parsedResult;
        this.activeScan.toolResults[toolName] = parsedResult;

        this.emit('tool:complete', { scanId, toolName, result: parsedResult });

      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        results.errors.push({
          tool: toolName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        this.emit('tool:error', { scanId, toolName, error: error.message });
      }
    }

    const resultsPath = path.join(scanDir, 'results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    this.scanResults.set(scanId, results);
    this.activeScan.status = 'completed';
    this.activeScan.endTime = Date.now();

    this.emit('scan:complete', { scanId, results });

    return results;
  }

  async getScanStatus(scanId) {
    if (this.activeScan && this.activeScan.scanId === scanId) {
      return {
        scanId,
        status: this.activeScan.status,
        startTime: this.activeScan.startTime,
        toolResults: this.activeScan.toolResults,
        elapsedTime: Date.now() - this.activeScan.startTime
      };
    }

    if (this.scanResults.has(scanId)) {
      return {
        scanId,
        status: 'completed',
        results: this.scanResults.get(scanId)
      };
    }

    const scanDir = path.join(process.cwd(), 'data', 'scans', scanId);
    const resultsPath = path.join(scanDir, 'results.json');

    try {
      const data = await fs.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(data);
      return {
        scanId,
        status: 'completed',
        results
      };
    } catch (error) {
      return null;
    }
  }

  async getScanHistory() {
    const scansDir = path.join(process.cwd(), 'data', 'scans');
    
    try {
      const scanDirs = await fs.readdir(scansDir);
      const history = [];

      for (const scanId of scanDirs) {
        const resultsPath = path.join(scansDir, scanId, 'results.json');
        try {
          const data = await fs.readFile(resultsPath, 'utf-8');
          const results = JSON.parse(data);
          history.push({
            scanId,
            timestamp: results.timestamp,
            toolCount: Object.keys(results.tools).length,
            hasErrors: results.errors.length > 0
          });
        } catch (error) {
          console.error(`Error reading scan ${scanId}:`, error);
        }
      }

      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }

  async deleteScan(scanId) {
    const scanDir = path.join(process.cwd(), 'data', 'scans', scanId);
    
    try {
      await fs.rm(scanDir, { recursive: true, force: true });
      this.scanResults.delete(scanId);
      return true;
    } catch (error) {
      console.error(`Error deleting scan ${scanId}:`, error);
      return false;
    }
  }

  getActiveTools() {
    return Object.keys(this.toolRegistry)
      .map(name => {
        const tool = this.toolRegistry[name];
        return {
          name: tool.getName(),
          version: tool.getVersion(),
          enabled: tool.isEnabled()
        };
      });
  }
}

module.exports = ToolOrchestrator;
