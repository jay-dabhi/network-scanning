const axios = require('axios');
const config = require('../config/config');

class OllamaService {
  constructor() {
    this.endpoint = config.ollama.endpoint;
    this.defaultModel = config.ollama.defaultModel;
    this.timeout = config.ollama.timeout;
  }

  async analyzeHost(host, model = null) {
    const prompt = this.buildAnalysisPrompt(host);
    
    try {
      const response = await this.generate(prompt, model);
      return this.parseAnalysisResponse(response, host);
    } catch (error) {
      console.error(`Error analyzing host ${host.ip}:`, error.message);
      return this.createFallbackAnalysis(host);
    }
  }

  async analyzeAllHosts(hosts, model = null, progressCallback = null) {
    const results = [];
    const totalHosts = hosts.length;

    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i];
      const analysis = await this.analyzeHost(host, model);
      results.push({
        ip: host.ip,
        analysis
      });

      if (progressCallback) {
        progressCallback(i + 1, totalHosts);
      }
    }

    return results;
  }

  buildAnalysisPrompt(host) {
    const portsInfo = host.ports
      .filter(p => p.state === 'open')
      .map(p => `  - Port ${p.port}/${p.protocol}: ${p.service || 'unknown'} ${p.product || ''} ${p.version || ''}`)
      .join('\n');

    const webInfo = host.webData && host.webData.length > 0
      ? '\n\nWeb Services:\n' + host.webData.map(w => 
          `  - ${w.url} (Status: ${w.status}, Server: ${w.headers?.server || 'unknown'})`
        ).join('\n')
      : '';

    const vulnInfo = host.vulnerabilities && host.vulnerabilities.length > 0
      ? '\n\nKnown Vulnerabilities:\n' + host.vulnerabilities.map(v => `  - ${v.name || v.description}`).join('\n')
      : '';

    return `You are a cybersecurity analyst. Analyze this host and provide a security assessment.

Host Information:
- IP: ${host.ip}
- Hostname: ${host.hostname || 'unknown'}
- OS: ${host.os ? host.os.name : 'unknown'}

Open Ports:
${portsInfo}${webInfo}${vulnInfo}

Provide a structured analysis with the following format:
{
  "riskLevel": "high|medium|low",
  "riskScore": 0-100,
  "summary": "Brief overall security assessment",
  "findings": [
    {
      "category": "category name",
      "severity": "high|medium|low",
      "description": "finding description",
      "recommendation": "how to fix"
    }
  ],
  "portAnalysis": [
    {
      "port": port_number,
      "risk": "high|medium|low",
      "notes": "security notes about this port"
    }
  ],
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2"
  ]
}

Respond ONLY with valid JSON, no additional text.`;
  }

  async generate(prompt, model = null) {
    const requestBody = {
      model: model || this.defaultModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9
      }
    };

    try {
      const response = await axios.post(
        `${this.endpoint}/api/generate`,
        requestBody,
        {
          timeout: 0,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.response;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama service.');
      }
      throw error;
    }
  }

  parseAnalysisResponse(response, host) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          timestamp: new Date().toISOString(),
          model: this.defaultModel
        };
      }
    } catch (error) {
      console.error('Failed to parse JSON response, using text fallback');
    }

    return {
      riskLevel: this.estimateRiskLevel(host),
      riskScore: host.riskScore || 50,
      summary: response.substring(0, 500),
      findings: [],
      portAnalysis: [],
      recommendations: this.extractRecommendations(response),
      rawResponse: response,
      timestamp: new Date().toISOString(),
      model: this.defaultModel
    };
  }

  createFallbackAnalysis(host) {
    const openPortsCount = host.ports.filter(p => p.state === 'open').length;
    const hasVulnerabilities = host.vulnerabilities && host.vulnerabilities.length > 0;
    const hasCriticalServices = host.ports.some(p => 
      ['telnet', 'ftp', 'smb'].includes(p.service?.toLowerCase())
    );

    let riskLevel = 'low';
    let riskScore = 30;

    if (hasVulnerabilities || hasCriticalServices) {
      riskLevel = 'high';
      riskScore = 80;
    } else if (openPortsCount > 10) {
      riskLevel = 'medium';
      riskScore = 60;
    }

    return {
      riskLevel,
      riskScore,
      summary: `Host has ${openPortsCount} open ports. ${hasCriticalServices ? 'Critical services detected.' : ''} ${hasVulnerabilities ? 'Known vulnerabilities found.' : ''}`,
      findings: [],
      portAnalysis: host.ports.filter(p => p.state === 'open').map(p => ({
        port: p.port,
        risk: this.assessPortRisk(p),
        notes: `${p.service || 'unknown service'} running on port ${p.port}`
      })),
      recommendations: [
        'Review all open ports and close unnecessary services',
        'Update software to latest versions',
        'Implement firewall rules',
        'Enable security monitoring'
      ],
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }

  estimateRiskLevel(host) {
    if (host.riskLevel) return host.riskLevel;
    if (host.riskScore >= 70) return 'high';
    if (host.riskScore >= 40) return 'medium';
    return 'low';
  }

  assessPortRisk(port) {
    const highRiskServices = ['telnet', 'ftp', 'smb', 'rdp', 'vnc'];
    const mediumRiskServices = ['ssh', 'mysql', 'postgresql', 'mongodb'];

    if (highRiskServices.includes(port.service?.toLowerCase())) {
      return 'high';
    }
    if (mediumRiskServices.includes(port.service?.toLowerCase())) {
      return 'medium';
    }
    return 'low';
  }

  extractRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[-*•]\s/) || line.toLowerCase().includes('recommend')) {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (clean.length > 10) {
          recommendations.push(clean);
        }
      }
    }

    return recommendations.slice(0, 5);
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.endpoint}/api/tags`, {
        timeout: 5000
      });
      return {
        connected: true,
        models: response.data.models || []
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new OllamaService();
