class ResultAggregator {
  constructor() {
    this.results = {};
  }

  aggregate(toolResults) {
    const aggregated = {
      hosts: new Map(),
      metadata: {
        tools: [],
        timestamp: new Date().toISOString(),
        totalHosts: 0
      }
    };

    for (const [toolName, toolData] of Object.entries(toolResults)) {
      aggregated.metadata.tools.push(toolName);

      if (!toolData || !toolData.hosts) {
        console.warn(`Tool ${toolName} returned no host data`);
        continue;
      }

      for (const host of toolData.hosts) {
        const ip = host.ip;
        
        if (!aggregated.hosts.has(ip)) {
          aggregated.hosts.set(ip, {
            ip,
            hostname: host.hostname || null,
            os: host.os || null,
            ports: [],
            services: [],
            vulnerabilities: [],
            credentials: [],
            toolData: {}
          });
        }

        const aggregatedHost = aggregated.hosts.get(ip);

        aggregatedHost.hostname = aggregatedHost.hostname || host.hostname;
        aggregatedHost.os = aggregatedHost.os || host.os;

        if (host.ports) {
          for (const port of host.ports) {
            const existingPort = aggregatedHost.ports.find(
              p => p.port === port.port && p.protocol === port.protocol
            );

            if (existingPort) {
              existingPort.sources = existingPort.sources || [existingPort.tool];
              if (!existingPort.sources.includes(toolName)) {
                existingPort.sources.push(toolName);
              }
              
              if (port.state === 'open' && existingPort.state !== 'open') {
                existingPort.state = port.state;
              }
              
              existingPort.service = existingPort.service || port.service;
              existingPort.product = existingPort.product || port.product;
              existingPort.version = existingPort.version || port.version;
            } else {
              aggregatedHost.ports.push({
                ...port,
                tool: toolName,
                sources: [toolName]
              });
            }
          }
        }

        if (host.vulnerabilities) {
          aggregatedHost.vulnerabilities.push(...host.vulnerabilities.map(v => ({
            ...v,
            tool: toolName
          })));
        }

        if (host.credentials) {
          aggregatedHost.credentials.push(...host.credentials.map(c => ({
            ...c,
            tool: toolName
          })));
        }

        aggregatedHost.toolData[toolName] = {
          timestamp: toolData.timestamp,
          rawData: host
        };
      }
    }

    aggregated.metadata.totalHosts = aggregated.hosts.size;

    const hostsArray = Array.from(aggregated.hosts.values());
    
    hostsArray.forEach(host => {
      host.ports.sort((a, b) => a.port - b.port);
      
      host.riskScore = this.calculateRiskScore(host);
      host.riskLevel = this.getRiskLevel(host.riskScore);
    });

    return {
      hosts: hostsArray,
      metadata: aggregated.metadata,
      summary: this.generateSummary(hostsArray)
    };
  }

  calculateRiskScore(host) {
    let score = 0;

    const openPorts = host.ports.filter(p => p.state === 'open').length;
    score += openPorts * 5;

    const criticalServices = ['telnet', 'ftp', 'smb', 'rdp', 'vnc'];
    const hasCriticalService = host.ports.some(p => 
      criticalServices.includes(p.service?.toLowerCase())
    );
    if (hasCriticalService) score += 30;

    score += host.vulnerabilities.length * 20;

    score += host.credentials.length * 50;

    const hasOldSoftware = host.ports.some(p => {
      if (!p.version) return false;
      const versionMatch = p.version.match(/\d+/);
      return versionMatch && parseInt(versionMatch[0]) < 5;
    });
    if (hasOldSoftware) score += 15;

    return Math.min(score, 100);
  }

  getRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  generateSummary(hosts) {
    const totalHosts = hosts.length;
    const totalOpenPorts = hosts.reduce((sum, host) => 
      sum + host.ports.filter(p => p.state === 'open').length, 0
    );
    const totalVulnerabilities = hosts.reduce((sum, host) => 
      sum + host.vulnerabilities.length, 0
    );
    const totalCredentials = hosts.reduce((sum, host) => 
      sum + host.credentials.length, 0
    );

    const riskDistribution = {
      high: hosts.filter(h => h.riskLevel === 'high').length,
      medium: hosts.filter(h => h.riskLevel === 'medium').length,
      low: hosts.filter(h => h.riskLevel === 'low').length
    };

    const topServices = {};
    hosts.forEach(host => {
      host.ports.forEach(port => {
        if (port.service) {
          topServices[port.service] = (topServices[port.service] || 0) + 1;
        }
      });
    });

    return {
      totalHosts,
      totalOpenPorts,
      totalVulnerabilities,
      totalCredentials,
      riskDistribution,
      topServices: Object.entries(topServices)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([service, count]) => ({ service, count }))
    };
  }

  mergeHostData(existing, newData) {
    return {
      ...existing,
      ...newData,
      ports: this.mergePorts(existing.ports || [], newData.ports || []),
      vulnerabilities: [...(existing.vulnerabilities || []), ...(newData.vulnerabilities || [])],
      credentials: [...(existing.credentials || []), ...(newData.credentials || [])]
    };
  }

  mergePorts(existingPorts, newPorts) {
    const portMap = new Map();

    existingPorts.forEach(port => {
      const key = `${port.port}-${port.protocol}`;
      portMap.set(key, port);
    });

    newPorts.forEach(port => {
      const key = `${port.port}-${port.protocol}`;
      if (portMap.has(key)) {
        const existing = portMap.get(key);
        portMap.set(key, { ...existing, ...port });
      } else {
        portMap.set(key, port);
      }
    });

    return Array.from(portMap.values());
  }
}

module.exports = ResultAggregator;
