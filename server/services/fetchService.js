const axios = require('axios');
const config = require('../config/config');

class FetchService {
  constructor() {
    this.timeout = config.fetch.timeout;
    this.httpPorts = config.fetch.ports.http;
    this.httpsPorts = config.fetch.ports.https;
    this.previewLength = config.fetch.previewLength;
  }

  async fetchHTTPData(hosts) {
    const results = [];

    for (const host of hosts) {
      const hostResult = {
        ip: host.ip,
        hostname: host.hostname,
        webData: []
      };

      const openPorts = host.ports.filter(p => p.state === 'open');

      for (const port of openPorts) {
        const portNumber = port.port;

        if (this.httpPorts.includes(portNumber)) {
          const data = await this.fetchFromPort(host.ip, portNumber, 'http');
          if (data) {
            hostResult.webData.push(data);
          }
        }

        if (this.httpsPorts.includes(portNumber)) {
          const data = await this.fetchFromPort(host.ip, portNumber, 'https');
          if (data) {
            hostResult.webData.push(data);
          }
        }
      }

      if (hostResult.webData.length > 0) {
        results.push(hostResult);
      }
    }

    return results;
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

  async enrichHostsWithWebData(hosts) {
    const webData = await this.fetchHTTPData(hosts);

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
