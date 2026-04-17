const fs = require('fs').promises;
const xml2js = require('xml2js');

class NmapParser {
  static async parse(scanResult, outputDir) {
    try {
      const xmlContent = await fs.readFile(scanResult.outputFile, 'utf-8');
      
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true
      });

      const result = await parser.parseStringPromise(xmlContent);
      
      return this.transformToUnifiedFormat(result, scanResult);
    } catch (error) {
      console.error('Error parsing Nmap XML:', error);
      throw new Error(`Failed to parse Nmap results: ${error.message}`);
    }
  }

  static transformToUnifiedFormat(xmlData, scanResult) {
    const nmaprun = xmlData.nmaprun;
    const hosts = [];

    let hostArray = nmaprun.host;
    if (!hostArray) {
      return {
        tool: 'nmap',
        timestamp: new Date().toISOString(),
        hosts: [],
        scanInfo: this.extractScanInfo(nmaprun)
      };
    }

    if (!Array.isArray(hostArray)) {
      hostArray = [hostArray];
    }

    for (const host of hostArray) {
      if (host.status && host.status.state !== 'up') {
        continue;
      }

      const hostData = {
        ip: this.extractIP(host),
        hostname: this.extractHostname(host),
        os: this.extractOS(host),
        ports: this.extractPorts(host),
        hostnames: this.extractAllHostnames(host),
        macAddress: this.extractMacAddress(host),
        uptime: this.extractUptime(host)
      };

      hosts.push(hostData);
    }

    return {
      tool: 'nmap',
      timestamp: new Date().toISOString(),
      hostsCount: scanResult.hostsCount,
      hosts,
      scanInfo: this.extractScanInfo(nmaprun)
    };
  }

  static extractIP(host) {
    if (!host.address) return null;
    
    const addresses = Array.isArray(host.address) ? host.address : [host.address];
    const ipv4 = addresses.find(addr => addr.addrtype === 'ipv4');
    
    return ipv4 ? ipv4.addr : null;
  }

  static extractHostname(host) {
    if (!host.hostnames || !host.hostnames.hostname) {
      return null;
    }

    const hostnames = Array.isArray(host.hostnames.hostname) 
      ? host.hostnames.hostname 
      : [host.hostnames.hostname];

    return hostnames.length > 0 ? hostnames[0].name : null;
  }

  static extractAllHostnames(host) {
    if (!host.hostnames || !host.hostnames.hostname) {
      return [];
    }

    const hostnames = Array.isArray(host.hostnames.hostname) 
      ? host.hostnames.hostname 
      : [host.hostnames.hostname];

    return hostnames.map(h => ({
      name: h.name,
      type: h.type
    }));
  }

  static extractMacAddress(host) {
    if (!host.address) return null;
    
    const addresses = Array.isArray(host.address) ? host.address : [host.address];
    const mac = addresses.find(addr => addr.addrtype === 'mac');
    
    return mac ? {
      address: mac.addr,
      vendor: mac.vendor || null
    } : null;
  }

  static extractOS(host) {
    if (!host.os || !host.os.osmatch) {
      return null;
    }

    const osmatches = Array.isArray(host.os.osmatch) 
      ? host.os.osmatch 
      : [host.os.osmatch];

    if (osmatches.length === 0) return null;

    const bestMatch = osmatches[0];
    return {
      name: bestMatch.name,
      accuracy: parseInt(bestMatch.accuracy) || 0,
      type: bestMatch.osclass ? bestMatch.osclass.type : null,
      vendor: bestMatch.osclass ? bestMatch.osclass.vendor : null,
      family: bestMatch.osclass ? bestMatch.osclass.osfamily : null
    };
  }

  static extractUptime(host) {
    if (!host.uptime) return null;

    return {
      seconds: parseInt(host.uptime.seconds) || 0,
      lastboot: host.uptime.lastboot || null
    };
  }

  static extractPorts(host) {
    if (!host.ports || !host.ports.port) {
      return [];
    }

    let portArray = host.ports.port;
    if (!Array.isArray(portArray)) {
      portArray = [portArray];
    }

    return portArray.map(port => {
      const service = port.service || {};
      
      return {
        port: parseInt(port.portid),
        protocol: port.protocol,
        state: port.state ? port.state.state : 'unknown',
        reason: port.state ? port.state.reason : null,
        service: service.name || null,
        product: service.product || null,
        version: service.version || null,
        extraInfo: service.extrainfo || null,
        osType: service.ostype || null,
        method: service.method || null,
        confidence: service.conf ? parseInt(service.conf) : null
      };
    });
  }

  static extractScanInfo(nmaprun) {
    return {
      nmapVersion: nmaprun.version,
      arguments: nmaprun.args,
      startTime: nmaprun.start,
      endTime: nmaprun.runstats ? nmaprun.runstats.finished.time : null,
      summary: nmaprun.runstats ? nmaprun.runstats.finished.summary : null
    };
  }
}

module.exports = NmapParser;
