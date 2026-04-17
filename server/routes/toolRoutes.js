const express = require('express');
const router = express.Router();
const { validateAllTools, getTool, getAllTools } = require('../tools/toolRegistry');
const {
  getToolConfig,
  setToolEnabled,
  updateToolConfig
} = require('../config/toolsConfig');
const config = require('../config/config');
const { validateToolName } = require('../middleware/validator');

router.get('/', async (req, res) => {
  try {
    const tools = getAllTools();
    const validation = await validateAllTools();

    const toolsWithStatus = tools.map(tool => ({
      ...tool,
      installed: validation[tool.name]?.valid || false,
      version: validation[tool.name]?.version || tool.version,
      config: getToolConfig(tool.name)
    }));

    res.json({
      success: true,
      tools: toolsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tools',
      message: error.message
    });
  }
});

router.get('/:toolName', validateToolName, async (req, res) => {
  const { toolName } = req.params;

  try {
    const tool = getTool(toolName);
    
    if (!tool) {
      return res.status(404).json({
        error: 'Tool not found',
        toolName
      });
    }

    const isValid = await tool.validate();

    res.json({
      success: true,
      tool: {
        name: tool.getName(),
        version: tool.getVersion(),
        enabled: tool.isEnabled(),
        installed: isValid,
        status: tool.status,
        config: getToolConfig(toolName)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tool info',
      message: error.message
    });
  }
});

router.get('/:toolName/config', validateToolName, (req, res) => {
  const { toolName } = req.params;

  try {
    const toolConfig = getToolConfig(toolName);

    if (!toolConfig) {
      return res.status(404).json({
        error: 'Tool configuration not found',
        toolName
      });
    }

    res.json({
      success: true,
      toolName,
      config: toolConfig
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tool config',
      message: error.message
    });
  }
});

router.put('/:toolName/config', validateToolName, (req, res) => {
  const { toolName } = req.params;
  const updates = req.body;

  try {
    const updatedConfig = updateToolConfig(toolName, updates);

    if (!updatedConfig) {
      return res.status(404).json({
        error: 'Tool not found',
        toolName
      });
    }

    res.json({
      success: true,
      toolName,
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update tool config',
      message: error.message
    });
  }
});

router.post('/:toolName/validate', validateToolName, async (req, res) => {
  const { toolName } = req.params;

  try {
    const tool = getTool(toolName);

    if (!tool) {
      return res.status(404).json({
        error: 'Tool not found',
        toolName
      });
    }

    const isValid = await tool.validate();

    res.json({
      success: true,
      toolName,
      installed: isValid,
      version: tool.getVersion()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Tool validation failed',
      message: error.message,
      installed: false
    });
  }
});

router.put('/:toolName/enable', validateToolName, (req, res) => {
  const { toolName } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'enabled must be a boolean'
    });
  }

  try {
    const tool = getTool(toolName);

    if (!tool) {
      return res.status(404).json({
        error: 'Tool not found',
        toolName
      });
    }

    tool.setEnabled(enabled);
    setToolEnabled(toolName, enabled);

    res.json({
      success: true,
      toolName,
      enabled: tool.isEnabled()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update tool status',
      message: error.message
    });
  }
});

router.get('/config/global', (req, res) => {
  res.json({
    success: true,
    config: {
      ollama: config.ollama,
      network: {
        defaultRange: config.network.defaultRange
      },
      scan: config.scan,
      fetch: config.fetch
    }
  });
});

router.put('/config/global', (req, res) => {
  const updates = req.body;

  try {
    if (updates.defaultModel) {
      config.ollama.defaultModel = updates.defaultModel;
    }

    if (updates.defaultNetwork) {
      config.network.defaultRange = updates.defaultNetwork;
    }

    if (updates.rateLimitSeconds) {
      config.scan.rateLimitSeconds = parseInt(updates.rateLimitSeconds);
    }

    res.json({
      success: true,
      message: 'Configuration updated',
      config: {
        ollama: config.ollama,
        network: {
          defaultRange: config.network.defaultRange
        },
        scan: config.scan
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error.message
    });
  }
});

module.exports = router;
