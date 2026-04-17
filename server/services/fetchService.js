const axios = require('axios');
const config = require('../config/config');

class FetchService {
  constructor() {
    this.timeout = config.fetch.timeout;
    this.httpPorts = config.fetch.ports.http;
    this.httpsPorts = config.fetch.ports.https;
    this.previewLength = config.fetch.previewLength;
  }

  async fetchHTTPData(hosts, progressCallback = null) {
    const results = [];
    const totalHosts = hosts.filter(h => h.ports.some(p => p.state === 'open')).length;
    let processedHosts = 0;

    for (const host of hosts) {
      const hostResult = {
        ip: host.ip,
        hostname: host.hostname,
        webData: []
      };

      const openPorts = host.ports.filter(p => p.state === 'open');

      for (const port of openPorts) {
        const portNumber = port.port;
        const protocol = this.detectWebProtocol(port);

        if (protocol) {
          const data = await this.fetchFromPort(host.ip, portNumber, protocol);
          if (data) {
            hostResult.webData.push(data);
          }
        }
      }

      if (hostResult.webData.length > 0) {
        results.push(hostResult);
      }

      if (openPorts.length > 0) {
        processedHosts++;
        if (progressCallback && totalHosts > 0) {
          progressCallback(processedHosts, totalHosts);
        }
      }
    }

    return results;
  }

  detectWebProtocol(port) {
    const service = port.service?.toLowerCase() || '';
    const portNumber = port.port;

    if (service.includes('https') || service.includes('ssl') || service.includes('tls')) {
      return 'https';
    }

    if (service === 'http' || service.includes('http-proxy') || service.includes('http-alt')) {
      return 'http';
    }

    if (this.httpsPorts.includes(portNumber)) {
      return 'https';
    }

    if (this.httpPorts.includes(portNumber)) {
      return 'http';
    }

    return null;
  }

  async fetchFromPort(ip, port, protocol) {
    const url = `${protocol}://${ip}:${port}`;

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        maxRedirects: config.fetch.maxRedirects,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'PentestAutomation/1.0'
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      const contentType = response.headers['content-type'] || '';
      
      let data = {
        port,
        protocol,
        url,
        status: response.status,
        statusText: response.statusText,
        headers: this.sanitizeHeaders(response.headers),
        contentType,
        timestamp: new Date().toISOString()
      };

      if (contentType.includes('application/json')) {
        try {
          data.json = typeof response.data === 'string' 
            ? JSON.parse(response.data) 
            : response.data;
          data.preview = JSON.stringify(data.json, null, 2).substring(0, this.previewLength);
        } catch (e) {
          data.preview = String(response.data).substring(0, this.previewLength);
        }
      } else if (contentType.includes('text/html')) {
        const htmlContent = String(response.data);
        data.html = htmlContent;
        data.preview = this.extractTextFromHTML(htmlContent).substring(0, this.previewLength);
        data.title = this.extractTitle(htmlContent);
      } else {
        data.preview = String(response.data).substring(0, this.previewLength);
      }

      return data;

    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return null;
      }

      return {
        port,
        protocol,
        url,
        error: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      };
    }
  }

  sanitizeHeaders(headers) {
    const sanitized = {};
    const relevantHeaders = [
      'server',
      'content-type',
      'content-length',
      'x-powered-by',
      'set-cookie',
      'location',
      'www-authenticate'
    ];

    for (const key of relevantHeaders) {
      if (headers[key]) {
        sanitized[key] = headers[key];
      }
    }

    return sanitized;
  }

  extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : null;
  }

  extractTextFromHTML(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async enrichHostsWithWebData(hosts, progressCallback = null) {
    const webData = await this.fetchHTTPData(hosts, progressCallback);

    const enrichedHosts = hosts.map(host => {
      const hostWebData = webData.find(w => w.ip === host.ip);
      
      return {
        ...host,
        webData: hostWebData ? hostWebData.webData : []
      };
    });

    return enrichedHosts;
  }
}

module.exports = new FetchService();
