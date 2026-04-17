const toolsConfig = {
  nmap: {
    enabled: true,
    timeout: 3600000,
    priority: 1,
    commands: {
      discover: 'nmap -sn {range} -oG -',
      scan: 'nmap -iL {targets} -p- -sS -sV -O -T4 -oX {output}'
    },
    sudo: true,
    dependencies: []
  },

  hydra: {
    enabled: false,
    timeout: 7200000,
    priority: 2,
    commands: {
      bruteforce: 'hydra -L {userlist} -P {passlist} {protocol}://{target}:{port}'
    },
    sudo: false,
    dependencies: ['nmap'],
    wordlists: {
      users: process.env.HYDRA_USERLIST || '/usr/share/wordlists/users.txt',
      passwords: process.env.HYDRA_PASSLIST || '/usr/share/wordlists/passwords.txt'
    }
  },

  nikto: {
    enabled: false,
    timeout: 1800000,
    priority: 3,
    commands: {
      scan: 'nikto -h {target} -p {port} -Format json -output {output}'
    },
    sudo: false,
    dependencies: ['nmap']
  }
};

function getEnabledTools() {
  return Object.entries(toolsConfig)
    .filter(([_, config]) => config.enabled)
    .map(([name, config]) => ({ name, ...config }));
}

function getToolConfig(toolName) {
  return toolsConfig[toolName] || null;
}

function setToolEnabled(toolName, enabled) {
  if (toolsConfig[toolName]) {
    toolsConfig[toolName].enabled = enabled;
    return true;
  }
  return false;
}

function updateToolConfig(toolName, updates) {
  if (toolsConfig[toolName]) {
    toolsConfig[toolName] = {
      ...toolsConfig[toolName],
      ...updates
    };
    return toolsConfig[toolName];
  }
  return null;
}

function checkDependencies(toolName) {
  const config = toolsConfig[toolName];
  if (!config) return { valid: false, missing: [] };

  const missing = config.dependencies.filter(dep => {
    const depConfig = toolsConfig[dep];
    return !depConfig || !depConfig.enabled;
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

module.exports = {
  toolsConfig,
  getEnabledTools,
  getToolConfig,
  setToolEnabled,
  updateToolConfig,
  checkDependencies
};
