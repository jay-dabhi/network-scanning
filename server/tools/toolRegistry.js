const NmapTool = require('./nmap/NmapTool');
const config = require('../config/config');
const { getToolConfig } = require('../config/toolsConfig');

const toolRegistry = {};

function registerTool(name, ToolClass) {
  try {
    const toolConfig = getToolConfig(name);
    const tool = new ToolClass(toolConfig);
    toolRegistry[name] = tool;
    console.log(`Registered tool: ${name}`);
    return true;
  } catch (error) {
    console.error(`Failed to register tool ${name}:`, error.message);
    return false;
  }
}

function initializeTools() {
  registerTool('nmap', NmapTool);
  
  return toolRegistry;
}

async function validateAllTools() {
  const results = {};
  
  for (const [name, tool] of Object.entries(toolRegistry)) {
    try {
      const isValid = await tool.validate();
      results[name] = {
        valid: isValid,
        version: tool.getVersion(),
        enabled: tool.isEnabled()
      };
    } catch (error) {
      results[name] = {
        valid: false,
        error: error.message,
        enabled: tool.isEnabled()
      };
    }
  }
  
  return results;
}

function getTool(name) {
  return toolRegistry[name] || null;
}

function getAllTools() {
  return Object.keys(toolRegistry).map(name => {
    const tool = toolRegistry[name];
    return {
      name: tool.getName(),
      version: tool.getVersion(),
      enabled: tool.isEnabled(),
      status: tool.status
    };
  });
}

function getEnabledTools() {
  return Object.entries(toolRegistry)
    .filter(([_, tool]) => tool.isEnabled())
    .map(([name, tool]) => ({
      name: tool.getName(),
      version: tool.getVersion()
    }));
}

module.exports = {
  toolRegistry,
  registerTool,
  initializeTools,
  validateAllTools,
  getTool,
  getAllTools,
  getEnabledTools
};
