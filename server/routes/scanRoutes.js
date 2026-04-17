const express = require('express');
const router = express.Router();
const ToolOrchestrator = require('../core/ToolOrchestrator');
const ResultAggregator = require('../core/ResultAggregator');
const { initializeTools } = require('../tools/toolRegistry');
const fetchService = require('../services/fetchService');
const ollamaService = require('../services/ollamaService');
const exportService = require('../services/exportService');
const rateLimiter = require('../middleware/rateLimiter');
const { generateScanId } = require('../utils/helpers');
const {
  validateNetworkRange,
  validateScanRequest,
  validateScanId,
  validateExportFormat
} = require('../middleware/validator');

const toolRegistry = initializeTools();
const orchestrator = new ToolOrchestrator(toolRegistry);
const aggregator = new ResultAggregator();

router.post(
  '/start',
  rateLimiter.middleware(),
  validateNetworkRange,
  validateScanRequest,
  async (req, res) => {
    const {
      networkRange,
      tools = ['nmap'],
      ollamaModel,
      rateLimitSeconds
    } = req.body;

    const scanId = generateScanId();

    if (rateLimitSeconds) {
      rateLimiter.setCooldown(rateLimitSeconds);
    }

    rateLimiter.markScanStart();

    res.json({
      success: true,
      scanId,
      message: 'Scan started',
      tools,
      networkRange
    });

    orchestrator.on('tool:progress', (data) => {
      console.log(`[${data.toolName}] ${data.message} - ${data.progress}%`);
    });

    orchestrator.on('tool:complete', (data) => {
      console.log(`[${data.toolName}] Completed`);
    });

    orchestrator.on('tool:error', (data) => {
      console.error(`[${data.toolName}] Error: ${data.error}`);
    });

    try {
      const scanResults = await orchestrator.executeScan(
        scanId,
        networkRange,
        tools,
        { ollamaModel }
      );

      const aggregatedResults = aggregator.aggregate(scanResults.tools);

      console.log('Fetching HTTP/HTTPS data...');
      const enrichedHosts = await fetchService.enrichHostsWithWebData(
        aggregatedResults.hosts
      );

      console.log('Running AI analysis...');
      const aiAnalysis = await ollamaService.analyzeAllHosts(
        enrichedHosts,
        ollamaModel
      );

      const finalHosts = enrichedHosts.map(host => {
        const analysis = aiAnalysis.find(a => a.ip === host.ip);
        return {
          ...host,
          analysis: analysis ? analysis.analysis : null
        };
      });

      const finalResults = {
        scanId,
        timestamp: scanResults.timestamp,
        networkRange,
        tools: Object.keys(scanResults.tools),
        hosts: finalHosts,
        metadata: {
          ...aggregatedResults.metadata,
          scanId,
          ollamaModel: ollamaModel || 'default'
        },
        summary: aggregator.generateSummary(finalHosts)
      };

      const resultsPath = require('path').join(
        process.cwd(),
        'data',
        'scans',
        scanId,
        'final_results.json'
      );
      
      await require('fs').promises.writeFile(
        resultsPath,
        JSON.stringify(finalResults, null, 2)
      );

      console.log(`Scan ${scanId} completed successfully`);

    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error);
    } finally {
      rateLimiter.markScanComplete();
    }
  }
);

router.get('/status/:scanId', validateScanId, async (req, res) => {
  const { scanId } = req.params;

  try {
    const status = await orchestrator.getScanStatus(scanId);

    if (!status) {
      return res.status(404).json({
        error: 'Scan not found',
        scanId
      });
    }

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get scan status',
      message: error.message
    });
  }
});

router.get('/results/:scanId', validateScanId, async (req, res) => {
  const { scanId } = req.params;

  try {
    const resultsPath = require('path').join(
      process.cwd(),
      'data',
      'scans',
      scanId,
      'final_results.json'
    );

    const data = await require('fs').promises.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(data);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'Scan results not found',
        scanId
      });
    }

    res.status(500).json({
      error: 'Failed to get scan results',
      message: error.message
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await orchestrator.getScanHistory();

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get scan history',
      message: error.message
    });
  }
});

router.delete('/:scanId', validateScanId, async (req, res) => {
  const { scanId } = req.params;

  try {
    const deleted = await orchestrator.deleteScan(scanId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Scan not found',
        scanId
      });
    }

    res.json({
      success: true,
      message: 'Scan deleted successfully',
      scanId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete scan',
      message: error.message
    });
  }
});

router.get(
  '/export/:scanId',
  validateScanId,
  validateExportFormat,
  async (req, res) => {
    const { scanId } = req.params;
    const { format = 'json' } = req.query;

    try {
      const resultsPath = require('path').join(
        process.cwd(),
        'data',
        'scans',
        scanId,
        'final_results.json'
      );

      const data = await require('fs').promises.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(data);

      const exportDir = require('path').join(
        process.cwd(),
        'data',
        'scans',
        scanId
      );

      const exportResult = await exportService.export(results, format, exportDir);

      res.json({
        success: true,
        ...exportResult
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to export scan results',
        message: error.message
      });
    }
  }
);

router.get('/rate-limit/status', (req, res) => {
  const status = rateLimiter.getStatus();
  res.json({
    success: true,
    ...status
  });
});

module.exports = router;
